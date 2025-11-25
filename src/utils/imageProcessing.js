export function sobelEdgeDetection(imageData) {
  const width = imageData.width
  const height = imageData.height
  const expectedLength = width * height * 4
  const pixels = new Uint8ClampedArray(expectedLength)
  
  for (let i = 0; i < expectedLength && i < imageData.data.length; i++) {
    pixels[i] = imageData.data[i]
  }
  
  const output = new Uint8ClampedArray(expectedLength)
  
  const sobelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ]
  
  const sobelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ]
  
  function getPixelGrayscale(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return 0
    const i = (y * width + x) * 4
    return (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3
  }
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0
      let gy = 0
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixel = getPixelGrayscale(x + kx, y + ky)
          gx += pixel * sobelX[ky + 1][kx + 1]
          gy += pixel * sobelY[ky + 1][kx + 1]
        }
      }
      
      const magnitude = Math.sqrt(gx * gx + gy * gy)
      const i = (y * width + x) * 4
      
      output[i] = magnitude
      output[i + 1] = magnitude
      output[i + 2] = magnitude
      output[i + 3] = 255
    }
  }
  
  return new ImageData(output, width, height)
}

export function detectCracks(imageData, sensitivity = 'medium') {
  const thresholds = {
    low: 60,
    medium: 100,
    high: 140
  }
  
  const threshold = thresholds[sensitivity] || thresholds.medium
  const width = imageData.width
  const height = imageData.height
  
  const expectedLength = width * height * 4
  const outputPixels = new Uint8ClampedArray(expectedLength)
  
  for (let i = 0; i < expectedLength; i++) {
    outputPixels[i] = imageData.data[i]
  }
  
  const edges = sobelEdgeDetection(imageData)
  const edgePixels = edges.data
  
  let crackPixels = 0
  const crackMap = []
  
  for (let i = 0; i < edgePixels.length; i += 4) {
    if (i >= expectedLength) break
    
    const edgeMagnitude = edgePixels[i]
    const brightness = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3
    
    const isCrack = edgeMagnitude > threshold && brightness < 150
    
    if (isCrack) {
      crackPixels++
      outputPixels[i] = 220
      outputPixels[i + 1] = 38
      outputPixels[i + 2] = 38
      outputPixels[i + 3] = 180
      
      const x = (i / 4) % width
      const y = Math.floor((i / 4) / width)
      crackMap.push({ x, y })
    }
  }
  
  try {
    return {
      processedImageData: new ImageData(outputPixels, width, height),
      crackPixels,
      totalPixels: width * height,
      crackMap
    }
  } catch (error) {
    console.error('ImageData creation error:', error)
    return {
      processedImageData: null,
      crackPixels,
      totalPixels: width * height,
      crackMap,
      error: 'Failed to create output image'
    }
  }
}

export function analyzeCrackPattern(crackMap, width, height) {
  if (crackMap.length === 0) {
    return {
      patternType: 'None',
      orientation: 'N/A',
      connectivity: 0
    }
  }
  
  const xVariance = crackMap.reduce((sum, p) => sum + p.x, 0) / crackMap.length
  const yVariance = crackMap.reduce((sum, p) => sum + p.y, 0) / crackMap.length
  
  let horizontalCount = 0
  let verticalCount = 0
  let diagonalCount = 0
  
  crackMap.forEach(point => {
    const xDist = Math.abs(point.x - xVariance)
    const yDist = Math.abs(point.y - yVariance)
    
    if (xDist > yDist * 2) horizontalCount++
    else if (yDist > xDist * 2) verticalCount++
    else diagonalCount++
  })
  
  let patternType = 'Complex'
  let orientation = 'Multi-directional'
  
  const total = horizontalCount + verticalCount + diagonalCount
  if (horizontalCount > total * 0.6) {
    patternType = 'Linear'
    orientation = 'Horizontal'
  } else if (verticalCount > total * 0.6) {
    patternType = 'Linear'
    orientation = 'Vertical'
  } else if (diagonalCount > total * 0.6) {
    patternType = 'Diagonal'
    orientation = 'Diagonal'
  } else if (crackMap.length > width * height * 0.1) {
    patternType = 'Network'
    orientation = 'Random'
  }
  
  let connectivity = crackMap.length / (width * height)
  
  return {
    patternType,
    orientation,
    connectivity: (connectivity * 100).toFixed(2)
  }
}

export function estimateCrackWidth(crackMap, pixelSize = 0.1) {
  if (crackMap.length < 2) return { min: 0, max: 0, avg: 0 }
  
  const widths = []
  
  for (let i = 0; i < Math.min(crackMap.length, 100); i++) {
    const point = crackMap[i]
    let width = 1
    
    for (let offset = 1; offset < 10; offset++) {
      const adjacent = crackMap.find(p => 
        Math.abs(p.x - point.x) <= offset && 
        Math.abs(p.y - point.y) <= 1
      )
      if (adjacent) width = offset
      else break
    }
    
    widths.push(width * pixelSize)
  }
  
  return {
    min: Math.min(...widths).toFixed(2),
    max: Math.max(...widths).toFixed(2),
    avg: (widths.reduce((a, b) => a + b, 0) / widths.length).toFixed(2)
  }
}
