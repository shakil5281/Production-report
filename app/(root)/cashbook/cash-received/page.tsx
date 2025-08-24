'use client';

import { useCallback, useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconCalendar, 
  IconCash,
  IconRefresh,
  IconFilter,
  IconX,
  IconDownload,
  IconFileText,
  IconFileSpreadsheet,
  IconCalendarStats,
  IconTrendingUp
} from '@tabler/icons-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import CashReceivedForm from '@/components/cashbook/cash-received-form';

interface CashReceivedEntry {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  lineId: string | null;
  createdAt: string;
  updatedAt: string;
  line?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface CashReceivedForm {
  date: Date | undefined;
  amount: string;
}

export default function CashReceivedPage() {
  const [entries, setEntries] = useState<CashReceivedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  
  // Form states
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CashReceivedEntry | null>(null);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);

  // Enhanced filter states
  const [filters, setFilters] = useState({
    period: 'current_month' as 'today' | 'current_month' | 'last_month' | 'custom' | 'all_time',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    minAmount: '',
    maxAmount: ''
  });

  // Summary
  const [summary, setSummary] = useState({
    totalAmount: 0,
    totalEntries: 0,
    averageAmount: 0,
    highestAmount: 0
  });

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      let startDate: string;
      let endDate: string;
      
      switch (filters.period) {
        case 'today':
          startDate = format(new Date(), 'yyyy-MM-dd');
          endDate = format(new Date(), 'yyyy-MM-dd');
          break;
        case 'current_month':
          startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
          endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');
          break;
        case 'last_month':
          const lastMonth = new Date();
          lastMonth.setMonth(lastMonth.getMonth() - 1);
          startDate = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
          endDate = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
          break;
        case 'custom':
          if (!filters.startDate || !filters.endDate) {
            toast.error('Please select both start and end dates for custom range');
            setLoading(false);
            return;
          }
          startDate = format(filters.startDate, 'yyyy-MM-dd');
          endDate = format(filters.endDate, 'yyyy-MM-dd');
          break;
        case 'all_time':
          startDate = '2020-01-01';
          endDate = format(new Date(), 'yyyy-MM-dd');
          break;
        default:
          startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
          endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      }

      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      
      if (filters.minAmount) {
        params.append('minAmount', filters.minAmount);
      }
      if (filters.maxAmount) {
        params.append('maxAmount', filters.maxAmount);
      }

      const response = await fetch(`/api/cashbook/cash-received?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setEntries(data.data);
        // Calculate enhanced summary
        const amounts = data.data.map((entry: CashReceivedEntry) => entry.amount);
        const totalAmount = amounts.reduce((sum: number, amount: number) => sum + amount, 0);
        const averageAmount = amounts.length > 0 ? totalAmount / amounts.length : 0;
        const highestAmount = amounts.length > 0 ? Math.max(...amounts) : 0;
        
        setSummary({
          totalAmount,
          totalEntries: data.data.length,
          averageAmount,
          highestAmount
        });
      } else {
        throw new Error(data.error || 'Failed to fetch entries');
      }
    } catch (error) {
      console.error('Error fetching cash received entries:', error);
      toast.error('Failed to fetch cash received entries');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const createEntry = async (data: { date: Date; amount: number }) => {
    setCreating(true);
    try {
      const response = await fetch('/api/cashbook/cash-received', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: format(data.date, 'yyyy-MM-dd'),
          amount: data.amount,
          category: 'Cash Received',
          description: null,
          referenceType: null,
          referenceId: null,
          lineId: null
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Cash received entry created successfully');
        setIsCreateSheetOpen(false);
        fetchEntries();
      } else {
        throw new Error(result.error || 'Failed to create entry');
      }
    } catch (error) {
      console.error('Error creating cash received entry:', error);
      toast.error('Failed to create cash received entry');
    } finally {
      setCreating(false);
    }
  };

  const updateEntry = async () => {
    if (!editForm.date || !editForm.amount || !editingEntry) {
      toast.error('Please fill in date and amount');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/cashbook/cash-received/${editingEntry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: format(editForm.date, 'yyyy-MM-dd'),
          amount: parseFloat(editForm.amount),
          category: 'Cash Received',
          description: null,
          referenceType: null,
          referenceId: null,
          lineId: null
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Cash received entry updated successfully');
        setIsEditDialogOpen(false);
        setEditingEntry(null);
        fetchEntries();
      } else {
        throw new Error(data.error || 'Failed to update entry');
      }
    } catch (error) {
      console.error('Error updating cash received entry:', error);
      toast.error('Failed to update cash received entry');
    } finally {
      setUpdating(false);
    }
  };

  const deleteEntry = async () => {
    if (!deleteEntryId) return;

    setDeleting(deleteEntryId);
    try {
      const response = await fetch(`/api/cashbook/cash-received/${deleteEntryId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Cash received entry deleted successfully');
        setIsDeleteDialogOpen(false);
        setDeleteEntryId(null);
        fetchEntries();
      } else {
        throw new Error(data.error || 'Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting cash received entry:', error);
      toast.error('Failed to delete cash received entry');
    } finally {
      setDeleting(null);
    }
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const currentDate = new Date();
      const monthYear = format(currentDate, 'MMMM yyyy');
      
      // Company Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('EKUSHE FASHIONS LTD', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Monthly Receive Statement', 105, 30, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Factory: Masterbari, Gazipur City, Gazipur.', 105, 40, { align: 'center' });
      doc.text(`For The Month of ${monthYear}`, 105, 50, { align: 'center' });
      
      // Prepare table data with running totals
      const tableColumns = ['Date', 'Opening', 'Received From Unit-1 A/C', 'Total Receive'];
      let runningTotal = 0;
      
      const tableRows = entries.map((entry, index) => {
        const opening = index === 0 ? 0 : runningTotal;
        const received = entry.amount;
        runningTotal = opening + received;
        
        return [
          format(new Date(entry.date), 'dd-MMM-yy'),
          opening === 0 ? '' : opening.toLocaleString(),
          received.toLocaleString(),
          runningTotal.toLocaleString()
        ];
      });
      
      // Add summary row
      const totalReceived = entries.reduce((sum, entry) => sum + entry.amount, 0);
      tableRows.push([
        '',
        '',
        `Received ${monthYear}`,
        totalReceived.toLocaleString()
      ]);
      
      // Add table
      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: 65,
        styles: {
          fontSize: 9,
          cellPadding: 3,
          halign: 'center'
        },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: 0,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 25, halign: 'center' },  // Date
          1: { cellWidth: 25, halign: 'right' },   // Opening
          2: { cellWidth: 80, halign: 'left' },    // Received From Unit
          3: { cellWidth: 35, halign: 'right' }    // Total Receive
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        didParseCell: function (data) {
          // Style the summary row
          if (data.row.index === tableRows.length - 1) {
            data.cell.styles.fillColor = [220, 220, 220];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });
      
      // Save the PDF
      const fileName = `cash-received-${format(currentDate, 'MMM-yyyy')}.pdf`;
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
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([]);

      // Company Header (Row 1-4)
      const currentDate = new Date();
      const monthYear = format(currentDate, 'MMMM yyyy');
      
      // Add header information
      XLSX.utils.sheet_add_aoa(worksheet, [
        ['', 'EKUSHE FASHIONS LTD'],
        ['', 'Monthly Receive Statement'],
        ['', 'Factory: Masterbari, Gazipur City, Gazipur.'],
        ['', `For The Month of ${monthYear}`],
        [''],
        ['Date', 'Opening', 'Received From Unit-1 A/C', 'Total Receive']
      ], { origin: 'A1' });

      // Add data rows starting from row 7
      let currentRow = 7;
      let runningTotal = 0;
      
      entries.forEach((entry, index) => {
        const entryDate = format(new Date(entry.date), 'dd-MMM-yy');
        const opening = index === 0 ? 0 : runningTotal; // Opening balance (previous running total)
        const received = entry.amount;
        runningTotal = opening + received;
        
        XLSX.utils.sheet_add_aoa(worksheet, [
          [entryDate, opening === 0 ? '' : opening, received, runningTotal]
        ], { origin: `A${currentRow}` });
        
        currentRow++;
      });

      // Add summary row
      const totalReceived = entries.reduce((sum, entry) => sum + entry.amount, 0);
      XLSX.utils.sheet_add_aoa(worksheet, [
        ['', '', `Received ${monthYear}`, totalReceived]
      ], { origin: `A${currentRow + 1}` });

      // Set column widths to match the original format
      worksheet['!cols'] = [
        { width: 12 }, // Date
        { width: 12 }, // Opening
        { width: 25 }, // Received From Unit
        { width: 15 }  // Total Receive
      ];

      // Merge cells for header
      worksheet['!merges'] = [
        { s: { r: 0, c: 1 }, e: { r: 0, c: 3 } }, // Company name
        { s: { r: 1, c: 1 }, e: { r: 1, c: 3 } }, // Monthly Receive Statement
        { s: { r: 2, c: 1 }, e: { r: 2, c: 3 } }, // Factory address
        { s: { r: 3, c: 1 }, e: { r: 3, c: 3 } }  // Month info
      ];

      // Style the header
      const headerStyle = {
        font: { bold: true, size: 14 },
        alignment: { horizontal: 'center' }
      };

      const subHeaderStyle = {
        font: { bold: true, size: 11 },
        alignment: { horizontal: 'center' }
      };

      const tableHeaderStyle = {
        font: { bold: true },
        alignment: { horizontal: 'center' },
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        }
      };

      // Apply styles to header cells
      if (!worksheet['B1']) worksheet['B1'] = {};
      worksheet['B1'].s = headerStyle;
      
      if (!worksheet['B2']) worksheet['B2'] = {};
      worksheet['B2'].s = subHeaderStyle;
      
      if (!worksheet['B3']) worksheet['B3'] = {};
      worksheet['B3'].s = subHeaderStyle;
      
      if (!worksheet['B4']) worksheet['B4'] = {};
      worksheet['B4'].s = subHeaderStyle;

      // Apply styles to table headers (row 6)
      ['A6', 'B6', 'C6', 'D6'].forEach(cell => {
        if (!worksheet[cell]) worksheet[cell] = {};
        worksheet[cell].s = tableHeaderStyle;
      });

      // Apply number formatting to amount columns
      for (let row = 7; row < currentRow; row++) {
        ['B', 'C', 'D'].forEach(col => {
          const cellRef = `${col}${row}`;
          if (worksheet[cellRef] && typeof worksheet[cellRef].v === 'number') {
            if (!worksheet[cellRef].s) worksheet[cellRef].s = {};
            worksheet[cellRef].s.numFmt = '#,##0.00';
          }
        });
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Cash Received');
      
      // Save the file
      const fileName = `cash-received-${format(currentDate, 'MMM-yyyy')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success('Excel file exported successfully');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Failed to export Excel file');
    } finally {
      setExporting(false);
    }
  };

  const getPeriodText = () => {
    switch (filters.period) {
      case 'today':
        return `Today (${format(new Date(), 'MMM dd, yyyy')})`;
      case 'current_month':
        return `Current Month (${format(new Date(), 'MMMM yyyy')})`;
      case 'last_month':
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return `Last Month (${format(lastMonth, 'MMMM yyyy')})`;
      case 'custom':
        if (filters.startDate && filters.endDate) {
          return `Custom Range (${format(filters.startDate, 'MMM dd, yyyy')} - ${format(filters.endDate, 'MMM dd, yyyy')})`;
        }
        return 'Custom Range';
      case 'all_time':
        return 'All Time';
      default:
        return 'Current Month';
    }
  };

  const clearFilters = () => {
    setFilters({
      period: 'current_month',
      startDate: undefined,
      endDate: undefined,
      minAmount: '',
      maxAmount: ''
    });
  };

  const openEditDialog = (entry: CashReceivedEntry) => {
    setEditingEntry(entry);
    setEditForm({
      date: new Date(entry.date),
      amount: entry.amount.toString()
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (entryId: string) => {
    setDeleteEntryId(entryId);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Cash Received</h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Manage incoming cash transactions and revenue entries
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center justify-center gap-2">
              <IconPlus className="h-4 w-4" />
              <span>Add Cash Received</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Cash Received Entry</DialogTitle>
              <DialogDescription>
                Enter the details of the cash received transaction
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !createForm.date && "text-muted-foreground"
                      )}
                    >
                      <IconCalendar className="mr-2 h-4 w-4" />
                      {createForm.date ? format(createForm.date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={createForm.date}
                      onSelect={(date) => setCreateForm({ ...createForm, date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-amount">Amount (BDT) *</Label>
                <Input
                  id="create-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={createForm.amount}
                  onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createEntry} disabled={creating}>
                {creating ? 'Creating...' : 'Create Entry'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Enhanced Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFilter className="h-5 w-5" />
            Filters & Export
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Period</Label>
              <Select 
                value={filters.period} 
                onValueChange={(value: any) => setFilters({ ...filters, period: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="current_month">Current Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                  <SelectItem value="all_time">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {filters.period === 'custom' && (
              <>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.startDate && "text-muted-foreground"
                        )}
                      >
                        <IconCalendar className="mr-2 h-4 w-4" />
                        {filters.startDate ? format(filters.startDate, "MMM dd, yyyy") : <span>Start date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.startDate}
                        onSelect={(date) => setFilters({ ...filters, startDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.endDate && "text-muted-foreground"
                        )}
                      >
                        <IconCalendar className="mr-2 h-4 w-4" />
                        {filters.endDate ? format(filters.endDate, "MMM dd, yyyy") : <span>End date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.endDate}
                        onSelect={(date) => setFilters({ ...filters, endDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label>Min Amount (BDT)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={filters.minAmount}
                onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Amount (BDT)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={filters.maxAmount}
                onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
              />
            </div>
          </div>
          
          <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={fetchEntries}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <IconRefresh className="h-4 w-4" />
                <span className="hidden sm:inline">Apply Filters</span>
                <span className="sm:hidden">Apply</span>
              </Button>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <IconX className="h-4 w-4" />
                <span className="hidden sm:inline">Clear Filters</span>
                <span className="sm:hidden">Clear</span>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                <IconCalendarStats className="h-3 w-3" />
                <span className="hidden sm:inline">{getPeriodText()}</span>
                <span className="sm:hidden">
                  {filters.period === 'today' ? 'Today' :
                   filters.period === 'current_month' ? 'Current' : 
                   filters.period === 'last_month' ? 'Last' :
                   filters.period === 'all_time' ? 'All' : 'Custom'}
                </span>
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
                disabled={exporting || entries.length === 0}
                className="flex items-center gap-2"
              >
                <IconFileText className="h-4 w-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                disabled={exporting || entries.length === 0}
                className="flex items-center gap-2"
              >
                <IconFileSpreadsheet className="h-4 w-4" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <IconCash className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">৳{summary.totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Period total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <IconCalendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalEntries}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Transaction count
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Amount</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{summary.averageAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Per transaction
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Amount</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{summary.highestAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Single transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Received Entries</CardTitle>
          <CardDescription>
            View and manage all cash received transactions for {getPeriodText().toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Loading cash received entries...</div>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">No cash received entries found for the selected period</div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Mobile View */}
              <div className="block lg:hidden space-y-3">
                {entries.map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        {format(new Date(entry.date), 'MMM dd, yyyy')}
                      </div>
                      <div className="font-bold text-green-600">
                        ৳{entry.amount.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Created: {format(new Date(entry.createdAt), 'MMM dd, HH:mm')}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(entry)}
                        >
                          <IconEdit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openDeleteDialog(entry.id)}
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
          </div>

              {/* Desktop View */}
              <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount (BDT)</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                    {entries.map((entry) => (
                  <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          {format(new Date(entry.date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          ৳{entry.amount.toLocaleString()}
                    </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(entry.createdAt), 'MMM dd, HH:mm')}
                    </TableCell>
                    <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openEditDialog(entry)}
                            >
                              <IconEdit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openDeleteDialog(entry.id)}
                            >
                              <IconTrash className="h-4 w-4" />
                            </Button>
                          </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Cash Received Entry</DialogTitle>
            <DialogDescription>
              Update the details of the cash received transaction
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editForm.date && "text-muted-foreground"
                    )}
                  >
                    <IconCalendar className="mr-2 h-4 w-4" />
                    {editForm.date ? format(editForm.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editForm.date}
                    onSelect={(date) => setEditForm({ ...editForm, date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount (BDT) *</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateEntry} disabled={updating}>
              {updating ? 'Updating...' : 'Update Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the cash received entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteEntry} disabled={deleting !== null}>
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}