'use client';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IconDownload, IconChevronDown, IconFileTypePdf, IconPrinter } from '@tabler/icons-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { DailyProductionReport, ExportDataRow } from './types';

interface ExportActionsProps {
  reportsByLine: Record<string, DailyProductionReport[]>;
  reportsWithoutLine: DailyProductionReport[];
  selectedDate: Date;
  loading: boolean;
}

export function ExportActions({
  reportsByLine,
  reportsWithoutLine,
  selectedDate,
  loading
}: ExportActionsProps) {
  // Generate tabular data for export (matching the email design)
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
          '%': Number(report.productionList.percentage || 0),
          '% Dollar': (Number(report.totalAmount) * Number(report.productionList.percentage || 0) / 100).toFixed(2),
          'Taka': (Number(report.totalAmount) * Number(report.productionList.percentage || 0) / 100 * 120).toFixed(0),
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
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 1200px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .email-container {
              background-color: white;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: bold;
            }
            .header .date {
              font-size: 18px;
              margin-top: 10px;
              opacity: 0.9;
            }
            .content {
              padding: 30px;
            }
            .table-section {
              margin-top: 30px;
            }
            .table-title {
              font-size: 20px;
              font-weight: bold;
              color: #495057;
              margin-bottom: 15px;
              border-bottom: 2px solid #e9ecef;
              padding-bottom: 10px;
            }
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              font-size: 12px;
              background-color: white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              border-radius: 8px;
              overflow: hidden;
            }
            .data-table th {
              background-color: #495057;
              color: white;
              padding: 12px 8px;
              text-align: center;
              font-weight: bold;
              font-size: 11px;
              border-bottom: 2px solid #343a40;
            }
            .data-table td {
              padding: 10px 8px;
              border-bottom: 1px solid #dee2e6;
              text-align: center;
            }
            .data-table tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            .data-table tr:hover {
              background-color: #e3f2fd;
            }
            .total-row {
              background-color: #fff3cd !important;
              font-weight: bold;
              border-top: 2px solid #ffc107;
            }
            .total-row td {
              border-bottom: 2px solid #ffc107;
            }
            .line-cell { color: #007bff; font-weight: bold; }
            .code-cell { color: #28a745; font-weight: bold; }
            .buyer-cell { text-align: left; font-weight: 600; }
            .qty-cell { color: #6f42c1; font-weight: bold; }
            .target-cell { color: #28a745; background-color: #d4edda; }
            .production-cell { color: #dc3545; background-color: #f8d7da; }
            .price-cell { color: #fd7e14; }
            .percentage-cell { color: #007bff; background-color: #cce7ff; }
            .taka-cell { color: #dc3545; font-weight: bold; }
            .footer {
              background-color: #495057;
              color: white;
              padding: 20px;
              text-align: center;
              font-size: 14px;
            }
            .footer-info {
              opacity: 0.8;
              margin-top: 10px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>📊 Daily Production Report</h1>
              <div class="date">📅 ${dateString}</div>
            </div>
            
            <div class="content">
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
                      <th>UNIT PRICE</th>
                      <th>TOTAL PRICE</th>
                      <th>%</th>
                      <th>% Dollar</th>
                      <th>Taka</th>
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
                Generated on ${new Date().toLocaleString()} | Automated Daily Report
              </div>
            </div>
          </div>
          
          <div class="no-print" style="text-align: center; margin-top: 30px;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">Print/Save as PDF</button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
