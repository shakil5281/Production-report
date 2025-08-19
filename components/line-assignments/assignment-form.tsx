'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconCalendar, IconClock, IconX, IconPlus } from '@tabler/icons-react';

import type { Line, ProductionListItem, LineAssignmentFormData } from './schema';
import { formatPrice } from './schema';

interface AssignmentFormProps {
  lines: Line[];
  productionItems: ProductionListItem[];
  onSubmit: (data: LineAssignmentFormData) => Promise<boolean>;
  onCancel: () => void;
  loading?: boolean;
}

export function AssignmentForm({ lines, productionItems, onSubmit, onCancel, loading }: AssignmentFormProps) {
  const [formData, setFormData] = useState<LineAssignmentFormData>({
    lineId: '',
    styleNo: '',
    targetPerHour: 0
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedProductionItem, setSelectedProductionItem] = useState<ProductionListItem | null>(null);

  const handleInputChange = (field: keyof LineAssignmentFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStyleSelect = (styleNo: string) => {
    const item = productionItems.find(p => p.styleNo === styleNo);
    setSelectedProductionItem(item || null);
    handleInputChange('styleNo', styleNo);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.lineId || !formData.styleNo) {
      return;
    }

    setSubmitting(true);
    
    try {
      const success = await onSubmit(formData);
      if (success) {
        // Reset form
        setFormData({
          lineId: '',
          styleNo: '',
          targetPerHour: 0
        });
        setSelectedProductionItem(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedLine = lines.find(l => l.id === formData.lineId);
  const isFormValid = formData.lineId && formData.styleNo;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-1">
      {/* Line Selection */}
      <div className="space-y-2">
        <Label htmlFor="line">Production Line *</Label>
        <Select value={formData.lineId} onValueChange={(value) => handleInputChange('lineId', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a production line" />
          </SelectTrigger>
          <SelectContent>
            {lines.map(line => (
              <SelectItem key={line.id} value={line.id}>
                <div className="flex items-center gap-2">
                  <span>{line.name}</span>
                  <Badge variant="outline">{line.code}</Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedLine && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
            <span className="text-sm">
              Selected: {selectedLine.name} ({selectedLine.code})
            </span>
          </div>
        )}
      </div>

      {/* Style Selection */}
      <div className="space-y-2">
        <Label htmlFor="style">Running Production Style *</Label>
        <Select value={formData.styleNo} onValueChange={handleStyleSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select a running production style" />
          </SelectTrigger>
          <SelectContent>
            {productionItems.filter(item => item.status === 'RUNNING').map(item => (
              <SelectItem key={item.id} value={item.styleNo}>
                <div className="flex items-center gap-2">
                  <span>{item.styleNo}</span>
                  <span className="text-muted-foreground">- {item.buyer}</span>
                  <Badge variant="secondary">RUNNING</Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selected Production Item Details */}
      {selectedProductionItem && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Selected Running Style</CardTitle>
            <CardDescription>Details of the selected production style</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Style:</span> 
                <span>{selectedProductionItem.styleNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Buyer:</span> 
                <span>{selectedProductionItem.buyer}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Item:</span> 
                <span>{selectedProductionItem.item}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total Qty:</span> 
                <span className="font-mono">{selectedProductionItem.totalQty.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Price:</span> 
                <span>{formatPrice(selectedProductionItem.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span> 
                <Badge variant="secondary">{selectedProductionItem.status}</Badge>
              </div>
            </div>
            
            {selectedProductionItem.quantities.length > 0 && (
              <div className="pt-3 border-t">
                <div className="text-sm font-medium mb-2">Quantities:</div>
                <div className="flex flex-wrap gap-2">
                  {selectedProductionItem.quantities.slice(0, 4).map((qty, idx) => (
                    <Badge key={idx} variant="outline">
                      {qty.variant}/{qty.color}: {qty.qty}
                    </Badge>
                  ))}
                  {selectedProductionItem.quantities.length > 4 && (
                    <Badge variant="outline">
                      +{selectedProductionItem.quantities.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}



      {/* Target Per Hour */}
      <div className="space-y-2">
        <Label htmlFor="targetPerHour">Target Per Hour (Optional)</Label>
        <div className="relative">
          <Input
            id="targetPerHour"
            type="number"
            min="0"
            value={formData.targetPerHour || ''}
            onChange={(e) => handleInputChange('targetPerHour', parseInt(e.target.value) || 0)}
            placeholder="0"
            className="pr-10"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <IconClock className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Expected production units per hour for this assignment
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting || loading}
        >
          <IconX className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        
        <Button
          type="submit"
          disabled={!isFormValid || submitting || loading}
        >
          <IconPlus className="h-4 w-4 mr-2" />
          {submitting ? 'Creating Assignment...' : 'Create Assignment'}
        </Button>
      </div>
    </form>
  );
}
