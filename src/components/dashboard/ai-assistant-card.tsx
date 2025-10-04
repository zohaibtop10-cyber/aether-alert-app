'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import { askNasaAssistant } from '@/app/actions/ask-nasa-assistant';
import { useLocation } from '@/hooks/use-location';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export function AIAssistantCard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { location } = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: nanoid(),
          role: 'assistant',
          text: "Hello! I'm your environmental data assistant. Ask me about current weather or historical trends, like 'What's the forecast for tomorrow?' or 'Compare rainfall in the last 7 and 30 days.'",
        }
      ]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !location) return;

    const userMessage: Message = { id: nanoid(), role: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const assistantResponse = await askNasaAssistant(input, location);
      const assistantMessage: Message = {
        id: nanoid(),
        role: 'assistant',
        text: assistantResponse,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: nanoid(),
        role: 'assistant',
        text: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error('Error calling AI assistant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[60vh]">
      <div className="flex-1 overflow-y-auto space-y-4 p-6 border-t">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="flex-shrink-0 size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Bot className="size-5" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg p-3 text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {msg.text}
            </div>
            {msg.role === 'user' && (
              <div className="flex-shrink-0 size-8 rounded-full bg-muted flex items-center justify-center">
                <User className="size-5" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Bot className="size-5" />
                </div>
                <div className="bg-muted p-3 rounded-lg">
                    <Loader2 className="size-5 animate-spin" />
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-6 pt-4 border-t">
        <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about weather or historical data..."
            disabled={isLoading || !location}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim() || !location}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
