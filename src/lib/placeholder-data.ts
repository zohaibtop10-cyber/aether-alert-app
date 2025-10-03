import type { HistoricalDataPoint } from './types';

// This file is now mostly obsolete as we are fetching real data.
// It is kept for potential testing or fallback scenarios in the future.

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
      pressure: 101 + Math.random() * 2 - 1, // Mock pressure in kPa
    });
  }
  return data.reverse();
};
