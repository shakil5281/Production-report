'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  IconPlus, 
  IconMinus, 
  IconDeviceFloppy,
  IconX,
  IconAlertCircle
} from '@tabler/icons-react';
import { toast } from 'sonner';

// Validation schema
const quantitySchema = z.object({
  variant: z.string().min(1, 'Variant is required'),
  color: z.string().min(1, 'Color is required'),
  qty: z.number().min(1, 'Quantity must be at least 1')
});

const productionSchema = z.object({
  programCode: z.string().min(1, 'Program code is required'),
  styleNo: z.string().min(1, 'Style number is required'),
  buyer: z.string().min(1, 'Buyer is required'),
  item: z.string().min(1, 'Item is required'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  percentage: z.number().min(0).max(100).optional(),
  status: z.enum(['PENDING', 'RUNNING', 'COMPLETE', 'CANCELLED']).optional(),
  quantities: z.array(quantitySchema).min(1, 'At least one quantity entry is required')
});

type ProductionFormData = z.infer<typeof productionSchema>;

interface ProductionFormProps {
  initialData?: Partial<ProductionFormData> & { id?: string };
  onSubmit: (data: ProductionFormData) => Promise<boolean>;
  onCancel: () => void;
  mode: 'create' | 'edit';
  isLoading?: boolean;
}

export function ProductionForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  mode, 
  isLoading = false 
}: ProductionFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const form = useForm<ProductionFormData>({
    resolver: zodResolver(productionSchema),
    defaultValues: {
      programCode: initialData?.programCode || '',
      styleNo: initialData?.styleNo || '',
      buyer: initialData?.buyer || '',
      item: initialData?.item || '',
      price: initialData?.price || 0,
      percentage: initialData?.percentage || 0,
      status: initialData?.status || 'PENDING',
      quantities: initialData?.quantities || [{ variant: '', color: '', qty: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'quantities'
  });

  // Calculate total quantity
  const watchQuantities = form.watch('quantities');
  const totalQty = watchQuantities.reduce((sum, item) => sum + (item.qty || 0), 0);

  // Handle form submission
  const handleSubmit = async (data: ProductionFormData) => {
    setSubmitting(true);
    setFormError(null);
    
    try {
      const success = await onSubmit(data);
      if (success) {
        form.reset();
        toast.success(mode === 'create' ? 'Production item created successfully' : 'Production item updated successfully');
      } else {
        setFormError('Failed to save production item. Please try again.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save production item';
      setFormError(errorMessage);
      toast.error(errorMessage);
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const addQuantityField = () => {
    append({ variant: '', color: '', qty: 0 });
  };

  const removeQuantityField = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconDeviceFloppy className="h-5 w-5" />
            {mode === 'create' ? 'Create New Production Item' : 'Edit Production Item'}
          </CardTitle>
          <CardDescription>
            {mode === 'create' 
              ? 'Add a new production item to the system' 
              : 'Update the production item details'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {formError && (
                <Alert variant="destructive">
                  <IconAlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="programCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program Code *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter program code" {...field} />
                      </FormControl>
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
                      <FormControl>
                        <Input placeholder="Enter style number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="buyer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Buyer *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter buyer name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="item"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter item description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0.01" 
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Percentage</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          max="100" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="RUNNING">Running</SelectItem>
                          <SelectItem value="COMPLETE">Complete</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Quantities Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Quantities</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addQuantityField}
                    disabled={submitting}
                  >
                    <IconPlus className="h-4 w-4 mr-2" />
                    Add Quantity
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                    <FormField
                      control={form.control}
                      name={`quantities.${index}.variant`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Variant *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., S, M, L, XL" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`quantities.${index}.color`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Red, Blue, Black" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-end gap-2">
                      <FormField
                        control={form.control}
                        name={`quantities.${index}.qty`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Quantity *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                placeholder="0" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeQuantityField(index)}
                          disabled={submitting}
                          className="mb-2"
                        >
                          <IconX className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Total Quantity Display */}
                <div className="flex justify-end">
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    Total Quantity: {totalQty}
                  </Badge>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || isLoading}
                  className="min-w-[120px]"
                >
                  {submitting ? (
                    <>
                      <IconDeviceFloppy className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <IconDeviceFloppy className="h-4 w-4 mr-2" />
                      {mode === 'create' ? 'Create' : 'Update'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
