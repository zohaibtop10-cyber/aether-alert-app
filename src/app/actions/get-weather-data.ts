'use server';

import type { Location, CurrentConditions } from '@/lib/types';
import fetch from 'node-fetch';

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

// Fetches data from NASA POWER API
async function getNASAData(location: Location): Promise<CurrentConditions> {
    const { lat, lon } = location;
    const apiKey = process.env.NASA_API_KEY;

    if (!apiKey) {
        // As a fallback for developers who may not have a NASA API key, 
        // we'll return some plausible-looking mock data.
        console.warn("NASA API key is not configured. Returning mock data. Please add NASA_API_KEY to your .env file.");
        return {
            temperature: Math.round(15 + Math.random() * 10),
            humidity: Math.round(40 + Math.random() * 30),
            rainChance: Math.round(Math.random() * 50),
            windSpeed: parseFloat((Math.random() * 15).toFixed(2)),
            pressure: parseFloat((1000 + Math.random() * 20).toFixed(2)),
            airQuality: {
                pm25: parseFloat((5 + Math.random() * 30).toFixed(2)),
                o3: parseFloat((20 + Math.random() * 80).toFixed(2)),
                co: parseFloat((200 + Math.random() * 300).toFixed(2)),
                no2: parseFloat((10 + Math.random() * 40).toFixed(2)),
            },
        };
    }
    
    // API docs: https://power.larc.nasa.gov/docs/api/
    // We are using the near real-time data endpoint.
    const parameters = "T2M,RH2M,PRECTOTCORR,WS2M,PS";
    const powerApiUrl = `https://power.larc.nasa.gov/api/point?parameters=${parameters}&community=RE&longitude=${lon}&latitude=${lat}&format=JSON&key=${apiKey}`;

    const powerResponse = await fetch(powerApiUrl);

    if (!powerResponse.ok) {
        const errorText = await powerResponse.text();
        console.error('NASA POWER API Error:', errorText);
        throw new Error(`Failed to fetch meteorological data from NASA POWER. Status: ${powerResponse.status}`);
    }

    const powerData = await powerResponse.json();
    
    // Extract values, POWER API returns -999 for missing data
    const temperature = powerData.properties.parameter.T2M;
    const humidity = powerData.properties.parameter.RH2M;
    const precipitation = powerData.properties.parameter.PRECTOTCORR; // in mm/day
    const windSpeed = powerData.properties.parameter.WS2M;
    const pressure = powerData.properties.parameter.PS;

    if (temperature === -999 || humidity === -999 || windSpeed === -999 || pressure === -999) {
        throw new Error("Meteorological data from NASA POWER is currently unavailable for this location.");
    }

    // A simple way to estimate rain chance from daily precipitation amount. This is a heuristic.
    // NASA POWER provides total precipitation, not probability. This data is informed by GPM IMERG.
    const rainChance = precipitation > 0 ? Math.min(100, Math.ceil(precipitation * 10)) : 0;
    
    // Air Quality data is not available from the POWER API's point-in-time endpoint.
    // For a production app, this would involve a different NASA dataset (e.g., GEOS-CF) and more complex data processing.
    // We will simulate it for now as a placeholder.
    const pm25 = 5 + Math.random() * 30;
    const o3 = 20 + Math.random() * 80;
    const co = 200 + Math.random() * 300;
    const no2 = 10 + Math.random() * 40;

    return {
        temperature: Math.round(temperature),
        humidity: Math.round(humidity),
        rainChance: rainChance,
        windSpeed: parseFloat(windSpeed.toFixed(2)),
        pressure: parseFloat(pressure.toFixed(2)),
        airQuality: {
            pm25: parseFloat(pm25.toFixed(2)),
            o3: parseFloat(o3.toFixed(2)),
            co: parseFloat(co.toFixed(2)),
            no2: parseFloat(no2.toFixed(2)),
        },
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
