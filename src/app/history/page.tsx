'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LineChart } from 'lucide-react';

export default function HistoryPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="grid gap-4">
        <h1 className="font-semibold text-3xl">History</h1>
        <p className="text-muted-foreground">
          Explore historical trends for your location. This feature is coming soon.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historical Data</CardTitle>
          <CardDescription>
            Detailed charts and analysis of past environmental conditions will be available here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
            <div className="p-4 bg-muted rounded-full">
                <LineChart className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Historical data charts are under construction.</p>
        </CardContent>
      </Card>
    </div>
  );
}
