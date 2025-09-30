'use server';

import type { Location, CurrentConditions } from '@/lib/types';

interface WeatherData {
  current: CurrentConditions;
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

// This is a mock function that simulates fetching data from a NASA API.
// In a real-world scenario, this would involve complex interactions with NASA's Earthdata APIs.
async function getNASAData(location: Location): Promise<CurrentConditions> {
    const { lat, lon } = location;

    // Simulate API call latency
    await new Promise(resolve => setTimeout(resolve, 500));

    // For demonstration, we'll generate mock data that appears to come from NASA.
    // Real data would require accessing specific datasets from services like
    // NASA POWER for meteorology and MAIAC or MODIS for air quality.
    
    // The values are randomized to simulate real-time data fetching.
    const temp = 20 + Math.random() * 10; // Temperature in Celsius
    const humid = 40 + Math.random() * 30; // Humidity in %
    const pop = Math.random(); // Probability of precipitation

    // Air quality values in µg/m³
    const pm25 = 5 + Math.random() * 30;
    const o3 = 20 + Math.random() * 80;
    const co = 200 + Math.random() * 300;
    const no2 = 10 + Math.random() * 40;

    return {
        temperature: Math.round(temp),
        humidity: Math.round(humid),
        rainChance: Math.round(pop * 100),
        airQuality: {
            pm25: parseFloat(pm25.toFixed(2)),
            o3: parseFloat(o3.toFixed(2)),
            co: parseFloat(co.toFixed(2)),
            no2: parseFloat(no2.toFixed(2)),
        },
        noiseLevel: 0, // Not available from NASA APIs
    };
}


export async function getWeatherData(location: Location): Promise<WeatherResponse> {
  try {
    const currentConditions = await getNASAData(location);
    
    return {
      success: true,
      data: {
        current: currentConditions,
      },
    };
  } catch (error) {
    console.error('Error fetching NASA data:', error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred while fetching NASA data.' };
  }
}
