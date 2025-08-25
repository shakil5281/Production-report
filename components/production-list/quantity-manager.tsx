'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconPlus, IconTrash, IconGripVertical } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import type { QuantityItem } from './schema';
import { calculateTotalQuantity, validateQuantityItem } from './schema';

interface QuantityManagerProps {
  quantities: QuantityItem[];
  onChange: (quantities: QuantityItem[]) => void;
  disabled?: boolean;
}

export function QuantityManager({ quantities, onChange, disabled }: QuantityManagerProps) {
  const [newQuantity, setNewQuantity] = useState<QuantityItem>({
    variant: '',
    color: '',
    qty: 0
  });

  const handleAddQuantity = () => {
    if (validateQuantityItem(newQuantity)) {
      onChange([...quantities, { ...newQuantity }]);
      setNewQuantity({ variant: '', color: '', qty: 0 });
    }
  };

  const handleRemoveQuantity = (index: number) => {
    const updatedQuantities = quantities.filter((_, i) => i !== index);
    onChange(updatedQuantities);
  };

  const handleUpdateQuantity = (index: number, field: keyof QuantityItem, value: string | number) => {
    const updatedQuantities = quantities.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: field === 'qty' ? Number(value) : value };
      }
      return item;
    });
    onChange(updatedQuantities);
  };

  const totalQuantity = calculateTotalQuantity(quantities);

  return (
    <div className="space-y-4">
      {/* Existing Quantities */}
      {quantities.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Added Quantities ({quantities.length})
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {quantities.map((quantity, index) => (
              <Card key={index} className="border-0 shadow-sm bg-card/30">
                <CardContent className="p-4">
                  {/* Single Column Layout for All Screen Sizes */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <IconGripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveQuantity(index)}
                        disabled={disabled}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <IconTrash className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor={`variant-${index}`} className="text-sm font-medium">Variant</Label>
                        <Input
                          id={`variant-${index}`}
                          value={quantity.variant}
                          onChange={(e) => handleUpdateQuantity(index, 'variant', e.target.value)}
                          placeholder="S, M, L, XL"
                          disabled={disabled}
                          className="h-11 w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`color-${index}`} className="text-sm font-medium">Color</Label>
                        <Input
                          id={`color-${index}`}
                          value={quantity.color}
                          onChange={(e) => handleUpdateQuantity(index, 'color', e.target.value)}
                          placeholder="Red, Blue, Black"
                          disabled={disabled}
                          className="h-11 w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`qty-${index}`} className="text-sm font-medium">Quantity</Label>
                        <Input
                          id={`qty-${index}`}
                          type="number"
                          value={quantity.qty}
                          onChange={(e) => handleUpdateQuantity(index, 'qty', e.target.value)}
                          placeholder="0"
                          min="1"
                          disabled={disabled}
                          className="h-11 w-full"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add New Quantity */}
      <Card className="border-2 border-dashed border-primary/30 bg-primary/5 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium text-primary flex items-center gap-2">
            <IconPlus className="h-5 w-5" />
            Add New Quantity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Single Column Layout for All Screen Sizes */}
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="new-variant" className="text-sm font-medium">Variant</Label>
                <Input
                  id="new-variant"
                  value={newQuantity.variant}
                  onChange={(e) => setNewQuantity({ ...newQuantity, variant: e.target.value })}
                  placeholder="S, M, L, XL"
                  disabled={disabled}
                  className="h-11 w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-color" className="text-sm font-medium">Color</Label>
                <Input
                  id="new-color"
                  value={newQuantity.color}
                  onChange={(e) => setNewQuantity({ ...newQuantity, color: e.target.value })}
                  placeholder="Red, Blue, Black"
                  disabled={disabled}
                  className="h-11 w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-qty" className="text-sm font-medium">Quantity</Label>
                <Input
                  id="new-qty"
                  type="number"
                  value={newQuantity.qty || ''}
                  onChange={(e) => setNewQuantity({ ...newQuantity, qty: Number(e.target.value) })}
                  placeholder="0"
                  min="1"
                  disabled={disabled}
                  className="h-11 w-full"
                />
              </div>
            </div>
            
            <Button
              type="button"
              onClick={handleAddQuantity}
              disabled={disabled || !validateQuantityItem(newQuantity)}
              className="w-full h-11 text-base font-medium"
            >
              <IconPlus className="h-4 w-4 mr-2" />
              Add Quantity
            </Button>
          </div>
        </CardContent>
      </Card>

      {quantities.length === 0 && (
        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/20">
          <IconPlus className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-base font-medium">No quantities added yet</p>
          <p className="text-sm mt-2 text-muted-foreground/70">Use the form above to add quantity variations</p>
        </div>
      )}
    </div>
  );
}
