'use server';
/**
 * @fileOverview This file defines the AI assistant flow that answers user questions about environmental data.
 *
 * - nasaAssistantFlow - The main Genkit flow function.
 * - NasaAssistantInput - The input type for the flow.
 * - NasaAssistantOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { getHistoricalData } from '@/app/actions/get-historical-data';
import { getWeatherData } from '@/app/actions/get-weather-data';
import type { Location } from '@/lib/types';
import { z } from 'genkit';

export const NasaAssistantInputSchema = z.object({
  query: z.string().describe('The user\'s question about environmental data.'),
  location: z
    .object({
      lat: z.number(),
      lon: z.number(),
      city: z.string().optional(),
      country: z.string().optional(),
      disease: z.string().optional(),
    })
    .describe('The user\'s current geo-location.'),
});
export type NasaAssistantInput = z.infer<typeof NasaAssistantInputSchema>;

export const NasaAssistantOutputSchema = z.object({
  answer: z
    .string()
    .describe('The generated, helpful answer to the user\'s query.'),
});
export type NasaAssistantOutput = z.infer<typeof NasaAssistantOutputSchema>;

// Tool to get historical data from NASA
const getHistoricalDataTool = ai.defineTool(
  {
    name: 'getHistoricalData',
    description:
      'Fetches historical environmental data (temperature, rainfall, pressure) for a location for the past 7 or 30 days. Use this for questions about past trends, averages, or comparisons over time.',
    inputSchema: z.object({
      location: z.any(),
      days: z.enum([7, 30]),
    }),
    outputSchema: z.any(),
  },
  async ({ location, days }) => getHistoricalData(location, days)
);

// Tool to get current and forecast data from Open-Meteo
const getCurrentWeatherTool = ai.defineTool(
  {
    name: 'getCurrentWeather',
    description:
      'Fetches current weather conditions and daily/hourly forecasts for a location. Use this for any questions about the current weather, "today\'s" weather, or future forecasts.',
    inputSchema: z.object({ location: z.any() }),
    outputSchema: z.any(),
  },
  async ({ location }) => getWeatherData(location)
);

const prompt = ai.definePrompt({
  name: 'nasaAssistantPrompt',
  input: { schema: NasaAssistantInputSchema },
  output: { schema: NasaAssistantOutputSchema },
  system: `You are an expert environmental data analyst. Your role is to answer user questions about weather and climate data.
- You have access to two tools: \`getHistoricalData\` for past trends and \`getCurrentWeather\` for current conditions and forecasts.
- Use the provided data to answer the user's question comprehensively.
- Be clear, concise, and friendly.
- When presenting data, especially from the past, mention that the historical data is sourced from NASA.
- When talking about current conditions or forecasts, mention it's from Open-Meteo.
- If the data is not available or a tool fails, inform the user gracefully that you couldn't retrieve the necessary information.
- Always provide units for measurements (e.g., °C, mm, kPa).
- The user is at this location: City: {{location.city}}, Country: {{location.country}}. Use this for context.`,
  prompt: `The user's question is: "{{query}}"`,
  tools: [getHistoricalDataTool, getCurrentWeatherTool],
});

export const nasaAssistantFlow = ai.defineFlow(
  {
    name: 'nasaAssistantFlow',
    inputSchema: NasaAssistantInputSchema,
    outputSchema: NasaAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await prompt({
      ...input,
      // Pass the whole location object to the tool context.
      // The tools themselves will pick what they need.
      toolContext: {
        location: input.location
      }
    });

    if (!output) {
      return {
        answer:
          "I'm sorry, I was unable to generate a response. Please try rephrasing your question.",
      };
    }
    return output;
  }
);
