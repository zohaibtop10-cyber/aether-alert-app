'use client';

import { useState, useEffect, useTransition } from 'react';
import Header from '@/components/dashboard/header';
import { HealthAlertCard } from '@/components/dashboard/health-alert-card';
import { InfoCard } from '@/components/dashboard/info-card';
import { AirQualityCard } from '@/components/dashboard/air-quality-card';
import { ForecastTabs } from '@/components/dashboard/forecast-tabs';
import { HistoricalChartCard } from '@/components/dashboard/historical-chart-card';
import { getWeatherData } from './actions/get-weather-data';
import {
  getMockForecast,
  getMockHistoricalData,
} from '@/lib/placeholder-data';
import { Thermometer, Droplets, CloudRain, VolumeX } from 'lucide-react';
import type { CurrentConditions, Forecast, HistoricalDataPoint } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from '@/hooks/use-location';

const getAirQualitySummary = (
  airQuality: CurrentConditions['airQuality'] | undefined
) => {
  if (!airQuality)
    return { label: 'Unknown', color: 'text-muted-foreground' };
  const pm25 = airQuality.pm25;
  if (pm25 <= 12) return { label: 'Good', color: 'text-green-500' };
  if (pm25 <= 35.4) return { label: 'Moderate', color: 'text-yellow-500' };
  if (pm25 <= 55.4)
    return {
      label: 'Unhealthy for Sensitive Groups',
      color: 'text-orange-500',
    };
  if (pm25 <= 150.4) return { label: 'Unhealthy', color: 'text-red-500' };
  if (pm25 <= 250.4)
    return { label: 'Very Unhealthy', color: 'text-purple-500' };
  return { label: 'Hazardous', color: 'text-red-700' };
};

export default function Home() {
  const { location, isLocating, error } = useLocation();
  const [isPending, startTransition] = useTransition();

  const [currentConditions, setCurrentConditions] = useState<CurrentConditions | null>(null);
  const [dailyForecast, setDailyForecast] = useState<Forecast[]>([]);
  const [hourlyForecast, setHourlyForecast] = useState<Forecast[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    // When location is available, fetch the weather data
    if (location) {
      startTransition(async () => {
        setApiError(null);
        const result = await getWeatherData({ lat: location.lat, lon: location.lon });
        if (result.success) {
          setCurrentConditions(result.data.current);
          // For now, we'll continue to use mock data for forecast and historical.
          setDailyForecast(getMockForecast('daily'));
          setHourlyForecast(getMockForecast('hourly'));
        } else {
          setApiError(result.error);
        }
      });
    }
  }, [location]);

  const historicalData7d = getMockHistoricalData(7);
  const historicalData30d = getMockHistoricalData(30);

  const airQualitySummary = getAirQualitySummary(currentConditions?.airQuality);

  const isLoading = isLocating || isPending;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <Header />
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
        {error && (
          <Card className="bg-destructive text-destructive-foreground">
            <CardHeader>
              <CardTitle>Location Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
            </CardContent>
          </Card>
        )}
        {apiError && (
          <Card className="bg-destructive text-destructive-foreground">
            <CardHeader>
              <CardTitle>Data Fetching Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{apiError}</p>
            </CardContent>
          </Card>
        )}

        {isLoading || !currentConditions ? (
          <Skeleton className="h-[200px] w-full" />
        ) : (
          <HealthAlertCard currentConditions={currentConditions} />
        )}


        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {isLoading || !currentConditions ? (
            <>
              <Skeleton className="h-[125px] w-full" />
              <Skeleton className="h-[125px] w-full" />
              <Skeleton className="h-[125px] w-full" />
              <Skeleton className="h-[125px] w-full" />
            </>
          ) : (
            <>
              <InfoCard
                title="Temperature"
                value={currentConditions.temperature}
                unit="°C"
                icon={<Thermometer className="size-6 text-muted-foreground" />}
                description="Current ambient temperature"
              />
              <InfoCard
                title="Humidity"
                value={currentConditions.humidity}
                unit="%"
                icon={<Droplets className="size-6 text-muted-foreground" />}
                description="Relative humidity level"
              />
              <InfoCard
                title="Rain Chance"
                value={currentConditions.rainChance}
                unit="%"
                icon={<CloudRain className="size-6 text-muted-foreground" />}
                description="Probability of precipitation"
              />
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Noise Pollution
                  </CardTitle>
                  <VolumeX className="size-6 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    No NASA data available. This is a placeholder.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
             {isLoading || !currentConditions ? (
                <Skeleton className="h-[350px] w-full" />
              ) : (
                <AirQualityCard
                  airQuality={currentConditions.airQuality}
                  summary={airQualitySummary}
                />
             )}
          </div>
          <div className="lg:col-span-2">
             {isLoading || dailyForecast.length === 0 ? (
                <Skeleton className="h-[350px] w-full" />
              ) : (
                <ForecastTabs daily={dailyForecast} hourly={hourlyForecast} />
              )}
          </div>
        </div>

        <HistoricalChartCard
          data7d={historicalData7d}
          data30d={historicalData30d}
        />
      </main>
    </div>
  );
}
