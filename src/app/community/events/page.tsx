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
import { CalendarIcon, MapPin, Search, ExternalLink, AlertTriangle, Wind, Droplets, Thermometer } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow, addDays, subDays, isWithinInterval, isToday, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateClimateEvents, type ClimateEvent } from '@/app/actions/generate-climate-events';
import { useLocation } from '@/hooks/use-location';
import { Badge } from '@/components/ui/badge';


function EventCard({ event }: { event: ClimateEvent }) {
  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high': return 'destructive';
      case 'moderate': return 'secondary';
      default: return 'outline';
    }
  }

  const getIcon = (type: string) => {
    switch(type) {
      case 'Air Quality': return <Wind className="mr-2 h-4 w-4 mt-1 shrink-0" />;
      case 'Rainfall': return <Droplets className="mr-2 h-4 w-4 mt-1 shrink-0" />;
      case 'Temperature': return <Thermometer className="mr-2 h-4 w-4 mt-1 shrink-0" />;
      default: return <AlertTriangle className="mr-2 h-4 w-4 mt-1 shrink-0" />;
    }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="line-clamp-2">{event.title}</CardTitle>
          <Badge variant={getSeverityBadge(event.severity)}>{event.severity}</Badge>
        </div>
        <CardDescription>
          Source: {event.source}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 flex-grow">
        <div className="flex items-start text-sm text-muted-foreground">
          {getIcon(event.type)}
          <span>{event.type}</span>
        </div>
        <div className="flex items-start text-sm text-muted-foreground">
          <CalendarIcon className="mr-2 h-4 w-4 mt-1 shrink-0" />
          <span>{event.date ? format(parseISO(event.date), 'PPP') : 'Date not set'}</span>
        </div>
        <div className="flex items-start text-sm text-muted-foreground">
          <MapPin className="mr-2 h-4 w-4 mt-1 shrink-0" />
          <span className="line-clamp-2">{event.location}</span>
        </div>
        <p className="line-clamp-4 text-sm">{event.description}</p>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
            Reported {event.date ? formatDistanceToNow(parseISO(event.date), { addSuffix: true }) : 'just now'}
        </p>
      </CardFooter>
    </Card>
  );
}


function EventList({ events }: { events: ClimateEvent[] }) {
    if (events.length === 0) {
        return (
          <div className="text-center text-muted-foreground py-12">
            <p className="font-semibold text-lg">✅ No Major Climate Events Detected</p>
            <p>Conditions are currently stable in your selected area for this period.</p>
          </div>
        );
    }
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             {events.map(event => (
                <EventCard key={event.id} event={event} />
            ))}
        </div>
    )
}

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<ClimateEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { location, isLocating, error: locationError } = useLocation();

  useEffect(() => {
    async function loadEvents() {
        if (!location) return;

        setIsLoading(true);
        try {
            const climateEvents = await generateClimateEvents(location);
            setEvents(climateEvents);
        } catch(e) {
            console.error(e);
            toast({
                variant: 'destructive',
                title: 'Error generating events',
                description: 'Could not analyze and generate climate events.'
            })
        } finally {
            setIsLoading(false);
        }
    }
    loadEvents();
  }, [location, toast]);

  const classifyEventDate = (eventDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to the beginning of the day
    const e = parseISO(eventDate);

    if (e < subDays(today, 1) && e >= subDays(today, 7)) return 'past';
    if (e >= subDays(today, 0) && e < addDays(today, 1)) return 'ongoing';
    if (e >= addDays(today, 1) && e <= addDays(today, 7)) return 'upcoming';
    
    return null; // Return null if outside the -7 to +7 day range
  };


  const { pastEvents, ongoingEvents, upcomingEvents } = useMemo(() => {
    if (!events) return { pastEvents: [], ongoingEvents: [], upcomingEvents: [] };

    const filtered = events.filter(event =>
        (event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const past: ClimateEvent[] = [];
    const ongoing: ClimateEvent[] = [];
    const upcoming: ClimateEvent[] = [];

    filtered.forEach(event => {
        const category = classifyEventDate(event.date);
        if (category === 'past') past.push(event);
        else if (category === 'ongoing') ongoing.push(event);
        else if (category === 'upcoming') upcoming.push(event);
    });

    return { 
      pastEvents: past.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()), 
      ongoingEvents: ongoing, 
      upcomingEvents: upcoming.sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()) 
    };
  }, [events, searchQuery]);
  
  const noResults = !isLoading && !pastEvents.length && !ongoingEvents.length && !upcomingEvents.length;

  const renderContent = () => {
    if (isLoading || isLocating) {
        return (
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
        )
    }

     if (locationError) {
      return (
        <div className="text-center text-destructive py-12">
          <AlertTriangle className="mx-auto h-12 w-12" />
          <p className="mt-4 font-semibold">Could not load location</p>
          <p className="text-sm">{locationError}</p>
        </div>
      );
    }
    
    return (
        <Tabs defaultValue="ongoing">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="past">Past (7 Days)</TabsTrigger>
                <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming (7 Days)</TabsTrigger>
            </TabsList>
            <TabsContent value="past" className="mt-4">
                <EventList events={pastEvents} />
            </TabsContent>
            <TabsContent value="ongoing" className="mt-4">
                <EventList events={ongoingEvents} />
            </TabsContent>
            <TabsContent value="upcoming" className="mt-4">
                <EventList events={upcomingEvents} />
            </TabsContent>
      </Tabs>
    )

  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-semibold text-3xl">Climate Events Dashboard</h1>
          <p className="text-muted-foreground">
            AI-generated events based on environmental data for your location.
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
      {renderContent()}
    </div>
  );
}
