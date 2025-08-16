'use client';

import { useCallback, useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  IconCalendar, 
  IconCurrencyTaka,
  IconRefresh,
  IconReceipt,
  IconReportAnalytics,
  IconTrendingDown,
  IconDownload,
  IconFileText,
  IconFileSpreadsheet,
  IconFilter,
  IconCalendarStats
} from '@tabler/icons-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ExpenseEntry {
  id: string;
  date: string;
  amount: number;
  description: string;
  referenceId: string | null;
  createdAt: string;
}

interface DailyData {
  date: string;
  categories: Record<string, number>;
  dailyTotal: number;
}

interface MonthlyReportData {
  entries: ExpenseEntry[];
  dailyData: DailyData[];
  categories: string[];
  categoryTotals: Record<string, number>;
}

interface ReportSummary {
  month: string;
  monthName: string;
  totalAmount: number;
  totalEntries: number;
  startDate: string;
  endDate: string;
  daysWithExpenses: number;
}

export default function MonthlyExpenseReportPage() {
  const [reportData, setReportData] = useState<MonthlyReportData | null>(null);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cashbook/monthly-expense-report?month=${selectedMonth}`);
      
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
      console.error('Error fetching monthly expense report:', error);
      toast.error('Failed to fetch monthly expense report');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  const exportToPDF = async () => {
    if (!reportData || !summary) {
      toast.error('No data to export');
      return;
    }

    setExporting(true);
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text('Monthly Expense Report', 14, 22);
      
      // Add month info
      doc.setFontSize(12);
      doc.text(summary.monthName, 14, 32);
      
      // Add summary
      doc.text(`Total Amount: ৳${summary.totalAmount.toLocaleString()}`, 14, 42);
      doc.text(`Total Entries: ${summary.totalEntries}`, 14, 52);
      doc.text(`Days with Expenses: ${summary.daysWithExpenses}`, 100, 42);
      doc.text(`Categories: ${reportData.categories.length}`, 100, 52);
      
      // Prepare table data
      const tableColumns = ['Date', ...reportData.categories, 'Total'];
      const tableRows = reportData.dailyData.map(daily => [
        daily.date,
        ...reportData.categories.map(cat => daily.categories[cat] ? daily.categories[cat].toLocaleString() : ''),
        daily.dailyTotal.toLocaleString()
      ]);
      
      // Add totals row
      const totalsRow = [
        'Total',
        ...reportData.categories.map(cat => reportData.categoryTotals[cat]?.toLocaleString() || '0'),
        summary.totalAmount.toLocaleString()
      ];
      tableRows.push(totalsRow);
      
      // Add table
      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: 65,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [239, 68, 68],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [254, 242, 242],
        },
        didParseCell: function (data) {
          if (data.row.index === tableRows.length - 1) {
            data.cell.styles.fillColor = [220, 220, 220];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });
      
      // Save the PDF
      doc.save(`monthly-expense-report-${selectedMonth}.pdf`);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = async () => {
    if (!reportData || !summary) {
      toast.error('No data to export');
      return;
    }

    setExporting(true);
    try {
      // Prepare data for Excel
      const excelData = reportData.dailyData.map(daily => {
        const row: any = { 'Date': daily.date };
        reportData.categories.forEach(cat => {
          row[cat] = daily.categories[cat] || 0;
        });
        row['Total'] = daily.dailyTotal;
        return row;
      });
      
      // Add totals row
      const totalsRow: any = { 'Date': 'Total' };
      reportData.categories.forEach(cat => {
        totalsRow[cat] = reportData.categoryTotals[cat] || 0;
      });
      totalsRow['Total'] = summary.totalAmount;
      excelData.push(totalsRow);
      
      // Add summary at the top
      const summaryData = [
        { 'Date': 'SUMMARY', ...Object.fromEntries(reportData.categories.map(cat => [cat, ''])), 'Total': '' },
        { 'Date': 'Month', ...Object.fromEntries(reportData.categories.map(cat => [cat, ''])), 'Total': summary.monthName },
        { 'Date': 'Total Amount', ...Object.fromEntries(reportData.categories.map(cat => [cat, ''])), 'Total': summary.totalAmount },
        { 'Date': 'Total Entries', ...Object.fromEntries(reportData.categories.map(cat => [cat, ''])), 'Total': summary.totalEntries },
        { 'Date': '', ...Object.fromEntries(reportData.categories.map(cat => [cat, ''])), 'Total': '' },
        { 'Date': 'DETAILS', ...Object.fromEntries(reportData.categories.map(cat => [cat, ''])), 'Total': '' },
        ...excelData
      ];
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(summaryData);
      
      // Set column widths
      const colWidths = [{ width: 12 }]; // Date column
      reportData.categories.forEach(() => colWidths.push({ width: 15 })); // Category columns
      colWidths.push({ width: 12 }); // Total column
      worksheet['!cols'] = colWidths;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Expenses');
      
      // Save the file
      XLSX.writeFile(workbook, `monthly-expense-report-${selectedMonth}.xlsx`);
      toast.success('Excel file exported successfully');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Failed to export Excel file');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Monthly Expense Report</h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Comprehensive monthly view of all daily expense transactions
          </p>
        </div>
        <div className="flex flex-col space-y-2 lg:space-y-0 lg:flex-row lg:items-center lg:gap-2">
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="month-filter" className="text-sm">Month:</Label>
              <Select 
                value={selectedMonth.split('-')[1]} 
                onValueChange={(month) => setSelectedMonth(`${selectedYear}-${month.padStart(2, '0')}`)}
              >
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="01">January</SelectItem>
                  <SelectItem value="02">February</SelectItem>
                  <SelectItem value="03">March</SelectItem>
                  <SelectItem value="04">April</SelectItem>
                  <SelectItem value="05">May</SelectItem>
                  <SelectItem value="06">June</SelectItem>
                  <SelectItem value="07">July</SelectItem>
                  <SelectItem value="08">August</SelectItem>
                  <SelectItem value="09">September</SelectItem>
                  <SelectItem value="10">October</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">December</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="year-filter" className="text-sm">Year:</Label>
              <Select 
                value={selectedYear.toString()} 
                onValueChange={(year) => {
                  setSelectedYear(parseInt(year));
                  setSelectedMonth(`${year}-${selectedMonth.split('-')[1]}`);
                }}
              >
                <SelectTrigger className="w-full sm:w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - 5 + i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
            <Button
              variant="outline"
              onClick={fetchReport}
              disabled={loading}
              className="flex items-center justify-center gap-2"
            >
              <IconRefresh className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                <IconCalendarStats className="h-3 w-3" />
                <span className="hidden sm:inline">{summary?.monthName || 'Loading...'}</span>
                <span className="sm:hidden">{selectedMonth}</span>
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
                disabled={exporting || !reportData || reportData.dailyData.length === 0}
                className="flex items-center gap-2"
              >
                <IconFileText className="h-4 w-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                disabled={exporting || !reportData || reportData.dailyData.length === 0}
                className="flex items-center gap-2"
              >
                <IconFileSpreadsheet className="h-4 w-4" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Month</CardTitle>
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.monthName}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
              <IconCurrencyTaka className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">৳{summary.totalAmount.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              <IconReceipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalEntries}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Days with Expenses</CardTitle>
              <IconTrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.daysWithExpenses}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly Report Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconReportAnalytics className="h-5 w-5" />
            Monthly Expense Report
          </CardTitle>
          <CardDescription>
            Detailed view of all daily expenses for {summary?.monthName || 'selected month'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Loading monthly expense report...</div>
            </div>
          ) : !reportData || reportData.dailyData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">No expenses found for the selected month</div>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Date</TableHead>
                    {reportData.categories.map((category) => (
                      <TableHead key={category} className="text-center font-semibold">
                        {category}
                      </TableHead>
                    ))}
                    <TableHead className="text-center font-semibold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.dailyData.map((dailyData) => (
                    <TableRow key={dailyData.date}>
                      <TableCell className="font-medium">
                        {dailyData.date}
                      </TableCell>
                      {reportData.categories.map((category) => (
                        <TableCell key={category} className="text-center">
                          {dailyData.categories[category] ? dailyData.categories[category].toLocaleString() : ''}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-bold">
                        {dailyData.dailyTotal.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Total Row */}
                  <TableRow className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                    <TableCell className="font-bold">Total</TableCell>
                    {reportData.categories.map((category) => (
                      <TableCell key={category} className="text-center font-bold">
                        {reportData.categoryTotals[category]?.toLocaleString() || '0'}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-bold">
                      {summary?.totalAmount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {/* Monthly Summary */}
              {summary && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Monthly Summary ({summary.monthName})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Amount:</span>
                      <div className="font-bold text-lg">৳{summary.totalAmount.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Entries:</span>
                      <div className="font-bold text-lg">{summary.totalEntries}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Days with Expenses:</span>
                      <div className="font-bold text-lg">{summary.daysWithExpenses}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Categories:</span>
                      <div className="font-bold text-lg">{reportData.categories.length}</div>
                    </div>
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