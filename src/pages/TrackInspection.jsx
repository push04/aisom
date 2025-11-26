import React, { useState, useRef, useEffect } from 'react'
import MediaCapture from '../components/MediaCapture'
import { detectCracks, analyzeCrackPattern } from '../utils/imageProcessing'
import { MotionDetector, ParticleDetector } from '../utils/motionDetection'

const TRACK_STANDARDS = {
  gauge: { nominal: 1676, tolerance: { plus: 6, minus: 6 } },
  crossLevel: { max: 10 },
  twist: { max: 2.5 },
  alignment: { max: 5 },
  unevenness: { max: 3.5 }
}

function TrackInspection() {
  const [image, setImage] = useState(null)
  const [imageData, setImageData] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [inspectionType, setInspectionType] = useState('visual')
  const [motionData, setMotionData] = useState(null)
  const [particleData, setParticleData] = useState(null)
  const canvasRef = useRef(null)
  const motionDetectorRef = useRef(new MotionDetector())
  const particleDetectorRef = useRef(new ParticleDetector())

  const handleMediaCapture = (captureData) => {
    setError(null)
    setAnalysis(null)
    
    const img = new Image()
    img.onload = () => {
      setImage(img)
      setImageData(captureData.dataUrl)
      analyzeTrack(img, captureData.dataUrl, captureData.source === 'live')
    }
    img.onerror = () => setError('Failed to load captured image')
    img.src = captureData.dataUrl
  }

  const analyzeTrack = async (img, base64Data, isLive = false) => {
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

      if (isLive) {
        const motion = motionDetectorRef.current.detectMotion(imageDataObj)
        setMotionData(motion)
        
        const particles = particleDetectorRef.current.detectParticles(imageDataObj)
        setParticleData(particles)
      }

      const defectDetection = detectCracks(imageDataObj, 'medium')
      
      if (defectDetection.processedImageData) {
        ctx.putImageData(defectDetection.processedImageData, 0, 0)
      }

      const pattern = analyzeCrackPattern(defectDetection.crackMap, width, height)

      const defectPercentage = ((defectDetection.crackPixels / defectDetection.totalPixels) * 100).toFixed(2)
      
      const gaugeStatus = evaluateGauge(defectPercentage)
      const railCondition = evaluateRailCondition(defectDetection.crackPixels, pattern)
      const speedRestriction = calculateSpeedRestriction(defectPercentage, railCondition)

      const analysisResult = {
        defectPercentage,
        gaugeStatus,
        railCondition,
        speedRestriction,
        pattern: pattern.patternType,
        orientation: pattern.orientation,
        pixelsAnalyzed: defectDetection.totalPixels,
        defectPixels: defectDetection.crackPixels,
        timestamp: new Date().toISOString(),
        recommendations: generateRecommendations(railCondition, defectPercentage)
      }

      setAnalysis(analysisResult)

      const analyses = JSON.parse(localStorage.getItem('recentAnalyses') || '[]')
      analyses.unshift({
        type: 'track',
        title: 'Track Inspection Scan',
        timestamp: new Date().toISOString(),
        data: { defectPercentage, railCondition }
      })
      localStorage.setItem('recentAnalyses', JSON.stringify(analyses.slice(0, 50)))

    } catch (err) {
      console.error('Track analysis error:', err)
      setError(`Analysis failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const evaluateGauge = (defectPercentage) => {
    if (defectPercentage < 1) return { status: 'Normal', value: TRACK_STANDARDS.gauge.nominal }
    if (defectPercentage < 3) return { status: 'Marginal', value: TRACK_STANDARDS.gauge.nominal + 2 }
    return { status: 'Critical', value: TRACK_STANDARDS.gauge.nominal + 5 }
  }

  const evaluateRailCondition = (defectPixels, pattern) => {
    if (defectPixels < 1000) return 'Good'
    if (defectPixels < 5000) return 'Fair'
    if (defectPixels < 15000) return 'Poor'
    return 'Critical'
  }

  const calculateSpeedRestriction = (defectPercentage, condition) => {
    if (condition === 'Good') return { speed: 130, unit: 'km/h', restricted: false }
    if (condition === 'Fair') return { speed: 100, unit: 'km/h', restricted: true }
    if (condition === 'Poor') return { speed: 60, unit: 'km/h', restricted: true }
    return { speed: 30, unit: 'km/h', restricted: true }
  }

  const generateRecommendations = (condition, defectPercentage) => {
    const recs = []
    if (condition === 'Critical') {
      recs.push('Immediate track closure and repair required')
      recs.push('Deploy maintenance crew within 24 hours')
      recs.push('Implement speed restriction of 30 km/h until repaired')
    } else if (condition === 'Poor') {
      recs.push('Schedule priority maintenance within 7 days')
      recs.push('Monitor daily until repairs completed')
      recs.push('Apply temporary speed restriction')
    } else if (condition === 'Fair') {
      recs.push('Include in next scheduled maintenance cycle')
      recs.push('Increase inspection frequency to weekly')
    } else {
      recs.push('Continue routine inspection schedule')
      recs.push('Document baseline measurements')
    }
    return recs
  }

  return (
    <div className="min-h-screen bg-black p-6 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="module-header">
          <div>
            <h1 className="module-title">Track Inspection System</h1>
            <p className="module-subtitle">Rail geometry, gauge, and alignment analysis per RDSO standards</p>
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
              <h2 className="text-lg font-bold text-white">Image Capture</h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="rail-label">Inspection Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['visual', 'gauge', 'alignment'].map(type => (
                    <button
                      key={type}
                      onClick={() => setInspectionType(type)}
                      className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                        inspectionType === type
                          ? 'bg-white text-black'
                          : 'bg-primary-800 text-primary-400 hover:bg-primary-700'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <MediaCapture 
                onCapture={handleMediaCapture}
                mode="both"
                label="Capture Track Image"
              />

              {imageData && (
                <div className="mt-4 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-primary-400 uppercase tracking-wide mb-2">Original Image</h3>
                    <div className="camera-frame">
                      <img src={imageData} alt="Original" className="w-full rounded" />
                    </div>
                  </div>
                  {image && (
                    <div>
                      <h3 className="text-sm font-medium text-primary-400 uppercase tracking-wide mb-2">Defect Detection Overlay</h3>
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
              <h2 className="text-lg font-bold text-white">Analysis Results</h2>
            </div>
            <div className="p-6 max-h-[800px] overflow-y-auto">
              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-2 border-white border-t-transparent mx-auto"></div>
                  <p className="mt-4 text-primary-400">Analyzing track condition...</p>
                </div>
              )}

              {analysis && !loading && (
                <div className="space-y-4">
                  <div className={`p-6 rounded-lg border ${
                    analysis.railCondition === 'Good' ? 'border-white/30 bg-primary-900' :
                    analysis.railCondition === 'Fair' ? 'border-primary-500 bg-primary-900' :
                    'border-primary-400 bg-primary-900'
                  }`}>
                    <div className="text-xs uppercase tracking-wider text-primary-500 mb-1">Track Condition</div>
                    <div className="text-4xl font-bold text-white">{analysis.railCondition}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="info-item">
                      <div className="info-value">{analysis.defectPercentage}%</div>
                      <div className="info-label">Defect Coverage</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.speedRestriction.speed}</div>
                      <div className="info-label">Max Speed (km/h)</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.gaugeStatus.value}</div>
                      <div className="info-label">Gauge (mm)</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.pattern}</div>
                      <div className="info-label">Pattern Type</div>
                    </div>
                  </div>

                  {analysis.speedRestriction.restricted && (
                    <div className="p-4 bg-primary-900 border border-primary-600 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-medium text-white">Speed Restriction Active</span>
                      </div>
                      <p className="text-sm text-primary-400">
                        Maximum permissible speed: {analysis.speedRestriction.speed} {analysis.speedRestriction.unit}
                      </p>
                    </div>
                  )}

                  {motionData && (
                    <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-700">
                      <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Motion Analysis
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-primary-500">Status:</span>
                          <span className={`ml-2 font-medium ${motionData.hasMotion ? 'text-primary-300' : 'text-white'}`}>
                            {motionData.hasMotion ? 'Motion Detected' : 'Stable'}
                          </span>
                        </div>
                        <div>
                          <span className="text-primary-500">Motion %:</span>
                          <span className="ml-2 font-mono text-white">{motionData.motionPercentage}%</span>
                        </div>
                      </div>
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

                  <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-700">
                    <h3 className="font-medium text-white mb-3">Analysis Metrics</h3>
                    <div className="space-y-2 text-sm font-mono">
                      <div className="flex justify-between">
                        <span className="text-primary-500">Pixels Analyzed:</span>
                        <span className="text-white">{analysis.pixelsAnalyzed.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-primary-500">Defect Pixels:</span>
                        <span className="text-white">{analysis.defectPixels.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-primary-500">Scan Time:</span>
                        <span className="text-white">{new Date(analysis.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!analysis && !loading && (
                <div className="text-center py-12">
                  <svg className="w-20 h-20 mx-auto mb-4 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <p className="text-primary-500 mb-2">No analysis data</p>
                  <p className="text-sm text-primary-600">Capture a track image to begin inspection</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 rail-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">RDSO Track Standards Reference</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
              <div className="text-2xl font-bold text-white">{TRACK_STANDARDS.gauge.nominal}</div>
              <div className="text-xs text-primary-500 uppercase">Gauge (mm)</div>
              <div className="text-xs text-primary-600 mt-1">+{TRACK_STANDARDS.gauge.tolerance.plus}/-{TRACK_STANDARDS.gauge.tolerance.minus}</div>
            </div>
            <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
              <div className="text-2xl font-bold text-white">{TRACK_STANDARDS.crossLevel.max}</div>
              <div className="text-xs text-primary-500 uppercase">Cross Level (mm)</div>
              <div className="text-xs text-primary-600 mt-1">Max deviation</div>
            </div>
            <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
              <div className="text-2xl font-bold text-white">{TRACK_STANDARDS.twist.max}</div>
              <div className="text-xs text-primary-500 uppercase">Twist (mm/m)</div>
              <div className="text-xs text-primary-600 mt-1">Max rate</div>
            </div>
            <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
              <div className="text-2xl font-bold text-white">{TRACK_STANDARDS.alignment.max}</div>
              <div className="text-xs text-primary-500 uppercase">Alignment (mm)</div>
              <div className="text-xs text-primary-600 mt-1">Max deviation</div>
            </div>
            <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
              <div className="text-2xl font-bold text-white">{TRACK_STANDARDS.unevenness.max}</div>
              <div className="text-xs text-primary-500 uppercase">Unevenness (mm)</div>
              <div className="text-xs text-primary-600 mt-1">Peak value</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrackInspection
