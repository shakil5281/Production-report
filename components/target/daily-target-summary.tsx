'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconTarget, IconChartBar, IconTrendingUp, IconClock } from '@tabler/icons-react';
import { format } from 'date-fns';

import { DailyTargetSummaryProps } from './types';

export function DailyTargetSummary({ data, selectedDate }: DailyTargetSummaryProps) {
  // Calculate summary statistics
  const totalLines = data.length;
  const totalTarget = data.reduce((sum, item) => sum + item.totalTarget, 0);
  const totalProduction = data.reduce((sum, item) => sum + item.totalProduction, 0);
  const averageProductionPerHour = data.length > 0 
    ? data.reduce((sum, item) => sum + item.averageProductionPerHour, 0) / data.length 
    : 0;

  // Calculate total production for each hour
  const hourlyTotals = {
    '8-9': data.reduce((sum, item) => sum + item.hourlyProduction['8-9'], 0),
    '9-10': data.reduce((sum, item) => sum + item.hourlyProduction['9-10'], 0),
    '10-11': data.reduce((sum, item) => sum + item.hourlyProduction['10-11'], 0),
    '11-12': data.reduce((sum, item) => sum + item.hourlyProduction['11-12'], 0),
    '12-1': data.reduce((sum, item) => sum + item.hourlyProduction['12-1'], 0),
    '1-2': data.reduce((sum, item) => sum + item.hourlyProduction['1-2'], 0),
    '2-3': data.reduce((sum, item) => sum + item.hourlyProduction['2-3'], 0),
    '3-4': data.reduce((sum, item) => sum + item.hourlyProduction['3-4'], 0),
    '4-5': data.reduce((sum, item) => sum + item.hourlyProduction['4-5'], 0),
    '5-6': data.reduce((sum, item) => sum + item.hourlyProduction['5-6'], 0),
    '6-7': data.reduce((sum, item) => sum + item.hourlyProduction['6-7'], 0),
    '7-8': data.reduce((sum, item) => sum + item.hourlyProduction['7-8'], 0),
  };

  const totalHourlyProduction = Object.values(hourlyTotals).reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-4">
      {/* Main Summary Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Lines</CardTitle>
            <IconTarget className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{totalLines}</div>
            <p className="text-xs text-muted-foreground">
              Production lines
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Target</CardTitle>
            <IconChartBar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              {totalTarget.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Combined targets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Production</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              {totalProduction.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Actual production
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg/Hour</CardTitle>
            <IconClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              {averageProductionPerHour.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average per hour
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Production Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hourly Production Summary - {format(selectedDate, 'MMM dd, yyyy')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-6 md:grid-cols-12">
            {Object.entries(hourlyTotals).map(([hour, production]) => (
              <div key={hour} className="text-center">
                <div className="text-sm font-medium text-muted-foreground">{hour}</div>
                <div className="text-lg font-bold">{production.toLocaleString()}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Total Hourly Production:</span>
              <span className="text-lg font-bold">{totalHourlyProduction.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
