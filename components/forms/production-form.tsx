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
    try {
      const success = await onSubmit(data);
      if (success) {
        form.reset();
        toast.success(mode === 'create' ? 'Production item created successfully' : 'Production item updated successfully');
      }
    } catch (error) {
      toast.error('Failed to save production item');
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Add new quantity row
  const addQuantityRow = () => {
    append({ variant: '', color: '', qty: 0 });
  };

  // Remove quantity row
  const removeQuantityRow = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Predefined options
  const statusOptions = [
    { value: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'RUNNING', label: 'Running', color: 'bg-blue-100 text-blue-800' },
    { value: 'COMPLETE', label: 'Complete', color: 'bg-green-100 text-green-800' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
  ];

  const variantOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];
  const colorOptions = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Gray', 'Navy', 'Brown'];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {mode === 'create' ? (
            <>
              <IconPlus className="h-5 w-5" />
              Add New Production Item
            </>
          ) : (
            <>
              <IconDeviceFloppy className="h-5 w-5" />
              Edit Production Item
            </>
          )}
        </CardTitle>
        <CardDescription>
          {mode === 'create' 
            ? 'Create a new production item with all required details'
            : 'Update the production item information'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="programCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program Code *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., PRG-001"
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
                  name="styleNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Style Number *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., STY-001"
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
                  name="buyer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Buyer *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Buyer A"
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
                  name="item"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., T-Shirt"
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
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="e.g., 10.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          disabled={isLoading || submitting}
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
                      <FormLabel>Percentage (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="e.g., 25.5"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          disabled={isLoading || submitting}
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
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                        disabled={isLoading || submitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              <div className="flex items-center gap-2">
                                <Badge className={status.color}>
                                  {status.label}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Quantities Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Quantity Details</h3>
                  <p className="text-sm text-muted-foreground">
                    Add different variants and colors with their quantities
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Quantity</p>
                  <p className="text-2xl font-bold">{totalQty.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <FormField
                        control={form.control}
                        name={`quantities.${index}.variant`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Variant *</FormLabel>
                            <Select 
                              value={field.value} 
                              onValueChange={field.onChange}
                              disabled={isLoading || submitting}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select variant" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {variantOptions.map((variant) => (
                                  <SelectItem key={variant} value={variant}>
                                    {variant}
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
                        name={`quantities.${index}.color`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Color *</FormLabel>
                            <Select 
                              value={field.value} 
                              onValueChange={field.onChange}
                              disabled={isLoading || submitting}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select color" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {colorOptions.map((color) => (
                                  <SelectItem key={color} value={color}>
                                    {color}
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
                        name={`quantities.${index}.qty`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="e.g., 100"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                disabled={isLoading || submitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addQuantityRow}
                          disabled={isLoading || submitting}
                        >
                          <IconPlus className="h-4 w-4" />
                        </Button>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeQuantityRow(index)}
                            disabled={isLoading || submitting}
                          >
                            <IconMinus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {form.formState.errors.quantities && (
                <Alert variant="destructive">
                  <IconAlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {form.formState.errors.quantities.message}
                  </AlertDescription>
                </Alert>
              )}
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
                {submitting ? 'Saving...' : mode === 'create' ? 'Create Item' : 'Update Item'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
