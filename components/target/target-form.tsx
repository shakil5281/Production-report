'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { IconPlus, IconEdit, IconX, IconCalendar } from '@tabler/icons-react';
import { toast } from 'sonner';
import { useCalendarAutoClose } from '@/hooks/use-calendar-auto-close';
import type { Target, TargetFormData, ProductionListItem, Line } from './schema';

interface TargetFormProps {
  item?: Target | null;
  onSubmit: (data: TargetFormData) => Promise<boolean>;
  onCancel: () => void;
  mode: 'create' | 'edit';
  productionItems: ProductionListItem[];
  lines: Line[];
}

export default function TargetForm({ mode, item, onSubmit, onCancel, productionItems, lines }: TargetFormProps) {
  const { isCalendarOpen, setIsCalendarOpen } = useCalendarAutoClose();
  
  const [formData, setFormData] = useState<TargetFormData>({
    date: '',
    inTime: '',
    outTime: '',
    hourlyProduction: 0,
    lineNo: '',
    styleNo: '',
    lineTarget: 0
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
    <div className="h-screen flex flex-col w-full max-w-4xl mx-auto bg-background">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3 sm:p-4 lg:p-6">
        <div className="flex items-center gap-2 mb-1 sm:mb-2">
          {mode === 'create' ? (
            <>
              <IconPlus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h2 className="text-base sm:text-lg lg:text-xl font-bold">Add New Target</h2>
            </>
          ) : (
            <>
              <IconEdit className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h2 className="text-base sm:text-lg lg:text-xl font-bold">Edit Target</h2>
            </>
          )}
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {mode === 'create' 
            ? 'Create a new production target with all required details'
            : 'Update the production target information'
          }
        </p>
      </div>

      {/* Form Content - Scrollable with proper height calculation */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 sm:p-4 lg:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 pb-20 sm:pb-4">
          {/* Basic Information Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Basic Information</CardTitle>
              <CardDescription className="text-sm">
                Select the production line and style for the target
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="line" className="text-sm font-medium">Production Line *</Label>
                  <Select value={lines.find(l => l.code === formData.lineNo)?.id || ''} onValueChange={handleLineChange}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select line" />
                    </SelectTrigger>
                    <SelectContent>
                      {lines?.map(line => (
                        <SelectItem key={line.id} value={line.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{line.name}</span>
                            <span className="text-muted-foreground">- {line.code}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="styleNo" className="text-sm font-medium">Style No *</Label>
                  <Select value={formData.styleNo} onValueChange={handleStyleChange}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select running style" />
                    </SelectTrigger>
                    <SelectContent>
                      {productionItems.length > 0 ? (
                        productionItems.map((item: ProductionListItem) => (
                          <SelectItem key={item.id} value={item.styleNo}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.styleNo}</span>
                              <span className="text-muted-foreground">- {item.item} ({item.buyer})</span>
                            </div>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Only production items with "RUNNING" status are shown here
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Target Configuration Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Target Configuration</CardTitle>
              <CardDescription className="text-sm">
                Set production targets and quantities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lineTarget" className="text-sm font-medium">Line Target *</Label>
                <Input
                  id="lineTarget"
                  type="number"
                  min="1"
                  value={formData.lineTarget}
                  onChange={(e) => handleInputChange('lineTarget', e.target.value)}
                  placeholder="e.g., 100"
                  required
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  Total production target for this line
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourlyProduction" className="text-sm font-medium">Hourly Production</Label>
                <Input
                  id="hourlyProduction"
                  type="number"
                  min="0"
                  value={formData.hourlyProduction}
                  onChange={(e) => handleInputChange('hourlyProduction', e.target.value)}
                  placeholder="0"
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  Expected production units per hour (optional)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Information Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Schedule Information</CardTitle>
              <CardDescription className="text-sm">
                Set the date and working hours for the target
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Target Date *</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !formData.date && "text-muted-foreground"
                      )}
                      onClick={() => setIsCalendarOpen(true)}
                    >
                      <IconCalendar className="mr-2 h-4 w-4" />
                      {formData.date ? format(new Date(formData.date + 'T00:00:00'), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date ? new Date(formData.date + 'T00:00:00') : undefined}
                      onSelect={(date) => {
                        if (date) {
                          handleInputChange('date', date.toLocaleDateString('en-CA'));
                          setIsCalendarOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inTime" className="text-sm font-medium">Start Time *</Label>
                  <Input
                    id="inTime"
                    type="time"
                    value={formData.inTime}
                    onChange={(e) => handleInputChange('inTime', e.target.value)}
                    required
                    className="h-10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="outTime" className="text-sm font-medium">End Time *</Label>
                  <Input
                    id="outTime"
                    type="time"
                    value={formData.outTime}
                    onChange={(e) => handleInputChange('outTime', e.target.value)}
                    required
                    className="h-10"
                  />
                </div>
              </div>

              {/* Working Hours Display */}
              {formData.inTime && formData.outTime && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Working Hours: {formData.inTime} - {formData.outTime}
                      {(() => {
                        const startHour = parseInt(formData.inTime.split(':')[0]);
                        const endHour = parseInt(formData.outTime.split(':')[0]);
                        const hours = endHour > startHour ? endHour - startHour : (24 - startHour) + endHour;
                        return ` (${hours} hours)`;
                      })()}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

            {/* Mobile Action Buttons - Inside scrollable area */}
            <div className="block sm:hidden pt-4 sm:pt-6">
              <div className="flex flex-col gap-2 sm:gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 sm:h-12 text-sm sm:text-base"
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                  className="w-full h-11 sm:h-12 text-sm sm:text-base"
                >
                  <IconX className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Desktop Footer Actions - Fixed with proper height */}
      <div className="hidden sm:flex flex-shrink-0 border-t bg-muted/30 backdrop-blur supports-[backdrop-filter]:bg-muted/20 h-16 lg:h-20 items-center px-4 lg:px-6">
        <div className="flex justify-end gap-3 ml-auto">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="px-4 lg:px-6 h-9 lg:h-10 text-sm"
          >
            <IconX className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="px-4 lg:px-6 h-9 lg:h-10 text-sm"
            onClick={handleSubmit}
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
      </div>
    </div>
  );
}
