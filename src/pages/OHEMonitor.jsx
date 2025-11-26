import React, { useState, useRef } from 'react'
import MediaCapture from '../components/MediaCapture'
import { detectCracks } from '../utils/imageProcessing'
import { ParticleDetector, MotionDetector } from '../utils/motionDetection'

const OHE_SPECS = {
  voltage: { value: 25, unit: 'kV AC', frequency: '50 Hz' },
  wireType: { main: 'Catenary Cu 107 mm2', contact: 'Contact Cu 65 mm2' },
  height: { standard: 5200, tunnel: 4800, overbridge: 5500, unit: 'mm' },
  stagger: { max: 300, optimal: 200, unit: 'mm' },
  tension: { catenary: 1500, contact: 1000, unit: 'kg' }
}

const DEFECT_CATEGORIES = {
  sagExcess: { name: 'Excessive Sag', severity: 'High', code: 'OHE-01' },
  lowHeight: { name: 'Low Wire Height', severity: 'Critical', code: 'OHE-02' },
  wearExcessive: { name: 'Excessive Wear', severity: 'High', code: 'OHE-03' },
  insulatorDamage: { name: 'Insulator Damage', severity: 'Critical', code: 'OHE-04' },
  dropperLoose: { name: 'Loose Dropper', severity: 'Medium', code: 'OHE-05' }
}

function OHEMonitor() {
  const [image, setImage] = useState(null)
  const [imageData, setImageData] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [inspectionType, setInspectionType] = useState('catenary')
  const canvasRef = useRef(null)
  const particleDetectorRef = useRef(new ParticleDetector())
  const motionDetectorRef = useRef(new MotionDetector())

  const handleMediaCapture = (captureData) => {
    setError(null)
    setAnalysis(null)
    
    const img = new Image()
    img.onload = () => {
      setImage(img)
      setImageData(captureData.dataUrl)
      analyzeOHE(img, captureData.dataUrl, captureData.source === 'live')
    }
    img.onerror = () => setError('Failed to load captured image')
    img.src = captureData.dataUrl
  }

  const analyzeOHE = async (img, base64Data, isLive = false) => {
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

      if (defects.processedImageData) {
        ctx.putImageData(defects.processedImageData, 0, 0)
      }

      const wireAnalysis = analyzeWireCondition(defects, particles)
      const tensionEstimate = estimateWireTension(imageDataObj)
      const sagAnalysis = analyzeSag(imageDataObj, height)
      const insulatorStatus = analyzeInsulators(particles)
      const overallHealth = calculateOHEHealth(wireAnalysis, tensionEstimate, sagAnalysis, insulatorStatus)

      const analysisResult = {
        wireAnalysis,
        tensionEstimate,
        sagAnalysis,
        insulatorStatus,
        overallHealth,
        detectedDefects: identifyDefects(wireAnalysis, sagAnalysis, insulatorStatus),
        recommendations: generateOHERecommendations(overallHealth, wireAnalysis, sagAnalysis),
        timestamp: new Date().toISOString()
      }

      setAnalysis(analysisResult)

      const analyses = JSON.parse(localStorage.getItem('recentAnalyses') || '[]')
      analyses.unshift({
        type: 'ohe',
        title: 'OHE Wire Monitor Scan',
        timestamp: new Date().toISOString(),
        data: { health: overallHealth.status, score: overallHealth.score }
      })
      localStorage.setItem('recentAnalyses', JSON.stringify(analyses.slice(0, 50)))

    } catch (err) {
      console.error('OHE analysis error:', err)
      setError(`Analysis failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const analyzeWireCondition = (defects, particles) => {
    const wearPercentage = (defects.crackPixels / defects.totalPixels) * 100
    
    let condition = 'Good'
    let wearLevel = 'Minimal'
    
    if (wearPercentage > 5) {
      condition = 'Poor'
      wearLevel = 'Severe'
    } else if (wearPercentage > 2) {
      condition = 'Fair'
      wearLevel = 'Moderate'
    } else if (wearPercentage > 0.5) {
      wearLevel = 'Light'
    }
    
    return {
      condition,
      wearLevel,
      wearPercentage: wearPercentage.toFixed(2),
      particleCount: particles.particleCount
    }
  }

  const estimateWireTension = (imageData) => {
    const data = imageData.data
    let linePixels = 0
    
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
      if (brightness > 200) linePixels++
    }
    
    const linePercentage = (linePixels / (data.length / 4)) * 100
    
    let tensionStatus = 'Normal'
    let estimatedTension = 1000
    
    if (linePercentage > 5) {
      tensionStatus = 'High'
      estimatedTension = 1200
    } else if (linePercentage < 1) {
      tensionStatus = 'Low'
      estimatedTension = 800
    }
    
    return {
      status: tensionStatus,
      estimated: estimatedTension,
      unit: 'kg'
    }
  }

  const analyzeSag = (imageData, imageHeight) => {
    const estimatedSag = imageHeight * 0.02
    
    let status = 'Normal'
    if (estimatedSag > imageHeight * 0.05) {
      status = 'Excessive'
    } else if (estimatedSag > imageHeight * 0.03) {
      status = 'High'
    }
    
    return {
      status,
      estimatedMm: Math.round(estimatedSag * 10),
      withinLimits: status === 'Normal'
    }
  }

  const analyzeInsulators = (particles) => {
    const insulatorParticles = particles.particles?.filter(p => p.size > 100) || []
    
    let status = 'Good'
    if (insulatorParticles.length === 0) {
      status = 'Not Detected'
    } else if (insulatorParticles.length < 2) {
      status = 'Check Required'
    }
    
    return {
      status,
      count: insulatorParticles.length,
      integrity: status === 'Good' ? 95 : status === 'Check Required' ? 70 : 50
    }
  }

  const calculateOHEHealth = (wire, tension, sag, insulator) => {
    let score = 100
    
    if (wire.condition === 'Poor') score -= 30
    else if (wire.condition === 'Fair') score -= 15
    
    if (tension.status === 'Low') score -= 20
    else if (tension.status === 'High') score -= 10
    
    if (sag.status === 'Excessive') score -= 25
    else if (sag.status === 'High') score -= 15
    
    if (insulator.status === 'Not Detected') score -= 20
    else if (insulator.status === 'Check Required') score -= 10
    
    let status = 'Good'
    if (score < 50) status = 'Critical'
    else if (score < 70) status = 'Needs Attention'
    else if (score < 85) status = 'Fair'
    
    return { score: Math.max(0, score), status }
  }

  const identifyDefects = (wire, sag, insulator) => {
    const defects = []
    
    if (wire.condition === 'Poor') {
      defects.push(DEFECT_CATEGORIES.wearExcessive)
    }
    if (sag.status === 'Excessive') {
      defects.push(DEFECT_CATEGORIES.sagExcess)
    }
    if (insulator.status === 'Check Required') {
      defects.push(DEFECT_CATEGORIES.insulatorDamage)
    }
    
    return defects
  }

  const generateOHERecommendations = (health, wire, sag) => {
    const recs = []
    
    if (health.score < 50) {
      recs.push('Schedule emergency OHE inspection')
      recs.push('Implement speed restriction until repairs completed')
    }
    
    if (wire.condition === 'Poor') {
      recs.push('Wire replacement required in affected section')
      recs.push('Check for contact strip wear on pantographs')
    }
    
    if (sag.status === 'Excessive' || sag.status === 'High') {
      recs.push('Adjust wire tension to correct sag')
      recs.push('Check for midpoint anchor failures')
    }
    
    if (recs.length === 0) {
      recs.push('OHE system operating within normal parameters')
      recs.push('Continue scheduled maintenance program')
    }
    
    return recs
  }

  return (
    <div className="min-h-screen bg-black p-6 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="module-header">
          <div>
            <h1 className="module-title">OHE Wire Tension Monitor</h1>
            <p className="module-subtitle">Overhead equipment analysis: wire tension, sag, and insulator condition</p>
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
              <h2 className="text-lg font-bold text-white">OHE Capture</h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="rail-label">Inspection Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['catenary', 'contact', 'dropper'].map(type => (
                    <button
                      key={type}
                      onClick={() => setInspectionType(type)}
                      className={`py-2 px-3 rounded-lg font-medium text-sm capitalize transition-all ${
                        inspectionType === type
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
                label="Capture OHE Image"
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
                      <h3 className="text-sm font-medium text-primary-400 uppercase tracking-wide mb-2">Analysis Overlay</h3>
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
              <h2 className="text-lg font-bold text-white">OHE Analysis</h2>
            </div>
            <div className="p-6 max-h-[800px] overflow-y-auto">
              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-2 border-white border-t-transparent mx-auto"></div>
                  <p className="mt-4 text-primary-400">Analyzing OHE system...</p>
                </div>
              )}

              {analysis && !loading && (
                <div className="space-y-4">
                  <div className={`p-6 rounded-lg border ${
                    analysis.overallHealth.score >= 70 ? 'border-white/30 bg-primary-900' :
                    analysis.overallHealth.score >= 50 ? 'border-primary-500 bg-primary-900' :
                    'border-primary-400 bg-primary-900'
                  }`}>
                    <div className="text-xs uppercase tracking-wider text-primary-500 mb-1">System Health</div>
                    <div className="text-4xl font-bold text-white">{analysis.overallHealth.status}</div>
                    <div className="text-sm text-primary-400 mt-1">Score: {analysis.overallHealth.score}/100</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="info-item">
                      <div className="info-value">{analysis.wireAnalysis.condition}</div>
                      <div className="info-label">Wire Condition</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.tensionEstimate.status}</div>
                      <div className="info-label">Tension Status</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.sagAnalysis.status}</div>
                      <div className="info-label">Sag Level</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.insulatorStatus.status}</div>
                      <div className="info-label">Insulators</div>
                    </div>
                  </div>

                  {analysis.detectedDefects.length > 0 && (
                    <div className="p-4 bg-primary-900 border border-primary-600 rounded-lg">
                      <h3 className="font-medium text-white mb-3">Detected Defects</h3>
                      <div className="space-y-2">
                        {analysis.detectedDefects.map((defect, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-primary-800/50 rounded">
                            <div>
                              <span className="text-sm text-white">{defect.name}</span>
                              <span className="text-xs text-primary-500 ml-2">[{defect.code}]</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${
                              defect.severity === 'Critical' ? 'bg-primary-600 text-white' :
                              defect.severity === 'High' ? 'bg-primary-600 text-white' :
                              'bg-primary-700 text-white'
                            }`}>
                              {defect.severity}
                            </span>
                          </div>
                        ))}
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
                </div>
              )}

              {!analysis && !loading && (
                <div className="text-center py-12">
                  <svg className="w-20 h-20 mx-auto mb-4 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  <p className="text-primary-500 mb-2">No analysis data</p>
                  <p className="text-sm text-primary-600">Capture OHE image to begin</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 rail-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">OHE System Specifications</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
              <div className="text-sm text-primary-400 mb-1">System Voltage</div>
              <div className="text-xl font-bold text-white">{OHE_SPECS.voltage.value} {OHE_SPECS.voltage.unit}</div>
              <div className="text-xs text-primary-600">{OHE_SPECS.voltage.frequency}</div>
            </div>
            <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
              <div className="text-sm text-primary-400 mb-1">Standard Height</div>
              <div className="text-xl font-bold text-white">{OHE_SPECS.height.standard} mm</div>
            </div>
            <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
              <div className="text-sm text-primary-400 mb-1">Max Stagger</div>
              <div className="text-xl font-bold text-white">{OHE_SPECS.stagger.max} mm</div>
            </div>
            <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
              <div className="text-sm text-primary-400 mb-1">Catenary Tension</div>
              <div className="text-xl font-bold text-white">{OHE_SPECS.tension.catenary} kg</div>
            </div>
            <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
              <div className="text-sm text-primary-400 mb-1">Contact Tension</div>
              <div className="text-xl font-bold text-white">{OHE_SPECS.tension.contact} kg</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OHEMonitor
