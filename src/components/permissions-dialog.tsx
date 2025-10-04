
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

interface PermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDialogClose: () => void;
}

export function PermissionsDialog({ open, onOpenChange, onDialogClose }: PermissionsDialogProps) {
  const { requestLocation } = useLocation();
  const { toast } = useToast();

  const handleAllow = async () => {
    // Request location
    requestLocation();

    // Request notifications
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: 'Notifications Enabled',
          description: 'You will now receive climate alerts.',
        });
      } else if (permission === 'denied') {
        toast({
          variant: 'destructive',
          title: 'Notifications Blocked',
          description: 'To enable alerts, please update your browser settings.',
        });
      }
    }
    onDialogClose();
  };

  const handleSkip = () => {
    onDialogClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enhance Your Experience</DialogTitle>
          <DialogDescription>
            Allow location and notification access for personalized weather data and real-time alerts. Your data is kept private.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-start gap-4">
            <MapPin className="h-6 w-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold">Location Access</h3>
              <p className="text-sm text-muted-foreground">Get hyper-local weather, air quality, and environmental data for your exact location.</p>
            </div>
          </div>
           <div className="flex items-start gap-4">
            <Bell className="h-6 w-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold">Push Notifications</h3>
              <p className="text-sm text-muted-foreground">Receive critical alerts for severe weather warnings, high pollution levels, and other urgent events.</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleSkip}>
            Skip for Now
          </Button>
          <Button onClick={handleAllow}>Allow Access</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
