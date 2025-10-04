'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a public health analysis for a specific area based on environmental conditions.
 *
 * - generateAreaHealthAnalysis - A function that takes environmental data and generates a health score and a ranked list of potential diseases.
 */

import { ai } from '@/ai/genkit';
import { GenerateAreaHealthAnalysisInputSchema, GenerateAreaHealthAnalysisOutputSchema, type GenerateAreaHealthAnalysisInput, type GenerateAreaHealthAnalysisOutput } from '@/lib/genkit-types';

const generateAreaHealthAnalysisFlow = ai.defineFlow(
  {
    name: 'generateAreaHealthAnalysisFlow',
    inputSchema: GenerateAreaHealthAnalysisInputSchema,
    outputSchema: GenerateAreaHealthAnalysisOutputSchema,
  },
  async (input) => {
    const prompt = ai.definePrompt({
      name: 'generateAreaHealthAnalysisPrompt',
      input: { schema: GenerateAreaHealthAnalysisInputSchema },
      output: { schema: GenerateAreaHealthAnalysisOutputSchema },
      prompt: `You are a public health expert and environmental analyst. Your task is to provide a clear, data-driven assessment of the environmental health of a specific area based on the following data.

Current Environmental Conditions:
- Temperature: {{temperature}}°C
- Humidity: {{humidity}}%
- PM2.5: {{airQualityPM25}} µg/m³
- Ozone (O₃): {{airQualityO3}} µg/m³
- Carbon Monoxide (CO): {{airQualityCO}} µg/m³
- Nitrogen Dioxide (NO₂): {{airQualityNO2}} µg/m³
- Wind Speed: {{windSpeed}} m/s

Based on this data, perform the following tasks:

1.  **Calculate a Health Score:** Generate a single, holistic "health score" for the area on a scale of 0 (Hazardous) to 100 (Excellent). A high score means the environment is healthy and poses little risk. A low score indicates significant health risks from environmental factors. Consider the combined impact of air quality, temperature, and humidity. For example, high pollution with high humidity is worse than high pollution alone.

2.  **Rank Top 3 Health Concerns:** Identify and rank the top 3 health conditions or diseases that the general population might be at risk for under these specific conditions. For each condition, provide a brief, easy-to-understand reason for its ranking. Focus on common issues aggravated by these environmental factors (e.g., Respiratory Issues, Allergies, Heat Exhaustion, Cardiovascular Strain).

Provide the output in the specified JSON format.
`,
    });
    
    const { output } = await prompt(input);
    return output!;
  }
);


export async function generateAreaHealthAnalysis(
  input: GenerateAreaHealthAnalysisInput
): Promise<GenerateAreaHealthAnalysisOutput> {
  return generateAreaHealthAnalysisFlow(input);
}
