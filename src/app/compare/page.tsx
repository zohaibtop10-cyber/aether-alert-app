'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Globe, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

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
    const zoom = 6;
    const {x, y} = latLonToTile(lat, lon, zoom);
    const layer = 'MODIS_Terra_CorrectedReflectance_TrueColor';
    return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${formattedDate}/GoogleMapsCompatible_Level${zoom}/${y}/${x}.jpg`;
}

function getRandomLocation() {
    const lat = Math.random() * 180 - 90;  // -90 to 90
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

    const [beforeImageUrl, setBeforeImageUrl] = useState<string | null>(null);
    const [afterImageUrl, setAfterImageUrl] = useState<string | null>(null);
    const [imageError, setImageError] = useState<boolean>(false);
    
    // GIBS data might have a delay of a day or two
    const recentDate = new Date(new Date().setDate(new Date().getDate() - 2)); 

    const generateComparison = (loc: {lat: number, lon: number} | null) => {
        if (!loc) return;
        
        startTransition(() => {
            setImageError(false);
            setBeforeImageUrl(null);
            setAfterImageUrl(null);

            const randomPastDate = getRandomPastDate();
            setBeforeDate(randomPastDate);

            try {
                const afterUrl = getGIBSEarthImageUrl(recentDate, loc.lat, loc.lon);
                const beforeUrl = getGIBSEarthImageUrl(randomPastDate, loc.lat, loc.lon);
                setAfterImageUrl(afterUrl);
                setBeforeImageUrl(beforeUrl);
            } catch (e) {
                console.error("Error generating image URLs", e);
                setImageError(true);
            }
        });
    }

    // Effect to initialize with a random location
    useEffect(() => {
        handleRandomLocation();
    }, []);
    
    // Effect to generate images when comparison location changes
    useEffect(() => {
        if(comparisonLocation) {
            generateComparison(comparisonLocation);
        }
    }, [comparisonLocation]);


    const handleRandomLocation = () => {
        const randomLoc = getRandomLocation();
        setComparisonLocation(randomLoc);
        setLocationName(`Lat: ${randomLoc.lat.toFixed(2)}, Lon: ${randomLoc.lon.toFixed(2)}`);
    }

    const renderContent = () => {
        if (isPending || (!beforeImageUrl && !afterImageUrl && !imageError)) {
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

        if (imageError || !beforeImageUrl || !afterImageUrl || !beforeDate) {
            return (
                <div className="flex flex-col items-center justify-center text-center gap-4 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12" />
                    <p>Could not load satellite imagery for this location.</p>
                     <p className="text-sm">This can happen for areas with no recent cloud-free imagery, like polar regions.</p>
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
                            onError={() => setImageError(true)}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Now</CardTitle>
                        <CardDescription>{format(recentDate, 'MMMM dd, yyyy')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Image
                            src={afterImageUrl}
                            alt="Satellite image from today"
                            width={600}
                            height={600}
                            className="rounded-lg object-cover aspect-square bg-muted"
                            unoptimized
                            onError={() => setImageError(true)}
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
                    <Button onClick={() => generateComparison(comparisonLocation)} disabled={isPending || !comparisonLocation}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={handleRandomLocation} variant="outline" disabled={isPending}>
                        <Globe className="mr-2 h-4 w-4" />
                        Another Location
                    </Button>
                </div>
            </div>
            {renderContent()}
        </div>
    );
}
