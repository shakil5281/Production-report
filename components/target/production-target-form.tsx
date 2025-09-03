'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { IconClock, IconTarget, IconUsers, IconX, IconPlus, IconCalendar } from '@tabler/icons-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface LineAssignment {
  id: string;
  lineId: string;
  styleId: string;
  startDate: string;
  endDate?: string | null;
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
    unitPrice: number | string;
    status: string;
  };
}

interface ProductionTargetFormData {
  lineId: string;
  styleNo: string;
  targetPerHour: number;
  inTime: string;
  outTime: string;
  date: string;
}

interface ProductionTargetFormProps {
  onSubmit: (data: ProductionTargetFormData) => Promise<boolean>;
  onCancel: () => void;
  loading?: boolean;
}

export function ProductionTargetForm({ onSubmit, onCancel, loading }: ProductionTargetFormProps) {
  const [activeAssignments, setActiveAssignments] = useState<LineAssignment[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<string>('');
  const [selectedAssignment, setSelectedAssignment] = useState<LineAssignment | null>(null);
  const [formData, setFormData] = useState<ProductionTargetFormData>({
    lineId: '',
    styleNo: '',
    targetPerHour: 0,
    inTime: '',
    outTime: '',
    date: new Date().toISOString().split('T')[0] // Today's date
  });
  const [submitting, setSubmitting] = useState(false);
  const [fetchingAssignments, setFetchingAssignments] = useState(false);

  // Fetch active line assignments on component mount
  useEffect(() => {
    fetchActiveAssignments();
  }, []);

  // Generate time slots based on current time
  useEffect(() => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Generate inTime as current hour (or next if minutes > 30)
    const inHour = now.getMinutes() > 30 ? currentHour + 1 : currentHour;
    const outHour = inHour + 1;
    
    const inTime = `${inHour.toString().padStart(2, '0')}:00`;
    const outTime = `${outHour.toString().padStart(2, '0')}:00`;
    
    setFormData(prev => ({
      ...prev,
      inTime,
      outTime
    }));
  }, []);

  const fetchActiveAssignments = async () => {
    setFetchingAssignments(true);
    try {
      const response = await fetch('/api/line-assignments?activeOnly=true');
      const result = await response.json();
      
      if (result.success) {
        setActiveAssignments(result.data.assignments || []);
      } else {
        toast.error('Failed to fetch active line assignments');
      }
    } catch (error) {
      console.error('Error fetching active assignments:', error);
      toast.error('Network error occurred while fetching assignments');
    } finally {
      setFetchingAssignments(false);
    }
  };

  const handleLineSelect = (lineId: string) => {
    setSelectedLineId(lineId);
    const assignment = activeAssignments.find(a => a.lineId === lineId);
    setSelectedAssignment(assignment || null);
    
    if (assignment) {
      setFormData(prev => ({
        ...prev,
        lineId: lineId,
        styleNo: assignment.style.styleNumber,
        targetPerHour: assignment.targetPerHour || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        lineId: '',
        styleNo: '',
        targetPerHour: 0
      }));
    }
  };

  const handleInputChange = (field: keyof ProductionTargetFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.lineId || !formData.styleNo || !formData.inTime || !formData.outTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.targetPerHour <= 0) {
      toast.error('Target per hour must be greater than 0');
      return;
    }

    // Validate time slots
    const inTime = new Date(`2000-01-01T${formData.inTime}`);
    const outTime = new Date(`2000-01-01T${formData.outTime}`);
    
    if (outTime <= inTime) {
      toast.error('Out time must be after in time');
      return;
    }

    setSubmitting(true);
    
    try {
      const success = await onSubmit(formData);
      if (success) {
        // Reset form
        setFormData({
          lineId: '',
          styleNo: '',
          targetPerHour: 0,
          inTime: '',
          outTime: '',
          date: new Date().toISOString().split('T')[0]
        });
        setSelectedLineId('');
        setSelectedAssignment(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = formData.lineId && formData.styleNo && formData.inTime && formData.outTime && formData.targetPerHour > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 p-1">
      {/* Date Selection */}
      <div className="space-y-3">
        <Label htmlFor="date" className="text-base font-semibold text-gray-700">Target Date *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal h-12 border-2 hover:border-blue-300 transition-all duration-200"
            >
              <IconCalendar className="mr-2 h-4 w-4" />
              {formData.date ? format(new Date(formData.date + 'T00:00:00'), 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.date ? new Date(formData.date + 'T00:00:00') : undefined}
              onSelect={(date) => {
                if (date) {
                  handleInputChange('date', date.toLocaleDateString('en-CA'));
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Lines Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="line" className="text-base font-semibold text-gray-700">Production Line *</Label>
          {fetchingAssignments && (
            <div className="flex items-center gap-1 text-blue-600 text-sm">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              Loading...
            </div>
          )}
        </div>
        
        <Select value={selectedLineId} onValueChange={handleLineSelect}>
          <SelectTrigger className="border-2 hover:border-blue-300 transition-all duration-200 h-12">
            <SelectValue placeholder="Select an active production line" />
          </SelectTrigger>
          <SelectContent>
            {activeAssignments.length === 0 ? (
              <SelectItem value="no-assignments" disabled>
                No active line assignments found
              </SelectItem>
            ) : (
              activeAssignments.map(assignment => (
                <SelectItem key={assignment.id} value={assignment.lineId} className="py-3">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-800">{assignment.line.name}</span>
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {assignment.line.code}
                    </Badge>
                    <Badge className="bg-green-100 text-green-800 text-xs flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      ACTIVE
                    </Badge>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {activeAssignments.length === 0 && !fetchingAssignments && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <IconUsers className="h-4 w-4" />
              <span className="font-medium">No Active Assignments</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Please create line assignments first before setting production targets.
            </p>
          </div>
        )}
      </div>

      {/* Selected Assignment Details */}
      {selectedAssignment && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-l-green-500">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2 text-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Active Assignment Details
            </CardTitle>
            <CardDescription className="text-sm text-green-700">
              Currently assigned production style for {selectedAssignment.line.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                <span className="font-semibold text-gray-700">Style No:</span> 
                <span className="text-green-800 font-medium">{selectedAssignment.style.styleNumber}</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                <span className="font-semibold text-gray-700">Buyer:</span> 
                <span className="text-green-800">{selectedAssignment.style.buyer}</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                <span className="font-semibold text-gray-700">Order Qty:</span> 
                <span className="text-green-800 font-mono">{selectedAssignment.style.orderQty.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                <span className="font-semibold text-gray-700">Assigned Target:</span> 
                <span className="text-green-800 font-medium">{selectedAssignment.targetPerHour}/hour</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="inTime" className="text-base font-semibold text-gray-700">In Time *</Label>
          <div className="relative">
            <Input
              id="inTime"
              type="time"
              value={formData.inTime}
              onChange={(e) => handleInputChange('inTime', e.target.value)}
              className="border-2 hover:border-blue-300 transition-all duration-200 h-12 pl-4 pr-12"
              required
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-blue-100 rounded-lg">
              <IconClock className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="outTime" className="text-base font-semibold text-gray-700">Out Time *</Label>
          <div className="relative">
            <Input
              id="outTime"
              type="time"
              value={formData.outTime}
              onChange={(e) => handleInputChange('outTime', e.target.value)}
              className="border-2 hover:border-blue-300 transition-all duration-200 h-12 pl-4 pr-12"
              required
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-blue-100 rounded-lg">
              <IconClock className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Target Per Hour */}
      <div className="space-y-3">
        <Label htmlFor="targetPerHour" className="text-base font-semibold text-gray-700">Target Per Hour *</Label>
        <div className="relative">
          <Input
            id="targetPerHour"
            type="number"
            min="1"
            value={formData.targetPerHour || ''}
            onChange={(e) => handleInputChange('targetPerHour', parseInt(e.target.value) || 0)}
            placeholder="Enter target production per hour"
            className="border-2 hover:border-purple-300 transition-all duration-200 h-12 pl-4 pr-12"
            required
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-purple-100 rounded-lg">
            <IconTarget className="h-4 w-4 text-purple-600" />
          </div>
        </div>
        <div className="text-sm text-gray-600 bg-purple-50 border border-purple-200 rounded-lg p-3">
          <span className="font-medium">💡 Tip:</span> Production target for the selected time slot (
          {formData.inTime && formData.outTime ? `${formData.inTime} - ${formData.outTime}` : 'time range'}
          )
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting || loading}
          className="border-2 border-gray-300 hover:border-red-300 hover:bg-red-50 transition-all duration-200 px-6"
        >
          <IconX className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        
        <Button
          type="submit"
          disabled={!isFormValid || submitting || loading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg px-8 transition-all duration-200"
        >
          <IconPlus className="h-4 w-4 mr-2" />
          {submitting ? 'Creating Target...' : 'Create Target'}
        </Button>
      </div>
    </form>
  );
}
