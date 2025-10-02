'use client';

import { useState, useTransition, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { generateHealthAlert } from '@/ai/flows/generate-health-alert';
import type { CurrentConditions } from '@/lib/types';
import { AlertCircle, Zap, Info } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useLocation } from '@/hooks/use-location';

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
        setAlert({ message: response.alert, isPersonalized: !!disease });
      } catch (error) {
        console.error('Error generating health alert:', error);
        setAlert({ message: 'Could not generate an alert at this time.', isPersonalized: false });
      }
    });
  };

  useEffect(() => {
    if (location?.disease || location?.disease === '') {
        fetchAlert(location.disease);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConditions, location?.disease]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Health Alert</CardTitle>
            <CardDescription>
              Personalized insights based on current environmental data.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border p-4 min-h-[72px] flex items-center">
            {isPending ? (
              <div className="space-y-2 w-full">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            ) : alert ? (
              <div className="flex items-start gap-4">
                {alert.isPersonalized ? (
                  <AlertCircle className="mt-1 h-5 w-5 flex-shrink-0 text-destructive" />
                ) : (
                  <Info className="mt-1 h-5 w-5 flex-shrink-0 text-blue-500" />
                )}
                <p className="text-sm font-medium">{alert.message}</p>
              </div>
            ) : null}
          </div>
      </CardContent>
    </Card>
  );
}
