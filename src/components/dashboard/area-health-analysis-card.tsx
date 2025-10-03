'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  generateAreaHealthAnalysis,
  type GenerateAreaHealthAnalysisOutput,
} from '@/ai/flows/generate-area-health-analysis';
import type { CurrentConditions } from '@/lib/types';
import { HeartPulse } from 'lucide-react';
import { Badge } from '../ui/badge';

interface AreaHealthAnalysisCardProps {
  currentConditions: CurrentConditions;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
};

export function AreaHealthAnalysisCard({ currentConditions }: AreaHealthAnalysisCardProps) {
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
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <Skeleton className="h-24 w-24 rounded-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-5 w-3/4" />
      </div>
    </div>
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Area Health Analysis</CardTitle>
          <HeartPulse className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardDescription>AI-powered public health risk assessment.</CardDescription>
      </CardHeader>
      <CardContent>
        {isPending || !analysis ? (
          renderLoadingSkeleton()
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Overall Health Score</p>
              <p className={`text-6xl font-bold ${getScoreColor(analysis.healthScore)}`}>
                {analysis.healthScore}
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Top Health Concerns</h4>
              <ul className="space-y-3">
                {analysis.rankedDiseases.map((disease) => (
                  <li key={disease.rank} className="rounded-lg border bg-card p-3">
                    <p className="font-semibold text-base mb-1">{disease.name}</p>
                    <p className="text-sm text-muted-foreground">{disease.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
