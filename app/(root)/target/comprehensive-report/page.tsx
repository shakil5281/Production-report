'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { IconCalendar, IconRefresh, IconDownload } from '@tabler/icons-react';
import { toast } from 'sonner';
import { ComprehensiveDataTable } from '@/components/target/comprehensive-data-table';
import { EmailActions } from '@/components/target/email-actions';
import { ComprehensiveTargetData, SummaryData, ComprehensiveReportResponse } from '@/components/target/types';
import { useCalendarAutoClose } from '@/hooks/use-calendar-auto-close';

export default function ComprehensiveTargetReportPage() {
  const { isCalendarOpen, setIsCalendarOpen } = useCalendarAutoClose();
  
  const [date, setDate] = useState(new Date());
  const [reportData, setReportData] = useState<ComprehensiveTargetData[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [timeSlotHeaders, setTimeSlotHeaders] = useState<string[]>([]);
  const [timeSlotTotals, setTimeSlotTotals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Format date as YYYY-MM-DD in local timezone to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      // Debug log to verify correct date formatting
      console.log(`📅 Fetching comprehensive report for date: ${formattedDate} (Selected: ${date.toDateString()})`);
      
      const response = await fetch(`/api/target/comprehensive-report?date=${formattedDate}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch comprehensive target report');
      }
      
      const data: ComprehensiveReportResponse = await response.json();
      // console.log('Comprehensive report API response:', data);
      
      if (data.success) {
        setReportData(data.data);
        setSummary(data.summary);
        setTimeSlotHeaders(data.timeSlotHeaders || []);
        setTimeSlotTotals(data.timeSlotTotals || {});
        console.log('Set comprehensive report data:', data.data);
        console.log('Time slot headers:', data.timeSlotHeaders);
      } else {
        throw new Error(data.error || 'Failed to fetch report data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('Error fetching comprehensive report:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExport = () => {
    if (!reportData.length) {
      toast.error('No data to export');
      return;
    }

    // Create CSV content with dynamic time slot headers
    const headers = [
      'Line',
      'Style',
      'Buyer',
      'Item',
      'Target',
      'Hours',
      'Total Targets',
      ...timeSlotHeaders,
      'Total Production',
      'Avg/Hour'
    ];

    const csvContent = [
      headers.join(','),
      ...reportData.map(row => [
        row.lineNo,
        row.styleNo,
        row.buyer,
        row.item,
        row.target,
        row.hours,
        row.totalTargets,
        ...timeSlotHeaders.map(timeSlot => row.hourlyProduction[timeSlot] || 0),
        row.totalProduction,
        row.averageProductionPerHour.toFixed(0)
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprehensive-target-report-${format(date, 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Report exported successfully');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Comprehensive Target Report</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Comprehensive Target Report</h1>
          <p className="text-muted-foreground">
            View all target details with actual hourly production data
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* Date Picker */}
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <IconCalendar className="h-4 w-4" />
                {format(date, 'MMM dd, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  if (newDate) {
                    setDate(newDate);
                    setIsCalendarOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Refresh Button */}
          <Button onClick={fetchReport} variant="outline" size="icon">
            <IconRefresh className="h-4 w-4" />
          </Button>

          {/* Export Button */}
          <Button onClick={handleExport} className="flex items-center gap-2">
            <IconDownload className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Lines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalLines}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Target
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {(summary?.totalTarget || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Production
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {(summary?.totalProduction || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Production/Hour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {(summary?.averageProductionPerHour || 0).toFixed(0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Email Actions */}
      {summary && reportData.length > 0 && (
        <EmailActions
          date={date}
          reportData={reportData}
          summary={summary}
          timeSlotHeaders={timeSlotHeaders}
          timeSlotTotals={timeSlotTotals}
        />
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-600 text-center">
              <p className="font-medium">Error loading report</p>
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>Target Details Report</CardTitle>
          <CardDescription>
            Comprehensive view showing fixed targets with actual hourly production tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ComprehensiveDataTable 
            data={reportData}
            timeSlotHeaders={timeSlotHeaders}
            timeSlotTotals={timeSlotTotals}
          />
        </CardContent>
      </Card>
    </div>
  );
}
