'use server';

import { ecoBot } from '@/ai/flows/eco-bot';
import { callMakeWebhook } from '@/ai/flows/webhook-tool';
import { ai } from '@/ai/genkit';
import { streamText, CoreMessage } from 'ai';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server';
import { createStreamableValue } from 'ai/rsc';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { googleAI } from '@genkit-ai/googleai';

export async function askEcoBot(
  history: CoreMessage[],
  location: any,
  uid: string | null
) {
  'use server';
  const { firestore } = await initializeFirebase();
  const stream = createStreamableValue();

  const userMessage = history.findLast(m => m.role === 'user');
  const userMessageContent = userMessage?.content as string;

  // Non-blocking call to the webhook
  if (userMessageContent) {
    callMakeWebhook({
      data: {
        userInput: userMessageContent,
        location: location,
        uid: uid,
      },
    });
  }

  streamText({
    model: googleAI('gemini-1.5-pro'),
    system: `You are EcoAI, a NASA-powered climate and environment assistant.
Your purpose is to provide users with accurate, real-time environmental data and actionable, eco-friendly advice.
- Always prefer official NASA data from sources like POWER, AIRS, MERRA-2, TEMPO, and GIBS. Explain NASA datasets and insights when relevant.
- If NASA data is unavailable, you can use Open-Meteo as a fallback.
- Always be helpful, clear, and encouraging. Explain complex environmental topics in a simple, beginner-friendly way.
- Use the user's location to provide personalized information.
- Provide answers based on the tools you have available.
- If you don't know the answer, say so. Do not make up information.
- Suggest eco-friendly actions and energy-saving tips where appropriate.`,
    messages: history,
    tools: {
      getEnvironmentalData: {
        description: ecoBot.description!,
        inputSchema: ecoBot.inputSchema,
        execute: ecoBot.fn,
      },
      callMakeWebhook: {
        description: callMakeWebhook.description!,
        inputSchema: callMakeWebhook.inputSchema,
        execute: callMakeWebhook.fn,
      },
    },
    onCompletion: async (completion, error, toolCalls) => {
        if (error) {
            console.error('Error during stream completion:', error);
            stream.done();
            return;
        }

        if (uid) {
            const userChatHistoryRef = collection(
                firestore,
                `users/${uid}/chatHistory`
            );
            
            // Save user message
            if (userMessageContent) {
                const userMessageData = {
                    role: 'user',
                    content: userMessageContent,
                    timestamp: serverTimestamp(),
                };
                addDoc(userChatHistoryRef, userMessageData).catch(error => {
                    const permissionError = new FirestorePermissionError({
                        path: userChatHistoryRef.path,
                        operation: 'create',
                        requestResourceData: userMessageData,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                });
            }

            // Save model response
            if (completion) {
                const modelMessageData = {
                    role: 'model',
                    content: completion,
                    timestamp: serverTimestamp(),
                };
                addDoc(userChatHistoryRef, modelMessageData).catch(error => {
                    const permissionError = new FirestorePermissionError({
                        path: userChatHistoryRef.path,
                        operation: 'create',
                        requestResourceData: modelMessageData,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                });
            }
        }
        stream.done();
    },
  }).then(async ({textStream}) => {
    for await (const delta of textStream) {
        stream.update(delta);
    }
  }).catch((e) => {
    console.error("Error in streamText call", e);
    stream.done();
  });

  return { stream: stream.value };
}
