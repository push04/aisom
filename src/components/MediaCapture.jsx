import React, { useRef, useState, useEffect, useCallback } from 'react'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function MediaCapture({ onCapture, mode = 'both', label = 'Capture Media' }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [isLive, setIsLive] = useState(false)
  const [error, setError] = useState(null)
  const [captureMode, setCaptureMode] = useState('upload')
  const [isLoading, setIsLoading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [permissionState, setPermissionState] = useState('prompt')

  const checkCameraPermission = useCallback(async () => {
    try {
      if (navigator.permissions) {
        const result = await navigator.permissions.query({ name: 'camera' })
        setPermissionState(result.state)
        
        result.addEventListener('change', () => {
          setPermissionState(result.state)
        })
      }
    } catch (err) {
      setPermissionState('prompt')
    }
  }, [])

  useEffect(() => {
    checkCameraPermission()
    return () => {
      stopCamera()
    }
  }, [checkCameraPermission])

  const startCamera = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device')
      }

      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 }
        }
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }
      
      setStream(mediaStream)
      setIsLive(true)
      setCaptureMode('live')
      setRetryCount(0)
      setPermissionState('granted')
    } catch (err) {
      console.error('Camera access error:', err)
      
      let errorMessage = 'Camera access failed. '
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage += 'Please allow camera access in your browser settings.'
        setPermissionState('denied')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera detected on this device.'
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage += 'Camera is in use by another application.'
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += 'Camera does not support the requested resolution.'
      } else {
        errorMessage += 'Please check your camera connection and try again.'
      }
      
      setError(errorMessage)
      
      if (retryCount < 2 && err.name !== 'NotAllowedError') {
        setRetryCount(prev => prev + 1)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop()
      })
      setStream(null)
      setIsLive(false)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [stream])

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Unable to capture frame. Please try again.')
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      setError('Video not ready. Please wait a moment and try again.')
      return
    }
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    
    canvas.toBlob((blob) => {
      if (!blob) {
        setError('Failed to capture image. Please try again.')
        return
      }
      
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
        setError(null)
      }
      reader.onerror = () => {
        setError('Failed to process captured image.')
      }
      reader.readAsDataURL(blob)
    }, 'image/jpeg', 0.92)
  }

  const validateFile = (file) => {
    if (!file) {
      return 'No file selected'
    }
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload JPG, PNG, or WebP images.'
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`
    }
    
    return null
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    const validationError = validateFile(file)
    
    if (validationError) {
      setError(validationError)
      e.target.value = ''
      return
    }
    
    setError(null)
    setIsLoading(true)
    
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
          source: 'upload',
          fileName: file.name
        })
        setIsLoading(false)
      }
      img.onerror = () => {
        setError('Failed to load image. The file may be corrupted.')
        setIsLoading(false)
      }
      img.src = event.target.result
    }
    reader.onerror = () => {
      setError('Failed to read file. Please try again.')
      setIsLoading(false)
    }
    reader.readAsDataURL(file)
    
    e.target.value = ''
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const file = e.dataTransfer.files[0]
    if (file && ALLOWED_TYPES.includes(file.type)) {
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files
        handleFileUpload({ target: fileInputRef.current })
      }
    } else {
      setError('Please drop a valid image file (JPG, PNG, or WebP)')
    }
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  return (
    <div className="space-y-4">
      {error && (
        <div 
          className="bg-neutral-900 border border-neutral-700 text-neutral-300 p-4 rounded-lg text-sm flex items-start gap-3"
          role="alert"
        >
          <svg className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p>{error}</p>
            {retryCount > 0 && retryCount < 2 && (
              <button 
                onClick={startCamera}
                className="mt-2 text-white underline hover:no-underline text-sm"
              >
                Try again ({3 - retryCount} attempts left)
              </button>
            )}
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-neutral-500 hover:text-white transition-colors"
            aria-label="Dismiss error"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex gap-2">
        {mode !== 'live' && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black ${
              captureMode === 'upload' && !isLive
                ? 'bg-white text-black'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white border border-neutral-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label="Upload image file"
          >
            {isLoading && captureMode === 'upload' ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            <span>Upload Image</span>
          </button>
        )}
        
        {mode !== 'upload' && (
          <button
            onClick={isLive ? stopCamera : startCamera}
            disabled={isLoading}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black ${
              isLive
                ? 'bg-white text-black'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white border border-neutral-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={isLive ? 'Stop camera' : 'Start camera'}
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isLive ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                )}
              </svg>
            )}
            <span>{isLive ? 'Stop Camera' : 'Live Camera'}</span>
          </button>
        )}
      </div>

      {permissionState === 'denied' && mode !== 'upload' && (
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 text-sm text-neutral-400">
          <p className="mb-2">Camera access is blocked. To enable:</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-500">
            <li>Click the lock/camera icon in your browser's address bar</li>
            <li>Allow camera access for this site</li>
            <li>Refresh the page</li>
          </ol>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileUpload}
        className="hidden"
        aria-hidden="true"
      />

      {!isLive && mode !== 'live' && (
        <div 
          className="border-2 border-dashed border-neutral-700 rounded-lg p-8 text-center cursor-pointer hover:border-neutral-600 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          aria-label="Drop zone for image upload"
        >
          <svg className="w-10 h-10 mx-auto mb-3 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm text-neutral-500 mb-1">
            Drag and drop an image here, or click to browse
          </p>
          <p className="text-xs text-neutral-600">
            Supports JPG, PNG, WebP up to 10MB
          </p>
        </div>
      )}

      {isLive && (
        <div className="space-y-3 animate-fade-in">
          <div className="relative rounded-lg overflow-hidden border-2 border-neutral-700">
            <video
              ref={videoRef}
              className="w-full h-auto rounded-lg"
              playsInline
              muted
              aria-label="Camera preview"
            />
            <div className="absolute top-3 right-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white text-black rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-black rounded-full animate-pulse" aria-hidden="true" />
                LIVE
              </div>
            </div>
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent animate-scanner" />
            </div>
          </div>
          
          <button
            onClick={captureFrame}
            className="w-full bg-white hover:bg-neutral-200 text-black py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black active:scale-[0.98]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Capture Frame for Analysis
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </div>
  )
}

export default MediaCapture
