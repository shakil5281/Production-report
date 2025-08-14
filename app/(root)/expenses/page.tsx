'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, AlertCircle, DollarSign, Calendar, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface Expense {
  id: string;
  date: string;
  lineId?: string;
  categoryId: string;
  amount: number;
  description?: string;
  paymentMethod: 'CASH' | 'MFS' | 'BANK' | 'OTHER';
  line?: {
    name: string;
    code: string;
    factory: {
      name: string;
    };
  };
  category: {
    name: string;
    isSalaryFlag: boolean;
  };
}

interface Line {
  id: string;
  name: string;
  code: string;
  factory: {
    name: string;
  };
}

interface ExpenseCategory {
  id: string;
  name: string;
  isSalaryFlag: boolean;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    date: '',
    lineId: '',
    categoryId: '',
    paymentMethod: ''
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    lineId: '',
    categoryId: '',
    amount: 0,
    description: '',
    paymentMethod: 'CASH' as 'CASH' | 'MFS' | 'BANK' | 'OTHER'
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        ...(filters.date && { date: filters.date }),
        ...(filters.lineId && { lineId: filters.lineId }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.paymentMethod && { paymentMethod: filters.paymentMethod })
      });

      const response = await fetch(`/api/expenses?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }

      const data = await response.json();
      setExpenses(data.expenses || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [linesRes, categoriesRes] = await Promise.all([
        fetch('/api/lines'),
        fetch('/api/expense-categories')
      ]);

      if (!linesRes.ok || !categoriesRes.ok) {
        throw new Error('Failed to fetch master data');
      }

      const [linesData, categoriesData] = await Promise.all([
        linesRes.json(),
        categoriesRes.json()
      ]);

      setLines(linesData.data || []);
      setCategories(categoriesData || []);
    } catch (err) {
      console.error('Failed to fetch master data:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingExpense 
        ? `/api/expenses/${editingExpense.id}`
        : '/api/expenses';
      
      const method = editingExpense ? 'PUT' : 'POST';
      const body = {
        ...formData,
        amount: parseFloat(formData.amount.toString())
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save expense');
      }

      toast.success(editingExpense ? 'Expense updated successfully' : 'Expense created successfully');
      setIsDialogOpen(false);
      setEditingExpense(null);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      date: expense.date,
      lineId: expense.lineId || '',
      categoryId: expense.categoryId,
      amount: expense.amount,
      description: expense.description || '',
      paymentMethod: expense.paymentMethod
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete expense');
      }

      toast.success('Expense deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete expense');
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      lineId: '',
      categoryId: '',
      amount: 0,
      description: '',
      paymentMethod: 'CASH'
    });
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'bg-green-100 text-green-800';
      case 'MFS':
        return 'bg-blue-100 text-blue-800';
      case 'BANK':
        return 'bg-purple-100 text-purple-800';
      case 'OTHER':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTotalAmount = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  if (loading && expenses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && expenses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchData} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Manage daily expenses and track operational costs
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingExpense(null);
              resetForm();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? 'Edit Expense' : 'Add Expense'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="categoryId">Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                        {category.isSalaryFlag && ' (Salary)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="lineId">Production Line (Optional)</Label>
                <Select
                  value={formData.lineId}
                  onValueChange={(value) => setFormData({ ...formData, lineId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select line (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">General (No specific line)</SelectItem>
                    {lines?.map((line) => (
                      <SelectItem key={line.id} value={line.id}>
                        {line.name} ({line.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value: 'CASH' | 'MFS' | 'BANK' | 'OTHER') => 
                    setFormData({ ...formData, paymentMethod: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="MFS">MFS</SelectItem>
                    <SelectItem value="BANK">Bank Transfer</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter expense description..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingExpense ? 'Update' : 'Create'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingExpense(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Expense Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">
            ${getTotalAmount().toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground">
            Total expenses for the selected period
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="filterDate">Date</Label>
              <Input
                id="filterDate"
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="filterLineId">Production Line</Label>
              <Select
                value={filters.lineId}
                onValueChange={(value) => setFilters({ ...filters, lineId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All lines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All lines</SelectItem>
                  {lines?.map((line) => (
                    <SelectItem key={line.id} value={line.id}>
                      {line.name} ({line.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterCategoryId">Category</Label>
              <Select
                value={filters.categoryId}
                onValueChange={(value) => setFilters({ ...filters, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterPaymentMethod">Payment Method</Label>
              <Select
                value={filters.paymentMethod}
                onValueChange={(value) => setFilters({ ...filters, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All methods</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="MFS">MFS</SelectItem>
                  <SelectItem value="BANK">Bank Transfer</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Records</CardTitle>
          <p className="text-sm text-muted-foreground">
            {expenses.length} expenses found
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No expenses found for the selected criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Line</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{expense.category.name}</span>
                          {expense.category.isSalaryFlag && (
                            <Badge variant="outline" className="text-xs">
                              Salary
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {expense.line ? (
                          <div>
                            <div className="font-medium">{expense.line.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {expense.line.code}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">General</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {expense.description || (
                          <span className="text-muted-foreground">No description</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPaymentMethodColor(expense.paymentMethod)}>
                          {expense.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${expense.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(expense)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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
