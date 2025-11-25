import React, { useState, useRef } from 'react'
import { analyzeStructuralDiagram } from '../utils/openrouterAPI'

function Ergonomics() {
  const [image, setImage] = useState(null)
  const [imageData, setImageData] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [context, setContext] = useState('')
  const fileInputRef = useRef(null)
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file')
      return
    }
    
    setError(null)
    setAnalysis(null)
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        setImage(img)
        setImageData(event.target.result)
      }
      img.onerror = () => {
        setError('Failed to load image. Please try a different file.')
      }
      img.src = event.target.result
    }
    reader.onerror = () => {
      setError('Failed to read file. Please try again.')
    }
    reader.readAsDataURL(file)
  }
  
  const analyzeDiagram = async () => {
    if (!imageData) {
      setError('Please upload an image first')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await analyzeStructuralDiagram(imageData, context)
      setAnalysis(result)
      
      const analyses = JSON.parse(localStorage.getItem('recentAnalyses') || '[]')
      analyses.unshift({
        type: 'diagram',
        title: 'Structural Diagram Analysis',
        timestamp: new Date().toISOString(),
        data: { hasContext: !!context }
      })
      localStorage.setItem('recentAnalyses', JSON.stringify(analyses.slice(0, 50)))
      
    } catch (err) {
      console.error('Analysis error:', err)
      setError(`Analysis failed: ${err.message}. Please check your API configuration.`)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-primary-950 pb-16">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Rolling Stock Geometry Analyzer</h1>
          <p className="text-sm sm:text-base text-secondary-300">AI-powered analysis of bogie alignment, wheel spacing, and loading gauge compliance</p>
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
              <h2 className="text-lg sm:text-xl font-bold text-white">Diagram Upload</h2>
            </div>
            
            <div className="p-4 sm:p-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current.click()}
                className="w-full bg-accent hover:bg-accent-hover text-white py-3 rounded-lg transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 mb-4"
              >
                Upload Structural Diagram
              </button>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-white mb-2">
                  Additional Context (Optional)
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g., 'This is a simply supported beam with a point load at midspan' or 'Specify material properties, load units, etc.'"
                  className="w-full bg-primary-800 text-white p-3 rounded-lg border border-primary-700 focus:border-accent focus:outline-none resize-none"
                  rows={3}
                />
                <p className="text-xs text-secondary-500 mt-1">
                  Provide additional information to improve analysis accuracy
                </p>
              </div>
              
              {imageData && (
                <>
                  <button
                    onClick={analyzeDiagram}
                    disabled={loading}
                    className="w-full bg-success hover:opacity-90 text-white py-3 rounded-lg transition-all duration-200 font-semibold mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Analyzing...' : 'Analyze Diagram'}
                  </button>
                  
                  <div>
                    <h3 className="font-semibold text-white mb-2 text-xs sm:text-sm uppercase tracking-wide">Uploaded Diagram</h3>
                    <div className="bg-primary-800 p-2 rounded">
                      <img src={imageData} alt="Structural Diagram" className="w-full rounded" />
                    </div>
                  </div>
                </>
              )}
              
              <div className="mt-6 bg-primary-800/50 p-4 rounded-lg border border-primary-700">
                <h3 className="font-semibold text-white mb-2 text-sm">Supported Diagrams:</h3>
                <ul className="text-xs sm:text-sm text-secondary-300 space-y-1">
                  <li>• Hand-drawn structural sketches</li>
                  <li>• Beam, truss, and frame diagrams</li>
                  <li>• Load and support configurations</li>
                  <li>• Free body diagrams (FBD)</li>
                  <li>• Shear force and bending moment diagrams</li>
                  <li>• Structural details and connections</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-primary-900 rounded-lg shadow-lg border border-primary-800">
            <div className="px-4 sm:px-6 py-4 border-b border-primary-800">
              <h2 className="text-lg sm:text-xl font-bold text-white">AI Analysis Results</h2>
            </div>
            
            <div className="p-4 sm:p-6 max-h-[800px] overflow-y-auto">
              {loading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent border-t-transparent mx-auto"></div>
                  <p className="mt-4 text-secondary-400">Analyzing structural diagram...</p>
                  <p className="mt-2 text-xs text-secondary-500">This may take 10-30 seconds</p>
                </div>
              )}
              
              {analysis && !loading && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-accent/5 to-accent/10 p-4 rounded-lg border border-accent/30">
                    <div className="flex items-center mb-3">
                      <svg className="w-5 h-5 text-accent mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <h3 className="font-semibold text-white text-sm uppercase">AI-Powered Structural Analysis</h3>
                    </div>
                    <div className="text-sm text-secondary-200 whitespace-pre-wrap leading-relaxed font-mono bg-primary-950/50 p-4 rounded border border-primary-700 max-h-[600px] overflow-y-auto">
                      {analysis}
                    </div>
                  </div>
                  
                  <div className="bg-primary-800/50 p-4 rounded border border-primary-700">
                    <h3 className="font-semibold mb-2 text-white text-sm uppercase">Analysis Tips</h3>
                    <ul className="text-xs sm:text-sm text-secondary-300 space-y-1">
                      <li>• Review all identified structural elements for accuracy</li>
                      <li>• Verify load magnitudes and positions</li>
                      <li>• Check support conditions and boundary constraints</li>
                      <li>• Validate calculated reactions and moments</li>
                      <li>• Use this as a preliminary analysis - always verify with manual calculations</li>
                      <li>• For critical structures, consult a licensed structural engineer</li>
                    </ul>
                  </div>
                  
                  <div className="bg-warning/5 border border-warning/30 p-4 rounded">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-warning mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <h4 className="font-semibold text-warning mb-1 text-sm">Professional Disclaimer</h4>
                        <p className="text-xs text-secondary-300">
                          AI-generated analysis is for educational and preliminary design purposes only. 
                          All structural designs must be reviewed and stamped by a licensed professional engineer 
                          before construction or implementation.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {!analysis && !loading && (
                <div className="text-center py-12 text-secondary-500">
                  <svg className="w-20 sm:w-24 h-20 sm:h-24 mx-auto mb-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm sm:text-base">Upload a structural diagram to begin AI analysis</p>
                  <p className="text-xs sm:text-sm mt-2 text-secondary-600">Hand-drawn sketches and digital diagrams supported</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-primary-900 rounded-lg shadow-lg border border-primary-800 p-6">
          <h3 className="text-xl font-bold text-white mb-4">How to Get Best Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-primary-800 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="bg-accent/20 p-2 rounded mr-3">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <h4 className="font-semibold text-white">Clear Diagram</h4>
              </div>
              <p className="text-sm text-secondary-300">
                Draw clearly with good contrast. Label all loads, dimensions, and supports.
              </p>
            </div>
            
            <div className="bg-primary-800 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="bg-accent/20 p-2 rounded mr-3">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-white">Include Annotations</h4>
              </div>
              <p className="text-sm text-secondary-300">
                Add dimensions, load values, material properties, and support types.
              </p>
            </div>
            
            <div className="bg-primary-800 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="bg-accent/20 p-2 rounded mr-3">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-white">Add Context</h4>
              </div>
              <p className="text-sm text-secondary-300">
                Provide additional information in the context field for better analysis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Ergonomics
