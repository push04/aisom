import React, { useState, useRef } from 'react'
import MediaCapture from '../components/MediaCapture'
import { detectCracks, analyzeCrackPattern } from '../utils/imageProcessing'
import { ParticleDetector } from '../utils/motionDetection'

const WHEEL_SPECS = {
  diameter: { new: 1092, worn: 889, unit: 'mm' },
  flange: { height: { min: 25, max: 36 }, thickness: { min: 22, max: 33 }, unit: 'mm' },
  tread: { width: 135, unit: 'mm' },
  qR: { min: 6.5, max: 13, unit: 'mm' }
}

const WEAR_LIMITS = {
  hollow: { warning: 2, condemning: 4, unit: 'mm' },
  flange: { warning: 28, condemning: 25, unit: 'mm height' },
  flat: { warning: 50, condemning: 60, unit: 'mm length' }
}

function WheelProfile() {
  const [image, setImage] = useState(null)
  const [imageData, setImageData] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [wheelType, setWheelType] = useState('locomotive')
  const canvasRef = useRef(null)
  const particleDetectorRef = useRef(new ParticleDetector())

  const handleMediaCapture = (captureData) => {
    setError(null)
    setAnalysis(null)
    
    const img = new Image()
    img.onload = () => {
      setImage(img)
      setImageData(captureData.dataUrl)
      analyzeWheel(img, captureData.dataUrl)
    }
    img.onerror = () => setError('Failed to load captured image')
    img.src = captureData.dataUrl
  }

  const analyzeWheel = async (img, base64Data) => {
    setLoading(true)
    setError(null)

    try {
      const canvas = canvasRef.current
      if (!canvas) throw new Error('Canvas not available')

      const ctx = canvas.getContext('2d')
      const maxWidth = 1200
      const maxHeight = 900
      let width = img.width
      let height = img.height

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.floor(width * ratio)
        height = Math.floor(height * ratio)
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      const imageDataObj = ctx.getImageData(0, 0, width, height)
      const particles = particleDetectorRef.current.detectParticles(imageDataObj)
      const defectDetection = detectCracks(imageDataObj, 'high')
      const pattern = analyzeCrackPattern(defectDetection.crackMap, width, height)

      if (defectDetection.processedImageData) {
        ctx.putImageData(defectDetection.processedImageData, 0, 0)
      }

      const profileAnalysis = analyzeWheelProfile(defectDetection, particles, pattern)
      const flangeAnalysis = analyzeFlangeCondition(defectDetection.crackPixels)
      const treadAnalysis = analyzeTreadCondition(defectDetection, particles)
      const wearEstimate = estimateWearLevel(profileAnalysis, flangeAnalysis, treadAnalysis)

      const analysisResult = {
        profileAnalysis,
        flangeAnalysis,
        treadAnalysis,
        wearEstimate,
        overallCondition: determineOverallCondition(wearEstimate),
        estimatedDiameter: estimateDiameter(wearEstimate),
        remainingLife: estimateRemainingLife(wearEstimate),
        recommendations: generateWheelRecommendations(profileAnalysis, flangeAnalysis, wearEstimate),
        timestamp: new Date().toISOString()
      }

      setAnalysis(analysisResult)

      const analyses = JSON.parse(localStorage.getItem('recentAnalyses') || '[]')
      analyses.unshift({
        type: 'wheel',
        title: 'Wheel Profile Scan',
        timestamp: new Date().toISOString(),
        data: { condition: analysisResult.overallCondition, wearLevel: wearEstimate.level }
      })
      localStorage.setItem('recentAnalyses', JSON.stringify(analyses.slice(0, 50)))

    } catch (err) {
      console.error('Wheel analysis error:', err)
      setError(`Analysis failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const analyzeWheelProfile = (defects, particles, pattern) => {
    const defectDensity = defects.crackPixels / defects.totalPixels * 100
    
    let hollowWear = 0
    if (defectDensity > 2) hollowWear = 1
    if (defectDensity > 5) hollowWear = 2
    if (defectDensity > 10) hollowWear = 4
    
    return {
      hollowWear,
      defectDensity: defectDensity.toFixed(3),
      pattern: pattern.patternType,
      status: hollowWear < WEAR_LIMITS.hollow.warning ? 'Good' : 
              hollowWear < WEAR_LIMITS.hollow.condemning ? 'Warning' : 'Condemning'
    }
  }

  const analyzeFlangeCondition = (defectPixels) => {
    let estimatedHeight = 30
    if (defectPixels > 5000) estimatedHeight = 28
    if (defectPixels > 10000) estimatedHeight = 26
    if (defectPixels > 20000) estimatedHeight = 24
    
    return {
      estimatedHeight,
      status: estimatedHeight > WEAR_LIMITS.flange.warning ? 'Good' :
              estimatedHeight > WEAR_LIMITS.flange.condemning ? 'Warning' : 'Condemning'
    }
  }

  const analyzeTreadCondition = (defects, particles) => {
    const hasFlat = particles.particleCount > 200
    const flatLength = hasFlat ? Math.min(particles.particleCount / 5, 80) : 0
    
    return {
      hasFlat,
      estimatedFlatLength: flatLength.toFixed(0),
      surfaceQuality: particles.particleCount < 50 ? 'Smooth' : 
                      particles.particleCount < 150 ? 'Moderate' : 'Rough',
      status: !hasFlat ? 'Good' :
              flatLength < WEAR_LIMITS.flat.warning ? 'Warning' : 'Condemning'
    }
  }

  const estimateWearLevel = (profile, flange, tread) => {
    let wearScore = 0
    
    if (profile.status === 'Warning') wearScore += 30
    if (profile.status === 'Condemning') wearScore += 60
    if (flange.status === 'Warning') wearScore += 25
    if (flange.status === 'Condemning') wearScore += 50
    if (tread.status === 'Warning') wearScore += 20
    if (tread.status === 'Condemning') wearScore += 40
    
    let level = 'Minimal'
    if (wearScore > 80) level = 'Severe'
    else if (wearScore > 50) level = 'Moderate'
    else if (wearScore > 20) level = 'Light'
    
    return { level, score: wearScore }
  }

  const determineOverallCondition = (wearEstimate) => {
    if (wearEstimate.score > 80) return 'Replace'
    if (wearEstimate.score > 50) return 'Re-profile'
    if (wearEstimate.score > 20) return 'Monitor'
    return 'Serviceable'
  }

  const estimateDiameter = (wearEstimate) => {
    const wornAmount = (wearEstimate.score / 100) * (WHEEL_SPECS.diameter.new - WHEEL_SPECS.diameter.worn)
    return (WHEEL_SPECS.diameter.new - wornAmount).toFixed(0)
  }

  const estimateRemainingLife = (wearEstimate) => {
    if (wearEstimate.score > 80) return '< 10,000 km'
    if (wearEstimate.score > 50) return '10,000 - 50,000 km'
    if (wearEstimate.score > 20) return '50,000 - 100,000 km'
    return '> 100,000 km'
  }

  const generateWheelRecommendations = (profile, flange, wearEstimate) => {
    const recs = []
    
    if (wearEstimate.score > 80) {
      recs.push('Wheel replacement required immediately')
      recs.push('Do not return to service until replaced')
    } else if (wearEstimate.score > 50) {
      recs.push('Schedule wheel re-profiling within 2 weeks')
      recs.push('Reduce operating speed until maintenance')
    }
    
    if (profile.status === 'Warning' || profile.status === 'Condemning') {
      recs.push('Hollow wear detected - check for alignment issues')
    }
    
    if (flange.status === 'Warning' || flange.status === 'Condemning') {
      recs.push('Flange wear approaching limits - verify gauge settings')
    }
    
    if (recs.length === 0) {
      recs.push('Wheel within serviceable limits')
      recs.push('Continue normal inspection schedule')
    }
    
    return recs
  }

  return (
    <div className="min-h-screen bg-black p-6 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="module-header">
          <div>
            <h1 className="module-title">Wheel Profile Analyzer</h1>
            <p className="module-subtitle">Tread wear, flange condition, and profile geometry assessment</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="status-indicator online" />
            <span className="text-xs text-primary-500">ACTIVE</span>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-primary-900 border border-primary-600 rounded-lg">
            <p className="font-medium text-white">Error</p>
            <p className="text-sm text-primary-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rail-card">
            <div className="p-6 border-b border-primary-800">
              <h2 className="text-lg font-bold text-white">Wheel Capture</h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="rail-label">Wheel Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['locomotive', 'coach', 'wagon'].map(type => (
                    <button
                      key={type}
                      onClick={() => setWheelType(type)}
                      className={`py-2 px-3 rounded-lg font-medium text-sm transition-all capitalize ${
                        wheelType === type
                          ? 'bg-white text-black'
                          : 'bg-primary-800 text-primary-400 hover:bg-primary-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <MediaCapture 
                onCapture={handleMediaCapture}
                mode="both"
                label="Capture Wheel Image"
              />

              {imageData && (
                <div className="mt-4 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-primary-400 uppercase tracking-wide mb-2">Captured Image</h3>
                    <div className="camera-frame">
                      <img src={imageData} alt="Original" className="w-full rounded" />
                    </div>
                  </div>
                  {image && (
                    <div>
                      <h3 className="text-sm font-medium text-primary-400 uppercase tracking-wide mb-2">Defect Overlay</h3>
                      <div className="camera-frame">
                        <canvas ref={canvasRef} className="w-full rounded" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="rail-card">
            <div className="p-6 border-b border-primary-800">
              <h2 className="text-lg font-bold text-white">Profile Analysis</h2>
            </div>
            <div className="p-6 max-h-[800px] overflow-y-auto">
              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-2 border-white border-t-transparent mx-auto"></div>
                  <p className="mt-4 text-primary-400">Analyzing wheel profile...</p>
                </div>
              )}

              {analysis && !loading && (
                <div className="space-y-4">
                  <div className={`p-6 rounded-lg border ${
                    analysis.overallCondition === 'Serviceable' ? 'border-white/30 bg-primary-900' :
                    analysis.overallCondition === 'Monitor' ? 'border-primary-500 bg-primary-900' :
                    'border-primary-400 bg-primary-900'
                  }`}>
                    <div className="text-xs uppercase tracking-wider text-primary-500 mb-1">Overall Condition</div>
                    <div className="text-4xl font-bold text-white">{analysis.overallCondition}</div>
                    <div className="text-sm text-primary-400 mt-1">Wear Level: {analysis.wearEstimate.level}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="info-item">
                      <div className="info-value">{analysis.estimatedDiameter}</div>
                      <div className="info-label">Est. Diameter (mm)</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.remainingLife}</div>
                      <div className="info-label">Est. Life</div>
                    </div>
                  </div>

                  <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-700">
                    <h3 className="font-medium text-white mb-3">Component Analysis</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 bg-primary-800/50 rounded">
                        <span className="text-sm text-primary-400">Profile/Hollow Wear</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          analysis.profileAnalysis.status === 'Good' ? 'bg-white/20 text-white' :
                          analysis.profileAnalysis.status === 'Warning' ? 'bg-primary-700 text-white' :
                          'bg-primary-600 text-white'
                        }`}>
                          {analysis.profileAnalysis.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-primary-800/50 rounded">
                        <span className="text-sm text-primary-400">Flange Condition</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          analysis.flangeAnalysis.status === 'Good' ? 'bg-white/20 text-white' :
                          analysis.flangeAnalysis.status === 'Warning' ? 'bg-primary-700 text-white' :
                          'bg-primary-600 text-white'
                        }`}>
                          {analysis.flangeAnalysis.status} ({analysis.flangeAnalysis.estimatedHeight}mm)
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-primary-800/50 rounded">
                        <span className="text-sm text-primary-400">Tread Surface</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          analysis.treadAnalysis.status === 'Good' ? 'bg-white/20 text-white' :
                          analysis.treadAnalysis.status === 'Warning' ? 'bg-primary-700 text-white' :
                          'bg-primary-600 text-white'
                        }`}>
                          {analysis.treadAnalysis.surfaceQuality}
                        </span>
                      </div>
                    </div>
                  </div>

                  {analysis.treadAnalysis.hasFlat && (
                    <div className="p-4 bg-primary-900 border border-primary-600 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-medium text-white">Wheel Flat Detected</span>
                      </div>
                      <p className="text-sm text-primary-400">
                        Estimated flat length: {analysis.treadAnalysis.estimatedFlatLength} mm
                      </p>
                    </div>
                  )}

                  <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-700">
                    <h3 className="font-medium text-white mb-3">Recommendations</h3>
                    <ul className="space-y-2">
                      {analysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-primary-400">
                          <span className="text-white mt-1">-</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {!analysis && !loading && (
                <div className="text-center py-12">
                  <svg className="w-20 h-20 mx-auto mb-4 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-primary-500 mb-2">No profile data</p>
                  <p className="text-sm text-primary-600">Capture a wheel image to begin analysis</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 rail-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Wheel Wear Limits (RDSO)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
              <div className="text-sm text-primary-400 mb-2">Hollow Wear</div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-primary-500">Warning:</span>
                  <span className="text-white">{WEAR_LIMITS.hollow.warning} mm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-primary-500">Condemning:</span>
                  <span className="text-primary-300">{WEAR_LIMITS.hollow.condemning} mm</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
              <div className="text-sm text-primary-400 mb-2">Flange Height</div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-primary-500">Warning:</span>
                  <span className="text-white">{WEAR_LIMITS.flange.warning} mm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-primary-500">Condemning:</span>
                  <span className="text-primary-300">{WEAR_LIMITS.flange.condemning} mm</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
              <div className="text-sm text-primary-400 mb-2">Wheel Flat</div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-primary-500">Warning:</span>
                  <span className="text-white">{WEAR_LIMITS.flat.warning} mm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-primary-500">Condemning:</span>
                  <span className="text-primary-300">{WEAR_LIMITS.flat.condemning} mm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WheelProfile
