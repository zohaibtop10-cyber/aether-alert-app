'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Line, LineChart, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { HistoricalDataPoint } from '@/lib/types';
import { TrendingUp } from 'lucide-react';

interface HistoricalChartCardProps {
  data7d: HistoricalDataPoint[];
  data30d: HistoricalDataPoint[];
}

const chartConfig = {
  temperature: {
    label: 'Temp (°C)',
    color: 'hsl(var(--chart-1))',
  },
  rainfall: {
    label: 'Rain (mm)',
    color: 'hsl(var(--chart-2))',
  },
  pm25: {
    label: 'PM2.5 (µg/m³)',
    color: 'hsl(var(--chart-4))',
  },
};

export function HistoricalChartCard({ data7d, data30d }: HistoricalChartCardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');
  const [dataType, setDataType] = useState<'temperature' | 'rainfall' | 'pm25'>('temperature');

  const data = timeRange === '7d' ? data7d : data30d;

  const CustomChart = dataType === 'rainfall' ? BarChart : LineChart;
  const ChartComponent = dataType === 'rainfall' ? Bar : Line;

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Historical Trends</CardTitle>
          <CardDescription>View environmental data from the last 7 or 30 days.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dataType} onValueChange={(value) => setDataType(value as any)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select data" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="temperature">Temperature</SelectItem>
              <SelectItem value="rainfall">Rainfall</SelectItem>
              <SelectItem value="pm25">Air Quality (PM2.5)</SelectItem>
            </SelectContent>
          </Select>
          <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as any)} className="w-auto">
            <TabsList>
              <TabsTrigger value="7d">7d</TabsTrigger>
              <TabsTrigger value="30d">30d</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer>
            <CustomChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                padding={{ left: 20, right: 20 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={['auto', 'auto']}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}/>}
              />
              <ChartComponent
                dataKey={dataType}
                type="monotone"
                fill={chartConfig[dataType].color}
                stroke={chartConfig[dataType].color}
                strokeWidth={2}
                dot={dataType !== 'rainfall' ? true : false}
                name={chartConfig[dataType].label}
              />
            </CustomChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
