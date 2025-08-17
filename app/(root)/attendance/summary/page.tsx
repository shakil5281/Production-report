'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Users, TrendingUp, Building, Clock, BarChart3, Trash2, Eye, AlertTriangle, RefreshCw, Database, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ManpowerRecord {
  id: string;
  date: string;
  section: string;
  subsection?: string;
  lineNumber?: string;
  itemType: 'SECTION' | 'SUBSECTION' | 'LINE' | 'TOTAL';
  present: number;
  absent: number;
  leave: number;
  others: number;
  total: number;
  remarks?: string;
}

interface SummaryData {
  records: Record<string, ManpowerRecord[]>;
  summary: {
    totalPresent: number;
    totalAbsent: number;
    totalLeave: number;
    totalOthers: number;
    grandTotal: number;
    attendanceRate: number;
    dates: number;
    sections: number;
  };
}

interface AvailableDate {
  date: string;
  totalRecords: number;
  totalPresent: number;
  totalAbsent: number;
  totalLeave: number;
  totalOthers: number;
  grandTotal: number;
  sectionsCount: number;
  attendanceRate: number;
}

interface DetailedData {
  records: ManpowerRecord[];
  summary: {
    totalRecords: number;
    totalDates: number;
    totalSections: number;
    totalPresent: number;
    totalAbsent: number;
    totalLeave: number;
    totalOthers: number;
    grandTotal: number;
    attendanceRate: number;
    averagePresent: number;
    averageAbsent: number;
    maxTotal: number;
    minTotal: number;
  };
  sectionBreakdown: Array<{
    section: string;
    recordsCount: number;
    present: number;
    absent: number;
    leave: number;
    others: number;
    total: number;
    attendanceRate: number;
  }>;
}

const getAttendanceRateColor = (rate: number) => {
  if (rate >= 95) return 'text-green-600';
  if (rate >= 90) return 'text-blue-600';
  if (rate >= 80) return 'text-yellow-600';
  if (rate >= 70) return 'text-orange-600';
  return 'text-red-600';
};

const getAttendanceRateBadge = (rate: number) => {
  if (rate >= 95) return 'bg-green-100 text-green-800 border-green-200';
  if (rate >= 90) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (rate >= 80) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (rate >= 70) return 'bg-orange-100 text-orange-800 border-orange-200';
  return 'bg-red-100 text-red-800 border-red-200';
};

const getRowStyle = (itemType: string, section: string) => {
  if (section === 'Grand Total') {
    return 'bg-blue-50 font-bold text-blue-900 border-l-4 border-blue-500';
  }
  
  switch (itemType) {
    case 'SECTION':
      return 'bg-gray-100 font-semibold border-l-4 border-gray-400';
    case 'TOTAL':
      return 'bg-blue-50 font-semibold text-blue-800 border-l-4 border-blue-300';
    case 'SUBSECTION':
      return 'bg-yellow-50 font-medium border-l-4 border-yellow-300';
    case 'LINE':
      return 'text-gray-700 italic border-l-4 border-gray-200';
    default:
      return '';
  }
};

export default function AttendanceSummaryPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [detailedData, setDetailedData] = useState<DetailedData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchSummaryData();
    fetchAvailableDates();
  }, [selectedDate]);

  const fetchSummaryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/attendance/summary?date=${formattedDate}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch summary data');
      }

      const result = await response.json();
      if (result.success) {
        setSummaryData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch summary data');
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDates = async () => {
    try {
      const response = await fetch('/api/attendance/manpower-delete');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAvailableDates(result.data.availableDates || []);
        }
      }
    } catch (err) {
      console.error('Error fetching available dates:', err);
    }
  };

  const fetchDetailedData = async () => {
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      console.log('🔍 Fetching detailed data for date:', formattedDate);
      
      const response = await fetch(`/api/attendance/manpower-details?date=${formattedDate}`);
      console.log('📡 API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`Failed to fetch detailed data: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('📊 API Result:', result);
      
      if (result.success) {
        console.log('✅ Setting detailed data:', result.data);
        setDetailedData(result.data);
        setShowDetails(true);
        toast.success('Detailed data loaded successfully!');
      } else {
        console.error('❌ API returned error:', result.error);
        throw new Error(result.error || 'Failed to fetch detailed data');
      }
    } catch (err) {
      console.error('💥 Error fetching detailed data:', err);
      toast.error(`Failed to fetch detailed data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      const response = await fetch(`/api/attendance/manpower-delete?date=${formattedDate}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
        // Refresh data
        fetchSummaryData();
        fetchAvailableDates();
      } else {
        toast.error(result.error || 'Failed to delete data');
      }
    } catch (err) {
      console.error('Error deleting data:', err);
      toast.error('Failed to delete data');
    } finally {
      setDeleteLoading(false);
    }
  };

  const selectedDateData = summaryData?.records[format(selectedDate, 'yyyy-MM-dd')] || [];
  const hasDataForSelectedDate = selectedDateData.length > 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8 text-primary" />
            Manpower Summary Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            View, analyze, and manage daily manpower attendance data
          </p>
        </div>
      </div>

      {/* Quick Actions & Date Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Date Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Select Date to View/Manage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="space-y-2">
                <Label>Choose Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[280px] justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(newDate) => newDate && setSelectedDate(newDate)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={fetchSummaryData} 
                  disabled={loading}
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {loading ? 'Loading...' : 'Refresh'}
                </Button>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2">
              {loading && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-sm">Loading data...</span>
                </div>
              )}
              {!loading && hasDataForSelectedDate && (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                  <span className="text-sm">Data available for this date</span>
                </div>
              )}
              {!loading && !hasDataForSelectedDate && (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                  <span className="text-sm">No data available for this date</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={fetchDetailedData} 
              disabled={loading || !hasDataForSelectedDate}
              className="w-full"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Detailed Analysis
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  disabled={loading || !hasDataForSelectedDate || deleteLoading}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteLoading ? 'Deleting...' : 'Delete Data'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Confirm Delete
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete ALL manpower data for{' '}
                    <strong>{format(selectedDate, "MMMM dd, yyyy")}</strong>.
                    <br /><br />
                    This action cannot be undone. Are you sure you want to continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete} 
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Yes, Delete All Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {!hasDataForSelectedDate && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  No data found for selected date. Import manpower data first.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      {summaryData && hasDataForSelectedDate && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Present</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summaryData.summary.totalPresent}
              </div>
              <p className="text-xs text-muted-foreground">
                People at work today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Absent</CardTitle>
              <Users className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {summaryData.summary.totalAbsent}
              </div>
              <p className="text-xs text-muted-foreground">
                People not at work
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Grand Total</CardTitle>
              <Building className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {summaryData.summary.grandTotal}
              </div>
              <p className="text-xs text-muted-foreground">
                Total workforce
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getAttendanceRateColor(summaryData.summary.attendanceRate)}`}>
                {summaryData.summary.attendanceRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                Overall performance
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Manpower Breakdown - {format(selectedDate, "MMMM dd, yyyy")}
            </span>
            {hasDataForSelectedDate && (
              <Badge variant="secondary">
                {selectedDateData.length} records
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Loading manpower data...</p>
              </div>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Error loading data: {error}
              </AlertDescription>
            </Alert>
          ) : !hasDataForSelectedDate ? (
            <div className="text-center py-12 space-y-4">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                <Database className="h-12 w-12 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">No Data Available</h3>
                <p className="text-muted-foreground">
                  No manpower data found for {format(selectedDate, "MMMM dd, yyyy")}.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Import manpower data first using the "Manpower Summary Import" feature.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Section/Line</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                    <TableHead className="text-center">Absent</TableHead>
                    <TableHead className="text-center">Leave</TableHead>
                    <TableHead className="text-center">Others</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedDateData.map((record) => {
                    const displayName = record.lineNumber 
                      ? `${record.lineNumber}(${record.subsection})`
                      : record.subsection 
                        ? record.subsection
                        : record.section;

                    return (
                      <TableRow 
                        key={record.id} 
                        className={getRowStyle(record.itemType, record.section)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {record.itemType === 'LINE' && (
                              <span className="text-gray-400">└─</span>
                            )}
                            {record.itemType === 'SUBSECTION' && (
                              <span className="text-gray-400">├─</span>
                            )}
                            {record.itemType === 'TOTAL' && record.section !== 'Grand Total' && (
                              <span className="text-blue-600 font-bold">∑</span>
                            )}
                            {record.section === 'Grand Total' && (
                              <span className="text-blue-600 font-bold">🏆</span>
                            )}
                            <span>{displayName}</span>
                            <Badge variant="outline" className="text-xs ml-2">
                              {record.itemType}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-green-600 font-medium">
                          {record.present}
                        </TableCell>
                        <TableCell className="text-center text-red-600 font-medium">
                          {record.absent}
                        </TableCell>
                        <TableCell className="text-center text-blue-600 font-medium">
                          {record.leave}
                        </TableCell>
                        <TableCell className="text-center text-orange-600 font-medium">
                          {record.others}
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {record.total}
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {record.remarks || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Dates Overview */}
      {availableDates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Available Dates ({availableDates.length} dates with data)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {availableDates.slice(0, 8).map((dateInfo) => (
                <Card 
                  key={dateInfo.date} 
                  className={cn(
                    "cursor-pointer hover:shadow-md transition-all",
                    format(new Date(dateInfo.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') 
                      ? "ring-2 ring-primary shadow-md" 
                      : ""
                  )}
                  onClick={() => setSelectedDate(new Date(dateInfo.date))}
                >
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          {format(new Date(dateInfo.date), "MMM dd, yyyy")}
                        </span>
                        <Badge 
                          className={getAttendanceRateBadge(dateInfo.attendanceRate)}
                        >
                          {dateInfo.attendanceRate}%
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Present:</span>
                          <span className="text-green-600 font-medium">{dateInfo.totalPresent}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total:</span>
                          <span className="font-medium">{dateInfo.grandTotal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sections:</span>
                          <span>{dateInfo.sectionsCount}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {availableDates.length > 8 && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                Showing 8 of {availableDates.length} available dates. Use date picker to select specific dates.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detailed View Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Detailed Analysis - {format(selectedDate, "MMMM dd, yyyy")}
            </DialogTitle>
          </DialogHeader>
          
          {detailedData ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className="text-2xl font-bold">{detailedData.summary.totalRecords}</div>
                    <p className="text-sm text-muted-foreground">Total Records</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{detailedData.summary.totalPresent}</div>
                    <p className="text-sm text-muted-foreground">Total Present</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{detailedData.summary.totalAbsent}</div>
                    <p className="text-sm text-muted-foreground">Total Absent</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className="text-2xl font-bold">{detailedData.summary.attendanceRate}%</div>
                    <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  </CardContent>
                </Card>
              </div>

              {/* Section Breakdown */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Section Performance</h3>
                {detailedData.sectionBreakdown && detailedData.sectionBreakdown.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Section</TableHead>
                        <TableHead className="text-center">Records</TableHead>
                        <TableHead className="text-center">Present</TableHead>
                        <TableHead className="text-center">Absent</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Performance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailedData.sectionBreakdown.map((section) => (
                        <TableRow key={section.section}>
                          <TableCell className="font-medium">{section.section}</TableCell>
                          <TableCell className="text-center">{section.recordsCount}</TableCell>
                          <TableCell className="text-center text-green-600">{section.present}</TableCell>
                          <TableCell className="text-center text-red-600">{section.absent}</TableCell>
                          <TableCell className="text-center">{section.total}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={getAttendanceRateBadge(section.attendanceRate)}>
                              {section.attendanceRate}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-muted-foreground">No section breakdown data available</p>
                  </div>
                )}
              </div>

              {/* All Records Table */}
              <div>
                <h3 className="text-lg font-semibold mb-3">All Records ({detailedData.records?.length || 0} items)</h3>
                {detailedData.records && detailedData.records.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white">
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Section/Line</TableHead>
                          <TableHead className="text-center">Present</TableHead>
                          <TableHead className="text-center">Absent</TableHead>
                          <TableHead className="text-center">Leave</TableHead>
                          <TableHead className="text-center">Others</TableHead>
                          <TableHead className="text-center">Total</TableHead>
                          <TableHead>Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailedData.records.map((record) => {
                          const displayName = record.lineNumber 
                            ? `${record.lineNumber}(${record.subsection})`
                            : record.subsection 
                              ? record.subsection
                              : record.section;

                          return (
                            <TableRow 
                              key={record.id} 
                              className={getRowStyle(record.itemType, record.section)}
                            >
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {record.itemType}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {record.itemType === 'LINE' && (
                                    <span className="text-gray-400">└─</span>
                                  )}
                                  {record.itemType === 'SUBSECTION' && (
                                    <span className="text-gray-400">├─</span>
                                  )}
                                  {record.itemType === 'TOTAL' && record.section !== 'Grand Total' && (
                                    <span className="text-blue-600 font-bold">∑</span>
                                  )}
                                  {record.section === 'Grand Total' && (
                                    <span className="text-blue-600 font-bold">🏆</span>
                                  )}
                                  <span>{displayName}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-green-600 font-medium">
                                {record.present}
                              </TableCell>
                              <TableCell className="text-center text-red-600 font-medium">
                                {record.absent}
                              </TableCell>
                              <TableCell className="text-center text-blue-600 font-medium">
                                {record.leave}
                              </TableCell>
                              <TableCell className="text-center text-orange-600 font-medium">
                                {record.others}
                              </TableCell>
                              <TableCell className="text-center font-bold">
                                {record.total}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {record.remarks || '-'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Database className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-muted-foreground">No detailed records available</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Loading detailed analysis...</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}