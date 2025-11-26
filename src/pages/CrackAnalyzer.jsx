import React, { useState, useRef } from 'react'
import { analyzeStructuralImage } from '../utils/openrouterAPI'
import { detectCracks, analyzeCrackPattern, estimateCrackWidth } from '../utils/imageProcessing'
import MediaCapture from '../components/MediaCapture'
import { MotionDetector, ParticleDetector } from '../utils/motionDetection'

const CORROSION_GRADES = {
  A: { name: 'Grade A', description: 'No visible corrosion', action: 'Continue monitoring' },
  B: { name: 'Grade B', description: 'Minor surface rust', action: 'Clean and apply protective coating' },
  C: { name: 'Grade C', description: 'Moderate corrosion', action: 'Remove rust, treat, and repaint' },
  D: { name: 'Grade D', description: 'Severe corrosion', action: 'Structural assessment required' }
}

function CrackAnalyzer() {
  const [image, setImage] = useState(null)
  const [imageData, setImageData] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sensitivity, setSensitivity] = useState('medium')
  const [error, setError] = useState(null)
  const [motionData, setMotionData] = useState(null)
  const [particleData, setParticleData] = useState(null)
  const [inspectionTarget, setInspectionTarget] = useState('bridge')
  const canvasRef = useRef(null)
  const imageBufferRef = useRef(null)
  const motionDetectorRef = useRef(new MotionDetector())
  const particleDetectorRef = useRef(new ParticleDetector())
  
  const handleMediaCapture = (captureData) => {
    setError(null)
    setAnalysis(null)
    setAiAnalysis(null)
    imageBufferRef.current = null
    
    const img = new Image()
    img.onload = () => {
      setImage(img)
      setImageData(captureData.dataUrl)
      analyzeImage(img, captureData.dataUrl, captureData.source === 'live')
    }
    img.onerror = () => setError('Failed to load captured media.')
    img.src = captureData.dataUrl
  }
  
  const analyzeImage = async (img, base64Data, isLive = false) => {
    setLoading(true)
    setError(null)
    
    try {
      const canvas = canvasRef.current
      if (!canvas) throw new Error('Canvas not available')
      
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Unable to initialize canvas context')
      
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
      
      const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height)
      imageBufferRef.current = { imageData: imageDataObj, base64: base64Data }
      
      if (isLive) {
        const motion = motionDetectorRef.current.detectMotion(imageDataObj)
        setMotionData(motion)
        
        const particles = particleDetectorRef.current.detectParticles(imageDataObj)
        setParticleData(particles)
      }
      
      const crackDetection = detectCracks(imageDataObj, sensitivity)
      
      if (crackDetection.error || !crackDetection.processedImageData) {
        throw new Error(crackDetection.error || 'Image processing failed')
      }
      
      ctx.putImageData(crackDetection.processedImageData, 0, 0)
      
      const pattern = analyzeCrackPattern(crackDetection.crackMap, canvas.width, canvas.height)
      const crackWidth = estimateCrackWidth(crackDetection.crackMap)
      
      const crackPercentage = ((crackDetection.crackPixels / crackDetection.totalPixels) * 100).toFixed(2)
      const estimatedArea = (crackDetection.crackPixels * 0.01).toFixed(2)
      
      const severity = crackPercentage < 1 ? 'Minor' : 
                       crackPercentage < 3 ? 'Moderate' : 
                       crackPercentage < 7 ? 'Severe' : 'Critical'
      
      const corrosionGrade = crackPercentage < 0.5 ? 'A' : 
                             crackPercentage < 2 ? 'B' :
                             crackPercentage < 5 ? 'C' : 'D'
      
      const basicAnalysis = {
        crackPercentage,
        estimatedArea,
        severity,
        corrosionGrade,
        pixelsAnalyzed: crackDetection.totalPixels,
        crackPixels: crackDetection.crackPixels,
        pattern: pattern.patternType,
        orientation: pattern.orientation,
        connectivity: pattern.connectivity,
        crackWidth,
        timestamp: new Date().toISOString()
      }
      
      setAnalysis(basicAnalysis)
      
      const analyses = JSON.parse(localStorage.getItem('recentAnalyses') || '[]')
      analyses.unshift({
        type: 'crack',
        title: 'Corrosion Scanner Analysis',
        timestamp: new Date().toISOString(),
        data: { crackPercentage, severity, corrosionGrade }
      })
      localStorage.setItem('recentAnalyses', JSON.stringify(analyses.slice(0, 50)))
      
      try {
        const aiResult = await analyzeStructuralImage(base64Data, 'crack')
        setAiAnalysis(aiResult)
      } catch (aiError) {
        console.warn('AI analysis unavailable:', aiError.message)
      }
      
    } catch (err) {
      console.error('Analysis error:', err)
      setError(`Analysis failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSensitivityChange = async (newSensitivity) => {
    setSensitivity(newSensitivity)
    
    if (!imageBufferRef.current) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    setLoading(true)
    setError(null)
    
    try {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      const bufferedImageData = imageBufferRef.current.imageData
      const crackDetection = detectCracks(bufferedImageData, newSensitivity)
      
      if (crackDetection.error || !crackDetection.processedImageData) {
        throw new Error(crackDetection.error || 'Image processing failed')
      }
      
      ctx.putImageData(crackDetection.processedImageData, 0, 0)
      
      const pattern = analyzeCrackPattern(crackDetection.crackMap, canvas.width, canvas.height)
      const crackWidth = estimateCrackWidth(crackDetection.crackMap)
      
      const crackPercentage = ((crackDetection.crackPixels / crackDetection.totalPixels) * 100).toFixed(2)
      const estimatedArea = (crackDetection.crackPixels * 0.01).toFixed(2)
      
      const severity = crackPercentage < 1 ? 'Minor' : 
                       crackPercentage < 3 ? 'Moderate' : 
                       crackPercentage < 7 ? 'Severe' : 'Critical'
      
      const corrosionGrade = crackPercentage < 0.5 ? 'A' : 
                             crackPercentage < 2 ? 'B' :
                             crackPercentage < 5 ? 'C' : 'D'
      
      const basicAnalysis = {
        crackPercentage,
        estimatedArea,
        severity,
        corrosionGrade,
        pixelsAnalyzed: crackDetection.totalPixels,
        crackPixels: crackDetection.crackPixels,
        pattern: pattern.patternType,
        orientation: pattern.orientation,
        connectivity: pattern.connectivity,
        crackWidth,
        timestamp: new Date().toISOString()
      }
      
      setAnalysis(basicAnalysis)
    } catch (err) {
      console.error('Sensitivity change error:', err)
      setError(`Failed to update sensitivity: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-black p-6 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="module-header">
          <div>
            <h1 className="module-title">Corrosion Scanner</h1>
            <p className="module-subtitle">AI-powered rust and wear detection for railway infrastructure</p>
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
                <label className="rail-label">Inspection Target</label>
                <div className="grid grid-cols-4 gap-2">
                  {['bridge', 'rail', 'locomotive', 'track'].map(target => (
                    <button
                      key={target}
                      onClick={() => setInspectionTarget(target)}
                      className={`py-2 px-3 rounded-lg font-medium text-xs capitalize transition-all ${
                        inspectionTarget === target
                          ? 'bg-white text-black'
                          : 'bg-primary-800 text-primary-400 hover:bg-primary-700'
                      }`}
                    >
                      {target}
                    </button>
                  ))}
                </div>
              </div>

              <MediaCapture 
                onCapture={handleMediaCapture}
                mode="both"
                label="Capture Infrastructure Image"
              />
              
              {imageData && (
                <div className="mt-4 mb-4">
                  <label className="rail-label">Detection Sensitivity</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['low', 'medium', 'high'].map(level => (
                      <button
                        key={level}
                        onClick={() => handleSensitivityChange(level)}
                        className={`py-2 px-3 rounded-lg font-medium transition-all capitalize ${
                          sensitivity === level
                            ? 'bg-white text-black'
                            : 'bg-primary-800 text-primary-400 hover:bg-primary-700'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {imageData && (
                <div className="space-y-4 mt-4">
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
                  <p className="mt-4 text-primary-400">Analyzing corrosion patterns...</p>
                </div>
              )}
              
              {analysis && !loading && (
                <div className="space-y-4">
                  <div className={`p-6 rounded-lg border ${
                    analysis.severity === 'Minor' ? 'border-white/30 bg-primary-900' :
                    analysis.severity === 'Moderate' ? 'border-primary-500 bg-primary-900' : 
                    'border-primary-400 bg-primary-900'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs uppercase tracking-wider text-primary-500">Severity</div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        analysis.corrosionGrade === 'A' ? 'bg-white/20 text-white' :
                        analysis.corrosionGrade === 'B' ? 'bg-primary-700 text-white' :
                        'bg-primary-600 text-white'
                      }`}>
                        {CORROSION_GRADES[analysis.corrosionGrade]?.name}
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-white">{analysis.severity}</div>
                    <div className="text-sm text-primary-400 mt-1">{analysis.crackPercentage}% corrosion coverage</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="info-item">
                      <div className="info-value">{analysis.crackPercentage}%</div>
                      <div className="info-label">Coverage</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.estimatedArea}</div>
                      <div className="info-label">Est. Area (cm2)</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.pattern}</div>
                      <div className="info-label">Pattern</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.crackWidth.avg}</div>
                      <div className="info-label">Width (mm)</div>
                    </div>
                  </div>
                  
                  {motionData && (
                    <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-700">
                      <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Motion Detection
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
                  
                  {particleData && (
                    <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-700">
                      <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                        </svg>
                        Particle Detection
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-primary-500">Count:</span>
                          <span className="ml-2 font-bold text-white">{particleData.particleCount}</span>
                        </div>
                        <div>
                          <span className="text-primary-500">Density:</span>
                          <span className="ml-2 font-mono text-white">{particleData.particleDensity}/10k px</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {aiAnalysis && (
                    <div className="p-4 bg-primary-900/50 rounded-lg border border-white/20">
                      <div className="flex items-center mb-3">
                        <svg className="w-5 h-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <h3 className="font-medium text-white">AI Analysis</h3>
                      </div>
                      <div className="text-sm text-primary-300 whitespace-pre-wrap leading-relaxed">
                        {aiAnalysis}
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-700">
                    <h3 className="font-medium text-white mb-3">Recommended Actions</h3>
                    <ul className="space-y-2">
                      {analysis.severity === 'Minor' && (
                        <>
                          <li className="flex items-start gap-2 text-sm text-primary-400">
                            <span className="text-white mt-1">-</span>
                            Continue routine monitoring schedule
                          </li>
                          <li className="flex items-start gap-2 text-sm text-primary-400">
                            <span className="text-white mt-1">-</span>
                            Document current condition for baseline
                          </li>
                        </>
                      )}
                      {analysis.severity === 'Moderate' && (
                        <>
                          <li className="flex items-start gap-2 text-sm text-primary-400">
                            <span className="text-white mt-1">-</span>
                            Schedule maintenance within 30 days
                          </li>
                          <li className="flex items-start gap-2 text-sm text-primary-400">
                            <span className="text-white mt-1">-</span>
                            Apply rust treatment and protective coating
                          </li>
                        </>
                      )}
                      {(analysis.severity === 'Severe' || analysis.severity === 'Critical') && (
                        <>
                          <li className="flex items-start gap-2 text-sm text-primary-400">
                            <span className="text-white mt-1">-</span>
                            URGENT: Structural assessment required
                          </li>
                          <li className="flex items-start gap-2 text-sm text-primary-400">
                            <span className="text-white mt-1">-</span>
                            Consider speed restriction until repaired
                          </li>
                          <li className="flex items-start gap-2 text-sm text-primary-400">
                            <span className="text-white mt-1">-</span>
                            Prepare for component replacement
                          </li>
                        </>
                      )}
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
                        <span className="text-white">{analysis.crackPixels.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-primary-500">Connectivity:</span>
                        <span className="text-white">{analysis.connectivity}%</span>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-primary-500 mb-2">No analysis data</p>
                  <p className="text-sm text-primary-600">Capture an infrastructure image to begin corrosion analysis</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-6 rail-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Corrosion Grade Reference (RDSO)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(CORROSION_GRADES).map(([key, grade]) => (
              <div key={key} className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
                <div className="text-xl font-bold text-white mb-1">{grade.name}</div>
                <div className="text-sm text-primary-400 mb-2">{grade.description}</div>
                <div className="text-xs text-primary-600">{grade.action}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CrackAnalyzer
