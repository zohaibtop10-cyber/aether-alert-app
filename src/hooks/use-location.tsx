'use client';

import { Location } from '@/lib/types';
import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { getLocationDetails } from '@/app/actions/get-location-details';
import { countries } from '@/lib/countries';

interface LocationContextType {
  location: Location | null;
  isLocating: boolean;
  isLocationEnabled: boolean;
  error: string | null;
  requestLocation: () => void;
  setManualLocation: (location: Location) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(
  undefined
);

// Get default location (first city of first country)
const defaultCountry = countries[0];
const defaultCity = defaultCountry.cities[0];
const defaultLocation: Location = {
    lat: defaultCity.lat,
    lon: defaultCity.lon,
    city: defaultCity.name,
    country: defaultCountry.name,
    disease: ''
};


export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Location | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(true);
  const [isLocationEnabled, setIsLocationEnabled] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // On initial load, try to get location from localStorage or default
    try {
        const savedLocation = localStorage.getItem('user-location');
        if (savedLocation) {
            setLocation(JSON.parse(savedLocation));
        } else {
            setLocation(defaultLocation);
        }
    } catch (e) {
        setLocation(defaultLocation);
    }
    setIsLocating(false);
  }, []);

  const updateLocation = (newLocation: Location) => {
    setLocation(newLocation);
    try {
        localStorage.setItem('user-location', JSON.stringify(newLocation));
    } catch(e) {
        // localstorage not available
    }
  }

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setIsLocating(false);
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        const details = await getLocationDetails({ lat: latitude, lon: longitude });

        const newLocation = { 
            lat: latitude, 
            lon: longitude, 
            ...details, 
            disease: location?.disease || '' 
        };
        updateLocation(newLocation);
        setIsLocationEnabled(true);
        setIsLocating(false);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('You denied the request for Geolocation.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information is unavailable.');
            break;
          case err.TIMEOUT:
            setError('The request to get user location timed out.');
            break;
          default:
            setError('An unknown error occurred.');
            break;
        }
        setIsLocationEnabled(false);
        setIsLocating(false);
      },
      { timeout: 10000 }
    );
  }, [location?.disease]);

  const setManualLocation = (newLocation: Location) => {
    setIsLocating(true);
    updateLocation(newLocation);
    setIsLocating(false);
  }

  return (
    <LocationContext.Provider
      value={{
        location,
        isLocating,
        isLocationEnabled,
        error,
        requestLocation,
        setManualLocation
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
