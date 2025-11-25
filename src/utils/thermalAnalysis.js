export const MATERIAL_THERMAL_COEFFICIENTS = {
  'Structural Steel (A36/S275)': {
    alpha: 12e-6,
    name: 'Structural Steel',
    unit: '1/°C'
  },
  'Aluminum Alloy (6061-T6)': {
    alpha: 23e-6,
    name: 'Aluminum',
    unit: '1/°C'
  },
  'Concrete (C30/37)': {
    alpha: 10e-6,
    name: 'Concrete',
    unit: '1/°C'
  },
  'Timber (Grade C24)': {
    alpha: 5e-6,
    name: 'Timber',
    unit: '1/°C'
  },
  'Stainless Steel (304)': {
    alpha: 17e-6,
    name: 'Stainless Steel',
    unit: '1/°C'
  },
  'Carbon Fiber (CFRP)': {
    alpha: -0.5e-6,
    name: 'Carbon Fiber',
    unit: '1/°C'
  },
  'Brass (Alloy 360)': {
    alpha: 19e-6,
    name: 'Brass',
    unit: '1/°C'
  },
  'Titanium (Grade 5)': {
    alpha: 8.6e-6,
    name: 'Titanium',
    unit: '1/°C'
  }
}

export function calculateThermalExpansion(material, length, deltaT) {
  const materialData = MATERIAL_THERMAL_COEFFICIENTS[material]
  if (!materialData) return null
  
  const alpha = materialData.alpha
  const expansion = alpha * length * deltaT
  
  return {
    expansion: expansion * 1000,
    alpha: alpha,
    material: materialData.name,
    strain: alpha * deltaT
  }
}

export function calculateThermalStress(material, deltaT, elasticModulus, constrained = true) {
  const materialData = MATERIAL_THERMAL_COEFFICIENTS[material]
  if (!materialData) return null
  
  const alpha = materialData.alpha
  const strain = alpha * deltaT
  
  if (!constrained) {
    return {
      stress: 0,
      strain: strain,
      note: 'Unrestrained - free to expand'
    }
  }
  
  const stress = elasticModulus * 1e9 * strain
  
  return {
    stress: stress / 1e6,
    strain: strain,
    force: stress,
    note: 'Fully restrained'
  }
}

export async function getLocationTemperature(latitude, longitude) {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
    )
    
    if (!response.ok) throw new Error('Weather API request failed')
    
    const data = await response.json()
    
    return {
      current: data.current.temperature_2m,
      min: Math.min(...data.daily.temperature_2m_min),
      max: Math.max(...data.daily.temperature_2m_max),
      humidity: data.current.relative_humidity_2m,
      timezone: data.timezone
    }
  } catch (error) {
    console.error('Temperature fetch error:', error)
    return null
  }
}

export function calculateTemperatureRange(location) {
  const seasonalRanges = {
    'Arctic': { summer: { min: -5, max: 10 }, winter: { min: -40, max: -10 } },
    'Temperate': { summer: { min: 15, max: 35 }, winter: { min: -10, max: 10 } },
    'Tropical': { summer: { min: 25, max: 35 }, winter: { min: 20, max: 30 } },
    'Desert': { summer: { min: 30, max: 50 }, winter: { min: 10, max: 25 } },
    'Default': { summer: { min: 20, max: 35 }, winter: { min: -5, max: 15 } }
  }
  
  return seasonalRanges[location] || seasonalRanges['Default']
}

export function analyzeThermalEffects(params) {
  const {
    material,
    length,
    crossSectionArea,
    elasticModulus,
    tempHigh,
    tempLow,
    tempInstall,
    constrained
  } = params
  
  const deltaHigh = tempHigh - tempInstall
  const deltaLow = tempLow - tempInstall
  
  const expansionHigh = calculateThermalExpansion(material, length, deltaHigh)
  const expansionLow = calculateThermalExpansion(material, length, deltaLow)
  
  const stressHigh = calculateThermalStress(material, deltaHigh, elasticModulus, constrained)
  const stressLow = calculateThermalStress(material, deltaLow, elasticModulus, constrained)
  
  const criticalStress = constrained ? Math.max(
    Math.abs(stressHigh?.stress || 0),
    Math.abs(stressLow?.stress || 0)
  ) : 0
  
  return {
    expansionHigh,
    expansionLow,
    stressHigh,
    stressLow,
    criticalStress,
    maxExpansion: Math.max(
      Math.abs(expansionHigh?.expansion || 0),
      Math.abs(expansionLow?.expansion || 0)
    ),
    recommendations: generateThermalRecommendations(criticalStress, constrained)
  }
}

function generateThermalRecommendations(stress, constrained) {
  const recommendations = []
  
  if (!constrained) {
    recommendations.push('Provide expansion joints to accommodate thermal movement')
    recommendations.push('Design supports to allow for free thermal expansion')
    recommendations.push('Consider differential movements at connections')
  } else {
    if (stress > 200) {
      recommendations.push('HIGH THERMAL STRESS: Consider expansion joints or stress relief')
      recommendations.push('Verify material yield strength against thermal stress')
      recommendations.push('Consider using materials with lower thermal expansion coefficient')
    } else if (stress > 100) {
      recommendations.push('MODERATE THERMAL STRESS: Monitor for thermal-induced deformations')
      recommendations.push('Consider partial restraint or sliding supports')
    } else {
      recommendations.push('LOW THERMAL STRESS: Standard detailing adequate')
      recommendations.push('Monitor seasonal temperature variations')
    }
  }
  
  recommendations.push('Account for temperature gradients in large structures')
  recommendations.push('Consider construction sequence and temperature at installation')
  
  return recommendations
}
