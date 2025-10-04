'use client';

import { useState, useTransition, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { generateHealthAlert } from '@/ai/flows/generate-health-alert';
import type { CurrentConditions } from '@/lib/types';
import { AlertCircle, Zap, BellRing } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useLocation } from '@/hooks/use-location';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

interface HealthAlertCardProps {
  currentConditions: CurrentConditions;
}

export function HealthAlertCard({ currentConditions }: HealthAlertCardProps) {
  const [alert, setAlert] = useState<{ message: string; isPersonalized: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();
  const { location } = useLocation();

  const fetchAlert = (disease: string) => {
    startTransition(async () => {
      if (!currentConditions.airQuality) return;
      // Only fetch a personalized alert if a disease is specified.
      if (!disease) {
        setAlert(null);
        return;
      }
      const input = {
        disease,
        temperature: currentConditions.temperature,
        humidity: currentConditions.humidity,
        airQualityPM25: currentConditions.airQuality.pm25,
        airQualityO3: currentConditions.airQuality.o3,
        airQualityCO: currentConditions.airQuality.co,
        airQualityNO2: currentConditions.airQuality.no2,
        rainChance: currentConditions.rainChance,
      };
      try {
        const response = await generateHealthAlert(input);
        // Only show the alert if it's personalized and has a message.
        if (response.alert) {
            setAlert({ message: response.alert, isPersonalized: true });
        } else {
            setAlert(null);
        }
      } catch (error) {
        console.error('Error generating health alert:', error);
        setAlert({ message: 'Could not generate an alert at this time.', isPersonalized: false });
      }
    });
  };

  useEffect(() => {
    if (location && typeof location.disease !== 'undefined' && currentConditions) {
        fetchAlert(location.disease);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConditions, location]);

  const showCard = isPending || (alert && alert.isPersonalized);

  if (!showCard) {
    return null; // Don't render the card if there's no personalized alert.
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Personalized Health Alert</CardTitle>
            <CardDescription>
              AI-powered insights for your specified health condition.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border p-4 min-h-[72px] flex items-center mb-4">
            {isPending ? (
              <div className="space-y-2 w-full">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            ) : alert ? (
              <div className="flex items-start gap-4">
                <AlertCircle className="mt-1 h-5 w-5 flex-shrink-0 text-destructive" />
                <p className="text-sm font-medium">{alert.message}</p>
              </div>
            ) : null}
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
                <BellRing className="h-5 w-5 text-muted-foreground" />
                <Label htmlFor="notification-switch" className="font-medium text-sm">
                    Notify Me of Changes
                </Label>
            </div>
            <Switch id="notification-switch" />
          </div>
      </CardContent>
    </Card>
  );
}
