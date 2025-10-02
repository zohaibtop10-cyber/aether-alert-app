'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useLocation } from '@/hooks/use-location';
import { countries } from '@/lib/countries';
import { User } from 'lucide-react';

const profileSchema = z.object({
  country: z.string().nonempty({ message: 'Please select a country.' }),
  city: z.string().nonempty({ message: 'Please select a city.' }),
  disease: z.string().max(50).optional(),
});

export function ProfileDialog() {
  const [open, setOpen] = useState(false);
  const { location, setManualLocation } = useLocation();
  
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      country: location?.country || '',
      city: location?.city || '',
      disease: location?.disease || '',
    },
    // Update default values when location changes
    values: {
        country: location?.country || '',
        city: location?.city || '',
        disease: location?.disease || '',
    }
  });

  const selectedCountry = form.watch('country');
  const cities = countries.find((c) => c.name === selectedCountry)?.cities || [];

  function onSubmit(values: z.infer<typeof profileSchema>) {
    const selectedCountryData = countries.find(c => c.name === values.country);
    const selectedCityData = selectedCountryData?.cities.find(city => city.name === values.city);

    if (selectedCityData) {
        setManualLocation({
            lat: selectedCityData.lat,
            lon: selectedCityData.lon,
            country: values.country,
            city: values.city,
            disease: values.disease || ''
        });
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Open Profile">
          <User className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>
            Set your location and health condition to get personalized alerts.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCountry}>
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
            <FormField
              control={form.control}
              name="disease"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Health Condition (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Asthma" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter>
                <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
