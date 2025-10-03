'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a public health analysis for a specific area based on environmental conditions.
 *
 * - generateAreaHealthAnalysis - A function that takes environmental data and generates a health score and a ranked list of potential diseases.
 * - GenerateAreaHealthAnalysisInput - The input type for the function.
 * - GenerateAreaHealthAnalysisOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateAreaHealthAnalysisInputSchema = z.object({
  temperature: z.number().describe('The current temperature in Celsius.'),
  humidity: z.number().describe('The current relative humidity percentage.'),
  airQualityPM25: z.number().describe('The current PM2.5 air quality index.'),
  airQualityO3: z.number().describe('The current Ozone (O3) air quality index.'),
  airQualityCO: z.number().describe('The current Carbon Monoxide (CO) air quality index.'),
  airQualityNO2: z.number().describe('The current Nitrogen Dioxide (NO2) air quality index.'),
  windSpeed: z.number().describe('The current wind speed in m/s.'),
});
export type GenerateAreaHealthAnalysisInput = z.infer<typeof GenerateAreaHealthAnalysisInputSchema>;

const DiseaseRankSchema = z.object({
  rank: z.number().describe('The rank of the disease (1, 2, 3).'),
  name: z.string().describe('The name of the health condition or disease.'),
  reason: z
    .string()
    .describe(
      'A brief, one-sentence explanation of why this condition is a concern under the current environmental circumstances.'
    ),
});

const GenerateAreaHealthAnalysisOutputSchema = z.object({
  healthScore: z
    .number()
    .min(0)
    .max(100)
    .describe(
      'A holistic "health score" for the area on a scale of 0 to 100, where 100 is excellent and 0 is extremely poor. This score should consider all environmental factors.'
    ),
  rankedDiseases: z
    .array(DiseaseRankSchema)
    .length(3)
    .describe(
      'A ranked list of the top 3 potential health concerns for the general population given the conditions.'
    ),
});
export type GenerateAreaHealthAnalysisOutput = z.infer<
  typeof GenerateAreaHealthAnalysisOutputSchema
>;

export async function generateAreaHealthAnalysis(
  input: GenerateAreaHealthAnalysisInput
): Promise<GenerateAreaHealthAnalysisOutput> {
  return generateAreaHealthAnalysisFlow(input);
}

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

const generateAreaHealthAnalysisFlow = ai.defineFlow(
  {
    name: 'generateAreaHealthAnalysisFlow',
    inputSchema: GenerateAreaHealthAnalysisInputSchema,
    outputSchema: GenerateAreaHealthAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
