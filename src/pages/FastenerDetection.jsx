import React, { useState, useRef } from 'react'
import MediaCapture from '../components/MediaCapture'
import { detectCracks } from '../utils/imageProcessing'
import { ParticleDetector } from '../utils/motionDetection'

const FASTENER_TYPES = {
  elastic: { name: 'Elastic Rail Clip (ERC)', torque: '150-180 Nm', lifespan: '15-20 years' },
  pandrol: { name: 'Pandrol Clip', torque: 'N/A (Spring)', lifespan: '25+ years' },
  fist: { name: 'FIST Fastening', torque: '200-250 Nm', lifespan: '20+ years' },
  screw: { name: 'Screw Spike', torque: '180-220 Nm', lifespan: '10-15 years' }
}

const DEFECT_CLASSIFICATIONS = {
  missing: { severity: 'Critical', action: 'Immediate replacement required' },
  broken: { severity: 'Critical', action: 'Replace before next train movement' },
  loose: { severity: 'Warning', action: 'Retighten or replace within 48 hours' },
  corroded: { severity: 'Moderate', action: 'Schedule replacement in next maintenance' },
  worn: { severity: 'Minor', action: 'Monitor and include in routine inspection' }
}

function FastenerDetection() {
  const [image, setImage] = useState(null)
  const [imageData, setImageData] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fastenerType, setFastenerType] = useState('elastic')
  const canvasRef = useRef(null)
  const particleDetectorRef = useRef(new ParticleDetector())

  const handleMediaCapture = (captureData) => {
    setError(null)
    setAnalysis(null)
    
    const img = new Image()
    img.onload = () => {
      setImage(img)
      setImageData(captureData.dataUrl)
      analyzeFasteners(img, captureData.dataUrl)
    }
    img.onerror = () => setError('Failed to load captured image')
    img.src = captureData.dataUrl
  }

  const analyzeFasteners = async (img, base64Data) => {
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

      if (defectDetection.processedImageData) {
        ctx.putImageData(defectDetection.processedImageData, 0, 0)
      }

      const detectedFasteners = estimateFastenerCount(particles)
      const defectAnalysis = classifyDefects(defectDetection.crackPixels, particles)
      const integrityScore = calculateIntegrityScore(detectedFasteners, defectAnalysis)

      const analysisResult = {
        fastenerType: FASTENER_TYPES[fastenerType],
        detectedCount: detectedFasteners.count,
        defectiveCount: defectAnalysis.defectiveCount,
        integrityScore,
        defects: defectAnalysis.classifications,
        recommendations: generateFastenerRecommendations(defectAnalysis, integrityScore),
        timestamp: new Date().toISOString()
      }

      setAnalysis(analysisResult)

      const analyses = JSON.parse(localStorage.getItem('recentAnalyses') || '[]')
      analyses.unshift({
        type: 'fastener',
        title: 'Fastener Detection Scan',
        timestamp: new Date().toISOString(),
        data: { integrityScore, defectiveCount: defectAnalysis.defectiveCount }
      })
      localStorage.setItem('recentAnalyses', JSON.stringify(analyses.slice(0, 50)))

    } catch (err) {
      console.error('Fastener analysis error:', err)
      setError(`Analysis failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const estimateFastenerCount = (particles) => {
    const significantParticles = particles.particles?.filter(p => p.size > 20 && p.size < 500) || []
    return {
      count: significantParticles.length,
      particles: significantParticles
    }
  }

  const classifyDefects = (crackPixels, particles) => {
    const classifications = []
    let defectiveCount = 0
    
    if (crackPixels > 10000) {
      classifications.push({ type: 'corroded', ...DEFECT_CLASSIFICATIONS.corroded })
      defectiveCount++
    }
    if (crackPixels > 20000) {
      classifications.push({ type: 'broken', ...DEFECT_CLASSIFICATIONS.broken })
      defectiveCount++
    }
    if (particles.particleCount < 3) {
      classifications.push({ type: 'missing', ...DEFECT_CLASSIFICATIONS.missing })
      defectiveCount++
    }
    
    if (classifications.length === 0) {
      classifications.push({ type: 'normal', severity: 'Good', action: 'No action required' })
    }
    
    return { classifications, defectiveCount }
  }

  const calculateIntegrityScore = (fasteners, defectAnalysis) => {
    let score = 100
    
    if (fasteners.count === 0) score -= 50
    
    defectAnalysis.classifications.forEach(defect => {
      if (defect.severity === 'Critical') score -= 30
      else if (defect.severity === 'Warning') score -= 15
      else if (defect.severity === 'Moderate') score -= 10
      else if (defect.severity === 'Minor') score -= 5
    })
    
    return Math.max(0, score)
  }

  const generateFastenerRecommendations = (defectAnalysis, integrityScore) => {
    const recs = []
    
    if (integrityScore < 50) {
      recs.push('Impose immediate speed restriction on this section')
      recs.push('Deploy maintenance gang for emergency repairs')
    }
    
    defectAnalysis.classifications.forEach(defect => {
      if (defect.action) {
        recs.push(defect.action)
      }
    })
    
    if (integrityScore >= 80) {
      recs.push('Continue routine inspection schedule')
    }
    
    return [...new Set(recs)]
  }

  return (
    <div className="min-h-screen bg-black p-6 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="module-header">
          <div>
            <h1 className="module-title">Rail Fastener Detection</h1>
            <p className="module-subtitle">Automated detection of missing, loose, or damaged fastening systems</p>
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
                <label className="rail-label">Fastener Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(FASTENER_TYPES).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => setFastenerType(key)}
                      className={`py-2 px-3 rounded-lg font-medium text-xs transition-all ${
                        fastenerType === key
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
                label="Capture Fastener Image"
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
                      <h3 className="text-sm font-medium text-primary-400 uppercase tracking-wide mb-2">Detection Overlay</h3>
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
              <h2 className="text-lg font-bold text-white">Detection Results</h2>
            </div>
            <div className="p-6 max-h-[800px] overflow-y-auto">
              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-2 border-white border-t-transparent mx-auto"></div>
                  <p className="mt-4 text-primary-400">Detecting fasteners...</p>
                </div>
              )}

              {analysis && !loading && (
                <div className="space-y-4">
                  <div className={`p-6 rounded-lg border ${
                    analysis.integrityScore >= 80 ? 'border-white/30 bg-primary-900' :
                    analysis.integrityScore >= 50 ? 'border-primary-500 bg-primary-900' :
                    'border-primary-400 bg-primary-900'
                  }`}>
                    <div className="text-xs uppercase tracking-wider text-primary-500 mb-1">Integrity Score</div>
                    <div className="text-5xl font-bold text-white">{analysis.integrityScore}%</div>
                    <div className="text-sm text-primary-400 mt-1">{analysis.fastenerType.name}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="info-item">
                      <div className="info-value">{analysis.detectedCount}</div>
                      <div className="info-label">Detected</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.defectiveCount}</div>
                      <div className="info-label">Defective</div>
                    </div>
                  </div>

                  <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-700">
                    <h3 className="font-medium text-white mb-3">Defect Classifications</h3>
                    <div className="space-y-2">
                      {analysis.defects.map((defect, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-primary-800/50 rounded">
                          <span className="text-sm text-white capitalize">{defect.type}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            defect.severity === 'Critical' ? 'bg-primary-600 text-white' :
                            defect.severity === 'Warning' ? 'bg-primary-700 text-white' :
                            defect.severity === 'Good' ? 'bg-white/20 text-white' :
                            'bg-primary-800 text-primary-300'
                          }`}>
                            {defect.severity}
                          </span>
                        </div>
                      ))}
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

                  <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-700">
                    <h3 className="font-medium text-white mb-3">Fastener Specifications</h3>
                    <div className="space-y-2 text-sm font-mono">
                      <div className="flex justify-between">
                        <span className="text-primary-500">Type:</span>
                        <span className="text-white">{analysis.fastenerType.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-primary-500">Torque:</span>
                        <span className="text-white">{analysis.fastenerType.torque}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-primary-500">Lifespan:</span>
                        <span className="text-white">{analysis.fastenerType.lifespan}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!analysis && !loading && (
                <div className="text-center py-12">
                  <svg className="w-20 h-20 mx-auto mb-4 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-primary-500 mb-2">No detection data</p>
                  <p className="text-sm text-primary-600">Capture a fastener image to begin analysis</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FastenerDetection
