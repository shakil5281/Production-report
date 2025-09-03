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
    <div className="min-h-screen sm:h-full flex flex-col">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 border-b p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-2">
          <IconPlus className="h-5 w-5 text-primary" />
          <h2 className="text-lg sm:text-xl font-bold">Create Line Assignment</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Assign a running production style to a production line
        </p>
      </div>

      {/* Form Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6 pb-24 sm:pb-6">
          {/* Line Selection Card */}
          <Card className="border-none shadow-none p-0">
            <CardHeader className="pb-3 hidden">

            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="line" className="text-sm font-medium">Production Line *</Label>
                <Select value={formData.lineId} onValueChange={(value) => handleInputChange('lineId', value)}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Select a production line" />
                  </SelectTrigger>
                  <SelectContent>
                    {lines.map(line => (
                      <SelectItem key={line.id} value={line.id}>
                        <div className="flex items-center gap-2">
                          <span>{line.name}</span>
                          <Badge variant="outline" className="text-xs">{line.code}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedLine && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      Selected: {selectedLine.name} ({selectedLine.code})
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Style Selection Card */}
          <Card className="border-none shadow-none p-0">
            <CardHeader className="pb-3 hidden">

            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="style" className="text-sm font-medium">Running Production Style *</Label>
                <Select value={formData.styleNo} onValueChange={handleStyleSelect}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Select a running production style" />
                  </SelectTrigger>
                  <SelectContent>
                    {productionItems.filter(item => item.status === 'RUNNING').map(item => (
                      <SelectItem key={item.id} value={item.styleNo}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.styleNo}</span>
                          <span className="text-muted-foreground">- {item.buyer}</span>
                          <Badge variant="secondary" className="text-xs">RUNNING</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Selected Production Item Details */}
          {selectedProductionItem && (
            <Card className="border-none shadow-none p-0 border-primary/20 bg-primary/5 hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-primary">Selected Style Details</CardTitle>
                <CardDescription className="text-sm">
                  Complete information about the selected production style
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Basic Information */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground mb-3">Basic Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex justify-between items-center py-2 border-b border-muted">
                      <span className="text-sm font-medium text-muted-foreground">Style No</span>
                      <span className="font-semibold text-primary">{selectedProductionItem.styleNo}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-muted">
                      <span className="text-sm font-medium text-muted-foreground">Buyer</span>
                      <span className="font-medium">{selectedProductionItem.buyer}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-muted">
                      <span className="text-sm font-medium text-muted-foreground">Item</span>
                      <span className="font-medium">{selectedProductionItem.item}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-muted">
                      <span className="text-sm font-medium text-muted-foreground">Status</span>
                      <Badge variant="secondary" className="text-xs">{selectedProductionItem.status}</Badge>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-sm text-blue-700 dark:text-blue-300 mb-3">Financial Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex justify-between items-center py-2 border-b border-blue-200 dark:border-blue-800">
                      <span className="text-sm font-medium text-muted-foreground">Total Quantity</span>
                      <span className="font-bold text-lg text-primary">{selectedProductionItem.totalQty.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-blue-200 dark:border-blue-800">
                      <span className="text-sm font-medium text-muted-foreground">Unit Price</span>
                      <span className="font-semibold text-green-600">{formatPrice(selectedProductionItem.price)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Quantity Breakdown */}
                {selectedProductionItem.quantities.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-sm text-green-700 dark:text-green-300 mb-3">Quantity Breakdown</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedProductionItem.quantities.slice(0, 6).map((qty, idx) => (
                        <div key={idx} className="bg-white dark:bg-gray-800 rounded-md p-2 border">
                          <div className="flex justify-between items-center">
                            <div className="flex gap-1">
                              <Badge variant="outline" className="text-xs">{qty.variant}</Badge>
                              <Badge variant="secondary" className="text-xs">{qty.color}</Badge>
                            </div>
                            <span className="font-semibold text-primary">{qty.qty.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                      {selectedProductionItem.quantities.length > 6 && (
                        <div className="col-span-full text-center p-2 bg-white dark:bg-gray-800 rounded-md border border-dashed">
                          <span className="text-sm text-muted-foreground">
                            +{selectedProductionItem.quantities.length - 6} more variants
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Target Configuration Card */}
          <Card className="border-none shadow-none p-0">
            <CardHeader className="pb-3 hidden">

            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="targetPerHour" className="text-sm font-medium">Target Per Hour (Optional)</Label>
                <div className="relative">
                  <Input
                    id="targetPerHour"
                    type="number"
                    min="0"
                    value={formData.targetPerHour || ''}
                    onChange={(e) => handleInputChange('targetPerHour', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="h-10 pr-10"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <IconClock className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Expected production units per hour for this assignment
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Action Buttons - Inside scrollable area */}
          <div className="block sm:hidden pt-6">
            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                disabled={!isFormValid || submitting || loading}
                className="w-full h-12"
              >
                <IconPlus className="h-4 w-4 mr-2" />
                {submitting ? 'Creating Assignment...' : 'Create Assignment'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={submitting || loading}
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
            disabled={submitting || loading}
            className="w-full sm:w-auto"
          >
            <IconX className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isFormValid || submitting || loading}
            className="w-full sm:w-auto"
            onClick={handleSubmit}
          >
            <IconPlus className="h-4 w-4 mr-2" />
            {submitting ? 'Creating Assignment...' : 'Create Assignment'}
          </Button>
        </div>
      </div>
    </div>
  );
}
