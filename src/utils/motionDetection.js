export class MotionDetector {
  constructor() {
    this.previousFrame = null
    this.motionThreshold = 25
    this.minMotionPixels = 100
  }

  detectMotion(currentImageData) {
    if (!this.previousFrame) {
      this.previousFrame = currentImageData
      return {
        hasMotion: false,
        motionPercentage: 0,
        motionRegions: []
      }
    }

    const current = currentImageData.data
    const previous = this.previousFrame.data
    const width = currentImageData.width
    const height = currentImageData.height
    
    let motionPixels = 0
    const motionMap = new Uint8Array(width * height)
    
    for (let i = 0; i < current.length; i += 4) {
      const pixelIndex = i / 4
      
      const rDiff = Math.abs(current[i] - previous[i])
      const gDiff = Math.abs(current[i + 1] - previous[i + 1])
      const bDiff = Math.abs(current[i + 2] - previous[i + 2])
      
      const avgDiff = (rDiff + gDiff + bDiff) / 3
      
      if (avgDiff > this.motionThreshold) {
        motionPixels++
        motionMap[pixelIndex] = 255
      } else {
        motionMap[pixelIndex] = 0
      }
    }
    
    const motionPercentage = (motionPixels / (width * height)) * 100
    const hasMotion = motionPixels > this.minMotionPixels
    
    this.previousFrame = currentImageData
    
    return {
      hasMotion,
      motionPercentage: motionPercentage.toFixed(2),
      motionPixels,
      motionMap,
      dimensions: { width, height }
    }
  }

  reset() {
    this.previousFrame = null
  }

  setThreshold(threshold) {
    this.motionThreshold = Math.max(0, Math.min(255, threshold))
  }
}

export class ParticleDetector {
  constructor() {
    this.particleThreshold = 30
    this.minParticleSize = 5
    this.maxParticleSize = 200
  }

  detectParticles(imageData) {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    
    const grayscale = new Uint8Array(width * height)
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
      grayscale[i / 4] = avg
    }
    
    const edges = this.sobelEdgeDetection(grayscale, width, height)
    
    const particles = this.findConnectedComponents(edges, width, height)
    
    const validParticles = particles.filter(p => 
      p.size >= this.minParticleSize && p.size <= this.maxParticleSize
    )
    
    return {
      particleCount: validParticles.length,
      particles: validParticles,
      totalArea: validParticles.reduce((sum, p) => sum + p.size, 0),
      particleDensity: (validParticles.length / (width * height) * 10000).toFixed(4)
    }
  }

  sobelEdgeDetection(grayscale, width, height) {
    const edges = new Uint8Array(width * height)
    
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1]
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1]
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = (y + ky) * width + (x + kx)
            const kernelIdx = (ky + 1) * 3 + (kx + 1)
            gx += grayscale[idx] * sobelX[kernelIdx]
            gy += grayscale[idx] * sobelY[kernelIdx]
          }
        }
        
        const magnitude = Math.sqrt(gx * gx + gy * gy)
        edges[y * width + x] = magnitude > this.particleThreshold ? 255 : 0
      }
    }
    
    return edges
  }

  findConnectedComponents(binary, width, height) {
    const visited = new Uint8Array(width * height)
    const particles = []
    
    const floodFill = (startX, startY) => {
      const stack = [[startX, startY]]
      const pixels = []
      let minX = startX, maxX = startX, minY = startY, maxY = startY
      
      while (stack.length > 0) {
        const [x, y] = stack.pop()
        const idx = y * width + x
        
        if (x < 0 || x >= width || y < 0 || y >= height) continue
        if (visited[idx] || !binary[idx]) continue
        
        visited[idx] = 1
        pixels.push([x, y])
        
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
        
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
      }
      
      return {
        size: pixels.length,
        centroid: {
          x: pixels.reduce((s, p) => s + p[0], 0) / pixels.length,
          y: pixels.reduce((s, p) => s + p[1], 0) / pixels.length
        },
        boundingBox: {
          x: minX,
          y: minY,
          width: maxX - minX + 1,
          height: maxY - minY + 1
        }
      }
    }
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x
        if (binary[idx] && !visited[idx]) {
          const particle = floodFill(x, y)
          if (particle.size >= this.minParticleSize) {
            particles.push(particle)
          }
        }
      }
    }
    
    return particles
  }
}

export class OpticalFlowDetector {
  constructor() {
    this.pyramidLevels = 3
    this.windowSize = 15
    this.maxLevel = 3
  }

  computeFarnebackFlow(prev, curr, width, height) {
    const flowX = new Float32Array(width * height)
    const flowY = new Float32Array(width * height)
    
    const blockSize = 8
    
    for (let y = 0; y < height - blockSize; y += blockSize) {
      for (let x = 0; x < width - blockSize; x += blockSize) {
        const { dx, dy } = this.estimateBlockMotion(
          prev, curr, x, y, blockSize, width, height
        )
        
        for (let by = 0; by < blockSize; by++) {
          for (let bx = 0; bx < blockSize; bx++) {
            const idx = (y + by) * width + (x + bx)
            flowX[idx] = dx
            flowY[idx] = dy
          }
        }
      }
    }
    
    return { flowX, flowY, width, height }
  }

  estimateBlockMotion(prev, curr, x, y, blockSize, width, height) {
    let bestDx = 0, bestDy = 0
    let minError = Infinity
    
    const searchRange = 8
    
    for (let dy = -searchRange; dy <= searchRange; dy++) {
      for (let dx = -searchRange; dx <= searchRange; dx++) {
        const error = this.computeSSD(prev, curr, x, y, dx, dy, blockSize, width, height)
        
        if (error < minError) {
          minError = error
          bestDx = dx
          bestDy = dy
        }
      }
    }
    
    return { dx: bestDx, dy: bestDy, error: minError }
  }

  computeSSD(prev, curr, x, y, dx, dy, blockSize, width, height) {
    let ssd = 0
    
    for (let by = 0; by < blockSize; by++) {
      for (let bx = 0; bx < blockSize; bx++) {
        const x1 = x + bx
        const y1 = y + by
        const x2 = x1 + dx
        const y2 = y1 + dy
        
        if (x2 < 0 || x2 >= width || y2 < 0 || y2 >= height) {
          ssd += 10000
          continue
        }
        
        const idx1 = y1 * width + x1
        const idx2 = y2 * width + x2
        
        const diff = prev[idx1] - curr[idx2]
        ssd += diff * diff
      }
    }
    
    return ssd
  }

  visualizeFlow(flowX, flowY, width, height, scale = 1) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    
    const imageData = ctx.createImageData(width, height)
    const data = imageData.data
    
    for (let i = 0; i < flowX.length; i++) {
      const fx = flowX[i]
      const fy = flowY[i]
      
      const magnitude = Math.sqrt(fx * fx + fy * fy)
      const angle = Math.atan2(fy, fx)
      
      const hue = ((angle + Math.PI) / (2 * Math.PI)) * 360
      const saturation = 100
      const lightness = Math.min(magnitude * scale * 10, 50)
      
      const rgb = this.hslToRgb(hue, saturation, lightness)
      
      data[i * 4] = rgb[0]
      data[i * 4 + 1] = rgb[1]
      data[i * 4 + 2] = rgb[2]
      data[i * 4 + 3] = 255
    }
    
    ctx.putImageData(imageData, 0, 0)
    return canvas.toDataURL()
  }

  hslToRgb(h, s, l) {
    s /= 100
    l /= 100
    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs((h / 60) % 2 - 1))
    const m = l - c / 2
    let r = 0, g = 0, b = 0
    
    if (h < 60) { r = c; g = x; b = 0 }
    else if (h < 120) { r = x; g = c; b = 0 }
    else if (h < 180) { r = 0; g = c; b = x }
    else if (h < 240) { r = 0; g = x; b = c }
    else if (h < 300) { r = x; g = 0; b = c }
    else { r = c; g = 0; b = x }
    
    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255)
    ]
  }
}
