'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  IconFileText, 
  IconFileSpreadsheet, 
  IconPrinter, 
  IconDownload
} from '@tabler/icons-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
}

interface ExportActionsProps {
  data: ProfitLossData;
}

export default function ExportActions({ data }: ExportActionsProps) {
  const [exporting, setExporting] = useState(false);

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const currentDate = new Date();
      const monthYear = format(parseISO(data.period.startDate), 'MMMM yyyy');
      
      // Company Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('EKUSHE FASHIONS LTD', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Profit & Loss Statement', 105, 30, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Factory: Masterbari, Gazipur City, Gazipur.', 105, 40, { align: 'center' });
      doc.text(`For The Month of ${monthYear}`, 105, 50, { align: 'center' });
      
      // Summary
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary:', 14, 65);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Earnings: ৳${data.summary.totalEarnings.toLocaleString()}`, 14, 75);
      doc.text(`Total Expenses: ৳${data.summary.totalExpenses.toLocaleString()}`, 14, 85);
      doc.text(`Net Profit: ৳${data.summary.netProfit.toLocaleString()}`, 14, 95);
      doc.text(`Profit Margin: ${data.summary.profitMargin.toFixed(2)}%`, 100, 75);
      
      // Expense Breakdown
      doc.text(`Daily Salary: ৳${data.summary.breakdown.dailySalary.toLocaleString()}`, 100, 85);
      doc.text(`Daily Overtime: ৳${data.summary.breakdown.dailyOvertime.toLocaleString()}`, 100, 95);
      doc.text(`Daily Cash Expenses: ৳${data.summary.breakdown.dailyCashExpenses.toLocaleString()}`, 100, 105);
      
      // Daily Breakdown Table
      const tableColumns = ['Date', 'Earnings', 'Daily Salary', 'Daily Overtime', 'Cash Expenses', 'Net Profit'];
      const tableRows = data.dailyBreakdown.map(day => [
        format(parseISO(day.date), 'dd-MMM-yy'),
        `৳${day.earnings.toLocaleString()}`,
        `৳${day.dailySalary.toLocaleString()}`,
        `৳${day.dailyOvertime.toLocaleString()}`,
        `৳${day.dailyCashExpenses.toLocaleString()}`,
        `৳${day.netProfit.toLocaleString()}`
      ]);
      
      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: 115,
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
          1: { cellWidth: 25, halign: 'right' },   // Earnings
          2: { cellWidth: 25, halign: 'right' },   // Daily Salary
          3: { cellWidth: 25, halign: 'right' },   // Daily Overtime
          4: { cellWidth: 25, halign: 'right' },   // Cash Expenses
          5: { cellWidth: 25, halign: 'right' }    // Net Profit
        }
      });
      
      const fileName = `profit-loss-${format(currentDate, 'MMM-yyyy')}.pdf`;
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
    setExporting(true);
    try {
      const workbook = XLSX.utils.book_new();
      
      // Summary Sheet
      const summarySheet = XLSX.utils.aoa_to_sheet([
        ['', 'EKUSHE FASHIONS LTD'],
        ['', 'Profit & Loss Statement'],
        ['', 'Factory: Masterbari, Gazipur City, Gazipur.'],
        ['', `For The Month of ${format(parseISO(data.period.startDate), 'MMMM yyyy')}`],
        [''],
        ['Summary:'],
        ['Total Earnings', data.summary.totalEarnings],
        ['Total Expenses', data.summary.totalExpenses],
        ['Net Profit', data.summary.netProfit],
        ['Profit Margin (%)', data.summary.profitMargin],
        [''],
        ['Expense Breakdown:'],
        ['Daily Salary', data.summary.breakdown.dailySalary],
        ['Daily Overtime', data.summary.breakdown.dailyOvertime],
        ['Daily Cash Expenses', data.summary.breakdown.dailyCashExpenses]
      ]);

      // Daily Breakdown Sheet
      const dailySheet = XLSX.utils.aoa_to_sheet([
        ['Date', 'Earnings', 'Daily Salary', 'Daily Overtime', 'Cash Expenses', 'Net Profit'],
        ...data.dailyBreakdown.map(day => [
          format(parseISO(day.date), 'dd-MMM-yy'),
          day.earnings,
          day.dailySalary,
          day.dailyOvertime,
          day.dailyCashExpenses,
          day.netProfit
        ])
      ]);

      // Line Breakdown Sheet
      const lineSheet = XLSX.utils.aoa_to_sheet([
        ['Section', 'Earnings', 'Daily Salary', 'Daily Overtime', 'Net Profit'],
        ...data.lineBreakdown.map(line => [
          line.sectionName,
          line.earnings,
          line.dailySalary,
          line.dailyOvertime,
          line.netProfit
        ])
      ]);

      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      XLSX.utils.book_append_sheet(workbook, dailySheet, 'Daily Breakdown');
      XLSX.utils.book_append_sheet(workbook, lineSheet, 'Line Breakdown');
      
      const fileName = `profit-loss-${format(new Date(), 'MMM-yyyy')}.xlsx`;
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
          <title>Profit & Loss Statement - ${format(parseISO(data.period.startDate), 'MMMM yyyy')}</title>
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
            .positive { color: green; }
            .negative { color: red; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">EKUSHE FASHIONS LTD</div>
            <div class="report-title">Profit & Loss Statement</div>
            <div class="company-info">Factory: Masterbari, Gazipur City, Gazipur.</div>
            <div class="company-info">For The Month of ${format(parseISO(data.period.startDate), 'MMMM yyyy')}</div>
          </div>
          
          <div class="summary">
            <div class="summary-row">
              <span>Total Earnings: ৳${data.summary.totalEarnings.toLocaleString()}</span>
              <span>Total Expenses: ৳${data.summary.totalExpenses.toLocaleString()}</span>
            </div>
            <div class="summary-row">
              <span>Net Profit: ৳${data.summary.netProfit.toLocaleString()}</span>
              <span>Profit Margin: ${data.summary.profitMargin.toFixed(2)}%</span>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Earnings</th>
                <th>Daily Salary</th>
                <th>Daily Overtime</th>
                <th>Cash Expenses</th>
                <th>Net Profit</th>
              </tr>
            </thead>
            <tbody>
              ${data.dailyBreakdown.map(day => `
                <tr>
                  <td>${format(parseISO(day.date), 'dd-MMM-yy')}</td>
                  <td class="amount">৳${day.earnings.toLocaleString()}</td>
                  <td class="amount">৳${day.dailySalary.toLocaleString()}</td>
                  <td class="amount">৳${day.dailyOvertime.toLocaleString()}</td>
                  <td class="amount">৳${day.dailyCashExpenses.toLocaleString()}</td>
                  <td class="amount ${day.netProfit >= 0 ? 'positive' : 'negative'}">৳${day.netProfit.toLocaleString()}</td>
                </tr>
              `).join('')}
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
          <IconDownload className="h-5 w-5" />
          Export & Print
        </CardTitle>
        <CardDescription>
          Generate and export profit and loss reports in various formats
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={exportToPDF}
            disabled={exporting}
            className="flex items-center gap-2"
          >
            <IconFileText className="h-4 w-4" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={exportToExcel}
            disabled={exporting}
            className="flex items-center gap-2"
          >
            <IconFileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>
          <Button
            variant="outline"
            onClick={printReport}
            className="flex items-center gap-2"
          >
            <IconPrinter className="h-4 w-4" />
            Print Report
          </Button>
        </div>
        {exporting && (
          <div className="text-center text-sm text-muted-foreground mt-2">
            Exporting... Please wait
          </div>
        )}
      </CardContent>
    </Card>
  );
}
