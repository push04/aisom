import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import CrackAnalyzer from './pages/CrackAnalyzer'
import BeamDeflection from './pages/BeamDeflection'
import Ergonomics from './pages/Ergonomics'
import SiteContext from './pages/SiteContext'
import DiagramBuilder from './pages/DiagramBuilder'
import TrackInspection from './pages/TrackInspection'
import LocomotiveHealth from './pages/LocomotiveHealth'
import FastenerDetection from './pages/FastenerDetection'
import PantographMonitor from './pages/PantographMonitor'
import SignalAnalyzer from './pages/SignalAnalyzer'
import WheelProfile from './pages/WheelProfile'
import SleeperCondition from './pages/SleeperCondition'
import BallastAnalyzer from './pages/BallastAnalyzer'
import OHEMonitor from './pages/OHEMonitor'
import LevelCrossing from './pages/LevelCrossing'
import TunnelClearance from './pages/TunnelClearance'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <Router>
      <ToastProvider>
        <div className="min-h-screen bg-black">
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-lg">
            Skip to main content
          </a>
          <Sidebar />
          <main id="main-content" className="ml-16 lg:ml-72 transition-all duration-300 min-h-screen">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/track-inspection" element={<TrackInspection />} />
                <Route path="/crack-analyzer" element={<CrackAnalyzer />} />
                <Route path="/locomotive-health" element={<LocomotiveHealth />} />
                <Route path="/fastener-detection" element={<FastenerDetection />} />
                <Route path="/pantograph-monitor" element={<PantographMonitor />} />
                <Route path="/signal-analyzer" element={<SignalAnalyzer />} />
                <Route path="/wheel-profile" element={<WheelProfile />} />
                <Route path="/sleeper-condition" element={<SleeperCondition />} />
                <Route path="/ballast-analyzer" element={<BallastAnalyzer />} />
                <Route path="/ohe-monitor" element={<OHEMonitor />} />
                <Route path="/level-crossing" element={<LevelCrossing />} />
                <Route path="/tunnel-clearance" element={<TunnelClearance />} />
                <Route path="/beam-deflection" element={<BeamDeflection />} />
                <Route path="/diagram-builder" element={<DiagramBuilder />} />
                <Route path="/ergonomics" element={<Ergonomics />} />
                <Route path="/site-context" element={<SiteContext />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </ToastProvider>
    </Router>
  )
}

export default App
