import React, { useState, useRef, useEffect } from 'react'
import { analyzeStructuralImage } from '../utils/openrouterAPI'
import { detectCracks, analyzeCrackPattern, estimateCrackWidth } from '../utils/imageProcessing'
import MediaCapture from '../components/MediaCapture'
import { MotionDetector, ParticleDetector } from '../utils/motionDetection'

function CrackAnalyzer() {
  const [image, setImage] = useState(null)
  const [imageData, setImageData] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sensitivity, setSensitivity] = useState('medium')
  const [error, setError] = useState(null)
  const [showHelp, setShowHelp] = useState(true)
  const [motionData, setMotionData] = useState(null)
  const [particleData, setParticleData] = useState(null)
  const [advancedMode, setAdvancedMode] = useState(true)
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
    img.onerror = () => {
      setError('Failed to load captured media.')
    }
    img.src = captureData.dataUrl
  }
  
  const analyzeImage = async (img, base64Data, isLive = false) => {
    setLoading(true)
    setError(null)
    
    try {
      const canvas = canvasRef.current
      if (!canvas) {
        throw new Error('Canvas not available. Please refresh the page and try again.')
      }
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Unable to initialize canvas context. Your browser may not support this feature.')
      }
      
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
      imageBufferRef.current = {
        imageData: imageDataObj,
        base64: base64Data
      }
      
      if (advancedMode && isLive) {
        const motion = motionDetectorRef.current.detectMotion(imageDataObj)
        setMotionData(motion)
        
        const particles = particleDetectorRef.current.detectParticles(imageDataObj)
        setParticleData(particles)
      }
      
      const crackDetection = detectCracks(imageDataObj, sensitivity)
      
      if (crackDetection.error || !crackDetection.processedImageData) {
        throw new Error(crackDetection.error || 'Image processing failed')
      }
      
      try {
        ctx.putImageData(crackDetection.processedImageData, 0, 0)
      } catch (putError) {
        console.error('Canvas rendering error:', putError)
        throw new Error('Failed to render crack detection overlay')
      }
      
      const pattern = analyzeCrackPattern(crackDetection.crackMap, canvas.width, canvas.height)
      const crackWidth = estimateCrackWidth(crackDetection.crackMap)
      
      const crackPercentage = ((crackDetection.crackPixels / crackDetection.totalPixels) * 100).toFixed(2)
      const estimatedArea = (crackDetection.crackPixels * 0.01).toFixed(2)
      
      const severity = crackPercentage < 1 ? 'Minor' : 
                       crackPercentage < 3 ? 'Moderate' : 
                       crackPercentage < 7 ? 'Severe' : 'Critical'
      
      const basicAnalysis = {
        crackPercentage,
        estimatedArea,
        severity,
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
        title: 'Structural Integrity Scan',
        timestamp: new Date().toISOString(),
        data: { crackPercentage, severity }
      })
      localStorage.setItem('recentAnalyses', JSON.stringify(analyses.slice(0, 50)))
      
      try {
        const aiResult = await analyzeStructuralImage(base64Data, 'crack')
        setAiAnalysis(aiResult)
      } catch (aiError) {
        console.warn('AI analysis unavailable:', aiError.message)
        setAiAnalysis('💡 AI analysis is only available when deployed to Netlify with OpenRouter API configuration. Local crack detection works without AI.')
      }
      
    } catch (err) {
      console.error('Analysis error:', err)
      setError(`Analysis failed: ${err.message}. Please try a different image or adjust sensitivity.`)
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
      
      const basicAnalysis = {
        crackPercentage,
        estimatedArea,
        severity,
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
    <div className="min-h-screen bg-primary-950 pb-16">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Rust & Wear Scanner</h1>
          <p className="text-sm sm:text-base text-secondary-300">AI-powered corrosion and wear detection for locomotives and railway infrastructure</p>
          
          {showHelp && (
            <div className="mt-4 bg-accent/10 border border-accent/30 rounded-lg p-4 relative">
              <button
                onClick={() => setShowHelp(false)}
                className="absolute top-2 right-2 text-secondary-400 hover:text-white"
              >
                ✕
              </button>
              <h3 className="text-lg font-bold text-accent mb-2">📘 How to Use</h3>
              <ol className="text-sm text-secondary-200 space-y-1 list-decimal list-inside">
                <li><strong>Upload an image</strong> - Photograph locomotive body, bogie, undercarriage, or track components</li>
                <li><strong>Automatic analysis</strong> - AI detects rust, corrosion, wear patterns using advanced edge detection</li>
                <li><strong>Adjust sensitivity</strong> - Use Low/Medium/High to fine-tune detection for different corrosion types</li>
                <li><strong>Review results</strong> - Check corrosion percentage, severity, pattern classification, and maintenance recommendations</li>
              </ol>
              <p className="text-xs text-secondary-400 mt-3">💡 <strong>Best Results:</strong> Capture close-up shots of suspected rust/wear areas with good natural or flash lighting. Clean lens before shooting.</p>
            </div>
          )}
        </div>
        
        {error && (
          <div className="mb-6 bg-danger/10 border border-danger/30 text-danger p-4 rounded-lg">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div className="bg-primary-900 rounded-lg shadow-lg border border-primary-800">
            <div className="px-4 sm:px-6 py-4 border-b border-primary-800">
              <h2 className="text-lg sm:text-xl font-bold text-white">Image Input</h2>
            </div>
            
            <div className="p-4 sm:p-6">
              <MediaCapture 
                onCapture={handleMediaCapture}
                mode="both"
                label="Capture Locomotive/Track Image"
              />
              
              {imageData && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-white mb-2">Detection Sensitivity</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['low', 'medium', 'high'].map(level => (
                      <button
                        key={level}
                        onClick={() => handleSensitivityChange(level)}
                        className={`py-2 px-3 rounded-lg font-medium transition-all ${
                          sensitivity === level
                            ? 'bg-accent text-white'
                            : 'bg-primary-800 text-secondary-400 hover:bg-primary-700'
                        }`}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {imageData && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-white mb-2 text-xs sm:text-sm uppercase tracking-wide">Original Image</h3>
                    <div className="bg-primary-800 p-2 rounded">
                      <img src={imageData} alt="Original" className="w-full rounded" />
                    </div>
                  </div>
                  
                  {image && (
                    <div>
                      <h3 className="font-semibold text-white mb-2 text-xs sm:text-sm uppercase tracking-wide">Crack Detection Overlay</h3>
                      <div className="bg-primary-800 p-2 rounded">
                        <canvas ref={canvasRef} className="w-full rounded" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-primary-900 rounded-lg shadow-lg border border-primary-800">
            <div className="px-4 sm:px-6 py-4 border-b border-primary-800">
              <h2 className="text-lg sm:text-xl font-bold text-white">Analysis Results</h2>
            </div>
            
            <div className="p-4 sm:p-6 max-h-[800px] overflow-y-auto">
              {loading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent border-t-transparent mx-auto"></div>
                  <p className="mt-4 text-secondary-400">Analyzing structural integrity...</p>
                </div>
              )}
              
              {analysis && !loading && (
                <div className="space-y-4">
                  <div className={`p-4 sm:p-6 rounded-lg border-2 ${
                    analysis.severity === 'Minor' ? 'bg-success/10 border-success' :
                    analysis.severity === 'Moderate' ? 'bg-warning/10 border-warning' : 
                    analysis.severity === 'Severe' ? 'bg-danger/10 border-danger' :
                    'bg-danger/20 border-danger'
                  }`}>
                    <h3 className="font-semibold text-secondary-400 mb-1 text-xs sm:text-sm uppercase">Severity Classification</h3>
                    <p className={`text-3xl sm:text-4xl font-bold ${
                      analysis.severity === 'Minor' ? 'text-success' :
                      analysis.severity === 'Moderate' ? 'text-warning' : 'text-danger'
                    }`}>{analysis.severity}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-primary-800 p-3 sm:p-4 rounded-lg border border-primary-700">
                      <h3 className="font-semibold text-secondary-400 mb-1 text-xs uppercase">Coverage</h3>
                      <p className="text-2xl sm:text-3xl font-bold text-accent">{analysis.crackPercentage}%</p>
                    </div>
                    
                    <div className="bg-primary-800 p-3 sm:p-4 rounded-lg border border-primary-700">
                      <h3 className="font-semibold text-secondary-400 mb-1 text-xs uppercase">Est. Area</h3>
                      <p className="text-2xl sm:text-3xl font-bold text-accent">{analysis.estimatedArea} cm²</p>
                    </div>
                    
                    <div className="bg-primary-800 p-3 sm:p-4 rounded-lg border border-primary-700">
                      <h3 className="font-semibold text-secondary-400 mb-1 text-xs uppercase">Pattern</h3>
                      <p className="text-lg sm:text-xl font-bold text-white">{analysis.pattern}</p>
                      <p className="text-xs text-secondary-500">{analysis.orientation}</p>
                    </div>
                    
                    <div className="bg-primary-800 p-3 sm:p-4 rounded-lg border border-primary-700">
                      <h3 className="font-semibold text-secondary-400 mb-1 text-xs uppercase">Est. Width</h3>
                      <p className="text-lg sm:text-xl font-bold text-white">{analysis.crackWidth.avg} mm</p>
                      <p className="text-xs text-secondary-500">{analysis.crackWidth.min}-{analysis.crackWidth.max} mm</p>
                    </div>
                  </div>
                  
                  <div className="bg-primary-800/50 p-3 sm:p-4 rounded border border-primary-700">
                    <h3 className="font-semibold mb-2 text-white text-xs sm:text-sm uppercase">Analysis Metrics</h3>
                    <div className="space-y-2 text-xs sm:text-sm font-mono">
                      <div className="flex justify-between">
                        <span className="text-secondary-400">Total Pixels:</span>
                        <span className="text-white">{analysis.pixelsAnalyzed.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary-400">Defect Pixels:</span>
                        <span className="text-white">{analysis.crackPixels.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary-400">Connectivity:</span>
                        <span className="text-white">{analysis.connectivity}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary-400">Scan Date:</span>
                        <span className="text-white">{new Date(analysis.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {motionData && advancedMode && (
                    <div className="bg-primary-800/50 p-4 rounded border border-accent/30">
                      <h3 className="font-semibold mb-2 text-accent text-sm uppercase flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Motion Detection
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-secondary-400">Motion Status:</span>
                          <span className={`ml-2 font-semibold ${motionData.hasMotion ? 'text-warning' : 'text-success'}`}>
                            {motionData.hasMotion ? '⚠️ Detected' : '✓ Stable'}
                          </span>
                        </div>
                        <div>
                          <span className="text-secondary-400">Motion %:</span>
                          <span className="ml-2 font-bold text-accent">{motionData.motionPercentage}%</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-secondary-400">Motion Pixels:</span>
                          <span className="ml-2 font-mono text-white">{motionData.motionPixels?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {particleData && advancedMode && (
                    <div className="bg-primary-800/50 p-4 rounded border border-warning/30">
                      <h3 className="font-semibold mb-2 text-warning text-sm uppercase flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                        </svg>
                        Particle Detection
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-secondary-400">Particle Count:</span>
                          <span className="ml-2 font-bold text-warning">{particleData.particleCount}</span>
                        </div>
                        <div>
                          <span className="text-secondary-400">Total Area:</span>
                          <span className="ml-2 font-mono text-white">{particleData.totalArea} px</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-secondary-400">Particle Density:</span>
                          <span className="ml-2 font-mono text-accent">{particleData.particleDensity} per 10k px</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {aiAnalysis && (
                    <div className="bg-gradient-to-br from-accent/5 to-accent/10 p-4 rounded-lg border border-accent/30">
                      <div className="flex items-center mb-3">
                        <svg className="w-5 h-5 text-accent mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <h3 className="font-semibold text-white text-sm uppercase">AI-Powered Analysis</h3>
                      </div>
                      <div className="text-sm text-secondary-200 whitespace-pre-wrap leading-relaxed">
                        {aiAnalysis}
                      </div>
                    </div>
                  )}
                  
                  <div className={`p-3 sm:p-4 rounded border ${
                    analysis.severity === 'Minor' ? 'bg-success/5 border-success/30' :
                    analysis.severity === 'Moderate' ? 'bg-warning/5 border-warning/30' : 
                    'bg-danger/5 border-danger/30'
                  }`}>
                    <h3 className={`font-semibold mb-2 text-xs sm:text-sm uppercase ${
                      analysis.severity === 'Minor' ? 'text-success' :
                      analysis.severity === 'Moderate' ? 'text-warning' : 'text-danger'
                    }`}>Recommended Actions</h3>
                    <ul className="text-xs sm:text-sm text-secondary-300 space-y-1">
                      {analysis.severity === 'Minor' && (
                        <>
                          <li>• Establish routine monitoring schedule (quarterly)</li>
                          <li>• Document current condition for baseline comparison</li>
                          <li>• Plan preventive maintenance if crack width exceeds 0.3mm</li>
                          <li>• Monitor for any propagation or widening</li>
                        </>
                      )}
                      {analysis.severity === 'Moderate' && (
                        <>
                          <li>• Schedule immediate structural assessment by licensed engineer</li>
                          <li>• Consider crack injection or epoxy sealing for waterproofing</li>
                          <li>• Implement continuous monitoring protocol (monthly)</li>
                          <li>• Evaluate loading conditions and structural capacity</li>
                          <li>• Document crack width measurements for trending</li>
                        </>
                      )}
                      {(analysis.severity === 'Severe' || analysis.severity === 'Critical') && (
                        <>
                          <li>• ⚠️ URGENT: Professional structural engineer evaluation required immediately</li>
                          <li>• Restrict access to affected area until assessment complete</li>
                          <li>• Implement temporary shoring or load reduction if necessary</li>
                          <li>• Prepare detailed repair specifications and drawings</li>
                          <li>• Consider structural strengthening options (FRP, steel plates)</li>
                          <li>• Conduct material testing (core samples, concrete strength)</li>
                          <li>• Evaluate root cause (settlement, overload, corrosion, etc.)</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              )}
              
              {!analysis && !loading && (
                <div className="text-center py-12 text-secondary-500">
                  <svg className="w-20 sm:w-24 h-20 sm:h-24 mx-auto mb-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm sm:text-base">Upload structural image to initiate analysis</p>
                  <p className="text-xs sm:text-sm mt-2 text-secondary-600">Supports: JPG, PNG, WEBP</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CrackAnalyzer
