'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  IconCalendar, 
  IconRefresh
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Filters,
  ProductionReportViewSheet,
  ExportActions,
  EmailActions,
  DataTable,
  NotesSection,
  SummaryCards
} from '@/components/daily-production-report';
import { DailyProductionReport, ProductionSummary, LineSummary } from '@/components/daily-production-report/types';

export default function DailyProductionReportPage() {
  const [reports, setReports] = useState<DailyProductionReport[]>([]);
  const [reportsByLine, setReportsByLine] = useState<Record<string, DailyProductionReport[]>>({});
  const [reportsWithoutLine, setReportsWithoutLine] = useState<DailyProductionReport[]>([]);
  const [lineSummaries, setLineSummaries] = useState<Record<string, LineSummary>>({});
  const [summary, setSummary] = useState<ProductionSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lineFilter, setLineFilter] = useState<string>('all');
  const [styleFilter, setStyleFilter] = useState<string>('');
  const [viewingReport, setViewingReport] = useState<DailyProductionReport | null>(null);
  const [viewingLineNo, setViewingLineNo] = useState<string>('');
  const [emailSending, setEmailSending] = useState(false);
  const isMobile = useIsMobile();

  // Handler for viewing report details
  const handleViewReport = (report: DailyProductionReport, lineNo?: string) => {
    setViewingReport(report);
    setViewingLineNo(lineNo || '');
  };

  // Fetch reports for the selected date
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // Format date as YYYY-MM-DD in local timezone to avoid timezone issues
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      params.set('date', dateString);
      
      // Debug log to verify correct date formatting
      console.log(`📅 Fetching reports for date: ${dateString} (Selected: ${selectedDate.toDateString()})`);
      
      const response = await fetch(`/api/daily-production-report?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('🔍 Raw API response:', data);
      
      if (data.success) {
        console.log('🔍 API data structure:', {
          hasData: !!data.data,
          dataKeys: data.data ? Object.keys(data.data) : [],
          reportsByLine: data.data?.reportsByLine,
          reportsWithoutLine: data.data?.reportsWithoutLine,
          lineSummaries: data.data?.lineSummaries,
          overallSummary: data.data?.overallSummary
        });
        
        setReports(data.data.allReports || []);
        setReportsByLine(data.data.reportsByLine || {});
        setReportsWithoutLine(data.data.reportsWithoutLine || []);
        setLineSummaries(data.data.lineSummaries || {});
        setSummary(data.data.overallSummary || null);
        
        console.log('📊 Reports loaded successfully:', {
          totalReports: data.data.allReports?.length || 0,
          reportsByLine: Object.keys(data.data.reportsByLine || {}).length,
          reportsWithoutLine: data.data.reportsWithoutLine?.length || 0
        });
      } else {
        console.error('❌ API returned error:', data.error);
        toast.error(data.error || 'Failed to fetch reports');
      }
    } catch (error) {
      console.error('❌ Error fetching reports:', error);
      toast.error('Failed to fetch reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Fetch reports on component mount and when date changes
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Get unique lines for filter dropdown
  const uniqueLines = Array.from(new Set(
    reports
      .map(report => report.lineNo)
      .filter(Boolean) as string[]
  )).sort();

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Daily Production Report
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track daily production performance against targets
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal h-9 sm:h-10">
                <IconCalendar className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{format(selectedDate, 'PPP')}</span>
                <span className="sm:hidden">{format(selectedDate, 'MMM dd, yyyy')}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Button
            variant="outline"
            onClick={fetchReports}
            disabled={loading}
            className="w-full sm:w-auto h-9 sm:h-10"
          >
            <IconRefresh className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {isMobile ? 'Refresh' : 'Refresh'}
          </Button>

          <EmailActions
            reportsByLine={reportsByLine}
            reportsWithoutLine={reportsWithoutLine}
            selectedDate={selectedDate}
            loading={loading}
            emailSending={emailSending}
            setEmailSending={setEmailSending}
          />

          <ExportActions
            reportsByLine={reportsByLine}
            reportsWithoutLine={reportsWithoutLine}
            selectedDate={selectedDate}
            loading={loading}
          />
        </div>
      </div>

      {/* Filters */}
      <Filters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        lineFilter={lineFilter}
        setLineFilter={setLineFilter}
        styleFilter={styleFilter}
        setStyleFilter={setStyleFilter}
        uniqueLines={uniqueLines}
        isMobile={isMobile}
      />

      {/* Summary Cards */}
      <SummaryCards summary={summary} />

      {/* Production Reports Data Table */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading reports...</div>
        </div>
      ) : (
        <>
          {/* Show message if no data */}
          {Object.keys(reportsByLine).length === 0 && reportsWithoutLine.length === 0 && !loading && (
            <div className="p-8 text-center">
              <div className="text-lg font-medium text-muted-foreground mb-2">
                No production reports found for {format(selectedDate, 'PPP')}
              </div>
              <div className="text-sm text-muted-foreground">
                Try selecting a different date or check if there are any reports in the database.
              </div>
            </div>
          )}
          
          {/* Only render DataTable if we have data */}
          {(Object.keys(reportsByLine).length > 0 || reportsWithoutLine.length > 0) && (
            <DataTable
              reportsByLine={reportsByLine}
              reportsWithoutLine={reportsWithoutLine}
              lineSummaries={lineSummaries}
              selectedDate={selectedDate}
              searchTerm={searchTerm}
              lineFilter={lineFilter}
              isMobile={isMobile}
              onViewReport={handleViewReport}
            />
          )}
        </>
      )}

      {/* Notes section if any reports have notes */}
      <NotesSection reports={reports} />

      {/* View Sheet */}
      <ProductionReportViewSheet
        report={viewingReport}
        lineNo={viewingLineNo}
        open={!!viewingReport}
        onOpenChange={(open) => {
          if (!open) {
            setViewingReport(null);
            setViewingLineNo('');
          }
        }}
      />
    </div>
  );
}