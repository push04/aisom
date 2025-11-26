import React, { useState, useRef } from 'react'
import MediaCapture from '../components/MediaCapture'
import { detectCracks } from '../utils/imageProcessing'
import { ParticleDetector } from '../utils/motionDetection'

const BALLAST_SPECS = {
  material: 'Crusite Stone (Hard Trap/Granite)',
  size: { min: 25, max: 65, unit: 'mm' },
  depth: { main: 300, shoulder: 150, unit: 'mm' },
  slope: '1:1.5 to 1:2',
  density: '1600-1800 kg/m3'
}

const QUALITY_PARAMETERS = {
  gradation: { excellent: 95, good: 85, fair: 70, poor: 50 },
  angularity: { angular: 95, subAngular: 80, rounded: 50 },
  cleanliness: { clean: 95, slightlyDirty: 75, dirty: 50, fouled: 20 }
}

function BallastAnalyzer() {
  const [image, setImage] = useState(null)
  const [imageData, setImageData] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const canvasRef = useRef(null)
  const particleDetectorRef = useRef(new ParticleDetector())

  const handleMediaCapture = (captureData) => {
    setError(null)
    setAnalysis(null)
    
    const img = new Image()
    img.onload = () => {
      setImage(img)
      setImageData(captureData.dataUrl)
      analyzeBallast(img, captureData.dataUrl)
    }
    img.onerror = () => setError('Failed to load captured image')
    img.src = captureData.dataUrl
  }

  const analyzeBallast = async (img, base64Data) => {
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
      const defects = detectCracks(imageDataObj, 'low')

      if (defects.processedImageData) {
        ctx.putImageData(defects.processedImageData, 0, 0)
      }

      const sizeAnalysis = analyzeBallastSize(particles)
      const cleanlinessAnalysis = analyzeCleanlines(imageDataObj, defects)
      const shapeAnalysis = analyzeShape(particles)
      const qualityScore = calculateQualityScore(sizeAnalysis, cleanlinessAnalysis, shapeAnalysis)
      const foulingIndex = calculateFoulingIndex(cleanlinessAnalysis, particles)

      const analysisResult = {
        sizeAnalysis,
        cleanlinessAnalysis,
        shapeAnalysis,
        qualityScore,
        qualityGrade: getQualityGrade(qualityScore),
        foulingIndex,
        particleCount: particles.particleCount,
        recommendations: generateBallastRecommendations(qualityScore, foulingIndex, cleanlinessAnalysis),
        timestamp: new Date().toISOString()
      }

      setAnalysis(analysisResult)

      const analyses = JSON.parse(localStorage.getItem('recentAnalyses') || '[]')
      analyses.unshift({
        type: 'ballast',
        title: 'Ballast Quality Scan',
        timestamp: new Date().toISOString(),
        data: { grade: analysisResult.qualityGrade, foulingIndex }
      })
      localStorage.setItem('recentAnalyses', JSON.stringify(analyses.slice(0, 50)))

    } catch (err) {
      console.error('Ballast analysis error:', err)
      setError(`Analysis failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const analyzeBallastSize = (particles) => {
    const avgSize = particles.particles?.length > 0 
      ? particles.particles.reduce((sum, p) => sum + p.size, 0) / particles.particles.length 
      : 0
    
    const estimatedMM = (avgSize / 10) + 20
    
    let gradation = 'Excellent'
    if (estimatedMM < BALLAST_SPECS.size.min || estimatedMM > BALLAST_SPECS.size.max) {
      gradation = 'Poor'
    } else if (estimatedMM < 30 || estimatedMM > 55) {
      gradation = 'Fair'
    } else if (estimatedMM < 35 || estimatedMM > 50) {
      gradation = 'Good'
    }
    
    return {
      estimatedSize: estimatedMM.toFixed(1),
      gradation,
      withinSpec: estimatedMM >= BALLAST_SPECS.size.min && estimatedMM <= BALLAST_SPECS.size.max
    }
  }

  const analyzeCleanlines = (imageData, defects) => {
    const data = imageData.data
    let darkPixels = 0
    
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
      if (brightness < 80) darkPixels++
    }
    
    const darkPercentage = (darkPixels / (data.length / 4)) * 100
    const finesPercentage = (defects.crackPixels / defects.totalPixels) * 100
    
    let status = 'Clean'
    if (darkPercentage > 40 || finesPercentage > 10) {
      status = 'Fouled'
    } else if (darkPercentage > 25 || finesPercentage > 5) {
      status = 'Dirty'
    } else if (darkPercentage > 15 || finesPercentage > 2) {
      status = 'Slightly Dirty'
    }
    
    return {
      status,
      darkPercentage: darkPercentage.toFixed(1),
      finesPercentage: finesPercentage.toFixed(2)
    }
  }

  const analyzeShape = (particles) => {
    const avgAspectRatio = particles.particles?.length > 0
      ? particles.particles.reduce((sum, p) => {
          const ratio = p.boundingBox ? p.boundingBox.width / Math.max(p.boundingBox.height, 1) : 1
          return sum + ratio
        }, 0) / particles.particles.length
      : 1
    
    let shape = 'Angular'
    if (avgAspectRatio > 2) shape = 'Elongated'
    else if (avgAspectRatio < 0.5) shape = 'Flat'
    else if (avgAspectRatio > 0.8 && avgAspectRatio < 1.2) shape = 'Rounded'
    else if (avgAspectRatio > 0.6 && avgAspectRatio < 1.5) shape = 'Sub-Angular'
    
    return {
      shape,
      aspectRatio: avgAspectRatio.toFixed(2),
      angularityScore: shape === 'Angular' ? 95 : shape === 'Sub-Angular' ? 80 : 50
    }
  }

  const calculateQualityScore = (size, cleanliness, shape) => {
    let score = 100
    
    if (size.gradation === 'Poor') score -= 30
    else if (size.gradation === 'Fair') score -= 15
    else if (size.gradation === 'Good') score -= 5
    
    if (cleanliness.status === 'Fouled') score -= 40
    else if (cleanliness.status === 'Dirty') score -= 25
    else if (cleanliness.status === 'Slightly Dirty') score -= 10
    
    if (shape.shape === 'Rounded') score -= 20
    else if (shape.shape === 'Flat' || shape.shape === 'Elongated') score -= 15
    
    return Math.max(0, score)
  }

  const getQualityGrade = (score) => {
    if (score >= 85) return 'A - Excellent'
    if (score >= 70) return 'B - Good'
    if (score >= 50) return 'C - Fair'
    if (score >= 30) return 'D - Poor'
    return 'E - Requires Replacement'
  }

  const calculateFoulingIndex = (cleanliness, particles) => {
    const fines = parseFloat(cleanliness.finesPercentage)
    const dark = parseFloat(cleanliness.darkPercentage)
    
    const fi = (fines * 2 + dark * 0.5).toFixed(1)
    
    let category = 'Clean'
    if (fi > 30) category = 'Highly Fouled'
    else if (fi > 20) category = 'Moderately Fouled'
    else if (fi > 10) category = 'Slightly Fouled'
    
    return { value: fi, category }
  }

  const generateBallastRecommendations = (score, fouling, cleanliness) => {
    const recs = []
    
    if (fouling.category === 'Highly Fouled' || score < 30) {
      recs.push('Complete ballast renewal required')
      recs.push('Schedule deep screening or replacement')
    } else if (fouling.category === 'Moderately Fouled' || score < 50) {
      recs.push('Ballast cleaning recommended')
      recs.push('Schedule track machine for undercutting')
    } else if (fouling.category === 'Slightly Fouled' || score < 70) {
      recs.push('Monitor drainage and fouling progression')
      recs.push('Consider preventive cleaning in next cycle')
    }
    
    if (cleanliness.status === 'Dirty' || cleanliness.status === 'Fouled') {
      recs.push('Check track drainage and catchwater drains')
      recs.push('Investigate source of contamination')
    }
    
    if (recs.length === 0) {
      recs.push('Ballast quality within acceptable limits')
      recs.push('Continue routine maintenance schedule')
    }
    
    return recs
  }

  return (
    <div className="min-h-screen bg-black p-6 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="module-header">
          <div>
            <h1 className="module-title">Ballast Quality Analyzer</h1>
            <p className="module-subtitle">Automated assessment of ballast condition, fouling, and gradation</p>
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
              <h2 className="text-lg font-bold text-white">Ballast Capture</h2>
            </div>
            <div className="p-6">
              <MediaCapture 
                onCapture={handleMediaCapture}
                mode="both"
                label="Capture Ballast Image"
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
                      <h3 className="text-sm font-medium text-primary-400 uppercase tracking-wide mb-2">Analysis Overlay</h3>
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
              <h2 className="text-lg font-bold text-white">Quality Analysis</h2>
            </div>
            <div className="p-6 max-h-[800px] overflow-y-auto">
              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-2 border-white border-t-transparent mx-auto"></div>
                  <p className="mt-4 text-primary-400">Analyzing ballast quality...</p>
                </div>
              )}

              {analysis && !loading && (
                <div className="space-y-4">
                  <div className={`p-6 rounded-lg border ${
                    analysis.qualityScore >= 70 ? 'border-white/30 bg-primary-900' :
                    analysis.qualityScore >= 50 ? 'border-primary-500 bg-primary-900' :
                    'border-primary-400 bg-primary-900'
                  }`}>
                    <div className="text-xs uppercase tracking-wider text-primary-500 mb-1">Quality Grade</div>
                    <div className="text-4xl font-bold text-white">{analysis.qualityGrade}</div>
                    <div className="text-sm text-primary-400 mt-1">Score: {analysis.qualityScore}/100</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="info-item">
                      <div className="info-value">{analysis.sizeAnalysis.estimatedSize}</div>
                      <div className="info-label">Est. Size (mm)</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.foulingIndex.value}</div>
                      <div className="info-label">Fouling Index</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.cleanlinessAnalysis.status}</div>
                      <div className="info-label">Cleanliness</div>
                    </div>
                    <div className="info-item">
                      <div className="info-value">{analysis.shapeAnalysis.shape}</div>
                      <div className="info-label">Particle Shape</div>
                    </div>
                  </div>

                  <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-700">
                    <h3 className="font-medium text-white mb-3">Detailed Analysis</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 bg-primary-800/50 rounded">
                        <span className="text-sm text-primary-400">Gradation</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          analysis.sizeAnalysis.gradation === 'Excellent' ? 'bg-white/20 text-white' :
                          analysis.sizeAnalysis.gradation === 'Good' ? 'bg-white/15 text-white' :
                          'bg-primary-700 text-white'
                        }`}>
                          {analysis.sizeAnalysis.gradation}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-primary-800/50 rounded">
                        <span className="text-sm text-primary-400">Fouling Category</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          analysis.foulingIndex.category === 'Clean' ? 'bg-white/20 text-white' :
                          analysis.foulingIndex.category === 'Slightly Fouled' ? 'bg-primary-700 text-white' :
                          'bg-primary-600 text-white'
                        }`}>
                          {analysis.foulingIndex.category}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-primary-800/50 rounded">
                        <span className="text-sm text-primary-400">Within Spec</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          analysis.sizeAnalysis.withinSpec ? 'bg-white/20 text-white' : 'bg-primary-600 text-white'
                        }`}>
                          {analysis.sizeAnalysis.withinSpec ? 'Yes' : 'No'}
                        </span>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-primary-500 mb-2">No analysis data</p>
                  <p className="text-sm text-primary-600">Capture a ballast image to begin</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 rail-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">RDSO Ballast Specifications</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
              <div className="text-sm text-primary-400 mb-1">Material</div>
              <div className="text-sm font-medium text-white">{BALLAST_SPECS.material}</div>
            </div>
            <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
              <div className="text-sm text-primary-400 mb-1">Size Range</div>
              <div className="text-xl font-bold text-white">{BALLAST_SPECS.size.min}-{BALLAST_SPECS.size.max} mm</div>
            </div>
            <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
              <div className="text-sm text-primary-400 mb-1">Cushion Depth</div>
              <div className="text-xl font-bold text-white">{BALLAST_SPECS.depth.main} mm</div>
            </div>
            <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
              <div className="text-sm text-primary-400 mb-1">Shoulder Slope</div>
              <div className="text-xl font-bold text-white">{BALLAST_SPECS.slope}</div>
            </div>
            <div className="p-4 bg-primary-900/50 rounded-lg border border-primary-800">
              <div className="text-sm text-primary-400 mb-1">Density</div>
              <div className="text-sm font-medium text-white">{BALLAST_SPECS.density}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BallastAnalyzer
