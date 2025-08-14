'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { IconPlus, IconEdit, IconX, IconCalendar } from '@tabler/icons-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Target, TargetFormData, ProductionListItem, Line } from './schema';

interface TargetFormProps {
  item?: Target | null;
  onSubmit: (data: TargetFormData) => Promise<boolean>;
  onCancel: () => void;
  mode: 'create' | 'edit';
  productionItems: ProductionListItem[];
  lines: Line[];
}

export function TargetForm({ item, onSubmit, onCancel, mode, productionItems, lines }: TargetFormProps) {
  const [formData, setFormData] = useState<TargetFormData>({
    lineNo: '',
    styleNo: '',
    lineTarget: 0,
    date: new Date().toLocaleDateString('en-CA'), // Use local date format
    inTime: '08:00',
    outTime: '17:00',
    hourlyProduction: 0
  });
  const [loading, setLoading] = useState(false);

  // Function to set current time-based inTime and outTime
  const setCurrentTimeBased = () => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Set inTime to current hour (e.g., if current time is 12:20 AM, set to 12:00 AM)
    const inTime = `${currentHour.toString().padStart(2, '0')}:00`;
    
    // Set outTime to next hour (e.g., if current time is 12:20 AM, set to 1:00 PM)
    const nextHour = (currentHour + 1) % 24;
    const outTime = `${nextHour.toString().padStart(2, '0')}:00`;
    
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
        date: new Date(item.date).toLocaleDateString('en-CA'), // Use local date format
        inTime: item.inTime,
        outTime: item.outTime,
        hourlyProduction: item.hourlyProduction
      });
    } else if (mode === 'create') {
      // Set current time-based values for new targets
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

  const handleLineChange = (lineId: string) => {
    const selectedLine = lines.find(line => line.id === lineId);
    setFormData(prev => ({
      ...prev,
      lineNo: selectedLine ? selectedLine.code : ''
    }));
  };

  const handleStyleChange = (styleNo: string) => {
    setFormData(prev => ({
      ...prev,
      styleNo
    }));
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
            ? 'Create a new production target with all required details'
            : 'Update the production target information'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="line">Line *</Label>
              <Select value={lines.find(l => l.code === formData.lineNo)?.id || ''} onValueChange={handleLineChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select line" />
                </SelectTrigger>
                <SelectContent>
                  {lines?.map(line => (
                    <SelectItem key={line.id} value={line.id}>
                      {line.name} - {line.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="styleNo">Style No *</Label>
              <Select value={formData.styleNo} onValueChange={handleStyleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select running style" />
                </SelectTrigger>
                <SelectContent>
                  {productionItems.length > 0 ? (
                    productionItems.map(item => (
                      <SelectItem key={item.id} value={item.styleNo}>
                        {item.styleNo} - {item.item} ({item.buyer})
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No running styles available
                    </div>
                  )}
                </SelectContent>
              </Select>
              {productionItems.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Only production items with "RUNNING" status are shown here
                </p>
              )}
            </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inTime">In Time *</Label>
              <div className="flex gap-2">
                <Input
                  id="inTime"
                  type="time"
                  value={formData.inTime}
                  onChange={(e) => handleInputChange('inTime', e.target.value)}
                  required
                  className="w-full"
                />
                {/* <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={setCurrentTimeBased}
                  title="Set to current time"
                >
                  Now
                </Button> */}
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
