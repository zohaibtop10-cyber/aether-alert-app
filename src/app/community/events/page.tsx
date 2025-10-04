'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useMemo } from 'react';
import { CalendarIcon, MapPin, Search, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow, addDays, subDays, isWithinInterval, isToday } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { getNasaEvents, AppEvent } from '@/app/actions/get-nasa-events';
import Link from 'next/link';

function EventList({ events, title }: { events: AppEvent[], title: string }) {
    if (events.length === 0) {
        return null;
    }
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 {events.map(event => (
                    <Card key={event.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                            <CardDescription>
                                Source: {event.organizerName}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 flex-grow">
                            <div className="flex items-start text-sm text-muted-foreground">
                                <CalendarIcon className="mr-2 h-4 w-4 mt-1 shrink-0" />
                                <span>{event.date ? format(event.date, 'PPP') : 'Date not set'}</span>
                            </div>
                            <div className="flex items-start text-sm text-muted-foreground">
                                <MapPin className="mr-2 h-4 w-4 mt-1 shrink-0" />
                                <span className="line-clamp-2">{event.location}</span>
                            </div>
                            <p className="line-clamp-4 text-sm">{event.description}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center">
                             <p className="text-xs text-muted-foreground">
                                Reported {event.createdAt ? formatDistanceToNow(event.createdAt, { addSuffix: true }) : 'just now'}
                            </p>
                            <Link href={event.link} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-primary hover:underline">
                                More Info <ExternalLink className="ml-1 h-3 w-3" />
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
            </div>
            <Separator className="my-8" />
        </div>
    )
}

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadEvents() {
        setIsLoading(true);
        try {
            const nasaEvents = await getNasaEvents();
            setEvents(nasaEvents);
        } catch(e) {
            toast({
                variant: 'destructive',
                title: 'Error fetching events',
                description: 'Could not load natural event data from NASA.'
            })
        } finally {
            setIsLoading(false);
        }
    }
    loadEvents();
  }, [toast]);

  const { pastEvents, ongoingEvents, upcomingEvents } = useMemo(() => {
    if (!events) return { pastEvents: [], ongoingEvents: [], upcomingEvents: [] };

    const filtered = events.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const now = new Date();
    const past = filtered.filter(event => 
        isWithinInterval(event.date, { start: subDays(now, 30), end: subDays(now, 1) })
    ).sort((a,b) => b.date.getTime() - a.date.getTime());
    const ongoing = filtered.filter(event => isToday(event.date));
    const upcoming = filtered.filter(event => 
        isWithinInterval(event.date, { start: addDays(now, 1), end: addDays(now, 7) })
    ).sort((a,b) => a.date.getTime() - b.date.getTime());

    return { pastEvents: past, ongoingEvents: ongoing, upcomingEvents: upcoming };
  }, [events, searchQuery]);

  const noResults = !isLoading && !pastEvents.length && !ongoingEvents.length && !upcomingEvents.length;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-semibold text-3xl">Natural Events Tracker</h1>
          <p className="text-muted-foreground">
            Explore recent and ongoing natural events from NASA&apos;s EONET.
          </p>
        </div>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Filter events by title or location..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-8">
        {isLoading && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-10 w-full" />
                    </CardContent>
                     <CardFooter>
                        <Skeleton className="h-4 w-1/3" />
                    </CardFooter>
                </Card>
                ))}
            </div>
        )}

        {!isLoading && (
            <>
                <EventList events={ongoingEvents} title="Ongoing Events" />
                <EventList events={upcomingEvents} title="Upcoming (Next 7 Days)" />
                <EventList events={pastEvents} title="Past (Last 30 Days)" />
            </>
        )}

       {noResults && (
         <div className="text-center text-muted-foreground py-12">
            <p>No events found.</p>
            <p className="text-sm">{searchQuery ? `Try adjusting your filter.` : 'There are no NASA events in the selected timeframes.'}</p>
         </div>
       )}
      </div>
    </div>
  );
}
