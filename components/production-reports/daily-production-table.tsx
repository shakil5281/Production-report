'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface DailyProductionReport {
  id: string;
  date: string;
  styleNo: string;
  targetQty: number;
  productionQty: number;
  unitPrice: number | string; // Prisma Decimal type
  totalAmount: number | string; // Prisma Decimal type
  balanceQty: number;
  lineNo?: string;
  notes?: string;
  createdAt: string;
  productionList: {
    buyer: string;
    item: string;
    quantity: number;
  };
}



interface CreateReportForm {
  date: string;
  styleNo: string;
  targetQty: number;
  productionQty: number;
  lineNo: string;
  notes: string;
}

export default function DailyProductionTable() {
  const [reports, setReports] = useState<DailyProductionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateReportForm>({
    date: format(new Date(), 'yyyy-MM-dd'),
    styleNo: '',
    targetQty: 0,
    productionQty: 0,
    lineNo: '',
    notes: '',
  });

  const fetchReports = async (date?: Date) => {
    setLoading(true);
    try {
      const dateStr = format(date || selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/production/daily-reports?date=${dateStr}`);
      const data = await response.json();
      
      if (data.success) {
        setReports(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch reports');
      }
    } catch (error) {
      toast.error('Failed to fetch production reports');
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };



  const createReport = async () => {
    try {
      const response = await fetch('/api/production/daily-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Production report created successfully');
        setIsCreateDialogOpen(false);
        setCreateForm({
          date: format(new Date(), 'yyyy-MM-dd'),
          styleNo: '',
          targetQty: 0,
          productionQty: 0,
          lineNo: '',
          notes: '',
        });
        fetchReports();
      } else {
        toast.error(data.error || 'Failed to create report');
      }
    } catch (error) {
      toast.error('Failed to create production report');
      console.error('Error creating report:', error);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedDate]);

  const getBalanceStatus = (balance: number) => {
    if (balance > 0) return { label: `+${balance}`, variant: 'default' as const };
    if (balance < 0) return { label: `${balance}`, variant: 'destructive' as const };
    return { label: '0', variant: 'secondary' as const };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Daily Production Reports</h1>
          <p className="text-muted-foreground">
            Track daily production against targets with balance calculations
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchReports()} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Daily Production Report</DialogTitle>
                <DialogDescription>
                  Add a new daily production report. Balance will be automatically calculated.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={createForm.date}
                      onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="styleNo">Style No</Label>
                    <Input
                      id="styleNo"
                      value={createForm.styleNo}
                      onChange={(e) => setCreateForm({ ...createForm, styleNo: e.target.value })}
                      placeholder="Enter style number"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="targetQty">Target Quantity</Label>
                    <Input
                      id="targetQty"
                      type="number"
                      value={createForm.targetQty}
                      onChange={(e) => setCreateForm({ ...createForm, targetQty: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="productionQty">Production Quantity</Label>
                    <Input
                      id="productionQty"
                      type="number"
                      value={createForm.productionQty}
                      onChange={(e) => setCreateForm({ ...createForm, productionQty: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="lineNo">Line No (Optional)</Label>
                  <Input
                    id="lineNo"
                    value={createForm.lineNo}
                    onChange={(e) => setCreateForm({ ...createForm, lineNo: e.target.value })}
                    placeholder="Enter line number"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={createForm.notes}
                    onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                    placeholder="Enter any notes"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createReport}>Create Report</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Date</CardTitle>
        </CardHeader>
        <CardContent>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
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
        </CardContent>
      </Card>

      {/* Daily Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Production Reports - {format(selectedDate, 'PPP')}</CardTitle>
          <CardDescription>
            Production data with automatic balance calculations (Production × Price × 120 = Total Amount)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No production reports found for {format(selectedDate, 'PPP')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Style No</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Production</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Line</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  const balanceStatus = getBalanceStatus(report.balanceQty);
                  return (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.styleNo}</TableCell>
                      <TableCell>{report.productionList.buyer}</TableCell>
                      <TableCell>{report.productionList.item}</TableCell>
                      <TableCell>{report.targetQty}</TableCell>
                      <TableCell>{report.productionQty}</TableCell>
                      <TableCell>${Number(report.unitPrice).toFixed(2)}</TableCell>
                      <TableCell className="font-bold">${Number(report.totalAmount).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={balanceStatus.variant}>
                          {balanceStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{report.lineNo || '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>


    </div>
  );
}
