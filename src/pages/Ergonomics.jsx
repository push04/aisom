import React, { useState, useRef } from 'react'
import { analyzeStructuralDiagram } from '../utils/openrouterAPI'
import MediaCapture from '../components/MediaCapture'

const ROLLING_STOCK_DIMENSIONS = {
  BG: { name: 'Broad Gauge', width: 3250, height: 4265, bogie: 14785 },
  MG: { name: 'Metre Gauge', width: 2640, height: 3505, bogie: 12200 },
  EMU: { name: 'EMU Stock', width: 3200, height: 4025, bogie: 21336 }
}

function Ergonomics() {
  const [image, setImage] = useState(null)
  const [imageData, setImageData] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [context, setContext] = useState('')
  const [stockType, setStockType] = useState('BG')

  const handleMediaCapture = (captureData) => {
    setError(null)
    setAnalysis(null)
    setImage(true)
    setImageData(captureData.dataUrl)
  }
  
  const analyzeDiagram = async () => {
    if (!imageData) {
      setError('Please upload an image first')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const railwayContext = `This is a railway rolling stock geometry diagram for ${ROLLING_STOCK_DIMENSIONS[stockType].name} stock. Analyze bogie alignment, wheel spacing, loading gauge compliance, and structural geometry. ${context}`
      const result = await analyzeStructuralDiagram(imageData, railwayContext)
      setAnalysis(result)
      
      const analyses = JSON.parse(localStorage.getItem('recentAnalyses') || '[]')
      analyses.unshift({
        type: 'geometry',
        title: 'Rolling Stock Geometry Analysis',
        timestamp: new Date().toISOString(),
        data: { stockType }
      })
      localStorage.setItem('recentAnalyses', JSON.stringify(analyses.slice(0, 50)))
      
    } catch (err) {
      console.error('Analysis error:', err)
      setError(`Analysis failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-black p-6 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="module-header">
          <div>
            <h1 className="module-title">Rolling Stock Geometry Analyzer</h1>
            <p className="module-subtitle">AI-powered analysis of bogie alignment, wheel spacing, and loading gauge compliance</p>
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
              <h2 className="text-lg font-bold text-white">Diagram Upload</h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="rail-label">Rolling Stock Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(ROLLING_STOCK_DIMENSIONS).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => setStockType(key)}
                      className={`py-2 px-3 rounded-lg font-medium text-xs transition-all ${
                        stockType === key
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
                label="Upload Geometry Diagram"
              />
              
              <div className="mt-4">
                <label className="rail-label">Additional Context (Optional)</label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g., 'Coach bogie diagram', 'Wheel profile measurements', etc."
                  className="w-full bg-primary-900 text-white p-3 rounded-lg border border-primary-700 focus:border-white focus:outline-none resize-none"
                  rows={3}
                />
              </div>
              
              {imageData && (
                <div className="mt-4">
                  <button
                    onClick={analyzeDiagram}
                    disabled={loading}
                    className="w-full bg-white hover:bg-primary-200 text-black py-3 rounded-lg transition-all duration-200 font-semibold mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Analyzing...' : 'Analyze Diagram'}
                  </button>
                  
                  <div>
                    <h3 className="text-sm font-medium text-primary-400 uppercase tracking-wide mb-2">Uploaded Diagram</h3>
                    <div className="camera-frame">
                      <img src={imageData} alt="Geometry Diagram" className="w-full rounded" />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-6 p-4 bg-primary-900/50 rounded-lg border border-primary-700">
                <h3 className="font-medium text-white mb-2">Supported Diagrams:</h3>
                <ul className="text-sm text-primary-400 space-y-1">
                  <li>- Bogie frame drawings</li>
                  <li>- Wheel profile measurements</li>
                  <li>- Coach body cross-sections</li>
                  <li>- Loading gauge envelopes</li>
                  <li>- Suspension geometry diagrams</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="rail-card">
            <div className="p-6 border-b border-primary-800">
              <h2 className="text-lg font-bold text-white">AI Analysis Results</h2>
            </div>
            <div className="p-6 max-h-[800px] overflow-y-auto">
              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-2 border-white border-t-transparent mx-auto"></div>
                  <p className="mt-4 text-primary-400">Analyzing geometry diagram...</p>
                  <p className="mt-2 text-xs text-primary-600">This may take 10-30 seconds</p>
                </div>
              )}
              
              {analysis && !loading && (
                <div className="space-y-4">
                  <div className="p-4 bg-primary-900/50 rounded-lg border border-white/20">
                    <div className="flex items-center mb-3">
                      <svg className="w-5 h-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <h3 className="font-medium text-white">AI-Powered Analysis</h3>
                    </div>
                    <div className="text-sm text-primary-300 whitespace-pre-wrap leading-relaxed font-mono bg-primary-950 p-4 rounded border border-primary-800 max-h-[500px] overflow-y-auto">
                      {analysis}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-700">
                    <h3 className="font-medium text-white mb-3">Reference Dimensions</h3>
                    <div className="space-y-2 text-sm font-mono">
                      <div className="flex justify-between">
                        <span className="text-primary-500">Stock Type:</span>
                        <span className="text-white">{ROLLING_STOCK_DIMENSIONS[stockType].name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-primary-500">Max Width:</span>
                        <span className="text-white">{ROLLING_STOCK_DIMENSIONS[stockType].width} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-primary-500">Max Height:</span>
                        <span className="text-white">{ROLLING_STOCK_DIMENSIONS[stockType].height} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-primary-500">Bogie Center:</span>
                        <span className="text-white">{ROLLING_STOCK_DIMENSIONS[stockType].bogie} mm</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-primary-900 border border-primary-600 rounded-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-white mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <h4 className="font-medium text-white mb-1">Professional Disclaimer</h4>
                        <p className="text-xs text-primary-400">
                          AI-generated analysis is for preliminary assessment only. 
                          All rolling stock modifications must be verified by RDSO-approved design offices.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {!analysis && !loading && (
                <div className="text-center py-12">
                  <svg className="w-20 h-20 mx-auto mb-4 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-primary-500 mb-2">Upload a geometry diagram to begin AI analysis</p>
                  <p className="text-sm text-primary-600">Hand-drawn sketches and technical drawings supported</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Ergonomics
