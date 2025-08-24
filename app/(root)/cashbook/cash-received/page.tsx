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
        const amounts = data.data.map((entry: CashReceivedEntry) => Number(entry.amount) || 0);
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

  const updateEntry = async (data: { date: Date; amount: number }) => {
    if (!editingEntry) {
      toast.error('No entry selected for editing');
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
        toast.success('Cash received entry updated successfully');
        setIsEditSheetOpen(false);
        setEditingEntry(null);
        fetchEntries();
      } else {
        throw new Error(result.error || 'Failed to update entry');
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
        const received = Number(entry.amount) || 0;
        runningTotal = opening + received;
        
        return [
          format(new Date(entry.date), 'dd-MMM-yy'),
          opening === 0 ? '' : opening.toLocaleString(),
          received.toLocaleString(),
          runningTotal.toLocaleString()
        ];
      });
      
      // Add summary row
      const totalReceived = entries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
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
        const received = Number(entry.amount) || 0;
        runningTotal = opening + received;
        
        XLSX.utils.sheet_add_aoa(worksheet, [
          [entryDate, opening === 0 ? '' : opening, received, runningTotal]
        ], { origin: `A${currentRow}` });
        
        currentRow++;
      });

      // Add summary row
      const totalReceived = entries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
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
    setIsEditSheetOpen(true);
  };

  const openDeleteDialog = (entryId: string) => {
    setDeleteEntryId(entryId);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <IconCash className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 lg:text-3xl">
                Cash Received
              </h1>
              <p className="text-muted-foreground text-sm lg:text-base">
                Manage incoming cash transactions and revenue entries
              </p>
            </div>
          </div>
        </div>
        
        {/* Create Sheet */}
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
            <SheetTrigger asChild>
              <Button className="flex items-center justify-center gap-2 h-11 px-6 bg-green-600 hover:bg-green-700 focus:ring-green-500 shadow-sm">
                <IconPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Cash Received</span>
                <span className="sm:hidden">Add Entry</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-auto px-6 pb-8">
              <SheetHeader>
                <SheetTitle>Add Cash Received Entry</SheetTitle>
                <SheetDescription>
                  Enter the details of the cash received transaction
                </SheetDescription>
              </SheetHeader>
              <CashReceivedForm
                mode="create"
                onSubmit={async (data) => {
                  await createEntry(data);
                  setIsCreateSheetOpen(false);
                }}
                onCancel={() => setIsCreateSheetOpen(false)}
                loading={creating}
              />
            </SheetContent>
          </Sheet>

          {/* Edit Sheet */}
          <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
            <SheetContent className="w-full sm:max-w-md overflow-auto px-6 pb-8">
              <SheetHeader>
                <SheetTitle>Edit Cash Received Entry</SheetTitle>
                <SheetDescription>
                  Update the details of the cash received transaction
                </SheetDescription>
              </SheetHeader>
              {editingEntry && (
                <CashReceivedForm
                  mode="edit"
                  initialData={{
                    date: new Date(editingEntry.date),
                    amount: editingEntry.amount
                  }}
                  onSubmit={async (data) => {
                    await updateEntry(data);
                  }}
                  onCancel={() => {
                    setIsEditSheetOpen(false);
                    setEditingEntry(null);
                  }}
                  loading={updating}
                />
              )}
            </SheetContent>
          </Sheet>
        </div>
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
                <SelectTrigger className="h-11">
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
                          "w-full justify-start text-left font-normal h-11",
                          !filters.startDate && "text-muted-foreground"
                        )}
                      >
                        <IconCalendar className="mr-2 h-4 w-4" />
                        {filters.startDate ? format(filters.startDate, "MMM dd, yyyy") : <span>Start date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.startDate}
                        onSelect={(date) => {
                          setFilters({ ...filters, startDate: date });
                          // Auto-close calendar when date is selected
                          if (date && filters.endDate && date > filters.endDate) {
                            setFilters({ ...filters, startDate: date, endDate: undefined });
                          }
                        }}
                        initialFocus
                        className="rounded-md border"
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
                          "w-full justify-start text-left font-normal h-11",
                          !filters.endDate && "text-muted-foreground"
                        )}
                      >
                        <IconCalendar className="mr-2 h-4 w-4" />
                        {filters.endDate ? format(filters.endDate, "MMM dd, yyyy") : <span>End date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.endDate}
                        onSelect={(date) => {
                          setFilters({ ...filters, endDate: date });
                          // Auto-close calendar when date is selected
                        }}
                        initialFocus
                        disabled={(date) => filters.startDate ? date < filters.startDate : false}
                        className="rounded-md border"
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
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Amount (BDT)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={filters.maxAmount}
                onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                className="h-11"
              />
            </div>
          </div>
          
          <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={fetchEntries}
                disabled={loading}
                className="flex items-center gap-2 h-11 px-4"
              >
                <IconRefresh className="h-4 w-4" />
                <span className="hidden sm:inline">Apply Filters</span>
                <span className="sm:hidden">Apply</span>
              </Button>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex items-center gap-2 h-11 px-4"
              >
                <IconX className="h-4 w-4" />
                <span className="hidden sm:inline">Clear Filters</span>
                <span className="sm:hidden">Clear</span>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1 text-xs px-3 py-1">
                <IconCalendarStats className="h-3 w-3" />
                <span className="hidden sm:inline">{getPeriodText()}</span>
                <span className="sm:hidden">
                  {filters.period === 'today' ? 'Today' :
                   filters.period === 'current_month' ? 'Current' : 
                   filters.period === 'last_month' ? 'Last' :
                   filters.period === 'all_time' ? 'All' : 'Custom'}
                </span>
              </Badge>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToPDF}
                  disabled={exporting || entries.length === 0}
                  className="flex items-center gap-2 h-9 px-3"
                >
                  <IconFileText className="h-4 w-4" />
                  <span className="hidden sm:inline">PDF</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToExcel}
                  disabled={exporting || entries.length === 0}
                  className="flex items-center gap-2 h-9 px-3"
                >
                  <IconFileSpreadsheet className="h-4 w-4" />
                  <span className="hidden sm:inline">Excel</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-green-800">Total Amount</CardTitle>
            <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
              <IconCash className="h-5 w-5 text-green-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800 mb-1">৳{summary.totalAmount.toLocaleString()}</div>
            <p className="text-xs text-green-600 font-medium">
              Period total
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-blue-800">Total Entries</CardTitle>
            <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
              <IconCalendar className="h-5 w-5 text-blue-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800 mb-1">{summary.totalEntries}</div>
            <p className="text-xs text-blue-600 font-medium">
              Transaction count
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-orange-800">Average Amount</CardTitle>
            <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
              <IconTrendingUp className="h-5 w-5 text-orange-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800 mb-1">৳{summary.averageAmount.toLocaleString()}</div>
            <p className="text-xs text-orange-600 font-medium">
              Per transaction
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-purple-800">Highest Amount</CardTitle>
            <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center">
              <IconTrendingUp className="h-5 w-5 text-purple-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800 mb-1">৳{summary.highestAmount.toLocaleString()}</div>
            <p className="text-xs text-purple-600 font-medium">
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
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <div className="text-muted-foreground">Loading cash received entries...</div>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconCash className="h-8 w-8 text-gray-400" />
              </div>
              <div className="text-muted-foreground mb-2">No cash received entries found</div>
              <div className="text-sm text-gray-500">Try adjusting your filters or add a new entry</div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Mobile View - Enhanced */}
              <div className="block lg:hidden space-y-3">
                {entries.map((entry) => (
                  <div key={entry.id} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white hover:bg-gray-50 transition-colors duration-200">
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <IconCash className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {format(new Date(entry.date), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-xs text-gray-500">
                            Entry #{entry.id.slice(-6)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-green-600">
                          ৳{(Number(entry.amount) || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          Amount
                        </div>
                      </div>
                    </div>
                    
                    {/* Details Row */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Created</div>
                        <div className="text-sm font-medium text-gray-900">
                          {format(new Date(entry.createdAt), 'MMM dd, HH:mm')}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Updated</div>
                        <div className="text-sm font-medium text-gray-900">
                          {format(new Date(entry.updatedAt), 'MMM dd, HH:mm')}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        ID: {entry.id}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(entry)}
                          className="h-8 px-3 text-xs"
                        >
                          <IconEdit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openDeleteDialog(entry.id)}
                          className="h-8 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <IconTrash className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View - Enhanced */}
              <div className="hidden lg:block">
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead className="font-semibold text-gray-900 py-4">Date</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-4">Amount (BDT)</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-4">Created</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-4">Updated</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-4 text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map((entry) => (
                        <TableRow key={entry.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <TableCell className="py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <IconCash className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {format(new Date(entry.date), 'MMM dd, yyyy')}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Entry #{entry.id.slice(-6)}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="text-right">
                              <div className="font-bold text-lg text-green-600">
                                ৳{entry.amount.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                BDT
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="text-sm text-gray-900">
                              {format(new Date(entry.createdAt), 'MMM dd, yyyy')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(entry.createdAt), 'HH:mm')}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="text-sm text-gray-900">
                              {format(new Date(entry.updatedAt), 'MMM dd, yyyy')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(entry.updatedAt), 'HH:mm')}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openEditDialog(entry)}
                                className="h-8 px-3"
                              >
                                <IconEdit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openDeleteDialog(entry.id)}
                                className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <IconTrash className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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