'use client';

import { Button } from '@/components/ui/button';
import { IconMail } from '@tabler/icons-react';
import { toast } from 'sonner';
import { DailyProductionReport, ExportDataRow } from './types';
import { format } from 'date-fns';
import { IconBrandWhatsapp } from '@tabler/icons-react';

interface EmailActionsProps {
  reportsByLine: Record<string, DailyProductionReport[]>;
  reportsWithoutLine: DailyProductionReport[];
  selectedDate: Date;
  loading: boolean;
  productionHours: Record<string, number>; // Add production hours prop
}

export function EmailActions({
  reportsByLine,
  reportsWithoutLine,
  selectedDate,
  loading,
  productionHours
}: EmailActionsProps) {
  // Generate tabular data for export (matching your image format)
  const generateExportData = (): ExportDataRow[] => {
    const exportData: ExportDataRow[] = [];

    // Process reports by line
    Object.entries(reportsByLine).forEach(([lineNo, lineReports]) => {
      lineReports.forEach(report => {
        // Calculate targets using production hours: Target Qty × Hours
        const key = `${report.lineNo}-${report.styleNo}`;
        const hours = productionHours[key] || 1;
        const calculatedTargets = (report.targetQty || 0) * hours;
        
        exportData.push({
          'LINE': lineNo,
          'P/COD': report.styleNo,
          'BUYER': report.productionList.buyer,
          'ART/NO': report.styleNo,
          'OR/QTY': calculatedTargets, // Use calculated targets
          'ITEM': report.productionList.item,
          'DAILY TARGET': calculatedTargets, // Use calculated targets
          'DAILY PRODUCTION': report.productionQty,
          'UNIT PRICE': Number(report.unitPrice).toFixed(2),
          'TOTAL PRICE': Number(report.totalAmount).toFixed(2),
          '%': Number(report.productionList.percentage || 0),
          '% Dollar': (Number(report.totalAmount) * Number(report.productionList.percentage || 0) / 100).toFixed(2),
          'Taka': (Number(report.totalAmount) * Number(report.productionList.percentage || 0) / 100 * 120).toFixed(0),
          'Remarks': report.notes || ''
        });
      });
    });

    // Process unassigned reports
    reportsWithoutLine.forEach(report => {
      // Calculate targets for unassigned reports
      const key = `${report.lineNo || 'unassigned'}-${report.styleNo}`;
      const hours = productionHours[key] || 1;
      const calculatedTargets = (report.targetQty || 0) * hours;
      
      exportData.push({
        'LINE': '',
        'P/COD': report.styleNo,
        'BUYER': report.productionList.buyer,
        'ART/NO': report.styleNo,
        'OR/QTY': calculatedTargets, // Use calculated targets
        'ITEM': report.productionList.item,
        'DAILY TARGET': calculatedTargets, // Use calculated targets
        'DAILY PRODUCTION': report.productionQty,
        'UNIT PRICE': Number(report.unitPrice).toFixed(2),
        'TOTAL PRICE': Number(report.totalAmount).toFixed(2),
        '%': Number(report.productionList.percentage || 0),
        '% Dollar': (Number(report.totalAmount) * Number(report.productionList.percentage || 0) / 100).toFixed(2),
        'Taka': (Number(report.totalAmount) * Number(report.productionList.percentage || 0) / 100 * 120).toFixed(0),
        'Remarks': report.notes || ''
      });
    });

    // Add total row
    const totalTargetQty = exportData.reduce((sum, row) => sum + (row['DAILY TARGET'] || 0), 0);
    const totalProductionQty = exportData.reduce((sum, row) => sum + (row['DAILY PRODUCTION'] || 0), 0);
    const totalUnitPrice = exportData.reduce((sum, row) => sum + parseFloat(row['UNIT PRICE'] || '0'), 0);
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
      'UNIT PRICE': totalUnitPrice.toFixed(2),
      'TOTAL PRICE': totalAmount.toFixed(2),
      '%': 0,
      '% Dollar': totalPercentDollar.toFixed(2),
      'Taka': totalTaka.toFixed(0),
      'Remarks': ''
    });

    return exportData;
  };

  // Handler for opening Gmail with pre-filled subject
  const handleOpenGmail = () => {
    try {
      const exportData = generateExportData();
      
      // Calculate summary for email subject
      const totalTargetQty = exportData.reduce((sum, row) => sum + (row['DAILY TARGET'] || 0), 0);
      const totalProductionQty = exportData.reduce((sum, row) => sum + (row['DAILY PRODUCTION'] || 0), 0);
      const totalLines = new Set(exportData.map(row => row['LINE']).filter(Boolean)).size;
      
      // Format date for subject - use "Daily Production Report (date)" format
      const dateString = format(selectedDate, 'dd/MM/yyyy');
      
      // Create email subject with the requested format
      const subject = `Daily Production Report (${dateString})`;
      
      // Create email body with summary
      const body = `Dear Team,

Please find attached the Daily Production Report for ${format(selectedDate, 'EEEE, MMMM dd, yyyy')}.

📊 Summary:
• Total Lines: ${totalLines}
• Total Targets: ${totalTargetQty.toLocaleString()} units
• Total Production: ${totalProductionQty.toLocaleString()} units
• Achievement: ${totalTargetQty > 0 ? Math.round((totalProductionQty / totalTargetQty) * 100) : 0}%

Please review and let me know if you need any clarification.

Best regards,
Production Team`;

      // Encode subject and body for URL
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(body);
      
      // Create Gmail compose URL
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=&su=${encodedSubject}&body=${encodedBody}`;
      
      // Open Gmail in new tab
      window.open(gmailUrl, '_blank');
      
      toast.success('📧 Gmail opened in new tab with pre-filled subject and body!');
      
    } catch (error) {
      console.error('Error opening Gmail:', error);
      toast.error('Failed to open Gmail. Please try again.');
    }
  };

  // Handler for opening WhatsApp with pre-filled message
  const handleOpenWhatsApp = () => {
    try {
      const exportData = generateExportData();
      
      // Format date for message
      const dateString = format(selectedDate, 'dd/MM/yyyy');
      
      // Create very short WhatsApp message focused on file sharing
      const message = `📊 Daily Production Report (${dateString})

📎 Sharing the complete production report file.`;
      
      // Encode message for WhatsApp URL
      const encodedMessage = encodeURIComponent(message);
      
      // Create WhatsApp share URL
      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
      
      // Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank');
      
      toast.success('📱 WhatsApp opened! Please attach your production report file to share.', {
        duration: 5000
      });
      
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      toast.error('Failed to open WhatsApp. Please try again.');
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleOpenGmail}
        disabled={loading || Object.keys(reportsByLine).length === 0}
        className="w-full sm:w-auto flex items-center gap-2 h-9 sm:h-10"
      >
        <IconMail className="h-4 w-4" />
        <span className="hidden sm:inline">
          Gmail
        </span>
        <span className="sm:hidden">
          Gmail
        </span>
      </Button>

      <Button
        variant="outline"
        onClick={handleOpenWhatsApp}
        disabled={loading || Object.keys(reportsByLine).length === 0}
        className="w-full sm:w-auto flex items-center gap-2 h-9 sm:h-10"
      >
        <IconBrandWhatsapp className="h-4 w-4" />
        <span className="hidden sm:inline">
          WhatsApp
        </span>
        <span className="sm:hidden">
          WhatsApp
        </span>
      </Button>
    </div>
  );
}
