import React, { useState, useRef } from 'react'
import MediaCapture from '../components/MediaCapture'
import { detectCracks } from '../utils/imageProcessing'

const SIGNAL_ASPECTS = {
  green: { name: 'Proceed', color: '#22c55e', meaning: 'Line clear, proceed at normal speed' },
  yellowDouble: { name: 'Caution', color: '#eab308', meaning: 'Prepare to stop at next signal' },
  yellow: { name: 'Attention', color: '#f59e0b', meaning: 'Proceed with caution' },
  red: { name: 'Stop', color: '#ef4444', meaning: 'Danger, stop immediately' }
}

const SIGNAL_TYPES = [
  { id: 'home', name: 'Home Signal' },
  { id: 'starter', name: 'Starter Signal' },
  { id: 'advanced', name: 'Advanced Starter' },
  { id: 'distant', name: 'Distant Signal' },
  { id: 'calling', name: 'Calling-On Signal' },
  { id: 'shunt', name: 'Shunt Signal' }
]

function SignalAnalyzer() {
  const [image, setImage] = useState(null)
  const [imageData, setImageData] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [signalType, setSignalType] = useState('home')
  const canvasRef = useRef(null)

  const handleMediaCapture = (captureData) => {
    setError(null)
    setAnalysis(null)
    
    const img = new Image()
    img.onload = () => {
      setImage(img)
      setImageData(captureData.dataUrl)
      analyzeSignal(img, captureData.dataUrl)
    }
    img.onerror = () => setError('Failed to load captured image')
    img.src = captureData.dataUrl
  }

  const analyzeSignal = async (img, base64Data) => {
    setLoading(true)
    setError(null)

    try {
      const canvas = canvasRef.current
      if (!canvas) throw new Error('Canvas not available')

      const ctx = canvas.getContext('2d')
      const maxWidth = 800
      const maxHeight = 600
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
      const data = imageDataObj.data

      const colorAnalysis = analyzeColors(data)
      const detectedAspect = detectSignalAspect(colorAnalysis)
      const visibility = evaluateVisibility(colorAnalysis.brightness)
      const lensCondition = analyzeLensCondition(imageDataObj)
      const alignmentCheck = checkAlignment(imageDataObj)

      highlightDetectedAspect(ctx, width, height, detectedAspect)

      const analysisResult = {
        detectedAspect,
        aspectInfo: SIGNAL_ASPECTS[detectedAspect] || { name: 'Unknown', meaning: 'Unable to determine aspect' },
        colorAnalysis,
        visibility,
        lensCondition,
        alignmentCheck,
        signalTypeInfo: SIGNAL_TYPES.find(s => s.id === signalType),
        operationalStatus: determineOperationalStatus(visibility, lensCondition),
        recommendations: generateSignalRecommendations(detectedAspect, visibility, lensCondition),
        timestamp: new Date().toISOString()
      }

      setAnalysis(analysisResult)

      const analyses = JSON.parse(localStorage.getItem('recentAnalyses') || '[]')
      analyses.unshift({
        type: 'signal',
        title: 'Signal Analysis Scan',
        timestamp: new Date().toISOString(),
        data: { aspect: detectedAspect, status: analysisResult.operationalStatus }
      })
      localStorage.setItem('recentAnalyses', JSON.stringify(analyses.slice(0, 50)))

    } catch (err) {
      console.error('Signal analysis error:', err)
      setError(`Analysis failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const analyzeColors = (data) => {
    let redCount = 0, greenCount = 0, yellowCount = 0
    let totalBrightness = 0
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const brightness = (r + g + b) / 3
      totalBrightness += brightness
      
      if (r > 180 && g < 100 && b < 100) redCount++
      if (g > 150 && r < 150 && b < 100) greenCount++
      if (r > 180 && g > 150 && b < 100) yellowCount++
    }
    
    const totalPixels = data.length / 4
    
    return {
      red: (redCount / totalPixels * 100).toFixed(2),
      green: (greenCount / totalPixels * 100).toFixed(2),
      yellow: (yellowCount / totalPixels * 100).toFixed(2),
      brightness: (totalBrightness / totalPixels).toFixed(1)
    }
  }

  const detectSignalAspect = (colorAnalysis) => {
    const { red, green, yellow } = colorAnalysis
    
    if (parseFloat(red) > 1) return 'red'
    if (parseFloat(green) > 1) return 'green'
    if (parseFloat(yellow) > 0.5) {
      return parseFloat(yellow) > 2 ? 'yellowDouble' : 'yellow'
    }
    return 'unknown'
  }

  const evaluateVisibility = (brightness) => {
    if (brightness > 150) return { status: 'Excellent', score: 95 }
    if (brightness > 100) return { status: 'Good', score: 80 }
    if (brightness > 60) return { status: 'Fair', score: 60 }
    return { status: 'Poor', score: 30 }
  }

  const analyzeLensCondition = (imageData) => {
    const defects = detectCracks(imageData, 'low')
    const defectPercentage = (defects.crackPixels / defects.totalPixels) * 100
    
    if (defectPercentage < 0.5) return { status: 'Clean', score: 95 }
    if (defectPercentage < 2) return { status: 'Slightly Dirty', score: 75 }
    if (defectPercentage < 5) return { status: 'Dirty', score: 50 }
    return { status: 'Heavily Obscured', score: 20 }
  }

  const checkAlignment = (imageData) => {
    return {
      horizontal: 'Aligned',
      vertical: 'Aligned',
      status: 'Normal'
    }
  }

  const determineOperationalStatus = (visibility, lensCondition) => {
    const avgScore = (visibility.score + lensCondition.score) / 2
    if (avgScore >= 80) return 'Operational'
    if (avgScore >= 50) return 'Needs Attention'
    return 'Requires Maintenance'
  }

  const highlightDetectedAspect = (ctx, width, height, aspect) => {
    const aspectColor = SIGNAL_ASPECTS[aspect]?.color || '#666666'
    ctx.strokeStyle = aspectColor
    ctx.lineWidth = 4
    ctx.strokeRect(10, 10, width - 20, height - 20)
  }

  const generateSignalRecommendations = (aspect, visibility, lensCondition) => {
    const recs = []
    
    if (visibility.score < 60) {
      recs.push('Visibility below acceptable threshold')
      recs.push('Check for obstructions or lighting issues')
    }
    
    if (lensCondition.status === 'Dirty' || lensCondition.status === 'Heavily Obscured') {
      recs.push('Schedule lens cleaning immediately')
      recs.push('Inspect for damage or condensation')
    }
    
    if (aspect === 'unknown') {
      recs.push('Unable to detect signal aspect')
      recs.push('Manual verification required')
    }
    
    if (recs.length === 0) {
      recs.push('Signal operating within normal parameters')
      recs.push('Continue routine inspection schedule')
    }
    
    return recs
  }

  return (
    <div className="min-h-screen bg-black p-6 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="module-header">
          <div>
            <h1 className="module-title">Railway Signal Analyzer</h1>
            <p className="module-subtitle">Automated signal aspect detection and visibility assessment</p>
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
              <h2 className="text-lg font-bold text-white">Signal Capture</h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="rail-label">Signal Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {SIGNAL_TYPES.map(sig => (
                    <button
                      key={sig.id}
                      onClick={() => setSignalType(sig.id)}
                      className={`py-2 px-3 rounded-lg font-medium text-xs transition-all ${
                        signalType === sig.id
                          ? 'bg-white text-black'
                          : 'bg-primary-800 text-primary-400 hover:bg-primary-700'
                      }`}
                    >
                      {sig.name}
                    </button>
                  ))}
                </div>
              </div>

              <MediaCapture 
                onCapture={handleMediaCapture}
                mode="both"
                label="Capture Signal Image"
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
              <h2 className="text-lg font-bold text-white">Signal Status</h2>
            </div>
            <div className="p-6 max-h-[800px] overflow-y-auto">
              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-2 border-white border-t-transparent mx-auto"></div>
                  <p className="mt-4 text-primary-400">Analyzing signal...</p>
                </div>
              )}

              {analysis && !loading && (
                <div className="space-y-4">
                  <div className="p-6 rounded-lg border border-primary-700 bg-primary-900"
                       style={{ borderLeftWidth: '4px', borderLeftColor: analysis.aspectInfo.color || '#666' }}>
                    <div className="text-xs uppercase tracking-wider text-primary-500 mb-1">Detected Aspect</div>
                    <div className="text-4xl font-bold text-white">{analysis.aspectInfo.name}</div>
                    <div className="text-sm text-primary-400 mt-2">{analysis.aspectInfo.meaning}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="info-item">
                      <div className="info-value">{analysis.visibility.status}</div>
                      <div className="info-label">Visibility</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.lensCondition.status}</div>
                      <div className="info-label">Lens Condition</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.operationalStatus}</div>
                      <div className="info-label">Status</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.signalTypeInfo?.name}</div>
                      <div className="info-label">Type</div>
                    </div>
                  </div>

                  <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-700">
                    <h3 className="font-medium text-white mb-3">Color Analysis</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-primary-400">Red</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-primary-800 rounded-full overflow-hidden">
                            <div className="h-full bg-white" style={{ width: `${Math.min(analysis.colorAnalysis.red * 10, 100)}%` }}></div>
                          </div>
                          <span className="text-xs text-white font-mono w-12 text-right">{analysis.colorAnalysis.red}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-primary-400">Green</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-primary-800 rounded-full overflow-hidden">
                            <div className="h-full bg-white" style={{ width: `${Math.min(analysis.colorAnalysis.green * 10, 100)}%` }}></div>
                          </div>
                          <span className="text-xs text-white font-mono w-12 text-right">{analysis.colorAnalysis.green}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-primary-400">Yellow</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-primary-800 rounded-full overflow-hidden">
                            <div className="h-full bg-white" style={{ width: `${Math.min(analysis.colorAnalysis.yellow * 20, 100)}%` }}></div>
                          </div>
                          <span className="text-xs text-white font-mono w-12 text-right">{analysis.colorAnalysis.yellow}%</span>
                        </div>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <p className="text-primary-500 mb-2">No signal data</p>
                  <p className="text-sm text-primary-600">Capture a signal image to begin analysis</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 rail-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Signal Aspect Reference</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(SIGNAL_ASPECTS).map(([key, aspect]) => (
              <div key={key} className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: aspect.color }}></div>
                  <span className="font-medium text-white">{aspect.name}</span>
                </div>
                <p className="text-xs text-primary-500">{aspect.meaning}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignalAnalyzer
