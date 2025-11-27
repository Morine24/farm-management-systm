const express = require('express');
const router = express.Router();
const axios = require('axios');

// Get current weather data
router.get('/current', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const apiKey = process.env.WEATHER_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ message: 'Weather API key not configured' });
    }
    
    const response = await axios.get(
      `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );
    
    const weatherData = {
      date: new Date(),
      temperature: {
        current: response.data.main.temp,
        min: response.data.main.temp_min,
        max: response.data.main.temp_max
      },
      humidity: response.data.main.humidity,
      precipitation: response.data.rain ? response.data.rain['1h'] || 0 : 0,
      windSpeed: response.data.wind.speed,
      conditions: response.data.weather[0].description
    };
    
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch weather data' });
  }
});

// Get weather forecast
router.get('/forecast', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const apiKey = process.env.WEATHER_API_KEY;
    
    const response = await axios.get(
      `http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );
    
    const forecast = response.data.list.map(item => ({
      date: new Date(item.dt * 1000),
      temperature: {
        min: item.main.temp_min,
        max: item.main.temp_max
      },
      conditions: item.weather[0].description,
      precipitation: item.rain ? item.rain['3h'] || 0 : 0
    }));
    
    res.json(forecast);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch weather forecast' });
  }
});

module.exports = router;