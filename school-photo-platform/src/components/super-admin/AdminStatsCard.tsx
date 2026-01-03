import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type AdminStatsCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  color?:  string;
  bgColor?: string;
  iconBgColor?: string;
};

export default function AdminStatsCard({
  title,
  value,
  icon:  Icon,
  description,
  color = 'text-blue-600',
  bgColor = 'bg-blue-50',
  iconBgColor = 'bg-blue-100',
}: AdminStatsCardProps) {
  return (
    <Card className={cn('shadow-lg border-0', bgColor)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-700">
          {title}
        </CardTitle>
        <div className={cn('p-2 rounded-lg', iconBgColor)}>
          <Icon className={cn('w-5 h-5', color)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn('text-3xl font-bold', color)}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-slate-600 mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}