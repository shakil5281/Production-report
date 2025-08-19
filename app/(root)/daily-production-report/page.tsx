'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  IconCalendar, 
  IconRefresh, 
  IconSearch, 
  IconTrendingUp, 
  IconTarget,
  IconCurrency,
  IconClipboardList,
  IconActivity,
  IconDownload,
  IconPrinter,
  IconEye,
  IconChevronDown,
  IconFileTypeXls,
  IconFileTypePdf,
  IconMail
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface DailyProductionReport {
  id: string;
  date: string;
  styleNo: string;
  targetQty: number;
  productionQty: number;
  unitPrice: number;
  totalAmount: number;
  netAmount: number;
  lineNo: string | null;
  notes: string | null;
  productionList: {
    buyer: string;
    item: string;
    price: number;
    totalQty: number;
  };
}

interface ProductionSummary {
  totalReports: number;
  totalTargetQty: number;
  totalProductionQty: number;
  totalAmount: number;
  totalNetAmount: number;
  averageEfficiency: number;
  totalLines: number;
  linesWithProduction: number;
}

interface LineSummary {
  lineNo: string;
  totalReports: number;
  totalTargetQty: number;
  totalProductionQty: number;
  totalAmount: number;
  totalNetAmount: number;
  averageEfficiency: number;
}

// Production Report View Sheet Component
function ProductionReportViewSheet({ 
  report, 
  lineNo, 
  open, 
  onOpenChange 
}: { 
  report: DailyProductionReport | null; 
  lineNo?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!report) return null;

  const efficiency = report.targetQty > 0 ? ((report.productionQty / report.targetQty) * 100) : 0;
  const getEfficiencyVariant = () => {
    if (efficiency >= 100) return 'default';
    if (efficiency >= 80) return 'secondary';
    if (efficiency >= 60) return 'outline';
    return 'destructive';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:w-[500px] overflow-y-auto">
        <SheetHeader className="space-y-3">
          <SheetTitle className="flex items-center gap-2">
            <IconClipboardList className="h-5 w-5" />
            Production Report Details
          </SheetTitle>
          <SheetDescription>
            Complete production information for {report.styleNo}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Basic Information */}
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="font-medium">{report.styleNo}</Badge>
                {lineNo && <Badge variant="secondary">Line {lineNo}</Badge>}
                <Badge variant={getEfficiencyVariant() as any}>
                  {efficiency.toFixed(1)}% Efficiency
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Buyer</div>
                  <div className="text-sm font-medium">{report.productionList.buyer}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Item</div>
                  <div className="text-sm">{report.productionList.item}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Date</div>
                  <div className="text-sm">{format(new Date(report.date), 'PPP')}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Production Metrics */}
          <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300">
                Production Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                  <div className="text-xs font-medium text-muted-foreground">Target Quantity</div>
                  <div className="text-lg font-bold font-mono text-blue-600">
                    {report.targetQty.toLocaleString()}
                  </div>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                  <div className="text-xs font-medium text-muted-foreground">Production Quantity</div>
                  <div className="text-lg font-bold font-mono text-green-600">
                    {report.productionQty.toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Efficiency Rate</span>
                  <Badge variant={getEfficiencyVariant() as any} className="font-mono">
                    {efficiency.toFixed(1)}%
                  </Badge>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={cn(
                      "h-2 rounded-full transition-all",
                      efficiency >= 100 ? "bg-green-500" :
                      efficiency >= 80 ? "bg-blue-500" :
                      efficiency >= 60 ? "bg-yellow-500" : "bg-red-500"
                    )}
                    style={{ width: `${Math.min(100, efficiency)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex justify-between items-center p-2 bg-white/50 dark:bg-gray-900/50 rounded">
                  <span className="text-xs font-medium text-muted-foreground">Unit Price</span>
                  <span className="font-mono font-medium">${Number(report.unitPrice).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white/50 dark:bg-gray-900/50 rounded">
                  <span className="text-xs font-medium text-muted-foreground">Total Amount (USD)</span>
                  <span className="font-mono font-medium">${Number(report.totalAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-100/50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                  <span className="text-xs font-semibold text-green-700 dark:text-green-300">Net Amount (BDT)</span>
                  <span className="font-mono font-bold text-green-600">{Number(report.netAmount).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Section */}
          {report.notes && (
            <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm bg-white/50 dark:bg-gray-900/50 p-3 rounded border">
                  {report.notes}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function DailyProductionReportPage() {
  const [reports, setReports] = useState<DailyProductionReport[]>([]);
  const [reportsByLine, setReportsByLine] = useState<Record<string, DailyProductionReport[]>>({});
  const [reportsWithoutLine, setReportsWithoutLine] = useState<DailyProductionReport[]>([]);
  const [lineSummaries, setLineSummaries] = useState<Record<string, LineSummary>>({});
  const [summary, setSummary] = useState<ProductionSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lineFilter, setLineFilter] = useState<string>('all');
  const [styleFilter, setStyleFilter] = useState<string>('');
  const [viewingReport, setViewingReport] = useState<DailyProductionReport | null>(null);
  const [viewingLineNo, setViewingLineNo] = useState<string>('');
  const [emailSending, setEmailSending] = useState(false);
  const isMobile = useIsMobile();

  // Handler for viewing report details
  const handleViewReport = (report: DailyProductionReport, lineNo?: string) => {
    setViewingReport(report);
    setViewingLineNo(lineNo || '');
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
          reportData: exportData,
          summary: summary
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

  // Fetch reports for the selected date
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // Format date as YYYY-MM-DD in local timezone to avoid timezone issues
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      params.set('date', dateString);
      
      // Debug log to verify correct date formatting
      console.log(`📅 Fetching reports for date: ${dateString} (Selected: ${selectedDate.toDateString()})`);
      
      if (lineFilter !== 'all') {
        params.set('lineNo', lineFilter);
      }
      
      if (styleFilter) {
        params.set('styleNo', styleFilter);
      }

      const response = await fetch(`/api/daily-production-report?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setReports(data.data.allReports || []);
        setReportsByLine(data.data.reportsByLine || {});
        setReportsWithoutLine(data.data.reportsWithoutLine || []);
        setLineSummaries(data.data.lineSummaries || {});
        setSummary(data.data.overallSummary || null);
      } else {
        toast.error(data.error || 'Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, lineFilter, styleFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Get efficiency badge variant
  const getEfficiencyBadge = (target: number, production: number) => {
    const efficiency = target > 0 ? (production / target) * 100 : 0;
    const safeEfficiency = isNaN(efficiency) ? 0 : efficiency;
    if (safeEfficiency >= 100) return { variant: 'default', text: `${safeEfficiency.toFixed(1)}%` };
    if (safeEfficiency >= 80) return { variant: 'secondary', text: `${safeEfficiency.toFixed(1)}%` };
    if (safeEfficiency >= 60) return { variant: 'outline', text: `${safeEfficiency.toFixed(1)}%` };
    return { variant: 'destructive', text: `${safeEfficiency.toFixed(1)}%` };
  };

  // Get unique line numbers for filter
  const uniqueLines = Array.from(new Set([
    ...Object.keys(reportsByLine),
    ...reports.map(r => r.lineNo).filter(Boolean)
  ])).sort();

  // Get all reports with notes for the notes section
  const reportsWithNotes = reports.filter(r => r.notes);

  // Generate tabular data for export (matching your image format)
  const generateExportData = () => {
    const exportData: any[] = [];
    let counter = 1;

    // Process reports by line
    Object.entries(reportsByLine).forEach(([lineNo, lineReports]) => {
      lineReports.forEach(report => {
        const efficiency = report.targetQty > 0 ? ((report.productionQty / report.targetQty) * 100) : 0;
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
          '%': efficiency.toFixed(0) + '%',
          '% Dollar': Number(report.totalAmount).toFixed(2),
          'Taka': Number(report.netAmount),
          'Remarks': report.notes || ''
        });
        counter++;
      });
    });

    // Process unassigned reports
    reportsWithoutLine.forEach(report => {
      const efficiency = report.targetQty > 0 ? ((report.productionQty / report.targetQty) * 100) : 0;
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
        '%': efficiency.toFixed(0) + '%',
        '% Dollar': Number(report.totalAmount).toFixed(2),
        'Taka': Number(report.netAmount),
        'Remarks': report.notes || ''
      });
      counter++;
    });

    // Add total row
    const totalTargetQty = exportData.reduce((sum, row) => sum + (row['DAILY TARGET'] || 0), 0);
    const totalProductionQty = exportData.reduce((sum, row) => sum + (row['DAILY PRODUCTION'] || 0), 0);
    const totalAmount = exportData.reduce((sum, row) => sum + parseFloat(row['TOTAL PRICE'] || 0), 0);
    const totalTaka = exportData.reduce((sum, row) => sum + (row['Taka'] || 0), 0);

    exportData.push({
      'LINE': '',
      'P/COD': '',
      'BUYER': '',
      'ART/NO': '',
      'OR/QTY': totalTargetQty,
      'ITEM': 'Total',
      'DAILY TARGET': '',
      'DAILY PRODUCTION': totalProductionQty,
      'UNIT PRICE': '',
      'TOTAL PRICE': totalAmount.toFixed(2),
      '%': '',
      '% Dollar': totalAmount.toFixed(2),
      'Taka': totalTaka,
      'Remarks': ''
    });

    return exportData;
  };

  // Export to Excel function with enhanced design
  const handleExportExcel = () => {
    try {
      const exportData = generateExportData();
      const dateString = format(selectedDate, 'dd/MM/yyyy');
      
      // Create enhanced HTML table for Excel with proper styling
      const htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <meta name="ProgId" content="Excel.Sheet" />
          <meta name="Generator" content="Microsoft Excel" />
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Daily Production Report</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                    <x:Print>
                      <x:ValidPrinterInfo/>
                      <x:HorizontalResolution>600</x:HorizontalResolution>
                      <x:VerticalResolution>600</x:VerticalResolution>
                    </x:Print>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <style>
            .report-title {
              font-family: 'Calibri', Arial, sans-serif;
              font-size: 18pt;
              font-weight: bold;
              color: #1f4e79;
              text-align: center;
              background-color: #e7f3ff;
              border: 2px solid #4a90e2;
              padding: 8px;
              margin-bottom: 5px;
            }
            .date-info {
              font-family: 'Calibri', Arial, sans-serif;
              font-size: 12pt;
              font-weight: bold;
              color: #d32f2f;
              text-align: right;
              background-color: #fff3e0;
              border: 1px solid #ff9800;
              padding: 5px;
              margin-bottom: 10px;
            }
            .data-table {
              font-family: 'Calibri', Arial, sans-serif;
              border-collapse: collapse;
              width: 100%;
              font-size: 10pt;
              margin-top: 10px;
            }
            .header-row {
              background-color: #4a90e2;
              color: white;
              font-weight: bold;
              font-size: 9pt;
              text-align: center;
              height: 40px;
            }
            .header-cell {
              border: 2px solid #2c5282;
              padding: 8px 4px;
              vertical-align: middle;
              white-space: nowrap;
            }
            .data-row {
              height: 25px;
            }
            .data-row:nth-child(even) {
              background-color: #f8f9fa;
            }
            .data-row:nth-child(odd) {
              background-color: #ffffff;
            }
            .data-cell {
              border: 1px solid #dee2e6;
              padding: 4px 6px;
              vertical-align: middle;
              font-size: 9pt;
            }
            .line-cell {
              text-align: center;
              font-weight: bold;
              color: #1565c0;
              width: 50px;
            }
            .code-cell {
              text-align: center;
              font-weight: bold;
              color: #2e7d32;
              width: 80px;
            }
            .buyer-cell {
              text-align: left;
              font-weight: 600;
              color: #424242;
              width: 120px;
            }
            .art-cell {
              text-align: center;
              font-weight: bold;
              color: #f57c00;
              width: 80px;
            }
            .qty-cell {
              text-align: right;
              font-weight: bold;
              color: #1976d2;
              width: 80px;
            }
            .item-cell {
              text-align: left;
              color: #424242;
              width: 120px;
            }
            .target-cell {
              text-align: right;
              font-weight: bold;
              color: #388e3c;
              background-color: #e8f5e8;
              width: 90px;
            }
            .production-cell {
              text-align: right;
              font-weight: bold;
              color: #d32f2f;
              background-color: #ffebee;
              width: 90px;
            }
            .price-cell {
              text-align: right;
              font-weight: 600;
              color: #7b1fa2;
              width: 80px;
            }
            .total-price-cell {
              text-align: right;
              font-weight: bold;
              color: #e65100;
              background-color: #fff3e0;
              width: 90px;
            }
            .percentage-cell {
              text-align: center;
              font-weight: bold;
              color: #1565c0;
              background-color: #e3f2fd;
              width: 60px;
            }
            .dollar-cell {
              text-align: right;
              font-weight: bold;
              color: #2e7d32;
              background-color: #e8f5e8;
              width: 80px;
            }
            .taka-cell {
              text-align: right;
              font-weight: bold;
              color: #c62828;
              background-color: #ffebee;
              width: 100px;
            }
            .remarks-cell {
              text-align: left;
              color: #424242;
              width: 150px;
            }
            .total-row {
              background-color: #ffd54f !important;
              font-weight: bold;
              color: #e65100;
              font-size: 10pt;
              border-top: 3px solid #ff8f00;
              border-bottom: 3px solid #ff8f00;
            }
            .total-row .data-cell {
              border: 2px solid #ff8f00;
              font-weight: bold;
            }
            .company-info {
              font-family: 'Calibri', Arial, sans-serif;
              font-size: 8pt;
              color: #666;
              text-align: center;
              margin-top: 20px;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="report-title">📊 DAILY PRODUCTION REPORT</div>
          <div class="date-info">📅 DATE: ${dateString}</div>
          
          <table class="data-table">
            <thead>
              <tr class="header-row">
                <th class="header-cell">LINE</th>
                <th class="header-cell">P/COD</th>
                <th class="header-cell">BUYER</th>
                <th class="header-cell">ART/NO</th>
                <th class="header-cell">OR/QTY</th>
                <th class="header-cell">ITEM</th>
                <th class="header-cell">DAILY<br>TARGET</th>
                <th class="header-cell">DAILY<br>PRODUCTION</th>
                <th class="header-cell">UNIT PRICE</th>
                <th class="header-cell">TOTAL PRICE</th>
                <th class="header-cell">%</th>
                <th class="header-cell">% Dollar</th>
                <th class="header-cell">Taka</th>
                <th class="header-cell">REMARKS</th>
              </tr>
            </thead>
            <tbody>
              ${exportData.map((row, index) => {
                const isTotal = row['ITEM'] === 'Total';
                return `
                  <tr class="${isTotal ? 'total-row' : 'data-row'}">
                    <td class="data-cell line-cell">${row['LINE'] || ''}</td>
                    <td class="data-cell code-cell">${row['P/COD'] || ''}</td>
                    <td class="data-cell buyer-cell">${row['BUYER'] || ''}</td>
                    <td class="data-cell art-cell">${row['ART/NO'] || ''}</td>
                    <td class="data-cell qty-cell">${row['OR/QTY'] ? row['OR/QTY'].toLocaleString() : ''}</td>
                    <td class="data-cell item-cell">${row['ITEM'] || ''}</td>
                    <td class="data-cell target-cell">${row['DAILY TARGET'] ? row['DAILY TARGET'].toLocaleString() : ''}</td>
                    <td class="data-cell production-cell">${row['DAILY PRODUCTION'] ? row['DAILY PRODUCTION'].toLocaleString() : ''}</td>
                    <td class="data-cell price-cell">$${row['UNIT PRICE'] || ''}</td>
                    <td class="data-cell total-price-cell">$${row['TOTAL PRICE'] || ''}</td>
                    <td class="data-cell percentage-cell">${row['%'] || ''}</td>
                    <td class="data-cell dollar-cell">$${row['% Dollar'] || ''}</td>
                    <td class="data-cell taka-cell">${row['Taka'] ? row['Taka'].toLocaleString() : ''}</td>
                    <td class="data-cell remarks-cell">${row['Remarks'] || ''}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="company-info">
            Generated on ${new Date().toLocaleString()} | Production Management System
          </div>
        </body>
        </html>
      `;

      // Create and download the enhanced Excel file
      const blob = new Blob([htmlContent], { 
        type: 'application/vnd.ms-excel;charset=utf-8;' 
      });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Daily_Production_Report_${format(selectedDate, 'yyyy-MM-dd')}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Enhanced Excel file downloaded successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export Excel file');
    }
  };

  // Export to PDF function
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
              font-family: Arial, sans-serif; 
              margin: 10px; 
              font-size: 12px;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px; 
              font-weight: bold;
              font-size: 16px;
            }
            .date-info {
              text-align: right;
              margin-bottom: 10px;
              font-weight: bold;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px;
              font-size: 10px;
            }
            th, td { 
              border: 1px solid #333; 
              padding: 4px; 
              text-align: center;
              vertical-align: middle;
            }
            th { 
              background-color: #e8f4f8; 
              font-weight: bold;
              font-size: 9px;
            }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .total-row {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">Daily Production Report</div>
          <div class="date-info">DATE: ${dateString}</div>
          
          <table>
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
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${exportData.map((row, index) => {
                const isTotal = row['ITEM'] === 'Total';
                return `
                  <tr ${isTotal ? 'class="total-row"' : ''}>
                    <td>${row['LINE'] || ''}</td>
                    <td>${row['P/COD'] || ''}</td>
                    <td class="text-left">${row['BUYER'] || ''}</td>
                    <td>${row['ART/NO'] || ''}</td>
                    <td>${row['OR/QTY'] ? row['OR/QTY'].toLocaleString() : ''}</td>
                    <td class="text-left">${row['ITEM'] || ''}</td>
                    <td>${row['DAILY TARGET'] ? row['DAILY TARGET'].toLocaleString() : ''}</td>
                    <td>${row['DAILY PRODUCTION'] ? row['DAILY PRODUCTION'].toLocaleString() : ''}</td>
                    <td>$${row['UNIT PRICE'] || ''}</td>
                    <td>$${row['TOTAL PRICE'] || ''}</td>
                    <td>${row['%'] || ''}</td>
                    <td>$${row['% Dollar'] || ''}</td>
                    <td>${row['Taka'] ? row['Taka'].toLocaleString() : ''}</td>
                    <td class="text-left">${row['Remarks'] || ''}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
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
  };

  // Print function
  const handlePrint = () => {
    handleExportPDF(); // Use the same PDF format for printing
  };

    return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Daily Production Report
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track daily production performance against targets
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal h-9 sm:h-10">
                <IconCalendar className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{format(selectedDate, 'PPP')}</span>
                <span className="sm:hidden">{format(selectedDate, 'MMM dd, yyyy')}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Button
            variant="outline"
            onClick={fetchReports}
            disabled={loading}
            className="w-full sm:w-auto h-9 sm:h-10"
          >
            <IconRefresh className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {isMobile ? 'Refresh' : 'Refresh'}
          </Button>

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
              <DropdownMenuItem onClick={handleExportExcel} className="flex items-center gap-2">
                <IconFileTypeXls className="h-4 w-4 text-green-600" />
                <span>Export to Excel</span>
              </DropdownMenuItem>
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
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Styles</CardTitle>
              <IconClipboardList className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{summary.totalReports || 0}</div>
              <p className="text-xs text-muted-foreground">Total reports</p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Target Qty</CardTitle>
              <IconTarget className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{(summary.totalTargetQty || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total target quantity</p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Production Qty</CardTitle>
              <IconActivity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{(summary.totalProductionQty || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Actual production</p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Amount</CardTitle>
              <IconCurrency className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">${(summary.totalAmount || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total production value</p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Net Amount</CardTitle>
              <IconCurrency className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{(summary.totalNetAmount || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Net production value (BDT)</p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Efficiency</CardTitle>
              <IconTrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{(summary.averageEfficiency || 0).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Average efficiency</p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Active Lines</CardTitle>
              <IconActivity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{summary.linesWithProduction || 0}</div>
              <p className="text-xs text-muted-foreground">Lines with production</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <IconSearch className="h-4 w-4" />
            Filters
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Filter and search production reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Search</Label>
              <Input
                placeholder={isMobile ? "Search..." : "Search by style, buyer, item, or line..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Production Line</Label>
              <Select value={lineFilter} onValueChange={setLineFilter}>
                <SelectTrigger className="h-9 sm:h-10 text-sm">
                  <SelectValue placeholder="Select line" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lines</SelectItem>
                  {uniqueLines.map(line => (
                    <SelectItem key={line} value={line || ''}>
                      {line || 'No Line'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Style Number</Label>
              <Input
                placeholder={isMobile ? "Style..." : "Filter by style number..."}
                value={styleFilter}
                onChange={(e) => setStyleFilter(e.target.value)}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Production Reports by Line */}
      {loading ? (
      <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="text-muted-foreground">Loading reports...</div>
                    </div>
          </CardContent>
        </Card>
      ) : Object.keys(reportsByLine).length === 0 && reportsWithoutLine.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-2">
              <IconClipboardList className="h-12 w-12 text-muted-foreground/50" />
              <div className="text-lg font-medium text-muted-foreground">No reports found</div>
              <div className="text-sm text-muted-foreground">
                No production reports for the selected date and filters
                    </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Reports grouped by lines */}
          {Object.entries(reportsByLine)
            .filter(([lineNo, lineReports]) => {
              if (lineFilter !== 'all' && lineNo !== lineFilter) return false;
              
              const filteredLineReports = lineReports.filter(report => {
                const searchLower = searchTerm.toLowerCase();
                return (
                  report.styleNo.toLowerCase().includes(searchLower) ||
                  report.productionList.buyer.toLowerCase().includes(searchLower) ||
                  report.productionList.item.toLowerCase().includes(searchLower)
                );
              });
              
              return filteredLineReports.length > 0;
            })
            .map(([lineNo, lineReports]) => {
              const lineSummary = lineSummaries[lineNo];
              const filteredLineReports = lineReports.filter(report => {
                const searchLower = searchTerm.toLowerCase();
                return (
                  report.styleNo.toLowerCase().includes(searchLower) ||
                  report.productionList.buyer.toLowerCase().includes(searchLower) ||
                  report.productionList.item.toLowerCase().includes(searchLower)
                );
              });

              return (
                <Card key={lineNo}>
                  <CardHeader className="bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Badge variant="default" className="text-sm">{lineNo}</Badge>
                          <span>Line Production Report</span>
                        </CardTitle>
                        <CardDescription>
                          Production performance for {format(selectedDate, 'PPP')}
                        </CardDescription>
                      </div>
                      {lineSummary && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-bold text-blue-600">{(lineSummary?.totalTargetQty || 0).toLocaleString()}</div>
                            <div className="text-muted-foreground">Target</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-green-600">{(lineSummary?.totalProductionQty || 0).toLocaleString()}</div>
                            <div className="text-muted-foreground">Production</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-purple-600">{(lineSummary?.averageEfficiency || 0).toFixed(1)}%</div>
                            <div className="text-muted-foreground">Efficiency</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-orange-600">{(lineSummary?.totalNetAmount || 0).toLocaleString()}</div>
                            <div className="text-muted-foreground">Net Amount (BDT)</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 sm:p-0">
                    {isMobile ? (
                      // Mobile Simplified Table Layout
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-20">Style No</TableHead>
                              <TableHead className="text-center w-24">Production</TableHead>
                              <TableHead className="text-center w-20">Efficiency</TableHead>
                              <TableHead className="text-right w-16">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredLineReports.map((report) => {
                              const efficiency = getEfficiencyBadge(report.targetQty, report.productionQty);
                              return (
                                <TableRow key={report.id}>
                                  <TableCell className="font-medium text-sm">
                                    <div className="flex flex-col">
                                      <span>{report.styleNo}</span>
                                      <span className="text-xs text-muted-foreground truncate">
                                        {report.productionList.buyer}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex flex-col items-center">
                                      <span className="font-mono text-sm font-medium">
                                        {report.productionQty.toLocaleString()}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        / {report.targetQty.toLocaleString()}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant={efficiency.variant as any} className="text-xs">
                                      {efficiency.text}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleViewReport(report, lineNo)}
                                    >
                                      <IconEye className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            {filteredLineReports.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-6 text-sm text-muted-foreground">
                                  No reports for this line
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      // Desktop Table Layout
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Style No</TableHead>
                              <TableHead>Buyer</TableHead>
                              <TableHead>Item</TableHead>
                              <TableHead>Target Qty</TableHead>
                              <TableHead>Production Qty</TableHead>
                              <TableHead>Efficiency</TableHead>
                              <TableHead>Unit Price</TableHead>
                              <TableHead>Total Amount</TableHead>
                              <TableHead>Net Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredLineReports.map((report) => {
                              const efficiency = getEfficiencyBadge(report.targetQty, report.productionQty);
                              return (
                                <TableRow key={report.id}>
                                  <TableCell className="font-medium">{report.styleNo}</TableCell>
                                  <TableCell>{report.productionList.buyer}</TableCell>
                                  <TableCell>{report.productionList.item}</TableCell>
                                  <TableCell className="font-mono">{(report.targetQty || 0).toLocaleString()}</TableCell>
                                  <TableCell className="font-mono">{(report.productionQty || 0).toLocaleString()}</TableCell>
                                  <TableCell>
                                    <Badge variant={efficiency.variant as any}>
                                      {efficiency.text}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-mono">${Number(report.unitPrice || 0).toFixed(2)}</TableCell>
                                  <TableCell className="font-mono">${Number(report.totalAmount || 0).toLocaleString()}</TableCell>
                                  <TableCell className="font-mono text-green-600 font-semibold">{Number(report.netAmount || 0).toLocaleString()}</TableCell>
                                </TableRow>
                              );
                            })}
                            {filteredLineReports.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                                  No reports for this line
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

          {/* Reports without line assignment */}
          {reportsWithoutLine.length > 0 && (lineFilter === 'all' || lineFilter === '') && (
            <Card>
              <CardHeader className="bg-muted/30">
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm">No Line</Badge>
                  <span>Unassigned Production Reports</span>
                </CardTitle>
                <CardDescription>
                  Reports without line assignment for {format(selectedDate, 'PPP')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-0">
                {isMobile ? (
                  // Mobile Simplified Table Layout
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Style No</TableHead>
                          <TableHead className="text-center w-24">Production</TableHead>
                          <TableHead className="text-center w-20">Efficiency</TableHead>
                          <TableHead className="text-right w-16">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportsWithoutLine
                          .filter(report => {
                            const searchLower = searchTerm.toLowerCase();
                            return (
                              report.styleNo.toLowerCase().includes(searchLower) ||
                              report.productionList.buyer.toLowerCase().includes(searchLower) ||
                              report.productionList.item.toLowerCase().includes(searchLower)
                            );
                          })
                          .map((report) => {
                            const efficiency = getEfficiencyBadge(report.targetQty, report.productionQty);
                            return (
                              <TableRow key={report.id}>
                                <TableCell className="font-medium text-sm">
                                  <div className="flex flex-col">
                                    <span>{report.styleNo}</span>
                                    <span className="text-xs text-muted-foreground truncate">
                                      {report.productionList.buyer}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex flex-col items-center">
                                    <span className="font-mono text-sm font-medium">
                                      {report.productionQty.toLocaleString()}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      / {report.targetQty.toLocaleString()}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant={efficiency.variant as any} className="text-xs">
                                    {efficiency.text}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleViewReport(report)}
                                  >
                                    <IconEye className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        {reportsWithoutLine.filter(report => {
                          const searchLower = searchTerm.toLowerCase();
                          return (
                            report.styleNo.toLowerCase().includes(searchLower) ||
                            report.productionList.buyer.toLowerCase().includes(searchLower) ||
                            report.productionList.item.toLowerCase().includes(searchLower)
                          );
                        }).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-6 text-sm text-muted-foreground">
                              No unassigned reports found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  // Desktop Table Layout
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Style No</TableHead>
                          <TableHead>Buyer</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead>Target Qty</TableHead>
                          <TableHead>Production Qty</TableHead>
                          <TableHead>Efficiency</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Net Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportsWithoutLine
                          .filter(report => {
                            const searchLower = searchTerm.toLowerCase();
                            return (
                              report.styleNo.toLowerCase().includes(searchLower) ||
                              report.productionList.buyer.toLowerCase().includes(searchLower) ||
                              report.productionList.item.toLowerCase().includes(searchLower)
                            );
                          })
                          .map((report) => {
                            const efficiency = getEfficiencyBadge(report.targetQty, report.productionQty);
                            return (
                              <TableRow key={report.id}>
                                <TableCell className="font-medium">{report.styleNo}</TableCell>
                                <TableCell>{report.productionList.buyer}</TableCell>
                                <TableCell>{report.productionList.item}</TableCell>
                                <TableCell className="font-mono">{(report.targetQty || 0).toLocaleString()}</TableCell>
                                <TableCell className="font-mono">{(report.productionQty || 0).toLocaleString()}</TableCell>
                                <TableCell>
                                  <Badge variant={efficiency.variant as any}>
                                    {efficiency.text}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono">${Number(report.unitPrice || 0).toFixed(2)}</TableCell>
                                <TableCell className="font-mono">${Number(report.totalAmount || 0).toLocaleString()}</TableCell>
                                <TableCell className="font-mono text-green-600 font-semibold">{Number(report.netAmount || 0).toLocaleString()}</TableCell>
                              </TableRow>
                            );
                          })}
                        {reportsWithoutLine.filter(report => {
                          const searchLower = searchTerm.toLowerCase();
                          return (
                            report.styleNo.toLowerCase().includes(searchLower) ||
                            report.productionList.buyer.toLowerCase().includes(searchLower) ||
                            report.productionList.item.toLowerCase().includes(searchLower)
                          );
                        }).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                              No unassigned reports found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
      </Card>
          )}
        </div>
      )}

      {/* Notes section if any reports have notes */}
      {reportsWithNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Additional notes from production reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reportsWithNotes.map((report) => (
                  <div key={report.id} className="p-3 bg-muted rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{report.styleNo}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {report.productionList.buyer}
                      </span>
                    </div>
                    <p className="text-sm">{report.notes}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Sheet */}
      <ProductionReportViewSheet
        report={viewingReport}
        lineNo={viewingLineNo}
        open={!!viewingReport}
        onOpenChange={(open) => {
          if (!open) {
            setViewingReport(null);
            setViewingLineNo('');
          }
        }}
      />
      </div>
  );
}