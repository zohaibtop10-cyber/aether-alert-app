import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { ReactNode } from 'react';

interface InfoCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  description: string;
}

export function InfoCard({ title, value, icon, description }: InfoCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="text-sm font-medium">{title}</div>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
