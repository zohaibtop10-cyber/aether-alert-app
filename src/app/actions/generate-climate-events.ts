'use server';
import { ai } from '@/ai/genkit';
import { getWeatherData } from './get-weather-data';
import { nanoid } from 'nanoid';
import type { Location } from '@/lib/types';
import { EventListSchema, type ClimateEvent } from '@/lib/events';

// Define the prompt for the AI model
const eventGenerationPrompt = ai.definePrompt({
  name: 'eventGenerationPrompt',
  prompt: `You are an expert environmental analyst. Your task is to analyze the provided weather and air quality data for a specific location and generate a list of significant "climate events" based on a set of rules.

RULES FOR EVENT GENERATION:
- High Rainfall: If precipitation is > 20mm, create a "Heavy Rainfall" event with "High" severity. If > 5mm, create one with "Moderate" severity.
- High Temperature: If the max temperature is > 35°C, create a "Heat Wave Warning" event with "High" severity. If > 30°C, severity is "Moderate".
- Poor Air Quality: If PM2.5 is > 55 µg/m³, create an "Air Pollution Event" with "High" severity. If > 35 µg/m³, severity is "Moderate".
- High Wind Speed: If wind speed is > 10 m/s, create a "High Wind Alert" with "Moderate" severity.

For each generated event, you must provide a unique ID, a descriptive title, a one-sentence summary, the type, source, severity, date, location, and status ('ongoing').
If no data points meet the criteria for an event, return an empty list of events.

DATA:
- Location: {{location}}
- Current Date: {{currentDate}}
- Weather & Air Quality Data:
{{data}}`,
  output: {
    schema: EventListSchema,
  },
});

export async function generateClimateEvents(location: Location): Promise<ClimateEvent[]> {
  const weatherDataResponse = await getWeatherData(location);

  if (!weatherDataResponse.success) {
    console.error("Failed to get weather data for event generation:", weatherDataResponse.error);
    return [];
  }
  
  const weatherData = weatherDataResponse.data.current;

  // Prune the data to only what's necessary for the prompt to save tokens
  const relevantData = {
    source: weatherData.source,
    temperature: weatherData.temperature,
    minTemperature: weatherData.minTemperature,
    maxTemperature: weatherData.maxTemperature,
    rainChance: weatherData.rainChance,
    windSpeed: weatherData.windSpeed,
    airQuality: weatherData.airQuality ? {
        pm25: weatherData.airQuality.pm25,
    } : 'Not available',
  };


  const locationString = `${location.city || 'Unknown'}, ${location.country || 'Unknown'}`;
  const today = new Date().toISOString().split('T')[0];

  try {
    const { output } = await eventGenerationPrompt({
      location: locationString,
      currentDate: today,
      data: JSON.stringify(relevantData, null, 2)
    });

    if (output) {
      // Ensure each event has a unique ID if the model didn't provide one
      return output.events.map(event => ({ ...event, id: event.id || nanoid() }));
    }

    return [];
  } catch(e) {
    console.error("Error generating climate events with AI:", e);
    return [];
  }
}
