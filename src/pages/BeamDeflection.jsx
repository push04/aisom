import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { materials, getMaterial } from '../utils/materials'
import { calculateBeamAnalysis } from '../utils/beamCalculations'
import { exportToJSON, exportToText, copyToClipboard } from '../utils/exportUtils'

function BeamDeflection() {
  const [beamType, setBeamType] = useState('simply-supported')
  const [loadType, setLoadType] = useState('point')
  const [diagramMode, setDiagramMode] = useState('moment')
  const [material, setMaterial] = useState('steel')
  
  const [length, setLength] = useState(5)
  const [load, setLoad] = useState(10)
  const [loadPosition, setLoadPosition] = useState(2.5)
  const [width, setWidth] = useState(0.2)
  const [height, setHeight] = useState(0.3)
  
  const [results, setResults] = useState(null)
  
  const beamTypes = [
    { value: 'simply-supported', label: 'Simply Supported' },
    { value: 'cantilever', label: 'Cantilever' },
    { value: 'fixed-fixed', label: 'Fixed-Fixed' },
    { value: 'propped-cantilever', label: 'Propped Cantilever' }
  ]
  
  const loadTypes = [
    { value: 'point', label: 'Point Load' },
    { value: 'udl', label: 'Uniform Distributed Load (UDL)' },
    { value: 'triangular', label: 'Triangular Load' }
  ]
  
  const calculateBeam = () => {
    const mat = getMaterial(material)
    const E = mat.E * 1e6
    const I = (width * Math.pow(height, 3)) / 12
    const L = length
    const P = load * 1000
    const a = Math.max(0.01, Math.min(loadPosition, L - 0.01))
    const w = (load * 1000) / L
    
    const analysis = calculateBeamAnalysis({
      beamType,
      loadType,
      E,
      I,
      L,
      P,
      a,
      w
    })
    
    setResults({
      ...analysis,
      I: I * 1e8,
      E: E / 1e6,
      material: mat.name
    })
    
    const analyses = JSON.parse(localStorage.getItem('recentAnalyses') || '[]')
    analyses.unshift({
      type: 'beam',
      title: `${beamTypes.find(b => b.value === beamType)?.label} - ${loadTypes.find(l => l.value === loadType)?.label}`,
      timestamp: new Date().toISOString(),
      data: { maxDeflection: analysis.maxDeflection, maxMoment: analysis.maxMoment }
    })
    localStorage.setItem('recentAnalyses', JSON.stringify(analyses.slice(0, 50)))
  }
  
  const handleExportJSON = () => {
    exportToJSON({ ...results, parameters: { beamType, loadType, length, load, material } }, 'beam-analysis')
  }
  
  const handleExportText = () => {
    const text = `
STRUCTURAL BEAM ANALYSIS REPORT
================================

Configuration:
- Beam Type: ${beamTypes.find(b => b.value === beamType)?.label}
- Load Type: ${loadTypes.find(l => l.value === loadType)?.label}
- Material: ${results.material}
- Span Length: ${length} m
- Applied Load: ${load} kN

Section Properties:
- Width: ${width * 1000} mm
- Height: ${height * 1000} mm
- Moment of Inertia: ${results.I.toFixed(2)} cm⁴
- Elastic Modulus: ${results.E} MPa

Analysis Results:
- Maximum Deflection: ${results.maxDeflection.toFixed(3)} mm
- Maximum Moment: ${results.maxMoment.toFixed(2)} kN·m
- Maximum Shear: ${results.maxShear.toFixed(2)} kN

Serviceability Check (L/360):
- Allowable Deflection: ${((length * 1000) / 360).toFixed(2)} mm
- Status: ${results.maxDeflection < (length * 1000) / 360 ? 'PASS' : 'FAIL'}

Generated: ${new Date().toLocaleString()}
    `
    exportToText(text, 'beam-analysis')
  }
  
  const handleCopyResults = () => {
    const text = `Deflection: ${results.maxDeflection.toFixed(3)} mm | Moment: ${results.maxMoment.toFixed(2)} kN·m | Shear: ${results.maxShear.toFixed(2)} kN`
    copyToClipboard(text)
    alert('Results copied to clipboard')
  }
  
  const checkDeflectionLimit = (limit) => {
    const allowable = (length * 1000) / limit
    return results.maxDeflection <= allowable
  }
  
  return (
    <div className="min-h-screen bg-primary-950">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Bridge Girder & Sleeper Load Analysis</h1>
          <p className="text-secondary-300">Railway bridge structural analysis with IRS Bridge Rules and RDSO standards</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="bg-primary-900 rounded-lg shadow-lg border border-primary-800">
            <div className="px-6 py-4 border-b border-primary-800">
              <h2 className="text-xl font-bold text-white">Input Parameters</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">Beam Configuration</label>
                <select 
                  value={beamType} 
                  onChange={(e) => setBeamType(e.target.value)} 
                  className="w-full bg-primary-800 border border-primary-700 text-white rounded px-3 py-2 focus:border-accent focus:outline-none"
                >
                  {beamTypes.map(bt => (
                    <option key={bt.value} value={bt.value}>{bt.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">Load Pattern</label>
                <select 
                  value={loadType} 
                  onChange={(e) => setLoadType(e.target.value)} 
                  className="w-full bg-primary-800 border border-primary-700 text-white rounded px-3 py-2 focus:border-accent focus:outline-none"
                >
                  {loadTypes.map(lt => (
                    <option key={lt.value} value={lt.value}>{lt.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">Material Grade</label>
                <select 
                  value={material} 
                  onChange={(e) => setMaterial(e.target.value)} 
                  className="w-full bg-primary-800 border border-primary-700 text-white rounded px-3 py-2 focus:border-accent focus:outline-none"
                >
                  {Object.entries(materials).map(([key, mat]) => (
                    <option key={key} value={key}>{mat.name} ({mat.description})</option>
                  ))}
                </select>
              </div>
              
              <div className="border-t border-primary-800 pt-4">
                <label className="block text-sm font-medium text-secondary-300 mb-2">Span Length (m)</label>
                <input 
                  type="number" 
                  value={length} 
                  onChange={(e) => setLength(parseFloat(e.target.value))} 
                  className="w-full bg-primary-800 border border-primary-700 text-white rounded px-3 py-2 focus:border-accent focus:outline-none" 
                  step="0.1" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">Applied Load (kN)</label>
                <input 
                  type="number" 
                  value={load} 
                  onChange={(e) => setLoad(parseFloat(e.target.value))} 
                  className="w-full bg-primary-800 border border-primary-700 text-white rounded px-3 py-2 focus:border-accent focus:outline-none" 
                  step="0.1" 
                />
              </div>
              
              {loadType === 'point' && beamType === 'simply-supported' && (
                <div>
                  <label className="block text-sm font-medium text-secondary-300 mb-2">Load Position (m)</label>
                  <input 
                    type="number" 
                    value={loadPosition} 
                    onChange={(e) => setLoadPosition(parseFloat(e.target.value))} 
                    className="w-full bg-primary-800 border border-primary-700 text-white rounded px-3 py-2 focus:border-accent focus:outline-none" 
                    step="0.1" 
                    max={length} 
                  />
                </div>
              )}
              
              <div className="border-t border-primary-800 pt-4">
                <label className="block text-sm font-medium text-secondary-300 mb-2">Section Width (m)</label>
                <input 
                  type="number" 
                  value={width} 
                  onChange={(e) => setWidth(parseFloat(e.target.value))} 
                  className="w-full bg-primary-800 border border-primary-700 text-white rounded px-3 py-2 focus:border-accent focus:outline-none" 
                  step="0.01" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">Section Height (m)</label>
                <input 
                  type="number" 
                  value={height} 
                  onChange={(e) => setHeight(parseFloat(e.target.value))} 
                  className="w-full bg-primary-800 border border-primary-700 text-white rounded px-3 py-2 focus:border-accent focus:outline-none" 
                  step="0.01" 
                />
              </div>
              
              <button 
                onClick={calculateBeam} 
                className="w-full bg-accent hover:bg-accent-hover text-white py-3 rounded-lg transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Calculate Analysis
              </button>
            </div>
          </div>
          
          <div className="lg:col-span-3 space-y-6">
            {results && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 rounded-lg p-6">
                    <h3 className="text-sm font-medium text-secondary-400 mb-1">Maximum Deflection</h3>
                    <p className="text-4xl font-bold text-accent mb-2">{results.maxDeflection.toFixed(3)}</p>
                    <p className="text-sm text-secondary-500">millimeters</p>
                  </div>
                  <div className="bg-gradient-to-br from-success/20 to-success/10 border border-success/30 rounded-lg p-6">
                    <h3 className="text-sm font-medium text-secondary-400 mb-1">Maximum Moment</h3>
                    <p className="text-4xl font-bold text-success mb-2">{results.maxMoment.toFixed(2)}</p>
                    <p className="text-sm text-secondary-500">kN·m</p>
                  </div>
                  <div className="bg-gradient-to-br from-warning/20 to-warning/10 border border-warning/30 rounded-lg p-6">
                    <h3 className="text-sm font-medium text-secondary-400 mb-1">Maximum Shear</h3>
                    <p className="text-4xl font-bold text-warning mb-2">{results.maxShear.toFixed(2)}</p>
                    <p className="text-sm text-secondary-500">kN</p>
                  </div>
                </div>
                
                <div className="bg-primary-900 rounded-lg shadow-lg border border-primary-800">
                  <div className="px-6 py-4 border-b border-primary-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Structural Diagrams</h2>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setDiagramMode('deflection')} 
                        className={`px-4 py-2 rounded transition-all duration-200 ${diagramMode === 'deflection' ? 'bg-accent text-white shadow-lg' : 'bg-primary-800 text-secondary-400 hover:bg-primary-700'}`}
                      >
                        Deflection
                      </button>
                      <button 
                        onClick={() => setDiagramMode('moment')} 
                        className={`px-4 py-2 rounded transition-all duration-200 ${diagramMode === 'moment' ? 'bg-accent text-white shadow-lg' : 'bg-primary-800 text-secondary-400 hover:bg-primary-700'}`}
                      >
                        BMD
                      </button>
                      <button 
                        onClick={() => setDiagramMode('shear')} 
                        className={`px-4 py-2 rounded transition-all duration-200 ${diagramMode === 'shear' ? 'bg-accent text-white shadow-lg' : 'bg-primary-800 text-secondary-400 hover:bg-primary-700'}`}
                      >
                        SFD
                      </button>
                    </div>
                  </div>
                  <div className="p-6 bg-primary-800/30">
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={
                        diagramMode === 'deflection' ? results.deflectionData :
                        diagramMode === 'moment' ? results.momentData :
                        results.shearData
                      }>
                        <CartesianGrid strokeDasharray="3 3" stroke="#394B59" />
                        <XAxis 
                          dataKey="x" 
                          stroke="#9AA5B1"
                          label={{ value: 'Position (m)', position: 'insideBottom', offset: -5, fill: '#9AA5B1' }} 
                        />
                        <YAxis 
                          stroke="#9AA5B1"
                          label={{ 
                            value: diagramMode === 'deflection' ? 'Deflection (mm)' : 
                                   diagramMode === 'moment' ? 'Moment (kN·m)' : 
                                   'Shear (kN)', 
                            angle: -90, 
                            position: 'insideLeft',
                            fill: '#9AA5B1'
                          }} 
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2933', border: '1px solid #486581', borderRadius: '8px' }}
                          labelStyle={{ color: '#9AA5B1' }}
                          itemStyle={{ color: '#2563EB' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#2563EB" 
                          strokeWidth={3} 
                          dot={false}
                          name={diagramMode === 'deflection' ? 'Deflection' : diagramMode === 'moment' ? 'Moment' : 'Shear'}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-primary-900 rounded-lg shadow-lg border border-primary-800 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Serviceability Checks</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-primary-800 rounded">
                        <span className="text-secondary-300">L/360 Limit</span>
                        <span className={`font-bold ${checkDeflectionLimit(360) ? 'text-success' : 'text-danger'}`}>
                          {checkDeflectionLimit(360) ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-primary-800 rounded">
                        <span className="text-secondary-300">L/240 Limit</span>
                        <span className={`font-bold ${checkDeflectionLimit(240) ? 'text-success' : 'text-danger'}`}>
                          {checkDeflectionLimit(240) ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-primary-800 rounded">
                        <span className="text-secondary-300">L/180 Limit</span>
                        <span className={`font-bold ${checkDeflectionLimit(180) ? 'text-success' : 'text-danger'}`}>
                          {checkDeflectionLimit(180) ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-primary-900 rounded-lg shadow-lg border border-primary-800 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Export Options</h3>
                    <div className="space-y-2">
                      <button 
                        onClick={handleExportJSON} 
                        className="w-full bg-primary-800 hover:bg-primary-700 text-white py-3 rounded transition-all duration-200 border border-primary-700 hover:border-accent"
                      >
                        Export as JSON
                      </button>
                      <button 
                        onClick={handleExportText} 
                        className="w-full bg-primary-800 hover:bg-primary-700 text-white py-3 rounded transition-all duration-200 border border-primary-700 hover:border-accent"
                      >
                        Generate Report
                      </button>
                      <button 
                        onClick={handleCopyResults} 
                        className="w-full bg-primary-800 hover:bg-primary-700 text-white py-3 rounded transition-all duration-200 border border-primary-700 hover:border-accent"
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {!results && (
              <div className="bg-primary-900 rounded-lg shadow-lg border border-primary-800 p-12 text-center">
                <svg className="w-24 h-24 mx-auto mb-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-secondary-400 text-lg">Configure beam parameters and calculate to view analysis results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BeamDeflection
