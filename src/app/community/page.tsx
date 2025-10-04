'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function CommunityPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="grid gap-4">
        <h1 className="font-semibold text-3xl">Community</h1>
        <p className="text-muted-foreground">
          Engage with the MyClimateGuard community.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome to the Community Hub</CardTitle>
          <CardDescription>
            Explore blog posts, articles, and shared data from fellow climate warriors.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
            <div className="p-4 bg-muted rounded-full">
                <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Select a section from the sidebar to get started.</p>
        </CardContent>
      </Card>
    </div>
  );
}
