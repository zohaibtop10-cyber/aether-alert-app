'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating personalized health alerts based on user-specified conditions and realtime environmental data from NASA.
 *
 * - generateHealthAlert - A function that takes a user's health condition and environmental data to generate a health alert.
 */

import {ai} from '@/ai/genkit';
import { GenerateHealthAlertInputSchema, GenerateHealthAlertOutputSchema, type GenerateHealthAlertInput, type GenerateHealthAlertOutput } from '@/lib/genkit-types';


const generateHealthAlertFlow = ai.defineFlow(
  {
    name: 'generateHealthAlertFlow',
    inputSchema: GenerateHealthAlertInputSchema,
    outputSchema: GenerateHealthAlertOutputSchema,
  },
  async input => {
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

    const {output} = await prompt(input);
    return output!;
  }
);

export async function generateHealthAlert(
  input: GenerateHealthAlertInput
): Promise<GenerateHealthAlertOutput> {
  return generateHealthAlertFlow(input);
}
