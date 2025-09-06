'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IconPlus, IconCalendar, IconUsers, IconList, IconFilter, IconRefresh, IconX } from '@tabler/icons-react';
import { UniversalFilterSheet, FilterField, UniversalFilterState } from '@/components/ui/universal-filter-sheet';
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
  const [filters, setFilters] = useState<UniversalFilterState>({
    lineId: 'all',
    status: 'all',
    activeOnly: 'false'
  });
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Filter fields configuration
  const filterFields: FilterField[] = [
    {
      key: 'lineId',
      label: 'Production Line',
      type: 'select',
      options: [
        ...lines.map(line => ({
          value: line.id,
          label: `${line.name} (${line.code})`
        }))
      ]
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'RUNNING', label: 'Running' },
        { value: 'COMPLETE', label: 'Complete' },
        { value: 'CANCELLED', label: 'Cancelled' }
      ]
    },
    {
      key: 'activeOnly',
      label: 'Show Active Only',
      type: 'select',
      options: [
        { value: 'false', label: 'Show All' },
        { value: 'true', label: 'Active Only' }
      ]
    }
  ];

  // Fetch assignments and related data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters.lineId !== 'all') params.set('lineId', filters.lineId);
      if (filters.status !== 'all') params.set('status', filters.status);
      if (filters.activeOnly === 'true') params.set('activeOnly', 'true');
      
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
  }, [filters]);

  // Filter handlers
  const handleFiltersChange = (newFilters: UniversalFilterState) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: UniversalFilterState = {
      lineId: 'all',
      status: 'all',
      activeOnly: 'false'
    };
    setFilters(clearedFilters);
  };

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
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Line Assignments
          </h1>
          <p className="text-muted-foreground">
            Assign running production styles to manufacturing lines
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchData}
            disabled={loading}
          >
            <IconRefresh className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button>
                <IconPlus className="h-4 w-4 mr-2" />
                New Assignment
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[600px] max-w-full overflow-x-scroll">
              <SheetHeader>
                <SheetTitle>Create Line Assignment</SheetTitle>
                <SheetDescription>
                  Assign a running production style to a manufacturing line
                </SheetDescription>
              </SheetHeader>
                <div className="mt-6">
                  <AssignmentForm
                    lines={lines}
                    productionItems={productionItems}
                    onSubmit={handleCreateAssignment}
                    onCancel={() => setSheetOpen(false)}
                    loading={loading}
                  />
                </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <IconList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">All line assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeAssignments}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production Lines</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalLines}</div>
            <p className="text-xs text-muted-foreground">Available lines</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Styles</CardTitle>
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalProductionItems}</div>
            <p className="text-xs text-muted-foreground">Available for assignment</p>
          </CardContent>
        </Card>
      </div>


      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <IconX className="h-4 w-4" />
              <span className="flex-1">{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Line Assignments</CardTitle>
              <CardDescription>
                Current assignments of running production styles to manufacturing lines
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <UniversalFilterSheet
                open={filterSheetOpen}
                onOpenChange={setFilterSheetOpen}
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
                fields={filterFields}
                title="Filter Line Assignments"
                description="Use the filters below to narrow down your line assignments"
              />
              <Button variant="outline" onClick={fetchData} disabled={loading}>
                <IconRefresh className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
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
