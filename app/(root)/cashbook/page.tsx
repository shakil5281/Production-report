'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  IconCurrencyTaka,
  IconRefresh,
  IconTrendingUp,
  IconTrendingDown,
  IconEqual,
  IconReceiptTax,
  IconCreditCard,
  IconChartBar,
  IconCalendarStats,
  IconArrowUpRight,
  IconArrowDownRight,
  IconEye,
  IconPlus
} from '@tabler/icons-react';
import { toast } from 'sonner';
import Link from 'next/link';
import CashReceivedForm from '@/components/cashbook/cash-received-form';
import DailyExpenseForm from '@/components/cashbook/daily-expense-form';

interface CashbookEntry {
  id: string;
  date: string;
  amount: number;
  description: string;
  type: 'CREDIT' | 'DEBIT';
  category: string;
  referenceId: string | null;
  createdAt: string;
}

interface DailySummary {
  date: string;
  cashReceived: number;
  expenses: number;
  net: number;
  transactionCount: number;
}

interface CashbookSummaryData {
  period: string;
  periodType: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  totals: {
    cashReceived: number;
    expenses: number;
    netAmount: number;
    totalTransactions: number;
  };
  breakdown: {
    cashReceivedCount: number;
    expensesCount: number;
    daysWithTransactions: number;
    averages: {
      dailyReceived: number;
      dailyExpenses: number;
    };
  };
  topExpenseCategories: [string, number][];
  recentTransactions: CashbookEntry[];
  dailySummary: DailySummary[];
  insights: {
    highestReceiptDay: CashbookEntry | null;
    highestExpenseDay: CashbookEntry | null;
    isProfit: boolean;
    profitMargin: number;
  };
}

export default function CashbookSummaryPage() {
  const [summaryData, setSummaryData] = useState<CashbookSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cashbook/summary?period=${selectedPeriod}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSummaryData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch summary');
      }
    } catch (error) {
      console.error('Error fetching cashbook summary:', error);
      toast.error('Failed to fetch cashbook summary');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const getNetAmountColor = (amount: number) => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getNetAmountIcon = (amount: number) => {
    if (amount > 0) return <IconTrendingUp className="h-4 w-4" />;
    if (amount < 0) return <IconTrendingDown className="h-4 w-4" />;
    return <IconEqual className="h-4 w-4" />;
  };

  const getTransactionTypeColor = (type: string) => {
    return type === 'CREDIT' ? 'text-green-600' : 'text-red-600';
  };

  const getTransactionTypeIcon = (type: string) => {
    return type === 'CREDIT' 
      ? <IconArrowUpRight className="h-4 w-4 text-green-600" />
      : <IconArrowDownRight className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Cashbook Summary</h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Comprehensive overview of your cash flow and financial insights
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="current_month">Current Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="all_time">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={fetchSummary}
            disabled={loading}
            className="flex items-center justify-center gap-2"
          >
            <IconRefresh className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:items-center lg:gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button className="w-full lg:w-auto">
              <IconPlus className="h-4 w-4" />
              <span className="truncate">Add Cash Received</span>
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-auto px-6 pb-8">
            <SheetHeader>
              <SheetTitle>Add Cash Received</SheetTitle>
              <SheetDescription>
                Enter the details of the cash received transaction
              </SheetDescription>
            </SheetHeader>
            <CashReceivedForm
              mode="create"
              onSubmit={async (data) => {
                try {
                  const response = await fetch('/api/cashbook/cash-received', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      date: format(data.date, 'yyyy-MM-dd'),
                      amount: data.amount,
                      category: 'Cash Received',
                      description: null,
                      referenceType: null,
                      referenceId: null,
                      lineId: null
                    }),
                  });

                  const result = await response.json();

                  if (result.success) {
                    toast.success('Cash received entry created successfully');
                    // Refresh the summary data
                    fetchSummary();
                    return Promise.resolve();
                  } else {
                    throw new Error(result.error || 'Failed to create entry');
                  }
                } catch (error) {
                  console.error('Error creating cash received entry:', error);
                  toast.error('Failed to create cash received entry');
                  return Promise.reject(error);
                }
              }}
              onCancel={() => {}}
            />
          </SheetContent>
        </Sheet>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full lg:w-auto">
              <IconPlus className="h-4 w-4" />
              <span className="truncate">Add Daily Expense</span>
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-auto px-6 pb-8">
            <SheetHeader>
              <SheetTitle>Add Daily Expense</SheetTitle>
              <SheetDescription>
                Enter the details of the daily expense transaction
              </SheetDescription>
            </SheetHeader>
            <DailyExpenseForm
              form={{
                date: new Date(),
                volumeNumber: '',
                description: '',
                amount: ''
              }}
              setForm={() => {}}
              onSubmit={async () => {
                try {
                  const response = await fetch('/api/cashbook/daily-expense', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      date: format(new Date(), 'yyyy-MM-dd'),
                      amount: 0,
                      description: '',
                      referenceId: null,
                      category: 'Daily Expense'
                    }),
                  });

                  const result = await response.json();

                  if (result.success) {
                    toast.success('Daily expense entry created successfully');
                    // Refresh the summary data
                    fetchSummary();
                    return Promise.resolve();
                  } else {
                    throw new Error(result.error || 'Failed to create entry');
                  }
                } catch (error) {
                  console.error('Error creating daily expense entry:', error);
                  toast.error('Failed to create daily expense entry');
                  return Promise.reject(error);
                }
              }}
              isSubmitting={false}
              onCancel={() => {}}
            />
          </SheetContent>
        </Sheet>

        <Button variant="outline" asChild className="w-full lg:w-auto">
          <Link href="/cashbook/monthly-report" className="flex items-center justify-center gap-2">
            <IconEye className="h-4 w-4" />
            <span className="truncate">Monthly Report</span>
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Loading cashbook summary...</div>
        </div>
      ) : !summaryData ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">No data available</div>
        </div>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cash Received</CardTitle>
                <IconArrowUpRight className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ৳{summaryData.totals.cashReceived.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summaryData.breakdown.cashReceivedCount} transactions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <IconArrowDownRight className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ৳{summaryData.totals.expenses.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summaryData.breakdown.expensesCount} transactions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Amount</CardTitle>
                {getNetAmountIcon(summaryData.totals.netAmount)}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getNetAmountColor(summaryData.totals.netAmount)}`}>
                  ৳{summaryData.totals.netAmount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summaryData.insights.profitMargin.toFixed(1)}% margin
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <IconReceiptTax className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summaryData.totals.totalTransactions}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summaryData.breakdown.daysWithTransactions} active days
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Averages and Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Daily Averages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconCalendarStats className="h-5 w-5" />
                  Daily Averages ({summaryData.period})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Avg. Daily Cash Received:</span>
                  <span className="text-green-600 font-bold">
                    ৳{summaryData.breakdown.averages.dailyReceived.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Avg. Daily Expenses:</span>
                  <span className="text-red-600 font-bold">
                    ৳{summaryData.breakdown.averages.dailyExpenses.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Avg. Daily Net:</span>
                  <span className={`font-bold ${getNetAmountColor(summaryData.breakdown.averages.dailyReceived - summaryData.breakdown.averages.dailyExpenses)}`}>
                    ৳{(summaryData.breakdown.averages.dailyReceived - summaryData.breakdown.averages.dailyExpenses).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Top Expense Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconChartBar className="h-5 w-5" />
                  Top Expense Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summaryData.topExpenseCategories.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    No expense categories found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {summaryData.topExpenseCategories.map(([category, amount], index) => {
                      const percentage = summaryData.totals.expenses > 0 
                        ? (amount / summaryData.totals.expenses) * 100 
                        : 0;
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {index + 1}. {category}
                            </span>
                            <span className="text-sm font-bold">
                              ৳{amount.toLocaleString()} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCreditCard className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
              <CardDescription>
                Latest 10 transactions across all categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summaryData.recentTransactions.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No recent transactions found
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Mobile View */}
                  <div className="block lg:hidden space-y-3">
                    {summaryData.recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm">
                            {format(new Date(transaction.date), 'MMM dd, yyyy')}
                          </div>
                          <div className="flex items-center gap-2">
                            {getTransactionTypeIcon(transaction.type)}
                            <Badge variant={transaction.type === 'CREDIT' ? 'default' : 'destructive'} className="text-xs">
                              {transaction.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm">{transaction.description}</div>
                          {transaction.referenceId && (
                            <div className="text-xs text-muted-foreground">
                              Vol: {transaction.referenceId}
                            </div>
                          )}
                        </div>
                        <div className={`text-right font-medium ${getTransactionTypeColor(transaction.type)}`}>
                          ৳{transaction.amount.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Desktop View */}
                  <div className="hidden lg:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summaryData.recentTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">
                              {format(new Date(transaction.date), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getTransactionTypeIcon(transaction.type)}
                                <Badge variant={transaction.type === 'CREDIT' ? 'default' : 'destructive'}>
                                  {transaction.category}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div>{transaction.description}</div>
                                {transaction.referenceId && (
                                  <div className="text-sm text-muted-foreground">
                                    Vol: {transaction.referenceId}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className={`text-right font-medium ${getTransactionTypeColor(transaction.type)}`}>
                              ৳{transaction.amount.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Insights and Highlights */}
          {(summaryData.insights.highestReceiptDay || summaryData.insights.highestExpenseDay) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTrendingUp className="h-5 w-5" />
                  Insights & Highlights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {summaryData.insights.highestReceiptDay && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <IconArrowUpRight className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Highest Cash Receipt</span>
                    </div>
                    <div className="text-sm text-green-700">
                      ৳{summaryData.insights.highestReceiptDay.amount.toLocaleString()} - {summaryData.insights.highestReceiptDay.description}
                      <br />
                      <span className="text-green-600">
                        {format(new Date(summaryData.insights.highestReceiptDay.date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                )}
                
                {summaryData.insights.highestExpenseDay && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <IconArrowDownRight className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-800">Highest Single Expense</span>
                    </div>
                    <div className="text-sm text-red-700">
                      ৳{summaryData.insights.highestExpenseDay.amount.toLocaleString()} - {summaryData.insights.highestExpenseDay.description}
                      <br />
                      <span className="text-red-600">
                        {format(new Date(summaryData.insights.highestExpenseDay.date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}