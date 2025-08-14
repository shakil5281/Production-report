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

interface ComprehensiveTargetData {
  id: string;
  lineNo: string;
  lineName: string;
  styleNo: string;
  buyer: string;
  item: string;
  lineTarget: number;
  totalTarget: number;
  timeSlots: string[];
  workingHours: number;
  hourlyProduction: Record<string, number>;
  totalProduction: number;
  averageProductionPerHour: number;
  targetCount: number;
  timeSlotHeaders: string[];
}

interface SummaryData {
  totalLines: number;
  totalTarget: number;
  totalProduction: number;
  averageProductionPerHour: number;
  date: string;
}

export default function ComprehensiveTargetReportPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [reportData, setReportData] = useState<ComprehensiveTargetData[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [timeSlotHeaders, setTimeSlotHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      console.log('Fetching comprehensive report for date:', formattedDate);
      
      const response = await fetch(`/api/target/comprehensive-report?date=${formattedDate}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch comprehensive target report');
      }
      
      const data = await response.json();
      console.log('Comprehensive report API response:', data);
      
      if (data.success) {
        setReportData(data.data);
        setSummary(data.summary);
        setTimeSlotHeaders(data.timeSlotHeaders || []);
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
      'Line No',
      'Line Name', 
      'Style No',
      'Buyer',
      'Item',
      'Line Target',
      'Total Target',
      
      'Working Hours',
      'Target Count',
             ...timeSlotHeaders,
      'Total Production',
      'Average Production/Hour'
    ];

        const csvContent = [
      headers.join(','),
      ...reportData.map(row => [
        row.lineNo,
        row.lineName,
        row.styleNo,
        row.buyer,
        row.item,
        row.lineTarget,
        row.totalTarget,
        
        row.workingHours,
        row.targetCount || 1,
        ...timeSlotHeaders.map(timeSlot => row.hourlyProduction[timeSlot] || 0),
        row.totalProduction,
        row.averageProductionPerHour.toFixed(2)
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
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Comprehensive Target Report</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-4">
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comprehensive Target Report</h1>
                     <p className="text-muted-foreground">
             View all target details with actual hourly production data
           </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date Picker */}
          <Popover>
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
                onSelect={(newDate) => newDate && setDate(newDate)}
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
        <div className="grid gap-6 md:grid-cols-4">
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
                {summary.totalTarget.toLocaleString()}
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
                {summary.totalProduction.toLocaleString()}
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
                {summary.averageProductionPerHour.toFixed(0)}
              </div>
            </CardContent>
          </Card>
        </div>
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
             Comprehensive view of all targets with actual hourly production data
           </CardDescription>
        </CardHeader>
        <CardContent>
          {reportData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">No targets found</p>
              <p className="text-sm">No target data available for the selected date</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700">
                      Line
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700">
                      Style
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700">
                      Buyer
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700">
                      Item
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-center text-sm font-medium text-gray-700">
                      Target
                    </th>
                    
                                         <th className="border border-gray-200 px-3 py-2 text-center text-sm font-medium text-gray-700">
                       Hours
                     </th>
                     <th className="border border-gray-200 px-3 py-2 text-center text-sm font-medium text-gray-700">
                       Targets
                     </th>
                                         {timeSlotHeaders.map((timeSlot, index) => (
                       <th key={index} className="border border-gray-200 px-3 py-2 text-center text-sm font-medium text-gray-700 bg-blue-50">
                         {timeSlot}
                       </th>
                     ))}
                    <th className="border border-gray-200 px-3 py-2 text-center text-sm font-medium text-gray-700 bg-green-50">
                      Total
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-center text-sm font-medium text-gray-700 bg-green-50">
                      Avg/Hour
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, index) => (
                    <tr key={row.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-200 px-3 py-2 text-sm">
                        <div>
                          <div className="font-medium">{row.lineNo}</div>
                          <div className="text-xs text-gray-500">{row.lineName}</div>
                        </div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm font-medium">
                        {row.styleNo}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm">
                        {row.buyer}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm">
                        {row.item}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm text-center font-medium">
                        {row.lineTarget.toLocaleString()}
                      </td>
                      
                                             <td className="border border-gray-200 px-3 py-2 text-sm text-center">
                         {row.workingHours}h
                       </td>
                       <td className="border border-gray-200 px-3 py-2 text-sm text-center">
                         <Badge variant="secondary">{row.targetCount || 1}</Badge>
                       </td>
                      
                      {/* Dynamic Hourly Production Columns */}
                      {timeSlotHeaders.map((timeSlot, index) => (
                        <td key={index} className="border border-gray-200 px-3 py-2 text-sm text-center bg-blue-50">
                          {row.hourlyProduction[timeSlot]?.toLocaleString() || '0'}
                        </td>
                      ))}
                      
                      {/* Totals */}
                      <td className="border border-gray-200 px-3 py-2 text-sm text-center font-medium bg-green-50">
                        {row.totalProduction.toLocaleString()}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm text-center bg-green-50">
                        {row.averageProductionPerHour.toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                
                {/* Footer with Totals */}
                {reportData.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-100 font-medium">
                                             <td className="border border-gray-200 px-3 py-2 text-sm" colSpan={3}>
                         <strong>TOTALS</strong>
                       </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm text-center">
                        {reportData.reduce((sum, row) => sum + row.lineTarget, 0).toLocaleString()}
                      </td>
                                           <td className="border border-gray-200 px-3 py-2 text-sm text-center">
                       -
                     </td>
                     <td className="border border-gray-200 px-3 py-2 text-sm text-center">
                       {reportData.reduce((sum, row) => sum + row.workingHours, 0)}h
                     </td>
                     <td className="border border-gray-200 px-3 py-2 text-sm text-center">
                       {reportData.reduce((sum, row) => sum + (row.targetCount || 1), 0)}
                     </td>
                      
                                             {/* Dynamic Hourly Totals */}
                       {timeSlotHeaders.map((timeSlot, index) => (
                         <td key={index} className="border border-gray-200 px-3 py-2 text-sm text-center bg-blue-100">
                           {reportData.reduce((sum, row) => sum + (row.hourlyProduction[timeSlot] || 0), 0).toLocaleString()}
                         </td>
                       ))}
                      
                      {/* Total Totals */}
                      <td className="border border-gray-200 px-3 py-2 text-sm text-center font-bold bg-green-100">
                        {reportData.reduce((sum, row) => sum + row.totalProduction, 0).toLocaleString()}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm text-center bg-green-100">
                        {reportData.length > 0 
                          ? (reportData.reduce((sum, row) => sum + row.averageProductionPerHour, 0) / reportData.length).toFixed(0)
                          : '0'
                        }
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
