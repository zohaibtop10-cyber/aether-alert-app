'use server';
/**
 * @fileOverview This file defines a Genkit flow for an AI assistant that answers questions about historical NASA environmental data.
 *
 * - nasaAssistantFlow - The main flow function.
 * - NasaAssistantInput - The input type for the flow.
 * - NasaAssistantOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getHistoricalData } from '@/app/actions/get-historical-data';
import type { Location } from '@/lib/types';

const NasaAssistantInputSchema = z.object({
  query: z.string().describe('The user\'s question about historical data.'),
  location: z.object({
      lat: z.number(),
      lon: z.number(),
      city: z.string().optional(),
      country: z.string().optional(),
  }).describe("The user's current location."),
});
export type NasaAssistantInput = z.infer<typeof NasaAssistantInputSchema>;

const NasaAssistantOutputSchema = z.object({
  answer: z.string().describe('The AI assistant\'s answer to the user\'s query.'),
});
export type NasaAssistantOutput = z.infer<typeof NasaAssistantOutputSchema>;

// Define a tool for the AI to get historical data
const fetchNasaDataTool = ai.defineTool(
    {
      name: 'fetchNasaData',
      description: 'Fetches historical environmental data (temperature, rainfall, surface pressure) from NASA for a given location and time period (7 or 30 days).',
      inputSchema: z.object({
        location: z.object({
            lat: z.number(),
            lon: z.number(),
        }),
        days: z.enum(['7', '30']).describe("The number of past days to fetch data for. Use '7' for questions about a week, and '30' for questions about a month."),
      }),
      outputSchema: z.any(), // The raw data can be complex
    },
    async (input) => {
        // We need to cast the days from string to number for the getHistoricalData function
        const daysAsNumber = parseInt(input.days, 10) as 7 | 30;
        return await getHistoricalData(input.location, daysAsNumber);
    }
);


const prompt = ai.definePrompt({
    name: 'nasaAssistantPrompt',
    input: { schema: NasaAssistantInputSchema },
    output: { schema: NasaAssistantOutputSchema },
    tools: [fetchNasaDataTool],
    prompt: `You are an expert environmental data analyst. Your role is to answer user questions based *only* on the historical data provided by the 'fetchNasaData' tool.

User's location: {{location.city}}, {{location.country}}
User's question: "{{query}}"

Follow these rules:
1.  **Use the Tool**: You MUST use the 'fetchNasaData' tool to get the data needed to answer the question. Determine whether the user is asking about a week (7 days) or a month (30 days) to select the correct 'days' parameter for the tool.
2.  **Analyze Data**: Once you have the data, analyze it to answer the user's question. Perform calculations like averages, find maximums/minimums, or describe trends if necessary.
3.  **Be Concise**: Provide a clear and concise answer. Do not just repeat the raw data.
4.  **Acknowledge Limitations**: The available data includes temperature (°C), rainfall (mm), and surface pressure (kPa). State that you cannot answer questions about other metrics like PM2.5, wind speed, or humidity for historical data.
5.  **Friendly Tone**: Be helpful and friendly in your response.
6.  **No Data Scenario**: If the tool returns no data or an error, inform the user that you were unable to retrieve the historical data at this time.
`,
});


export const nasaAssistantFlow = ai.defineFlow(
  {
    name: 'nasaAssistantFlow',
    inputSchema: NasaAssistantInputSchema,
    outputSchema: NasaAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
