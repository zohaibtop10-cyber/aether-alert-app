import { z } from 'zod';

// Define the output schema for a single climate event
export const ClimateEventSchema = z.object({
  id: z.string().describe('A unique ID for the event'),
  title: z
    .string()
    .describe(
      'A concise, descriptive title for the event (e.g., "High Air Pollution Alert").'
    ),
  description: z
    .string()
    .describe('A one-sentence summary of the event and its primary metric.'),
  type: z
    .enum(['Air Quality', 'Rainfall', 'Temperature', 'Wind', 'General'])
    .describe('The category of the environmental event.'),
  source: z
    .string()
    .describe(
      'The primary NASA or weather API source for the data (e.g., "NASA POWER", "Open-Meteo AQI").'
    ),
  severity: z
    .enum(['Low', 'Moderate', 'High'])
    .describe('The assessed severity of the event.'),
  date: z.string().describe('The date of the event in YYYY-MM-DD format.'),
  location: z
    .string()
    .describe("The city and country of the event (e.g., 'New York, United States')."),
  status: z
    .enum(['past', 'ongoing', 'upcoming'])
    .describe('The current status of the event.'),
});

export type ClimateEvent = z.infer<typeof ClimateEventSchema>;

// Define the schema for the entire list of events
export const EventListSchema = z.object({
  events: z.array(ClimateEventSchema),
});
