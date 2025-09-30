import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wind } from 'lucide-react';
import type { AirQuality } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

interface AirQualityCardProps {
  airQuality?: AirQuality;
  summary: { label: string; color: string };
}

export function AirQualityCard({ airQuality, summary }: AirQualityCardProps) {
  const getBadgeVariant = (label: string) => {
    if (label === 'Good') return 'default';
    if (label === 'Moderate') return 'secondary';
    if (label.includes('Unhealthy') || label === 'Hazardous') return 'destructive';
    return 'outline';
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Air Quality</CardTitle>
          <Wind className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardDescription>
          Real-time atmospheric composition data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border bg-card p-4">
            <span className="font-semibold">Overall</span>
            <Badge variant={getBadgeVariant(summary.label)} className={summary.label === "Good" ? "bg-green-500/20 text-green-700 border-green-500/30 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" : ""}>{summary.label}</Badge>
        </div>
        {!airQuality ? <Skeleton className="h-24 w-full" /> :
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">PM2.5</p>
            <p className="font-semibold">{airQuality.pm25} µg/m³</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Ozone (O₃)</p>
            <p className="font-semibold">{airQuality.o3} µg/m³</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Carbon Monoxide (CO)</p>
            <p className="font-semibold">{airQuality.co} µg/m³</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Nitrogen Dioxide (NO₂)</p>
            <p className="font-semibold">{airQuality.no2} µg/m³</p>
          </div>
        </div>
        }
      </CardContent>
    </Card>
  );
}
