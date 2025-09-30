'use client';

import { useState, useTransition, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { generateHealthAlert } from '@/ai/flows/generate-health-alert';
import type { CurrentConditions } from '@/lib/types';
import { AlertCircle, Zap, Info } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

const formSchema = z.object({
  disease: z.string().max(50, 'Please enter a valid condition.'),
});

interface HealthAlertCardProps {
  currentConditions: CurrentConditions;
}

export function HealthAlertCard({ currentConditions }: HealthAlertCardProps) {
  const [alert, setAlert] = useState<{ message: string; isPersonalized: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      disease: '',
    },
  });

  const fetchAlert = (disease: string) => {
    startTransition(async () => {
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

  // Fetch a general alert on initial load
  useEffect(() => {
    const savedDisease = localStorage.getItem('user-disease') || '';
    form.setValue('disease', savedDisease);
    fetchAlert(savedDisease);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(values: z.infer<typeof formSchema>) {
    localStorage.setItem('user-disease', values.disease);
    fetchAlert(values.disease);
  }

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
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex items-center rounded-lg border p-4">
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
              <FormField
                control={form.control}
                name="disease"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <Input placeholder="Enter a condition (e.g., Asthma)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Updating...' : 'Update'}
              </Button>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
}
