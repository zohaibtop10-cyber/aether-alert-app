'use server';

import type { Location } from '@/lib/types';

export async function askNasaAssistant(query: string, location: Location): Promise<string> {
    const webhookUrl = process.env.MAKE_WEBHOOK_URL;

    if (!webhookUrl) {
        const errorMessage = "Sorry, the AI assistant is not configured. The webhook URL is missing.";
        console.error(errorMessage);
        return errorMessage;
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                latitude: location.lat,
                longitude: location.lon,
                question: query,
                disease: location.disease || ''
            }),
        });

        if (!response.ok) {
            console.error('Make.com webhook error:', response.status, response.statusText);
            const errorBody = await response.text();
            console.error('Error Body:', errorBody);
            throw new Error(`The webhook request failed: ${response.statusText}`);
        }

        const responseText = await response.text();
        
        try {
            // First, try to parse as JSON, as this is a common webhook response format.
            const result = JSON.parse(responseText);
            if (result && result.answer) {
                 return result.answer;
            }
        } catch (e) {
            // If JSON parsing fails, assume the response is a plain string.
            return responseText;
        }

        // If it was valid JSON but didn't have an 'answer' key, return the raw JSON string.
        return `I received a response, but couldn\'t find a direct answer. The raw response was: ${responseText}`;

    } catch (error) {
        console.error("Error calling AI assistant webhook:", error);
        return "Sorry, I encountered an error and couldn't get a response. Please try again.";
    }
}
