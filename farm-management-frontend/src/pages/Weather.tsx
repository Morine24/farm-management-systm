import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer, Eye, AlertTriangle } from 'lucide-react';

interface WeatherData {
  date: Date;
  temperature: {
    min: number;
    max: number;
    current: number;
  };
  humidity: number;
  precipitation: number;
  windSpeed: number;
  conditions: string;
}

interface WeatherForecast {
  date: Date;
  temperature: { min: number; max: number };
  conditions: string;
  precipitation: number;
}

const Weather: React.FC = () => {
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    try {
      const lat = -1.286389; // Nairobi, Kenya
      const lon = 36.817223;
      const API_KEY = 'bd5e378503939ddaee76f12ad7a97608'; // OpenWeatherMap API key
      
      // Fetch current weather
      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      );
      
      if (currentResponse.ok) {
        const currentData = await currentResponse.json();
        
        setCurrentWeather({
          date: new Date(),
          temperature: {
            current: Math.round(currentData.main.temp),
            min: Math.round(currentData.main.temp_min),
            max: Math.round(currentData.main.temp_max)
          },
          humidity: currentData.main.humidity,
          precipitation: currentData.rain?.['1h'] || 0,
          windSpeed: Math.round(currentData.wind.speed * 3.6), // Convert m/s to km/h
          conditions: currentData.weather[0].main
        });
        
        // Fetch 7-day forecast
        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        
        if (forecastResponse.ok) {
          const forecastData = await forecastResponse.json();
          
          // Group by day and get daily min/max
          const dailyForecasts: { [key: string]: any } = {};
          
          forecastData.list.forEach((item: any) => {
            const date = new Date(item.dt * 1000);
            const dateKey = date.toDateString();
            
            if (!dailyForecasts[dateKey]) {
              dailyForecasts[dateKey] = {
                date,
                temps: [],
                conditions: item.weather[0].main,
                precipitation: item.rain?.['3h'] || 0
              };
            }
            
            dailyForecasts[dateKey].temps.push(item.main.temp);
            dailyForecasts[dateKey].precipitation += item.rain?.['3h'] || 0;
          });
          
          const forecastArray = Object.values(dailyForecasts)
            .slice(1, 8)
            .map((day: any) => ({
              date: day.date,
              temperature: {
                min: Math.round(Math.min(...day.temps)),
                max: Math.round(Math.max(...day.temps))
              },
              conditions: day.conditions,
              precipitation: Math.round(day.precipitation)
            }));
          
          setForecast(forecastArray);
        }
        
        setAlerts([]);
      } else {
        // Fallback to mock data if API fails
        const mockCurrentWeather: WeatherData = {
          date: new Date(),
          temperature: { current: 24, min: 18, max: 28 },
          humidity: 65,
          precipitation: 0,
          windSpeed: 12,
          conditions: 'Partly Cloudy'
        };
        
        const mockForecast: WeatherForecast[] = [
          { date: new Date(Date.now() + 86400000), temperature: { min: 19, max: 26 }, conditions: 'Sunny', precipitation: 0 },
          { date: new Date(Date.now() + 172800000), temperature: { min: 16, max: 23 }, conditions: 'Rainy', precipitation: 15 },
          { date: new Date(Date.now() + 259200000), temperature: { min: 20, max: 27 }, conditions: 'Cloudy', precipitation: 5 },
          { date: new Date(Date.now() + 345600000), temperature: { min: 22, max: 29 }, conditions: 'Sunny', precipitation: 0 },
          { date: new Date(Date.now() + 432000000), temperature: { min: 18, max: 25 }, conditions: 'Partly Cloudy', precipitation: 2 },
          { date: new Date(Date.now() + 518400000), temperature: { min: 21, max: 28 }, conditions: 'Sunny', precipitation: 0 },
          { date: new Date(Date.now() + 604800000), temperature: { min: 19, max: 26 }, conditions: 'Cloudy', precipitation: 3 },
        ];

        setCurrentWeather(mockCurrentWeather);
        setForecast(mockForecast);
        setAlerts(['Unable to fetch real-time weather data. Showing sample data.']);
      }
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    }
  };

  const getWeatherIcon = (conditions: string) => {
    const condition = conditions.toLowerCase();
    if (condition.includes('sunny') || condition.includes('clear')) return <Sun className="h-8 w-8 text-yellow-500" />;
    if (condition.includes('rain')) return <CloudRain className="h-8 w-8 text-blue-500" />;
    if (condition.includes('cloud')) return <Cloud className="h-8 w-8 text-gray-500" />;
    return <Sun className="h-8 w-8 text-yellow-500" />;
  };

  const getRecommendations = (weather: WeatherData) => {
    const recommendations = [];
    
    if (weather.precipitation > 10) {
      recommendations.push('Avoid field work due to wet conditions');
      recommendations.push('Check drainage systems');
    }
    
    if (weather.temperature.max > 30) {
      recommendations.push('Increase irrigation frequency');
      recommendations.push('Monitor crops for heat stress');
    }
    
    if (weather.windSpeed > 20) {
      recommendations.push('Secure loose equipment and materials');
      recommendations.push('Avoid spraying pesticides');
    }
    
    if (weather.humidity < 40) {
      recommendations.push('Consider additional watering');
    }
    
    return recommendations.length > 0 ? recommendations : ['Good conditions for most farm activities'];
  };

  if (!currentWeather) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading weather data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Weather Monitoring</h1>
        <button
          onClick={fetchWeatherData}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Refresh
        </button>
      </div>

      {/* Weather Alerts */}
      {alerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-semibold text-yellow-800">Weather Alerts</h3>
          </div>
          <ul className="space-y-1">
            {alerts.map((alert, index) => (
              <li key={index} className="text-yellow-700">{alert}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Current Weather */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Weather</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              {getWeatherIcon(currentWeather.conditions)}
            </div>
            <p className="text-3xl font-bold text-gray-900">{currentWeather.temperature.current}°C</p>
            <p className="text-gray-600">{currentWeather.conditions}</p>
            <p className="text-sm text-gray-500">
              {currentWeather.temperature.min}° / {currentWeather.temperature.max}°
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <Droplets className="h-5 w-5 text-blue-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Humidity</p>
                <p className="font-semibold">{currentWeather.humidity}%</p>
              </div>
            </div>
            <div className="flex items-center">
              <CloudRain className="h-5 w-5 text-blue-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Precipitation</p>
                <p className="font-semibold">{currentWeather.precipitation}mm</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <Wind className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Wind Speed</p>
                <p className="font-semibold">{currentWeather.windSpeed} km/h</p>
              </div>
            </div>
            <div className="flex items-center">
              <Eye className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Visibility</p>
                <p className="font-semibold">10 km</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <Thermometer className="h-5 w-5 text-red-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Feels Like</p>
                <p className="font-semibold">{currentWeather.temperature.current + 2}°C</p>
              </div>
            </div>
            <div className="flex items-center">
              <Sun className="h-5 w-5 text-yellow-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">UV Index</p>
                <p className="font-semibold">6 (High)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">7-Day Forecast</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          {forecast.map((day, index) => (
            <div key={`${new Date(day.date).getTime()}-${index}`} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900 mb-2">
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
              <div className="flex justify-center mb-2">
                {getWeatherIcon(day.conditions)}
              </div>
              <p className="text-sm text-gray-600 mb-1">{day.conditions}</p>
              <p className="font-semibold text-gray-900">
                {day.temperature.max}° / {day.temperature.min}°
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {day.precipitation}mm rain
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Farming Recommendations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Farming Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Today's Recommendations</h3>
            <ul className="space-y-2">
              {getRecommendations(currentWeather).map((rec, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Weekly Planning</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">Plan indoor activities for Tuesday (rain expected)</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">Optimal conditions for harvesting on Wednesday-Friday</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">Good week for field preparation and planting</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Historical Weather Data */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">This Month's Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">85mm</p>
            <p className="text-sm text-gray-600">Total Rainfall</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">32°C</p>
            <p className="text-sm text-gray-600">Highest Temp</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">12°C</p>
            <p className="text-sm text-gray-600">Lowest Temp</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">22</p>
            <p className="text-sm text-gray-600">Sunny Days</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Weather;