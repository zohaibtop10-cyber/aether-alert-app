'use server';

import { ecoBot } from '@/ai/flows/eco-bot';
import { streamText } from '@genkit-ai/ai';
import { CoreMessage } from '@genkit-ai/ai/message';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { createStreamableValue } from 'ai/rsc';

export async function askEcoBot(
  history: CoreMessage[],
  location: any,
  uid: string | null
) {
  'use server';
  const { firestore } = initializeFirebase();
  const stream = createStreamableValue();

  (async () => {
    const { stream: textStream } = await streamText({
      model: 'googleai/gemini-1.5-pro-latest',
      prompt: `You are EcoBot, a friendly and knowledgeable AI assistant for the ECOWARRIOR web app.
Your purpose is to provide users with accurate, real-time environmental data and actionable, eco-friendly advice.
- Your primary data sources are NASA APIs. Explain NASA datasets and insights when relevant.
- If NASA data is unavailable, you can use Open-Meteo as a fallback.
- Always be helpful, clear, and encouraging. Explain complex environmental topics in a simple way.
- Use the user's location to provide personalized information.
- Provide answers based on the tools you have available.
- If you don't know the answer, say so. Do not make up information.
- Suggest eco-friendly actions and energy-saving tips where appropriate.`,
      history,
      tools: [ecoBot],
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
    if (uid) {
      const userMessage = history.pop();
      if (userMessage && userMessage.role === 'user') {
        const userChatHistoryRef = collection(
          firestore,
          `users/${uid}/chatHistory`
        );
        await addDoc(userChatHistoryRef, {
          role: 'user',
          content: userMessage.content[0].text,
          timestamp: serverTimestamp(),
        });
      }
    }

    // When the stream is finished, save the model's response
    if (uid && fullResponse) {
      const modelChatHistoryRef = collection(
        firestore,
        `users/${uid}/chatHistory`
      );
      await addDoc(modelChatHistoryRef, {
        role: 'model',
        content: fullResponse,
        timestamp: serverTimestamp(),
      });
    }

    stream.done();
  })();

  return stream.value;
}
