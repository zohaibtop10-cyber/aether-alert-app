"use client";

import { Location } from "@/lib/types";
import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { getLocationDetails } from "@/app/actions/get-location-details";

interface LocationContextType {
  location: Location | null;
  isLocating: boolean;
  isLocationEnabled: boolean;
  error: string | null;
  requestLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(
  undefined
);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Location | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(true); // Start with true
  const [isLocationEnabled, setIsLocationEnabled] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setIsLocating(false);
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Fetch location details (city, country)
        const details = await getLocationDetails({ lat: latitude, lon: longitude });

        setLocation({ lat: latitude, lon: longitude, ...details });
        setIsLocationEnabled(true);
        setIsLocating(false);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("You denied the request for Geolocation.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location information is unavailable.");
            break;
          case err.TIMEOUT:
            setError("The request to get user location timed out.");
            break;
          default:
            setError("An unknown error occurred.");
            break;
        }
        setIsLocationEnabled(false);
        setIsLocating(false);
      },
      { timeout: 10000 }
    );
  }, []);

  return (
    <LocationContext.Provider
      value={{
        location,
        isLocating,
        isLocationEnabled,
        error,
        requestLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
};
