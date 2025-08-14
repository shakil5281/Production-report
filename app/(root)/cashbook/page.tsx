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
import { Plus, Edit, Trash2, AlertCircle, DollarSign, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface CashbookEntry {
  id: string;
  date: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  category: string;
  referenceType?: string;
  referenceId?: string;
  lineId?: string;
  description?: string;
  runningBalance: number;
  line?: {
    name: string;
    code: string;
    factory: {
      name: string;
    };
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

export default function CashbookPage() {
  const [entries, setEntries] = useState<CashbookEntry[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    date: '',
    type: '',
    category: '',
    lineId: ''
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CashbookEntry | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'DEBIT' as 'DEBIT' | 'CREDIT',
    amount: 0,
    category: '',
    referenceType: '',
    referenceId: '',
    lineId: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  useEffect(() => {
    fetchLines();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        ...(filters.date && { date: filters.date }),
        ...(filters.type && { type: filters.type }),
        ...(filters.category && { category: filters.category }),
        ...(filters.lineId && { lineId: filters.lineId })
      });

      const response = await fetch(`/api/cashbook?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cashbook entries');
      }

      const data = await response.json();
      setEntries(data.entries || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to fetch cashbook entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchLines = async () => {
    try {
      const response = await fetch('/api/lines');
      if (response.ok) {
        const data = await response.json();
        setLines(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch lines:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingEntry 
        ? `/api/cashbook/${editingEntry.id}`
        : '/api/cashbook';
      
      const method = editingEntry ? 'PUT' : 'POST';
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
        throw new Error(errorData.error || 'Failed to save cashbook entry');
      }

      toast.success(editingEntry ? 'Entry updated successfully' : 'Entry created successfully');
      setIsDialogOpen(false);
      setEditingEntry(null);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleEdit = (entry: CashbookEntry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date,
      type: entry.type,
      amount: entry.amount,
      category: entry.category,
      referenceType: entry.referenceType || '',
      referenceId: entry.referenceId || '',
      lineId: entry.lineId || '',
      description: entry.description || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      const response = await fetch(`/api/cashbook/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete entry');
      }

      toast.success('Entry deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete entry');
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'DEBIT',
      amount: 0,
      category: '',
      referenceType: '',
      referenceId: '',
      lineId: '',
      description: ''
    });
  };

  const getTypeColor = (type: string) => {
    return type === 'CREDIT' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getTotalBalance = () => {
    if (entries.length === 0) return 0;
    return entries[entries.length - 1].runningBalance;
  };

  const getTotalCredits = () => {
    return entries
      .filter(entry => entry.type === 'CREDIT')
      .reduce((sum, entry) => sum + entry.amount, 0);
  };

  const getTotalDebits = () => {
    return entries
      .filter(entry => entry.type === 'DEBIT')
      .reduce((sum, entry) => sum + entry.amount, 0);
  };

  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && entries.length === 0) {
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
          <h1 className="text-3xl font-bold tracking-tight">Cashbook</h1>
          <p className="text-muted-foreground">
            Track all money in and out with running balance
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingEntry(null);
              resetForm();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? 'Edit Cashbook Entry' : 'Add Cashbook Entry'}
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
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'DEBIT' | 'CREDIT') => 
                    setFormData({ ...formData, type: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEBIT">Debit (Money Out)</SelectItem>
                    <SelectItem value="CREDIT">Credit (Money In)</SelectItem>
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
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Salary, Materials, Sales, etc."
                  required
                />
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
                    {lines.map((line) => (
                      <SelectItem key={line.id} value={line.id}>
                        {line.name} ({line.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="referenceType">Reference Type (Optional)</Label>
                  <Input
                    id="referenceType"
                    value={formData.referenceType}
                    onChange={(e) => setFormData({ ...formData, referenceType: e.target.value })}
                    placeholder="e.g., Invoice, PO, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="referenceId">Reference ID (Optional)</Label>
                  <Input
                    id="referenceId"
                    value={formData.referenceId}
                    onChange={(e) => setFormData({ ...formData, referenceId: e.target.value })}
                    placeholder="e.g., INV-001"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter additional details..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingEntry ? 'Update' : 'Create'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingEntry(null);
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${getTotalCredits().toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total money in
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debits</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${getTotalDebits().toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total money out
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              getTotalBalance() >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${getTotalBalance().toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Current balance
            </p>
          </CardContent>
        </Card>
      </div>

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
              <Label htmlFor="filterType">Type</Label>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters({ ...filters, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="CREDIT">Credit (Money In)</SelectItem>
                  <SelectItem value="DEBIT">Debit (Money Out)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterCategory">Category</Label>
              <Input
                id="filterCategory"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                placeholder="Filter by category..."
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
                  {lines.map((line) => (
                    <SelectItem key={line.id} value={line.id}>
                      {line.name} ({line.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cashbook Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cashbook Entries</CardTitle>
          <p className="text-sm text-muted-foreground">
            {entries.length} entries found
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No cashbook entries found for the selected criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Line</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(entry.type)}>
                          {entry.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {entry.category}
                      </TableCell>
                      <TableCell>
                        {entry.line ? (
                          <div>
                            <div className="font-medium">{entry.line.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {entry.line.code}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">General</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.referenceType && entry.referenceId ? (
                          <div className="text-sm">
                            <div className="font-medium">{entry.referenceType}</div>
                            <div className="text-muted-foreground">{entry.referenceId}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.description || (
                          <span className="text-muted-foreground">No description</span>
                        )}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        entry.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {entry.type === 'CREDIT' ? '+' : '-'}${entry.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        entry.runningBalance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${entry.runningBalance.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(entry)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(entry.id)}
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
