'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { IconPlus, IconEdit, IconX, IconCalendar, IconClock, IconTarget, IconUsers } from '@tabler/icons-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Target, TargetFormData, ProductionListItem, Line } from './schema';
import type { LineAssignment } from '@/components/line-assignments/schema';

interface EnhancedTargetFormProps {
  item?: Target | null;
  onSubmit: (data: TargetFormData) => Promise<boolean>;
  onCancel: () => void;
  mode: 'create' | 'edit';
  productionItems: ProductionListItem[];
  lines: Line[];
}

interface LineAssignmentInfo {
  assignment: LineAssignment;
  productionItem: ProductionListItem;
}

export function EnhancedTargetForm({ 
  item, 
  onSubmit, 
  onCancel, 
  mode, 
  productionItems, 
  lines 
}: EnhancedTargetFormProps) {
  const [formData, setFormData] = useState<TargetFormData>({
    lineNo: '',
    styleNo: '',
    lineTarget: 0,
    date: new Date().toLocaleDateString('en-CA'),
    inTime: '08:00',
    outTime: '17:00',
    hourlyProduction: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [lineAssignments, setLineAssignments] = useState<LineAssignment[]>([]);
  const [selectedLineAssignment, setSelectedLineAssignment] = useState<LineAssignmentInfo | null>(null);

  // Fetch line assignments when component mounts
  useEffect(() => {
    fetchLineAssignments();
  }, []);

  const fetchLineAssignments = async () => {
    try {
      const response = await fetch('/api/line-assignments?activeOnly=true');
      const result = await response.json();
      if (result.success) {
        setLineAssignments(result.data.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching line assignments:', error);
    }
  };

  // Function to calculate adjusted time range (full hour range)
  const calculateAdjustedTime = (timeString: string): { inTime: string; outTime: string } => {
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Calculate inTime (1 hour before, rounded to full hour)
    let inHour = hours - 1;
    if (inHour < 0) inHour = 23; // Handle midnight wrap-around
    
    // outTime is the next hour (creating a full hour range)
    let outHour = hours + 1;
    if (outHour > 23) outHour = 0; // Handle end of day wrap-around
    
    return {
      inTime: `${inHour.toString().padStart(2, '0')}:00`,
      outTime: `${outHour.toString().padStart(2, '0')}:00`
    };
  };

  // Function to set current time-based inTime and outTime with 1-hour adjustment
  const setCurrentTimeBased = () => {
    const now = new Date();
    const currentTimeString = `${now.getHours()}:${now.getMinutes()}`;
    const { inTime, outTime } = calculateAdjustedTime(currentTimeString);
    
    setFormData(prev => ({
      ...prev,
      inTime,
      outTime
    }));
  };

  useEffect(() => {
    if (item && mode === 'edit') {
      setFormData({
        lineNo: item.lineNo,
        styleNo: item.styleNo,
        lineTarget: item.lineTarget,
        date: new Date(item.date).toLocaleDateString('en-CA'),
        inTime: item.inTime,
        outTime: item.outTime,
        hourlyProduction: item.hourlyProduction
      });
    } else if (mode === 'create') {
      setCurrentTimeBased();
    }
  }, [item, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const success = await onSubmit(formData);
      if (success) {
        onCancel();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof TargetFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'lineTarget' || field === 'hourlyProduction' ? Number(value) : value
    }));
  };

  const handleLineSelect = (lineId: string) => {
    const selectedLine = lines.find(line => line.id === lineId);
    if (!selectedLine) return;

    // Find active assignment for this line
    const assignment = lineAssignments.find(a => a.lineId === lineId);
    
    // Only proceed if assignment exists (since we only show assigned lines)
    if (assignment) {
      // Find corresponding production item
      const productionItem = productionItems.find(p => p.styleNo === assignment.style.styleNumber);
      
      if (productionItem) {
        setSelectedLineAssignment({ assignment, productionItem });
        
        // Auto-populate form with assignment data
        setFormData(prev => ({
          ...prev,
          lineNo: selectedLine.code,
          styleNo: assignment.style.styleNumber,
          lineTarget: assignment.targetPerHour || 0,
          hourlyProduction: assignment.targetPerHour || 0
        }));
      }
    }
  };

  const handleStyleChange = (styleNo: string) => {
    setFormData(prev => ({
      ...prev,
      styleNo
    }));
  };

  // Helper to get available production items for selected line
  const getAvailableProductionItems = () => {
    if (selectedLineAssignment) {
      return [selectedLineAssignment.productionItem];
    }
    return productionItems;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {mode === 'create' ? (
            <>
              <IconPlus className="h-5 w-5" />
              Add New Target
            </>
          ) : (
            <>
              <IconEdit className="h-5 w-5" />
              Edit Target
            </>
          )}
        </CardTitle>
        <CardDescription>
          {mode === 'create' 
            ? 'Create a new production target. Only lines with active assignments are available. Time range: if current time is 1:40, shows 12:00 to 13:00.'
            : 'Update the production target information'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Line Selection with Assignment Integration - Only Assigned Lines */}
          <div className="space-y-2">
            <Label htmlFor="line">Production Line * (Only Assigned Lines)</Label>
            <Select value={lines.find(l => l.code === formData.lineNo)?.id || ''} onValueChange={handleLineSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select line with active assignment" />
              </SelectTrigger>
              <SelectContent>
                {lines?.filter(line => lineAssignments.some(a => a.lineId === line.id)).map(line => {
                  const assignment = lineAssignments.find(a => a.lineId === line.id);
                  return (
                    <SelectItem key={line.id} value={line.id}>
                      <div className="flex items-center gap-2">
                        <span>{line.name} - {line.code}</span>
                        <Badge variant="secondary" className="text-xs">
                          <IconUsers className="h-3 w-3 mr-1" />
                          {assignment?.style.styleNumber}
                        </Badge>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {lines?.filter(line => lineAssignments.some(a => a.lineId === line.id)).length === 0 && (
              <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded border border-orange-200">
                <div className="font-medium">⚠️ No lines with active assignments</div>
                <div className="text-xs mt-1">
                  Please create line assignments first in Production Management → Line Assignments
                </div>
              </div>
            )}
          </div>

          {/* Assignment Information Display */}
          {selectedLineAssignment && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <IconTarget className="h-4 w-4" />
                  Active Line Assignment
                </CardTitle>
                <CardDescription className="text-xs">
                  This line has an active assignment with the following details
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Style:</span> {selectedLineAssignment.assignment.style.styleNumber}
                  </div>
                  <div>
                    <span className="font-medium">Buyer:</span> {selectedLineAssignment.assignment.style.buyer}
                  </div>
                  <div>
                    <span className="font-medium">Target/Hour:</span> {selectedLineAssignment.assignment.targetPerHour}
                  </div>
                  <div>
                    <span className="font-medium">Order Qty:</span> {selectedLineAssignment.assignment.style.orderQty.toLocaleString()}
                  </div>
                </div>
                <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                  ✨ Form auto-populated with assignment data
                </div>
              </CardContent>
            </Card>
          )}

          {/* Style Selection */}
          <div className="space-y-2">
            <Label htmlFor="styleNo">Style No *</Label>
            <Select value={formData.styleNo} onValueChange={handleStyleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableProductionItems().length > 0 ? (
                  getAvailableProductionItems().map(item => (
                    <SelectItem key={item.id} value={item.styleNo}>
                      {item.styleNo} - {item.item} ({item.buyer})
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No production items available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lineTarget">Line Target *</Label>
            <Input
              id="lineTarget"
              type="number"
              min="1"
              value={formData.lineTarget}
              onChange={(e) => handleInputChange('lineTarget', e.target.value)}
              placeholder="e.g., 100"
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Date *</Label>
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
                  {formData.date ? format(new Date(formData.date + 'T00:00:00'), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={new Date(formData.date + 'T00:00:00')}
                  onSelect={(date) => date && handleInputChange('date', date.toLocaleDateString('en-CA'))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time with Full Hour Range Logic */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Time Range * (Full Hour Range)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={setCurrentTimeBased}
                title="Set to current time range"
              >
                <IconClock className="h-4 w-4 mr-1" />
                Set Current Time
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inTime">In Time *</Label>
                <Input
                  id="inTime"
                  type="time"
                  value={formData.inTime}
                  onChange={(e) => handleInputChange('inTime', e.target.value)}
                  required
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  Start of hour range (if time is 1:40, shows 12:00)
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="outTime">Out Time *</Label>
                <Input
                  id="outTime"
                  type="time"
                  value={formData.outTime}
                  onChange={(e) => handleInputChange('outTime', e.target.value)}
                  required
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  End of hour range (if time is 1:40, shows 13:00)
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hourlyProduction">Hourly Production</Label>
            <Input
              id="hourlyProduction"
              type="number"
              min="0"
              value={formData.hourlyProduction}
              onChange={(e) => handleInputChange('hourlyProduction', e.target.value)}
              placeholder="0"
              className="w-full"
            />
            <div className="text-xs text-muted-foreground">
              Auto-populated from line assignment target if available
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              <IconX className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {mode === 'create' ? (
                <>
                  <IconPlus className="h-4 w-4 mr-2" />
                  {loading ? 'Creating...' : 'Create Target'}
                </>
              ) : (
                <>
                  <IconEdit className="h-4 w-4 mr-2" />
                  {loading ? 'Updating...' : 'Update Target'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
