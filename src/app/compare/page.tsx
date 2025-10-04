'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Globe } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { getLocationDetails } from '@/app/actions/get-location-details';

// Function to convert Lat/Lon to Tile coordinates for WMTS
function latLonToTile(lat: number, lon: number, zoom: number): { x: number, y: number } {
    const n = Math.pow(2, zoom);
    const latRad = lat * Math.PI / 180;
    const x = Math.floor(n * ((lon + 180) / 360));
    const y = Math.floor(n * (1 - (Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI)) / 2);
    return { x, y };
}

function getGIBSEarthImageUrl(date: Date, lat: number, lon: number): string {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const zoom = 5; // Zoom out slightly for better context
    const {x, y} = latLonToTile(lat, lon, zoom);
    // This layer has much better global coverage
    const layer = 'MODIS_Terra_CorrectedReflectance_TrueColor'; 
    return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${formattedDate}/GoogleMapsCompatible_Level${zoom}/${y}/${x}.jpg`;
}

// Generates random coordinates more likely to be on land
function getRandomLandLocation() {
    // Restrict latitude to exclude extreme polar regions where imagery is sparse
    const lat = Math.random() * 140 - 70; // Approx -70 to 70
    const lon = Math.random() * 360 - 180; // -180 to 180
    return { lat, lon };
}


function getRandomPastDate(): Date {
    const today = new Date();
    // Go back at least a few days to ensure data availability, up to a year
    const minDaysAgo = 10;
    const maxDaysAgo = 365;
    const randomDaysAgo = Math.floor(Math.random() * (maxDaysAgo - minDaysAgo + 1)) + minDaysAgo;
    
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - randomDaysAgo);
    return pastDate;
}


export default function ComparePage() {
    const [isPending, startTransition] = useTransition();

    const [comparisonLocation, setComparisonLocation] = useState<{lat: number, lon: number} | null>(null);
    const [locationName, setLocationName] = useState<string>('a random location');
    const [beforeDate, setBeforeDate] = useState<Date | null>(null);
    const [afterDate, setAfterDate] = useState<Date | null>(null);

    const [beforeImageUrl, setBeforeImageUrl] = useState<string | null>(null);
    const [afterImageUrl, setAfterImageUrl] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    
    const generateComparison = (loc: {lat: number, lon: number}) => {
        startTransition(async () => {
            setImageError(null);
            setBeforeImageUrl(null);
            setAfterImageUrl(null);

            const randomPastDate = getRandomPastDate();
            const currentRecentDate = new Date(new Date().setDate(new Date().getDate() - 2));
            
            setBeforeDate(randomPastDate);
            setAfterDate(currentRecentDate);

            try {
                const afterUrl = getGIBSEarthImageUrl(currentRecentDate, loc.lat, loc.lon);
                const beforeUrl = getGIBSEarthImageUrl(randomPastDate, loc.lat, loc.lon);

                const afterRes = await fetch(afterUrl, { method: 'HEAD' });
                const beforeRes = await fetch(beforeUrl, { method: 'HEAD' });

                if (!afterRes.ok || !beforeRes.ok) {
                   handleNewRandomLocation();
                   return;
                }

                setAfterImageUrl(afterUrl);
                setBeforeImageUrl(beforeUrl);

                 const details = await getLocationDetails({ lat: loc.lat, lon: loc.lon });
                 if (details.city || details.country) {
                    setLocationName(`${details.city || 'Region'}, ${details.country || ''}`);
                 } else {
                    setLocationName(`Lat: ${loc.lat.toFixed(2)}, Lon: ${loc.lon.toFixed(2)}`);
                 }


            } catch (e: any) {
                setImageError("Failed to fetch imagery due to a network issue. Retrying with a new location.");
                // Automatically try a new location
                setTimeout(handleNewRandomLocation, 2000);
            }
        });
    }

    const handleNewRandomLocation = () => {
        const randomLoc = getRandomLandLocation();
        setComparisonLocation(randomLoc);
    }

    useEffect(() => {
        handleNewRandomLocation();
    }, []);
    
    useEffect(() => {
        if(comparisonLocation) {
            generateComparison(comparisonLocation);
        }
    }, [comparisonLocation]);


    const renderContent = () => {
        if (isPending || !beforeImageUrl || !afterImageUrl) {
            return (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="aspect-square w-full" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="aspect-square w-full" />
                        </CardContent>
                    </Card>
                </div>
            )
        }

        if (imageError) {
            return (
                <div className="flex flex-col items-center justify-center text-center gap-4 text-muted-foreground min-h-[400px]">
                    <AlertTriangle className="h-12 w-12" />
                    <p className="font-semibold">Could not load satellite imagery.</p>
                    <p className="text-sm max-w-md">{imageError}</p>
                    <p className="text-xs">Finding a new location...</p>
                </div>
            );
        }

        if (!beforeImageUrl || !afterImageUrl || !beforeDate || !afterDate) {
             return (
                <div className="flex flex-col items-center justify-center text-center gap-4 text-muted-foreground min-h-[400px]">
                    <Globe className="h-12 w-12 animate-spin" />
                    <p className="font-semibold">Fetching a random location...</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Before</CardTitle>
                        <CardDescription>{format(beforeDate, 'MMMM dd, yyyy')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Image
                            src={beforeImageUrl}
                            alt="Satellite image from the past"
                            width={600}
                            height={600}
                            className="rounded-lg object-cover aspect-square bg-muted"
                            unoptimized
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Now</CardTitle>
                        <CardDescription>{format(afterDate, 'MMMM dd, yyyy')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Image
                            src={afterImageUrl}
                            alt="Satellite image from today"
                            width={600}
                            height={600}
                            className="rounded-lg object-cover aspect-square bg-muted"
                            unoptimized
                        />
                    </CardContent>
                </Card>
            </div>
        );
    };

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="font-semibold text-3xl">Before & Now</h1>
                    <p className="text-muted-foreground">
                        Satellite imagery comparison for <span className="font-semibold text-primary">{locationName}</span>. Data by NASA GIBS.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleNewRandomLocation} variant="outline" disabled={isPending}>
                        <Globe className="mr-2 h-4 w-4" />
                        Another Location
                    </Button>
                </div>
            </div>
            {renderContent()}
        </div>
    );
}
