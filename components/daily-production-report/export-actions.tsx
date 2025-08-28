'use client';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IconDownload, IconChevronDown, IconFileTypePdf, IconPrinter, IconMail, IconBrandWhatsapp } from '@tabler/icons-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { DailyProductionReport, ExportDataRow } from './types';

interface ExportActionsProps {
  reportsByLine: Record<string, DailyProductionReport[]>;
  reportsWithoutLine: DailyProductionReport[];
  selectedDate: Date;
  loading: boolean;
  productionHours: Record<string, number>; // Add production hours prop
}

export function ExportActions({
  reportsByLine,
  reportsWithoutLine,
  selectedDate,
  loading,
  productionHours
}: ExportActionsProps) {
  // Generate tabular data for export (matching the email design)
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

  // Export to PDF function with email design matching
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to export PDF');
      return;
    }

    const dateString = format(selectedDate, 'dd/MM/yyyy');
    const exportData = generateExportData();
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Daily Production Report - ${dateString}</title>
          <style>
            @page {
              margin: 15mm;
              size: A4 landscape;
            }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.4;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: white;
            }
            .email-container {
              background-color: white;
              width: 100%;
              max-width: none;
            }
            .header {
              background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
              color: white;
              padding: 20px 30px;
              text-align: center;
              border-bottom: 3px solid #1e3a8a;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
              font-weight: 800;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
              letter-spacing: 1px;
            }
            .header .date {
              font-size: 20px;
              margin-top: 8px;
              opacity: 0.95;
              font-weight: 600;
            }
            .header .company-info {
              font-size: 14px;
              margin-top: 8px;
              opacity: 0.9;
              font-weight: 500;
            }
            .content {
              padding: 20px 30px;
            }
            .table-section {
              margin-top: 20px;
            }
            .table-title {
              font-size: 18px;
              font-weight: 700;
              color: #1e40af;
              margin-bottom: 12px;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 0;
              font-size: 11px;
              background-color: white;
              border: 2px solid #1e40af;
              border-radius: 6px;
              overflow: hidden;
            }
            .data-table th {
              background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
              color: white;
              padding: 10px 6px;
              text-align: center;
              font-weight: 700;
              font-size: 10px;
              border: 1px solid #1e3a8a;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              vertical-align: middle;
            }
            .data-table td {
              padding: 8px 6px;
              border: 1px solid #d1d5db;
              text-align: center;
              vertical-align: middle;
              line-height: 1.2;
            }
            .data-table tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .data-table tr:nth-child(odd) {
              background-color: white;
            }
            .data-table tr:hover {
              background-color: #eff6ff;
            }
            .total-row {
              background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%) !important;
              font-weight: 800;
              border-top: 2px solid #d97706;
              color: #000000;
            }
            .total-row td {
              border: 1px solid #d97706;
              font-weight: 800;
            }
            .line-cell { 
              color: #000000; 
              font-weight: 700; 
              background-color: #dbeafe;
            }
            .code-cell { 
              color: #000000; 
              font-weight: 700; 
              background-color: #d1fae5;
            }
            .buyer-cell { 
              text-align: left; 
              font-weight: 600; 
              background-color: #fef3c7;
              color: #000000;
            }
            .qty-cell { 
              color: #000000; 
              font-weight: 700; 
              background-color: #ede9fe;
            }
            .target-cell { 
              color: #000000; 
              background-color: #d1fae5; 
              font-weight: 600;
            }
            .production-cell { 
              color: #000000; 
              background-color: #fee2e2; 
              font-weight: 600;
            }
            .price-cell { 
              color: #000000; 
              background-color: #fed7aa;
              font-weight: 600;
            }
            .percentage-cell { 
              color: #000000; 
              background-color: #dbeafe; 
              font-weight: 600;
            }
            .taka-cell { 
              color: #000000; 
              font-weight: 800; 
              background-color: #fecaca;
            }
            .footer {
              background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
              color: white;
              padding: 15px 30px;
              text-align: center;
              font-size: 12px;
              border-top: 3px solid #4b5563;
              margin-top: 20px;
            }
            .footer-info {
              opacity: 0.8;
              margin-top: 8px;
              font-size: 11px;
            }
            .summary-section {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 15px;
              margin-bottom: 20px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin-top: 10px;
            }
            .summary-item {
              background-color: white;
              padding: 10px;
              border-radius: 4px;
              border-left: 4px solid #3b82f6;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .summary-label {
              font-size: 11px;
              color: #6b7280;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .summary-value {
              font-size: 16px;
              color: #1f2937;
              font-weight: 700;
              margin-top: 4px;
            }
            @media print {
              body { 
                margin: 0; 
                padding: 0;
              }
              .no-print { 
                display: none; 
              }
              .email-container {
                box-shadow: none;
              }
              .data-table {
                page-break-inside: avoid;
              }
              .data-table tr {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>🏭 EKUSHE FASHIONS LTD</h1>
              <div class="date">📅 Daily Production Report - ${dateString}</div>
              <div class="company-info">Factory: Masterbari, Gazipur City, Gazipur | Production Management System</div>
            </div>
            
            <div class="content">
              <div class="summary-section">
                <div class="table-title">📊 Production Summary</div>
                <div class="summary-grid">
                  <div class="summary-item">
                    <div class="summary-label">Total Lines</div>
                    <div class="summary-value">${Object.keys(reportsByLine).length}</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-label">Total Styles</div>
                    <div class="summary-value">${new Set(exportData.filter(row => row['P/COD']).map(row => row['P/COD'])).size}</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-label">Total Target</div>
                    <div class="summary-value">${exportData.filter(row => row['LINE'] !== 'Total').reduce((sum, row) => sum + (row['DAILY TARGET'] || 0), 0).toLocaleString()}</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-label">Total Production</div>
                    <div class="summary-value">${exportData.filter(row => row['LINE'] !== 'Total').reduce((sum, row) => sum + (row['DAILY PRODUCTION'] || 0), 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div class="table-section">
                <div class="table-title">📋 Production Details</div>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>LINE</th>
                      <th>P/COD</th>
                      <th>BUYER</th>
                      <th>ART/NO</th>
                      <th>OR/QTY</th>
                      <th>ITEM</th>
                      <th>DAILY<br/>TARGET</th>
                      <th>DAILY<br/>PRODUCTION</th>
                      <th>UNIT<br/>PRICE</th>
                      <th>TOTAL<br/>PRICE</th>
                      <th>%</th>
                      <th>% DOLLAR</th>
                      <th>TAKA</th>
                      <th>REMARKS</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${exportData.map((row) => {
                      const isTotal = row['LINE'] === 'Total';
                      return `
                        <tr ${isTotal ? 'class="total-row"' : ''}>
                          <td class="line-cell">${row['LINE'] || ''}</td>
                          <td class="code-cell">${row['P/COD'] || ''}</td>
                          <td class="buyer-cell">${row['BUYER'] || ''}</td>
                          <td class="code-cell">${row['ART/NO'] || ''}</td>
                          <td class="qty-cell">${row['OR/QTY'] ? row['OR/QTY'].toLocaleString() : ''}</td>
                          <td class="buyer-cell">${row['ITEM'] || ''}</td>
                          <td class="target-cell">${row['DAILY TARGET'] ? row['DAILY TARGET'].toLocaleString() : ''}</td>
                          <td class="production-cell">${row['DAILY PRODUCTION'] ? row['DAILY PRODUCTION'].toLocaleString() : ''}</td>
                          <td class="price-cell">$${row['UNIT PRICE'] || ''}</td>
                          <td class="price-cell">$${row['TOTAL PRICE'] || ''}</td>
                          <td class="percentage-cell">${row['%'] || ''}</td>
                          <td class="price-cell">$${row['% Dollar'] || ''}</td>
                          <td class="taka-cell">${row['Taka'] ? row['Taka'].toLocaleString() : ''}</td>
                          <td class="buyer-cell">${row['Remarks'] || ''}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div class="footer">
              <div>🏭 Production Management System</div>
              <div class="footer-info">
                Generated on ${new Date().toLocaleString()} | Automated Daily Report | EKUSHE FASHIONS LTD
              </div>
            </div>
          </div>
          
          <div class="no-print" style="text-align: center; margin-top: 30px; padding: 20px;">
            <button onclick="window.print()" style="padding: 12px 24px; background: #1e40af; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 15px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">🖨️ Print/Save as PDF</button>
            <button onclick="window.close()" style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">❌ Close</button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    toast.success('PDF export window opened successfully. Use Print/Save as PDF to download.');
  };

  // Print function
  const handlePrint = () => {
    handleExportPDF(); // Use the same PDF format for printing
  };

  // Share PDF via Gmail function
  const handleSharePDF = async () => {
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

📎 The PDF report is attached to this email.

Please review and let me know if you need any clarification.

Best regards,
Production Team`;

      // First generate the PDF content
      const pdfContent = generatePDFContent(exportData, dateString);
      
      // Create a blob from the PDF content
      const blob = new Blob([pdfContent], { type: 'text/html' });
      
      // Create a temporary URL for the blob
      const pdfUrl = URL.createObjectURL(blob);
      
      // Encode subject and body for URL
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(body);
      
      // Create Gmail compose URL with attachment hint
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=&su=${encodedSubject}&body=${encodedBody}`;
      
      // Open Gmail in new tab
      const gmailWindow = window.open(gmailUrl, '_blank');
      
      // Show instructions for manual PDF attachment
      toast.success('📧 Gmail opened! Please manually attach the PDF report.', {
        duration: 5000,
        action: {
          label: 'Download PDF',
          onClick: () => {
            // Create download link for PDF
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = `Daily_Production_Report_${dateString.replace(/\//g, '-')}.html`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.success('📄 PDF downloaded! You can now attach it to the Gmail.');
          }
        }
      });
      
    } catch (error) {
      console.error('Error opening Gmail for sharing:', error);
      toast.error('Failed to open Gmail. Please try again.');
    }
  };

  // Share via WhatsApp function
  const handleShareWhatsApp = async () => {
    try {
      const exportData = generateExportData();
      const dateString = format(selectedDate, 'dd/MM/yyyy');
      
      // Generate PDF content first
      const pdfContent = generatePDFContent(exportData, dateString);
      
      // Create a blob from the PDF content
      const blob = new Blob([pdfContent], { type: 'text/html' });
      
      // Create a temporary URL for the blob
      const pdfUrl = URL.createObjectURL(blob);
      
      // Create a very short WhatsApp message focused on file sharing
      const message = `📊 Daily Production Report (${dateString})

📎 Sharing the complete production report file.`;
      
      // Encode message for WhatsApp URL
      const encodedMessage = encodeURIComponent(message);
      
      // Create WhatsApp share URL
      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
      
      // First download the PDF file automatically
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `Daily_Production_Report_${dateString.replace(/\//g, '-')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message with PDF download confirmation
      toast.success('📄 PDF downloaded successfully!', {
        duration: 3000
      });
      
      // Wait a moment then open WhatsApp
      setTimeout(() => {
        // Open WhatsApp in new tab
        window.open(whatsappUrl, '_blank');
        
        toast.success('📱 WhatsApp opened! Now attach the downloaded PDF file to share the complete report.', {
          duration: 8000,
          action: {
            label: 'Download PDF Again',
            onClick: () => {
              const link = document.createElement('a');
              link.href = pdfUrl;
              link.download = `Daily_Production_Report_${dateString.replace(/\//g, '-')}.html`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              toast.success('📄 PDF downloaded again!');
            }
          }
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error sharing via WhatsApp:', error);
      toast.error('Failed to share via WhatsApp. Please try again.');
    }
  };

  // Share via WhatsApp Desktop function
  const handleShareWhatsAppDesktop = () => {
    const dateString = format(selectedDate, 'dd/MM/yyyy');
    const exportData = generateExportData();
    const pdfContent = generatePDFContent(exportData, dateString);
    const blob = new Blob([pdfContent], { type: 'text/html' });
    const pdfUrl = URL.createObjectURL(blob);

    const message = `📊 Daily Production Report (${dateString})

📎 Sharing the complete production report file.`;
    const encodedMessage = encodeURIComponent(message);

    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `Daily_Production_Report_${dateString.replace(/\//g, '-')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('📄 PDF downloaded successfully! Please open WhatsApp Desktop to share the file.');
  };

  // Native Web Share function
  const handleNativeShare = async () => {
    try {
      const exportData = generateExportData();
      const dateString = format(selectedDate, 'dd/MM/yyyy');
      const pdfContent = generatePDFContent(exportData, dateString);
      const blob = new Blob([pdfContent], { type: 'text/html' });
      const pdfUrl = URL.createObjectURL(blob);

      await navigator.share({
        title: `Daily Production Report - ${dateString}`,
        text: `📊 Daily Production Report (${dateString})

📎 Sharing the complete production report file.`,
        url: pdfUrl,
      });

      toast.success('📄 PDF shared successfully via Native Web Share!');
    } catch (error) {
      console.error('Error sharing via Native Web Share:', error);
      toast.error('Failed to share via Native Web Share. Please try again.');
    }
  };

  // Generate PDF content function
  const generatePDFContent = (exportData: ExportDataRow[], dateString: string) => {
    const rows = exportData.map(row => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row['LINE'] || ''}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row['P/COD'] || ''}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${row['BUYER'] || ''}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row['ART/NO'] || ''}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${row['OR/QTY'] || ''}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${row['ITEM'] || ''}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${row['DAILY TARGET'] || ''}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${row['DAILY PRODUCTION'] || ''}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${row['UNIT PRICE'] || ''}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${row['TOTAL PRICE'] || ''}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row['%'] || ''}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${row['% Dollar'] || ''}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${row['Taka'] || ''}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${row['Remarks'] || ''}</td>
      </tr>
    `).join('');

    // Calculate summary for the header
    const totalTargetQty = exportData.filter(row => row['LINE'] !== 'Total').reduce((sum, row) => sum + (row['DAILY TARGET'] || 0), 0);
    const totalProductionQty = exportData.filter(row => row['LINE'] !== 'Total').reduce((sum, row) => sum + (row['DAILY PRODUCTION'] || 0), 0);
    const totalLines = new Set(exportData.filter(row => row['LINE'] && row['LINE'] !== 'Total').map(row => row['LINE'])).size;
    const achievement = totalTargetQty > 0 ? Math.round((totalProductionQty / totalTargetQty) * 100) : 0;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Daily Production Report - ${dateString}</title>
        <style>
          @page {
            margin: 15mm;
            size: A4 landscape;
          }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: white;
          }
          .header {
            background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
            color: white;
            padding: 20px 30px;
            text-align: center;
            border-bottom: 3px solid #1e3a8a;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 800;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            letter-spacing: 1px;
          }
          .header .date {
            font-size: 20px;
            margin-top: 8px;
            opacity: 0.95;
            font-weight: 600;
          }
          .header .company-info {
            font-size: 14px;
            margin-top: 8px;
            opacity: 0.9;
            font-weight: 500;
          }
          .summary-section {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 20px 30px;
            border-bottom: 1px solid #e2e8f0;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-top: 15px;
          }
          .summary-item {
            background: white;
            padding: 20px 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
            border: 1px solid #e2e8f0;
          }
          .summary-label {
            font-size: 12px;
            color: #6b7280;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          .summary-value {
            font-size: 24px;
            font-weight: 800;
            color: #1e293b;
            margin-bottom: 5px;
          }
          .summary-unit {
            font-size: 11px;
            color: #9ca3af;
            font-weight: 500;
          }
          .content {
            padding: 20px 30px;
          }
          .table-section {
            margin-top: 20px;
          }
          .table-title {
            font-size: 18px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 12px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 0;
            font-size: 11px;
            background-color: white;
            border: 2px solid #1e40af;
            border-radius: 6px;
            overflow: hidden;
          }
          .data-table th {
            background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
            color: white;
            padding: 10px 6px;
            text-align: center;
            font-weight: 700;
            font-size: 10px;
            border: 1px solid #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            vertical-align: middle;
          }
          .data-table td {
            padding: 8px 6px;
            border: 1px solid #d1d5db;
            text-align: center;
            vertical-align: middle;
            line-height: 1.2;
          }
          .data-table tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .data-table tr:nth-child(odd) {
            background-color: white;
          }
          .data-table tr:hover {
            background-color: #eff6ff;
          }
          .total-row {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%) !important;
            font-weight: 800;
            border-top: 2px solid #d97706;
            color: #000000;
          }
          .total-row td {
            border: 1px solid #d97706;
            font-weight: 800;
          }
          .line-cell { 
            color: #000000; 
            font-weight: 700; 
            background-color: #dbeafe;
          }
          .code-cell { 
            color: #000000; 
            font-weight: 700; 
            background-color: #d1fae5;
          }
          .buyer-cell { 
            text-align: left; 
            font-weight: 600; 
            background-color: #fef3c7;
            color: #000000;
          }
          .qty-cell { 
            color: #000000; 
            font-weight: 700; 
            background-color: #ede9fe;
          }
          .target-cell { 
            color: #000000; 
            background-color: #d1fae5; 
            font-weight: 600;
          }
          .production-cell { 
            color: #000000; 
            background-color: #fee2e2; 
            font-weight: 600;
          }
          .price-cell { 
            color: #000000; 
            background-color: #fed7aa;
            font-weight: 600;
          }
          .percentage-cell { 
            color: #000000; 
            background-color: #dbeafe; 
            font-weight: 600;
          }
          .taka-cell { 
            color: #000000; 
            font-weight: 800; 
            background-color: #fecaca;
          }
          .footer {
            background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
            color: white;
            padding: 15px 30px;
            text-align: center;
            font-size: 12px;
            border-top: 3px solid #4b5563;
            margin-top: 20px;
          }
          .footer-info {
            opacity: 0.8;
            margin-top: 8px;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏭 EKUSHE FASHIONS LTD</h1>
          <div class="date">📅 Daily Production Report</div>
          <div class="company-info">${format(selectedDate, 'EEEE, MMMM dd, yyyy')}</div>
        </div>
        
        <div class="summary-section">
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Total Lines</div>
              <div class="summary-value">${totalLines}</div>
              <div class="summary-unit">Active Lines</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Targets</div>
              <div class="summary-value">${totalTargetQty.toLocaleString()}</div>
              <div class="summary-unit">Units</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Production</div>
              <div class="summary-value">${totalProductionQty.toLocaleString()}</div>
              <div class="summary-unit">Units</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Achievement</div>
              <div class="summary-value">${achievement}%</div>
              <div class="summary-unit">Target Met</div>
            </div>
          </div>
        </div>
        
        <div class="content">
          <div class="table-section">
            <div class="table-title">📋 Production Details</div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>LINE</th>
                    <th>P/COD</th>
                    <th>BUYER</th>
                    <th>ART/NO</th>
                    <th>OR/QTY</th>
                    <th>ITEM</th>
                    <th>DAILY<br/>TARGET</th>
                    <th>DAILY<br/>PRODUCTION</th>
                    <th>UNIT<br/>PRICE</th>
                    <th>TOTAL<br/>PRICE</th>
                    <th>%</th>
                    <th>% DOLLAR</th>
                    <th>TAKA</th>
                    <th>REMARKS</th>
                  </tr>
                </thead>
                <tbody>
                  ${exportData.map((row) => {
                    const isTotal = row['LINE'] === 'Total';
                    return `
                      <tr ${isTotal ? 'class="total-row"' : ''}>
                        <td class="line-cell">${row['LINE'] || ''}</td>
                        <td class="code-cell">${row['P/COD'] || ''}</td>
                        <td class="buyer-cell">${row['BUYER'] || ''}</td>
                        <td class="code-cell">${row['ART/NO'] || ''}</td>
                        <td class="qty-cell">${row['OR/QTY'] ? row['OR/QTY'].toLocaleString() : ''}</td>
                        <td class="buyer-cell">${row['ITEM'] || ''}</td>
                        <td class="target-cell">${row['DAILY TARGET'] ? row['DAILY TARGET'].toLocaleString() : ''}</td>
                        <td class="production-cell">${row['DAILY PRODUCTION'] ? row['DAILY PRODUCTION'].toLocaleString() : ''}</td>
                        <td class="price-cell">$${row['UNIT PRICE'] || ''}</td>
                        <td class="price-cell">$${row['TOTAL PRICE'] || ''}</td>
                        <td class="percentage-cell">${row['%'] || ''}</td>
                        <td class="price-cell">$${row['% Dollar'] || ''}</td>
                        <td class="taka-cell">৳${row['Taka'] ? row['Taka'].toLocaleString() : ''}</td>
                        <td class="buyer-cell">${row['Remarks'] || ''}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <div>🏭 Production Management System</div>
          <div class="footer-info">
            Generated on ${new Date().toLocaleString()} | Automated Daily Report | EKUSHE FASHIONS LTD
          </div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={loading || Object.keys(reportsByLine).length === 0}
          className="w-full sm:w-auto flex items-center gap-2 h-9 sm:h-10"
        >
          <IconDownload className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
          <span className="sm:hidden">Export</span>
          <IconChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleExportPDF} className="flex items-center gap-2">
          <IconFileTypePdf className="h-4 w-4 text-red-600" />
          <span>Export to PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrint} className="flex items-center gap-2">
          <IconPrinter className="h-4 w-4 text-blue-600" />
          <span>Print Report</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSharePDF} className="flex items-center gap-2">
          <IconMail className="h-4 w-4 text-green-600" />
          <span>Share via Gmail</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareWhatsAppDesktop} className="flex items-center gap-2">
          <IconBrandWhatsapp className="h-4 w-4 text-green-600" />
          <span>Share via WhatsApp Desktop</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareWhatsApp} className="flex items-center gap-2">
          <IconBrandWhatsapp className="h-4 w-4 text-green-500" />
          <span>Share via WhatsApp Web</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleNativeShare} className="flex items-center gap-2">
          <IconBrandWhatsapp className="h-4 w-4 text-blue-600" />
          <span>Share via Native Web Share</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
