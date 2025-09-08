'use client';

import { useCallback, useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  IconTrendingUp, IconTrendingDown, IconCurrencyTaka, IconReceiptTax,
  IconCalendarStats, IconRefresh, IconEqual,
  IconUsers
} from '@tabler/icons-react';
import { toast } from 'sonner';
import ExportActions from '@/components/profit-loss/export-actions';

interface DailyBreakdown {
  date: string;
  earnings: number;
  dailySalary: number; // Daily salary expenses
  dailyCashExpenses: number; // Cashbook expenses
  monthlyExpenses: number; // Daily equivalent of monthly expenses (Others)
  netProfit: number;
  productionCount: number;
  cashExpenseCount: number;
  salaryCount: number;
}

interface LineBreakdown {
  sectionId: string;
  sectionName: string;
  earnings: number;
  monthlyExpenses: number; // Daily equivalent of monthly expenses
  netProfit: number;
  productionCount: number;
}

interface ProfitLossData {
  period: { month: string; startDate: string; endDate: string; };
  summary: {
    totalEarnings: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
         breakdown: { 
       monthlyExpenses: number; 
       dailyEquivalentMonthlyExpenses: number; 
       dailyCashExpenses: number; 
       dailySalary: number;
     };
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
      let monthToFetch = selectedMonth;
      
      // Handle period selection
      if (selectedPeriod === 'current_month') {
        monthToFetch = format(new Date(), 'yyyy-MM');
      } else if (selectedPeriod === 'last_month') {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        monthToFetch = format(lastMonth, 'yyyy-MM');
      }
      // For custom, use selectedMonth as is
      
      const url = `/api/profit-loss?month=${monthToFetch}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch data');
      }
    } catch (error) {
      toast.error('Failed to fetch profit and loss data');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, selectedMonth]);

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

  // Safe number formatting with fallback to 0
  const formatNumber = (value: number | undefined | null): string => {
    const num = Number(value) || 0;
    return Math.round(num).toLocaleString();
  };

  if (loading) {
    return <div className="text-center py-8"><div className="text-muted-foreground">Loading...</div></div>;
  }

  if (!data) {
    return <div className="text-center py-8"><div className="text-muted-foreground">No data available</div></div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Profit & Loss Statement</h1>
          <p className="text-muted-foreground text-xs sm:text-sm lg:text-base">
            Comprehensive financial overview of earnings and expenses
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
          <Select value={selectedPeriod} onValueChange={(value) => {
            setSelectedPeriod(value);
            if (value === 'current_month') {
              setSelectedMonth(format(new Date(), 'yyyy-MM'));
            } else if (value === 'last_month') {
              const lastMonth = new Date();
              lastMonth.setMonth(lastMonth.getMonth() - 1);
              setSelectedMonth(format(lastMonth, 'yyyy-MM'));
            }
          }}>
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
              className="w-full sm:w-40"
            />
          )}
          <Button variant="outline" onClick={fetchData} disabled={loading} className="w-full sm:w-auto">
            <IconRefresh className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Expense Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Breakdown</CardTitle>
          <CardDescription>Detailed breakdown of all expense categories</CardDescription>
        </CardHeader>
                 <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-3">
               <div className="flex items-center justify-between">
                 <span className="text-sm font-medium">Daily Salary Expenses</span>
                 <span className="text-lg font-bold text-purple-600">
                   ৳{formatNumber(data.summary.breakdown.dailySalary)}
                 </span>
               </div>
               <div className="text-xs text-muted-foreground">
                 From Daily Salary Management
               </div>
             </div>
             <div className="space-y-3">
               <div className="flex items-center justify-between">
                 <span className="text-sm font-medium">Cashbook Expenses</span>
                 <span className="text-lg font-bold text-red-600">
                   ৳{formatNumber(data.summary.breakdown.dailyCashExpenses)}
                 </span>
               </div>
               <div className="text-xs text-muted-foreground">
                 Daily operational expenses
               </div>
             </div>
             <div className="space-y-3">
               <div className="flex items-center justify-between">
                 <span className="text-sm font-medium">Others Expense</span>
                 <span className="text-lg font-bold text-orange-600">
                   ৳{formatNumber(data.summary.breakdown.monthlyExpenses)}
                 </span>
               </div>
               <div className="text-xs text-muted-foreground">
                 Fixed monthly costs (rent, utilities, etc.)
               </div>
             </div>
           </div>
         </CardContent>
      </Card>

      {/* Export Actions */}
      <ExportActions data={data} />

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Earnings</CardTitle>
            <IconCurrencyTaka className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-green-600">
              ৳{formatNumber(data.summary.totalEarnings)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From Daily Production</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Expenses</CardTitle>
            <IconReceiptTax className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-red-600">
              ৳{formatNumber(data.summary.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Monthly + Cash Expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Net Profit</CardTitle>
            <div className="h-3 w-3 sm:h-4 sm:w-4">
              {getNetProfitIcon(data.summary.netProfit)}
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-lg sm:text-2xl font-bold ${getNetProfitColor(data.summary.netProfit)}`}>
              ৳{formatNumber(data.summary.netProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Number(data.summary.profitMargin || 0).toFixed(2)}% margin
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Days</CardTitle>
            <IconCalendarStats className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-blue-600">
              {data.dailyBreakdown?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Days with transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Salary Expenses</CardTitle>
            <IconUsers className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-purple-600">
              ৳{formatNumber(data.summary.breakdown.dailySalary)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Daily Salary Management</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="daily" className="text-xs sm:text-sm py-2 px-3">
            <span className="hidden sm:inline">Daily Breakdown</span>
            <span className="sm:hidden">Daily</span>
          </TabsTrigger>
          <TabsTrigger value="lines" className="text-xs sm:text-sm py-2 px-3">
            <span className="hidden sm:inline">Line Performance</span>
            <span className="sm:hidden">Lines</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="text-xs sm:text-sm py-2 px-3">
            <span className="hidden sm:inline">Analysis</span>
            <span className="sm:hidden">Analysis</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Daily Profit & Loss Breakdown</CardTitle>
              <CardDescription className="text-sm">Day-by-day breakdown of earnings, expenses, and net profit</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Earnings</TableHead>
                      <TableHead className="text-right">Salary Expenses</TableHead>
                      <TableHead className="text-right">Cashbook Expenses</TableHead>
                      <TableHead className="text-right">Others Expense</TableHead>
                      <TableHead className="text-right">Net Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.dailyBreakdown && data.dailyBreakdown.length > 0 ? (
                      data.dailyBreakdown.map((day) => (
                        <TableRow key={day.date}>
                          <TableCell className="font-medium">
                            {day.date && day.date !== 'unknown' ? format(parseISO(day.date), 'MMM dd, yyyy') : 'Unknown Date'}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            ৳{formatNumber(day.earnings)}
                          </TableCell>
                          <TableCell className="text-right text-purple-600">
                            ৳{formatNumber(day.dailySalary)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            ৳{formatNumber(day.dailyCashExpenses)}
                          </TableCell>
                          <TableCell className="text-right text-orange-600">
                            ৳{formatNumber(day.monthlyExpenses)}
                          </TableCell>
                          <TableCell className={`text-right font-bold ${getNetProfitColor(day.netProfit)}`}>
                            ৳{formatNumber(day.netProfit)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No daily breakdown data available for the selected period
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-semibold">Total</TableCell>
                      <TableCell className="text-right text-green-700 font-semibold">
                        ৳{formatNumber(data.dailyBreakdown?.reduce((sum, day) => sum + (day.earnings || 0), 0))}
                      </TableCell>
                      <TableCell className="text-right text-purple-700 font-semibold">
                        ৳{formatNumber(data.dailyBreakdown?.reduce((sum, day) => sum + (day.dailySalary || 0), 0))}
                      </TableCell>
                      <TableCell className="text-right text-red-700 font-semibold">
                        ৳{formatNumber(data.dailyBreakdown?.reduce((sum, day) => sum + (day.dailyCashExpenses || 0), 0))}
                      </TableCell>
                      <TableCell className="text-right text-orange-700 font-semibold">
                        ৳{formatNumber(data.dailyBreakdown?.reduce((sum, day) => sum + (day.monthlyExpenses || 0), 0))}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${getNetProfitColor(data.dailyBreakdown?.reduce((sum, day) => sum + (day.netProfit || 0), 0))}`}>
                        ৳{formatNumber(data.dailyBreakdown?.reduce((sum, day) => sum + (day.netProfit || 0), 0))}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {data.dailyBreakdown && data.dailyBreakdown.length > 0 ? (
                  data.dailyBreakdown.map((day) => (
                    <Card key={day.date} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-sm">
                              {day.date && day.date !== 'unknown' ? format(parseISO(day.date), 'MMM dd, yyyy') : 'Unknown Date'}
                            </h3>
                          </div>
                          <div className={`text-right font-bold ${getNetProfitColor(day.netProfit)}`}>
                            ৳{formatNumber(day.netProfit)}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="space-y-1">
                            <div className="text-green-600 font-medium">Earnings</div>
                            <div className="text-green-600">৳{formatNumber(day.earnings)}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-purple-600 font-medium">Salary</div>
                            <div className="text-purple-600">৳{formatNumber(day.dailySalary)}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-red-600 font-medium">Cashbook</div>
                            <div className="text-red-600">৳{formatNumber(day.dailyCashExpenses)}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-orange-600 font-medium">Others</div>
                            <div className="text-orange-600">৳{formatNumber(day.monthlyExpenses)}</div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No daily breakdown data available for the selected period
                  </div>
                )}
              </div>
              
              {/* Summary Row */}
              <div className="mt-4 p-3 sm:p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 text-center">
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">Total Earnings</div>
                    <div className="text-sm sm:text-lg font-bold text-green-600">৳{formatNumber(data.summary.totalEarnings)}</div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">Total Salary</div>
                    <div className="text-sm sm:text-lg font-bold text-purple-600">৳{formatNumber(data.summary.breakdown.dailySalary)}</div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">Total Cashbook</div>
                    <div className="text-sm sm:text-lg font-bold text-red-600">৳{formatNumber(data.summary.breakdown.dailyCashExpenses)}</div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">Total Others</div>
                    <div className="text-sm sm:text-lg font-bold text-orange-600">৳{formatNumber(data.summary.breakdown.monthlyExpenses)}</div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">Total Expenses</div>
                    <div className="text-sm sm:text-lg font-bold text-red-600">৳{formatNumber(data.summary.totalExpenses)}</div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">Net Profit</div>
                    <div className={`text-sm sm:text-lg font-bold ${getNetProfitColor(data.summary.netProfit)}`}>৳{formatNumber(data.summary.netProfit)}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Production Line Performance</CardTitle>
              <CardDescription className="text-sm">Profit and loss breakdown by production line</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Section</TableHead>
                      <TableHead className="text-right">Earnings</TableHead>
                      <TableHead className="text-right">Others Expense</TableHead>
                      <TableHead className="text-right">Net Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.lineBreakdown && data.lineBreakdown.length > 0 ? (
                      data.lineBreakdown.map((line) => (
                        <TableRow key={line.sectionId}>
                          <TableCell className="font-medium">{line.sectionName}</TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            ৳{formatNumber(line.earnings)}
                          </TableCell>
                          <TableCell className="text-right text-orange-600">
                            ৳{formatNumber(line.monthlyExpenses)}
                          </TableCell>
                          <TableCell className={`text-right font-bold ${getNetProfitColor(line.netProfit)}`}>
                            ৳{formatNumber(line.netProfit)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No line breakdown data available for the selected period
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {data.lineBreakdown && data.lineBreakdown.length > 0 ? (
                  data.lineBreakdown.map((line) => (
                    <Card key={line.sectionId} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-sm">{line.sectionName}</h3>
                          <div className={`text-right font-bold ${getNetProfitColor(line.netProfit)}`}>
                            ৳{formatNumber(line.netProfit)}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="space-y-1">
                            <div className="text-green-600 font-medium">Earnings</div>
                            <div className="text-green-600">৳{formatNumber(line.earnings)}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-orange-600 font-medium">Others Expense</div>
                            <div className="text-orange-600">৳{formatNumber(line.monthlyExpenses)}</div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No line breakdown data available for the selected period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <IconTrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  Top Performing Lines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topPerformingLines && data.topPerformingLines.length > 0 ? (
                    data.topPerformingLines.map((line, index) => (
                      <div key={line.sectionId} className="space-y-2 p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-medium">
                            {index + 1}. {line.sectionName}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-green-600">
                            ৳{formatNumber(line.netProfit)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Earnings: ৳{formatNumber(line.earnings)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-4 text-sm">
                      No top performing lines data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <IconTrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.worstPerformingLines && data.worstPerformingLines.length > 0 ? (
                    data.worstPerformingLines.map((line, index) => (
                      <div key={line.sectionId} className="space-y-2 p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-medium">
                            {index + 1}. {line.sectionName}
                          </span>
                          <span className={`text-xs sm:text-sm font-bold ${getNetProfitColor(line.netProfit)}`}>
                            ৳{formatNumber(line.netProfit)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Earnings: ৳{formatNumber(line.earnings)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-4 text-sm">
                      No worst performing lines data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
