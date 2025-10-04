'use client';

import { AirVent, LocateIcon, MapPin, Menu, User } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '../ui/button';
import { useLocation } from '@/hooks/use-location';
import { Skeleton } from '../ui/skeleton';
import { ProfileDialog } from './profile-dialog';
import { useSidebar } from '../ui/sidebar';

export default function Header() {
  const { isLocating, requestLocation, location, isLocationEnabled } = useLocation();
  const { toggleSidebar } = useSidebar();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
       <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleSidebar}
        >
          <Menu />
        </Button>
      <div className="hidden items-center gap-2 md:flex">
        <AirVent className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
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
