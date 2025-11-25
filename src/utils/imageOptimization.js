export async function optimizeImageForAPI(canvas, maxWidth = 1024, quality = 0.8) {
  const originalWidth = canvas.width
  const originalHeight = canvas.height
  
  let targetWidth = originalWidth
  let targetHeight = originalHeight
  
  if (originalWidth > maxWidth) {
    targetWidth = maxWidth
    targetHeight = Math.floor((originalHeight / originalWidth) * maxWidth)
  }
  
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = targetWidth
  tempCanvas.height = targetHeight
  
  const ctx = tempCanvas.getContext('2d')
  ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight)
  
  return new Promise((resolve, reject) => {
    tempCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'))
          return
        }
        
        const reader = new FileReader()
        reader.onloadend = () => {
          resolve(reader.result)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      },
      'image/jpeg',
      quality
    )
  })
}

export function validateImageSize(dataUrl, maxSizeMB = 1) {
  const base64Length = dataUrl.split(',')[1]?.length || dataUrl.length
  const sizeInBytes = (base64Length * 3) / 4
  const sizeInMB = sizeInBytes / (1024 * 1024)
  
  if (sizeInMB > maxSizeMB) {
    throw new Error(`Image size (${sizeInMB.toFixed(2)}MB) exceeds maximum (${maxSizeMB}MB). Try simplifying the diagram.`)
  }
  
  return true
}
