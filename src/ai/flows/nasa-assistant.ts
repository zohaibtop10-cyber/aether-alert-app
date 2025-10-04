'use server';
/**
 * @fileOverview This file defines the AI assistant flow that answers user questions about environmental data.
 *
 * - nasaAssistantFlow - The main Genkit flow function.
 */

import { ai } from '@/ai/genkit';
import { getHistoricalData } from '@/app/actions/get-historical-data';
import { getWeatherData } from '@/app/actions/get-weather-data';
import { z } from 'genkit';
import {NasaAssistantInput, NasaAssistantOutput} from '@/lib/genkit-types';


const getHistoricalDataTool = ai.defineTool(
  {
    name: 'getHistoricalData',
    description:
      'Fetches historical environmental data (temperature, rainfall, pressure) for a location for the past 7 or 30 days. Use this for questions about past trends, averages, or comparisons over time.',
    inputSchema: z.object({
      location: z.any().describe("The user's location object."),
      days: z.enum([7, 30]).describe("The number of days for historical data."),
    }),
    outputSchema: z.any(),
  },
  async ({ location, days }) => getHistoricalData(location, days)
);

const getCurrentWeatherTool = ai.defineTool(
  {
    name: 'getCurrentWeather',
    description:
      'Fetches current weather conditions and daily/hourly forecasts for a location. Use this for any questions about the current weather, "today\'s" weather, or future forecasts.',
    inputSchema: z.object({ location: z.any().describe("The user's location object.") }),
    outputSchema: z.any(),
  },
  async ({ location }) => getWeatherData(location)
);

export const nasaAssistantFlow = ai.defineFlow(
  {
    name: 'nasaAssistantFlow',
    inputSchema: z.object({
      query: z.string(),
      location: z.any(),
    }),
    outputSchema: z.object({
      answer: z.string(),
    }),
  },
  async (input) => {
    
    const prompt = `You are an expert environmental data analyst. Your role is to answer user questions about weather and climate data.
- You have access to two tools: \`getHistoricalData\` for past trends and \`getCurrentWeather\` for current conditions and forecasts.
- Use the provided data to answer the user's question comprehensively.
- Be clear, concise, and friendly.
- When presenting data, especially from the past, mention that the historical data is sourced from NASA.
- When talking about current conditions or forecasts, mention it's from Open-Meteo.
- If the data is not available or a tool fails, inform the user gracefully that you couldn't retrieve the necessary information.
- Always provide units for measurements (e.g., °C, mm, kPa).
- The user is at this location: City: ${input.location.city}, Country: ${input.location.country}. Use this for context.
The user's question is: "${input.query}"`;

    const llmResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: prompt,
      tools: [getHistoricalDataTool, getCurrentWeatherTool],
      toolConfig: {
        // Pass location to all tool calls automatically.
        context: {
          location: input.location,
        }
      },
      output: {
        schema: z.object({
          answer: z.string(),
        })
      }
    });

    const output = llmResponse.output();

    if (!output) {
      return {
        answer:
          "I'm sorry, I was unable to generate a response. Please try rephrasing your question.",
      };
    }
    return output;
  }
);
