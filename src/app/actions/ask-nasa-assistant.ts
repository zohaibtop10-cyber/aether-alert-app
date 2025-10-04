'use server';

import { nasaAssistantFlow } from '@/ai/flows/nasa-assistant';
import type { Location } from '@/lib/types';

export async function askNasaAssistant(query: string, location: Location): Promise<string> {
    try {
        const result = await nasaAssistantFlow({ query, location });
        return result.answer;
    } catch (error) {
        console.error("Error calling AI assistant flow:", error);
        return "Sorry, I encountered an error and couldn't get a response. Please try again.";
    }
}
