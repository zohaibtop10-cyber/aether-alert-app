'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Bell } from 'lucide-react';

export default function AlertsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="grid gap-4">
        <h1 className="font-semibold text-3xl">Alerts</h1>
        <p className="text-muted-foreground">
          View a history of your personalized health and environmental alerts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>No Alerts Yet</CardTitle>
          <CardDescription>
            When important environmental events happen, your alerts will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
            <div className="p-4 bg-muted rounded-full">
                <Bell className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">You haven&apos;t received any alerts.</p>
        </CardContent>
      </Card>
    </div>
  );
}
