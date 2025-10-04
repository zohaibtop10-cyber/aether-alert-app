'use client';

import { useState, useEffect, useTransition, Suspense } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { InfoCard } from '@/components/dashboard/info-card';
import { AirQualityCard } from '@/components/dashboard/air-quality-card';
import { ForecastTabs } from '@/components/dashboard/forecast-tabs';
import { HistoricalChartCard } from '@/components/dashboard/historical-chart-card';
import { getWeatherData } from './actions/get-weather-data';
import { getHistoricalData } from './actions/get-historical-data';
import { Thermometer, Droplets, CloudRain, Wind, AirVent, Gauge } from 'lucide-react';
import type { CurrentConditions, HistoricalDataPoint } from '@/lib/types';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from '@/hooks/use-location';
import { PermissionsDialog } from '@/components/permissions-dialog';
import { motion } from 'framer-motion';

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};


function DashboardPage() {
  const { location, isLocating, error } = useLocation();
  const [isPending, startTransition] = useTransition();
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);

  const [currentConditions, setCurrentConditions] = useState<CurrentConditions | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const [historicalData7d, setHistoricalData7d] = useState<HistoricalDataPoint[]>([]);
  const [historicalData30d, setHistoricalData30d] = useState<HistoricalDataPoint[]>([]);

  useEffect(() => {
    // Check if we should show the permissions dialog
    const permissionsRequested = localStorage.getItem('permissionsRequested');
    if (!permissionsRequested) {
      setShowPermissionsDialog(true);
    }
  }, []);

  useEffect(() => {
    if (location) {
      startTransition(async () => {
        setApiError(null);
        setCurrentConditions(null); 
        
        try {
            const weatherResult = await getWeatherData({ lat: location.lat, lon: location.lon });
            if (weatherResult.success) {
              setCurrentConditions(weatherResult.data.current);
            } else {
              setApiError(weatherResult.error);
            }

            // Fetch historical data
            const [data7d, data30d] = await Promise.all([
              getHistoricalData(location, 7),
              getHistoricalData(location, 30)
            ]);
            setHistoricalData7d(data7d);
            setHistoricalData30d(data30d);

        } catch (e: any) {
            setApiError(e.message || "An unexpected error occurred.");
        }
      });
    }
  }, [location]);

  const handlePermissionsDialogClose = () => {
    localStorage.setItem('permissionsRequested', 'true');
    setShowPermissionsDialog(false);
  };

  const airQualitySummary = getAirQualitySummary(currentConditions?.airQuality);
  const dailyForecast = currentConditions?.dailyForecast || [];
  const hourlyForecast = currentConditions?.hourlyForecast || [];
  const isLoading = isLocating || isPending;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
      <PermissionsDialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog} onDialogClose={handlePermissionsDialogClose} />
        {error && (
          <Card className="bg-destructive text-destructive-foreground">
            <CardHeader>
              <div className="text-lg font-semibold">Location Error</div>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
            </CardContent>
          </Card>
        )}
        {apiError && (
          <Card className="bg-destructive text-destructive-foreground">
            <CardHeader>
              <div className="text-lg font-semibold">Data Fetching Error</div>
            </CardHeader>
            <CardContent>
              <p>{apiError}</p>
            </CardContent>
          </Card>
        )}

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={!isLoading ? 'visible' : 'hidden'}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        >
          {isLoading || !currentConditions ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[125px] w-full" />
            ))
          ) : (
            <>
              <motion.div variants={itemVariants}>
                <InfoCard
                  title="Temperature"
                  value={`${currentConditions.temperature}°C`}
                  icon={<Thermometer className="size-6 text-muted-foreground" />}
                  description={`Min: ${currentConditions.minTemperature}°C / Max: ${currentConditions.maxTemperature}°C`}
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <InfoCard
                  title="Humidity"
                  value={`${currentConditions.humidity}%`}
                  icon={<Droplets className="size-6 text-muted-foreground" />}
                  description="Relative humidity level"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <InfoCard
                  title="Rainfall"
                  value={`${currentConditions.rainChance}%`}
                  icon={<CloudRain className="size-6 text-muted-foreground" />}
                  description="Probability of precipitation"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <InfoCard
                  title="Wind"
                  value={`${currentConditions.windSpeed} m/s`}
                  icon={<Wind className="size-6 text-muted-foreground" />}
                  description="Current wind speed"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <InfoCard
                  title="Pressure"
                  value={`${currentConditions.pressure} kPa`}
                  icon={<Gauge className="size-6 text-muted-foreground" />}
                  description="Atmospheric pressure"
                />
              </motion.div>
            </>
          )}
        </motion.div>

        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate={!isLoading ? 'visible' : 'hidden'}
            className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          {isLoading || !currentConditions ? (
              <>
                <Skeleton className="h-[350px] w-full" />
                <Skeleton className="h-[350px] w-full" />
              </>
            ) : (
              <>
                <motion.div variants={itemVariants}>
                  <AirQualityCard
                    airQuality={currentConditions.airQuality}
                    summary={airQualitySummary}
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <ForecastTabs daily={dailyForecast} hourly={hourlyForecast} />
                </motion.div>
              </>
           )}
        </motion.div>

        <motion.div
           variants={itemVariants}
           initial="hidden"
           animate={!isLoading ? "visible" : "hidden"}
        >
          <HistoricalChartCard
            data7d={historicalData7d}
            data30d={historicalData30d}
            isLoading={isLoading}
          />
        </motion.div>
    </div>
  );
}


export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
         <AirVent className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><AirVent className="h-12 w-12 animate-spin text-primary" /></div>}>
      <DashboardPage />
    </Suspense>
  );
}
