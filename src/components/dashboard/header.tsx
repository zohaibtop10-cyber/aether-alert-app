'use client';

import { AirVent, Search, LocateIcon, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '../ui/button';
import { useLocation } from '@/hooks/use-location';
import { Skeleton } from '../ui/skeleton';

export default function Header() {
  const { isLocating, requestLocation, location, isLocationEnabled } =
    useLocation();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-2">
        <AirVent className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-semibold tracking-tight">Aether Alert</h1>
      </div>

      <div className="flex flex-1 items-center justify-end gap-4">
         {isLocating ? (
            <Skeleton className="h-6 w-32" />
          ) : location && location.city ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{location.city}, {location.country}</span>
            </div>
          ) : null}

        <div className="relative flex-none items-center gap-2 md:grow-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search location..."
            className="w-full rounded-lg bg-secondary pl-8 md:w-[200px] lg:w-[320px]"
          />
        </div>
         <Button
          variant="outline"
          size="icon"
          onClick={requestLocation}
          disabled={isLocating}
          aria-label="Use my location"
        >
          <LocateIcon className="h-4 w-4" />
        </Button>
        <ThemeToggle />
      </div>

    </header>
  );
}
