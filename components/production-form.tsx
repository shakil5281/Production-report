'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconPlus, IconEdit, IconX } from '@tabler/icons-react';

interface ProductionItem {
  id: string;
  programCode: string;
  buyer: string;
  quantity: number;
  item: string;
  price: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductionFormProps {
  item?: ProductionItem | null;
  onSubmit: (data: ProductionFormData) => Promise<boolean>;
  onCancel: () => void;
  mode: 'create' | 'edit';
}

interface ProductionFormData {
  programCode: string;
  buyer: string;
  quantity: number;
  item: string;
  price: number;
  status?: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'CANCELLED';
  notes?: string;
}

export function ProductionForm({ item, onSubmit, onCancel, mode }: ProductionFormProps) {
  const [formData, setFormData] = useState<ProductionFormData>({
    programCode: '',
    buyer: '',
    quantity: 0,
    item: '',
    price: 0,
    status: 'PENDING',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item && mode === 'edit') {
      setFormData({
        programCode: item.programCode,
        buyer: item.buyer,
        quantity: item.quantity,
        item: item.item,
        price: item.price,
        status: item.status,
        notes: item.notes || ''
      });
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

  const handleInputChange = (field: keyof ProductionFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'quantity' || field === 'price' ? Number(value) : value
    }));
  };

  const handleStatusChange = (value: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'CANCELLED') => {
    setFormData(prev => ({
      ...prev,
      status: value
    }));
  };

  return (
    <Card className="w-full max-w-2xl">
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="buyer">Buyer *</Label>
              <Input
                id="buyer"
                value={formData.buyer}
                onChange={(e) => handleInputChange('buyer', e.target.value)}
                placeholder="e.g., Buyer A"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                placeholder="e.g., 1000"
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
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="e.g., 10.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="RUNNING">Running</SelectItem>
                  <SelectItem value="COMPLETE">Complete</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes..."
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
  );
}
