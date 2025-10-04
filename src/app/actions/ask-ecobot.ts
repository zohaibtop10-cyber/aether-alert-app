'use server';

import { ecoBot } from '@/ai/flows/eco-bot';
import { callMakeWebhook } from '@/ai/flows/webhook-tool';
import { streamText } from '@genkit-ai/ai';
import { CoreMessage } from '@genkit-ai/ai/message';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server';
import { createStreamableValue } from 'ai/rsc';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export async function askEcoBot(
  history: CoreMessage[],
  location: any,
  uid: string | null
) {
  'use server';
  const { firestore } = await initializeFirebase();
  const stream = createStreamableValue();

  (async () => {
    // Extract user message for webhook call
    const userMessage = history[history.length - 1];
    if (userMessage && userMessage.role === 'user' && userMessage.content[0].text) {
      // Non-blocking call to the webhook
      callMakeWebhook({ 
        data: { 
          userInput: userMessage.content[0].text,
          location: location,
          uid: uid
        } 
      });
    }

    const { stream: textStream } = await streamText({
      model: 'googleai/gemini-1.5-pro-latest',
      prompt: `You are EcoBot, a friendly and knowledgeable AI assistant for the Aether Alert web app.
Your purpose is to provide users with accurate, real-time environmental data and actionable, eco-friendly advice.
- Your primary data sources are NASA APIs. Explain NASA datasets and insights when relevant.
- If NASA data is unavailable, you can use Open-Meteo as a fallback.
- Always be helpful, clear, and encouraging. Explain complex environmental topics in a simple way.
- Use the user's location to provide personalized information.
- Provide answers based on the tools you have available. You can call external webhooks for automations.
- If you don't know the answer, say so. Do not make up information.
- Suggest eco-friendly actions and energy-saving tips where appropriate.`,
      history,
      tools: [ecoBot, callMakeWebhook],
      toolConfig: {
        context: {
          location: location,
        },
      },
    });

    let fullResponse = '';
    for await (const chunk of textStream) {
      if (chunk.content) {
        fullResponse += chunk.content;
        stream.update(chunk.content);
      }
    }

    // Save user message to Firestore if UID is available
    if (uid && userMessage && userMessage.role === 'user' && userMessage.content[0].text) {
        const userChatHistoryRef = collection(
          firestore,
          `users/${uid}/chatHistory`
        );
        const userMessageData = {
          role: 'user',
          content: userMessage.content[0].text,
          timestamp: serverTimestamp(),
        };
        // Non-blocking write with error handling
        addDoc(userChatHistoryRef, userMessageData).catch(error => {
            const permissionError = new FirestorePermissionError({
                path: userChatHistoryRef.path,
                operation: 'create',
                requestResourceData: userMessageData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
      
    }

    // When the stream is finished, save the model's response
    if (uid && fullResponse) {
      const modelChatHistoryRef = collection(
        firestore,
        `users/${uid}/chatHistory`
      );
      const modelMessageData = {
          role: 'model',
          content: fullResponse,
          timestamp: serverTimestamp(),
      };
      // Non-blocking write with error handling
      addDoc(modelChatHistoryRef, modelMessageData).catch(error => {
          const permissionError = new FirestorePermissionError({
              path: modelChatHistoryRef.path,
              operation: 'create',
              requestResourceData: modelMessageData,
          });
          errorEmitter.emit('permission-error', permissionError);
      });
    }

    stream.done();
  })();

  return stream.value;
}
