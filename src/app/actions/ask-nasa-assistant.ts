'use server';

import { nasaAssistantFlow } from '@/ai/flows/nasa-assistant';
import type { Location } from '@/lib/types';

export async function askNasaAssistant(query: string, location: Location): Promise<string> {
    try {
        const response = await nasaAssistantFlow({ query, location });
        return response.answer;
    } catch (error) {
        console.error("Error in askNasaAssistant flow:", error);
        throw new Error("Failed to get a response from the AI assistant.");
    }
}
