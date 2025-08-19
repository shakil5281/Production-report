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
  IconPrinter
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

  // Export to PDF function
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to export PDF');
      return;
    }

    const dateString = format(selectedDate, 'PPP');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Daily Production Report - ${dateString}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .summary-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
            .line-section { margin-bottom: 40px; }
            .line-header { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 15px; }
            .line-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Daily Production Report</h1>
            <h2>${dateString}</h2>
          </div>
          
          ${summary ? `
          <div class="summary">
            <div class="summary-card">
              <h3>Total Reports</h3>
              <div class="font-bold">${summary.totalReports}</div>
            </div>
            <div class="summary-card">
              <h3>Target Qty</h3>
              <div class="font-bold">${summary.totalTargetQty.toLocaleString()}</div>
            </div>
            <div class="summary-card">
              <h3>Production Qty</h3>
              <div class="font-bold">${summary.totalProductionQty.toLocaleString()}</div>
            </div>
            <div class="summary-card">
              <h3>Total Amount</h3>
              <div class="font-bold">$${summary.totalAmount.toLocaleString()}</div>
            </div>
            <div class="summary-card">
              <h3>Net Amount (BDT)</h3>
              <div class="font-bold">${summary.totalNetAmount.toLocaleString()}</div>
            </div>
            <div class="summary-card">
              <h3>Efficiency</h3>
              <div class="font-bold">${summary.averageEfficiency.toFixed(1)}%</div>
            </div>
            <div class="summary-card">
              <h3>Total Lines</h3>
              <div class="font-bold">${summary.totalLines}</div>
            </div>
          </div>
          ` : ''}

          ${Object.entries(reportsByLine).map(([lineNo, lineReports]) => {
            const lineSummary = lineSummaries[lineNo];
            return `
              <div class="line-section">
                <div class="line-header">
                  <h2>Line ${lineNo} Production Report</h2>
                  ${lineSummary ? `
                  <div class="line-stats">
                    <div>
                      <div class="font-bold">${lineSummary.totalTargetQty.toLocaleString()}</div>
                      <div>Target</div>
                    </div>
                    <div>
                      <div class="font-bold">${lineSummary.totalProductionQty.toLocaleString()}</div>
                      <div>Production</div>
                    </div>
                    <div>
                      <div class="font-bold">${lineSummary.averageEfficiency.toFixed(1)}%</div>
                      <div>Efficiency</div>
                    </div>
                    <div>
                      <div class="font-bold">${lineSummary.totalNetAmount.toLocaleString()}</div>
                      <div>Net Amount (BDT)</div>
                    </div>
                  </div>
                  ` : ''}
                </div>
                
                <table>
                  <thead>
                    <tr>
                      <th>Style No</th>
                      <th>Buyer</th>
                      <th>Item</th>
                      <th class="text-center">Target Qty</th>
                      <th class="text-center">Production Qty</th>
                      <th class="text-center">Efficiency</th>
                      <th class="text-center">Unit Price</th>
                      <th class="text-center">Total Amount</th>
                      <th class="text-center">Net Amount (BDT)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${lineReports.map(report => {
                      const efficiency = report.targetQty > 0 ? ((report.productionQty / report.targetQty) * 100) : 0;
                      return `
                        <tr>
                          <td class="font-bold">${report.styleNo}</td>
                          <td>${report.productionList.buyer}</td>
                          <td>${report.productionList.item}</td>
                          <td class="text-center">${report.targetQty.toLocaleString()}</td>
                          <td class="text-center">${report.productionQty.toLocaleString()}</td>
                          <td class="text-center">${efficiency.toFixed(1)}%</td>
                          <td class="text-center">$${Number(report.unitPrice).toFixed(2)}</td>
                          <td class="text-center">$${Number(report.totalAmount).toLocaleString()}</td>
                          <td class="text-center">${Number(report.netAmount).toLocaleString()}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            `;
          }).join('')}
          
          <div class="no-print" style="text-align: center; margin-top: 30px;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Print/Save as PDF</button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
  };

    return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Daily Production Report
          </h1>
          <p className="text-muted-foreground">
            Track daily production performance against targets
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal">
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
            className="w-full sm:w-auto"
          >
            <IconRefresh className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            onClick={handleExportPDF}
            disabled={loading || Object.keys(reportsByLine).length === 0}
            className="w-full sm:w-auto flex items-center gap-2"
          >
            <IconDownload className="h-4 w-4" />
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-7">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Styles</CardTitle>
              <IconClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalReports || 0}</div>
              <p className="text-xs text-muted-foreground">Total reports</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Target Qty</CardTitle>
              <IconTarget className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(summary.totalTargetQty || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total target quantity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Production Qty</CardTitle>
              <IconActivity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(summary.totalProductionQty || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Actual production</p>
            </CardContent>
          </Card>

      <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <IconCurrency className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
              <div className="text-2xl font-bold">${(summary.totalAmount || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total production value</p>
        </CardContent>
      </Card>

      <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Amount</CardTitle>
              <IconCurrency className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
              <div className="text-2xl font-bold">{(summary.totalNetAmount || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Net production value (BDT)</p>
        </CardContent>
      </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
              <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(summary.averageEfficiency || 0).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Average efficiency</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lines</CardTitle>
              <IconClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalLines || 0}</div>
              <p className="text-xs text-muted-foreground">Lines with reports</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Lines</CardTitle>
              <IconActivity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.linesWithProduction || 0}</div>
              <p className="text-xs text-muted-foreground">Lines with production</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconSearch className="h-4 w-4" />
            Filters
          </CardTitle>
          <CardDescription>Filter and search production reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
              <Label>Search</Label>
                        <Input
                placeholder="Search by style, buyer, item, or line..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                        />
      </div>

                      <div className="space-y-2">
              <Label>Production Line</Label>
              <Select value={lineFilter} onValueChange={setLineFilter}>
                <SelectTrigger>
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
              <Label>Style Number</Label>
                        <Input
                placeholder="Filter by style number..."
                value={styleFilter}
                onChange={(e) => setStyleFilter(e.target.value)}
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
                  <CardContent className="p-0">
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
                        </TableBody>
                      </Table>
                    </div>
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
              <CardContent className="p-0">
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
                </TableBody>
              </Table>
            </div>
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
      </div>
  );
}