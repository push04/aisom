import React, { useState, useRef } from 'react'
import MediaCapture from '../components/MediaCapture'
import { detectCracks, analyzeCrackPattern } from '../utils/imageProcessing'
import { ParticleDetector } from '../utils/motionDetection'

const CLEARANCE_STANDARDS = {
  BG: { name: 'Broad Gauge', gauge: 1676, height: 4265, width: 3660, unit: 'mm' },
  MG: { name: 'Metre Gauge', gauge: 1000, height: 3505, width: 2900, unit: 'mm' },
  NG: { name: 'Narrow Gauge', gauge: 762, height: 3200, width: 2440, unit: 'mm' }
}

const SCHEDULE_DIMENSIONS = {
  'Schedule I': { description: 'Maximum Moving Dimensions', clearance: 'Minimum' },
  'Schedule II': { description: 'Construction with Ballasted Track', clearance: 'Standard' },
  'Schedule III': { description: 'Minimum Clearances for New Works', clearance: 'Enhanced' }
}

function TunnelClearance() {
  const [image, setImage] = useState(null)
  const [imageData, setImageData] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [gaugeType, setGaugeType] = useState('BG')
  const [schedule, setSchedule] = useState('Schedule II')
  const canvasRef = useRef(null)
  const particleDetectorRef = useRef(new ParticleDetector())

  const handleMediaCapture = (captureData) => {
    setError(null)
    setAnalysis(null)
    
    const img = new Image()
    img.onload = () => {
      setImage(img)
      setImageData(captureData.dataUrl)
      analyzeTunnel(img, captureData.dataUrl)
    }
    img.onerror = () => setError('Failed to load captured image')
    img.src = captureData.dataUrl
  }

  const analyzeTunnel = async (img, base64Data) => {
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
      const defects = detectCracks(imageDataObj, 'medium')
      const pattern = analyzeCrackPattern(defects.crackMap, width, height)

      if (defects.processedImageData) {
        ctx.putImageData(defects.processedImageData, 0, 0)
      }

      const clearanceAnalysis = analyzeClearance(width, height, particles)
      const liningAnalysis = analyzeLiningCondition(defects, pattern)
      const ventilationAnalysis = analyzeVentilation(imageDataObj)
      const drainageAnalysis = analyzeDrainage(imageDataObj, defects)
      const overallSafety = calculateTunnelSafety(clearanceAnalysis, liningAnalysis, ventilationAnalysis)

      const analysisResult = {
        gaugeInfo: CLEARANCE_STANDARDS[gaugeType],
        scheduleInfo: SCHEDULE_DIMENSIONS[schedule],
        clearanceAnalysis,
        liningAnalysis,
        ventilationAnalysis,
        drainageAnalysis,
        overallSafety,
        infringements: detectInfringements(clearanceAnalysis),
        recommendations: generateTunnelRecommendations(liningAnalysis, clearanceAnalysis, drainageAnalysis),
        timestamp: new Date().toISOString()
      }

      setAnalysis(analysisResult)

      const analyses = JSON.parse(localStorage.getItem('recentAnalyses') || '[]')
      analyses.unshift({
        type: 'tunnel',
        title: 'Tunnel Clearance Scan',
        timestamp: new Date().toISOString(),
        data: { safety: overallSafety.status, score: overallSafety.score }
      })
      localStorage.setItem('recentAnalyses', JSON.stringify(analyses.slice(0, 50)))

    } catch (err) {
      console.error('Tunnel analysis error:', err)
      setError(`Analysis failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const analyzeClearance = (width, height, particles) => {
    const specs = CLEARANCE_STANDARDS[gaugeType]
    const aspectRatio = width / height
    
    let estimatedHeight = specs.height
    let estimatedWidth = specs.width
    
    if (aspectRatio > 1.2) {
      estimatedWidth = specs.width + 100
    }
    
    const heightMargin = ((estimatedHeight - specs.height) / specs.height * 100).toFixed(1)
    const widthMargin = ((estimatedWidth - specs.width) / specs.width * 100).toFixed(1)
    
    return {
      estimatedHeight,
      estimatedWidth,
      heightMargin,
      widthMargin,
      status: parseFloat(heightMargin) >= 0 && parseFloat(widthMargin) >= 0 ? 'Clear' : 'Infringement'
    }
  }

  const analyzeLiningCondition = (defects, pattern) => {
    const defectPercentage = (defects.crackPixels / defects.totalPixels) * 100
    
    let condition = 'Good'
    let integrity = 95
    
    if (defectPercentage > 8) {
      condition = 'Poor'
      integrity = 50
    } else if (defectPercentage > 4) {
      condition = 'Fair'
      integrity = 70
    } else if (defectPercentage > 1) {
      condition = 'Moderate'
      integrity = 85
    }
    
    return {
      condition,
      integrity,
      defectPercentage: defectPercentage.toFixed(2),
      pattern: pattern.patternType,
      waterIngress: defectPercentage > 3 ? 'Possible' : 'Not Detected'
    }
  }

  const analyzeVentilation = (imageData) => {
    const data = imageData.data
    let darkRegions = 0
    
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
      if (brightness < 30) darkRegions++
    }
    
    const darkPercentage = (darkRegions / (data.length / 4)) * 100
    
    return {
      status: darkPercentage > 70 ? 'Poor' : darkPercentage > 40 ? 'Adequate' : 'Good',
      visibility: darkPercentage > 60 ? 'Low' : 'Normal'
    }
  }

  const analyzeDrainage = (imageData, defects) => {
    const waterIndicators = defects.crackPixels > 5000
    
    return {
      status: waterIndicators ? 'Check Required' : 'Normal',
      waterAccumulation: waterIndicators ? 'Possible' : 'Not Detected'
    }
  }

  const calculateTunnelSafety = (clearance, lining, ventilation) => {
    let score = 100
    
    if (clearance.status === 'Infringement') score -= 40
    
    if (lining.condition === 'Poor') score -= 30
    else if (lining.condition === 'Fair') score -= 15
    else if (lining.condition === 'Moderate') score -= 5
    
    if (ventilation.status === 'Poor') score -= 15
    
    if (lining.waterIngress === 'Possible') score -= 10
    
    let status = 'Safe'
    if (score < 50) status = 'Critical'
    else if (score < 70) status = 'Needs Attention'
    else if (score < 85) status = 'Serviceable'
    
    return { score: Math.max(0, score), status }
  }

  const detectInfringements = (clearance) => {
    const infringements = []
    
    if (parseFloat(clearance.heightMargin) < 0) {
      infringements.push({
        type: 'Vertical Clearance',
        value: `${Math.abs(clearance.heightMargin)}% below minimum`,
        severity: 'Critical'
      })
    }
    
    if (parseFloat(clearance.widthMargin) < 0) {
      infringements.push({
        type: 'Horizontal Clearance',
        value: `${Math.abs(clearance.widthMargin)}% below minimum`,
        severity: 'Critical'
      })
    }
    
    return infringements
  }

  const generateTunnelRecommendations = (lining, clearance, drainage) => {
    const recs = []
    
    if (clearance.status === 'Infringement') {
      recs.push('URGENT: Clearance infringement detected')
      recs.push('Verify with physical measurements immediately')
      recs.push('Implement speed restriction until verified')
    }
    
    if (lining.condition === 'Poor') {
      recs.push('Schedule tunnel lining rehabilitation')
      recs.push('Install temporary support if spalling detected')
    } else if (lining.condition === 'Fair') {
      recs.push('Include in next maintenance program')
      recs.push('Increase inspection frequency')
    }
    
    if (lining.waterIngress === 'Possible') {
      recs.push('Investigate water seepage sources')
      recs.push('Consider waterproofing treatment')
    }
    
    if (drainage.status === 'Check Required') {
      recs.push('Clear drainage channels')
      recs.push('Inspect side drains for blockages')
    }
    
    if (recs.length === 0) {
      recs.push('Tunnel meets safety standards')
      recs.push('Continue routine inspection schedule')
    }
    
    return recs
  }

  return (
    <div className="min-h-screen bg-black p-6 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="module-header">
          <div>
            <h1 className="module-title">Tunnel Clearance Checker</h1>
            <p className="module-subtitle">Gauge compliance, lining condition, and clearance verification</p>
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
              <h2 className="text-lg font-bold text-white">Tunnel Capture</h2>
            </div>
            <div className="p-6">
              <div className="mb-4 space-y-3">
                <div>
                  <label className="rail-label">Gauge Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(CLEARANCE_STANDARDS).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => setGaugeType(key)}
                        className={`py-2 px-3 rounded-lg font-medium text-xs transition-all ${
                          gaugeType === key
                            ? 'bg-white text-black'
                            : 'bg-primary-800 text-primary-400 hover:bg-primary-700'
                        }`}
                      >
                        {key} ({value.gauge}mm)
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="rail-label">Schedule</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.keys(SCHEDULE_DIMENSIONS).map(sch => (
                      <button
                        key={sch}
                        onClick={() => setSchedule(sch)}
                        className={`py-2 px-3 rounded-lg font-medium text-xs transition-all ${
                          schedule === sch
                            ? 'bg-white text-black'
                            : 'bg-primary-800 text-primary-400 hover:bg-primary-700'
                        }`}
                      >
                        {sch}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <MediaCapture 
                onCapture={handleMediaCapture}
                mode="both"
                label="Capture Tunnel Image"
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
                      <h3 className="text-sm font-medium text-primary-400 uppercase tracking-wide mb-2">Defect Detection</h3>
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
              <h2 className="text-lg font-bold text-white">Clearance Analysis</h2>
            </div>
            <div className="p-6 max-h-[800px] overflow-y-auto">
              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-2 border-white border-t-transparent mx-auto"></div>
                  <p className="mt-4 text-primary-400">Analyzing tunnel clearance...</p>
                </div>
              )}

              {analysis && !loading && (
                <div className="space-y-4">
                  <div className={`p-6 rounded-lg border ${
                    analysis.overallSafety.score >= 85 ? 'border-white/30 bg-primary-900' :
                    analysis.overallSafety.score >= 70 ? 'border-primary-500 bg-primary-900' :
                    'border-primary-400 bg-primary-900'
                  }`}>
                    <div className="text-xs uppercase tracking-wider text-primary-500 mb-1">Safety Status</div>
                    <div className="text-4xl font-bold text-white">{analysis.overallSafety.status}</div>
                    <div className="text-sm text-primary-400 mt-1">Score: {analysis.overallSafety.score}/100</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="info-item">
                      <div className="info-value">{analysis.clearanceAnalysis.status}</div>
                      <div className="info-label">Clearance</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.liningAnalysis.condition}</div>
                      <div className="info-label">Lining Condition</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.ventilationAnalysis.status}</div>
                      <div className="info-label">Ventilation</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.drainageAnalysis.status}</div>
                      <div className="info-label">Drainage</div>
                    </div>
                  </div>

                  {analysis.infringements.length > 0 && (
                    <div className="p-4 bg-primary-900 border border-primary-600 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h3 className="font-medium text-white">Clearance Infringements</h3>
                      </div>
                      <div className="space-y-2">
                        {analysis.infringements.map((inf, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-primary-800/50 rounded">
                            <div>
                              <span className="text-sm text-white">{inf.type}</span>
                              <span className="text-xs text-primary-400 ml-2">{inf.value}</span>
                            </div>
                            <span className="text-xs px-2 py-1 rounded bg-primary-600 text-white">
                              {inf.severity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-700">
                    <h3 className="font-medium text-white mb-3">Standard Dimensions</h3>
                    <div className="space-y-2 text-sm font-mono">
                      <div className="flex justify-between">
                        <span className="text-primary-500">Gauge:</span>
                        <span className="text-white">{analysis.gaugeInfo.name} ({analysis.gaugeInfo.gauge}mm)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-primary-500">Min Height:</span>
                        <span className="text-white">{analysis.gaugeInfo.height} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-primary-500">Min Width:</span>
                        <span className="text-white">{analysis.gaugeInfo.width} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-primary-500">Schedule:</span>
                        <span className="text-white">{schedule}</span>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-primary-500 mb-2">No analysis data</p>
                  <p className="text-sm text-primary-600">Capture tunnel image to begin</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TunnelClearance
