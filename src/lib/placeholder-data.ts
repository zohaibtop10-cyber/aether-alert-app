import type { CurrentConditions, Forecast, HistoricalDataPoint } from './types';

export const getMockCurrentConditions = (): CurrentConditions => ({
  temperature: 25.4,
  humidity: 60,
  rainChance: 20,
  airQuality: {
    pm25: 18.5,
    o3: 45.2,
    co: 1.1,
    no2: 15.6,
  },
  noiseLevel: 0, // Placeholder
});

export const getMockForecast = (type: 'daily' | 'hourly'): Forecast[] => {
  const forecast: Forecast[] = [];
  const now = new Date();
  
  if (type === 'daily') {
    for (let i = 1; i <= 7; i++) {
      now.setDate(now.getDate() + 1);
      forecast.push({
        time: now.toLocaleDateString('en-US', { weekday: 'short' }),
        temperature: 25 + Math.random() * 5 - 2.5,
        rainChance: Math.floor(Math.random() * 80),
        airQualityStatus: ['Good', 'Moderate', 'Unhealthy'][Math.floor(Math.random() * 3)],
      });
    }
  } else {
    for (let i = 1; i <= 24; i++) {
        const d = new Date()
        d.setHours(d.getHours() + i);
        forecast.push({
        time: d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
        temperature: 25 + Math.sin(i / 6) * 3,
        rainChance: Math.floor(Math.random() * 20),
        airQualityStatus: ['Good', 'Moderate'][Math.floor(Math.random() * 2)],
      });
    }
  }
  return forecast;
};

export const getMockHistoricalData = (days: 7 | 30): HistoricalDataPoint[] => {
  const data: HistoricalDataPoint[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    data.push({
      date: date.toLocaleDateString('en-CA'), // YYYY-MM-DD format
      temperature: 20 + Math.random() * 10 - 5 + Math.sin(i / 3) * 2,
      rainfall: Math.max(0, Math.random() * 15 - 10),
      pm25: Math.max(5, Math.random() * 50 - 5 + Math.sin(i/5) * 10),
    });
  }
  return data.reverse();
};
