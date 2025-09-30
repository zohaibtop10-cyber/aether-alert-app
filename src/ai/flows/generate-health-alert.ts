'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating personalized health alerts based on user-specified conditions and realtime environmental data from NASA.
 *
 * - generateHealthAlert - A function that takes a user's health condition and environmental data to generate a health alert.
 * - GenerateHealthAlertInput - The input type for the generateHealthAlert function.
 * - GenerateHealthAlertOutput - The return type for the generateHealthAlert function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateHealthAlertInputSchema = z.object({
  disease: z
    .string()
    .describe('The user-specified disease or health condition.'),
  temperature: z.number().describe('The current temperature.'),
  humidity: z.number().describe('The current humidity level.'),
  airQualityPM25: z.number().describe('The current PM2.5 air quality index.'),
  airQualityO3: z.number().describe('The current Ozone air quality index.'),
  airQualityCO: z.number().describe('The current Carbon Monoxide air quality index.'),
  airQualityNO2: z.number().describe('The current Nitrogen Dioxide air quality index.'),
  rainChance: z.number().describe('The chance of rain (0-100).'),
});
export type GenerateHealthAlertInput = z.infer<typeof GenerateHealthAlertInputSchema>;

const GenerateHealthAlertOutputSchema = z.object({
  alert: z.string().describe('The generated health alert message.'),
});
export type GenerateHealthAlertOutput = z.infer<typeof GenerateHealthAlertOutputSchema>;

export async function generateHealthAlert(
  input: GenerateHealthAlertInput
): Promise<GenerateHealthAlertOutput> {
  return generateHealthAlertFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHealthAlertPrompt',
  input: {schema: GenerateHealthAlertInputSchema},
  output: {schema: GenerateHealthAlertOutputSchema},
  prompt: `You are a health expert. A user with the condition '{{disease}}' is asking for a personalized health alert based on the current environmental conditions.

  Here is the current environmental data:
  - Temperature: {{temperature}} degrees Celsius
  - Humidity: {{humidity}}%
  - Air Quality (PM2.5): {{airQualityPM25}}
  - Air Quality (O3): {{airQualityO3}}
  - Air Quality (CO): {{airQualityCO}}
  - Air Quality (NO2): {{airQualityNO2}}
  - Chance of Rain: {{rainChance}}%

  Generate a concise and informative health alert for the user.  The alert should be no more than two sentences.

  If the user has not specified a disease, provide a general alert based on the environmental conditions (e.g., "Air quality is poor today. Consider staying indoors.").
`,
});

const generateHealthAlertFlow = ai.defineFlow(
  {
    name: 'generateHealthAlertFlow',
    inputSchema: GenerateHealthAlertInputSchema,
    outputSchema: GenerateHealthAlertOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
