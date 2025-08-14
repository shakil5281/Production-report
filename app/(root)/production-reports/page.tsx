'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Download, Filter, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

interface ProductionEntry {
  id: string;
  date: string;
  hourIndex: number;
  lineId: string;
  styleId: string;
  stage: 'CUTTING' | 'SEWING' | 'FINISHING';
  inputQty: number;
  outputQty: number;
  defectQty: number;
  reworkQty: number;
  notes?: string;
  line: {
    name: string;
    code: string;
    factory: {
      name: string;
    };
  };
  style: {
    styleNumber: string;
    buyer: string;
    orderQty: number;
    unitPrice: number;
  };
}

interface Line {
  id: string;
  name: string;
  code: string;
}

interface Style {
  id: string;
  styleNumber: string;
  buyer: string;
}

interface ReportSummary {
  totalInput: number;
  totalOutput: number;
  totalDefects: number;
  totalRework: number;
  efficiency: number;
  defectRate: number;
  reworkRate: number;
}

export default function ProductionReportsPage() {
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(false);
  const [masterDataLoading, setMasterDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [masterDataError, setMasterDataError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    lineId: 'all',
    styleId: 'all',
    stage: 'all'
  });
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchData(1);
  }, [filters]);

  const fetchData = async (page = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.lineId && filters.lineId !== 'all' && { lineId: filters.lineId }),
        ...(filters.styleId && filters.styleId !== 'all' && { styleId: filters.styleId }),
        ...(filters.stage && filters.stage !== 'all' && { stage: filters.stage })
      });

      const response = await fetch(`/api/production/entries?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch production data');
      }

      const data = await response.json();
      setEntries(data.entries || []);
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, pages: 0 });
      calculateSummary(data.entries || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to fetch production data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      setMasterDataLoading(true);
      setMasterDataError(null);
      
      const [linesRes, stylesRes] = await Promise.all([
        fetch('/api/lines'),
        fetch('/api/styles')
      ]);

      if (!linesRes.ok || !stylesRes.ok) {
        throw new Error('Failed to fetch master data');
      }

      const [linesData, stylesData] = await Promise.all([
        linesRes.json(),
        stylesRes.json()
      ]);

      setLines(linesData || []);
      setStyles(stylesData.styles || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch master data';
      setMasterDataError(errorMessage);
      console.error('Failed to fetch master data:', err);
      toast.error(errorMessage);
    } finally {
      setMasterDataLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  const calculateSummary = (data: ProductionEntry[]) => {
    const totalInput = data.reduce((sum, entry) => sum + entry.inputQty, 0);
    const totalOutput = data.reduce((sum, entry) => sum + entry.outputQty, 0);
    const totalDefects = data.reduce((sum, entry) => sum + entry.defectQty, 0);
    const totalRework = data.reduce((sum, entry) => sum + entry.reworkQty, 0);

    const efficiency = totalInput > 0 ? (totalOutput / totalInput) * 100 : 0;
    const defectRate = totalOutput > 0 ? (totalDefects / totalOutput) * 100 : 0;
    const reworkRate = totalOutput > 0 ? (totalRework / totalOutput) * 100 : 0;

    setSummary({
      totalInput,
      totalOutput,
      totalDefects,
      totalRework,
      efficiency,
      defectRate,
      reworkRate
    });
  };

  const exportReport = () => {
    if (entries.length === 0) {
      toast.error('No data to export');
      return;
    }

    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `production_report_${filters.startDate}_${filters.endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateCSV = () => {
    const headers = [
      'Date',
      'Hour',
      'Line',
      'Factory',
      'Style',
      'Buyer',
      'Stage',
      'Input Qty',
      'Output Qty',
      'Defect Qty',
      'Rework Qty',
      'Notes'
    ];

    const rows = entries.map(entry => [
      entry.date,
      `${entry.hourIndex}:00`,
      entry.line.name,
      entry.line.code,
      entry.style.styleNumber,
      entry.style.buyer,
      entry.stage,
      entry.inputQty,
      entry.outputQty,
      entry.defectQty,
      entry.reworkQty,
      entry.notes || ''
    ]);

    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'CUTTING':
        return 'bg-blue-100 text-blue-800';
      case 'SEWING':
        return 'bg-green-100 text-green-800';
      case 'FINISHING':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getHourLabel = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchData(newPage);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Reports</h1>
          <p className="text-muted-foreground">
            Generate and view production reports with detailed analytics
          </p>
        </div>
        <Button onClick={exportReport} disabled={entries.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="lineId">Production Line</Label>
              <Select
                value={filters.lineId}
                onValueChange={(value) => setFilters({ ...filters, lineId: value })}
                disabled={masterDataLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={masterDataLoading ? "Loading..." : "All lines"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All lines</SelectItem>
                  {lines.map((line) => (
                    <SelectItem key={line.id} value={line.id}>
                      {line.name} ({line.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {masterDataError && (
                <p className="text-xs text-red-500 mt-1">Failed to load lines</p>
              )}
            </div>
            <div>
              <Label htmlFor="styleId">Style</Label>
              <Select
                value={filters.styleId}
                onValueChange={(value) => setFilters({ ...filters, styleId: value })}
                disabled={masterDataLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={masterDataLoading ? "Loading..." : "All styles"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All styles</SelectItem>
                  {styles.map((style) => (
                    <SelectItem key={style.id} value={style.id}>
                      {style.styleNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {masterDataError && (
                <p className="text-xs text-red-500 mt-1">Failed to load styles</p>
              )}
            </div>
            <div>
              <Label htmlFor="stage">Stage</Label>
              <Select
                value={filters.stage}
                onValueChange={(value) => setFilters({ ...filters, stage: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stages</SelectItem>
                  <SelectItem value="CUTTING">Cutting</SelectItem>
                  <SelectItem value="SEWING">Sewing</SelectItem>
                  <SelectItem value="FINISHING">Finishing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Input</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalInput.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total input quantity
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Output</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalOutput.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total output quantity
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summary.efficiency.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Output/Input ratio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Defect Rate</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {summary.defectRate.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Defects per output
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Production Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Production Entries</CardTitle>
          <p className="text-sm text-muted-foreground">
            {entries.length} entries found for the selected period
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => fetchData(1)}>Retry</Button>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No production entries found for the selected criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Hour</TableHead>
                    <TableHead>Line</TableHead>
                    <TableHead>Line Code</TableHead>
                    <TableHead>Style</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead className="text-right">Input</TableHead>
                    <TableHead className="text-right">Output</TableHead>
                    <TableHead className="text-right">Defects</TableHead>
                    <TableHead className="text-right">Rework</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{formatDate(entry.date)}</TableCell>
                      <TableCell>{getHourLabel(entry.hourIndex)}</TableCell>
                      <TableCell>
                        {entry.line.name} ({entry.line.code})
                      </TableCell>
                      <TableCell>{entry.line.code}</TableCell>
                      <TableCell>{entry.style.styleNumber}</TableCell>
                      <TableCell>{entry.style.buyer}</TableCell>
                      <TableCell>
                        <Badge className={getStageColor(entry.stage)}>
                          {entry.stage}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{entry.inputQty}</TableCell>
                      <TableCell className="text-right">{entry.outputQty}</TableCell>
                      <TableCell className="text-right text-red-600">
                        {entry.defectQty}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        {entry.reworkQty}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(pagination.pages - 4, pagination.page - 2)) + i;
                    if (pageNum > pagination.pages) return null;
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
