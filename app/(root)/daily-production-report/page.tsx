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
  IconActivity
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
  balanceQty: number;
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
  totalStyles: number;
  totalTargetQty: number;
  totalProductionQty: number;
  totalAmount: number;
  totalNetAmount: number;
  overallEfficiency: number;
}

export default function DailyProductionReportPage() {
  const [reports, setReports] = useState<DailyProductionReport[]>([]);
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
        setReports(data.data.reports || []);
        setSummary(data.data.summary || null);
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

  // Filter reports based on search term
  const filteredReports = reports.filter(report => {
    const searchLower = searchTerm.toLowerCase();
    return (
      report.styleNo.toLowerCase().includes(searchLower) ||
      report.productionList.buyer.toLowerCase().includes(searchLower) ||
      report.productionList.item.toLowerCase().includes(searchLower) ||
      (report.lineNo && report.lineNo.toLowerCase().includes(searchLower))
    );
  });

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
  const uniqueLines = Array.from(new Set(reports.map(r => r.lineNo).filter(Boolean))).sort();

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

        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <IconCalendar className="h-4 w-4 mr-2" />
                {format(selectedDate, 'PPP')}
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
          >
            <IconRefresh className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Styles</CardTitle>
              <IconClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalStyles || 0}</div>
              <p className="text-xs text-muted-foreground">Styles in production</p>
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
              <div className="text-2xl font-bold">${(summary.totalNetAmount || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Net production value</p>
        </CardContent>
      </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
              <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(summary.overallEfficiency || 0).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Overall efficiency</p>
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

      {/* Production Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Production Reports</CardTitle>
          <CardDescription>
            Daily production performance for {format(selectedDate, 'PPP')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading reports...</div>
                    </div>
          ) : filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <IconClipboardList className="h-12 w-12 text-muted-foreground/50" />
              <div className="text-lg font-medium text-muted-foreground">No reports found</div>
              <div className="text-sm text-muted-foreground">
                No production reports for the selected date and filters
                    </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Style No</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Line</TableHead>
                    <TableHead>Target Qty</TableHead>
                    <TableHead>Production Qty</TableHead>
                    <TableHead>Efficiency</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Net Amount</TableHead>
                    <TableHead>Balance Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => {
                    const efficiency = getEfficiencyBadge(report.targetQty, report.productionQty);
                    return (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.styleNo}</TableCell>
                        <TableCell>{report.productionList.buyer}</TableCell>
                        <TableCell>{report.productionList.item}</TableCell>
                        <TableCell>
                          {report.lineNo ? (
                            <Badge variant="outline">{report.lineNo}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono">{(report.targetQty || 0).toLocaleString()}</TableCell>
                        <TableCell className="font-mono">{(report.productionQty || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={efficiency.variant as any}>
                            {efficiency.text}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">${Number(report.unitPrice || 0).toFixed(2)}</TableCell>
                        <TableCell className="font-mono">${Number(report.totalAmount || 0).toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-green-600 font-semibold">${Number(report.netAmount || 0).toLocaleString()}</TableCell>
                        <TableCell className="font-mono">{(report.balanceQty || 0).toLocaleString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes section if any reports have notes */}
      {filteredReports.some(r => r.notes) && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Additional notes from production reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredReports
                .filter(r => r.notes)
                .map((report) => (
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