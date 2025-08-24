'use client';

import { Button } from '@/components/ui/button';
import { IconMail } from '@tabler/icons-react';
import { toast } from 'sonner';
import { DailyProductionReport, ExportDataRow } from './types';

interface EmailActionsProps {
  reportsByLine: Record<string, DailyProductionReport[]>;
  reportsWithoutLine: DailyProductionReport[];
  selectedDate: Date;
  loading: boolean;
  emailSending: boolean;
  setEmailSending: (sending: boolean) => void;
}

export function EmailActions({
  reportsByLine,
  reportsWithoutLine,
  selectedDate,
  loading,
  emailSending,
  setEmailSending
}: EmailActionsProps) {
  // Generate tabular data for export (matching your image format)
  const generateExportData = (): ExportDataRow[] => {
    const exportData: ExportDataRow[] = [];

    // Process reports by line
    Object.entries(reportsByLine).forEach(([lineNo, lineReports]) => {
      lineReports.forEach(report => {
        exportData.push({
          'LINE': lineNo,
          'P/COD': report.styleNo,
          'BUYER': report.productionList.buyer,
          'ART/NO': report.styleNo,
          'OR/QTY': report.targetQty,
          'ITEM': report.productionList.item,
          'DAILY TARGET': report.targetQty,
          'DAILY PRODUCTION': report.productionQty,
          'UNIT PRICE': Number(report.unitPrice).toFixed(2),
          'TOTAL PRICE': Number(report.totalAmount).toFixed(2),
          '%': 0.15, // Default 15% - you can make this configurable
          '% Dollar': (Number(report.totalAmount) * 0.15).toFixed(2),
          'Taka': (Number(report.totalAmount) * 0.15 * 120).toFixed(0), // Default exchange rate 120
          'Remarks': report.notes || ''
        });
      });
    });

    // Process unassigned reports
    reportsWithoutLine.forEach(report => {
      exportData.push({
        'LINE': '',
        'P/COD': report.styleNo,
        'BUYER': report.productionList.buyer,
        'ART/NO': report.styleNo,
        'OR/QTY': report.targetQty,
        'ITEM': report.productionList.item,
        'DAILY TARGET': report.targetQty,
        'DAILY PRODUCTION': report.productionQty,
        'UNIT PRICE': Number(report.unitPrice).toFixed(2),
        'TOTAL PRICE': Number(report.totalAmount).toFixed(2),
        '%': 0.15, // Default 15% - you can make this configurable
        '% Dollar': (Number(report.totalAmount) * 0.15).toFixed(2),
        'Taka': (Number(report.totalAmount) * 0.15 * 120).toFixed(0), // Default exchange rate 120
        'Remarks': report.notes || ''
      });
    });

    // Add total row
    const totalTargetQty = exportData.reduce((sum, row) => sum + (row['DAILY TARGET'] || 0), 0);
    const totalProductionQty = exportData.reduce((sum, row) => sum + (row['DAILY PRODUCTION'] || 0), 0);
    const totalAmount = exportData.reduce((sum, row) => sum + parseFloat(row['TOTAL PRICE'] || '0'), 0);
    const totalPercentDollar = exportData.reduce((sum, row) => sum + parseFloat(row['% Dollar'] || '0'), 0);
    const totalTaka = exportData.reduce((sum, row) => sum + parseFloat(row['Taka'] || '0'), 0);

    exportData.push({
      'LINE': 'Total',
      'P/COD': '',
      'BUYER': '',
      'ART/NO': '',
      'OR/QTY': totalTargetQty,
      'ITEM': '',
      'DAILY TARGET': 0,
      'DAILY PRODUCTION': totalProductionQty,
      'UNIT PRICE': '',
      'TOTAL PRICE': totalAmount.toFixed(2),
      '%': 0,
      '% Dollar': totalPercentDollar.toFixed(2),
      'Taka': totalTaka.toFixed(0),
      'Remarks': ''
    });

    return exportData;
  };

  // Handler for sending email
  const handleSendEmail = async () => {
    setEmailSending(true);
    try {
      const exportData = generateExportData();
      
      const response = await fetch('/api/daily-production-report/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate.toISOString(),
          reportData: exportData
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('📧 Daily production report sent successfully!');
      } else {
        toast.error(`Failed to send email: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleSendEmail}
      disabled={loading || emailSending || Object.keys(reportsByLine).length === 0}
      className="w-full sm:w-auto flex items-center gap-2 h-9 sm:h-10"
    >
      <IconMail className={`h-4 w-4 ${emailSending ? 'animate-pulse' : ''}`} />
      <span className="hidden sm:inline">
        {emailSending ? 'Sending...' : 'Send Email'}
      </span>
      <span className="sm:hidden">
        {emailSending ? 'Sending...' : 'Email'}
      </span>
    </Button>
  );
}
