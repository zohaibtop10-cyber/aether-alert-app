'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/hooks/use-location';
import { useToast } from '@/hooks/use-toast';
import { Bell, MapPin } from 'lucide-react';
import { useState } from 'react';

interface PermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDialogClose: () => void;
}

export function PermissionsDialog({ open, onOpenChange, onDialogClose }: PermissionsDialogProps) {
  const { requestLocation } = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<'location' | 'notifications' | 'done'>('location');

  const handleLocationRequest = () => {
    requestLocation();
    // Move to next step regardless of outcome, user can change in settings.
    setStep('notifications');
  };
  
  const handleNotificationRequest = async () => {
     if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        onDialogClose();
        return;
      }
      if (Notification.permission === 'denied') {
        toast({
          variant: 'destructive',
          title: 'Notifications Blocked',
          description: 'To enable alerts, please update your browser settings.',
        });
        onDialogClose();
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: 'Notifications Enabled',
          description: 'You will now receive climate alerts.',
        });
      }
    }
    onDialogClose();
  };

  const handleSkip = () => {
    onDialogClose();
  };
  
  const renderStepContent = () => {
    switch (step) {
      case 'location':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Allow Location Access?</DialogTitle>
              <DialogDescription>
                Get hyper-local weather, air quality, and environmental data for your exact location. Your data is kept private.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center py-4">
                <MapPin className="h-12 w-12 text-primary" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('notifications')}>
                Skip
              </Button>
              <Button onClick={handleLocationRequest}>Allow Location</Button>
            </DialogFooter>
          </>
        );
    case 'notifications':
        return (
             <>
                <DialogHeader>
                <DialogTitle>Enable Push Notifications?</DialogTitle>
                <DialogDescription>
                    Receive critical alerts for severe weather warnings, high pollution levels, and other urgent events.
                </DialogDescription>
                </DialogHeader>
                 <div className="flex items-center justify-center py-4">
                    <Bell className="h-12 w-12 text-primary" />
                </div>
                <DialogFooter>
                <Button variant="outline" onClick={handleSkip}>
                    Maybe Later
                </Button>
                <Button onClick={handleNotificationRequest}>Enable Notifications</Button>
                </DialogFooter>
            </>
        );
        default:
            return null;
    }
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
}
