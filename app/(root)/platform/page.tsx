'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconList, IconTarget, IconChartBar } from '@tabler/icons-react';
import Link from 'next/link';

export default function PlatformPage() {
  const platformItems = [
    {
      title: 'Production List',
      description: 'View and manage production records',
      icon: IconList,
      url: '/production-list',
      color: 'bg-blue-500',
    },
    {
      title: 'Target',
      description: 'Set and monitor production targets',
      icon: IconTarget,
      url: '/target',
      color: 'bg-green-500',
    },
    {
      title: 'Daily Production',
      description: 'Track daily production metrics',
      icon: IconChartBar,
      url: '/daily-production',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Production</h1>
        <p className="text-muted-foreground">
          Manage your production platform and monitor key metrics
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {platformItems.map((item) => (
          <Link key={item.title} href={item.url} className="block">
            <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`p-3 rounded-lg ${item.color} text-white`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Click to access {item.title.toLowerCase()}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
