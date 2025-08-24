'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { IconTarget, IconPlus, IconCalendar, IconEdit, IconTrash, IconEye } from '@tabler/icons-react';
import { toast } from 'sonner';
import { useCalendarAutoClose } from '@/hooks/use-calendar-auto-close';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TargetDataTable } from '@/components/target/target-data-table';

interface Target {
  id: string;
  lineNo: string;
  styleNo: string;
  lineTarget: number;
  date: string;
  inTime: string;
  outTime: string;
  hourlyProduction: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductionItem {
  id: string;
  styleNo?: string;
  styleNumber?: string;
  buyer: string;
  item?: string;
  status: string;
}

interface LineAssignment {
  id: string;
  lineId: string;
  styleId: string;
  startDate: string;
  endDate: string | null;
  targetPerHour: number;
  line: {
    id: string;
    name: string;
    code: string;
    isActive: boolean;
  };
  style: {
    id: string;
    styleNumber: string;
    buyer: string;
    orderQty: number;
    unitPrice: string;
    status: string;
  };
}

interface LineAssignmentResponse {
  success: boolean;
  data: {
    assignments: LineAssignment[];
    productionItems: ProductionItem[];
    lines: {
      id: string;
      name: string;
      code: string;
      isActive: boolean;
    }[];
    summary: {
      totalAssignments: number;
      activeAssignments: number;
      totalLines: number;
      totalProductionItems: number;
    };
  };
}

export default function TargetPage() {
  const { isCalendarOpen, setIsCalendarOpen } = useCalendarAutoClose();
  
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Target | null>(null);
  const [targets, setTargets] = useState<Target[]>([]);
  const [productionItems, setProductionItems] = useState<ProductionItem[]>([]);
  const [lineAssignments, setLineAssignments] = useState<LineAssignment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    productionListId: '',
    lineNo: '',
    styleNo: '',
    lineTarget: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    inTime: '',
    outTime: '',
    hourlyProduction: ''
  });

  // Set default times based on current time
  useEffect(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // If time is 20:02, set inTime to 19:00 and outTime to 20:00
    let inTime = '';
    let outTime = '';
    
    if (currentHour >= 20 && currentMinute >= 2) {
      inTime = '19:00';
      outTime = '20:00';
    } else if (currentHour > 8) {
      // Set inTime to current hour - 1, outTime to current hour
      inTime = `${(currentHour - 1).toString().padStart(2, '0')}:00`;
      outTime = `${currentHour.toString().padStart(2, '0')}:00`;
    } else {
      // Default times
      inTime = '08:00';
      outTime = '17:00';
    }
    
    setFormData(prev => ({
      ...prev,
      inTime,
      outTime
    }));
  }, []);

  useEffect(() => {
    fetchTargets();
    fetchLineAssignments();
  }, [selectedDate]);

  const fetchTargets = async () => {
    setLoading(true);
    try {
      // Format date as YYYY-MM-DD in local timezone to avoid timezone issues
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      // Debug log to verify correct date formatting
      console.log(`📅 Fetching targets for date: ${formattedDate} (Selected: ${selectedDate.toDateString()})`);
      
      const response = await fetch(`/api/target?date=${formattedDate}`);
      const data = await response.json();
      if (data.success) {
        setTargets(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching targets:', error);
      toast.error('Failed to fetch targets');
    } finally {
      setLoading(false);
    }
  };

  const fetchLineAssignments = async () => {
    try {
      const response = await fetch('/api/line-assignments');
      const data: LineAssignmentResponse = await response.json();
      if (data.success) {
        setLineAssignments(data.data.assignments || []);
        setProductionItems(data.data.productionItems || []);
      }
    } catch (error) {
      console.error('Error fetching line assignments:', error);
      toast.error('Failed to fetch line assignments');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const url = editingItem ? `/api/target/${editingItem.id}` : '/api/target';
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineNo: formData.lineNo,
          styleNo: formData.styleNo,
          lineTarget: parseInt(formData.lineTarget),
          date: formData.date,
          inTime: formData.inTime,
          outTime: formData.outTime,
          hourlyProduction: parseInt(formData.hourlyProduction) || 0
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(editingItem ? 'Target updated successfully!' : 'Target created successfully!');
        setSheetOpen(false);
        resetForm();
        fetchTargets();
      } else {
        toast.error(result.error || 'Failed to save target');
      }
    } catch (error) {
      console.error('Error saving target:', error);
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (target: Target) => {
    setFormData({
      productionListId: '', // Reset when editing existing target
      lineNo: target.lineNo,
      styleNo: target.styleNo,
      lineTarget: target.lineTarget.toString(),
      date: target.date.split('T')[0], // Extract date part
      inTime: target.inTime,
      outTime: target.outTime,
      hourlyProduction: target.hourlyProduction.toString()
    });
    setEditingItem(target);
    setSheetOpen(true);
  };

  const handleDelete = async (target: Target) => {
    try {
      const response = await fetch(`/api/target/${target.id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Target deleted successfully!');
        fetchTargets();
      } else {
        toast.error('Failed to delete target');
      }
    } catch (error) {
      console.error('Error deleting target:', error);
      toast.error('Network error occurred');
    }
  };

  const handleBulkDelete = async (targetIds: string[]) => {
    try {
      const response = await fetch('/api/target/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetIds }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Successfully deleted ${targetIds.length} target(s)!`);
        fetchTargets();
      } else {
        toast.error(result.error || 'Failed to delete targets');
      }
    } catch (error) {
      console.error('Error deleting targets:', error);
      toast.error('Network error occurred');
    }
  };

  const handleView = (target: Target) => {
    // For now, just show target details in console
    // You can implement a view modal later if needed
    console.log('Viewing target:', target);
    toast.info(`Viewing target: Line ${target.lineNo} - Style ${target.styleNo}`);
  };

  const resetForm = () => {
    // Format selectedDate as YYYY-MM-DD in local timezone to avoid timezone issues
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const formattedSelectedDate = `${year}-${month}-${day}`;
    
    setFormData({
      productionListId: '',
      lineNo: '',
      styleNo: '',
      lineTarget: '',
      date: formattedSelectedDate,
      inTime: formData.inTime, // Keep the time logic
      outTime: formData.outTime,
      hourlyProduction: ''
    });
    setEditingItem(null);
  };

  // Handle production list selection
  const handleProductionListChange = (assignmentId: string) => {
    const assignment = lineAssignments.find(a => a.id === assignmentId);
    if (assignment) {
      setFormData(prev => ({
        ...prev,
        productionListId: assignmentId,
        lineNo: assignment.line.code,
        styleNo: assignment.style.styleNumber,
        lineTarget: assignment.targetPerHour.toString()
      }));
    }
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    resetForm();
  };

  return (
    <div className="container mx-auto px-2 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Production Targets</h1>
          <p className="text-muted-foreground">
            Set and manage production targets for lines and styles
          </p>
        </div>
        <div className="flex gap-2">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2" onClick={() => setIsCalendarOpen(true)}>
                <IconCalendar className="h-4 w-4" />
                {format(selectedDate, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setIsCalendarOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button>
                <IconPlus className="h-4 w-4 mr-2" />
                Add Target
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:w-[540px] overflow-y-auto px-4">
              <SheetHeader className="space-y-3">
                <SheetTitle className="text-lg font-semibold">
                  {editingItem ? 'Edit Target' : 'Add New Target'}
                </SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground">
                  {editingItem 
                    ? 'Update the production target information below' 
                    : 'Set a new production target for your line and style'
                  }
                </SheetDescription>
              </SheetHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-6 pb-6">
                <div className="space-y-2">
                  <Label htmlFor="productionList" className="text-sm font-medium">
                    Production Assignment
                  </Label>
                  <Select 
                    value={formData.productionListId} 
                    onValueChange={handleProductionListChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select line and style assignment" />
                    </SelectTrigger>
                    <SelectContent>
                      {lineAssignments.length === 0 ? (
                        <SelectItem value="no-assignments" disabled>
                          No active line assignments available
                        </SelectItem>
                      ) : (
                        lineAssignments.map((assignment) => (
                          <SelectItem key={assignment.id} value={assignment.id}>
                            {assignment.line.name} - {assignment.style.styleNumber} ({assignment.style.buyer})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {formData.productionListId && (
                    <p className="text-xs text-muted-foreground">
                      Target will be auto-filled based on assignment
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lineNo" className="text-sm font-medium">
                      Line Code
                    </Label>
                    <Input
                      id="lineNo"
                      value={formData.lineNo}
                      onChange={(e) => setFormData(prev => ({ ...prev, lineNo: e.target.value }))}
                      placeholder="e.g., LINE-A"
                      className="w-full"
                      readOnly={!!formData.productionListId}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="styleNo" className="text-sm font-medium">
                      Style Number
                    </Label>
                    <Input
                      id="styleNo"
                      value={formData.styleNo}
                      onChange={(e) => setFormData(prev => ({ ...prev, styleNo: e.target.value }))}
                      placeholder="e.g., STY-001"
                      className="w-full"
                      readOnly={!!formData.productionListId}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lineTarget" className="text-sm font-medium">
                    Line Target (per hour)
                  </Label>
                  <Input
                    id="lineTarget"
                    type="number"
                    min="1"
                    value={formData.lineTarget}
                    onChange={(e) => setFormData(prev => ({ ...prev, lineTarget: e.target.value }))}
                    placeholder="e.g., 1000"
                    className="w-full"
                    readOnly={!!formData.productionListId}
                    required
                  />
                  {formData.productionListId && (
                    <p className="text-xs text-muted-foreground">
                      Auto-filled from assignment target
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-medium">
                    Target Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.date && "text-muted-foreground"
                        )}
                      >
                        <IconCalendar className="mr-2 h-4 w-4" />
                        {formData.date ? format(new Date(formData.date), "PPP") : "Select target date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date ? new Date(formData.date) : new Date()}
                        onSelect={(date) => {
                          if (date) {
                            setFormData((prev) => ({
                              ...prev,
                              date: format(date, "yyyy-MM-dd"),
                            }));
                          }
                        }}
                        disabled={(date) =>
                          date < new Date(new Date().setDate(new Date().getDate() - 30))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inTime" className="text-sm font-medium">
                      In Time
                    </Label>
                    <Input
                      id="inTime"
                      type="time"
                      value={formData.inTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, inTime: e.target.value }))}
                      className="w-full"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="outTime" className="text-sm font-medium">
                      Out Time
                    </Label>
                    <Input
                      id="outTime"
                      type="time"
                      value={formData.outTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, outTime: e.target.value }))}
                      className="w-full"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourlyProduction" className="text-sm font-medium">
                    Hourly Production (optional)
                  </Label>
                  <Input
                    id="hourlyProduction"
                    type="number"
                    min="0"
                    value={formData.hourlyProduction}
                    onChange={(e) => setFormData(prev => ({ ...prev, hourlyProduction: e.target.value }))}
                    placeholder="e.g., 50"
                    className="w-full"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleSheetClose}
                    className="w-full sm:w-auto order-2 sm:order-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full sm:w-auto order-1 sm:order-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      editingItem ? 'Update Target' : 'Create Target'
                    )}
                  </Button>
                </div>
              </form>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Targets</CardTitle>
            <IconTarget className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{targets.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Line Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {targets.reduce((sum, target) => sum + target.lineTarget, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Production</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {targets.reduce((sum, target) => sum + target.hourlyProduction, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {targets.length > 0 
                ? (targets.reduce((sum, target) => sum + target.hourlyProduction, 0) / targets.reduce((sum, target) => sum + target.lineTarget, 0) * 100 || 0).toFixed(1) + '%'
                : '0.0%'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Targets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Production Targets - {format(selectedDate, 'PPP')}</CardTitle>
          <CardDescription>
            {targets.length} targets for selected date
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <TargetDataTable
              data={targets}
              selectedDate={selectedDate}
              onDateChange={(date) => setSelectedDate(date || new Date())}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
