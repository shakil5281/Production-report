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
              <Card key={index} className="border border-muted shadow-sm">
                <CardContent className="p-3">
                  {/* Mobile Layout */}
                  <div className="block sm:hidden">
                    <div className="flex flex-col space-y-3">
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
                      
                      <div className="space-y-1">
                        <Label htmlFor={`variant-${index}`} className="text-xs font-medium">Variant</Label>
                        <Input
                          id={`variant-${index}`}
                          value={quantity.variant}
                          onChange={(e) => handleUpdateQuantity(index, 'variant', e.target.value)}
                          placeholder="S, M, L, XL"
                          disabled={disabled}
                          className="h-9 text-sm"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor={`color-${index}`} className="text-xs font-medium">Color</Label>
                        <Input
                          id={`color-${index}`}
                          value={quantity.color}
                          onChange={(e) => handleUpdateQuantity(index, 'color', e.target.value)}
                          placeholder="Red, Blue, Black"
                          disabled={disabled}
                          className="h-9 text-sm"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor={`qty-${index}`} className="text-xs font-medium">Quantity</Label>
                        <Input
                          id={`qty-${index}`}
                          type="number"
                          value={quantity.qty}
                          onChange={(e) => handleUpdateQuantity(index, 'qty', e.target.value)}
                          placeholder="0"
                          min="1"
                          disabled={disabled}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:block">
                    <div className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-1 flex justify-center items-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <IconGripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      
                      <div className="col-span-3">
                        <Label htmlFor={`variant-${index}`} className="text-xs font-medium">Variant</Label>
                        <Input
                          id={`variant-${index}`}
                          value={quantity.variant}
                          onChange={(e) => handleUpdateQuantity(index, 'variant', e.target.value)}
                          placeholder="S, M, L, XL"
                          disabled={disabled}
                          className="h-9"
                        />
                      </div>
                      
                      <div className="col-span-3">
                        <Label htmlFor={`color-${index}`} className="text-xs font-medium">Color</Label>
                        <Input
                          id={`color-${index}`}
                          value={quantity.color}
                          onChange={(e) => handleUpdateQuantity(index, 'color', e.target.value)}
                          placeholder="Red, Blue, Black"
                          disabled={disabled}
                          className="h-9"
                        />
                      </div>
                      
                      <div className="col-span-3">
                        <Label htmlFor={`qty-${index}`} className="text-xs font-medium">Quantity</Label>
                        <Input
                          id={`qty-${index}`}
                          type="number"
                          value={quantity.qty}
                          onChange={(e) => handleUpdateQuantity(index, 'qty', e.target.value)}
                          placeholder="0"
                          min="1"
                          disabled={disabled}
                          className="h-9"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveQuantity(index)}
                          disabled={disabled}
                          className="h-9 w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <IconTrash className="h-3 w-3" />
                        </Button>
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
      <Card className="border-2 border-dashed border-primary/25 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
            <IconPlus className="h-4 w-4" />
            Add New Quantity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Mobile Layout */}
          <div className="block sm:hidden">
            <div className="flex flex-col space-y-3">
              <div className="space-y-1">
                <Label htmlFor="new-variant" className="text-xs font-medium">Variant</Label>
                <Input
                  id="new-variant"
                  value={newQuantity.variant}
                  onChange={(e) => setNewQuantity({ ...newQuantity, variant: e.target.value })}
                  placeholder="S, M, L, XL"
                  disabled={disabled}
                  className="h-9 text-sm"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="new-color" className="text-xs font-medium">Color</Label>
                <Input
                  id="new-color"
                  value={newQuantity.color}
                  onChange={(e) => setNewQuantity({ ...newQuantity, color: e.target.value })}
                  placeholder="Red, Blue, Black"
                  disabled={disabled}
                  className="h-9 text-sm"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="new-qty" className="text-xs font-medium">Quantity</Label>
                <Input
                  id="new-qty"
                  type="number"
                  value={newQuantity.qty || ''}
                  onChange={(e) => setNewQuantity({ ...newQuantity, qty: Number(e.target.value) })}
                  placeholder="0"
                  min="1"
                  disabled={disabled}
                  className="h-9 text-sm"
                />
              </div>
              
              <Button
                type="button"
                onClick={handleAddQuantity}
                disabled={disabled || !validateQuantityItem(newQuantity)}
                className="w-full h-10"
              >
                <IconPlus className="h-4 w-4 mr-2" />
                Add Quantity
              </Button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-3">
                <Label htmlFor="new-variant" className="text-xs font-medium">Variant</Label>
                <Input
                  id="new-variant"
                  value={newQuantity.variant}
                  onChange={(e) => setNewQuantity({ ...newQuantity, variant: e.target.value })}
                  placeholder="S, M, L, XL"
                  disabled={disabled}
                  className="h-9"
                />
              </div>
              
              <div className="col-span-3">
                <Label htmlFor="new-color" className="text-xs font-medium">Color</Label>
                <Input
                  id="new-color"
                  value={newQuantity.color}
                  onChange={(e) => setNewQuantity({ ...newQuantity, color: e.target.value })}
                  placeholder="Red, Blue, Black"
                  disabled={disabled}
                  className="h-9"
                />
              </div>
              
              <div className="col-span-3">
                <Label htmlFor="new-qty" className="text-xs font-medium">Quantity</Label>
                <Input
                  id="new-qty"
                  type="number"
                  value={newQuantity.qty || ''}
                  onChange={(e) => setNewQuantity({ ...newQuantity, qty: Number(e.target.value) })}
                  placeholder="0"
                  min="1"
                  disabled={disabled}
                  className="h-9"
                />
              </div>
              
              <div className="col-span-3">
                <Button
                  type="button"
                  onClick={handleAddQuantity}
                  disabled={disabled || !validateQuantityItem(newQuantity)}
                  className="h-9 w-full"
                >
                  <IconPlus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {quantities.length === 0 && (
        <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
          <IconPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No quantities added yet</p>
          <p className="text-xs mt-1">Use the form above to add quantity variations</p>
        </div>
      )}
    </div>
  );
}
