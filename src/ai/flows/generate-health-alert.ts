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
  temperature: z.number().describe('The current temperature in Celsius.'),
  humidity: z.number().describe('The current relative humidity percentage.'),
  airQualityPM25: z.number().describe('The current PM2.5 air quality index.'),
  airQualityO3: z.number().describe('The current Ozone (O3) air quality index.'),
  airQualityCO: z.number().describe('The current Carbon Monoxide (CO) air quality index.'),
  airQualityNO2: z.number().describe('The current Nitrogen Dioxide (NO2) air quality index.'),
  rainChance: z.number().describe('The chance of rain as a percentage (0-100).'),
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
  prompt: `You are a helpful assistant who provides clear, friendly, and concise health advice.
A user with the condition '{{disease}}' is seeing the following environmental conditions:
- Temperature: {{temperature}}°C
- Humidity: {{humidity}}%
- PM2.5: {{airQualityPM25}}
- O3: {{airQualityO3}}
- CO: {{airQualityCO}}
- NO2: {{airQualityNO2}}
- Rain Chance: {{rainChance}}%

Generate a short, easy-to-understand health alert (1-2 sentences). Be reassuring and focus on simple, actionable advice.

If no specific disease is mentioned, provide a general, helpful tip about the current conditions.
Example for "Asthma": "Air quality is a bit poor today. It might be a good idea to keep your inhaler handy if you're heading outside."
Example for no disease: "It's a clear and pleasant day. A great opportunity to enjoy some time outdoors!"`,
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
