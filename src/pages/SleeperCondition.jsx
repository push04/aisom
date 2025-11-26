import React, { useState, useRef } from 'react'
import MediaCapture from '../components/MediaCapture'
import { detectCracks, analyzeCrackPattern } from '../utils/imageProcessing'
import { ParticleDetector } from '../utils/motionDetection'

const SLEEPER_TYPES = {
  psc: { name: 'PSC Sleeper', weight: '270 kg', length: '2750 mm', lifespan: '50-60 years' },
  wooden: { name: 'Wooden Sleeper', weight: '80 kg', length: '2750 mm', lifespan: '12-15 years' },
  steel: { name: 'Steel Trough', weight: '85 kg', length: '2590 mm', lifespan: '35-40 years' },
  composite: { name: 'Composite Sleeper', weight: '100 kg', length: '2600 mm', lifespan: '40-50 years' }
}

const DEFECT_TYPES = {
  crack: { name: 'Cracking', severity: 'High', action: 'Replace within 30 days' },
  spalling: { name: 'Spalling', severity: 'Medium', action: 'Monitor, schedule replacement' },
  abrasion: { name: 'Rail Seat Abrasion', severity: 'Medium', action: 'Check fastener condition' },
  settlement: { name: 'Settlement', severity: 'High', action: 'Realign and pack ballast' },
  rot: { name: 'Rot/Decay', severity: 'Critical', action: 'Immediate replacement' }
}

function SleeperCondition() {
  const [image, setImage] = useState(null)
  const [imageData, setImageData] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sleeperType, setSleeperType] = useState('psc')
  const canvasRef = useRef(null)
  const particleDetectorRef = useRef(new ParticleDetector())

  const handleMediaCapture = (captureData) => {
    setError(null)
    setAnalysis(null)
    
    const img = new Image()
    img.onload = () => {
      setImage(img)
      setImageData(captureData.dataUrl)
      analyzeSleeper(img, captureData.dataUrl)
    }
    img.onerror = () => setError('Failed to load captured image')
    img.src = captureData.dataUrl
  }

  const analyzeSleeper = async (img, base64Data) => {
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
      const defectDetection = detectCracks(imageDataObj, 'medium')
      const pattern = analyzeCrackPattern(defectDetection.crackMap, width, height)

      if (defectDetection.processedImageData) {
        ctx.putImageData(defectDetection.processedImageData, 0, 0)
      }

      const defectClassification = classifySleeperDefects(defectDetection, particles, pattern)
      const conditionScore = calculateConditionScore(defectClassification)
      const remainingLife = estimateRemainingLife(conditionScore, sleeperType)

      const analysisResult = {
        sleeperInfo: SLEEPER_TYPES[sleeperType],
        defects: defectClassification,
        conditionScore,
        conditionGrade: getConditionGrade(conditionScore),
        remainingLife,
        crackCoverage: ((defectDetection.crackPixels / defectDetection.totalPixels) * 100).toFixed(2),
        pattern: pattern.patternType,
        recommendations: generateSleeperRecommendations(defectClassification, conditionScore),
        timestamp: new Date().toISOString()
      }

      setAnalysis(analysisResult)

      const analyses = JSON.parse(localStorage.getItem('recentAnalyses') || '[]')
      analyses.unshift({
        type: 'sleeper',
        title: 'Sleeper Condition Scan',
        timestamp: new Date().toISOString(),
        data: { grade: analysisResult.conditionGrade, score: conditionScore }
      })
      localStorage.setItem('recentAnalyses', JSON.stringify(analyses.slice(0, 50)))

    } catch (err) {
      console.error('Sleeper analysis error:', err)
      setError(`Analysis failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const classifySleeperDefects = (defects, particles, pattern) => {
    const classifications = []
    const defectPercentage = (defects.crackPixels / defects.totalPixels) * 100

    if (defectPercentage > 5 || pattern.patternType === 'Linear') {
      classifications.push({ ...DEFECT_TYPES.crack, detected: true, severity_score: 30 })
    }
    if (particles.particleCount > 300) {
      classifications.push({ ...DEFECT_TYPES.spalling, detected: true, severity_score: 20 })
    }
    if (pattern.patternType === 'Complex' && defectPercentage > 3) {
      classifications.push({ ...DEFECT_TYPES.abrasion, detected: true, severity_score: 25 })
    }
    if (pattern.orientation === 'Horizontal' && particles.particleCount > 200) {
      classifications.push({ ...DEFECT_TYPES.settlement, detected: true, severity_score: 35 })
    }

    if (classifications.length === 0) {
      classifications.push({ name: 'No Significant Defects', severity: 'None', action: 'Continue routine monitoring', detected: false, severity_score: 0 })
    }

    return classifications
  }

  const calculateConditionScore = (defects) => {
    const totalSeverity = defects.reduce((sum, d) => sum + (d.severity_score || 0), 0)
    return Math.max(0, 100 - totalSeverity)
  }

  const getConditionGrade = (score) => {
    if (score >= 85) return 'A - Excellent'
    if (score >= 70) return 'B - Good'
    if (score >= 50) return 'C - Fair'
    if (score >= 30) return 'D - Poor'
    return 'E - Critical'
  }

  const estimateRemainingLife = (score, type) => {
    const baseLife = parseInt(SLEEPER_TYPES[type]?.lifespan) || 30
    const remainingPercentage = score / 100
    const yearsRemaining = Math.round(baseLife * remainingPercentage * 0.3)
    return `${yearsRemaining}-${yearsRemaining + 5} years`
  }

  const generateSleeperRecommendations = (defects, score) => {
    const recs = []
    const criticalDefects = defects.filter(d => d.severity === 'Critical' || d.severity === 'High')

    if (criticalDefects.length > 0) {
      recs.push('Priority replacement required')
      criticalDefects.forEach(d => {
        if (d.action) recs.push(d.action)
      })
    }

    if (score < 50) {
      recs.push('Include in next track renewal program')
      recs.push('Increase inspection frequency to monthly')
    } else if (score < 70) {
      recs.push('Schedule replacement in next maintenance cycle')
      recs.push('Monitor for progressive deterioration')
    }

    if (recs.length === 0) {
      recs.push('Sleeper in serviceable condition')
      recs.push('Continue routine inspection schedule')
    }

    return recs
  }

  return (
    <div className="min-h-screen bg-black p-6 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="module-header">
          <div>
            <h1 className="module-title">Sleeper Condition Detector</h1>
            <p className="module-subtitle">Automated detection of sleeper defects, cracks, and deterioration</p>
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
              <h2 className="text-lg font-bold text-white">Sleeper Capture</h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="rail-label">Sleeper Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(SLEEPER_TYPES).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => setSleeperType(key)}
                      className={`py-2 px-3 rounded-lg font-medium text-xs transition-all ${
                        sleeperType === key
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
                label="Capture Sleeper Image"
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
              <h2 className="text-lg font-bold text-white">Condition Analysis</h2>
            </div>
            <div className="p-6 max-h-[800px] overflow-y-auto">
              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-2 border-white border-t-transparent mx-auto"></div>
                  <p className="mt-4 text-primary-400">Analyzing sleeper condition...</p>
                </div>
              )}

              {analysis && !loading && (
                <div className="space-y-4">
                  <div className={`p-6 rounded-lg border ${
                    analysis.conditionScore >= 70 ? 'border-white/30 bg-primary-900' :
                    analysis.conditionScore >= 50 ? 'border-primary-500 bg-primary-900' :
                    'border-primary-400 bg-primary-900'
                  }`}>
                    <div className="text-xs uppercase tracking-wider text-primary-500 mb-1">Condition Grade</div>
                    <div className="text-4xl font-bold text-white">{analysis.conditionGrade}</div>
                    <div className="text-sm text-primary-400 mt-1">Score: {analysis.conditionScore}/100</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="info-item">
                      <div className="info-value">{analysis.crackCoverage}%</div>
                      <div className="info-label">Defect Coverage</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.remainingLife}</div>
                      <div className="info-label">Est. Remaining Life</div>
                    </div>
                  </div>

                  <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-700">
                    <h3 className="font-medium text-white mb-3">Detected Defects</h3>
                    <div className="space-y-2">
                      {analysis.defects.map((defect, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-primary-800/50 rounded">
                          <span className="text-sm text-white">{defect.name}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            defect.severity === 'Critical' ? 'bg-primary-600 text-white' :
                            defect.severity === 'High' ? 'bg-primary-600 text-white' :
                            defect.severity === 'Medium' ? 'bg-primary-700 text-white' :
                            defect.severity === 'None' ? 'bg-white/20 text-white' :
                            'bg-primary-800 text-primary-300'
                          }`}>
                            {defect.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-700">
                    <h3 className="font-medium text-white mb-3">Sleeper Specifications</h3>
                    <div className="space-y-2 text-sm font-mono">
                      <div className="flex justify-between">
                        <span className="text-primary-500">Type:</span>
                        <span className="text-white">{analysis.sleeperInfo.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-primary-500">Weight:</span>
                        <span className="text-white">{analysis.sleeperInfo.weight}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-primary-500">Length:</span>
                        <span className="text-white">{analysis.sleeperInfo.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-primary-500">Design Life:</span>
                        <span className="text-white">{analysis.sleeperInfo.lifespan}</span>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <p className="text-primary-500 mb-2">No analysis data</p>
                  <p className="text-sm text-primary-600">Capture a sleeper image to begin</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SleeperCondition
