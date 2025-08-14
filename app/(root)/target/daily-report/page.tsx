'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { IconCalendar, IconDownload, IconTarget, IconChartBar } from '@tabler/icons-react';
import { format } from 'date-fns';
import { DailyTargetReportTable } from '@/components/target/daily-target-report-table';
import { DailyTargetSummary } from '@/components/target/daily-target-summary';
import { toast } from 'sonner';
import { DailyTargetData } from '@/components/target/types';

export default function DailyTargetReportPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reportData, setReportData] = useState<DailyTargetData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDailyTargetReport = useCallback(async (date: Date) => {
    setLoading(true);
    setError(null);
    
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      console.log('Frontend: Fetching report for date:', formattedDate);
      console.log('Frontend: Original date object:', date);
      console.log('Frontend: Date ISO string:', date.toISOString());
      
      const response = await fetch(`/api/target/daily-report?date=${formattedDate}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch daily target report');
      }
      
      const data = await response.json();
      console.log('Frontend: API response:', data);
      
      if (data.success) {
        setReportData(data.data);
        console.log('Frontend: Set report data:', data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch report data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('Frontend: Error fetching report:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDailyTargetReport(selectedDate);
  }, [selectedDate, fetchDailyTargetReport]);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleExportReport = () => {
    // TODO: Implement export functionality
    toast.info('Export functionality coming soon');
  };

  const handleRefresh = () => {
    fetchDailyTargetReport(selectedDate);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Daily Target Report</h1>
          <p className="text-muted-foreground">
            Comprehensive daily production targets and actual production data with hourly breakdowns
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <IconCalendar className="h-4 w-4" />
                {format(selectedDate, 'MMM dd, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Refresh Button */}
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <IconChartBar className="h-4 w-4" />
            Refresh
          </Button>

          {/* Export Button */}
          <Button onClick={handleExportReport} disabled={loading || reportData.length === 0}>
            <IconDownload className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="ml-auto text-red-700 hover:text-red-800"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      <DailyTargetSummary data={reportData} selectedDate={selectedDate} />

      {/* Main Report Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconTarget className="h-5 w-5" />
            Daily Target Report - {format(selectedDate, 'MMMM dd, yyyy')}
            {loading && <span className="text-sm text-muted-foreground">(Loading...)</span>}
          </CardTitle>
          <CardDescription>
            Detailed breakdown of production targets vs actual production for each line, style, and hour
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DailyTargetReportTable 
            data={reportData} 
            loading={loading}
            selectedDate={selectedDate}
          />
        </CardContent>
      </Card>
    </div>
  );
}
