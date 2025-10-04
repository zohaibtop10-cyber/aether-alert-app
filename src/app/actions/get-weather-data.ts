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
    if (pm25 <= 55.4) return 'Unhealthy for Sensitive Groups';
    if (pm25 <= 150.4) return 'Unhealthy';
    if (pm25 <= 250.4) return 'Very Unhealthy';
    return 'Hazardous';
};

// Fetches data from Open-Meteo API
async function getOpenMeteoData(location: Location): Promise<CurrentConditions> {
    const { lat, lon } = location;

    const weatherParams = [
        "temperature_2m",
        "relative_humidity_2m",
        "precipitation",
        "precipitation_probability",
        "wind_speed_10m",
        "surface_pressure",
        "uv_index",
    ].join(",");
    
    const dailyParams = ["temperature_2m_max", "temperature_2m_min", "precipitation_probability_max", "uv_index_max"].join(",");
    
    const hourlyParams = ["temperature_2m", "precipitation_probability", "uv_index"].join(",");

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${weatherParams}&daily=${dailyParams}&hourly=${hourlyParams}&timezone=auto&forecast_days=7`;

    const airQualityParams = ["pm10", "pm2_5", "ozone", "carbon_monoxide", "nitrogen_dioxide"].join(",");
    const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=${airQualityParams}&hourly=pm2_5&timezone=auto&forecast_days=1`;

    try {
        const [weatherResponse, airQualityResponse] = await Promise.all([
            fetch(weatherUrl),
            fetch(airQualityUrl)
        ]);

        if (!weatherResponse.ok) {
            console.warn(`Open-Meteo Weather API failed (Status: ${weatherResponse.status}), trying NASA.`);
            return await getNasaPowerData(location);
        }
        if (!airQualityResponse.ok) {
            console.warn(`Open-Meteo Air Quality API failed (Status: ${airQualityResponse.status})`);
            // Continue without air quality data if it fails
        }

        const weatherData = await weatherResponse.json();
        const airQualityData = airQualityResponse.ok ? await airQualityResponse.json() : null;

        const current = weatherData.current;
        const daily = weatherData.daily;
        const hourlyWeather = weatherData.hourly;
        const aqCurrent = airQualityData?.current;
        const aqHourly = airQualityData?.hourly;

        if (!current || !daily || !hourlyWeather) {
            throw new Error("Incomplete data received from Open-Meteo APIs.");
        }

        const dailyForecast: Forecast[] = daily.time.slice(0, 7).map((time: string, index: number) => ({
            time: new Date(time).toLocaleDateString('en-US', { weekday: 'short' }),
            temperature: Math.round((daily.temperature_2m_max[index] + daily.temperature_2m_min[index]) / 2),
            rainChance: daily.precipitation_probability_max[index],
            airQualityStatus: "N/A"
        }));

        const now = new Date();
        const currentHourIndex = hourlyWeather.time.findIndex((t: string) => new Date(t) >= now);
        
        const hourlyForecast: Forecast[] = hourlyWeather.time.slice(currentHourIndex, currentHourIndex + 24).map((time: string, index: number) => {
            const actualIndex = currentHourIndex + index;
            const pm25Value = aqHourly?.pm2_5[actualIndex] ?? 0;
            return {
                time: new Date(time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
                temperature: Math.round(hourlyWeather.temperature_2m[actualIndex]),
                rainChance: hourlyWeather.precipitation_probability[actualIndex],
                airQualityStatus: getAirQualityStatus(pm25Value)
            };
        });

        const pressureInKpa = current.surface_pressure / 10;

        return {
            source: 'Open-Meteo',
            temperature: Math.round(current.temperature_2m),
            minTemperature: Math.round(daily.temperature_2m_min[0]),
            maxTemperature: Math.round(daily.temperature_2m_max[0]),
            humidity: Math.round(current.relative_humidity_2m),
            rainChance: current.precipitation_probability,
            windSpeed: parseFloat(current.wind_speed_10m.toFixed(2)),
            pressure: parseFloat(pressureInKpa.toFixed(2)),
            uvIndex: parseFloat(current.uv_index.toFixed(2)),
            airQuality: aqCurrent ? {
                pm10: parseFloat(aqCurrent.pm10.toFixed(2)),
                pm25: parseFloat(aqCurrent.pm2_5.toFixed(2)),
                o3: parseFloat(aqCurrent.ozone.toFixed(2)),
                co: parseFloat(aqCurrent.carbon_monoxide.toFixed(2)),
                no2: parseFloat(aqCurrent.nitrogen_dioxide.toFixed(2)),
            } : undefined,
            dailyForecast,
            hourlyForecast
        };

    } catch (error) {
        console.error("Open-Meteo API Error, falling back to NASA:", error);
        return await getNasaPowerData(location);
    }
}

async function getNasaPowerData(location: Location): Promise<CurrentConditions> {
    const apiKey = process.env.NASA_API_KEY;
    if (!apiKey) {
      throw new Error("NASA API key is not configured.");
    }
    const { lat, lon } = location;
    const parameters = [
      'T2M', // Temperature at 2 Meters
      'RH2M', // Relative Humidity at 2 Meters
      'PRECTOTCORR', // Precipitation
      'WS10M', // Wind Speed at 10 Meters
      'PS', // Surface Pressure
    ].join(',');
  
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?start=20230101&end=20230105&latitude=${lat}&longitude=${lon}&community=RE&parameters=${parameters}&format=JSON`;
  
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`NASA POWER API failed: ${response.statusText}`);
      }
      const data = await response.json();
      const fillValue = data.header.fill_value;

      // Helper to get the last valid value from a time series
      const getLastValidValue = (series: { [date: string]: number }) => {
          const validEntries = Object.entries(series).filter(([, value]) => value !== fillValue);
          return validEntries.length > 0 ? validEntries[validEntries.length - 1][1] : 0;
      };

      const temp = getLastValidValue(data.properties.parameter.T2M);
      const humidity = getLastValidValue(data.properties.parameter.RH2M);
      const precipitation = getLastValidValue(data.properties.parameter.PRECTOTCORR);
      const windSpeed = getLastValidValue(data.properties.parameter.WS10M);
      const pressure = getLastValidValue(data.properties.parameter.PS);
  
      return {
        source: 'NASA POWER',
        temperature: Math.round(temp),
        minTemperature: Math.round(temp - 5), // Placeholder
        maxTemperature: Math.round(temp + 5), // Placeholder
        humidity: Math.round(humidity),
        rainChance: Math.round(precipitation > 0.1 ? 80 : 10), // Placeholder
        windSpeed: parseFloat(windSpeed.toFixed(2)),
        pressure: parseFloat(pressure.toFixed(2)),
        uvIndex: 0, // Not available from this NASA source
        airQuality: undefined, // Not available
        dailyForecast: [], // Not available
        hourlyForecast: [], // Not available
      };
    } catch (e) {
      console.error("NASA POWER API Error:", e);
      throw new Error("All data sources failed. Please try again later.");
    }
}


export async function getWeatherData(location: Location): Promise<ApiResponse> {
  try {
    // We try Open-Meteo first as it has richer real-time and forecast data
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
