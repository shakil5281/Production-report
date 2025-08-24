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
  IconReceipt,
  IconRefresh,
  IconFilter,
  IconX,
  IconDownload,
  IconFileText,
  IconFileSpreadsheet,
  IconCalendarStats,
  IconTrendingDown,
  IconListDetails,
  IconHash
} from '@tabler/icons-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import DailyExpenseForm from '@/components/cashbook/daily-expense-form';

interface DailyExpenseEntry {
  id: string;
  date: string;
  amount: number;
  description: string;
  referenceId: string | null; // Volume number
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface DailyExpenseForm {
  date: Date | undefined;
  volumeNumber: string;
  description: string;
  amount: string;
}

export default function DailyExpensePage() {
  const [entries, setEntries] = useState<DailyExpenseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  
  // Form states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DailyExpenseEntry | null>(null);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  
  const [createForm, setCreateForm] = useState<DailyExpenseForm>({
    date: new Date(),
    volumeNumber: '',
    description: '',
    amount: ''
  });

  const [editForm, setEditForm] = useState<DailyExpenseForm>({
    date: undefined,
    volumeNumber: '',
    description: '',
    amount: ''
  });

  // Enhanced filter states
  const [filters, setFilters] = useState({
    period: 'today' as 'today' | 'current_month' | 'last_month' | 'custom' | 'all_time',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    minAmount: '',
    maxAmount: '',
    description: '',
    volumeNumber: ''
  });

  // Summary
  const [summary, setSummary] = useState({
    totalAmount: 0,
    totalEntries: 0,
    averageAmount: 0,
    highestAmount: 0,
    uniqueDescriptions: 0
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
          startDate = format(new Date(), 'yyyy-MM-dd');
          endDate = format(new Date(), 'yyyy-MM-dd');
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
      if (filters.description) {
        params.append('description', filters.description);
      }
      if (filters.volumeNumber) {
        params.append('volumeNumber', filters.volumeNumber);
      }

      const response = await fetch(`/api/cashbook/daily-expense?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setEntries(data.data);
        // Calculate enhanced summary
        const amounts = data.data.map((entry: DailyExpenseEntry) => entry.amount);
        const totalAmount = amounts.reduce((sum: number, amount: number) => sum + amount, 0);
        const averageAmount = amounts.length > 0 ? totalAmount / amounts.length : 0;
        const highestAmount = amounts.length > 0 ? Math.max(...amounts) : 0;
        const uniqueDescriptions = new Set(data.data.map((entry: DailyExpenseEntry) => entry.description)).size;
        
        setSummary({
          totalAmount,
          totalEntries: data.data.length,
          averageAmount,
          highestAmount,
          uniqueDescriptions
        });
      } else {
        throw new Error(data.error || 'Failed to fetch entries');
      }
    } catch (error) {
      console.error('Error fetching daily expense entries:', error);
      toast.error('Failed to fetch daily expense entries');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const createEntry = async () => {
    if (!createForm.date || !createForm.description || !createForm.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(createForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/cashbook/daily-expense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: format(createForm.date, 'yyyy-MM-dd'),
          amount: amount,
          description: createForm.description,
          referenceId: createForm.volumeNumber || null,
          category: 'Daily Expense'
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Daily expense entry created successfully');
        setIsCreateDialogOpen(false);
        setCreateForm({
          date: new Date(),
          volumeNumber: '',
          description: '',
          amount: ''
        });
        fetchEntries();
      } else {
        throw new Error(data.error || 'Failed to create entry');
      }
    } catch (error) {
      console.error('Error creating daily expense entry:', error);
      toast.error('Failed to create daily expense entry');
    } finally {
      setCreating(false);
    }
  };

  const updateEntry = async () => {
    if (!editForm.date || !editForm.description || !editForm.amount || !editingEntry) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(editForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/cashbook/daily-expense/${editingEntry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: format(editForm.date, 'yyyy-MM-dd'),
          amount: amount,
          description: editForm.description,
          referenceId: editForm.volumeNumber || null,
          category: 'Daily Expense'
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Daily expense entry updated successfully');
        setIsEditDialogOpen(false);
        setEditingEntry(null);
        setEditForm({
          date: undefined,
          volumeNumber: '',
          description: '',
          amount: ''
        });
        fetchEntries();
      } else {
        throw new Error(data.error || 'Failed to update entry');
      }
    } catch (error) {
      console.error('Error updating daily expense entry:', error);
      toast.error('Failed to update daily expense entry');
    } finally {
      setUpdating(false);
    }
  };

  const deleteEntry = async () => {
    if (!deleteEntryId) return;

    setDeleting(deleteEntryId);
    try {
      const response = await fetch(`/api/cashbook/daily-expense/${deleteEntryId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Daily expense entry deleted successfully');
        setIsDeleteDialogOpen(false);
        setDeleteEntryId(null);
        fetchEntries();
      } else {
        throw new Error(data.error || 'Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting daily expense entry:', error);
      toast.error('Failed to delete daily expense entry');
    } finally {
      setDeleting(null);
    }
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text('Daily Expense Report', 14, 22);
      
      // Add period info
      doc.setFontSize(12);
      const periodText = getPeriodText();
      doc.text(periodText, 14, 32);
      
      // Add summary
      doc.text(`Total Amount: ৳${summary.totalAmount.toLocaleString()}`, 14, 42);
      doc.text(`Total Entries: ${summary.totalEntries}`, 14, 52);
      doc.text(`Average Amount: ৳${summary.averageAmount.toLocaleString()}`, 100, 42);
      doc.text(`Unique Categories: ${summary.uniqueDescriptions}`, 100, 52);
      
      // Prepare table data
      const tableColumns = ['Date', 'Description', 'Volume', 'Amount (BDT)'];
      const tableRows = entries.map(entry => [
        format(new Date(entry.date), 'MMM dd, yyyy'),
        entry.description,
        entry.referenceId || '-',
        `৳${entry.amount.toLocaleString()}`
      ]);
      
      // Add table
      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: 65,
        styles: {
          fontSize: 9,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [239, 68, 68],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [254, 242, 242],
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 80 },
          2: { cellWidth: 25 },
          3: { cellWidth: 35, halign: 'right' }
        }
      });
      
      // Save the PDF
      doc.save(`daily-expense-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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
      // Prepare data for Excel
      const excelData = entries.map(entry => ({
        'Date': format(new Date(entry.date), 'MMM dd, yyyy'),
        'Description': entry.description,
        'Volume Number': entry.referenceId || '',
        'Amount (BDT)': entry.amount,
        'Created At': format(new Date(entry.createdAt), 'MMM dd, yyyy HH:mm')
      }));
      
      // Add summary at the top
      const summaryData = [
        { 'Date': 'SUMMARY', 'Description': '', 'Volume Number': '', 'Amount (BDT)': '', 'Created At': '' },
        { 'Date': 'Period', 'Description': getPeriodText(), 'Volume Number': '', 'Amount (BDT)': '', 'Created At': '' },
        { 'Date': 'Total Amount', 'Description': '', 'Volume Number': '', 'Amount (BDT)': summary.totalAmount, 'Created At': '' },
        { 'Date': 'Total Entries', 'Description': '', 'Volume Number': '', 'Amount (BDT)': summary.totalEntries, 'Created At': '' },
        { 'Date': 'Average Amount', 'Description': '', 'Volume Number': '', 'Amount (BDT)': summary.averageAmount, 'Created At': '' },
        { 'Date': 'Unique Categories', 'Description': '', 'Volume Number': '', 'Amount (BDT)': summary.uniqueDescriptions, 'Created At': '' },
        { 'Date': '', 'Description': '', 'Volume Number': '', 'Amount (BDT)': '', 'Created At': '' },
        { 'Date': 'DETAILS', 'Description': '', 'Volume Number': '', 'Amount (BDT)': '', 'Created At': '' },
        ...excelData
      ];
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(summaryData);
      
      // Set column widths
      worksheet['!cols'] = [
        { width: 15 },
        { width: 30 },
        { width: 15 },
        { width: 15 },
        { width: 20 }
      ];
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Expenses');
      
      // Save the file
      XLSX.writeFile(workbook, `daily-expense-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
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
        return `Today (${format(new Date(), 'MMM dd, yyyy')})`;
    }
  };

  const clearFilters = () => {
    setFilters({
      period: 'today',
      startDate: undefined,
      endDate: undefined,
      minAmount: '',
      maxAmount: '',
      description: '',
      volumeNumber: ''
    });
  };

  const openEditDialog = (entry: DailyExpenseEntry) => {
    setEditingEntry(entry);
    setEditForm({
      date: new Date(entry.date),
      volumeNumber: entry.referenceId || '',
      description: entry.description,
      amount: entry.amount.toString()
    });
    setIsEditDialogOpen(true);
  };

  const openCreateSheet = () => {
    setCreateForm({
      date: new Date(),
      volumeNumber: '',
      description: '',
      amount: ''
    });
    setIsCreateDialogOpen(true);
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
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Daily Expenses</h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Manage daily expense transactions and track spending patterns
          </p>
        </div>
        <Sheet open={isCreateDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setCreateForm({
              date: new Date(),
              volumeNumber: '',
              description: '',
              amount: ''
            });
          }
          setIsCreateDialogOpen(open);
        }}>
          <SheetTrigger asChild>
            <Button className="flex items-center justify-center gap-2">
              <IconPlus className="h-4 w-4" />
              <span>Add Daily Expense</span>
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full px-8 overflow-auto pb-12">
            <SheetHeader>
              <SheetTitle>Add Daily Expense Entry</SheetTitle>
              <SheetDescription>
                Enter the details of the daily expense transaction
              </SheetDescription>
            </SheetHeader>
            <DailyExpenseForm
              form={createForm}
              setForm={setCreateForm}
              onSubmit={createEntry}
              isSubmitting={creating}
              onCancel={() => {
                setIsCreateDialogOpen(false);
                setCreateForm({
                  date: new Date(),
                  volumeNumber: '',
                  description: '',
                  amount: ''
                });
              }}
            />
          </SheetContent>
        </Sheet>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                          "w-full justify-start text-left font-normal text-sm",
                          !filters.startDate && "text-muted-foreground"
                        )}
                      >
                        <IconCalendar className="mr-2 h-4 w-4" />
                        {filters.startDate ? format(filters.startDate, "MMM dd") : <span>Start</span>}
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
                          "w-full justify-start text-left font-normal text-sm",
                          !filters.endDate && "text-muted-foreground"
                        )}
                      >
                        <IconCalendar className="mr-2 h-4 w-4" />
                        {filters.endDate ? format(filters.endDate, "MMM dd") : <span>End</span>}
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
              <Label>Description</Label>
              <Input
                placeholder="Search description"
                value={filters.description}
                onChange={(e) => setFilters({ ...filters, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Volume #</Label>
              <Input
                placeholder="Volume number"
                value={filters.volumeNumber}
                onChange={(e) => setFilters({ ...filters, volumeNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Min Amount</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={filters.minAmount}
                onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Amount</Label>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <IconReceipt className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">৳{summary.totalAmount.toLocaleString()}</div>
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
            <IconTrendingDown className="h-4 w-4 text-orange-600" />
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
            <CardTitle className="text-sm font-medium">Highest Expense</CardTitle>
            <IconTrendingDown className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{summary.highestAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Single transaction
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <IconListDetails className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.uniqueDescriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique types
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Expense Entries</CardTitle>
          <CardDescription>
            View and manage all daily expense transactions for {getPeriodText().toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Loading daily expense entries...</div>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">No daily expense entries found for the selected period</div>
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
                      <div className="font-bold text-red-600">
                        ৳{entry.amount.toLocaleString()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium">{entry.description}</div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {entry.referenceId ? (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <IconHash className="h-3 w-3" />
                              {entry.referenceId}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">No volume</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(entry.createdAt), 'MMM dd, HH:mm')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2">
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
                ))}
              </div>
              
              {/* Desktop View */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Volume #</TableHead>
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
                        <TableCell className="max-w-xs">
                          <div className="truncate font-medium">{entry.description}</div>
                        </TableCell>
                        <TableCell>
                          {entry.referenceId ? (
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              <IconHash className="h-3 w-3" />
                              {entry.referenceId}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-bold text-red-600">
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

      {/* Edit Sheet */}
      <Sheet open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingEntry(null);
          setEditForm({
            date: undefined,
            volumeNumber: '',
            description: '',
            amount: ''
          });
        }
        setIsEditDialogOpen(open);
      }}>
        <SheetContent className="w-full px-8 overflow-auto pb-12">
          <SheetHeader>
            <SheetTitle>Edit Daily Expense Entry</SheetTitle>
            <SheetDescription>
              Update the details of the daily expense transaction
            </SheetDescription>
          </SheetHeader>
          <DailyExpenseForm
            form={editForm}
            setForm={setEditForm}
            onSubmit={updateEntry}
            isSubmitting={updating}
            onCancel={() => {
              setIsEditDialogOpen(false);
              setEditingEntry(null);
              setEditForm({
                date: undefined,
                volumeNumber: '',
                description: '',
                amount: ''
              });
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the daily expense entry.
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