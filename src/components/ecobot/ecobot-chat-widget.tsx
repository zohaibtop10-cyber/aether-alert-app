'use client';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Sparkles } from 'lucide-react';
import { EcoBotChatDialog } from './ecobot-chat-dialog';

export function EcoBotChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg"
        size="icon"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-8 w-8" />
        <span className="sr-only">Open EcoBot Assistant</span>
      </Button>
      <EcoBotChatDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
