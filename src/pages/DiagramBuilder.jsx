import React, { useState, useRef, useEffect } from 'react'
import { analyzeStructuralDiagram } from '../utils/openrouterAPI'
import { optimizeImageForAPI, validateImageSize } from '../utils/imageOptimization'
import { useToast } from '../components/Toast'

const ELEMENTS = {
  TRACK: 'track',
  STATION: 'station',
  JUNCTION: 'junction',
  BRIDGE: 'bridge',
  SIGNAL: 'signal',
  LEVEL_CROSSING: 'level_crossing',
  TURNOUT: 'turnout',
  CROSSOVER: 'crossover'
}

function DiagramBuilder() {
  const toast = useToast()
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [elements, setElements] = useState([])
  const [selectedTool, setSelectedTool] = useState(null)
  const [drawing, setDrawing] = useState(null)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [canvasReady, setCanvasReady] = useState(false)
  
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    
    if (!canvas || !container) return
    
    const initializeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = container.getBoundingClientRect()
      
      const width = rect.width || 800
      const height = 500
      
      canvas.width = width * dpr
      canvas.height = height * dpr
      
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      
      const ctx = canvas.getContext('2d')
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
      
      setCanvasReady(true)
    }
    
    initializeCanvas()
    
    const handleResize = () => initializeCanvas()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  useEffect(() => {
    if (canvasReady) drawCanvas()
  }, [elements, showGrid, canvasReady])
  
  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas || !canvasReady) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const dpr = window.devicePixelRatio || 1
    const width = canvas.width / dpr
    const height = canvas.height / dpr
    
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, width, height)
    
    if (showGrid) drawGrid(ctx, width, height)
    
    elements.forEach(element => drawElement(ctx, element))
  }
  
  const drawGrid = (ctx, width, height) => {
    const gridSize = 25
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 0.5
    
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }
  
  const drawElement = (ctx, element) => {
    ctx.save()
    
    switch (element.type) {
      case ELEMENTS.TRACK:
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(element.x1, element.y1)
        ctx.lineTo(element.x2, element.y2)
        ctx.stroke()
        
        ctx.strokeStyle = '#666666'
        ctx.lineWidth = 1
        const dx = element.x2 - element.x1
        const dy = element.y2 - element.y1
        const len = Math.sqrt(dx * dx + dy * dy)
        const perpX = -dy / len * 8
        const perpY = dx / len * 8
        
        for (let i = 0; i < len; i += 15) {
          const t = i / len
          const x = element.x1 + dx * t
          const y = element.y1 + dy * t
          ctx.beginPath()
          ctx.moveTo(x + perpX, y + perpY)
          ctx.lineTo(x - perpX, y - perpY)
          ctx.stroke()
        }
        break
        
      case ELEMENTS.STATION:
        ctx.fillStyle = '#333333'
        ctx.fillRect(element.x - 30, element.y - 15, 60, 30)
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.strokeRect(element.x - 30, element.y - 15, 60, 30)
        ctx.fillStyle = '#ffffff'
        ctx.font = '10px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('STN', element.x, element.y + 4)
        break
        
      case ELEMENTS.JUNCTION:
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(element.x, element.y, 12, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#000000'
        ctx.beginPath()
        ctx.arc(element.x, element.y, 6, 0, Math.PI * 2)
        ctx.fill()
        break
        
      case ELEMENTS.BRIDGE:
        ctx.strokeStyle = '#888888'
        ctx.lineWidth = 8
        ctx.beginPath()
        ctx.moveTo(element.x1, element.y1)
        ctx.lineTo(element.x2, element.y2)
        ctx.stroke()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.setLineDash([10, 5])
        ctx.beginPath()
        ctx.moveTo(element.x1, element.y1)
        ctx.lineTo(element.x2, element.y2)
        ctx.stroke()
        ctx.setLineDash([])
        break
        
      case ELEMENTS.SIGNAL:
        ctx.fillStyle = '#333333'
        ctx.fillRect(element.x - 4, element.y, 8, 25)
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(element.x, element.y - 8, 8, 0, Math.PI * 2)
        ctx.fill()
        break
        
      case ELEMENTS.LEVEL_CROSSING:
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(element.x - 20, element.y - 20)
        ctx.lineTo(element.x + 20, element.y + 20)
        ctx.moveTo(element.x + 20, element.y - 20)
        ctx.lineTo(element.x - 20, element.y + 20)
        ctx.stroke()
        break
        
      case ELEMENTS.TURNOUT:
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(element.x, element.y)
        ctx.lineTo(element.x + 40, element.y)
        ctx.moveTo(element.x + 10, element.y)
        ctx.lineTo(element.x + 40, element.y - 20)
        ctx.stroke()
        break
        
      case ELEMENTS.CROSSOVER:
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(element.x - 20, element.y - 15)
        ctx.lineTo(element.x + 20, element.y + 15)
        ctx.moveTo(element.x - 20, element.y + 15)
        ctx.lineTo(element.x + 20, element.y - 15)
        ctx.stroke()
        break
    }
    
    if (element.label) {
      ctx.fillStyle = '#888888'
      ctx.font = '11px monospace'
      ctx.fillText(element.label, (element.x || element.x1) + 15, (element.y || element.y1) - 5)
    }
    
    ctx.restore()
  }
  
  const handleCanvasMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    if (selectedTool) setDrawing({ x, y })
  }
  
  const handleCanvasMouseUp = (e) => {
    if (!drawing || !selectedTool) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const newElement = {
      id: Date.now(),
      type: selectedTool,
      x: drawing.x,
      y: drawing.y,
      x1: drawing.x,
      y1: drawing.y,
      x2: x,
      y2: y,
      label: ''
    }
    
    setElements([...elements, newElement])
    setDrawing(null)
  }
  
  const clearCanvas = () => {
    if (confirm('Clear all elements?')) {
      setElements([])
      setAiAnalysis(null)
    }
  }
  
  const exportImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'track-layout.png'
    link.href = canvas.toDataURL()
    link.click()
  }
  
  const analyzeWithAI = async () => {
    const canvas = canvasRef.current
    
    if (!canvas || elements.length === 0) {
      toast.warning('Please add some track elements first')
      return
    }
    
    setLoading(true)
    try {
      const optimizedImage = await optimizeImageForAPI(canvas, 800, 0.75)
      validateImageSize(optimizedImage, 1)
      
      const context = `This is a railway track layout diagram with: ${elements.map(e => e.type).join(', ')}. Analyze for operational efficiency, safety, and RDSO compliance.`
      const result = await analyzeStructuralDiagram(optimizedImage, context)
      setAiAnalysis(result)
      toast.success('AI analysis completed successfully')
    } catch (err) {
      console.error('Analysis error:', err)
      toast.error('AI analysis failed. Try simplifying the diagram or check your connection.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-black p-6 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="module-header">
          <div>
            <h1 className="module-title">Track Layout Designer</h1>
            <p className="module-subtitle">Design track layouts, junctions, and analyze railway infrastructure with AI</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="status-indicator online" />
            <span className="text-xs text-primary-500">ACTIVE</span>
          </div>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="rail-card">
            <div className="p-4 border-b border-primary-800">
              <h2 className="text-lg font-bold text-white">Track Elements</h2>
            </div>
            <div className="p-4 space-y-2">
              <div className="mb-3">
                <p className="text-xs font-medium text-primary-500 mb-2 uppercase tracking-wider">Infrastructure</p>
                {[
                  { key: ELEMENTS.TRACK, label: 'Track Section' },
                  { key: ELEMENTS.BRIDGE, label: 'Bridge' },
                  { key: ELEMENTS.STATION, label: 'Station' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTool(key)}
                    className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition mb-1 ${
                      selectedTool === key 
                        ? 'bg-white text-black' 
                        : 'bg-primary-900/50 text-primary-400 hover:bg-primary-800 border border-primary-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              
              <div className="mb-3">
                <p className="text-xs font-medium text-primary-500 mb-2 uppercase tracking-wider">Junctions</p>
                {[
                  { key: ELEMENTS.JUNCTION, label: 'Junction Point' },
                  { key: ELEMENTS.TURNOUT, label: 'Turnout' },
                  { key: ELEMENTS.CROSSOVER, label: 'Crossover' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTool(key)}
                    className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition mb-1 ${
                      selectedTool === key 
                        ? 'bg-white text-black' 
                        : 'bg-primary-900/50 text-primary-400 hover:bg-primary-800 border border-primary-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              
              <div className="mb-3">
                <p className="text-xs font-medium text-primary-500 mb-2 uppercase tracking-wider">Safety</p>
                {[
                  { key: ELEMENTS.SIGNAL, label: 'Signal' },
                  { key: ELEMENTS.LEVEL_CROSSING, label: 'Level Crossing' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTool(key)}
                    className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition mb-1 ${
                      selectedTool === key 
                        ? 'bg-white text-black' 
                        : 'bg-primary-900/50 text-primary-400 hover:bg-primary-800 border border-primary-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              
              <div className="pt-3 border-t border-primary-800 space-y-2">
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className="w-full py-2 px-3 rounded-lg text-sm font-medium bg-primary-900/50 text-primary-400 hover:bg-primary-800 border border-primary-800 transition"
                >
                  {showGrid ? 'Hide Grid' : 'Show Grid'}
                </button>
                <button
                  onClick={clearCanvas}
                  className="w-full py-2 px-3 rounded-lg text-sm font-medium bg-primary-900 text-white border border-primary-700 hover:bg-primary-800 transition"
                >
                  Clear All
                </button>
                <button
                  onClick={exportImage}
                  className="w-full py-2 px-3 rounded-lg text-sm font-medium bg-primary-800 text-white hover:bg-primary-700 transition"
                >
                  Export Image
                </button>
                <button
                  onClick={analyzeWithAI}
                  disabled={loading}
                  className="w-full py-2 px-3 rounded-lg text-sm font-medium bg-white text-black hover:bg-primary-200 transition disabled:opacity-50"
                >
                  {loading ? 'Analyzing...' : 'Analyze with AI'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-4 space-y-6">
            <div className="rail-card">
              <div className="p-4 border-b border-primary-800 flex justify-between items-center">
                <h2 className="text-lg font-bold text-white">Drawing Canvas</h2>
                <span className="text-xs text-primary-500">
                  {selectedTool ? `Selected: ${selectedTool}` : 'Select an element to start'}
                </span>
              </div>
              <div className="p-4" ref={containerRef}>
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseUp={handleCanvasMouseUp}
                  className="rounded-lg cursor-crosshair border border-primary-800"
                />
              </div>
            </div>
            
            {aiAnalysis && (
              <div className="rail-card">
                <div className="p-4 border-b border-primary-800">
                  <h2 className="text-lg font-bold text-white">AI Layout Analysis</h2>
                </div>
                <div className="p-4">
                  <div className="p-4 bg-primary-900/50 rounded-lg border border-white/20">
                    <div className="text-sm text-primary-300 whitespace-pre-wrap leading-relaxed font-mono max-h-[300px] overflow-y-auto">
                      {aiAnalysis}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="rail-card p-4">
              <h3 className="text-sm font-medium text-primary-500 mb-2 uppercase tracking-wider">Quick Tips</h3>
              <div className="grid grid-cols-3 gap-4 text-xs text-primary-400">
                <div>1. Select an element from the left panel</div>
                <div>2. Click and drag on the canvas to place it</div>
                <div>3. Click "Analyze with AI" for RDSO compliance check</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DiagramBuilder
