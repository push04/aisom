# StructuralVision AI - Professional Engineering Analysis Platform

## Overview
StructuralVision AI is a production-ready React web application designed for professional structural engineers. The platform combines advanced AI with rigorous engineering calculations for comprehensive structural analysis.

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS + JavaScript
- **AI/ML**: TensorFlow.js MoveNet (pose-detection)
- **Charts**: Recharts
- **Maps**: OpenStreetMap
- **Weather API**: Open-Meteo
- **Routing**: React Router DOM v6

## Professional Design System

### Color Palette
- **Primary**: #1F2933 (Dark Steel)
- **Secondary**: #394B59 (Slate)
- **Accent**: #2563EB (Professional Blue)
- **Success**: #22A779
- **Warning**: #E0B400
- **Danger**: #D64545

### Typography
- **Primary Font**: Inter, system-ui
- **Monospace**: Roboto Mono

## Project Structure
```
src/
├── main.jsx              # Entry point
├── App.jsx               # Main app with professional navigation
├── index.css             # Tailwind imports
├── components/
│   └── ErrorBoundary.jsx # Error boundary wrapper
├── pages/
│   ├── Dashboard.jsx     # Professional overview dashboard
│   ├── CrackAnalyzer.jsx # Image-based structural integrity scanner
│   ├── BeamDeflection.jsx # Comprehensive beam analysis with SFD/BMD
│   ├── Ergonomics.jsx    # AI-powered biomechanical assessment
│   └── SiteContext.jsx   # Environmental and geospatial analysis
└── utils/
    ├── materials.js      # Material database (8 engineering materials)
    ├── unitConversion.js # Engineering unit conversions
    ├── exportUtils.js    # JSON/Text/Clipboard export
    └── beamCalculations.js # Advanced beam analysis calculations
```

## Features

### Completed Features

1. **Professional UI/UX Redesign**
   - Dark engineering theme (no emojis)
   - Professional color scheme
   - Smooth animations and transitions
   - Modern navigation with icons
   - Responsive design for all screen sizes

2. **Dashboard**
   - Professional data panels with gradient cards
   - Recent analysis history tracking
   - Quick access modules
   - LocalStorage persistence

3. **Structural Integrity Scanner (Crack Analyzer)**
   - Computer vision-based crack detection
   - Image upload and overlay visualization
   - Severity classification (Minor/Moderate/Severe)
   - Coverage percentage and area estimation
   - Professional recommendations

4. **Beam Analysis Module** (Enhanced)
   - **Beam Types**: Simply Supported, Cantilever, Fixed-Fixed, Propped Cantilever
   - **Load Types**: Point Load, Uniform Distributed Load (UDL), Triangular Load
   - **Diagrams**: Proper SFD (Shear Force Diagram) and BMD (Bending Moment Diagram)
   - **Material Database**: 8 engineering materials with properties
   - **Serviceability Checks**: L/360, L/240, L/180 deflection limits
   - **Export Features**: JSON, Text Report, Clipboard
   - **Real-time calculations** with analytical formulas

5. **Ergonomic Assessment**
   - TensorFlow.js MoveNet pose detection
   - Real-time biomechanical analysis
   - Neck, back, and shoulder angle measurements
   - Risk scoring (Low/Medium/High)
   - Professional corrective recommendations

6. **Site Context Analysis**
   - Real-time weather data (Open-Meteo API)
   - 7-day weather forecast
   - Construction impact analysis
   - OpenStreetMap geospatial integration
   - Environmental condition monitoring

## Recent Changes (November 25, 2025)

### Major Redesign
- Complete UI/UX overhaul with professional engineering aesthetics
- Removed all emojis and implemented professional terminology
- Implemented dark theme with custom color palette
- Added smooth animations and hover effects throughout

### Beam Analysis Enhancements
- Added Propped Cantilever beam type
- Implemented proper SFD and BMD calculations using analytical formulas
- Added piecewise equation-based diagram generation
- Implemented deflection limit checks (L/360, L/240, L/180)
- Enhanced section properties display

### Technical Improvements
- Fixed beam deflection formula validation (load position clamping)
- Corrected inertia unit conversion (m⁴ to cm⁴)
- Added video autoplay safety for ergonomics module
- Implemented proper error handling across all modules
- Created dedicated beam calculations utility

## Engineering Accuracy

### Beam Deflection Formulas
All formulas follow Roark's Formulas for Stress and Strain:

- **Simply Supported Point Load**: δ = P·a²·b²/(3·E·I·L)
- **Simply Supported UDL**: δ = 5·w·L⁴/(384·E·I)
- **Cantilever Point Load**: δ = P·L³/(3·E·I)
- **Fixed-Fixed Point Load**: δ = P·L³/(192·E·I)
- **Propped Cantilever**: Custom analytical expressions

### SFD/BMD Generation
- Piecewise analytical equations
- 100 data points for smooth curves
- Accurate moment and shear calculations
- Position-dependent formulas

## Material Database
1. Structural Steel (A36/S275) - E: 200 GPa
2. Aluminum Alloy (6061-T6) - E: 69 GPa
3. Concrete (C30/37) - E: 25 GPa
4. Timber (Grade C24) - E: 11 GPa
5. Stainless Steel (304) - E: 193 GPa
6. Carbon Fiber (CFRP) - E: 150 GPa
7. Brass (Alloy 360) - E: 100 GPa
8. Titanium (Grade 5) - E: 116 GPa

## Development

### Running the App
```bash
npm install
npm run dev
```

The app will be available at `http://0.0.0.0:5000`

### Build for Production
```bash
npm run build
```

## Architecture Notes
- Professional dark theme with engineering aesthetics
- Error boundaries on all pages
- LocalStorage for analysis persistence
- Vite configured for Replit environment
- Proper unit handling (meters, kN, mm, cm⁴)
- TensorFlow.js pose detection with MoveNet
- Analytical beam calculations (not approximations)

## Future Enhancements Planned
- Load combinations (LRFD/ASD templates)
- Section properties calculator
- Multiple load cases on single beam
- Continuous beam analysis
- Material library with custom properties
- PDF report generation
- Advanced REBA scoring for ergonomics
- Historical weather data analysis
- Seismic hazard integration

## User Target
Professional structural engineers requiring accurate, production-grade analysis tools with modern UI/UX and comprehensive documentation.
