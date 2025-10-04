'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useState, useMemo } from 'react';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { CalendarIcon, MapPin, PlusCircle, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const eventSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  description: z.string().min(20, 'Description must be at least 20 characters.'),
  location: z.string().min(3, 'Location is required.'),
  date: z.date({ required_error: 'A date is required.' }),
});

function CreateEventForm({ setDialogOpen }: { setDialogOpen: (open: boolean) => void }) {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: { title: '', description: '', location: '' },
  });

  async function onSubmit(values: z.infer<typeof eventSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to create an event.',
      });
      return;
    }
    setIsSubmitting(true);

    const eventData = {
      ...values,
      organizerId: user.uid,
      organizerName: user.displayName || 'Anonymous',
      createdAt: serverTimestamp(),
    };

    const eventsRef = collection(firestore, 'events');
    addDoc(eventsRef, eventData)
      .then(() => {
        toast({
          title: 'Event Created!',
          description: 'Your event has been shared with the community.',
        });
        form.reset();
        setDialogOpen(false);
      })
      .catch(() => {
        const permissionError = new FirestorePermissionError({
          path: eventsRef.path,
          operation: 'create',
          requestResourceData: eventData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Community Park Cleanup" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Event Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date() || date > new Date("2100-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Central Park, NYC" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us more about the event..."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Event'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function EventsPage() {
  const { firestore } = useFirebase();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useUser();

  const eventsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'events'), orderBy('date', 'asc')) : null,
    [firestore]
  );
  
  const { data: events, isLoading } = useCollection<any>(eventsQuery);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return events.filter(event =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [events, searchQuery]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-semibold text-3xl">Community Events</h1>
          <p className="text-muted-foreground">
            Find and share local and virtual climate-related events.
          </p>
        </div>
        {user &&
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Event</DialogTitle>
              <DialogDescription>
                Fill out the details below to share your event with the community.
              </DialogDescription>
            </DialogHeader>
            <CreateEventForm setDialogOpen={setIsDialogOpen} />
          </DialogContent>
        </Dialog>
        }
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Filter events..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ))}

        {!isLoading && filteredEvents.map(event => (
          <Card key={event.id}>
            <CardHeader>
              <CardTitle className="line-clamp-2">{event.title}</CardTitle>
              <CardDescription>
                Organized by {event.organizerName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span>{event.date ? format(event.date.toDate(), 'PPP') : 'Date not set'}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="mr-2 h-4 w-4" />
                <span>{event.location}</span>
              </div>
              <p className="line-clamp-3 text-sm">{event.description}</p>
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground">
                    Posted {event.createdAt ? formatDistanceToNow(event.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                </p>
             </CardFooter>
          </Card>
        ))}
      </div>

       {!isLoading && filteredEvents.length === 0 && (
         <div className="text-center text-muted-foreground py-12">
            <p>No events found.</p>
            <p className="text-sm">{searchQuery ? `Try adjusting your filter.` : 'Be the first to create one!'}</p>
         </div>
       )}
    </div>
  );
}
