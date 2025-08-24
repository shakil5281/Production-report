'use client';

import { useCallback, useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  IconTrendingUp, IconTrendingDown, IconCurrencyTaka, IconReceiptTax,
  IconChartBar, IconCalendarStats, IconRefresh, IconDownload,
  IconFileText, IconFileSpreadsheet, IconPrinter, IconEqual
} from '@tabler/icons-react';
import { toast } from 'sonner';
import ExportActions from '@/components/profit-loss/export-actions';

interface DailyBreakdown {
  date: string;
  earnings: number;
  dailySalary: number;
  dailyOvertime: number;
  dailyCashExpenses: number;
  netProfit: number;
}

interface LineBreakdown {
  sectionId: string;
  sectionName: string;
  earnings: number;
  dailySalary: number;
  dailyOvertime: number;
  netProfit: number;
}

interface ProfitLossData {
  period: { month: string; startDate: string; endDate: string; };
  summary: {
    totalEarnings: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    breakdown: { dailySalary: number; dailyOvertime: number; dailyCashExpenses: number; };
  };
  dailyBreakdown: DailyBreakdown[];
  lineBreakdown: LineBreakdown[];
  topPerformingLines: LineBreakdown[];
  worstPerformingLines: LineBreakdown[];
}

export default function ProfitLossPage() {
  const [data, setData] = useState<ProfitLossData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/profit-loss?month=${selectedMonth}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching profit and loss data:', error);
      toast.error('Failed to fetch profit and loss data');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getNetProfitColor = (amount: number) => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getNetProfitIcon = (amount: number) => {
    if (amount > 0) return <IconTrendingUp className="h-4 w-4" />;
    if (amount < 0) return <IconTrendingDown className="h-4 w-4" />;
    return <IconEqual className="h-4 w-4" />;
  };

  if (loading) {
    return <div className="text-center py-8"><div className="text-muted-foreground">Loading...</div></div>;
  }

  if (!data) {
    return <div className="text-center py-8"><div className="text-muted-foreground">No data available</div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Profit & Loss Statement</h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Comprehensive financial overview of earnings and expenses
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">Current Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {selectedPeriod === 'custom' && (
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-40"
            />
          )}
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <IconRefresh className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Export Actions */}
      <ExportActions data={data} />

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <IconCurrencyTaka className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ৳{data.summary.totalEarnings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From Daily Production</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <IconReceiptTax className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ৳{data.summary.totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Salary + Overtime + Cash</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            {getNetProfitIcon(data.summary.netProfit)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getNetProfitColor(data.summary.netProfit)}`}>
              ৳{data.summary.netProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.summary.profitMargin.toFixed(2)}% margin
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Days</CardTitle>
            <IconCalendarStats className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.dailyBreakdown.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Days with transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">Daily Breakdown</TabsTrigger>
          <TabsTrigger value="lines">Line Performance</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Profit & Loss Breakdown</CardTitle>
              <CardDescription>Day-by-day breakdown of earnings, expenses, and net profit</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Earnings</TableHead>
                    <TableHead className="text-right">Daily Salary</TableHead>
                    <TableHead className="text-right">Daily Overtime</TableHead>
                    <TableHead className="text-right">Cash Expenses</TableHead>
                    <TableHead className="text-right">Net Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.dailyBreakdown.map((day) => (
                    <TableRow key={day.date}>
                      <TableCell className="font-medium">
                        {format(parseISO(day.date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        ৳{day.earnings.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        ৳{day.dailySalary.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        ৳{day.dailyOvertime.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        ৳{day.dailyCashExpenses.toLocaleString()}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${getNetProfitColor(day.netProfit)}`}>
                        ৳{day.netProfit.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Production Line Performance</CardTitle>
              <CardDescription>Profit and loss breakdown by production line</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Section</TableHead>
                    <TableHead className="text-right">Earnings</TableHead>
                    <TableHead className="text-right">Daily Salary</TableHead>
                    <TableHead className="text-right">Daily Overtime</TableHead>
                    <TableHead className="text-right">Net Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.lineBreakdown.map((line) => (
                    <TableRow key={line.sectionId}>
                      <TableCell className="font-medium">{line.sectionName}</TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        ৳{line.earnings.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        ৳{line.dailySalary.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        ৳{line.dailyOvertime.toLocaleString()}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${getNetProfitColor(line.netProfit)}`}>
                        ৳{line.netProfit.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTrendingUp className="h-5 w-5 text-green-600" />
                  Top Performing Lines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topPerformingLines.map((line, index) => (
                    <div key={line.sectionId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {index + 1}. {line.sectionName}
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          ৳{line.netProfit.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Earnings: ৳{line.earnings.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTrendingDown className="h-5 w-5 text-red-600" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.worstPerformingLines.map((line, index) => (
                    <div key={line.sectionId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {index + 1}. {line.sectionName}
                        </span>
                        <span className={`text-sm font-bold ${getNetProfitColor(line.netProfit)}`}>
                          ৳{line.netProfit.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Earnings: ৳{line.earnings.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
