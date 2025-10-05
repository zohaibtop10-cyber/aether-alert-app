'use server';

import type { Location, HistoricalDataPoint } from '@/lib/types';
import { subDays, format } from 'date-fns';

interface NasaPowerResponse {
    properties: {
        parameter: {
            [key: string]: {
                [date: string]: number;
            };
        };
    };
    header: {
        fill_value: number;
    }
}

// Fetches historical data from NASA POWER API
export async function getHistoricalData(location: Location, days: 7 | 30): Promise<HistoricalDataPoint[]> {
    const apiKey = process.env.NASA_API_KEY;

    if (!apiKey) {
        console.error("NASA API key is not configured for historical data.");
        return []; // Return empty array if no key
    }

    const { lat, lon } = location;
    // Account for data latency from the NASA POWER API (usually a few days)
    const endDate = subDays(new Date(), 3); 
    const startDate = subDays(endDate, days - 1);

    const formattedStartDate = format(startDate, 'yyyyMMdd');
    const formattedEndDate = format(endDate, 'yyyyMMdd');

    // Parameters for historical data: Temperature, Precipitation, Surface Pressure
    const parameters = ['T2M', 'PRECTOTCORR', 'PS'].join(',');

    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?start=${formattedStartDate}&end=${formattedEndDate}&latitude=${lat}&longitude=${lon}&community=RE&parameters=${parameters}&format=JSON`;

    try {
        const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour

        if (!response.ok) {
            console.error(`Failed to fetch historical data from NASA. Status: ${response.status}`);
            return [];
        }

        const data: NasaPowerResponse = await response.json();
        const fillValue = data.header.fill_value;

        const t2m = data.properties.parameter.T2M;
        const prectotcorr = data.properties.parameter.PRECTOTCORR;
        const ps = data.properties.parameter.PS;

        const historicalData: HistoricalDataPoint[] = Object.keys(t2m).map(dateStr => {
            const year = dateStr.substring(0, 4);
            const month = dateStr.substring(4, 6);
            const day = dateStr.substring(6, 8);
            const formattedDate = `${year}-${month}-${day}`;

            return {
                date: formattedDate,
                temperature: t2m[dateStr] !== fillValue ? parseFloat(t2m[dateStr].toFixed(2)) : 0,
                rainfall: prectotcorr[dateStr] !== fillValue ? parseFloat(prectotcorr[dateStr].toFixed(2)) : 0,
                pressure: ps[dateStr] !== fillValue ? parseFloat(ps[dateStr].toFixed(2)) : 0,
            };
        });

        return historicalData;

    } catch (error) {
        console.error("NASA POWER Historical API Error:", error);
        return [];
    }
}
