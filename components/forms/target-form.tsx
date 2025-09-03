'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

import { 
  IconTarget, 
  IconDeviceFloppy,
  IconX,
  IconClock,
  IconCalculator,
  IconInfoCircle
} from '@tabler/icons-react';
import { toast } from 'sonner';

// Validation schema
const targetSchema = z.object({
  lineNo: z.string().min(1, 'Line number is required'),
  styleNo: z.string().min(1, 'Style number is required'),
  lineTarget: z.number().min(1, 'Line target must be at least 1'),
  date: z.string().min(1, 'Date is required'),
  inTime: z.string().min(1, 'In time is required'),
  outTime: z.string().min(1, 'Out time is required'),
  hourlyProduction: z.number().min(0, 'Hourly production must be 0 or greater').optional()
}).refine((data) => {
  const inTime = new Date(`2000-01-01T${data.inTime}:00`);
  const outTime = new Date(`2000-01-01T${data.outTime}:00`);
  return outTime > inTime;
}, {
  message: "Out time must be after in time",
  path: ["outTime"]
});

type TargetFormData = z.infer<typeof targetSchema>;

interface TargetFormProps {
  initialData?: Partial<TargetFormData> & { id?: string };
  onSubmit: (data: TargetFormData) => Promise<boolean>;
  onCancel: () => void;
  mode: 'create' | 'edit';
  isLoading?: boolean;
}

interface Line {
  id: string;
  code: string;
  name: string;
}

interface Style {
  id: string;
  styleNo: string;
  buyer: string;
  item: string;
}

export function TargetForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  mode, 
  isLoading = false 
}: TargetFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [linesLoading, setLinesLoading] = useState(false);
  const [stylesLoading, setStylesLoading] = useState(false);
  
  const form = useForm<TargetFormData>({
    resolver: zodResolver(targetSchema),
    defaultValues: {
      lineNo: initialData?.lineNo || '',
      styleNo: initialData?.styleNo || '',
      lineTarget: initialData?.lineTarget || 0,
      date: initialData?.date || new Date().toISOString().split('T')[0],
      inTime: initialData?.inTime || '08:00',
      outTime: initialData?.outTime || '17:00',
      hourlyProduction: initialData?.hourlyProduction || 0
    }
  });

  // Watch form values for calculations
  const watchInTime = form.watch('inTime');
  const watchOutTime = form.watch('outTime');
  const watchLineTarget = form.watch('lineTarget');
  const watchHourlyProduction = form.watch('hourlyProduction');

  // Calculate work hours
  const calculateWorkHours = (inTime: string, outTime: string) => {
    try {
      const inDate = new Date(`2000-01-01T${inTime}:00`);
      const outDate = new Date(`2000-01-01T${outTime}:00`);
      const diffMs = outDate.getTime() - inDate.getTime();
      return Math.max(0, diffMs / (1000 * 60 * 60));
    } catch {
      return 0;
    }
  };

  // Calculate suggested hourly production
  const calculateSuggestedHourlyProduction = () => {
    const workHours = calculateWorkHours(watchInTime, watchOutTime);
    if (workHours > 0 && watchLineTarget > 0) {
      return Math.ceil(watchLineTarget / workHours);
    }
    return 0;
  };

  const workHours = calculateWorkHours(watchInTime, watchOutTime);
  const suggestedHourlyProduction = calculateSuggestedHourlyProduction();
  const estimatedDailyOutput = workHours * (watchHourlyProduction || 0);

  // Fetch lines
  const fetchLines = async () => {
    setLinesLoading(true);
    try {
      const linesResponse = await fetch('/api/lines');
      const linesData = await linesResponse.json();
      if (linesData.success) {
        setLines(linesData.data);
      }
    } catch (error) {
      console.error('Error fetching lines:', error);
    } finally {
      setLinesLoading(false);
    }
  };

  // Fetch styles
  const fetchStyles = async () => {
    setStylesLoading(true);
    try {
      const stylesResponse = await fetch('/api/production');
      const stylesData = await stylesResponse.json();
      if (stylesData.success) {
        setStyles(stylesData.data.map((item: any) => ({
          id: item.id,
          styleNo: item.styleNumber || item.styleNo,
          buyer: item.buyer,
          item: item.item || 'N/A'
        })));
      }
    } catch (error) {
      console.error('Error fetching styles:', error);
    } finally {
      setStylesLoading(false);
    }
  };

  useEffect(() => {
    fetchLines();
    fetchStyles();
  }, []);

  // Handle form submission
  const handleSubmit = async (data: TargetFormData) => {
    setSubmitting(true);
    try {
      const success = await onSubmit(data);
      if (success) {
        form.reset();
        toast.success(mode === 'create' ? 'Target created successfully' : 'Target updated successfully');
      }
    } catch (error) {
      toast.error('Failed to save target');
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-suggest hourly production
  const applySuggestedHourlyProduction = () => {
    form.setValue('hourlyProduction', suggestedHourlyProduction);
  };

  // Get efficiency status
  const getEfficiencyStatus = () => {
    if (estimatedDailyOutput === 0) return null;
    const efficiency = (estimatedDailyOutput / watchLineTarget) * 100;
    
    if (efficiency >= 100) {
      return { status: 'success', message: 'Target achievable', color: 'text-green-600' };
    } else if (efficiency >= 80) {
      return { status: 'warning', message: 'Target challenging', color: 'text-yellow-600' };
    } else {
      return { status: 'error', message: 'Target may be difficult', color: 'text-red-600' };
    }
  };

  const efficiencyStatus = getEfficiencyStatus();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {mode === 'create' ? (
            <>
              <IconTarget className="h-5 w-5" />
              Set New Target
            </>
          ) : (
            <>
              <IconDeviceFloppy className="h-5 w-5" />
              Edit Target
            </>
          )}
        </CardTitle>
        <CardDescription>
          {mode === 'create' 
            ? 'Set production targets for a specific line and style'
            : 'Update the target information'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Target Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lineNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Line Number *</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                        disabled={isLoading || submitting || linesLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select line" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {lines.map((line) => (
                            <SelectItem key={line.id} value={line.code}>
                              <div className="flex flex-col">
                                <span className="font-medium">{line.code}</span>
                                <span className="text-sm text-muted-foreground">{line.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="styleNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Style Number *</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                        disabled={isLoading || submitting || stylesLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {styles.map((style) => (
                            <SelectItem key={style.id} value={style.styleNo}>
                              <div className="flex flex-col">
                                <span className="font-medium">{style.styleNo}</span>
                                <span className="text-sm text-muted-foreground">
                                  {style.buyer} - {style.item}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lineTarget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Line Target *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="e.g., 1000"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          disabled={isLoading || submitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Date *</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                              disabled={isLoading || submitting}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(new Date(field.value + 'T00:00:00'), 'PPP') : 'Pick a date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value + 'T00:00:00') : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  field.onChange(date.toLocaleDateString('en-CA'));
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Time and Production Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <IconClock className="h-5 w-5" />
                Working Hours & Production
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="inTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>In Time *</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          disabled={isLoading || submitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="outTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Out Time *</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          disabled={isLoading || submitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hourlyProduction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hourly Production</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="e.g., 50"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            disabled={isLoading || submitting}
                          />
                        </FormControl>
                        {suggestedHourlyProduction > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={applySuggestedHourlyProduction}
                            disabled={isLoading || submitting}
                          >
                            <IconCalculator className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Calculations Summary */}
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <IconInfoCircle className="h-4 w-4" />
                    Production Calculations
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Work Hours</p>
                      <p className="text-lg font-semibold">{workHours.toFixed(1)} hours</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Suggested Hourly Rate</p>
                      <p className="text-lg font-semibold">
                        {suggestedHourlyProduction} units/hour
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Estimated Daily Output</p>
                      <p className="text-lg font-semibold">
                        {estimatedDailyOutput.toFixed(0)} units
                      </p>
                    </div>
                  </div>
                  
                  {efficiencyStatus && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={efficiencyStatus.status === 'success' ? 'default' : 
                                   efficiencyStatus.status === 'warning' ? 'secondary' : 'destructive'}
                        >
                          {efficiencyStatus.message}
                        </Badge>
                        <span className={`text-sm ${efficiencyStatus.color}`}>
                          {watchLineTarget > 0 && estimatedDailyOutput > 0 && 
                            `${((estimatedDailyOutput / watchLineTarget) * 100).toFixed(1)}% of target`
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading || submitting}
              >
                <IconX className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || submitting}
              >
                <IconDeviceFloppy className="h-4 w-4 mr-2" />
                {submitting ? 'Saving...' : mode === 'create' ? 'Create Target' : 'Update Target'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
