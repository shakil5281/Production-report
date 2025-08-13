'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Download, TrendingUp, TrendingDown, DollarSign, AlertCircle, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface PnLData {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    totalEarnedProduction: number;
    totalExpenses: number;
    profit: number;
    profitMargin: number;
  };
  production: {
    totalInput: number;
    totalOutput: number;
    totalDefects: number;
    totalRework: number;
    efficiency: number;
    defectRate: number;
    reworkRate: number;
    styles: Array<{
      styleId: string;
      lineId: string;
      style: {
        styleNumber: string;
        buyer: string;
      };
      line: {
        name: string;
      };
      totalOutput: number;
      totalRevenue: number;
    }>;
  };
  expenses: {
    total: number;
    byCategory: Record<string, {
      category: {
        name: string;
      };
      total: number;
      count: number;
    }>;
    byLine: Record<string, {
      line: {
        name: string;
      };
      total: number;
      count: number;
    }>;
  };
}

interface Line {
  id: string;
  name: string;
  code: string;
}

export default function ProfitLossPage() {
  const [pnlData, setPnLData] = useState<PnLData | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [linesLoading, setLinesLoading] = useState(true);
  const [linesError, setLinesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    period: 'daily',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    lineId: 'all'
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  useEffect(() => {
    fetchLines();
  }, []);

  const fetchLines = async () => {
    try {
      setLinesLoading(true);
      setLinesError(null);
      
      const response = await fetch('/api/lines');
      if (!response.ok) {
        throw new Error('Failed to fetch lines');
      }
      
      const data = await response.json();
      setLines(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch lines';
      setLinesError(errorMessage);
      console.error('Failed to fetch lines:', err);
      toast.error(errorMessage);
    } finally {
      setLinesLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        period: filters.period,
        ...(filters.startDate && filters.endDate && {
          startDate: filters.startDate,
          endDate: filters.endDate
        }),
        ...(filters.lineId && filters.lineId !== 'all' && { lineId: filters.lineId })
      });

      const response = await fetch(`/api/production/profit-loss?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch P&L data');
      }

      const data = await response.json();
      setPnLData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to fetch P&L data');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!pnlData) {
      toast.error('No data to export');
      return;
    }

    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pnl_report_${filters.period}_${filters.startDate}_${filters.endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateCSV = () => {
    if (!pnlData) return '';

    const headers = [
      'Period',
      'Start Date',
      'End Date',
      'Total Revenue',
      'Total Expenses',
      'Profit',
      'Profit Margin %',
      'Total Input',
      'Total Output',
      'Efficiency %',
      'Defect Rate %',
      'Rework Rate %'
    ];

    const summaryRow = [
      pnlData.period,
      pnlData.dateRange.start,
      pnlData.dateRange.end,
      pnlData.summary.totalEarnedProduction.toFixed(2),
      pnlData.summary.totalExpenses.toFixed(2),
      pnlData.summary.profit.toFixed(2),
      pnlData.summary.profitMargin.toFixed(2),
      pnlData.production.totalInput,
      pnlData.production.totalOutput,
      pnlData.production.efficiency.toFixed(2),
      pnlData.production.defectRate.toFixed(2),
      pnlData.production.reworkRate.toFixed(2)
    ];

    return [headers, summaryRow].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchData} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profit & Loss</h1>
          <p className="text-muted-foreground">
            Financial analysis and profit & loss reporting
          </p>
        </div>
        <Button onClick={exportReport} disabled={!pnlData}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="period">Period</Label>
              <Select
                value={filters.period}
                onValueChange={(value) => setFilters({ ...filters, period: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="lineId">Production Line</Label>
              <Select
                value={filters.lineId}
                onValueChange={(value) => setFilters({ ...filters, lineId: value })}
                disabled={linesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={linesLoading ? "Loading..." : "All lines"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All lines</SelectItem>
                  {lines.map((line) => (
                    <SelectItem key={line.id} value={line.id}>
                      {line.name} ({line.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {linesError && (
                <p className="text-xs text-red-500 mt-1">Failed to load lines</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* P&L Summary */}
      {pnlData && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(pnlData.summary.totalEarnedProduction)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Earned from production
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(pnlData.summary.totalExpenses)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total operational costs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  pnlData.summary.profit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(pnlData.summary.profit)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Revenue - Expenses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  pnlData.summary.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercentage(pnlData.summary.profitMargin)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Profit as % of revenue
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Production Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Input</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pnlData.production.totalInput.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total input quantity
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Output</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pnlData.production.totalOutput.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total output quantity
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatPercentage(pnlData.production.efficiency)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Output/Input ratio
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Defect Rate</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatPercentage(pnlData.production.defectRate)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Defects per output
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue by Style */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Style</CardTitle>
              <p className="text-sm text-muted-foreground">
                Production revenue breakdown by style and line
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Style</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Line</TableHead>
                    <TableHead className="text-right">Output Qty</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pnlData.production.styles.map((style) => (
                    <TableRow key={`${style.styleId}-${style.lineId}`}>
                      <TableCell className="font-medium">
                        {style.style.styleNumber}
                      </TableCell>
                      <TableCell>{style.style.buyer}</TableCell>
                      <TableCell>{style.line.name}</TableCell>
                      <TableCell className="text-right">
                        {style.totalOutput.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(style.totalRevenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Expenses by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
              <p className="text-sm text-muted-foreground">
                Expense breakdown by category
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(pnlData.expenses.byCategory).map((category) => (
                    <TableRow key={category.category?.name || 'Uncategorized'}>
                      <TableCell className="font-medium">
                        {category.category?.name || 'Uncategorized'}
                      </TableCell>
                      <TableCell className="text-right">
                        {category.count}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(category.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Expenses by Line */}
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Line</CardTitle>
              <p className="text-sm text-muted-foreground">
                Expense breakdown by production line
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Line</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(pnlData.expenses.byLine).map((line) => (
                    <TableRow key={line.line?.name || 'General'}>
                      <TableCell className="font-medium">
                        {line.line?.name || 'General'}
                      </TableCell>
                      <TableCell className="text-right">
                        {line.count}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(line.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {!pnlData && !loading && !error && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No P&L data available for the selected criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
