import Header from '@/components/dashboard/header';
import { HealthAlertCard } from '@/components/dashboard/health-alert-card';
import { InfoCard } from '@/components/dashboard/info-card';
import { AirQualityCard } from '@/components/dashboard/air-quality-card';
import { ForecastTabs } from '@/components/dashboard/forecast-tabs';
import { HistoricalChartCard } from '@/components/dashboard/historical-chart-card';
import { getMockCurrentConditions, getMockForecast, getMockHistoricalData } from '@/lib/placeholder-data';
import { Thermometer, Droplets, CloudRain, VolumeX } from 'lucide-react';
import type { CurrentConditions } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const getAirQualitySummary = (airQuality: CurrentConditions['airQuality']) => {
  const pm25 = airQuality.pm25;
  if (pm25 <= 12) return { label: 'Good', color: 'text-green-500' };
  if (pm25 <= 35.4) return { label: 'Moderate', color: 'text-yellow-500' };
  if (pm25 <= 55.4) return { label: 'Unhealthy for Sensitive Groups', color: 'text-orange-500' };
  if (pm25 <= 150.4) return { label: 'Unhealthy', color: 'text-red-500' };
  if (pm25 <= 250.4) return { label: 'Very Unhealthy', color: 'text-purple-500' };
  return { label: 'Hazardous', color: 'text-red-700' };
};


export default function Home() {
  const currentConditions = getMockCurrentConditions();
  const dailyForecast = getMockForecast('daily');
  const hourlyForecast = getMockForecast('hourly');
  const historicalData7d = getMockHistoricalData(7);
  const historicalData30d = getMockHistoricalData(30);

  const airQualitySummary = getAirQualitySummary(currentConditions.airQuality);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <Header />
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
        <HealthAlertCard currentConditions={currentConditions} />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
              <CardTitle className="text-sm font-medium">Noise Pollution</CardTitle>
              <VolumeX className="size-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                No NASA data available. This is a placeholder.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <AirQualityCard airQuality={currentConditions.airQuality} summary={airQualitySummary} />
          </div>
          <div className="lg:col-span-2">
            <ForecastTabs daily={dailyForecast} hourly={hourlyForecast} />
          </div>
        </div>
        
        <HistoricalChartCard data7d={historicalData7d} data30d={historicalData30d} />
      </main>
    </div>
  );
}
