'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconPlus, IconEdit, IconX } from '@tabler/icons-react';
import { QuantityManager } from './quantity-manager';
import type { ProductionItem, ProductionFormData, QuantityItem } from './schema';
import { calculateTotalQuantity, validateQuantities } from './schema';
import { Badge } from '../ui/badge';

interface ProductionFormProps {
  item?: ProductionItem | null;
  onSubmit: (data: ProductionFormData) => Promise<boolean>;
  onCancel: () => void;
  mode: 'create' | 'edit';
}

export function ProductionForm({ item, onSubmit, onCancel, mode }: ProductionFormProps) {
  const [formData, setFormData] = useState<ProductionFormData>({
    programCode: '',
    styleNo: '',
    buyer: '',
    quantities: [],
    item: '',
    price: 0,
    percentage: 0,
    status: 'PENDING',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item && mode === 'edit') {
      setFormData({
        programCode: item.programCode,
        styleNo: item.styleNo,
        buyer: item.buyer,
        quantities: item.quantities || [],
        item: item.item,
        price: item.price,
        percentage: item.percentage,
        status: item.status || 'PENDING',
      });
    }
  }, [item, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!validateQuantities(formData.quantities)) {
      return;
    }
    
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

  const handleInputChange = (field: keyof ProductionFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'price' || field === 'percentage' ? Number(value) : value
    }));
  };

  const handleQuantitiesChange = (quantities: QuantityItem[]) => {
    setFormData(prev => ({
      ...prev,
      quantities
    }));
  };

  const totalQuantity = calculateTotalQuantity(formData.quantities);
  const isFormValid = formData.programCode && 
                     formData.styleNo && 
                     formData.buyer && 
                     formData.item && 
                     formData.price > 0 && 
                     validateQuantities(formData.quantities);

  return (
    <div className="min-h-screen sm:h-full flex flex-col">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 border-b p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-2">
          {mode === 'create' ? (
            <>
              <IconPlus className="h-5 w-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-bold">Add New Production Item</h2>
            </>
          ) : (
            <>
              <IconEdit className="h-5 w-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-bold">Edit Production Item</h2>
            </>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {mode === 'create' 
            ? 'Create a new production item with all required details'
            : 'Update the production item information'
          }
        </p>
      </div>

      {/* Form Content - Scrollable with full height support */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6 pb-24 sm:pb-6">
          {/* Basic Information Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Basic Information</CardTitle>
              <CardDescription className="text-sm">
                Enter the basic details for the production item
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="programCode" className="text-sm font-medium">Program Code *</Label>
                    <Input
                      id="programCode"
                      value={formData.programCode}
                      onChange={(e) => handleInputChange('programCode', e.target.value)}
                      placeholder="e.g., PRG-001"
                      className="h-10"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="styleNo" className="text-sm font-medium">Style No *</Label>
                    <Input
                      id="styleNo"
                      value={formData.styleNo}
                      onChange={(e) => handleInputChange('styleNo', e.target.value)}
                      placeholder="e.g., STY-001"
                      className="h-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyer" className="text-sm font-medium">Buyer *</Label>
                    <Input
                      id="buyer"
                      value={formData.buyer}
                      onChange={(e) => handleInputChange('buyer', e.target.value)}
                      placeholder="e.g., Buyer A"
                      className="h-10"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="item" className="text-sm font-medium">Item *</Label>
                    <Input
                      id="item"
                      value={formData.item}
                      onChange={(e) => handleInputChange('item', e.target.value)}
                      placeholder="e.g., Shirt"
                      className="h-10"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Financial & Status</CardTitle>
              <CardDescription className="text-sm">
                Set pricing, percentage, and production status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium">Unit Price ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.price || ''}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="e.g., 10.00"
                    className="h-10"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="percentage" className="text-sm font-medium">Percentage (%)</Label>
                  <Input
                    id="percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.percentage || ''}
                    onChange={(e) => handleInputChange('percentage', e.target.value)}
                    placeholder="e.g., 25.5"
                    className="h-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">Production Status *</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'CANCELLED') => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select production status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        Pending
                      </div>
                    </SelectItem>
                    <SelectItem value="RUNNING">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        Running
                      </div>
                    </SelectItem>
                    <SelectItem value="COMPLETE">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Complete
                      </div>
                    </SelectItem>
                    <SelectItem value="CANCELLED">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        Cancelled
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Quantity Management Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                Quantity Details
                {totalQuantity > 0 && (
                  <Badge variant="secondary" className="text-sm font-semibold">
                    Total: {totalQuantity.toLocaleString()}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-sm">
                Add quantity breakdown by variant and color
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuantityManager
                quantities={formData.quantities}
                onChange={handleQuantitiesChange}
                disabled={loading}
              />
            </CardContent>
          </Card>

          {/* Mobile Action Buttons - Inside scrollable area */}
          <div className="block sm:hidden pt-6">
            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full h-12"
                onClick={handleSubmit}
              >
                {mode === 'create' ? (
                  <>
                    <IconPlus className="h-4 w-4 mr-2" />
                    {loading ? 'Creating...' : 'Create Item'}
                  </>
                ) : (
                  <>
                    <IconEdit className="h-4 w-4 mr-2" />
                    {loading ? 'Updating...' : 'Update Item'}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="w-full h-12"
              >
                <IconX className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Desktop Footer Actions - Fixed (hidden on mobile) */}
      <div className="hidden sm:block flex-shrink-0 border-t bg-muted/30 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <IconX className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full sm:w-auto"
            onClick={handleSubmit}
          >
            {mode === 'create' ? (
              <>
                <IconPlus className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Create Item'}
              </>
            ) : (
              <>
                <IconEdit className="h-4 w-4 mr-2" />
                {loading ? 'Updating...' : 'Update Item'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
