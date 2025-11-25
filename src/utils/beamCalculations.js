export function calculateBeamAnalysis(config) {
  const { beamType, loadType, E, I, L, P, a, w } = config
  
  let maxDeflection = 0
  let maxMoment = 0
  let maxShear = 0
  let deflectionData = []
  let momentData = []
  let shearData = []
  
  const points = 100
  
  if (beamType === 'simply-supported') {
    if (loadType === 'point') {
      const b = L - a
      const Ra = P * b / L
      const Rb = P * a / L
      maxDeflection = (P * a * a * b * b) / (3 * E * I * L)
      maxMoment = (P * a * b) / L
      maxShear = Math.max(Ra, Rb)
      
      for (let i = 0; i <= points; i++) {
        const x = (i / points) * L
        let deflection, moment, shear
        
        if (x <= a) {
          deflection = (P * b * x * (L * L - b * b - x * x)) / (6 * E * I * L)
          moment = Ra * x
          shear = Ra
        } else {
          const xb = L - x
          deflection = (P * a * xb * (L * L - a * a - xb * xb)) / (6 * E * I * L)
          moment = Rb * (L - x)
          shear = -Rb
        }
        
        deflectionData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((deflection * 1000).toFixed(4)) })
        momentData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((moment / 1000).toFixed(3)) })
        shearData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((shear / 1000).toFixed(3)) })
      }
    } else if (loadType === 'udl') {
      maxDeflection = (5 * w * Math.pow(L, 4)) / (384 * E * I)
      maxMoment = (w * L * L) / 8
      maxShear = (w * L) / 2
      
      for (let i = 0; i <= points; i++) {
        const x = (i / points) * L
        const deflection = (w * x / (24 * E * I)) * (L * L * L - 2 * L * x * x + x * x * x)
        const moment = (w * x * (L - x)) / 2
        const shear = w * L / 2 - w * x
        
        deflectionData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((deflection * 1000).toFixed(4)) })
        momentData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((moment / 1000).toFixed(3)) })
        shearData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((shear / 1000).toFixed(3)) })
      }
    } else if (loadType === 'triangular') {
      const w0 = (2 * P) / L
      maxDeflection = (w0 * Math.pow(L, 4)) / (120 * E * I)
      maxMoment = (w0 * L * L) / (9 * Math.sqrt(3))
      maxShear = w0 * L / 3
      
      for (let i = 0; i <= points; i++) {
        const x = (i / points) * L
        const wx = w0 * x / L
        const deflection = (w0 / (360 * E * I * L)) * x * (7 * L * L * L * L - 10 * L * L * x * x + 3 * x * x * x * x)
        const moment = (w0 * x * x * (L - x)) / (6 * L)
        const shear = (w0 * L / 3) - (w0 * x * x) / (2 * L)
        
        deflectionData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((deflection * 1000).toFixed(4)) })
        momentData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((moment / 1000).toFixed(3)) })
        shearData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((shear / 1000).toFixed(3)) })
      }
    }
  } else if (beamType === 'cantilever') {
    if (loadType === 'point') {
      maxDeflection = (P * Math.pow(L, 3)) / (3 * E * I)
      maxMoment = P * L
      maxShear = P
      
      for (let i = 0; i <= points; i++) {
        const x = (i / points) * L
        const deflection = (P / (6 * E * I)) * (3 * L * x * x - x * x * x)
        const moment = P * (L - x)
        const shear = -P
        
        deflectionData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((deflection * 1000).toFixed(4)) })
        momentData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((moment / 1000).toFixed(3)) })
        shearData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((shear / 1000).toFixed(3)) })
      }
    } else if (loadType === 'udl') {
      maxDeflection = (w * Math.pow(L, 4)) / (8 * E * I)
      maxMoment = (w * L * L) / 2
      maxShear = w * L
      
      for (let i = 0; i <= points; i++) {
        const x = (i / points) * L
        const deflection = (w / (24 * E * I)) * (6 * L * L * x * x - 4 * L * x * x * x + x * x * x * x)
        const moment = (w * (L - x) * (L - x)) / 2
        const shear = -w * (L - x)
        
        deflectionData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((deflection * 1000).toFixed(4)) })
        momentData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((moment / 1000).toFixed(3)) })
        shearData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((shear / 1000).toFixed(3)) })
      }
    }
  } else if (beamType === 'fixed-fixed') {
    if (loadType === 'point') {
      maxDeflection = (P * Math.pow(L, 3)) / (192 * E * I)
      maxMoment = P * L / 8
      maxShear = P / 2
      
      for (let i = 0; i <= points; i++) {
        const x = (i / points) * L
        const deflection = (P * x * x * (L - x) * (L - x)) / (12 * E * I * L)
        const moment = (P / (4 * L)) * (L * L / 2 - L * x + x * x)
        const shear = x < L / 2 ? P / 2 : -P / 2
        
        deflectionData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((deflection * 1000).toFixed(4)) })
        momentData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((moment / 1000).toFixed(3)) })
        shearData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((shear / 1000).toFixed(3)) })
      }
    } else if (loadType === 'udl') {
      maxDeflection = (w * Math.pow(L, 4)) / (384 * E * I)
      maxMoment = (w * L * L) / 12
      maxShear = (w * L) / 2
      
      for (let i = 0; i <= points; i++) {
        const x = (i / points) * L
        const deflection = (w * x * x * (L - x) * (L - x)) / (24 * E * I)
        const moment = (w / 12) * (6 * L * x - 6 * x * x - L * L)
        const shear = (w * L) / 2 - w * x
        
        deflectionData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((deflection * 1000).toFixed(4)) })
        momentData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((moment / 1000).toFixed(3)) })
        shearData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((shear / 1000).toFixed(3)) })
      }
    }
  } else if (beamType === 'propped-cantilever') {
    if (loadType === 'point') {
      const b = L - a
      const Rb = (P * a * a * (3 * L - a)) / (2 * L * L * L)
      const Ra = P - Rb
      const Ma = P * a - Rb * L
      
      maxDeflection = Math.abs((P * a * a) / (12 * E * I) * (3 * b - a))
      maxMoment = Math.max(Math.abs(Ma), Math.abs(Ra * a))
      maxShear = Math.max(Ra, Rb)
      
      for (let i = 0; i <= points; i++) {
        const x = (i / points) * L
        let deflection, moment, shear
        
        if (x <= a) {
          deflection = (Ra * x * x / (6 * E * I)) * (3 * L - x) + (Ma * x * x) / (2 * E * I)
          moment = Ra * x + Ma
          shear = Ra
        } else {
          deflection = (Rb * (L - x) * (L - x) / (6 * E * I)) * (3 * x - L)
          moment = Rb * (L - x)
          shear = -Rb
        }
        
        deflectionData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((deflection * 1000).toFixed(4)) })
        momentData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((moment / 1000).toFixed(3)) })
        shearData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((shear / 1000).toFixed(3)) })
      }
    } else if (loadType === 'udl') {
      const Rb = (3 * w * L) / 8
      const Ma = -(w * L * L) / 8
      
      maxDeflection = (w * L * L * L * L) / (185 * E * I)
      maxMoment = Math.max(Math.abs(Ma), (w * L * L) / 8)
      maxShear = Math.max(w * L - Rb, Rb)
      
      for (let i = 0; i <= points; i++) {
        const x = (i / points) * L
        const Ra = w * L - Rb
        const deflection = (w * x * x) / (24 * E * I) * (x * x - 4 * L * x + 6 * L * L) + (Ma * x * x) / (2 * E * I)
        const moment = Ra * x + Ma - (w * x * x) / 2
        const shear = Ra - w * x
        
        deflectionData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((deflection * 1000).toFixed(4)) })
        momentData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((moment / 1000).toFixed(3)) })
        shearData.push({ x: parseFloat(x.toFixed(3)), value: parseFloat((shear / 1000).toFixed(3)) })
      }
    }
  }
  
  const absMaxDeflection = Math.max(...deflectionData.map(d => Math.abs(d.value)))
  
  return {
    maxDeflection: absMaxDeflection,
    maxMoment: maxMoment / 1000,
    maxShear: maxShear / 1000,
    deflectionData,
    momentData,
    shearData
  }
}
