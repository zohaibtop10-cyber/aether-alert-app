'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { GitCompare } from 'lucide-react';

export default function ComparePage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="grid gap-4">
        <h1 className="font-semibold text-3xl">Compare Data</h1>
        <p className="text-muted-foreground">
          Compare environmental data between locations. This feature is coming soon.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comparison Tool</CardTitle>
          <CardDescription>
            Tools to compare historical and real-time data will be available here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
          <div className="p-4 bg-muted rounded-full">
            <GitCompare className="h-12 w-12 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">The data comparison section is under construction.</p>
        </CardContent>
      </Card>
    </div>
  );
}
