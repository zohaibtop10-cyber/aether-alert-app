'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  generateAreaHealthAnalysis,
  type GenerateAreaHealthAnalysisOutput,
} from '@/ai/flows/generate-area-health-analysis';
import type { CurrentConditions } from '@/lib/types';
import { ShieldCheck } from 'lucide-react';

interface ClimateIndexCardProps {
  currentConditions: CurrentConditions;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
};

export function ClimateIndexCard({ currentConditions }: ClimateIndexCardProps) {
  const [analysis, setAnalysis] = useState<GenerateAreaHealthAnalysisOutput | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      if (!currentConditions.airQuality) return;
      try {
        const input = {
          temperature: currentConditions.temperature,
          humidity: currentConditions.humidity,
          airQualityPM25: currentConditions.airQuality.pm25,
          airQualityO3: currentConditions.airQuality.o3,
          airQualityCO: currentConditions.airQuality.co,
          airQualityNO2: currentConditions.airQuality.no2,
          windSpeed: currentConditions.windSpeed,
        };
        const response = await generateAreaHealthAnalysis(input);
        setAnalysis(response);
      } catch (error) {
        console.error('Error generating area health analysis:', error);
        setAnalysis(null);
      }
    });
  }, [currentConditions]);

  const renderLoadingSkeleton = () => (
    <div className="flex items-center justify-center h-full">
        <Skeleton className="h-32 w-32 rounded-full" />
    </div>
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Climate Index</CardTitle>
          <ShieldCheck className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardDescription>Overall environmental health score.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center h-48">
        {isPending || !analysis ? (
          renderLoadingSkeleton()
        ) : (
            <div className="text-center">
              <p className={`text-7xl font-bold ${getScoreColor(analysis.healthScore)}`}>
                {analysis.healthScore}
              </p>
               <p className="text-sm text-muted-foreground">out of 100</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
