'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirebase, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/hooks/use-location';
import { countries } from '@/lib/countries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  country: z.string().nonempty({ message: 'Please select a country.' }),
  city: z.string().nonempty({ message: 'Please select a city.' }),
  healthConditions: z.string().max(100).optional(),
  locationEnabled: z.boolean().default(true),
  notificationsEnabled: z.boolean().default(true),
});

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const { location, setManualLocation, requestLocation, isLocationEnabled } = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const { toast } = useToast();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      country: '',
      city: '',
      healthConditions: '',
      locationEnabled: true,
      notificationsEnabled: true,
    },
  });

  const selectedCountry = form.watch('country');
  const cities = countries.find((c) => c.name === selectedCountry)?.cities || [];

  useEffect(() => {
    if (user && location) {
      form.reset({
        name: user.displayName || '',
        country: location.country || '',
        city: location.city || '',
        healthConditions: location.disease || '',
        locationEnabled: isLocationEnabled,
        notificationsEnabled: Notification.permission === 'granted',
      });
    }
     if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [user, location, form, isLocationEnabled]);
  
  const handleNotificationToggle = async (checked: boolean) => {
    if (checked) {
      if (Notification.permission === 'granted') {
        // Already granted
        return;
      }
      if (Notification.permission === 'denied') {
        toast({
          variant: 'destructive',
          title: 'Notification Permission Denied',
          description: 'Please enable notifications in your browser settings.',
        });
        form.setValue('notificationsEnabled', false);
        return;
      }
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        toast({
          title: 'Notifications Enabled',
          description: 'You will now receive climate alerts.',
        });
        form.setValue('notificationsEnabled', true);
        // Here you would get the FCM token and save it
      } else {
        form.setValue('notificationsEnabled', false);
      }
    } else {
       // The user is disabling it in the UI, no browser permission change needed.
       // You might want to remove the FCM token from the server here.
    }
  };

  const handleLocationToggle = (checked: boolean) => {
    if (checked) {
      requestLocation();
    } else {
        toast({
          title: 'Location Turned Off',
          description: 'Using default location. Turn back on to use your current location.',
        });
    }
  }


  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user) return;
    setIsLoading(true);

    const userRef = doc(firestore, 'users', user.uid);
    const userData: any = {
      name: values.name,
      email: user.email,
      healthConditions: values.healthConditions,
    };
    
    // In a real app, you would get the FCM token if notifications are enabled
    if (values.notificationsEnabled && notificationPermission === 'granted') {
        // This is a placeholder for getting the actual token
        userData.deviceToken = 'placeholder-fcm-token-for-' + user.uid;
    }


    setDoc(userRef, userData, { merge: true })
      .then(() => {
        const selectedCountryData = countries.find(c => c.name === values.country);
        const selectedCityData = selectedCountryData?.cities.find(city => city.name === values.city);

        if (selectedCityData) {
          setManualLocation({
            lat: selectedCityData.lat,
            lon: selectedCityData.lon,
            country: values.country,
            city: values.city,
            disease: values.healthConditions || ''
          });
        }
        
        toast({
          title: 'Profile Updated',
          description: 'Your information has been saved successfully.',
        });
      })
      .catch(() => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'write',
          requestResourceData: userData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  if (isUserLoading || !location) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-6 w-80" />
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-24" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="grid gap-4">
        <h1 className="font-semibold text-3xl">Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and preferences.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Personal Information</CardTitle>
              <CardDescription>
                Update your name and location settings. Your selected city will be used for weather data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.name} value={country.name}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCountry}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a city" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.name} value={city.name}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Permissions & Health</CardTitle>
              <CardDescription>
                Provide health info for personalized alerts and manage permissions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <FormField
                control={form.control}
                name="locationEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Use My Current Location
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Allow the app to use your device's location for real-time data.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                            field.onChange(checked);
                            handleLocationToggle(checked);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notificationsEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Enable Push Notifications
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Receive real-time environmental alerts on your device.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                            field.onChange(checked);
                            handleNotificationToggle(checked);
                        }}
                        disabled={notificationPermission === 'denied'}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="healthConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Health Conditions (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Asthma, Allergies"
                        {...field}
                      />
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
