import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { materials, getMaterial } from '../utils/materials'
import { calculateBeamAnalysis } from '../utils/beamCalculations'
import { exportToJSON, exportToText, copyToClipboard } from '../utils/exportUtils'
import { useToast } from '../components/Toast'

const IRS_LOADING_STANDARDS = {
  MBG: { name: 'Modified Broad Gauge', axleLoad: 25, description: 'Standard freight loading' },
  HM: { name: 'Heavy Mineral', axleLoad: 30, description: 'Heavy haul mineral traffic' },
  DFC: { name: 'DFC Standard', axleLoad: 32.5, description: 'Dedicated Freight Corridor' }
}

function BeamDeflection() {
  const toast = useToast()
  const [beamType, setBeamType] = useState('simply-supported')
  const [loadType, setLoadType] = useState('point')
  const [diagramMode, setDiagramMode] = useState('moment')
  const [material, setMaterial] = useState('steel')
  const [loadingStandard, setLoadingStandard] = useState('MBG')
  
  const [length, setLength] = useState(12)
  const [load, setLoad] = useState(250)
  const [loadPosition, setLoadPosition] = useState(6)
  const [width, setWidth] = useState(0.4)
  const [height, setHeight] = useState(0.8)
  
  const [results, setResults] = useState(null)
  
  const beamTypes = [
    { value: 'simply-supported', label: 'Simply Supported' },
    { value: 'cantilever', label: 'Cantilever' },
    { value: 'fixed-fixed', label: 'Fixed-Fixed' },
    { value: 'propped-cantilever', label: 'Propped Cantilever' }
  ]
  
  const loadTypes = [
    { value: 'point', label: 'Concentrated Axle Load' },
    { value: 'udl', label: 'Distributed Track Load' },
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
      material: mat.name,
      loadingStandard: IRS_LOADING_STANDARDS[loadingStandard]
    })
    
    const analyses = JSON.parse(localStorage.getItem('recentAnalyses') || '[]')
    analyses.unshift({
      type: 'beam',
      title: `Bridge Analysis - ${beamTypes.find(b => b.value === beamType)?.label}`,
      timestamp: new Date().toISOString(),
      data: { maxDeflection: analysis.maxDeflection, maxMoment: analysis.maxMoment }
    })
    localStorage.setItem('recentAnalyses', JSON.stringify(analyses.slice(0, 50)))
  }
  
  const handleExportJSON = () => {
    exportToJSON({ ...results, parameters: { beamType, loadType, length, load, material } }, 'bridge-analysis')
  }
  
  const handleExportText = () => {
    const text = `
RAILWAY BRIDGE STRUCTURAL ANALYSIS REPORT
==========================================

Configuration (IRS Bridge Rules):
- Bridge Type: ${beamTypes.find(b => b.value === beamType)?.label}
- Loading Standard: ${IRS_LOADING_STANDARDS[loadingStandard].name}
- Axle Load: ${IRS_LOADING_STANDARDS[loadingStandard].axleLoad} tonnes
- Material: ${results.material}
- Span Length: ${length} m
- Applied Load: ${load} kN

Section Properties:
- Width: ${width * 1000} mm
- Depth: ${height * 1000} mm
- Moment of Inertia: ${results.I.toFixed(2)} cm4
- Elastic Modulus: ${results.E} MPa

Analysis Results:
- Maximum Deflection: ${results.maxDeflection.toFixed(3)} mm
- Maximum Bending Moment: ${results.maxMoment.toFixed(2)} kN.m
- Maximum Shear Force: ${results.maxShear.toFixed(2)} kN

Serviceability Check (L/600 as per IRS):
- Allowable Deflection: ${((length * 1000) / 600).toFixed(2)} mm
- Status: ${results.maxDeflection < (length * 1000) / 600 ? 'PASS' : 'FAIL'}

Generated: ${new Date().toLocaleString()}
Reference: IRS Concrete Bridge Code / IRS Steel Bridge Code
    `
    exportToText(text, 'bridge-analysis')
  }
  
  const handleCopyResults = () => {
    const text = `Deflection: ${results.maxDeflection.toFixed(3)} mm | Moment: ${results.maxMoment.toFixed(2)} kN.m | Shear: ${results.maxShear.toFixed(2)} kN`
    copyToClipboard(text)
    toast.success('Results copied to clipboard')
  }
  
  const checkDeflectionLimit = (limit) => {
    const allowable = (length * 1000) / limit
    return results.maxDeflection <= allowable
  }
  
  return (
    <div className="min-h-screen bg-black p-6 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="module-header">
          <div>
            <h1 className="module-title">Railway Bridge Analyzer</h1>
            <p className="module-subtitle">Structural analysis per IRS Bridge Rules and RDSO standards</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="status-indicator online" />
            <span className="text-xs text-primary-500">ACTIVE</span>
          </div>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="rail-card">
            <div className="p-6 border-b border-primary-800">
              <h2 className="text-lg font-bold text-white">Input Parameters</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="rail-label">IRS Loading Standard</label>
                <select 
                  value={loadingStandard} 
                  onChange={(e) => setLoadingStandard(e.target.value)} 
                  className="rail-select"
                >
                  {Object.entries(IRS_LOADING_STANDARDS).map(([key, std]) => (
                    <option key={key} value={key}>{std.name} ({std.axleLoad}t)</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="rail-label">Bridge Configuration</label>
                <select 
                  value={beamType} 
                  onChange={(e) => setBeamType(e.target.value)} 
                  className="rail-select"
                >
                  {beamTypes.map(bt => (
                    <option key={bt.value} value={bt.value}>{bt.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="rail-label">Load Pattern</label>
                <select 
                  value={loadType} 
                  onChange={(e) => setLoadType(e.target.value)} 
                  className="rail-select"
                >
                  {loadTypes.map(lt => (
                    <option key={lt.value} value={lt.value}>{lt.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="rail-label">Material Grade</label>
                <select 
                  value={material} 
                  onChange={(e) => setMaterial(e.target.value)} 
                  className="rail-select"
                >
                  {Object.entries(materials).map(([key, mat]) => (
                    <option key={key} value={key}>{mat.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="border-t border-primary-800 pt-4">
                <label className="rail-label">Span Length (m)</label>
                <input 
                  type="number" 
                  value={length} 
                  onChange={(e) => setLength(parseFloat(e.target.value))} 
                  className="rail-input" 
                  step="0.5" 
                />
              </div>
              
              <div>
                <label className="rail-label">Applied Load (kN)</label>
                <input 
                  type="number" 
                  value={load} 
                  onChange={(e) => setLoad(parseFloat(e.target.value))} 
                  className="rail-input" 
                  step="10" 
                />
              </div>
              
              {loadType === 'point' && beamType === 'simply-supported' && (
                <div>
                  <label className="rail-label">Load Position (m)</label>
                  <input 
                    type="number" 
                    value={loadPosition} 
                    onChange={(e) => setLoadPosition(parseFloat(e.target.value))} 
                    className="rail-input" 
                    step="0.5" 
                    max={length} 
                  />
                </div>
              )}
              
              <div className="border-t border-primary-800 pt-4">
                <label className="rail-label">Section Width (m)</label>
                <input 
                  type="number" 
                  value={width} 
                  onChange={(e) => setWidth(parseFloat(e.target.value))} 
                  className="rail-input" 
                  step="0.05" 
                />
              </div>
              
              <div>
                <label className="rail-label">Section Depth (m)</label>
                <input 
                  type="number" 
                  value={height} 
                  onChange={(e) => setHeight(parseFloat(e.target.value))} 
                  className="rail-input" 
                  step="0.05" 
                />
              </div>
              
              <button 
                onClick={calculateBeam} 
                className="w-full bg-white hover:bg-primary-200 text-black py-3 rounded-lg transition-all duration-200 font-semibold"
              >
                Analyze Bridge
              </button>
            </div>
          </div>
          
          <div className="lg:col-span-3 space-y-6">
            {results && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="stat-card">
                    <div className="text-xs uppercase tracking-wider text-primary-500 mb-1">Maximum Deflection</div>
                    <div className="metric-display">{results.maxDeflection.toFixed(3)}</div>
                    <div className="metric-label">millimeters</div>
                  </div>
                  <div className="stat-card">
                    <div className="text-xs uppercase tracking-wider text-primary-500 mb-1">Maximum Moment</div>
                    <div className="metric-display">{results.maxMoment.toFixed(2)}</div>
                    <div className="metric-label">kN.m</div>
                  </div>
                  <div className="stat-card">
                    <div className="text-xs uppercase tracking-wider text-primary-500 mb-1">Maximum Shear</div>
                    <div className="metric-display">{results.maxShear.toFixed(2)}</div>
                    <div className="metric-label">kN</div>
                  </div>
                </div>
                
                <div className="rail-card">
                  <div className="p-6 border-b border-primary-800 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white">Structural Diagrams</h2>
                    <div className="flex space-x-2">
                      {['deflection', 'moment', 'shear'].map(mode => (
                        <button 
                          key={mode}
                          onClick={() => setDiagramMode(mode)} 
                          className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium capitalize ${
                            diagramMode === mode 
                              ? 'bg-white text-black' 
                              : 'bg-primary-800 text-primary-400 hover:bg-primary-700'
                          }`}
                        >
                          {mode === 'moment' ? 'BMD' : mode === 'shear' ? 'SFD' : mode}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-6">
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={
                        diagramMode === 'deflection' ? results.deflectionData :
                        diagramMode === 'moment' ? results.momentData :
                        results.shearData
                      }>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis 
                          dataKey="x" 
                          stroke="#666"
                          label={{ value: 'Position (m)', position: 'insideBottom', offset: -5, fill: '#666' }} 
                        />
                        <YAxis 
                          stroke="#666"
                          label={{ 
                            value: diagramMode === 'deflection' ? 'Deflection (mm)' : 
                                   diagramMode === 'moment' ? 'Moment (kN.m)' : 'Shear (kN)', 
                            angle: -90, 
                            position: 'insideLeft',
                            fill: '#666'
                          }} 
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                          labelStyle={{ color: '#888' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#ffffff" 
                          strokeWidth={2} 
                          dot={false}
                          name={diagramMode === 'deflection' ? 'Deflection' : diagramMode === 'moment' ? 'Moment' : 'Shear'}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rail-card p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Serviceability Checks (IRS)</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-primary-900/50 rounded border border-primary-800">
                        <span className="text-primary-400">L/600 (Railway Bridges)</span>
                        <span className={`font-bold ${checkDeflectionLimit(600) ? 'text-white' : 'text-primary-400'}`}>
                          {checkDeflectionLimit(600) ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-primary-900/50 rounded border border-primary-800">
                        <span className="text-primary-400">L/800 (High Speed)</span>
                        <span className={`font-bold ${checkDeflectionLimit(800) ? 'text-white' : 'text-primary-400'}`}>
                          {checkDeflectionLimit(800) ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-primary-900/50 rounded border border-primary-800">
                        <span className="text-primary-400">L/1000 (DFC Standard)</span>
                        <span className={`font-bold ${checkDeflectionLimit(1000) ? 'text-white' : 'text-primary-400'}`}>
                          {checkDeflectionLimit(1000) ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rail-card p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Export Options</h3>
                    <div className="space-y-2">
                      <button 
                        onClick={handleExportJSON} 
                        className="w-full bg-primary-800 hover:bg-primary-700 text-white py-3 rounded-lg transition-all duration-200 border border-primary-700"
                      >
                        Export as JSON
                      </button>
                      <button 
                        onClick={handleExportText} 
                        className="w-full bg-primary-800 hover:bg-primary-700 text-white py-3 rounded-lg transition-all duration-200 border border-primary-700"
                      >
                        Generate Report
                      </button>
                      <button 
                        onClick={handleCopyResults} 
                        className="w-full bg-primary-800 hover:bg-primary-700 text-white py-3 rounded-lg transition-all duration-200 border border-primary-700"
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {!results && (
              <div className="rail-card p-12 text-center">
                <svg className="w-24 h-24 mx-auto mb-4 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-primary-500 text-lg">Configure bridge parameters and calculate to view analysis results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BeamDeflection
