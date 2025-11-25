import React, { useState, useRef } from 'react'

function CrackAnalyzer() {
  const [image, setImage] = useState(null)
  const [imageData, setImageData] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        setImage(img)
        setImageData(event.target.result)
        analyzeImage(img)
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }
  
  const analyzeImage = (img) => {
    setLoading(true)
    
    const canvas = canvasRef.current
    if (!canvas) {
      setLoading(false)
      return
    }
    const ctx = canvas.getContext('2d')
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)
    
    const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageDataObj.data
    
    let darkPixels = 0
    const threshold = 100
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      const brightness = (r + g + b) / 3
      
      if (brightness < threshold) {
        darkPixels++
        pixels[i] = 220
        pixels[i + 1] = 38
        pixels[i + 2] = 38
        pixels[i + 3] = 200
      }
    }
    
    ctx.putImageData(imageDataObj, 0, 0)
    
    const totalPixels = canvas.width * canvas.height
    const crackPercentage = ((darkPixels / totalPixels) * 100).toFixed(2)
    const estimatedArea = (darkPixels * 0.01).toFixed(2)
    
    const severity = crackPercentage < 2 ? 'Minor' : 
                     crackPercentage < 5 ? 'Moderate' : 'Severe'
    
    setAnalysis({
      crackPercentage,
      estimatedArea,
      severity,
      pixelsAnalyzed: totalPixels,
      crackPixels: darkPixels,
      timestamp: new Date().toISOString()
    })
    
    const analyses = JSON.parse(localStorage.getItem('recentAnalyses') || '[]')
    analyses.unshift({
      type: 'crack',
      title: 'Structural Integrity Scan',
      timestamp: new Date().toISOString(),
      data: { crackPercentage, severity }
    })
    localStorage.setItem('recentAnalyses', JSON.stringify(analyses.slice(0, 50)))
    
    setLoading(false)
  }
  
  return (
    <div className="min-h-screen bg-primary-950">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Structural Integrity Scanner</h1>
          <p className="text-secondary-300">Computer vision-based crack detection and structural assessment</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-primary-900 rounded-lg shadow-lg border border-primary-800">
            <div className="px-6 py-4 border-b border-primary-800">
              <h2 className="text-xl font-bold text-white">Image Input</h2>
            </div>
            
            <div className="p-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current.click()}
                className="w-full bg-accent hover:bg-accent-hover text-white py-3 rounded-lg transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 mb-6"
              >
                Upload Structural Image
              </button>
              
              {imageData && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-white mb-2 text-sm uppercase tracking-wide">Original Image</h3>
                    <div className="bg-primary-800 p-2 rounded">
                      <img src={imageData} alt="Original" className="w-full rounded" />
                    </div>
                  </div>
                  
                  {image && (
                    <div>
                      <h3 className="font-semibold text-white mb-2 text-sm uppercase tracking-wide">Crack Detection Overlay</h3>
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
            <div className="px-6 py-4 border-b border-primary-800">
              <h2 className="text-xl font-bold text-white">Analysis Results</h2>
            </div>
            
            <div className="p-6">
              {loading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent border-t-transparent mx-auto"></div>
                  <p className="mt-4 text-secondary-400">Analyzing structural integrity...</p>
                </div>
              )}
              
              {analysis && !loading && (
                <div className="space-y-4">
                  <div className={`p-6 rounded-lg border-2 ${
                    analysis.severity === 'Minor' ? 'bg-success/10 border-success' :
                    analysis.severity === 'Moderate' ? 'bg-warning/10 border-warning' : 'bg-danger/10 border-danger'
                  }`}>
                    <h3 className="font-semibold text-secondary-400 mb-1 text-sm uppercase">Severity Classification</h3>
                    <p className={`text-4xl font-bold ${
                      analysis.severity === 'Minor' ? 'text-success' :
                      analysis.severity === 'Moderate' ? 'text-warning' : 'text-danger'
                    }`}>{analysis.severity}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary-800 p-4 rounded-lg border border-primary-700">
                      <h3 className="font-semibold text-secondary-400 mb-1 text-xs uppercase">Coverage</h3>
                      <p className="text-3xl font-bold text-accent">{analysis.crackPercentage}%</p>
                    </div>
                    
                    <div className="bg-primary-800 p-4 rounded-lg border border-primary-700">
                      <h3 className="font-semibold text-secondary-400 mb-1 text-xs uppercase">Est. Area</h3>
                      <p className="text-3xl font-bold text-accent">{analysis.estimatedArea} cm²</p>
                    </div>
                  </div>
                  
                  <div className="bg-primary-800/50 p-4 rounded border border-primary-700">
                    <h3 className="font-semibold mb-2 text-white text-sm uppercase">Analysis Metrics</h3>
                    <div className="space-y-2 text-sm font-mono">
                      <div className="flex justify-between">
                        <span className="text-secondary-400">Total Pixels:</span>
                        <span className="text-white">{analysis.pixelsAnalyzed.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary-400">Defect Pixels:</span>
                        <span className="text-white">{analysis.crackPixels.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary-400">Scan Date:</span>
                        <span className="text-white">{new Date(analysis.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded border ${
                    analysis.severity === 'Minor' ? 'bg-success/5 border-success/30' :
                    analysis.severity === 'Moderate' ? 'bg-warning/5 border-warning/30' : 
                    'bg-danger/5 border-danger/30'
                  }`}>
                    <h3 className={`font-semibold mb-2 text-sm uppercase ${
                      analysis.severity === 'Minor' ? 'text-success' :
                      analysis.severity === 'Moderate' ? 'text-warning' : 'text-danger'
                    }`}>Recommended Actions</h3>
                    <ul className="text-sm text-secondary-300 space-y-1">
                      {analysis.severity === 'Minor' && (
                        <>
                          <li>• Establish routine monitoring schedule</li>
                          <li>• Document current condition for baseline</li>
                          <li>• Plan preventive maintenance if required</li>
                        </>
                      )}
                      {analysis.severity === 'Moderate' && (
                        <>
                          <li>• Schedule immediate structural assessment</li>
                          <li>• Consider crack injection or sealing</li>
                          <li>• Implement continuous monitoring protocol</li>
                        </>
                      )}
                      {analysis.severity === 'Severe' && (
                        <>
                          <li>• URGENT: Professional structural engineer evaluation required</li>
                          <li>• Restrict access to affected area</li>
                          <li>• Implement temporary shoring if necessary</li>
                          <li>• Prepare detailed repair specifications</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              )}
              
              {!analysis && !loading && (
                <div className="text-center py-12 text-secondary-500">
                  <svg className="w-24 h-24 mx-auto mb-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>Upload structural image to initiate analysis</p>
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
