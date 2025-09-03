'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, TrendingUp, TrendingDown, Package, DollarSign, AlertCircle, RefreshCw, Target, Scissors, FileText, BarChart3, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import { LoadingSection } from '@/components/ui/loading';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { DetailedSummaries } from '@/components/dashboard/detailed-summaries';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCalendarAutoClose } from '@/hooks/use-calendar-auto-close';
import Link from 'next/link';

interface DashboardSummary {
  date: string;
  production: any;
  target: any;
  cashbook: any;
  cutting: any;
  overview: {
    totalProduction: number;
    totalTarget: number;
    targetAchievement: number;
    netCashFlow: number;
    cuttingEfficiency: number;
  };
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const { isCalendarOpen, setIsCalendarOpen } = useCalendarAutoClose();
  
  // Format current date as YYYY-MM-DD in local timezone to avoid timezone issues
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/dashboard/summary?date=${dateString}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const responseData = await response.json();
      if (responseData.success && responseData.data) {
        setDashboardData(responseData.data);
      } else {
        throw new Error(responseData.error || 'Invalid response format');
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    await fetchDashboardData();
    setRetrying(false);
  };

  if (loading) {
    return <LoadingSection text="Loading dashboard data..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button 
              onClick={handleRetry} 
              className="w-full"
              disabled={retrying}
            >
              {retrying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                'Retry'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Production Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Comprehensive overview of production, targets, finances, and cutting operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto justify-start text-left font-normal"
                onClick={() => setIsCalendarOpen(true)}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setIsCalendarOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards data={dashboardData} />

      {/* Detailed Summaries */}
      <DetailedSummaries data={dashboardData} />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Access frequently used features and reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <Link 
              href="/daily-production-report" 
              className="group block"
            >
              <div className="h-16 sm:h-20 flex flex-col items-center justify-center gap-1 sm:gap-2 p-2 sm:p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group-hover:shadow-md">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-medium text-center leading-tight">Daily Production Report</span>
              </div>
            </Link>

            <Link 
              href="/target/comprehensive-report" 
              className="group block"
            >
              <div className="h-16 sm:h-20 flex flex-col items-center justify-center gap-1 sm:gap-2 p-2 sm:p-4 border rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 group-hover:shadow-md">
                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-medium text-center leading-tight">Comprehensive Target Report</span>
              </div>
            </Link>

            <Link 
              href="/cashbook" 
              className="group block"
            >
              <div className="h-16 sm:h-20 flex flex-col items-center justify-center gap-1 sm:gap-2 p-2 sm:p-4 border rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 group-hover:shadow-md">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-medium text-center leading-tight">Cashbook Summary</span>
              </div>
            </Link>

            <Link 
              href="/cutting" 
              className="group block"
            >
              <div className="h-16 sm:h-20 flex flex-col items-center justify-center gap-1 sm:gap-2 p-2 sm:p-4 border rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all duration-200 group-hover:shadow-md">
                <Scissors className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-medium text-center leading-tight">Cutting Department</span>
              </div>
            </Link>

            <Link 
              href="/profit-loss" 
              className="group block col-span-2 sm:col-span-1"
            >
              <div className="h-16 sm:h-20 flex flex-col items-center justify-center gap-1 sm:gap-2 p-2 sm:p-4 border rounded-lg hover:border-red-500 hover:bg-red-50 transition-all duration-200 group-hover:shadow-md">
                <Calculator className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-medium text-center leading-tight">Profit & Loss Statement</span>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
