'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, PlusIcon, EditIcon, TrashIcon, DollarSignIcon, CalendarIcon as CalendarIcon2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MonthlyExpenseEntry {
  id: string;
  month: number;
  year: number;
  category: string;
  amount: number;
  description?: string;
  paymentDate?: string;
  paymentStatus: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

const expenseCategories = [
  'Electric Bill',
  'Rent Building',
  'Insurance',
  'Water Bill',
  'Internet & Phone',
  'Maintenance',
  'Security',
  'Cleaning',
  'Office Supplies',
  'Legal & Professional',
  'Miscellaneous'
];

const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

export default function MonthlyExpensePage() {
  const [expenseData, setExpenseData] = useState<MonthlyExpenseEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<MonthlyExpenseEntry | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  // Safe number formatting with fallback to 0
  const formatNumber = (value: number | undefined | null): string => {
    const num = Number(value) || 0;
    return num.toLocaleString();
  };

  // Form state
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    category: '',
    amount: '',
    description: '',
    paymentDate: undefined as Date | undefined,
    paymentStatus: 'PENDING' as 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED',
    remarks: ''
  });

  useEffect(() => {
    fetchExpenses();
  }, [selectedMonth, selectedYear]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/expenses/monthly?month=${selectedMonth}&year=${selectedYear}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setExpenseData(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const url = editingExpense 
        ? `/api/expenses/monthly/${editingExpense.id}`
        : '/api/expenses/monthly';
      
      const method = editingExpense ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          paymentDate: formData.paymentDate ? format(formData.paymentDate, 'yyyy-MM-dd') : null
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(editingExpense ? 'Expense updated successfully' : 'Expense added successfully');
          setIsDialogOpen(false);
          resetForm();
          fetchExpenses();
        } else {
          toast.error(result.error || 'Operation failed');
        }
      } else {
        toast.error('Operation failed');
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error('Failed to save expense');
    }
  };

  const handleEdit = (expense: MonthlyExpenseEntry) => {
    setEditingExpense(expense);
    setFormData({
      month: expense.month,
      year: expense.year,
      category: expense.category,
      amount: expense.amount.toString(),
      description: expense.description || '',
      paymentDate: expense.paymentDate ? new Date(expense.paymentDate) : undefined,
      paymentStatus: expense.paymentStatus,
      remarks: expense.remarks || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const response = await fetch(`/api/expenses/monthly/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Expense deleted successfully');
        fetchExpenses();
      } else {
        toast.error('Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const resetForm = () => {
    setFormData({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      category: '',
      amount: '',
      description: '',
      paymentDate: undefined,
      paymentStatus: 'PENDING',
      remarks: ''
    });
    setEditingExpense(null);
  };

  const openDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  // Calculate summary statistics
  const totalExpenses = expenseData.reduce((sum, entry) => sum + entry.amount, 0);
  const paidExpenses = expenseData.filter(entry => entry.paymentStatus === 'PAID')
    .reduce((sum, entry) => sum + entry.amount, 0);
  const pendingExpenses = expenseData.filter(entry => entry.paymentStatus === 'PENDING')
    .reduce((sum, entry) => sum + entry.amount, 0);
  const overdueExpenses = expenseData.filter(entry => entry.paymentStatus === 'OVERDUE')
    .reduce((sum, entry) => sum + entry.amount, 0);

  // Category breakdown
  const categoryTotals = expenseData.reduce((acc, entry) => {
    acc[entry.category] = (acc[entry.category] || 0) + entry.amount;
    return acc;
  }, {} as Record<string, number>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0 lg:gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Monthly Expense Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage monthly operational expenses like Electric Bill, Rent, Insurance, etc.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openDialog} className="w-full sm:w-auto">
              <PlusIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Monthly Expense</span>
              <span className="sm:hidden">Add Expense</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="mx-4 sm:mx-0 sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? 'Edit Monthly Expense' : 'Add Monthly Expense'}
              </DialogTitle>
              <DialogDescription>
                {editingExpense ? 'Update the monthly expense details' : 'Add a new monthly expense entry'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="month">Month *</Label>
                  <Select
                    value={formData.month.toString()}
                    onValueChange={(value) => setFormData({ ...formData, month: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year *</Label>
                  <Select
                    value={formData.year.toString()}
                    onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (৳) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Enter amount"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentDate">Payment Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.paymentDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon2 className="mr-2 h-4 w-4" />
                        {formData.paymentDate ? format(formData.paymentDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.paymentDate}
                        onSelect={(date) => setFormData({ ...formData, paymentDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select
                    value={formData.paymentStatus}
                    onValueChange={(value: any) => setFormData({ ...formData, paymentStatus: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="OVERDUE">Overdue</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Enter remarks"
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingExpense ? 'Update' : 'Add'} Expense
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Month/Year Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="month-select">Month</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="year-select">Year</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ৳{formatNumber(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {months[selectedMonth - 1]?.label} {selectedYear}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <Badge className="bg-green-100 text-green-800">৳{formatNumber(paidExpenses)}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ৳{formatNumber(paidExpenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalExpenses > 0 ? ((paidExpenses / totalExpenses) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Badge className="bg-yellow-100 text-yellow-800">৳{formatNumber(pendingExpenses)}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ৳{formatNumber(pendingExpenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalExpenses > 0 ? ((pendingExpenses / totalExpenses) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Badge className="bg-yellow-100 text-yellow-800">৳{formatNumber(overdueExpenses)}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ৳{formatNumber(overdueExpenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalExpenses > 0 ? ((overdueExpenses / totalExpenses) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>Expense distribution by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(categoryTotals).map(([category, amount]) => (
              <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{category}</span>
                <span className="text-lg font-bold text-red-600">৳{formatNumber(amount)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Expenses</CardTitle>
          <CardDescription>
            {months[selectedMonth - 1]?.label} {selectedYear} - {expenseData.length} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          ) : expenseData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">No expenses found for this period</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseData.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.category}</TableCell>
                      <TableCell className="font-bold text-red-600">
                        ৳{formatNumber(expense.amount)}
                      </TableCell>
                      <TableCell>{expense.description || '-'}</TableCell>
                      <TableCell>
                        {expense.paymentDate ? format(new Date(expense.paymentDate), 'MMM dd, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(expense.paymentStatus)}>
                          {expense.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{expense.remarks || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(expense)}
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(expense.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
