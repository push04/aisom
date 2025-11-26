import React, { useState, useRef, useEffect } from 'react'
import MediaCapture from '../components/MediaCapture'
import { MotionDetector, ParticleDetector, OpticalFlowDetector } from '../utils/motionDetection'
import { detectCracks } from '../utils/imageProcessing'

const PANTOGRAPH_SPECS = {
  contactForce: { min: 70, nominal: 90, max: 120, unit: 'N' },
  contactStrip: { width: 65, length: 1450, material: 'Carbon/Copper' },
  raisedHeight: { min: 4200, max: 5500, unit: 'mm' },
  maxSpeed: { value: 160, unit: 'km/h' }
}

const OHE_PARAMETERS = {
  wireHeight: { nominal: 5200, tolerance: 50, unit: 'mm' },
  stagger: { max: 300, unit: 'mm' },
  systemVoltage: { value: 25, unit: 'kV AC' },
  frequency: { value: 50, unit: 'Hz' }
}

function PantographMonitor() {
  const [image, setImage] = useState(null)
  const [imageData, setImageData] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [motionData, setMotionData] = useState(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const canvasRef = useRef(null)
  const motionDetectorRef = useRef(new MotionDetector())
  const particleDetectorRef = useRef(new ParticleDetector())
  const opticalFlowRef = useRef(new OpticalFlowDetector())
  const streamIntervalRef = useRef(null)

  const handleMediaCapture = (captureData) => {
    setError(null)
    setAnalysis(null)
    
    const img = new Image()
    img.onload = () => {
      setImage(img)
      setImageData(captureData.dataUrl)
      analyzePantograph(img, captureData.dataUrl, captureData.source === 'live')
    }
    img.onerror = () => setError('Failed to load captured image')
    img.src = captureData.dataUrl
  }

  const analyzePantograph = async (img, base64Data, isLive = false) => {
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
      }

      const particles = particleDetectorRef.current.detectParticles(imageDataObj)

      const defectDetection = detectCracks(imageDataObj, 'medium')

      if (defectDetection.processedImageData) {
        ctx.putImageData(defectDetection.processedImageData, 0, 0)
      }

      const arcingAnalysis = detectArcing(imageDataObj)
      const wearAnalysis = analyzeContactWear(defectDetection.crackPixels, particles)
      const contactQuality = evaluateContactQuality(arcingAnalysis, wearAnalysis)

      const analysisResult = {
        contactQuality,
        arcingDetected: arcingAnalysis.detected,
        arcingIntensity: arcingAnalysis.intensity,
        wearLevel: wearAnalysis.level,
        wearPercentage: wearAnalysis.percentage,
        estimatedLifeRemaining: wearAnalysis.lifeRemaining,
        motionStability: motionData?.hasMotion ? 'Unstable' : 'Stable',
        recommendations: generatePantographRecommendations(contactQuality, arcingAnalysis, wearAnalysis),
        timestamp: new Date().toISOString()
      }

      setAnalysis(analysisResult)

      const analyses = JSON.parse(localStorage.getItem('recentAnalyses') || '[]')
      analyses.unshift({
        type: 'pantograph',
        title: 'Pantograph Monitor Scan',
        timestamp: new Date().toISOString(),
        data: { contactQuality: contactQuality.status, arcingDetected: arcingAnalysis.detected }
      })
      localStorage.setItem('recentAnalyses', JSON.stringify(analyses.slice(0, 50)))

    } catch (err) {
      console.error('Pantograph analysis error:', err)
      setError(`Analysis failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const detectArcing = (imageData) => {
    const data = imageData.data
    let brightPixels = 0
    let totalBrightness = 0
    
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
      totalBrightness += brightness
      
      if (brightness > 230 && data[i] > 200 && data[i + 1] > 200) {
        brightPixels++
      }
    }
    
    const avgBrightness = totalBrightness / (data.length / 4)
    const brightPercentage = (brightPixels / (data.length / 4)) * 100
    
    return {
      detected: brightPercentage > 0.5,
      intensity: brightPercentage > 2 ? 'High' : brightPercentage > 0.5 ? 'Moderate' : 'Low',
      percentage: brightPercentage.toFixed(3)
    }
  }

  const analyzeContactWear = (crackPixels, particles) => {
    const wearScore = crackPixels / 100 + particles.particleCount
    
    let level = 'Minimal'
    let percentage = 10
    let lifeRemaining = '90%+'
    
    if (wearScore > 500) {
      level = 'Severe'
      percentage = 70
      lifeRemaining = '< 20%'
    } else if (wearScore > 200) {
      level = 'Moderate'
      percentage = 45
      lifeRemaining = '40-60%'
    } else if (wearScore > 50) {
      level = 'Light'
      percentage = 25
      lifeRemaining = '60-80%'
    }
    
    return { level, percentage, lifeRemaining, score: wearScore }
  }

  const evaluateContactQuality = (arcing, wear) => {
    if (arcing.intensity === 'High' || wear.level === 'Severe') {
      return { status: 'Poor', score: 30 }
    }
    if (arcing.intensity === 'Moderate' || wear.level === 'Moderate') {
      return { status: 'Fair', score: 60 }
    }
    if (wear.level === 'Light') {
      return { status: 'Good', score: 80 }
    }
    return { status: 'Excellent', score: 95 }
  }

  const generatePantographRecommendations = (contact, arcing, wear) => {
    const recs = []
    
    if (contact.score < 50) {
      recs.push('Schedule immediate pantograph inspection')
      recs.push('Consider replacing contact strip before next service run')
    }
    
    if (arcing.intensity === 'High') {
      recs.push('Check OHE wire tension and height')
      recs.push('Inspect pantograph contact force settings')
      recs.push('Verify lubricant on pantograph joints')
    }
    
    if (wear.level === 'Severe' || wear.level === 'Moderate') {
      recs.push('Measure contact strip thickness')
      recs.push('Schedule strip replacement within next maintenance cycle')
    }
    
    if (recs.length === 0) {
      recs.push('Contact quality within acceptable parameters')
      recs.push('Continue routine monitoring schedule')
    }
    
    return recs
  }

  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-black p-6 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="module-header">
          <div>
            <h1 className="module-title">Pantograph Monitoring System</h1>
            <p className="module-subtitle">Real-time OHE contact analysis, arcing detection, and wear monitoring</p>
          </div>
          <div className="flex items-center gap-4">
            {isStreaming && (
              <div className="live-indicator">LIVE</div>
            )}
            <div className="flex items-center gap-2">
              <div className="status-indicator online" />
              <span className="text-xs text-primary-500">ACTIVE</span>
            </div>
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
              <h2 className="text-lg font-bold text-white">Live Monitoring</h2>
            </div>
            <div className="p-6">
              <MediaCapture 
                onCapture={handleMediaCapture}
                mode="both"
                label="Capture Pantograph/OHE"
              />

              {imageData && (
                <div className="mt-4 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-primary-400 uppercase tracking-wide mb-2">Captured Frame</h3>
                    <div className="camera-frame relative">
                      <img src={imageData} alt="Original" className="w-full rounded" />
                      {motionData?.hasMotion && (
                        <div className="absolute top-2 left-2 bg-primary-800/90 px-3 py-1 rounded-full">
                          <span className="text-white text-xs">Motion Detected</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {image && (
                    <div>
                      <h3 className="text-sm font-medium text-primary-400 uppercase tracking-wide mb-2">Analysis Overlay</h3>
                      <div className="camera-frame">
                        <canvas ref={canvasRef} className="w-full rounded" />
                        <div className="scanner-overlay">
                          <div className="scanner-line"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="rail-card">
            <div className="p-6 border-b border-primary-800">
              <h2 className="text-lg font-bold text-white">Contact Analysis</h2>
            </div>
            <div className="p-6 max-h-[800px] overflow-y-auto">
              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-2 border-white border-t-transparent mx-auto"></div>
                  <p className="mt-4 text-primary-400">Analyzing contact quality...</p>
                </div>
              )}

              {analysis && !loading && (
                <div className="space-y-4">
                  <div className={`p-6 rounded-lg border ${
                    analysis.contactQuality.status === 'Excellent' ? 'border-white/30 bg-primary-900' :
                    analysis.contactQuality.status === 'Good' ? 'border-white/20 bg-primary-900' :
                    analysis.contactQuality.status === 'Fair' ? 'border-primary-500 bg-primary-900' :
                    'border-primary-400 bg-primary-900'
                  }`}>
                    <div className="text-xs uppercase tracking-wider text-primary-500 mb-1">Contact Quality</div>
                    <div className="text-4xl font-bold text-white">{analysis.contactQuality.status}</div>
                    <div className="text-sm text-primary-400 mt-1">Score: {analysis.contactQuality.score}/100</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="info-item">
                      <div className={`info-value ${analysis.arcingDetected ? 'text-primary-300' : 'text-white'}`}>
                        {analysis.arcingDetected ? 'Yes' : 'No'}
                      </div>
                      <div className="info-label">Arcing Detected</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.arcingIntensity}</div>
                      <div className="info-label">Arc Intensity</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.wearLevel}</div>
                      <div className="info-label">Wear Level</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.estimatedLifeRemaining}</div>
                      <div className="info-label">Life Remaining</div>
                    </div>
                  </div>

                  {analysis.arcingDetected && (
                    <div className="p-4 bg-primary-900 border border-primary-600 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="font-medium text-white">Arcing Warning</span>
                      </div>
                      <p className="text-sm text-primary-400">
                        Electrical arcing detected between pantograph and OHE. Intensity: {analysis.arcingIntensity}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <p className="text-primary-500 mb-2">No monitoring data</p>
                  <p className="text-sm text-primary-600">Capture pantograph/OHE footage to begin analysis</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rail-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">Pantograph Specifications</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
                <div className="text-sm text-primary-400">Contact Force</div>
                <div className="text-xl font-bold text-white">{PANTOGRAPH_SPECS.contactForce.nominal} {PANTOGRAPH_SPECS.contactForce.unit}</div>
                <div className="text-xs text-primary-600 mt-1">Range: {PANTOGRAPH_SPECS.contactForce.min}-{PANTOGRAPH_SPECS.contactForce.max}</div>
              </div>
              <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
                <div className="text-sm text-primary-400">Raised Height</div>
                <div className="text-xl font-bold text-white">{PANTOGRAPH_SPECS.raisedHeight.min}-{PANTOGRAPH_SPECS.raisedHeight.max}</div>
                <div className="text-xs text-primary-600 mt-1">{PANTOGRAPH_SPECS.raisedHeight.unit}</div>
              </div>
              <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
                <div className="text-sm text-primary-400">Contact Strip</div>
                <div className="text-xl font-bold text-white">{PANTOGRAPH_SPECS.contactStrip.length} mm</div>
                <div className="text-xs text-primary-600 mt-1">{PANTOGRAPH_SPECS.contactStrip.material}</div>
              </div>
              <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
                <div className="text-sm text-primary-400">Max Speed</div>
                <div className="text-xl font-bold text-white">{PANTOGRAPH_SPECS.maxSpeed.value} {PANTOGRAPH_SPECS.maxSpeed.unit}</div>
              </div>
            </div>
          </div>

          <div className="rail-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">OHE Parameters</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
                <div className="text-sm text-primary-400">System Voltage</div>
                <div className="text-xl font-bold text-white">{OHE_PARAMETERS.systemVoltage.value} {OHE_PARAMETERS.systemVoltage.unit}</div>
                <div className="text-xs text-primary-600 mt-1">{OHE_PARAMETERS.frequency.value} {OHE_PARAMETERS.frequency.unit}</div>
              </div>
              <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
                <div className="text-sm text-primary-400">Wire Height</div>
                <div className="text-xl font-bold text-white">{OHE_PARAMETERS.wireHeight.nominal} {OHE_PARAMETERS.wireHeight.unit}</div>
                <div className="text-xs text-primary-600 mt-1">+/- {OHE_PARAMETERS.wireHeight.tolerance}</div>
              </div>
              <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-800 col-span-2">
                <div className="text-sm text-primary-400">Maximum Stagger</div>
                <div className="text-xl font-bold text-white">{OHE_PARAMETERS.stagger.max} {OHE_PARAMETERS.stagger.unit}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PantographMonitor
