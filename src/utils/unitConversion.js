export function convertLength(value, fromUnit, toUnit) {
  const toMeters = {
    m: 1,
    mm: 0.001,
    cm: 0.01,
    ft: 0.3048,
    in: 0.0254
  }
  
  return value * toMeters[fromUnit] / toMeters[toUnit]
}

export function convertForce(value, fromUnit, toUnit) {
  const toNewtons = {
    N: 1,
    kN: 1000,
    lb: 4.448,
    kip: 4448.22
  }
  
  return value * toNewtons[fromUnit] / toNewtons[toUnit]
}

export function convertStress(value, fromUnit, toUnit) {
  const toPascals = {
    Pa: 1,
    kPa: 1000,
    MPa: 1000000,
    GPa: 1000000000,
    psi: 6894.76,
    ksi: 6894760
  }
  
  return value * toPascals[fromUnit] / toPascals[toUnit]
}
