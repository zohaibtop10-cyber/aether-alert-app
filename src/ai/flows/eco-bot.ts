'use server';

import { getHistoricalData } from '@/app/actions/get-historical-data';
import { getWeatherData } from '@/app/actions/get-weather-data';
import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const ecoBot = ai.defineTool(
  {
    name: 'getEnvironmentalData',
    description:
      'Get current weather conditions or historical environmental data for a specific location.',
    inputSchema: z.object({
      location: z.object({
        lat: z.number(),
        lon: z.number(),
      }),
      days: z
        .number()
        .optional()
        .describe('Number of past days to get historical data for (e.g., 7 or 30). If not provided, gets current weather.'),
    }),
    outputSchema: z.any(),
  },
  async ({ location, days }) => {
    if (days) {
      return await getHistoricalData(location, days as 7 | 30);
    } else {
      return await getWeatherData(location);
    }
  }
);
