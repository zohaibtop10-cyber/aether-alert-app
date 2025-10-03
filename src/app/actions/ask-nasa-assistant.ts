'use server';

import type { Location } from '@/lib/types';

export async function askNasaAssistant(query: string, location: Location): Promise<string> {
    const webhookUrl = 'https://hook.eu2.make.com/c4kv5562lwjcx4tdo6whxevjwphr3orh';

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                latitude: location.lat,
                longitude: location.lon,
                question: query,
                disease: location.disease || ''
            }),
        });

        if (!response.ok) {
            throw new Error(`Webhook failed with status: ${response.status}`);
        }

        // Assuming the webhook returns a JSON object like { "answer": "..." }
        // The make.com scenario needs to be configured to return this format.
        const result = await response.json();
        
        if (result.answer) {
             return result.answer;
        }

        // Fallback for a simple text response
        if (typeof result === 'string') {
            return result;
        }

        // Fallback if the response is JSON but not in the expected format
        const textResponse = await response.text();
        if (textResponse) return textResponse;

        throw new Error("Received an empty or invalid response from the webhook.");

    } catch (error) {
        console.error("Error calling make.com webhook:", error);
        throw new Error("Failed to get a response from the AI assistant.");
    }
}
