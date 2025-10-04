'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Database } from 'lucide-react';

export default function DataPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="grid gap-4">
        <h1 className="font-semibold text-3xl">Community Data</h1>
        <p className="text-muted-foreground">
          Access shared datasets from the community. This feature is coming soon.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shared Datasets</CardTitle>
          <CardDescription>
            Public datasets and data sources shared by the community will be available here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
            <div className="p-4 bg-muted rounded-full">
                <Database className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">The shared data section is under construction.</p>
        </CardContent>
      </Card>
    </div>
  );
}
