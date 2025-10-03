'use server';

import type { Location, CurrentConditions, Forecast } from '@/lib/types';
import fetch from 'node-fetch';

interface WeatherResponse {
  success: true;
  data: {
    current: CurrentConditions;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
}

type ApiResponse = WeatherResponse | ErrorResponse;

const getAirQualityStatus = (pm25: number) => {
    if (pm25 <= 12) return 'Good';
    if (pm25 <= 35.4) return 'Moderate';
    if (pm25 <= 55.4) return 'Unhealthy';
    if (pm25 <= 150.4) return 'Unhealthy';
    if (pm25 <= 250.4) return 'Very Unhealthy';
    return 'Hazardous';
};

// Fetches data from Open-Meteo API
async function getOpenMeteoData(location: Location): Promise<CurrentConditions> {
    const { lat, lon } = location;

    // Common params for weather
    const weatherParams = [
        "temperature_2m",
        "relative_humidity_2m",
        "precipitation_probability",
        "wind_speed_10m",
        "surface_pressure",
    ].join(",");
    
    // Daily forecast params
    const dailyParams = ["temperature_2m_max", "temperature_2m_min", "precipitation_probability_max"].join(",");
    
    // Hourly forecast params
    const hourlyParams = ["temperature_2m", "precipitation_probability", "pm2_5"].join(",");

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${weatherParams}&daily=${dailyParams}&hourly=${hourlyParams}&timezone=auto&forecast_days=7`;

    // Air Quality API URL
    const airQualityParams = ["pm2_5", "ozone", "carbon_monoxide", "nitrogen_dioxide"].join(",");
    const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=${airQualityParams}&timezone=auto`;

    try {
        const [weatherResponse, airQualityResponse] = await Promise.all([
            fetch(weatherUrl),
            fetch(airQualityUrl)
        ]);

        if (!weatherResponse.ok) {
            throw new Error(`Failed to fetch weather data from Open-Meteo. Status: ${weatherResponse.status}`);
        }
        if (!airQualityResponse.ok) {
            throw new Error(`Failed to fetch air quality data from Open-Meteo. Status: ${airQualityResponse.status}`);
        }

        const weatherData = await weatherResponse.json();
        const airQualityData = await airQualityResponse.json();

        const current = weatherData.current;
        const daily = weatherData.daily;
        const hourly = weatherData.hourly;
        const aqCurrent = airQualityData.current;

        if (!current || !daily || !hourly || !aqCurrent) {
            throw new Error("Incomplete data received from Open-Meteo APIs.");
        }

        // Process daily forecast
        const dailyForecast: Forecast[] = daily.time.slice(0, 7).map((time: string, index: number) => ({
            time: new Date(time).toLocaleDateString('en-US', { weekday: 'short' }),
            temperature: Math.round((daily.temperature_2m_max[index] + daily.temperature_2m_min[index]) / 2),
            rainChance: daily.precipitation_probability_max[index],
            // Note: Open-Meteo doesn't provide daily AQI forecast easily, so we use a placeholder logic or omit it.
            // For simplicity, we'll derive a status from temp, but this is not scientifically accurate.
            airQualityStatus: "N/A"
        }));

        // Process hourly forecast
        const now = new Date();
        const currentHour = now.getHours();
        const hourlyForecast: Forecast[] = hourly.time.slice(currentHour, currentHour + 24).map((time: string, index: number) => {
            const actualIndex = currentHour + index;
            return {
                time: new Date(time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
                temperature: Math.round(hourly.temperature_2m[actualIndex]),
                rainChance: hourly.precipitation_probability[actualIndex],
                airQualityStatus: getAirQualityStatus(hourly.pm2_5[actualIndex])
            };
        });

        // Pressure is in hPa, convert to kPa for consistency
        const pressureInKpa = current.surface_pressure / 10;

        return {
            temperature: Math.round(current.temperature_2m),
            minTemperature: Math.round(daily.temperature_2m_min[0]),
            maxTemperature: Math.round(daily.temperature_2m_max[0]),
            humidity: Math.round(current.relative_humidity_2m),
            rainChance: current.precipitation_probability,
            windSpeed: parseFloat(current.wind_speed_10m.toFixed(2)),
            pressure: parseFloat(pressureInKpa.toFixed(2)),
            airQuality: {
                pm25: parseFloat(aqCurrent.pm2_5.toFixed(2)),
                o3: parseFloat(aqCurrent.ozone.toFixed(2)),
                co: parseFloat(aqCurrent.carbon_monoxide.toFixed(2)),
                no2: parseFloat(aqCurrent.nitrogen_dioxide.toFixed(2)),
            },
            dailyForecast,
            hourlyForecast
        };

    } catch (error) {
        console.error("Open-Meteo API Error:", error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("An unknown error occurred while fetching data from Open-Meteo.");
    }
}


export async function getWeatherData(location: Location): Promise<ApiResponse> {
  try {
    const currentConditions = await getOpenMeteoData(location);
    
    return {
      success: true,
      data: {
        current: currentConditions,
      },
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred while fetching weather data.' };
  }
}
