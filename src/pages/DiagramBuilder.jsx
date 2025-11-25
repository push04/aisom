import React, { useState, useRef, useEffect } from 'react'
import { analyzeStructuralDiagram } from '../utils/openrouterAPI'
import { optimizeImageForAPI, validateImageSize } from '../utils/imageOptimization'

const ELEMENTS = {
  BEAM: 'beam',
  COLUMN: 'column',
  SUPPORT_FIXED: 'support_fixed',
  SUPPORT_PINNED: 'support_pinned',
  SUPPORT_ROLLER: 'support_roller',
  LOAD_POINT: 'load_point',
  LOAD_DISTRIBUTED: 'load_distributed',
  MOMENT: 'moment',
  PULLEY: 'pulley',
  CABLE: 'cable',
  SPRING: 'spring'
}

function DiagramBuilder() {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [elements, setElements] = useState([])
  const [selectedTool, setSelectedTool] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [drawing, setDrawing] = useState(null)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [scale, setScale] = useState(1)
  const [canvasReady, setCanvasReady] = useState(false)
  
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    
    if (!canvas || !container) return
    
    const initializeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = container.getBoundingClientRect()
      
      const width = rect.width || 800
      const height = 600
      
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
    
    const handleResize = () => {
      initializeCanvas()
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  useEffect(() => {
    if (canvasReady) {
      drawCanvas()
    }
  }, [elements, showGrid, scale, canvasReady])
  
  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas || !canvasReady) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const dpr = window.devicePixelRatio || 1
    const width = canvas.width / dpr
    const height = canvas.height / dpr
    
    ctx.clearRect(0, 0, width, height)
    
    if (showGrid) {
      drawGrid(ctx, width, height)
    }
    
    elements.forEach(element => {
      drawElement(ctx, element)
    })
  }
  
  const drawGrid = (ctx, width, height) => {
    const gridSize = 20 * scale
    ctx.strokeStyle = '#2a3f54'
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
      case ELEMENTS.BEAM:
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.moveTo(element.x1, element.y1)
        ctx.lineTo(element.x2, element.y2)
        ctx.stroke()
        break
        
      case ELEMENTS.COLUMN:
        ctx.strokeStyle = '#10b981'
        ctx.lineWidth = 8
        ctx.beginPath()
        ctx.moveTo(element.x, element.y)
        ctx.lineTo(element.x, element.y + element.height)
        ctx.stroke()
        break
        
      case ELEMENTS.SUPPORT_FIXED:
        drawFixedSupport(ctx, element.x, element.y)
        break
        
      case ELEMENTS.SUPPORT_PINNED:
        drawPinnedSupport(ctx, element.x, element.y)
        break
        
      case ELEMENTS.SUPPORT_ROLLER:
        drawRollerSupport(ctx, element.x, element.y)
        break
        
      case ELEMENTS.LOAD_POINT:
        drawPointLoad(ctx, element.x, element.y, element.magnitude)
        break
        
      case ELEMENTS.LOAD_DISTRIBUTED:
        drawDistributedLoad(ctx, element.x1, element.y1, element.x2, element.y2, element.magnitude)
        break
        
      case ELEMENTS.MOMENT:
        drawMoment(ctx, element.x, element.y, element.magnitude, element.clockwise)
        break
        
      case ELEMENTS.PULLEY:
        drawPulley(ctx, element.x, element.y, element.radius)
        break
        
      case ELEMENTS.CABLE:
        ctx.strokeStyle = '#fbbf24'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(element.x1, element.y1)
        ctx.lineTo(element.x2, element.y2)
        ctx.stroke()
        ctx.setLineDash([])
        break
        
      case ELEMENTS.SPRING:
        drawSpring(ctx, element.x1, element.y1, element.x2, element.y2)
        break
    }
    
    if (element.label) {
      ctx.fillStyle = '#fff'
      ctx.font = '12px monospace'
      ctx.fillText(element.label, element.x || element.x1, (element.y || element.y1) - 10)
    }
    
    ctx.restore()
  }
  
  const drawFixedSupport = (ctx, x, y) => {
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x - 15, y + 25)
    ctx.lineTo(x + 15, y + 25)
    ctx.closePath()
    ctx.fill()
    
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.moveTo(x - 15 + i * 7.5, y + 25)
      ctx.lineTo(x - 20 + i * 7.5, y + 30)
      ctx.stroke()
    }
  }
  
  const drawPinnedSupport = (ctx, x, y) => {
    ctx.fillStyle = '#8b5cf6'
    ctx.beginPath()
    ctx.arc(x, y, 8, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.strokeStyle = '#8b5cf6'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x - 15, y + 25)
    ctx.lineTo(x + 15, y + 25)
    ctx.closePath()
    ctx.stroke()
  }
  
  const drawRollerSupport = (ctx, x, y) => {
    ctx.strokeStyle = '#06b6d4'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x - 15, y + 20)
    ctx.lineTo(x + 15, y + 20)
    ctx.closePath()
    ctx.stroke()
    
    ctx.fillStyle = '#06b6d4'
    ctx.beginPath()
    ctx.arc(x - 10, y + 25, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x + 10, y + 25, 5, 0, Math.PI * 2)
    ctx.fill()
  }
  
  const drawPointLoad = (ctx, x, y, magnitude) => {
    ctx.strokeStyle = '#f59e0b'
    ctx.fillStyle = '#f59e0b'
    ctx.lineWidth = 3
    
    ctx.beginPath()
    ctx.moveTo(x, y - 50)
    ctx.lineTo(x, y)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x - 8, y - 15)
    ctx.lineTo(x + 8, y - 15)
    ctx.closePath()
    ctx.fill()
    
    if (magnitude) {
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 14px monospace'
      ctx.fillText(`${magnitude} kN`, x + 10, y - 25)
    }
  }
  
  const drawDistributedLoad = (ctx, x1, y1, x2, y2, magnitude) => {
    ctx.strokeStyle = '#ec4899'
    ctx.fillStyle = '#ec4899'
    ctx.lineWidth = 2
    
    const steps = 10
    const dx = (x2 - x1) / steps
    
    for (let i = 0; i <= steps; i++) {
      const x = x1 + dx * i
      ctx.beginPath()
      ctx.moveTo(x, y1 - 40)
      ctx.lineTo(x, y1)
      ctx.stroke()
      
      ctx.beginPath()
      ctx.moveTo(x, y1)
      ctx.lineTo(x - 5, y1 - 10)
      ctx.lineTo(x + 5, y1 - 10)
      ctx.closePath()
      ctx.fill()
    }
    
    ctx.beginPath()
    ctx.moveTo(x1, y1 - 40)
    ctx.lineTo(x2, y2 - 40)
    ctx.stroke()
    
    if (magnitude) {
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 12px monospace'
      ctx.fillText(`${magnitude} kN/m`, (x1 + x2) / 2, y1 - 45)
    }
  }
  
  const drawMoment = (ctx, x, y, magnitude, clockwise = true) => {
    ctx.strokeStyle = '#14b8a6'
    ctx.lineWidth = 3
    
    const radius = 20
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 1.5)
    ctx.stroke()
    
    const arrowX = x + radius * Math.cos(Math.PI * 1.5)
    const arrowY = y + radius * Math.sin(Math.PI * 1.5)
    
    ctx.beginPath()
    ctx.moveTo(arrowX, arrowY)
    ctx.lineTo(arrowX - 8, arrowY - 8)
    ctx.lineTo(arrowX + 8, arrowY - 8)
    ctx.closePath()
    ctx.fill()
    
    if (magnitude) {
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 12px monospace'
      ctx.fillText(`${magnitude} kNm`, x + 25, y)
    }
  }
  
  const drawPulley = (ctx, x, y, radius = 20) => {
    ctx.strokeStyle = '#a855f7'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.arc(x, y, radius / 3, 0, Math.PI * 2)
    ctx.stroke()
  }
  
  const drawSpring = (ctx, x1, y1, x2, y2) => {
    ctx.strokeStyle = '#f97316'
    ctx.lineWidth = 2
    
    const coils = 8
    const amplitude = 10
    const dx = x2 - x1
    const dy = y2 - y1
    const length = Math.sqrt(dx * dx + dy * dy)
    
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    
    for (let i = 0; i <= coils; i++) {
      const t = i / coils
      const x = x1 + dx * t
      const y = y1 + dy * t
      const offset = Math.sin(i * Math.PI) * amplitude
      const perpX = -dy / length * offset
      const perpY = dx / length * offset
      ctx.lineTo(x + perpX, y + perpY)
    }
    
    ctx.stroke()
  }
  
  const handleCanvasMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    if (selectedTool) {
      setDrawing({ x, y })
    }
  }
  
  const handleCanvasMouseMove = (e) => {
    if (!drawing) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const tempCanvas = canvasRef.current
    const ctx = tempCanvas.getContext('2d')
    
    drawCanvas()
    
    const tempElement = { ...drawing, x2: x, y2: y, type: selectedTool }
    drawElement(ctx, tempElement)
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
    }
    
    if ([ELEMENTS.LOAD_POINT, ELEMENTS.MOMENT, ELEMENTS.PULLEY].includes(selectedTool)) {
      newElement.magnitude = prompt('Enter magnitude (e.g., 50):') || '10'
    }
    
    if (selectedTool === ELEMENTS.LOAD_DISTRIBUTED) {
      newElement.magnitude = prompt('Enter distributed load (e.g., 20):') || '10'
    }
    
    if (selectedTool === ELEMENTS.COLUMN) {
      newElement.height = Math.abs(y - drawing.y) || 100
    }
    
    if (selectedTool === ELEMENTS.PULLEY) {
      newElement.radius = 20
    }
    
    newElement.label = prompt('Add label (optional):') || ''
    
    setElements([...elements, newElement])
    setDrawing(null)
  }
  
  const handleTouchStart = (e) => {
    e.preventDefault()
    const touch = e.touches[0]
    const rect = canvasRef.current.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    
    if (selectedTool) {
      setDrawing({ x, y })
    }
  }
  
  const handleTouchMove = (e) => {
    e.preventDefault()
    if (!drawing) return
    
    const touch = e.touches[0]
    const rect = canvasRef.current.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    
    const tempCanvas = canvasRef.current
    const ctx = tempCanvas.getContext('2d')
    
    drawCanvas()
    
    const tempElement = { ...drawing, x2: x, y2: y, type: selectedTool }
    drawElement(ctx, tempElement)
  }
  
  const handleTouchEnd = (e) => {
    e.preventDefault()
    if (!drawing || !selectedTool) return
    
    const touch = e.changedTouches[0]
    const rect = canvasRef.current.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    
    const newElement = {
      id: Date.now(),
      type: selectedTool,
      x: drawing.x,
      y: drawing.y,
      x1: drawing.x,
      y1: drawing.y,
      x2: x,
      y2: y,
    }
    
    if ([ELEMENTS.LOAD_POINT, ELEMENTS.MOMENT, ELEMENTS.PULLEY].includes(selectedTool)) {
      newElement.magnitude = prompt('Enter magnitude (e.g., 50):') || '10'
    }
    
    if (selectedTool === ELEMENTS.LOAD_DISTRIBUTED) {
      newElement.magnitude = prompt('Enter distributed load (e.g., 20):') || '10'
    }
    
    if (selectedTool === ELEMENTS.COLUMN) {
      newElement.height = Math.abs(y - drawing.y) || 100
    }
    
    if (selectedTool === ELEMENTS.PULLEY) {
      newElement.radius = 20
    }
    
    newElement.label = prompt('Add label (optional):') || ''
    
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
    if (!canvas) {
      alert('No diagram to export')
      return
    }
    const link = document.createElement('a')
    link.download = 'structural-diagram.png'
    link.href = canvas.toDataURL()
    link.click()
  }
  
  const analyzeWithAI = async () => {
    const canvas = canvasRef.current
    
    if (!canvas) {
      alert('Canvas not available. Please draw some elements first.')
      return
    }
    
    if (elements.length === 0) {
      alert('Please add some structural elements to analyze.')
      return
    }
    
    setLoading(true)
    try {
      const optimizedImage = await optimizeImageForAPI(canvas, 800, 0.75)
      
      validateImageSize(optimizedImage, 1)
      
      const context = `This is a structural diagram created with the following elements: ${elements.map(e => e.type).join(', ')}`
      const result = await analyzeStructuralDiagram(optimizedImage, context)
      setAiAnalysis(result)
    } catch (err) {
      console.error('Analysis error:', err)
      const message = err.message.includes('OpenRouter') || err.message.includes('API') 
        ? 'AI analysis is only available when deployed to Netlify with proper API configuration. Local crack detection and calculations work without AI.'
        : `Analysis failed: ${err.message}. Try using fewer elements or simplifying the diagram.`
      alert(message)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-primary-950 pb-16">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Railway Asset Layout Designer</h1>
          <p className="text-sm sm:text-base text-secondary-300">Design track layouts, junctions, bridges, and analyze railway infrastructure with AI</p>
          
          <div className="mt-4 bg-accent/10 border border-accent/30 rounded-lg p-4">
            <h3 className="text-lg font-bold text-accent mb-2">📘 Quick Start Guide</h3>
            <ol className="text-sm text-secondary-200 space-y-1 list-decimal list-inside">
              <li><strong>Select an element</strong> from the left panel (Beam, Column, Load, etc.)</li>
              <li><strong>Click and drag</strong> on the canvas to draw it</li>
              <li><strong>Add labels</strong> when prompted (optional)</li>
              <li><strong>Repeat</strong> to build your complete structural diagram</li>
              <li><strong>Click "Analyze with AI"</strong> for structural insights (requires Netlify deployment)</li>
            </ol>
            <p className="text-xs text-secondary-400 mt-3">💡 <strong>Tip:</strong> Start with beams and columns, then add supports at connection points, followed by loads.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-primary-900 rounded-lg shadow-lg border border-primary-800 p-4">
              <h2 className="text-lg font-bold text-white mb-4">Elements</h2>
              
              <div className="space-y-2">
                <div className="mb-3">
                  <p className="text-xs font-semibold text-secondary-400 mb-2">STRUCTURAL</p>
                  <button
                    onClick={() => setSelectedTool(ELEMENTS.BEAM)}
                    className={`w-full py-2 px-3 rounded text-sm font-medium transition ${selectedTool === ELEMENTS.BEAM ? 'bg-accent text-white' : 'bg-primary-800 text-secondary-300 hover:bg-primary-700'}`}
                  >
                    Beam
                  </button>
                  <button
                    onClick={() => setSelectedTool(ELEMENTS.COLUMN)}
                    className={`w-full mt-2 py-2 px-3 rounded text-sm font-medium transition ${selectedTool === ELEMENTS.COLUMN ? 'bg-accent text-white' : 'bg-primary-800 text-secondary-300 hover:bg-primary-700'}`}
                  >
                    Column
                  </button>
                </div>
                
                <div className="mb-3">
                  <p className="text-xs font-semibold text-secondary-400 mb-2">SUPPORTS</p>
                  <button
                    onClick={() => setSelectedTool(ELEMENTS.SUPPORT_FIXED)}
                    className={`w-full py-2 px-3 rounded text-sm font-medium transition ${selectedTool === ELEMENTS.SUPPORT_FIXED ? 'bg-accent text-white' : 'bg-primary-800 text-secondary-300 hover:bg-primary-700'}`}
                  >
                    Fixed
                  </button>
                  <button
                    onClick={() => setSelectedTool(ELEMENTS.SUPPORT_PINNED)}
                    className={`w-full mt-2 py-2 px-3 rounded text-sm font-medium transition ${selectedTool === ELEMENTS.SUPPORT_PINNED ? 'bg-accent text-white' : 'bg-primary-800 text-secondary-300 hover:bg-primary-700'}`}
                  >
                    Pinned
                  </button>
                  <button
                    onClick={() => setSelectedTool(ELEMENTS.SUPPORT_ROLLER)}
                    className={`w-full mt-2 py-2 px-3 rounded text-sm font-medium transition ${selectedTool === ELEMENTS.SUPPORT_ROLLER ? 'bg-accent text-white' : 'bg-primary-800 text-secondary-300 hover:bg-primary-700'}`}
                  >
                    Roller
                  </button>
                </div>
                
                <div className="mb-3">
                  <p className="text-xs font-semibold text-secondary-400 mb-2">LOADS</p>
                  <button
                    onClick={() => setSelectedTool(ELEMENTS.LOAD_POINT)}
                    className={`w-full py-2 px-3 rounded text-sm font-medium transition ${selectedTool === ELEMENTS.LOAD_POINT ? 'bg-accent text-white' : 'bg-primary-800 text-secondary-300 hover:bg-primary-700'}`}
                  >
                    Point Load
                  </button>
                  <button
                    onClick={() => setSelectedTool(ELEMENTS.LOAD_DISTRIBUTED)}
                    className={`w-full mt-2 py-2 px-3 rounded text-sm font-medium transition ${selectedTool === ELEMENTS.LOAD_DISTRIBUTED ? 'bg-accent text-white' : 'bg-primary-800 text-secondary-300 hover:bg-primary-700'}`}
                  >
                    Distributed Load
                  </button>
                  <button
                    onClick={() => setSelectedTool(ELEMENTS.MOMENT)}
                    className={`w-full mt-2 py-2 px-3 rounded text-sm font-medium transition ${selectedTool === ELEMENTS.MOMENT ? 'bg-accent text-white' : 'bg-primary-800 text-secondary-300 hover:bg-primary-700'}`}
                  >
                    Moment
                  </button>
                </div>
                
                <div className="mb-3">
                  <p className="text-xs font-semibold text-secondary-400 mb-2">MECHANISMS</p>
                  <button
                    onClick={() => setSelectedTool(ELEMENTS.PULLEY)}
                    className={`w-full py-2 px-3 rounded text-sm font-medium transition ${selectedTool === ELEMENTS.PULLEY ? 'bg-accent text-white' : 'bg-primary-800 text-secondary-300 hover:bg-primary-700'}`}
                  >
                    Pulley
                  </button>
                  <button
                    onClick={() => setSelectedTool(ELEMENTS.CABLE)}
                    className={`w-full mt-2 py-2 px-3 rounded text-sm font-medium transition ${selectedTool === ELEMENTS.CABLE ? 'bg-accent text-white' : 'bg-primary-800 text-secondary-300 hover:bg-primary-700'}`}
                  >
                    Cable
                  </button>
                  <button
                    onClick={() => setSelectedTool(ELEMENTS.SPRING)}
                    className={`w-full mt-2 py-2 px-3 rounded text-sm font-medium transition ${selectedTool === ELEMENTS.SPRING ? 'bg-accent text-white' : 'bg-primary-800 text-secondary-300 hover:bg-primary-700'}`}
                  >
                    Spring
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-primary-900 rounded-lg shadow-lg border border-primary-800 p-4">
              <h2 className="text-lg font-bold text-white mb-4">Controls</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className="w-full py-2 px-3 rounded text-sm font-medium bg-primary-800 text-secondary-300 hover:bg-primary-700 transition"
                >
                  {showGrid ? 'Hide Grid' : 'Show Grid'}
                </button>
                <button
                  onClick={clearCanvas}
                  className="w-full py-2 px-3 rounded text-sm font-medium bg-danger text-white hover:opacity-90 transition"
                >
                  Clear All
                </button>
                <button
                  onClick={exportImage}
                  className="w-full py-2 px-3 rounded text-sm font-medium bg-success text-white hover:opacity-90 transition"
                >
                  Export PNG
                </button>
                <button
                  onClick={analyzeWithAI}
                  disabled={loading || elements.length === 0}
                  className="w-full py-2 px-3 rounded text-sm font-medium bg-accent text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Analyzing...' : 'AI Analysis'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-3">
            <div className="bg-primary-900 rounded-lg shadow-lg border border-primary-800 p-4 mb-6">
              <h2 className="text-lg font-bold text-white mb-4">Drawing Canvas</h2>
              <div ref={containerRef} className="bg-primary-950 rounded overflow-hidden border-2 border-primary-700">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="cursor-crosshair w-full block"
                  style={{ touchAction: 'none' }}
                />
              </div>
              <p className="text-xs text-secondary-500 mt-2">
                {selectedTool ? `Selected: ${selectedTool.replace('_', ' ').toUpperCase()} - Click and drag to draw` : 'Select an element from the left panel to get started'}
              </p>
            </div>
            
            {aiAnalysis && (
              <div className="bg-primary-900 rounded-lg shadow-lg border border-primary-800 p-4">
                <h2 className="text-lg font-bold text-white mb-4">AI Analysis Results</h2>
                <div className="bg-gradient-to-br from-accent/5 to-accent/10 p-4 rounded-lg border border-accent/30">
                  <div className="text-sm text-secondary-200 whitespace-pre-wrap leading-relaxed font-mono max-h-[400px] overflow-y-auto">
                    {aiAnalysis}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DiagramBuilder
