import { z } from 'zod';

export const NasaAssistantInputSchema = z.object({
  query: z.string().describe("The user's question about environmental data."),
  location: z
    .object({
      lat: z.number(),
      lon: z.number(),
      city: z.string().optional(),
      country: z.string().optional(),
      disease: z.string().optional(),
    })
    .describe("The user's current geo-location."),
});
export type NasaAssistantInput = z.infer<typeof NasaAssistantInputSchema>;

export const NasaAssistantOutputSchema = z.object({
  answer: z
    .string()
    .describe("The generated, helpful answer to the user's query."),
});
export type NasaAssistantOutput = z.infer<typeof NasaAssistantOutputSchema>;

export const GenerateHealthAlertInputSchema = z.object({
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
  
export const GenerateHealthAlertOutputSchema = z.object({
    alert: z.string().describe('The generated health alert message.'),
});
export type GenerateHealthAlertOutput = z.infer<typeof GenerateHealthAlertOutputSchema>;

export const GenerateAreaHealthAnalysisInputSchema = z.object({
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
  
export const GenerateAreaHealthAnalysisOutputSchema = z.object({
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
