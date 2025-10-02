'use server';

import type { Location } from '@/lib/types';
import fetch from 'node-fetch';

interface NominatimResponse {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    country?: string;
    country_code?: string;
  };
  error?: string;
}

export async function getLocationDetails(
  coords: Pick<Location, 'lat' | 'lon'>
): Promise<Pick<Location, 'city' | 'country'>> {
  const { lat, lon } = coords;
  // Using OpenStreetMap's free Nominatim service.
  // A custom user-agent is required.
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AetherAlert/1.0 (https://your-app-url.com)', // Replace with your app's info
      },
    });

    if (!response.ok) {
      console.error(`Nominatim API Error: ${response.status} ${response.statusText}`);
      return {};
    }

    const data: NominatimResponse = await response.json();

    if (data.error) {
      console.error(`Nominatim API Error: ${data.error}`);
      return {};
    }
    
    const city = data.address?.city || data.address?.town || data.address?.village;
    const country = data.address?.country;

    return { city, country };
  } catch (error) {
    console.error('Failed to fetch location details:', error);
    return {};
  }
}
