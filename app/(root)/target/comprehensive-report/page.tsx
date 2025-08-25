'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { IconCalendar, IconRefresh, IconDownload, IconFileText, IconPrinter } from '@tabler/icons-react';
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

  // Add print stylesheet
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        .no-print { display: none !important; }
        .print-break { page-break-before: always; }
        body { margin: 0; padding: 20px; }
        .container { max-width: none; }
        .card { border: none; box-shadow: none; }
        .card-header, .card-content { padding: 0; }
        table { font-size: 10px; }
        th, td { padding: 4px; }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
      'Base Target',
      'Hours',
      'Total Targets',
      'Entries',
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
        row.baseTarget,
        row.hours,
        row.totalTargets,
        row.targetEntries,
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

  const handlePrint = () => {
    if (!reportData.length) {
      toast.error('No data to print');
      return;
    }
    window.print();
    toast.success('Print dialog opened');
  };

  const handlePDFExport = () => {
    if (!reportData.length) {
      toast.error('No data to export');
      return;
    }

    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked. Please allow popups for this site.');
      return;
    }

    // Generate HTML content for PDF
    const htmlContent = generatePDFContent();
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
    
    toast.success('PDF export initiated');
  };

  const generatePDFContent = () => {
    const dateStr = format(date, 'MMMM dd, yyyy');
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comprehensive Target Report - ${dateStr}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
            .summary-card { border: 1px solid #ddd; padding: 15px; text-align: center; }
            .summary-value { font-size: 24px; font-weight: bold; color: #2563eb; }
            .summary-label { font-size: 14px; color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .totals-row { background-color: #f8f9fa; font-weight: bold; }
            .time-slot { background-color: #e5f3ff; }
            @media print { body { margin: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Comprehensive Target Report</h1>
            <h2>${dateStr}</h2>
          </div>
          
          <div class="summary">
            <div class="summary-card">
              <div class="summary-value">${summary?.totalLines || 0}</div>
              <div class="summary-label">Active Lines</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">${(summary?.totalTarget || 0).toLocaleString()}</div>
              <div class="summary-label">Total Target</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">${(summary?.totalProduction || 0).toLocaleString()}</div>
              <div class="summary-label">Total Production</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">${summary?.totalConsolidatedEntries || 0}</div>
              <div class="summary-label">Consolidated Rows</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">${summary?.totalOriginalEntries || 0}</div>
              <div class="summary-label">Original Entries</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">${(summary?.averageProductionPerHour || 0).toFixed(0)}</div>
              <div class="summary-label">Avg Production/Hour</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Line</th>
                <th>Style</th>
                <th>Buyer</th>
                <th>Item</th>
                <th>Base Target</th>
                <th>Hours</th>
                <th>Total Targets</th>
                <th>Entries</th>
                ${timeSlotHeaders.map(slot => `<th class="time-slot">${slot}</th>`).join('')}
                <th>Total Production</th>
                <th>Avg/Hour</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.map(row => `
                <tr>
                  <td>${row.lineNo}</td>
                  <td>${row.styleNo}</td>
                  <td>${row.buyer}</td>
                  <td>${row.item}</td>
                  <td>${(row.baseTarget || 0).toLocaleString()}</td>
                  <td>${row.hours}h</td>
                  <td>${(row.totalTargets || 0).toLocaleString()}</td>
                  <td>${row.targetEntries || 0}</td>
                  ${timeSlotHeaders.map(slot => `<td>${(row.hourlyProduction[slot] || 0).toLocaleString()}</td>`).join('')}
                  <td>${(row.totalProduction || 0).toLocaleString()}</td>
                  <td>${(row.averageProductionPerHour || 0).toFixed(0)}</td>
                </tr>
              `).join('')}
              <tr class="totals-row">
                <td colspan="4">TOTALS</td>
                <td>${(reportData.reduce((sum, row) => sum + (row.baseTarget || 0), 0)).toLocaleString()}</td>
                <td>${reportData.reduce((sum, row) => sum + (row.hours || 0), 0)}h</td>
                <td>${(reportData.reduce((sum, row) => sum + (row.totalTargets || 0), 0)).toLocaleString()}</td>
                <td>${reportData.reduce((sum, row) => sum + (row.targetEntries || 0), 0)}</td>
                ${timeSlotHeaders.map(slot => `<td>${(timeSlotTotals[slot] || 0).toLocaleString()}</td>`).join('')}
                <td>${(reportData.reduce((sum, row) => sum + (row.totalProduction || 0), 0)).toLocaleString()}</td>
                <td>${(reportData.reduce((sum, row) => sum + (row.averageProductionPerHour || 0), 0) / reportData.length).toFixed(0)}</td>
              </tr>
            </tbody>
          </table>
          
          <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
            Generated on ${new Date().toLocaleString()}
          </div>
        </body>
      </html>
    `;
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
      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block print:mb-8">
        <div className="text-center border-b-2 border-gray-800 pb-4">
          <h1 className="text-3xl font-bold mb-2">Comprehensive Target Report</h1>
          <h2 className="text-xl text-gray-600">{format(date, 'MMMM dd, yyyy')}</h2>
          <p className="text-sm text-gray-500 mt-2">Generated on {new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
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

          {/* Print Button */}
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <IconPrinter className="h-4 w-4" />
            Print
          </Button>

          {/* PDF Export Button */}
          <Button onClick={handlePDFExport} className="flex items-center gap-2">
            <IconFileText className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-6">
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
                Consolidated Rows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {summary.totalConsolidatedEntries || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Original Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-600">
                {summary.totalOriginalEntries || 0}
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
        <div className="no-print">
          <EmailActions
            date={date}
            reportData={reportData}
            summary={summary}
            timeSlotHeaders={timeSlotHeaders}
            timeSlotTotals={timeSlotTotals}
          />
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
            Consolidated view showing targets grouped by line, style, buyer, item, and base target. 
            Multiple entries with same parameters are consolidated into single rows with target × hours calculation.
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
