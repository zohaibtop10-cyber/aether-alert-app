'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Newspaper } from 'lucide-react';

export default function ArticlesPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="grid gap-4">
        <h1 className="font-semibold text-3xl">Articles</h1>
        <p className="text-muted-foreground">
          Read articles from the community. This feature is coming soon.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Community Articles</CardTitle>
          <CardDescription>
            In-depth articles and research from community members will be available here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
          <div className="p-4 bg-muted rounded-full">
            <Newspaper className="h-12 w-12 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">The articles section is under construction.</p>
        </CardContent>
      </Card>
    </div>
  );
}
