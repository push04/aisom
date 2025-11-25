export const materials = {
  steel: {
    name: 'Structural Steel',
    E: 200000, // MPa
    density: 7850, // kg/m³
    yieldStrength: 250,
    description: 'A36 / S275'
  },
  aluminum: {
    name: 'Aluminum Alloy',
    E: 69000,
    density: 2700,
    yieldStrength: 240,
    description: '6061-T6'
  },
  concrete: {
    name: 'Concrete',
    E: 25000,
    density: 2400,
    yieldStrength: 30,
    description: 'C30/37'
  },
  timber: {
    name: 'Timber',
    E: 11000,
    density: 600,
    yieldStrength: 10,
    description: 'Grade C24'
  },
  stainlessSteel: {
    name: 'Stainless Steel',
    E: 193000,
    density: 8000,
    yieldStrength: 215,
    description: '304'
  },
  carbonFiber: {
    name: 'Carbon Fiber (FRP)',
    E: 150000,
    density: 1600,
    yieldStrength: 600,
    description: 'CFRP'
  },
  brass: {
    name: 'Brass',
    E: 100000,
    density: 8500,
    yieldStrength: 200,
    description: 'Alloy 360'
  },
  titanium: {
    name: 'Titanium',
    E: 116000,
    density: 4500,
    yieldStrength: 880,
    description: 'Grade 5'
  }
}

export function getMaterial(key) {
  return materials[key] || materials.steel
}
