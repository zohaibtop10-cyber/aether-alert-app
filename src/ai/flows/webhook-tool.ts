'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import fetch from 'node-fetch';

const webhookUrl = 'https://hook.eu2.make.com/chgym341vqx1kt2edmzn24px5cyn1ius';

export const callMakeWebhook = ai.defineTool(
  {
    name: 'callMakeWebhook',
    description:
      'Send data to an external service via a webhook. Use this for tasks involving notifications, external automations, or when a user asks to trigger a specific workflow.',
    inputSchema: z.object({
      data: z
        .any()
        .describe(
          'The JSON payload to send to the webhook. This can be any valid JSON object containing the necessary information for the external service.'
        ),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  async ({ data }) => {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status}`);
      }

      // Make.com webhooks often return a simple "Accepted" text response
      const responseText = await response.text();
      
      // We'll consider any 2xx response a success
      return {
        success: true,
        message: `Webhook triggered successfully. Response: ${responseText}`,
      };

    } catch (error: any) {
      console.error('Error calling Make.com webhook:', error);
      return {
        success: false,
        message: error.message || 'An unknown error occurred while calling the webhook.',
      };
    }
  }
);
