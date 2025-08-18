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
    <div className="space-y-6">
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
                <IconEdit className="h-5 w-5" />
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="programCode">Program Code *</Label>
                <Input
                  id="programCode"
                  value={formData.programCode}
                  onChange={(e) => handleInputChange('programCode', e.target.value)}
                  placeholder="e.g., PRG-001"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="styleNo">Style No *</Label>
                <Input
                  id="styleNo"
                  value={formData.styleNo}
                  onChange={(e) => handleInputChange('styleNo', e.target.value)}
                  placeholder="e.g., STY-001"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="buyer">Buyer *</Label>
                <Input
                  id="buyer"
                  value={formData.buyer}
                  onChange={(e) => handleInputChange('buyer', e.target.value)}
                  placeholder="e.g., Buyer A"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="item">Item *</Label>
                <Input
                  id="item"
                  value={formData.item}
                  onChange={(e) => handleInputChange('item', e.target.value)}
                  placeholder="e.g., Shirt"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="e.g., 10.00"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="percentage">Percentage (%)</Label>
                <Input
                  id="percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.percentage || ''}
                  onChange={(e) => handleInputChange('percentage', e.target.value)}
                  placeholder="e.g., 25.5"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'CANCELLED') => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="w-full">
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
            </div>

            {/* Quantity Management */}
            <div className="space-y-4">
              <QuantityManager
                quantities={formData.quantities}
                onChange={handleQuantitiesChange}
                disabled={loading}
              />
              
              {totalQuantity > 0 && (
                <div className="text-right">
                  <p className="text-lg font-semibold text-green-600">
                    Total Quantity: {totalQuantity.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
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
                disabled={loading || !isFormValid}
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
