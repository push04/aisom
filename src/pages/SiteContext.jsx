import React, { useState, useEffect } from 'react'

const INDIAN_RAILWAY_ZONES = [
  { name: 'Northern Railway', lat: 28.6139, lon: 77.2090 },
  { name: 'Southern Railway', lat: 13.0827, lon: 80.2707 },
  { name: 'Central Railway', lat: 19.0760, lon: 72.8777 },
  { name: 'Eastern Railway', lat: 22.5726, lon: 88.3639 },
  { name: 'Western Railway', lat: 19.0760, lon: 72.8777 },
  { name: 'North Western Railway', lat: 26.9124, lon: 75.7873 },
  { name: 'South Central Railway', lat: 17.3850, lon: 78.4867 },
  { name: 'South Eastern Railway', lat: 22.5726, lon: 88.3639 }
]

function SiteContext() {
  const [selectedZone, setSelectedZone] = useState(INDIAN_RAILWAY_ZONES[0])
  const [coordinates, setCoordinates] = useState({ lat: 28.6139, lon: 77.2090 })
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const fetchWeather = async (lat, lon) => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia/Kolkata`
      )
      const data = await response.json()
      
      setWeather({
        current: {
          temperature: data.current.temperature_2m,
          humidity: data.current.relative_humidity_2m,
          windSpeed: data.current.wind_speed_10m,
          weatherCode: data.current.weather_code
        },
        daily: data.daily
      })
    } catch (error) {
      console.error('Weather fetch error:', error)
    }
    setLoading(false)
  }
  
  useEffect(() => {
    fetchWeather(coordinates.lat, coordinates.lon)
  }, [coordinates])
  
  const handleZoneSelect = (zone) => {
    setSelectedZone(zone)
    setCoordinates({ lat: zone.lat, lon: zone.lon })
  }
  
  const getWeatherDescription = (code) => {
    const descriptions = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Fog',
      51: 'Light drizzle',
      61: 'Light rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Light snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      95: 'Thunderstorm'
    }
    return descriptions[code] || 'Unknown'
  }

  const getRailwayImpact = (weather) => {
    const impacts = []
    
    if (weather.current.temperature > 45) {
      impacts.push({ type: 'critical', text: 'Extreme heat - rail buckle risk, speed restriction advised' })
    } else if (weather.current.temperature > 40) {
      impacts.push({ type: 'warning', text: 'High temperature - monitor for rail expansion' })
    }
    
    if (weather.current.temperature < 5) {
      impacts.push({ type: 'warning', text: 'Cold conditions - check point heaters' })
    }
    
    if (weather.current.windSpeed > 70) {
      impacts.push({ type: 'critical', text: 'High winds - OHE inspection required' })
    } else if (weather.current.windSpeed > 50) {
      impacts.push({ type: 'warning', text: 'Strong winds - monitor pantograph operations' })
    }
    
    if (weather.current.humidity > 90) {
      impacts.push({ type: 'info', text: 'High humidity - fog formation likely' })
    }
    
    const weatherCode = weather.current.weatherCode
    if ([61, 63, 65, 95].includes(weatherCode)) {
      impacts.push({ type: 'warning', text: 'Rainfall - check track drainage and ballast' })
    }
    
    if (impacts.length === 0) {
      impacts.push({ type: 'good', text: 'Weather conditions favorable for railway operations' })
    }
    
    return impacts
  }
  
  return (
    <div className="min-h-screen bg-black p-6 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="module-header">
          <div>
            <h1 className="module-title">Corridor Environment Monitor</h1>
            <p className="module-subtitle">Real-time weather data for railway corridor planning and operations</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="status-indicator online" />
            <span className="text-xs text-primary-500">LIVE</span>
          </div>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className="rail-card">
              <div className="p-6 border-b border-primary-800">
                <h2 className="text-lg font-bold text-white">Railway Zone Selection</h2>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  {INDIAN_RAILWAY_ZONES.map((zone, index) => (
                    <button
                      key={index}
                      onClick={() => handleZoneSelect(zone)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedZone.name === zone.name
                          ? 'bg-white text-black'
                          : 'bg-primary-900/50 text-primary-400 hover:bg-primary-800 border border-primary-800'
                      }`}
                    >
                      <div className="font-medium">{zone.name}</div>
                      <div className="text-xs opacity-70">{zone.lat.toFixed(2)}°N, {zone.lon.toFixed(2)}°E</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="rail-card">
              <div className="p-6 border-b border-primary-800">
                <h2 className="text-lg font-bold text-white">Current Conditions</h2>
              </div>
              <div className="p-6">
                {loading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent mx-auto"></div>
                  </div>
                )}
                
                {weather && !loading && (
                  <div className="space-y-4">
                    <div className="p-4 bg-primary-900/50 rounded-lg border border-white/20">
                      <div className="text-xs uppercase tracking-wider text-primary-500 mb-1">Weather Status</div>
                      <div className="text-2xl font-bold text-white">
                        {getWeatherDescription(weather.current.weatherCode)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-3 bg-primary-900/50 rounded-lg border border-primary-800">
                        <div className="text-xs text-primary-500 mb-1">Temp</div>
                        <div className="text-xl font-bold text-white">{weather.current.temperature}°C</div>
                      </div>
                      <div className="text-center p-3 bg-primary-900/50 rounded-lg border border-primary-800">
                        <div className="text-xs text-primary-500 mb-1">Humidity</div>
                        <div className="text-xl font-bold text-white">{weather.current.humidity}%</div>
                      </div>
                      <div className="text-center p-3 bg-primary-900/50 rounded-lg border border-primary-800">
                        <div className="text-xs text-primary-500 mb-1">Wind</div>
                        <div className="text-xl font-bold text-white">{weather.current.windSpeed}</div>
                        <div className="text-xs text-primary-600">km/h</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            <div className="rail-card">
              <div className="p-6 border-b border-primary-800">
                <h2 className="text-lg font-bold text-white">Corridor Map - {selectedZone.name}</h2>
              </div>
              <div className="p-6">
                <iframe
                  width="100%"
                  height="400"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight="0"
                  marginWidth="0"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.lon-0.5},${coordinates.lat-0.5},${coordinates.lon+0.5},${coordinates.lat+0.5}&layer=mapnik&marker=${coordinates.lat},${coordinates.lon}`}
                  className="rounded-lg border border-primary-700"
                  style={{ filter: 'grayscale(100%) invert(90%) contrast(90%)' }}
                ></iframe>
                <div className="mt-3">
                  <a 
                    href={`https://www.openstreetmap.org/?mlat=${coordinates.lat}&mlon=${coordinates.lon}#map=12/${coordinates.lat}/${coordinates.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-500 hover:text-white transition-colors"
                  >
                    View larger map
                  </a>
                </div>
              </div>
            </div>
            
            {weather && (
              <>
                <div className="rail-card">
                  <div className="p-6 border-b border-primary-800">
                    <h2 className="text-lg font-bold text-white">Railway Operations Impact</h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {getRailwayImpact(weather).map((impact, index) => (
                        <div 
                          key={index} 
                          className={`p-4 rounded-lg border ${
                            impact.type === 'critical' ? 'bg-primary-900 border-primary-600' :
                            impact.type === 'warning' ? 'bg-primary-900/80 border-primary-700' :
                            impact.type === 'good' ? 'bg-primary-900/50 border-white/20' :
                            'bg-primary-900/50 border-primary-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {impact.type === 'critical' && (
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            )}
                            {impact.type === 'warning' && (
                              <svg className="w-5 h-5 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                            {impact.type === 'good' && (
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                            <span className="text-sm text-primary-300">{impact.text}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rail-card">
                  <div className="p-6 border-b border-primary-800">
                    <h2 className="text-lg font-bold text-white">7-Day Forecast</h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-7 gap-2">
                      {weather.daily.temperature_2m_max.slice(0, 7).map((maxTemp, index) => (
                        <div key={index} className="text-center p-3 bg-primary-900/50 rounded-lg border border-primary-800">
                          <div className="text-xs text-primary-500 mb-2 font-medium">
                            {new Date(weather.daily.time[index]).toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className="text-lg font-bold text-white">{maxTemp}°</div>
                          <div className="text-sm text-primary-400">{weather.daily.temperature_2m_min[index]}°</div>
                          <div className="mt-2 pt-2 border-t border-primary-800">
                            <div className="text-xs text-primary-600">
                              {weather.daily.precipitation_sum[index]}mm
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SiteContext
