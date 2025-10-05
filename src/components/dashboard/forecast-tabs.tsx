'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Forecast } from '@/lib/types';
import { CalendarDays, Clock } from 'lucide-react';

interface ForecastTabsProps {
  daily: Forecast[];
  hourly: Forecast[];
}

function ForecastList({ forecasts }: { forecasts: Forecast[] }) {
  return (
    <div className="space-y-4">
      {forecasts.map((item, index) => (
        <div key={index} className="flex items-center">
          <div className="flex-1">
            <p className="font-semibold">{item.time}</p>
          </div>
          <div className="w-24 text-center">
            <p className="font-medium">{Math.round(item.temperature)}°C</p>
          </div>
          <div className="w-28 text-center">
            <p className="text-sm text-muted-foreground">Rain: {item.rainChance}%</p>
          </div>
          <div className="w-28 text-right">
            <p className="text-sm text-muted-foreground">Air: {item.airQualityStatus}</p>

          </div>
        </div>
      ))}
    </div>
  );
}

export function ForecastTabs({ daily, hourly }: ForecastTabsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Forecast</CardTitle>
        <CardDescription>Daily and hourly weather predictions.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily">
              <CalendarDays className="mr-2 h-4 w-4" />
              Daily
            </TabsTrigger>
            <TabsTrigger value="hourly">
              <Clock className="mr-2 h-4 w-4" />
              Hourly
            </TabsTrigger>
          </TabsList>
          <TabsContent value="daily" className="mt-4">
            <ForecastList forecasts={daily} />
          </TabsContent>
          <TabsContent value="hourly" className="mt-4">
            <ForecastList forecasts={hourly} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
