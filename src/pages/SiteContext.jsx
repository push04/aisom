import React, { useState, useEffect } from 'react'

function SiteContext() {
  const [location, setLocation] = useState('')
  const [coordinates, setCoordinates] = useState({ lat: 51.5074, lon: -0.1278 })
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const fetchWeather = async (lat, lon) => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
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
  
  const handleSearch = () => {
    alert('Location search requires deployment for geocoding API proxy. Using default coordinates.')
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
  
  return (
    <div className="min-h-screen bg-primary-950">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Site Context Analysis</h1>
          <p className="text-secondary-300">Environmental conditions and geospatial data for construction planning</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="bg-primary-900 rounded-lg shadow-lg border border-primary-800">
              <div className="px-6 py-4 border-b border-primary-800">
                <h2 className="text-xl font-bold text-white">Location Parameters</h2>
              </div>
              <div className="p-6">
                <div className="flex space-x-2 mb-4">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter location coordinates"
                    className="flex-1 bg-primary-800 border border-primary-700 text-white rounded px-3 py-2 focus:border-accent focus:outline-none"
                  />
                  <button
                    onClick={handleSearch}
                    className="bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded transition-all duration-200"
                  >
                    Search
                  </button>
                </div>
                
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex justify-between p-2 bg-primary-800 rounded">
                    <span className="text-secondary-400">Latitude:</span>
                    <span className="text-white">{coordinates.lat}°</span>
                  </div>
                  <div className="flex justify-between p-2 bg-primary-800 rounded">
                    <span className="text-secondary-400">Longitude:</span>
                    <span className="text-white">{coordinates.lon}°</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-primary-900 rounded-lg shadow-lg border border-primary-800">
              <div className="px-6 py-4 border-b border-primary-800">
                <h2 className="text-xl font-bold text-white">Current Conditions</h2>
              </div>
              <div className="p-6">
                {loading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent mx-auto"></div>
                  </div>
                )}
                
                {weather && !loading && (
                  <div className="space-y-4">
                    <div className="bg-accent/10 p-4 rounded-lg border border-accent/30">
                      <p className="text-sm text-secondary-400 mb-1">Weather Status</p>
                      <p className="text-2xl font-bold text-accent">
                        {getWeatherDescription(weather.current.weatherCode)}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-3 bg-primary-800 rounded border border-primary-700">
                        <p className="text-xs text-secondary-400 mb-1">Temp</p>
                        <p className="text-xl font-bold text-white">{weather.current.temperature}°C</p>
                      </div>
                      <div className="text-center p-3 bg-primary-800 rounded border border-primary-700">
                        <p className="text-xs text-secondary-400 mb-1">Humidity</p>
                        <p className="text-xl font-bold text-white">{weather.current.humidity}%</p>
                      </div>
                      <div className="text-center p-3 bg-primary-800 rounded border border-primary-700">
                        <p className="text-xs text-secondary-400 mb-1">Wind</p>
                        <p className="text-xl font-bold text-white">{weather.current.windSpeed}</p>
                        <p className="text-xs text-secondary-500">km/h</p>
                      </div>
                    </div>
                    
                    <div className="bg-primary-800/50 p-4 rounded border border-primary-700">
                      <h3 className="font-semibold text-white mb-2 text-sm uppercase">Construction Impact Analysis</h3>
                      <ul className="text-sm text-secondary-300 space-y-1">
                        {weather.current.temperature > 30 && (
                          <li>• High temperature - ensure worker hydration protocols</li>
                        )}
                        {weather.current.temperature < 5 && (
                          <li>• Cold conditions - concrete curing time affected</li>
                        )}
                        {weather.current.windSpeed > 40 && (
                          <li>• High winds - suspend crane operations</li>
                        )}
                        {weather.current.humidity > 80 && (
                          <li>• High humidity - painting/coating work delayed</li>
                        )}
                        {weather.current.temperature > 5 && weather.current.temperature < 30 && 
                         weather.current.windSpeed < 40 && (
                          <li>• Favorable conditions for construction activities</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-primary-900 rounded-lg shadow-lg border border-primary-800">
              <div className="px-6 py-4 border-b border-primary-800">
                <h2 className="text-xl font-bold text-white">Geospatial Map</h2>
              </div>
              <div className="p-6">
                <iframe
                  width="100%"
                  height="500"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight="0"
                  marginWidth="0"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.lon-0.1},${coordinates.lat-0.1},${coordinates.lon+0.1},${coordinates.lat+0.1}&layer=mapnik&marker=${coordinates.lat},${coordinates.lon}`}
                  className="rounded border border-primary-700"
                ></iframe>
                <div className="mt-3 text-sm">
                  <a 
                    href={`https://www.openstreetmap.org/?mlat=${coordinates.lat}&mlon=${coordinates.lon}#map=15/${coordinates.lat}/${coordinates.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:text-accent-hover transition-colors"
                  >
                    View larger map →
                  </a>
                </div>
              </div>
            </div>
            
            {weather && (
              <div className="bg-primary-900 rounded-lg shadow-lg border border-primary-800">
                <div className="px-6 py-4 border-b border-primary-800">
                  <h2 className="text-xl font-bold text-white">7-Day Weather Forecast</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                    {weather.daily.temperature_2m_max.slice(0, 7).map((maxTemp, index) => (
                      <div key={index} className="text-center p-3 bg-primary-800 rounded border border-primary-700">
                        <p className="text-sm text-secondary-400 mb-2 font-semibold">
                          {new Date(weather.daily.time[index]).toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className="text-lg font-bold text-danger">{maxTemp}°</p>
                        <p className="text-sm text-accent">{weather.daily.temperature_2m_min[index]}°</p>
                        <div className="mt-2 pt-2 border-t border-primary-700">
                          <p className="text-xs text-secondary-500">
                            Precip: {weather.daily.precipitation_sum[index]}mm
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SiteContext
