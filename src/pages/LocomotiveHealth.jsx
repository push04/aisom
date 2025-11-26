import React, { useState, useRef } from 'react'
import MediaCapture from '../components/MediaCapture'
import { detectCracks, analyzeCrackPattern } from '../utils/imageProcessing'
import { ParticleDetector } from '../utils/motionDetection'

const THERMAL_THRESHOLDS = {
  normal: { min: 20, max: 80 },
  warning: { min: 80, max: 120 },
  critical: { min: 120, max: 200 }
}

const LOCOMOTIVE_COMPONENTS = [
  { id: 'engine', name: 'Diesel Engine', normalTemp: 85, criticalTemp: 120 },
  { id: 'traction', name: 'Traction Motor', normalTemp: 75, criticalTemp: 110 },
  { id: 'bearings', name: 'Axle Bearings', normalTemp: 50, criticalTemp: 85 },
  { id: 'brakes', name: 'Brake System', normalTemp: 60, criticalTemp: 200 },
  { id: 'compressor', name: 'Air Compressor', normalTemp: 70, criticalTemp: 100 },
  { id: 'alternator', name: 'Main Alternator', normalTemp: 80, criticalTemp: 115 }
]

function LocomotiveHealth() {
  const [image, setImage] = useState(null)
  const [imageData, setImageData] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedComponent, setSelectedComponent] = useState('engine')
  const [thermalAnalysis, setThermalAnalysis] = useState(null)
  const canvasRef = useRef(null)
  const particleDetectorRef = useRef(new ParticleDetector())

  const handleMediaCapture = (captureData) => {
    setError(null)
    setAnalysis(null)
    setThermalAnalysis(null)
    
    const img = new Image()
    img.onload = () => {
      setImage(img)
      setImageData(captureData.dataUrl)
      analyzeLocomotive(img, captureData.dataUrl)
    }
    img.onerror = () => setError('Failed to load captured image')
    img.src = captureData.dataUrl
  }

  const analyzeLocomotive = async (img, base64Data) => {
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

      const thermal = simulateThermalAnalysis(imageDataObj)
      setThermalAnalysis(thermal)

      const particles = particleDetectorRef.current.detectParticles(imageDataObj)

      const defectDetection = detectCracks(imageDataObj, 'medium')
      const pattern = analyzeCrackPattern(defectDetection.crackMap, width, height)

      if (defectDetection.processedImageData) {
        ctx.putImageData(defectDetection.processedImageData, 0, 0)
      }

      const defectPercentage = ((defectDetection.crackPixels / defectDetection.totalPixels) * 100).toFixed(2)
      
      const healthScore = calculateHealthScore(defectPercentage, thermal, particles)
      const maintenanceStatus = evaluateMaintenanceStatus(healthScore)
      const vibrationLevel = estimateVibrationLevel(particles)

      const analysisResult = {
        healthScore,
        maintenanceStatus,
        defectPercentage,
        vibrationLevel,
        thermalStatus: thermal.status,
        estimatedTemperature: thermal.estimatedTemp,
        particleCount: particles.particleCount,
        pattern: pattern.patternType,
        timestamp: new Date().toISOString(),
        recommendations: generateMaintenanceRecommendations(healthScore, thermal, vibrationLevel)
      }

      setAnalysis(analysisResult)

      const analyses = JSON.parse(localStorage.getItem('recentAnalyses') || '[]')
      analyses.unshift({
        type: 'locomotive',
        title: 'Locomotive Health Scan',
        timestamp: new Date().toISOString(),
        data: { healthScore, maintenanceStatus }
      })
      localStorage.setItem('recentAnalyses', JSON.stringify(analyses.slice(0, 50)))

    } catch (err) {
      console.error('Locomotive analysis error:', err)
      setError(`Analysis failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const simulateThermalAnalysis = (imageData) => {
    const data = imageData.data
    let totalRed = 0
    let hotPixels = 0
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      totalRed += r
      if (r > 150 && r > g && r > b) {
        hotPixels++
      }
    }
    
    const avgRed = totalRed / (data.length / 4)
    const hotPercentage = (hotPixels / (data.length / 4)) * 100
    
    const estimatedTemp = 20 + (avgRed / 255) * 100
    
    let status = 'Normal'
    if (estimatedTemp > THERMAL_THRESHOLDS.critical.min || hotPercentage > 10) {
      status = 'Critical'
    } else if (estimatedTemp > THERMAL_THRESHOLDS.warning.min || hotPercentage > 5) {
      status = 'Warning'
    }
    
    return {
      estimatedTemp: estimatedTemp.toFixed(1),
      hotPercentage: hotPercentage.toFixed(2),
      status,
      avgIntensity: avgRed.toFixed(1)
    }
  }

  const calculateHealthScore = (defectPercentage, thermal, particles) => {
    let score = 100
    
    score -= parseFloat(defectPercentage) * 5
    
    if (thermal.status === 'Warning') score -= 15
    if (thermal.status === 'Critical') score -= 30
    
    if (particles.particleCount > 100) score -= 10
    if (particles.particleCount > 500) score -= 20
    
    return Math.max(0, Math.min(100, score)).toFixed(1)
  }

  const evaluateMaintenanceStatus = (healthScore) => {
    if (healthScore >= 85) return { status: 'Operational', priority: 'Routine' }
    if (healthScore >= 70) return { status: 'Serviceable', priority: 'Scheduled' }
    if (healthScore >= 50) return { status: 'Degraded', priority: 'Priority' }
    return { status: 'Critical', priority: 'Immediate' }
  }

  const estimateVibrationLevel = (particles) => {
    if (particles.particleCount < 50) return { level: 'Low', value: 'Normal' }
    if (particles.particleCount < 200) return { level: 'Moderate', value: 'Elevated' }
    return { level: 'High', value: 'Excessive' }
  }

  const generateMaintenanceRecommendations = (healthScore, thermal, vibration) => {
    const recs = []
    
    if (healthScore < 50) {
      recs.push('Remove locomotive from service immediately')
      recs.push('Conduct comprehensive diagnostic inspection')
    }
    
    if (thermal.status === 'Critical') {
      recs.push('Check cooling system and radiator function')
      recs.push('Inspect lubricant levels and quality')
    } else if (thermal.status === 'Warning') {
      recs.push('Monitor temperature during next service run')
      recs.push('Schedule coolant system inspection')
    }
    
    if (vibration.level === 'High') {
      recs.push('Inspect bearing condition and alignment')
      recs.push('Check for loose components or mounts')
    }
    
    if (recs.length === 0) {
      recs.push('Continue normal operation schedule')
      recs.push('Maintain regular inspection intervals')
    }
    
    return recs
  }

  return (
    <div className="min-h-screen bg-black p-6 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="module-header">
          <div>
            <h1 className="module-title">Locomotive Health Scanner</h1>
            <p className="module-subtitle">Thermal analysis, vibration detection, and component diagnostics</p>
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
              <h2 className="text-lg font-bold text-white">Component Capture</h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="rail-label">Target Component</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {LOCOMOTIVE_COMPONENTS.map(comp => (
                    <button
                      key={comp.id}
                      onClick={() => setSelectedComponent(comp.id)}
                      className={`py-2 px-3 rounded-lg font-medium text-xs transition-all ${
                        selectedComponent === comp.id
                          ? 'bg-white text-black'
                          : 'bg-primary-800 text-primary-400 hover:bg-primary-700'
                      }`}
                    >
                      {comp.name}
                    </button>
                  ))}
                </div>
              </div>

              <MediaCapture 
                onCapture={handleMediaCapture}
                mode="both"
                label="Capture Component Image"
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
                      <h3 className="text-sm font-medium text-primary-400 uppercase tracking-wide mb-2">Thermal/Defect Overlay</h3>
                      <div className="camera-frame relative">
                        <canvas ref={canvasRef} className="w-full rounded" />
                        {thermalAnalysis && (
                          <div className="absolute top-2 right-2 bg-black/80 px-3 py-1 rounded-full">
                            <span className="text-white font-mono text-sm">{thermalAnalysis.estimatedTemp}C</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="rail-card">
            <div className="p-6 border-b border-primary-800">
              <h2 className="text-lg font-bold text-white">Diagnostic Results</h2>
            </div>
            <div className="p-6 max-h-[800px] overflow-y-auto">
              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-2 border-white border-t-transparent mx-auto"></div>
                  <p className="mt-4 text-primary-400">Running diagnostics...</p>
                </div>
              )}

              {analysis && !loading && (
                <div className="space-y-4">
                  <div className={`p-6 rounded-lg border ${
                    analysis.maintenanceStatus.status === 'Operational' ? 'border-white/30 bg-primary-900' :
                    analysis.maintenanceStatus.status === 'Serviceable' ? 'border-primary-500 bg-primary-900' :
                    'border-primary-400 bg-primary-900'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs uppercase tracking-wider text-primary-500">Health Score</div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        analysis.maintenanceStatus.priority === 'Routine' ? 'bg-white/20 text-white' :
                        analysis.maintenanceStatus.priority === 'Scheduled' ? 'bg-primary-700 text-white' :
                        'bg-primary-600 text-white'
                      }`}>
                        {analysis.maintenanceStatus.priority}
                      </div>
                    </div>
                    <div className="text-5xl font-bold text-white">{analysis.healthScore}%</div>
                    <div className="text-sm text-primary-400 mt-1">{analysis.maintenanceStatus.status}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="info-item">
                      <div className="info-value">{analysis.estimatedTemperature}C</div>
                      <div className="info-label">Temperature</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.thermalStatus}</div>
                      <div className="info-label">Thermal Status</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.vibrationLevel.level}</div>
                      <div className="info-label">Vibration</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.defectPercentage}%</div>
                      <div className="info-label">Surface Defects</div>
                    </div>
                  </div>

                  <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-700">
                    <h3 className="font-medium text-white mb-3">Maintenance Recommendations</h3>
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
                    <h3 className="font-medium text-white mb-3">Analysis Details</h3>
                    <div className="space-y-2 text-sm font-mono">
                      <div className="flex justify-between">
                        <span className="text-primary-500">Component:</span>
                        <span className="text-white">{LOCOMOTIVE_COMPONENTS.find(c => c.id === selectedComponent)?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-primary-500">Particle Count:</span>
                        <span className="text-white">{analysis.particleCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-primary-500">Pattern Type:</span>
                        <span className="text-white">{analysis.pattern}</span>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <p className="text-primary-500 mb-2">No diagnostic data</p>
                  <p className="text-sm text-primary-600">Capture a component image to begin analysis</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 rail-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Component Temperature Reference</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {LOCOMOTIVE_COMPONENTS.map(comp => (
              <div key={comp.id} className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
                <div className="text-sm font-medium text-white mb-2">{comp.name}</div>
                <div className="flex justify-between text-xs">
                  <span className="text-primary-500">Normal:</span>
                  <span className="text-white">{comp.normalTemp}C</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-primary-500">Critical:</span>
                  <span className="text-primary-400">{comp.criticalTemp}C</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LocomotiveHealth
