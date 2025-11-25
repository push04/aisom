import React, { useRef, useState, useEffect } from 'react'

function MediaCapture({ onCapture, mode = 'both', label = 'Capture Media' }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [isLive, setIsLive] = useState(false)
  const [error, setError] = useState(null)
  const [captureMode, setCaptureMode] = useState('upload')

  const startCamera = async () => {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
      }
      
      setStream(mediaStream)
      setIsLive(true)
      setCaptureMode('live')
    } catch (err) {
      console.error('Camera access error:', err)
      setError('Camera access denied. Please enable camera permissions or use image upload.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
      setIsLive(false)
    }
  }

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    
    canvas.toBlob((blob) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        onCapture({
          dataUrl: reader.result,
          blob: blob,
          width: canvas.width,
          height: canvas.height,
          timestamp: new Date().toISOString(),
          source: 'live'
        })
      }
      reader.readAsDataURL(blob)
    }, 'image/jpeg', 0.92)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG, WEBP)')
      return
    }
    
    setError(null)
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        onCapture({
          dataUrl: event.target.result,
          blob: file,
          width: img.width,
          height: img.height,
          timestamp: new Date().toISOString(),
          source: 'upload'
        })
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

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger p-3 rounded-lg text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="flex gap-2">
        {mode !== 'live' && (
          <button
            onClick={() => fileInputRef.current.click()}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
              captureMode === 'upload'
                ? 'bg-accent text-white shadow-lg'
                : 'bg-primary-800 text-secondary-300 hover:bg-primary-700'
            }`}
          >
            📁 Upload Image
          </button>
        )}
        
        {mode !== 'upload' && (
          <button
            onClick={isLive ? stopCamera : startCamera}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
              captureMode === 'live'
                ? 'bg-accent text-white shadow-lg'
                : 'bg-primary-800 text-secondary-300 hover:bg-primary-700'
            }`}
          >
            {isLive ? '⏹️ Stop Camera' : '📹 Live Camera'}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileUpload}
        className="hidden"
      />

      {isLive && (
        <div className="space-y-3">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-auto"
              playsInline
              muted
            />
            <div className="absolute top-2 right-2 bg-danger text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              LIVE
            </div>
          </div>
          
          <button
            onClick={captureFrame}
            className="w-full bg-success hover:bg-success/90 text-white py-3 rounded-lg font-semibold shadow-lg transition-all duration-200"
          >
            📸 Capture Frame for Analysis
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

export default MediaCapture
