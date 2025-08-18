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
    <form onSubmit={handleSubmit} className="space-y-8 p-1">
      {/* Line Selection */}
      <div className="space-y-3">
        <Label htmlFor="line" className="text-base font-semibold text-gray-700">Production Line *</Label>
        <Select value={formData.lineId} onValueChange={(value) => handleInputChange('lineId', value)}>
          <SelectTrigger className="border-2 hover:border-blue-300 transition-all duration-200 h-12">
            <SelectValue placeholder="Select a production line" />
          </SelectTrigger>
          <SelectContent>
            {lines.map(line => (
              <SelectItem key={line.id} value={line.id} className="py-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-800">{line.name}</span>
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">{line.code}</Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedLine && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-blue-800">
              Selected: {selectedLine.name} ({selectedLine.code})
            </span>
          </div>
        )}
      </div>

      {/* Style Selection */}
      <div className="space-y-3">
        <Label htmlFor="style" className="text-base font-semibold text-gray-700">Running Production Style *</Label>
        <Select value={formData.styleNo} onValueChange={handleStyleSelect}>
          <SelectTrigger className="border-2 hover:border-green-300 transition-all duration-200 h-12">
            <SelectValue placeholder="Select a running production style" />
          </SelectTrigger>
          <SelectContent>
            {productionItems.filter(item => item.status === 'RUNNING').map(item => (
              <SelectItem key={item.id} value={item.styleNo} className="py-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-800">{item.styleNo}</span>
                  <span className="text-gray-600">- {item.buyer}</span>
                  <Badge className="bg-green-100 text-green-800 text-xs flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    RUNNING
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selected Production Item Details */}
      {selectedProductionItem && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-l-green-500">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2 text-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Selected Running Style
            </CardTitle>
            <CardDescription className="text-sm text-green-700">Details of the selected production style</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                <span className="font-semibold text-gray-700">Style:</span> 
                <span className="text-green-800 font-medium">{selectedProductionItem.styleNo}</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                <span className="font-semibold text-gray-700">Buyer:</span> 
                <span className="text-green-800">{selectedProductionItem.buyer}</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                <span className="font-semibold text-gray-700">Item:</span> 
                <span className="text-green-800">{selectedProductionItem.item}</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                <span className="font-semibold text-gray-700">Total Qty:</span> 
                <span className="text-green-800 font-mono">{selectedProductionItem.totalQty.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                <span className="font-semibold text-gray-700">Price:</span> 
                <span className="text-green-800 font-medium">{formatPrice(selectedProductionItem.price)}</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                <span className="font-semibold text-gray-700">Status:</span> 
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1"></div>
                  {selectedProductionItem.status}
                </Badge>
              </div>
            </div>
            
            {selectedProductionItem.quantities.length > 0 && (
              <div className="pt-3 border-t border-green-200">
                <div className="text-sm font-semibold mb-2 text-green-800">Quantities:</div>
                <div className="flex flex-wrap gap-2">
                  {selectedProductionItem.quantities.slice(0, 4).map((qty, idx) => (
                    <Badge key={idx} className="bg-green-200 text-green-800 border-green-300">
                      {qty.variant}/{qty.color}: {qty.qty}
                    </Badge>
                  ))}
                  {selectedProductionItem.quantities.length > 4 && (
                    <Badge variant="outline" className="border-green-300 text-green-700">
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
      <div className="space-y-3">
        <Label htmlFor="targetPerHour" className="text-base font-semibold text-gray-700">Target Per Hour (Optional)</Label>
        <div className="relative">
          <Input
            id="targetPerHour"
            type="number"
            min="0"
            value={formData.targetPerHour || ''}
            onChange={(e) => handleInputChange('targetPerHour', parseInt(e.target.value) || 0)}
            placeholder="0"
            className="border-2 hover:border-purple-300 transition-all duration-200 h-12 pl-4 pr-12"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-purple-100 rounded-lg">
            <IconClock className="h-4 w-4 text-purple-600" />
          </div>
        </div>
        <div className="text-sm text-gray-600 bg-purple-50 border border-purple-200 rounded-lg p-3">
          <span className="font-medium">💡 Tip:</span> Expected production units per hour for this assignment
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting || loading}
          className="border-2 border-gray-300 hover:border-red-300 hover:bg-red-50 transition-all duration-200 px-6"
        >
          <IconX className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        
        <Button
          type="submit"
          disabled={!isFormValid || submitting || loading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg px-8 transition-all duration-200"
        >
          <IconPlus className="h-4 w-4 mr-2" />
          {submitting ? 'Creating Assignment...' : 'Create Assignment'}
        </Button>
      </div>
    </form>
  );
}
