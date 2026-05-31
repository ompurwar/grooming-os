export interface WeatherContext {
  city: string
  temperature: number
  condition: string
}

export async function fetchWeatherContext(lat: number, lon: number): Promise<WeatherContext> {
  try {
    // 1. Get City Name via Reverse Geocoding
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
    const geoData = await geoRes.json()
    const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || 'Unknown City'

    // 2. Get Weather via Open-Meteo
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
    const weatherData = await weatherRes.json()
    const temp = weatherData.current_weather?.temperature || 20
    const code = weatherData.current_weather?.weathercode || 0

    // 3. Map WMO Weather Code to String
    const condition = mapWeatherCode(code)

    return { city, temperature: temp, condition }
  } catch (error) {
    console.error('Error fetching weather context:', error)
    return { city: 'Unknown Location', temperature: 20, condition: 'Clear' }
  }
}

function mapWeatherCode(code: number): string {
  if (code === 0) return 'Clear sky'
  if (code === 1 || code === 2 || code === 3) return 'Partly cloudy'
  if (code === 45 || code === 48) return 'Foggy'
  if (code >= 51 && code <= 57) return 'Drizzle'
  if (code >= 61 && code <= 67) return 'Rain'
  if (code >= 71 && code <= 77) return 'Snow'
  if (code >= 80 && code <= 82) return 'Rain showers'
  if (code >= 85 && code <= 86) return 'Snow showers'
  if (code >= 95) return 'Thunderstorm'
  return 'Clear sky'
}
