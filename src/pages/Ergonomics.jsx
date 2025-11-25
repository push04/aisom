import React, { useState, useRef, useEffect } from 'react'
import * as poseDetection from '@tensorflow-models/pose-detection'
import '@tensorflow/tfjs'

function Ergonomics() {
  const [cameraActive, setCameraActive] = useState(false)
  const [assessment, setAssessment] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const detectorRef = useRef(null)
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
          setCameraActive(true)
          setError(null)
        } catch (playErr) {
          console.error('Video play error:', playErr)
          setError('Failed to start video playback. Please try again.')
        }
      }
    } catch (err) {
      setError('Camera access denied or not available. Please enable camera permissions.')
      console.error('Camera error:', err)
    }
  }
  
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
      setCameraActive(false)
    }
  }
  
  const loadDetector = async () => {
    try {
      if (!detectorRef.current) {
        const model = poseDetection.SupportedModels.MoveNet
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
        }
        detectorRef.current = await poseDetection.createDetector(model, detectorConfig)
      }
      return detectorRef.current
    } catch (err) {
      console.error('Error loading pose detector:', err)
      setError('Failed to load pose detection model.')
      return null
    }
  }
  
  const calculateAngle = (p1, p2, p3) => {
    const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x)
    let angle = Math.abs(radians * 180.0 / Math.PI)
    if (angle > 180) angle = 360 - angle
    return angle
  }
  
  const analyzePosture = async () => {
    if (!videoRef.current) return
    
    setLoading(true)
    try {
      const detector = await loadDetector()
      
      if (!detector) {
        setLoading(false)
        return
      }
      
      const poses = await detector.estimatePoses(videoRef.current)
      
      if (poses.length > 0) {
        const keypoints = poses[0].keypoints
        
        const nose = keypoints.find(kp => kp.name === 'nose')
        const leftShoulder = keypoints.find(kp => kp.name === 'left_shoulder')
        const rightShoulder = keypoints.find(kp => kp.name === 'right_shoulder')
        const leftHip = keypoints.find(kp => kp.name === 'left_hip')
        const rightHip = keypoints.find(kp => kp.name === 'right_hip')
        const leftElbow = keypoints.find(kp => kp.name === 'left_elbow')
        const rightElbow = keypoints.find(kp => kp.name === 'right_elbow')
        
        const shoulder = leftShoulder && rightShoulder ? {
          x: (leftShoulder.x + rightShoulder.x) / 2,
          y: (leftShoulder.y + rightShoulder.y) / 2
        } : null
        
        const hip = leftHip && rightHip ? {
          x: (leftHip.x + rightHip.x) / 2,
          y: (leftHip.y + rightHip.y) / 2
        } : null
        
        let neckAngle = 15
        if (nose && shoulder && hip) {
          neckAngle = Math.abs(90 - calculateAngle(nose, shoulder, hip))
        }
        
        let backAngle = 10
        if (shoulder && hip) {
          const vertical = { x: shoulder.x, y: shoulder.y - 100 }
          backAngle = Math.abs(90 - calculateAngle(vertical, shoulder, hip))
        }
        
        let shoulderAngle = 10
        if (leftShoulder && leftElbow && rightShoulder && rightElbow) {
          const leftAngle = calculateAngle(leftElbow, leftShoulder, { x: leftShoulder.x + 100, y: leftShoulder.y })
          const rightAngle = calculateAngle(rightElbow, rightShoulder, { x: rightShoulder.x + 100, y: rightShoulder.y })
          shoulderAngle = Math.max(leftAngle, rightAngle)
        }
        
        const neckRisk = neckAngle < 20 ? 'Low' : neckAngle < 30 ? 'Medium' : 'High'
        const backRisk = backAngle < 30 ? 'Low' : backAngle < 45 ? 'Medium' : 'High'
        
        const backLoad = (backAngle * 0.5 + neckAngle * 0.3).toFixed(1)
        
        const riskScore = (neckAngle / 40 * 33 + backAngle / 50 * 34 + shoulderAngle / 30 * 33).toFixed(0)
        
        let overallRisk = 'Low'
        if (riskScore > 70) overallRisk = 'High'
        else if (riskScore > 40) overallRisk = 'Medium'
        
        setAssessment({
          neckAngle: neckAngle.toFixed(1),
          backAngle: backAngle.toFixed(1),
          shoulderAngle: shoulderAngle.toFixed(1),
          neckRisk,
          backRisk,
          backLoad,
          riskScore,
          overallRisk,
          timestamp: new Date().toISOString()
        })
        
        const analyses = JSON.parse(localStorage.getItem('recentAnalyses') || '[]')
        analyses.unshift({
          type: 'ergonomics',
          title: 'Ergonomic Posture Assessment',
          timestamp: new Date().toISOString(),
          data: { riskScore, overallRisk }
        })
        localStorage.setItem('recentAnalyses', JSON.stringify(analyses.slice(0, 50)))
      } else {
        setError('No person detected in frame. Please ensure you are visible in the camera.')
      }
    } catch (err) {
      console.error('Pose analysis error:', err)
      setError('Failed to analyze posture. Please try again.')
    }
    setLoading(false)
  }
  
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])
  
  return (
    <div className="min-h-screen bg-primary-950">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Ergonomic Assessment Module</h1>
          <p className="text-secondary-300">AI-powered biomechanical posture analysis and risk evaluation</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-primary-900 rounded-lg shadow-lg border border-primary-800">
            <div className="px-6 py-4 border-b border-primary-800">
              <h2 className="text-xl font-bold text-white">Camera Interface</h2>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="bg-danger/10 border border-danger/30 text-danger p-4 rounded mb-4">
                  {error}
                </div>
              )}
              
              <div className="mb-4 space-y-2">
                {!cameraActive ? (
                  <button
                    onClick={startCamera}
                    className="w-full bg-accent hover:bg-accent-hover text-white py-3 rounded-lg transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Activate Camera
                  </button>
                ) : (
                  <>
                    <button
                      onClick={stopCamera}
                      className="w-full bg-danger hover:opacity-90 text-white py-3 rounded-lg transition-all duration-200 font-semibold"
                    >
                      Stop Camera
                    </button>
                    <button
                      onClick={analyzePosture}
                      className="w-full bg-success hover:opacity-90 text-white py-3 rounded-lg transition-all duration-200 font-semibold"
                    >
                      Analyze Posture
                    </button>
                  </>
                )}
              </div>
              
              <div className="relative bg-black rounded overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {!cameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center text-white bg-primary-800">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-2 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-secondary-400">Camera Inactive</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-primary-900 rounded-lg shadow-lg border border-primary-800">
            <div className="px-6 py-4 border-b border-primary-800">
              <h2 className="text-xl font-bold text-white">Assessment Results</h2>
            </div>
            
            <div className="p-6">
              {loading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent border-t-transparent mx-auto"></div>
                  <p className="mt-4 text-secondary-400">Analyzing biomechanical parameters...</p>
                </div>
              )}
              
              {assessment && !loading ? (
                <div className="space-y-4">
                  <div className={`p-6 rounded-lg border-2 ${
                    assessment.overallRisk === 'Low' ? 'bg-success/10 border-success' :
                    assessment.overallRisk === 'Medium' ? 'bg-warning/10 border-warning' :
                    'bg-danger/10 border-danger'
                  }`}>
                    <h3 className="font-semibold text-secondary-400 mb-1 text-sm uppercase">Overall Risk Level</h3>
                    <p className={`text-5xl font-bold ${
                      assessment.overallRisk === 'Low' ? 'text-success' :
                      assessment.overallRisk === 'Medium' ? 'text-warning' :
                      'text-danger'
                    }`}>{assessment.overallRisk}</p>
                    <p className="text-sm text-secondary-500 mt-2">Risk Score: {assessment.riskScore}/100</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary-800 p-4 rounded-lg border border-primary-700">
                      <h3 className="font-semibold text-secondary-400 mb-1 text-xs uppercase">Neck Angle</h3>
                      <p className="text-3xl font-bold text-accent">{assessment.neckAngle}°</p>
                      <p className="text-xs text-secondary-500 mt-1">{assessment.neckRisk} Risk</p>
                    </div>
                    
                    <div className="bg-primary-800 p-4 rounded-lg border border-primary-700">
                      <h3 className="font-semibold text-secondary-400 mb-1 text-xs uppercase">Back Angle</h3>
                      <p className="text-3xl font-bold text-accent">{assessment.backAngle}°</p>
                      <p className="text-xs text-secondary-500 mt-1">{assessment.backRisk} Risk</p>
                    </div>
                    
                    <div className="bg-primary-800 p-4 rounded-lg border border-primary-700">
                      <h3 className="font-semibold text-secondary-400 mb-1 text-xs uppercase">Shoulder Angle</h3>
                      <p className="text-3xl font-bold text-accent">{assessment.shoulderAngle}°</p>
                    </div>
                    
                    <div className="bg-primary-800 p-4 rounded-lg border border-primary-700">
                      <h3 className="font-semibold text-secondary-400 mb-1 text-xs uppercase">Back Load Est.</h3>
                      <p className="text-3xl font-bold text-accent">{assessment.backLoad}</p>
                      <p className="text-xs text-secondary-500 mt-1">kg</p>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded border ${
                    assessment.overallRisk === 'Low' ? 'bg-success/5 border-success/30' :
                    assessment.overallRisk === 'Medium' ? 'bg-warning/5 border-warning/30' : 
                    'bg-danger/5 border-danger/30'
                  }`}>
                    <h3 className={`font-semibold mb-2 text-sm uppercase ${
                      assessment.overallRisk === 'Low' ? 'text-success' :
                      assessment.overallRisk === 'Medium' ? 'text-warning' : 'text-danger'
                    }`}>Corrective Recommendations</h3>
                    <ul className="text-sm text-secondary-300 space-y-1">
                      {assessment.overallRisk === 'Low' && (
                        <>
                          <li>• Maintain current posture alignment</li>
                          <li>• Implement regular break intervals (30 min)</li>
                          <li>• Perform light stretching exercises</li>
                        </>
                      )}
                      {assessment.overallRisk === 'Medium' && (
                        <>
                          <li>• Adjust posture immediately to reduce strain</li>
                          <li>• Maintain neutral spine alignment</li>
                          <li>• Utilize ergonomic support equipment</li>
                          <li>• Reduce break intervals to 20 minutes</li>
                        </>
                      )}
                      {assessment.overallRisk === 'High' && (
                        <>
                          <li>• URGENT: Modify working posture immediately</li>
                          <li>• Cease heavy manual handling in current position</li>
                          <li>• Employ mechanical assistance for load handling</li>
                          <li>• Consult occupational health specialist</li>
                          <li>• Consider ergonomic training program</li>
                        </>
                      )}
                    </ul>
                  </div>
                  
                  <div className="text-xs text-secondary-500 font-mono">
                    Assessment Time: {new Date(assessment.timestamp).toLocaleString()}
                  </div>
                </div>
              ) : null}
              
              {!assessment && !loading && (
                <div className="text-center py-12 text-secondary-500">
                  <svg className="w-24 h-24 mx-auto mb-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p>Activate camera and analyze posture to view results</p>
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
