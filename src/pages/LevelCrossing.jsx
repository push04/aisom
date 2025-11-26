import React, { useState, useRef } from 'react'
import MediaCapture from '../components/MediaCapture'
import { detectCracks } from '../utils/imageProcessing'
import { MotionDetector, ParticleDetector } from '../utils/motionDetection'

const LC_CLASSIFICATIONS = {
  A: { name: 'Special Class', description: 'Manned, TVU > 50,000', gates: 'Required' },
  B: { name: 'Class A', description: 'Manned, TVU 30,000-50,000', gates: 'Required' },
  C: { name: 'Class B', description: 'Manned, TVU < 30,000', gates: 'Required' },
  D: { name: 'Class C', description: 'Unmanned', gates: 'Not Required' }
}

const SAFETY_PARAMETERS = {
  roadWidth: { min: 3.5, max: 12, unit: 'm' },
  approachGradient: { max: 1, unit: 'in 20' },
  sightDistance: { min: 400, max: 1000, unit: 'm' },
  gateAngle: { closed: 90, open: 0, unit: 'degrees' }
}

function LevelCrossing() {
  const [image, setImage] = useState(null)
  const [imageData, setImageData] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lcType, setLcType] = useState('A')
  const [motionData, setMotionData] = useState(null)
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
      analyzeLevelCrossing(img, captureData.dataUrl, captureData.source === 'live')
    }
    img.onerror = () => setError('Failed to load captured image')
    img.src = captureData.dataUrl
  }

  const analyzeLevelCrossing = async (img, base64Data, isLive = false) => {
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
      const defects = detectCracks(imageDataObj, 'medium')

      if (defects.processedImageData) {
        ctx.putImageData(defects.processedImageData, 0, 0)
      }

      const gateAnalysis = analyzeGateCondition(particles, defects)
      const roadSurfaceAnalysis = analyzeRoadSurface(defects)
      const signalAnalysis = analyzeWarningSignals(imageDataObj)
      const visibilityAnalysis = analyzeVisibility(imageDataObj)
      const safetyScore = calculateSafetyScore(gateAnalysis, roadSurfaceAnalysis, signalAnalysis, visibilityAnalysis)

      const analysisResult = {
        lcInfo: LC_CLASSIFICATIONS[lcType],
        gateAnalysis,
        roadSurfaceAnalysis,
        signalAnalysis,
        visibilityAnalysis,
        safetyScore,
        overallStatus: getSafetyStatus(safetyScore),
        hazards: identifyHazards(gateAnalysis, roadSurfaceAnalysis, visibilityAnalysis),
        recommendations: generateLCRecommendations(safetyScore, gateAnalysis, roadSurfaceAnalysis),
        timestamp: new Date().toISOString()
      }

      setAnalysis(analysisResult)

      const analyses = JSON.parse(localStorage.getItem('recentAnalyses') || '[]')
      analyses.unshift({
        type: 'levelcrossing',
        title: 'Level Crossing Safety Scan',
        timestamp: new Date().toISOString(),
        data: { score: safetyScore, status: analysisResult.overallStatus }
      })
      localStorage.setItem('recentAnalyses', JSON.stringify(analyses.slice(0, 50)))

    } catch (err) {
      console.error('Level crossing analysis error:', err)
      setError(`Analysis failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const analyzeGateCondition = (particles, defects) => {
    const gateDefects = defects.crackPixels / defects.totalPixels * 100
    
    let condition = 'Good'
    let integrity = 95
    
    if (gateDefects > 5) {
      condition = 'Poor'
      integrity = 50
    } else if (gateDefects > 2) {
      condition = 'Fair'
      integrity = 75
    }
    
    return {
      condition,
      integrity,
      operationalStatus: integrity > 60 ? 'Operational' : 'Needs Repair'
    }
  }

  const analyzeRoadSurface = (defects) => {
    const surfaceDefects = (defects.crackPixels / defects.totalPixels) * 100
    
    let condition = 'Good'
    if (surfaceDefects > 10) condition = 'Poor'
    else if (surfaceDefects > 5) condition = 'Fair'
    
    return {
      condition,
      defectPercentage: surfaceDefects.toFixed(2),
      levelDifference: surfaceDefects > 5 ? 'Detected' : 'Not Detected'
    }
  }

  const analyzeWarningSignals = (imageData) => {
    const data = imageData.data
    let redPixels = 0
    let yellowPixels = 0
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      if (r > 180 && g < 100 && b < 100) redPixels++
      if (r > 180 && g > 150 && b < 100) yellowPixels++
    }
    
    const hasRedSignal = redPixels > 100
    const hasYellowSignal = yellowPixels > 100
    
    return {
      redSignalDetected: hasRedSignal,
      yellowSignalDetected: hasYellowSignal,
      signalStatus: hasRedSignal || hasYellowSignal ? 'Visible' : 'Check Required'
    }
  }

  const analyzeVisibility = (imageData) => {
    const data = imageData.data
    let totalBrightness = 0
    
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
      totalBrightness += brightness
    }
    
    const avgBrightness = totalBrightness / (data.length / 4)
    
    let visibility = 'Good'
    let score = 90
    
    if (avgBrightness < 50) {
      visibility = 'Poor'
      score = 40
    } else if (avgBrightness < 100) {
      visibility = 'Fair'
      score = 65
    }
    
    return {
      visibility,
      score,
      lightCondition: avgBrightness > 150 ? 'Daylight' : avgBrightness > 80 ? 'Dusk/Dawn' : 'Night'
    }
  }

  const calculateSafetyScore = (gate, road, signal, visibility) => {
    let score = 100
    
    if (gate.condition === 'Poor') score -= 25
    else if (gate.condition === 'Fair') score -= 15
    
    if (road.condition === 'Poor') score -= 20
    else if (road.condition === 'Fair') score -= 10
    
    if (signal.signalStatus === 'Check Required') score -= 15
    
    score -= (100 - visibility.score) * 0.3
    
    return Math.max(0, Math.round(score))
  }

  const getSafetyStatus = (score) => {
    if (score >= 80) return 'Safe'
    if (score >= 60) return 'Needs Attention'
    if (score >= 40) return 'Hazardous'
    return 'Critical'
  }

  const identifyHazards = (gate, road, visibility) => {
    const hazards = []
    
    if (gate.condition === 'Poor') {
      hazards.push({ type: 'Gate Defect', severity: 'High' })
    }
    if (road.condition === 'Poor') {
      hazards.push({ type: 'Road Surface Damage', severity: 'Medium' })
    }
    if (road.levelDifference === 'Detected') {
      hazards.push({ type: 'Level Difference at Crossing', severity: 'High' })
    }
    if (visibility.visibility === 'Poor') {
      hazards.push({ type: 'Poor Visibility', severity: 'High' })
    }
    
    return hazards
  }

  const generateLCRecommendations = (score, gate, road) => {
    const recs = []
    
    if (score < 60) {
      recs.push('Priority safety inspection required')
      recs.push('Consider implementing additional warning systems')
    }
    
    if (gate.condition !== 'Good') {
      recs.push('Schedule gate maintenance/replacement')
      recs.push('Verify gate mechanism operation')
    }
    
    if (road.condition !== 'Good') {
      recs.push('Repair road surface at crossing')
      recs.push('Ensure level transition with rail top')
    }
    
    if (recs.length === 0) {
      recs.push('Level crossing meets safety standards')
      recs.push('Continue routine inspection schedule')
    }
    
    return recs
  }

  return (
    <div className="min-h-screen bg-black p-6 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="module-header">
          <div>
            <h1 className="module-title">Level Crossing Safety Analyzer</h1>
            <p className="module-subtitle">Automated safety assessment for manned and unmanned level crossings</p>
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
              <h2 className="text-lg font-bold text-white">Level Crossing Capture</h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="rail-label">LC Classification</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(LC_CLASSIFICATIONS).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => setLcType(key)}
                      className={`py-2 px-3 rounded-lg font-medium text-xs transition-all ${
                        lcType === key
                          ? 'bg-white text-black'
                          : 'bg-primary-800 text-primary-400 hover:bg-primary-700'
                      }`}
                    >
                      {value.name}
                    </button>
                  ))}
                </div>
              </div>

              <MediaCapture 
                onCapture={handleMediaCapture}
                mode="both"
                label="Capture LC Image"
              />

              {imageData && (
                <div className="mt-4 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-primary-400 uppercase tracking-wide mb-2">Captured Image</h3>
                    <div className="camera-frame relative">
                      <img src={imageData} alt="Original" className="w-full rounded" />
                      {motionData?.hasMotion && (
                        <div className="absolute top-2 left-2 bg-primary-800/90 px-3 py-1 rounded-full">
                          <span className="text-white text-xs">Movement Detected</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {image && (
                    <div>
                      <h3 className="text-sm font-medium text-primary-400 uppercase tracking-wide mb-2">Safety Analysis</h3>
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
              <h2 className="text-lg font-bold text-white">Safety Assessment</h2>
            </div>
            <div className="p-6 max-h-[800px] overflow-y-auto">
              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-2 border-white border-t-transparent mx-auto"></div>
                  <p className="mt-4 text-primary-400">Analyzing safety parameters...</p>
                </div>
              )}

              {analysis && !loading && (
                <div className="space-y-4">
                  <div className={`p-6 rounded-lg border ${
                    analysis.safetyScore >= 80 ? 'border-white/30 bg-primary-900' :
                    analysis.safetyScore >= 60 ? 'border-primary-500 bg-primary-900' :
                    'border-primary-400 bg-primary-900'
                  }`}>
                    <div className="text-xs uppercase tracking-wider text-primary-500 mb-1">Safety Status</div>
                    <div className="text-4xl font-bold text-white">{analysis.overallStatus}</div>
                    <div className="text-sm text-primary-400 mt-1">Score: {analysis.safetyScore}/100</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="info-item">
                      <div className="info-value">{analysis.gateAnalysis.condition}</div>
                      <div className="info-label">Gate Condition</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.roadSurfaceAnalysis.condition}</div>
                      <div className="info-label">Road Surface</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.visibilityAnalysis.visibility}</div>
                      <div className="info-label">Visibility</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.signalAnalysis.signalStatus}</div>
                      <div className="info-label">Signals</div>
                    </div>
                  </div>

                  {analysis.hazards.length > 0 && (
                    <div className="p-4 bg-primary-900 border border-primary-600 rounded-lg">
                      <h3 className="font-medium text-white mb-3">Identified Hazards</h3>
                      <div className="space-y-2">
                        {analysis.hazards.map((hazard, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-primary-800/50 rounded">
                            <span className="text-sm text-white">{hazard.type}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              hazard.severity === 'High' ? 'bg-primary-600 text-white' :
                              'bg-primary-700 text-white'
                            }`}>
                              {hazard.severity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-700">
                    <h3 className="font-medium text-white mb-3">LC Information</h3>
                    <div className="space-y-2 text-sm font-mono">
                      <div className="flex justify-between">
                        <span className="text-primary-500">Classification:</span>
                        <span className="text-white">{analysis.lcInfo.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-primary-500">Description:</span>
                        <span className="text-white">{analysis.lcInfo.description}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-primary-500">Gates:</span>
                        <span className="text-white">{analysis.lcInfo.gates}</span>
                      </div>
                    </div>
                  </div>

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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-primary-500 mb-2">No analysis data</p>
                  <p className="text-sm text-primary-600">Capture level crossing image to begin</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LevelCrossing
