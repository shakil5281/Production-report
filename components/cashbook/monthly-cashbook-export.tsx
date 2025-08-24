'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  IconFileText, 
  IconFileSpreadsheet, 
  IconPrinter, 
  IconDownload,
  IconCalendar,
  IconRefresh
} from '@tabler/icons-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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

interface MonthlyCashbookExportProps {
  reportData: MonthlyReportData | null;
  summary: ReportSummary | null;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export default function MonthlyCashbookExport({
  reportData,
  summary,
  selectedMonth,
  onMonthChange,
  onRefresh,
  loading = false
}: MonthlyCashbookExportProps) {
  const [exporting, setExporting] = useState(false);

  const exportToPDF = async () => {
    if (!reportData || !summary) {
      toast.error('No data available for export');
      return;
    }

    setExporting(true);
    try {
      const doc = new jsPDF();
      const currentDate = new Date();
      const monthYear = summary.monthName;
      
      // Company Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('EKUSHE FASHIONS LTD', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Monthly Cashbook Report', 105, 30, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Factory: Masterbari, Gazipur City, Gazipur.', 105, 40, { align: 'center' });
      doc.text(`For The Month of ${monthYear}`, 105, 50, { align: 'center' });
      
      // Summary information
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary:', 14, 65);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Cash Received: ৳${summary.totalCashReceived.toLocaleString()}`, 14, 75);
      doc.text(`Total Daily Expenses: ৳${summary.totalDailyExpenses.toLocaleString()}`, 14, 85);
      doc.text(`Net Amount: ৳${summary.netAmount.toLocaleString()}`, 14, 95);
      doc.text(`Total Transactions: ${summary.totalEntries}`, 100, 75);
      doc.text(`Days with Transactions: ${summary.daysWithTransactions}`, 100, 85);
      
      // Prepare table data
      const tableColumns = ['Date', 'Type', 'Description', 'Amount (BDT)', 'Daily Total', 'Daily Net'];
      const tableRows: any[] = [];
      
      reportData.dailyReports.forEach((dailyReport) => {
        // Add cash received entries
        dailyReport.cashReceived.forEach((entry, index) => {
          tableRows.push([
            index === 0 ? format(new Date(dailyReport.date), 'dd-MMM-yy') : '',
            'Cash Received',
            entry.description || 'Cash Received',
            `৳${entry.amount.toLocaleString()}`,
            index === 0 ? `৳${dailyReport.dailyCashTotal.toLocaleString()}` : '',
            index === 0 ? `৳${dailyReport.dailyNet.toLocaleString()}` : ''
          ]);
        });
        
        // Add daily expense entries
        dailyReport.dailyExpenses.forEach((entry, index) => {
          const isFirstExpense = dailyReport.cashReceived.length === 0 && index === 0;
          tableRows.push([
            isFirstExpense ? format(new Date(dailyReport.date), 'dd-MMM-yy') : '',
            'Daily Expense',
            `${entry.description}${entry.referenceId ? ` (Vol: ${entry.referenceId})` : ''}`,
            `৳${entry.amount.toLocaleString()}`,
            isFirstExpense ? `৳${dailyReport.dailyCashTotal.toLocaleString()}` : '',
            isFirstExpense ? `৳${dailyReport.dailyNet.toLocaleString()}` : ''
          ]);
        });
      });
      
      // Add table
      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: 105,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          halign: 'left'
        },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: 0,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 20, halign: 'center' },  // Date
          1: { cellWidth: 25, halign: 'left' },    // Type
          2: { cellWidth: 60, halign: 'left' },    // Description
          3: { cellWidth: 25, halign: 'right' },   // Amount
          4: { cellWidth: 25, halign: 'right' },   // Daily Total
          5: { cellWidth: 25, halign: 'right' }    // Daily Net
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        didParseCell: function (data) {
          // Style amount columns
          if (data.column.index === 3 || data.column.index === 4 || data.column.index === 5) {
            data.cell.styles.halign = 'right';
          }
          // Style date column
          if (data.column.index === 0 && data.cell.text[0]) {
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });
      
      // Save the PDF
      const fileName = `monthly-cashbook-${format(currentDate, 'MMM-yyyy')}.pdf`;
      doc.save(fileName);
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
      toast.error('No data available for export');
      return;
    }

    setExporting(true);
    try {
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([]);

      // Company Header (Row 1-4)
      const monthYear = summary.monthName;
      
      // Add header information
      XLSX.utils.sheet_add_aoa(worksheet, [
        ['', 'EKUSHE FASHIONS LTD'],
        ['', 'Monthly Cashbook Report'],
        ['', 'Factory: Masterbari, Gazipur City, Gazipur.'],
        ['', `For The Month of ${monthYear}`],
        [''],
        ['Summary:'],
        ['Total Cash Received', summary.totalCashReceived],
        ['Total Daily Expenses', summary.totalDailyExpenses],
        ['Net Amount', summary.netAmount],
        ['Total Transactions', summary.totalEntries],
        ['Days with Transactions', summary.daysWithTransactions],
        [''],
        ['Date', 'Type', 'Description', 'Amount (BDT)', 'Daily Total', 'Daily Net']
      ], { origin: 'A1' });

      // Add data rows starting from row 14
      let currentRow = 14;
      
      reportData.dailyReports.forEach((dailyReport) => {
        // Add cash received entries
        dailyReport.cashReceived.forEach((entry, index) => {
          XLSX.utils.sheet_add_aoa(worksheet, [
            [
              index === 0 ? format(new Date(dailyReport.date), 'dd-MMM-yy') : '',
              'Cash Received',
              entry.description || 'Cash Received',
              entry.amount,
              index === 0 ? dailyReport.dailyCashTotal : '',
              index === 0 ? dailyReport.dailyNet : ''
            ]
          ], { origin: `A${currentRow}` });
          currentRow++;
        });
        
        // Add daily expense entries
        dailyReport.dailyExpenses.forEach((entry, index) => {
          const isFirstExpense = dailyReport.cashReceived.length === 0 && index === 0;
          XLSX.utils.sheet_add_aoa(worksheet, [
            [
              isFirstExpense ? format(new Date(dailyReport.date), 'dd-MMM-yy') : '',
              'Daily Expense',
              `${entry.description}${entry.referenceId ? ` (Vol: ${entry.referenceId})` : ''}`,
              entry.amount,
              isFirstExpense ? dailyReport.dailyCashTotal : '',
              isFirstExpense ? dailyReport.dailyNet : ''
            ]
          ], { origin: `A${currentRow}` });
          currentRow++;
        });
      });

      // Set column widths
      worksheet['!cols'] = [
        { width: 15 }, // Date
        { width: 20 }, // Type
        { width: 40 }, // Description
        { width: 15 }, // Amount
        { width: 15 }, // Daily Total
        { width: 15 }  // Daily Net
      ];

      // Merge cells for header
      worksheet['!merges'] = [
        { s: { r: 0, c: 1 }, e: { r: 0, c: 5 } }, // Company name
        { s: { r: 1, c: 1 }, e: { r: 1, c: 5 } }, // Monthly Cashbook Report
        { s: { r: 2, c: 1 }, e: { r: 2, c: 5 } }, // Factory address
        { s: { r: 3, c: 1 }, e: { r: 3, c: 5 } }  // Month info
      ];

      // Style the header
      const headerStyle = {
        font: { bold: true, size: 14 },
        alignment: { horizontal: 'center' }
      };

      const subHeaderStyle = {
        font: { bold: true, size: 11 },
        alignment: { horizontal: 'center' }
      };

      const tableHeaderStyle = {
        font: { bold: true },
        alignment: { horizontal: 'center' },
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        }
      };

      // Apply styles to header cells
      ['B1', 'B2', 'B3', 'B4'].forEach(cell => {
        if (!worksheet[cell]) worksheet[cell] = {};
        worksheet[cell].s = headerStyle;
      });

      // Apply styles to table headers (row 13)
      ['A13', 'B13', 'C13', 'D13', 'E13', 'F13'].forEach(cell => {
        if (!worksheet[cell]) worksheet[cell] = {};
        worksheet[cell].s = tableHeaderStyle;
      });

      // Apply number formatting to amount columns
      for (let row = 14; row < currentRow; row++) {
        ['D', 'E', 'F'].forEach(col => {
          const cellRef = `${col}${row}`;
          if (worksheet[cellRef] && typeof worksheet[cellRef].v === 'number') {
            if (!worksheet[cellRef].s) worksheet[cellRef].s = {};
            worksheet[cellRef].s.numFmt = '#,##0.00';
          }
        });
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Cashbook');
      
      // Save the file
      const fileName = `monthly-cashbook-${format(new Date(), 'MMM-yyyy')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success('Excel file exported successfully');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Failed to export Excel file');
    } finally {
      setExporting(false);
    }
  };

  const printReport = () => {
    if (!reportData || !summary) {
      toast.error('No data available for printing');
      return;
    }

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow popups to print the report');
        return;
      }

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Monthly Cashbook Report - ${summary.monthName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            .report-title { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
            .company-info { font-size: 12px; margin-bottom: 5px; }
            .summary { margin-bottom: 30px; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .amount { text-align: right; }
            .date { font-weight: bold; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">EKUSHE FASHIONS LTD</div>
            <div class="report-title">Monthly Cashbook Report</div>
            <div class="company-info">Factory: Masterbari, Gazipur City, Gazipur.</div>
            <div class="company-info">For The Month of ${summary.monthName}</div>
          </div>
          
          <div class="summary">
            <div class="summary-row">
              <span>Total Cash Received: ৳${summary.totalCashReceived.toLocaleString()}</span>
              <span>Total Daily Expenses: ৳${summary.totalDailyExpenses.toLocaleString()}</span>
            </div>
            <div class="summary-row">
              <span>Net Amount: ৳${summary.netAmount.toLocaleString()}</span>
              <span>Total Transactions: ${summary.totalEntries}</span>
            </div>
            <div class="summary-row">
              <span>Days with Transactions: ${summary.daysWithTransactions}</span>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Amount (BDT)</th>
                <th>Daily Total</th>
                <th>Daily Net</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.dailyReports.map(dailyReport => {
                let rows = '';
                
                // Add cash received entries
                dailyReport.cashReceived.forEach((entry, index) => {
                  rows += `
                    <tr>
                      <td class="date">${index === 0 ? format(new Date(dailyReport.date), 'dd-MMM-yy') : ''}</td>
                      <td>Cash Received</td>
                      <td>${entry.description || 'Cash Received'}</td>
                      <td class="amount">৳${entry.amount.toLocaleString()}</td>
                      <td class="amount">${index === 0 ? `৳${dailyReport.dailyCashTotal.toLocaleString()}` : ''}</td>
                      <td class="amount">${index === 0 ? `৳${dailyReport.dailyNet.toLocaleString()}` : ''}</td>
                    </tr>
                  `;
                });
                
                // Add daily expense entries
                dailyReport.dailyExpenses.forEach((entry, index) => {
                  const isFirstExpense = dailyReport.cashReceived.length === 0 && index === 0;
                  rows += `
                    <tr>
                      <td class="date">${isFirstExpense ? format(new Date(dailyReport.date), 'dd-MMM-yy') : ''}</td>
                      <td>Daily Expense</td>
                      <td>${entry.description}${entry.referenceId ? ` (Vol: ${entry.referenceId})` : ''}</td>
                      <td class="amount">৳${entry.amount.toLocaleString()}</td>
                      <td class="amount">${isFirstExpense ? `৳${dailyReport.dailyCashTotal.toLocaleString()}` : ''}</td>
                      <td class="amount">${isFirstExpense ? `৳${dailyReport.dailyNet.toLocaleString()}` : ''}</td>
                    </tr>
                  `;
                });
                
                return rows;
              }).join('')}
            </tbody>
          </table>
          
          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()">Print Report</button>
            <button onclick="window.close()" style="margin-left: 10px;">Close</button>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
    } catch (error) {
      console.error('Error printing report:', error);
      toast.error('Failed to print report');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconCalendar className="h-5 w-5" />
          Monthly Report & Export
        </CardTitle>
        <CardDescription>
          Generate and export monthly cashbook reports in various formats
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="month-selector" className="text-sm font-medium">
              Month:
            </Label>
            <Input
              id="month-selector"
              type="month"
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="w-40"
            />
          </div>
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <IconRefresh className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={exportToPDF}
            disabled={exporting || !reportData}
            className="flex items-center gap-2"
          >
            <IconFileText className="h-4 w-4" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={exportToExcel}
            disabled={exporting || !reportData}
            className="flex items-center gap-2"
          >
            <IconFileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>
          <Button
            variant="outline"
            onClick={printReport}
            disabled={!reportData}
            className="flex items-center gap-2"
          >
            <IconPrinter className="h-4 w-4" />
            Print Report
          </Button>
        </div>

        {exporting && (
          <div className="text-center text-sm text-muted-foreground">
            Exporting... Please wait
          </div>
        )}
      </CardContent>
    </Card>
  );
}
