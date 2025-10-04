'use server';

import type { Location } from '@/lib/types';

export async function askNasaAssistant(query: string, location: Location): Promise<string> {
    const webhookUrl = 'https://hook.eu2.make.com/cuo0js5kd4m29mpai6yiikap5yvoasum';

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

        // Assuming make.com returns a JSON object with an "answer" key.
        const result = await response.json();
        
        if (result && result.answer) {
             return result.answer;
        } else {
             // If the response is just a string, return it directly.
             if (typeof result === 'string') {
                return result;
             }
             return "I received a response, but couldn't find an answer. The raw response was: " + JSON.stringify(result);
        }

    } catch (error) {
        console.error("Error calling AI assistant webhook:", error);
        return "Sorry, I encountered an error and couldn't get a response. Please try again.";
    }
}
