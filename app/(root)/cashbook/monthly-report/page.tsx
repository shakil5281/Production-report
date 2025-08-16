'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  IconCalendar, 
  IconCurrencyTaka,
  IconRefresh,
  IconReceipt,
  IconReportAnalytics,
  IconTrendingUp,
  IconTrendingDown,
  IconEqual
} from '@tabler/icons-react';
import { toast } from 'sonner';

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

interface DailyReport {
  date: string;
  cashReceived: CashbookEntry[];
  dailyExpenses: CashbookEntry[];
  dailyCashTotal: number;
  dailyExpenseTotal: number;
  dailyNet: number;
}

interface MonthlyReportData {
  allEntries: CashbookEntry[];
  cashReceived: CashbookEntry[];
  dailyExpenses: CashbookEntry[];
  dailyReports: DailyReport[];
}

interface ReportSummary {
  month: string;
  monthName: string;
  totalCashReceived: number;
  totalDailyExpenses: number;
  netAmount: number;
  startDate: string;
  endDate: string;
  totalEntries: number;
  daysWithTransactions: number;
}

export default function MonthlyCashbookReportPage() {
  const [reportData, setReportData] = useState<MonthlyReportData | null>(null);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cashbook/monthly-report?month=${selectedMonth}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setReportData(data.data);
        setSummary(data.summary);
      } else {
        throw new Error(data.error || 'Failed to fetch report');
      }
    } catch (error) {
      console.error('Error fetching monthly cashbook report:', error);
      toast.error('Failed to fetch monthly cashbook report');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monthly Cashbook Report</h1>
          <p className="text-muted-foreground">
            Comprehensive monthly view of cash received and daily expenses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="month-filter">Month:</Label>
            <Input
              id="month-filter"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-40"
            />
          </div>
          <Button
            variant="outline"
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <IconRefresh className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash Received</CardTitle>
              <IconTrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">৳{summary.totalCashReceived.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Expenses</CardTitle>
              <IconTrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">৳{summary.totalDailyExpenses.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Amount</CardTitle>
              {getNetAmountIcon(summary.netAmount)}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getNetAmountColor(summary.netAmount)}`}>
                ৳{summary.netAmount.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <IconReceipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalEntries}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly Cashbook Report Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconReportAnalytics className="h-5 w-5" />
            Monthly Cashbook Report
          </CardTitle>
          <CardDescription>
            Daily breakdown of cash received and expenses for {summary?.monthName || 'selected month'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Loading monthly cashbook report...</div>
            </div>
          ) : !reportData || reportData.dailyReports.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">No transactions found for the selected month</div>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Daily Express Description</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Net Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.dailyReports.map((dailyReport) => (
                    <>
                      {/* Cash Received entries for this date */}
                      {dailyReport.cashReceived.map((entry, index) => (
                        <TableRow key={`cash-${entry.id}`}>
                          {index === 0 && (
                            <TableCell rowSpan={dailyReport.cashReceived.length + dailyReport.dailyExpenses.length} className="font-medium border-r">
                              {format(new Date(dailyReport.date), 'MMM dd, yyyy')}
                            </TableCell>
                          )}
                          <TableCell>Cash Received</TableCell>
                          <TableCell>{entry.description}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            ৳{entry.amount.toLocaleString()}
                          </TableCell>
                          {index === 0 && (
                            <TableCell rowSpan={dailyReport.cashReceived.length + dailyReport.dailyExpenses.length} className="text-right font-bold border-l">
                              <div className="text-green-600">৳{dailyReport.dailyCashTotal.toLocaleString()}</div>
                              <div className="text-red-600">৳{dailyReport.dailyExpenseTotal.toLocaleString()}</div>
                            </TableCell>
                          )}
                          {index === 0 && (
                            <TableCell rowSpan={dailyReport.cashReceived.length + dailyReport.dailyExpenses.length} className={`text-right font-bold ${getNetAmountColor(dailyReport.dailyNet)}`}>
                              ৳{dailyReport.dailyNet.toLocaleString()}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      
                      {/* Daily Expense entries for this date */}
                      {dailyReport.dailyExpenses.map((entry, index) => (
                        <TableRow key={`expense-${entry.id}`}>
                          {dailyReport.cashReceived.length === 0 && index === 0 && (
                            <TableCell rowSpan={dailyReport.dailyExpenses.length} className="font-medium border-r">
                              {format(new Date(dailyReport.date), 'MMM dd, yyyy')}
                            </TableCell>
                          )}
                          <TableCell>Daily Expense</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div>{entry.description}</div>
                              {entry.referenceId && (
                                <div className="text-sm text-muted-foreground">
                                  Volume: {entry.referenceId}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium text-red-600">
                            ৳{entry.amount.toLocaleString()}
                          </TableCell>
                          {dailyReport.cashReceived.length === 0 && index === 0 && (
                            <TableCell rowSpan={dailyReport.dailyExpenses.length} className="text-right font-bold border-l">
                              <div className="text-green-600">৳{dailyReport.dailyCashTotal.toLocaleString()}</div>
                              <div className="text-red-600">৳{dailyReport.dailyExpenseTotal.toLocaleString()}</div>
                            </TableCell>
                          )}
                          {dailyReport.cashReceived.length === 0 && index === 0 && (
                            <TableCell rowSpan={dailyReport.dailyExpenses.length} className={`text-right font-bold ${getNetAmountColor(dailyReport.dailyNet)}`}>
                              ৳{dailyReport.dailyNet.toLocaleString()}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </>
                  ))}
                </TableBody>
              </Table>

              {/* Monthly Total Summary */}
              {summary && (
                <div className="border-t pt-4 space-y-2">
                  <div className="grid grid-cols-3 gap-4 text-lg font-semibold">
                    <div className="flex justify-between">
                      <span>Total Cash Received:</span>
                      <span className="text-green-600">৳{summary.totalCashReceived.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Daily Expenses:</span>
                      <span className="text-red-600">৳{summary.totalDailyExpenses.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Net Amount:</span>
                      <span className={getNetAmountColor(summary.netAmount)}>
                        ৳{summary.netAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {summary.totalEntries} total transactions across {summary.daysWithTransactions} days in {summary.monthName}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
