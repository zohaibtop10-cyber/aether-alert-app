'use server';

import { format, parseISO } from 'date-fns';

interface NasaEventGeometry {
    magnitudeValue: number | null;
    magnitudeUnit: string | null;
    date: string;
    type: 'Point' | 'Polygon';
    coordinates: any;
}

interface NasaEventSource {
    id: string;
    url: string;
}

interface NasaEvent {
    id: string;
    title: string;
    description: string | null;
    link: string;
    categories: { id: string, title: string }[];
    sources: NasaEventSource[];
    geometry: NasaEventGeometry[];
    closed: string | null;
}

interface NasaApiResponse {
    title: string;
    description: string;
    link: string;
    events: NasaEvent[];
}

export interface AppEvent {
    id: string;
    title: string;
    description: string;
    location: string;
    date: Date;
    organizerName: string;
    createdAt: Date;
    link: string;
}


async function getLocationFromCoordinates(geometry: NasaEventGeometry): Promise<string> {
    if (geometry.type !== 'Point') {
        return "Multiple Locations";
    }

    // Coordinates can be [lon, lat] or [lon, lat, elevation]
    const [lon, lat] = geometry.coordinates;

    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'MyClimateGuard/1.0 (NASA Event Fetcher)' },
            next: { revalidate: 86400 } // Cache for a day
        });

        if (!response.ok) {
            return "Unknown Location";
        }

        const data = await response.json();
        return data.display_name || "Unknown Location";
    } catch (error) {
        console.error("Error fetching location from coordinates:", error);
        return "Unknown Location";
    }
}


export async function getNasaEvents(): Promise<AppEvent[]> {
    // EONET API provides a feed of natural events.
    // Fetching the last 30 days of events to have a good pool for categorization.
    const url = 'https://eonet.gsfc.nasa.gov/api/v3/events?days=30&status=all'; 

    try {
        const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour

        if (!response.ok) {
            console.error(`Failed to fetch NASA EONET data. Status: ${response.status}`);
            return [];
        }

        const data: NasaApiResponse = await response.json();

        const transformedEvents = await Promise.all(
            data.events.map(async (event) => {
                const latestGeometry = event.geometry[event.geometry.length - 1];
                const location = await getLocationFromCoordinates(latestGeometry);
                
                return {
                    id: event.id,
                    title: event.title,
                    description: event.description || 'No description available.',
                    date: parseISO(latestGeometry.date),
                    location: location,
                    organizerName: event.sources[0]?.id || 'NASA EONET', // Source of the event
                    createdAt: parseISO(latestGeometry.date), // Use event date as creation date
                    link: event.link,
                };
            })
        );
        
        // Sort events by date descending to show most recent first
        return transformedEvents.sort((a,b) => b.date.getTime() - a.date.getTime());

    } catch (error) {
        console.error('NASA EONET API Error:', error);
        return [];
    }
}
