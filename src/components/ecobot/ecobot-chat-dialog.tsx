'use client';
import { useState, useEffect, useRef, FormEvent } from 'react';
import { askEcoBot } from '@/app/actions/ask-ecobot';
import { useLocation } from '@/hooks/use-location';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
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
import { type CoreMessage } from 'ai';
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
  const { firestore } = useFirebase();
  const [messages, setMessages] = useState<CoreMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const chatHistoryQuery = useMemoFirebase(
    () =>
      user && firestore
        ? query(
            collection(firestore, `users/${user.uid}/chatHistory`),
            orderBy('timestamp', 'desc'),
            limit(20)
          )
        : null,
    [user, firestore]
  );
  const { data: initialMessages, isLoading: historyLoading } = useCollection<any>(chatHistoryQuery);

  useEffect(() => {
    if (initialMessages) {
        const history: CoreMessage[] = initialMessages
            .map(msg => ({
                role: msg.role,
                content: msg.content
            }))
            .reverse();
        setMessages(history);
    }
  }, [initialMessages]);

  useEffect(() => {
    setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }
    }, 100);
  }, [messages, open]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input || isLoading || !location) return;

    const userMessage: CoreMessage = {
      role: 'user',
      content: input,
    };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const { stream } = await askEcoBot(newHistory, location, user?.uid || null);

      let fullResponse = '';
      const modelMessageId = nanoid();
      const modelMessage: CoreMessage = {
        role: 'model',
        // @ts-ignore
        id: modelMessageId,
        content: '',
      };
      setMessages((prev) => [...prev, modelMessage]);

      for await (const chunk of readStreamableValue(stream)) {
        if (typeof chunk === 'string') {
            fullResponse += chunk;
            setMessages((prev) =>
              prev.map((msg) =>
                // @ts-ignore
                msg.id === modelMessageId
                  ? {
                      ...msg,
                      content: fullResponse,
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
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (m: CoreMessage, i: number) => (
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
            {typeof m.content === 'string' ? m.content : m.content[0].text}
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
  )

  const renderThinkingIndicator = () => (
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
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] md:max-w-lg lg:max-w-2xl grid-rows-[auto_1fr_auto] h-[80vh] max-h-[800px] p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" />
            EcoAI Assistant
          </DialogTitle>
          <DialogDescription>
            Ask me about air quality, weather, or eco-friendly tips!
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="space-y-4 p-4">
            {historyLoading && messages.length === 0 ? (
                <div className="space-y-4">
                    {renderThinkingIndicator()}
                </div>
            ) : (
                messages.map(renderMessage)
            )}
            
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
                renderThinkingIndicator()
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
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
              disabled={!user || !location}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input || !user || !location}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
          <DialogFooter className="text-center text-xs text-muted-foreground pt-2 sm:justify-center">
            Powered by NASA &amp; Gemini
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
