'use server';

import type { Location, CurrentConditions } from '@/lib/types';

interface WeatherData {
  current: CurrentConditions;
  // In a real app, you'd also have forecast and historical data here
}

interface SuccessResponse {
  success: true;
  data: WeatherData;
}

interface ErrorResponse {
  success: false;
  error: string;
}

type WeatherResponse = SuccessResponse | ErrorResponse;

export async function getWeatherData(location: Location): Promise<WeatherResponse> {
  const apiKey = process.env.OPEN_WEATHER_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: 'API key is not configured. Please add OPEN_WEATHER_API_KEY to your environment variables.',
    };
  }

  const { lat, lon } = location;

  try {
    // Fetch current weather and air quality in parallel
    const [weatherRes, airQualityRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`)
    ]);

    if (!weatherRes.ok) {
        const errorData = await weatherRes.json();
        throw new Error(`Failed to fetch weather data: ${errorData.message}`);
    }
    if (!airQualityRes.ok) {
        const errorData = await airQualityRes.json();
        throw new Error(`Failed to fetch air quality data: ${errorData.message}`);
    }

    const weatherData = await weatherRes.json();
    const airQualityData = await airQualityRes.json();
    
    const currentConditions: CurrentConditions = {
      temperature: Math.round(weatherData.main.temp),
      humidity: weatherData.main.humidity,
      rainChance: weatherData.pop ? weatherData.pop * 100 : 0, // 'pop' is probability of precipitation
      airQuality: {
        pm25: airQualityData.list[0].components.pm2_5,
        o3: airQualityData.list[0].components.o3,
        co: airQualityData.list[0].components.co,
        no2: airQualityData.list[0].components.no2,
      },
      noiseLevel: 0, // Placeholder, not available from this API
    };

    return {
      success: true,
      data: {
        current: currentConditions,
      },
    };
  } catch (error) {
    console.error('Error fetching real-time data:', error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred while fetching weather data.' };
  }
}
