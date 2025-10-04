'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useLocation } from '@/hooks/use-location';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';

function getGIBSEarthImageUrl(date: Date, lat: number, lon: number): string {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const boundingBox = [lon - 1, lat - 1, lon + 1, lat + 1].join(',');

    // Using NASA GIBS Blue Marble layer for a visually clear before/after
    const layer = 'BlueMarble_Shaded_Relief_Bathymetry';

    return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${formattedDate}/GoogleMapsCompatible_Level8/${Math.floor(8 - Math.log2(2))}/${Math.floor(lat / 2)}/${Math.floor(lon / 2)}.jpeg`;
}

export default function ComparePage() {
    const { location, isLocating, error: locationError } = useLocation();
    const [beforeImageUrl, setBeforeImageUrl] = useState<string | null>(null);
    const [afterImageUrl, setAfterImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const today = new Date();
    const oneYearAgo = new Date(new Date().setFullYear(today.getFullYear() - 1));

    useEffect(() => {
        if (location && !isLocating) {
            setIsLoading(true);
            try {
                // Generate URLs for NASA GIBS imagery
                const afterUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${format(today, 'yyyy-MM-dd')}/GoogleMapsCompatible_Level6/5/19/25.jpg`;
                const beforeUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${format(oneYearAgo, 'yyyy-MM-dd')}/GoogleMapsCompatible_Level6/5/19/25.jpg`;
                
                setAfterImageUrl(afterUrl);
                setBeforeImageUrl(beforeUrl);
            } catch (e) {
                console.error("Error generating image URLs", e);
            } finally {
                setIsLoading(false);
            }
        }
    }, [location, isLocating, today, oneYearAgo]);

    const renderContent = () => {
        if (isLocating || isLoading) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-[400px] w-full" />
                    <Skeleton className="h-[400px] w-full" />
                </div>
            );
        }

        if (locationError) {
            return (
                <div className="flex flex-col items-center justify-center text-center gap-4 text-destructive">
                    <AlertTriangle className="h-12 w-12" />
                    <p className="font-semibold">Could not load location data.</p>
                    <p>{locationError}</p>
                </div>
            );
        }

        if (!beforeImageUrl || !afterImageUrl) {
            return (
                <div className="flex flex-col items-center justify-center text-center gap-4 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12" />
                    <p>Could not load satellite imagery for this location.</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>One Year Ago</CardTitle>
                        <CardDescription>{format(oneYearAgo, 'MMMM dd, yyyy')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Image
                            src={beforeImageUrl}
                            alt="Satellite image from one year ago"
                            width={600}
                            height={600}
                            className="rounded-lg object-cover"
                            unoptimized // Required for NASA GIBS which doesn't support optimization
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Today</CardTitle>
                        <CardDescription>{format(today, 'MMMM dd, yyyy')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Image
                            src={afterImageUrl}
                            alt="Satellite image from today"
                            width={600}
                            height={600}
                            className="rounded-lg object-cover"
                            unoptimized // Required for NASA GIBS which doesn't support optimization
                        />
                    </CardContent>
                </Card>
            </div>
        );
    };

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="grid gap-4">
                <h1 className="font-semibold text-3xl">Climate Comparison</h1>
                <p className="text-muted-foreground">
                    Satellite imagery comparison for your location, one year apart. Data provided by NASA GIBS.
                </p>
            </div>
            {renderContent()}
        </div>
    );
}
