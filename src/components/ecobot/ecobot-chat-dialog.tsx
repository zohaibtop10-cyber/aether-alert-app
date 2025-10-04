'use client';
import { useState, useEffect, useRef, FormEvent } from 'react';
import { askEcoBot } from '@/app/actions/ask-ecobot';
import { useLocation } from '@/hooks/use-location';
import { useUser } from '@/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { type CoreMessage } from '@genkit-ai/ai/message';
import { nanoid } from 'nanoid';
import { readStreamableValue } from 'ai/rsc';

interface EcoBotChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EcoBotChatDialog({
  open,
  onOpenChange,
}: EcoBotChatDialogProps) {
  const { location } = useLocation();
  const { user } = useUser();
  const [messages, setMessages] = useState<CoreMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input || isLoading || !location) return;

    const userMessage: CoreMessage = {
      role: 'user',
      content: [{ text: input }],
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const newHistory = [...messages, userMessage];
      const stream = await askEcoBot(newHistory, location, user?.uid || null);

      let fullResponse = '';
      const modelMessage: CoreMessage = {
        role: 'model',
        content: [{ text: '' }],
      };
      // @ts-ignore
      modelMessage.id = nanoid();
      setMessages((prev) => [...prev, modelMessage]);

      for await (const chunk of readStreamableValue(stream)) {
        if (chunk) {
          fullResponse += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              // @ts-ignore
              msg.id === modelMessage.id
                ? {
                    ...msg,
                    content: [{ text: fullResponse }],
                  }
                : msg
            )
          );
        }
      }
    } catch (error) {
      console.error('Error during chat:', error);
      const errorMessage: CoreMessage = {
        role: 'model',
        content: [
          {
            text: 'Sorry, I encountered an error. Please try again.',
          },
        ],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] md:max-w-lg lg:max-w-2xl grid-rows-[auto_1fr_auto] h-[80vh] max-h-[800px] p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" />
            EcoBot Assistant
          </DialogTitle>
          <DialogDescription>
            Ask me about air quality, weather, or eco-friendly tips!
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="space-y-4 p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-start gap-3',
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {m.role !== 'user' && (
                  <Avatar className="w-8 h-8 bg-primary text-primary-foreground">
                    <AvatarFallback>
                      <Bot />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'p-3 rounded-lg max-w-sm md:max-w-md',
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {m.content[0].text}
                  </p>
                </div>
                {m.role === 'user' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      <User />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex items-start gap-3 justify-start">
                <Avatar className="w-8 h-8 bg-primary text-primary-foreground">
                  <AvatarFallback>
                    <Bot />
                  </AvatarFallback>
                </Avatar>
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-primary rounded-full animate-pulse delay-0"></span>
                    <span className="h-2 w-2 bg-primary rounded-full animate-pulse delay-150"></span>
                    <span className="h-2 w-2 bg-primary rounded-full animate-pulse delay-300"></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t">
          <form
            onSubmit={handleSubmit}
            className="flex items-center w-full space-x-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="How's the air quality in my area?"
              className="flex-1"
              autoFocus
            />
            <Button type="submit" size="icon" disabled={isLoading || !input}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
