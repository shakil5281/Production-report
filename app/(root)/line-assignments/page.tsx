'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IconPlus, IconCalendar, IconUsers, IconList, IconFilter, IconRefresh, IconX } from '@tabler/icons-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

import type { 
  LineAssignment, 
  Line, 
  ProductionListItem, 
  AssignmentSummary,
  LineAssignmentFormData 
} from '@/components/line-assignments/schema';
import { isAssignmentActive } from '@/components/line-assignments/schema';
import { AssignmentForm } from '@/components/line-assignments/assignment-form';
import { AssignmentTable } from '@/components/line-assignments/assignment-table';

export default function LineAssignmentsPage() {
  const [assignments, setAssignments] = useState<LineAssignment[]>([]);
  const [productionItems, setProductionItems] = useState<ProductionListItem[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [summary, setSummary] = useState<AssignmentSummary>({
    totalAssignments: 0,
    activeAssignments: 0,
    totalLines: 0,
    totalProductionItems: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  
  // Filters
  const [filterLine, setFilterLine] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // Fetch assignments and related data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filterLine !== 'all') params.set('lineId', filterLine);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (showActiveOnly) params.set('activeOnly', 'true');
      
      const response = await fetch(`/api/line-assignments?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setAssignments(result.data.assignments);
        setProductionItems(result.data.productionItems);
        setLines(result.data.lines);
        setSummary(result.data.summary);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [filterLine, filterStatus, showActiveOnly]);

  // Create new assignment
  const handleCreateAssignment = useCallback(async (formData: LineAssignmentFormData): Promise<boolean> => {
    try {
      const response = await fetch('/api/line-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Assignment created successfully!');
        setSheetOpen(false);
        await fetchData();
        return true;
      } else {
        toast.error(result.error || 'Failed to create assignment');
        return false;
      }
    } catch (err) {
      toast.error('Network error occurred');
      console.error('Error creating assignment:', err);
      return false;
    }
  }, [fetchData]);

  // Delete assignment
  const handleDeleteAssignment = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/line-assignments/${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Assignment deleted successfully!');
        await fetchData();
        return true;
      } else {
        toast.error(result.error || 'Failed to delete assignment');
        return false;
      }
    } catch (err) {
      toast.error('Network error occurred');
      console.error('Error deleting assignment:', err);
      return false;
    }
  }, [fetchData]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      {/* Modern Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
              <IconUsers className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Line Assignments
              </h1>
              <p className="text-muted-foreground text-lg">
                Assign running production styles to manufacturing lines
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchData}
            disabled={loading}
            className="border-2 hover:border-blue-300 transition-colors"
          >
            <IconRefresh className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                <IconPlus className="h-4 w-4 mr-2" />
                New Assignment
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[600px] max-w-full">
              <SheetHeader>
                <SheetTitle className="text-xl font-semibold">Create Line Assignment</SheetTitle>
                <SheetDescription className="text-base">
                  Assign a running production style to a manufacturing line
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-100px)]">
                <div className="mt-6">
                  <AssignmentForm
                    lines={lines}
                    productionItems={productionItems}
                    onSubmit={handleCreateAssignment}
                    onCancel={() => setSheetOpen(false)}
                    loading={loading}
                  />
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Modern Summary Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Assignments</CardTitle>
            <div className="p-2 bg-blue-200 rounded-lg">
              <IconList className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{summary.totalAssignments}</div>
            <p className="text-xs text-blue-600 mt-1">All line assignments</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Active Now</CardTitle>
            <div className="p-2 bg-green-200 rounded-lg">
              <div className="h-4 w-4 rounded-full bg-green-500 animate-pulse" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{summary.activeAssignments}</div>
            <p className="text-xs text-green-600 mt-1">Currently running</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Production Lines</CardTitle>
            <div className="p-2 bg-purple-200 rounded-lg">
              <IconUsers className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{summary.totalLines}</div>
            <p className="text-xs text-purple-600 mt-1">Available lines</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Running Styles</CardTitle>
            <div className="p-2 bg-orange-200 rounded-lg">
              <IconCalendar className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">{summary.totalProductionItems}</div>
            <p className="text-xs text-orange-600 mt-1">Available for assignment</p>
          </CardContent>
        </Card>
      </div>

      {/* Modern Filters */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 bg-gray-200 rounded-lg">
              <IconFilter className="h-5 w-5 text-gray-600" />
            </div>
            Smart Filters
          </CardTitle>
          <CardDescription className="text-base">Filter assignments by line and active state</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label htmlFor="line-filter" className="text-sm font-semibold text-gray-700">Production Line</label>
              <Select value={filterLine} onValueChange={setFilterLine}>
                <SelectTrigger className="border-2 hover:border-blue-300 transition-colors">
                  <SelectValue placeholder="Select line" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lines</SelectItem>
                  {lines.map(line => (
                    <SelectItem key={line.id} value={line.id}>
                      {line.name} ({line.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="status-filter" className="text-sm font-semibold text-gray-700">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="border-2 hover:border-blue-300 transition-colors">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="RUNNING">Running</SelectItem>
                  <SelectItem value="COMPLETE">Complete</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant={showActiveOnly ? "default" : "outline"}
                onClick={() => setShowActiveOnly(!showActiveOnly)}
                className={`w-full border-2 transition-all duration-300 ${showActiveOnly 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg' 
                  : 'hover:border-green-300 hover:bg-green-50'
                }`}
              >
                {showActiveOnly ? "Show All" : "Active Only"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modern Error Display */}
      {error && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-700">
              <div className="p-2 bg-red-100 rounded-lg">
                <IconX className="h-4 w-4 text-red-600" />
              </div>
              <span className="flex-1 font-medium">{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                className="border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modern Assignments Table */}
      <Card className="border-0 shadow-xl bg-white">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <CardTitle className="text-xl font-semibold text-gray-800">Line Assignments</CardTitle>
          <CardDescription className="text-base text-gray-600">
            Current assignments of running production styles to manufacturing lines
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <AssignmentTable
            assignments={assignments}
            loading={loading}
            onDelete={handleDeleteAssignment}
            onRefresh={fetchData}
          />
        </CardContent>
      </Card>
    </div>
  );
}
