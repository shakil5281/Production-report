'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { IconPlus, IconEdit, IconX } from '@tabler/icons-react';
import type { Line, LineFormData } from './schema';

interface LineFormProps {
  item?: Line | null;
  onSubmit: (data: LineFormData) => Promise<boolean>;
  onCancel: () => void;
  mode: 'create' | 'edit';
}

export function LineForm({ item, onSubmit, onCancel, mode }: LineFormProps) {
  const [formData, setFormData] = useState<LineFormData>({
    name: '',
    code: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item && mode === 'edit') {
      setFormData({
        name: item.name,
        code: item.code,
        isActive: item.isActive
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

  const handleInputChange = (field: keyof LineFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {mode === 'create' ? (
            <>
              <IconPlus className="h-5 w-5" />
              Add New Line
            </>
          ) : (
            <>
              <IconEdit className="h-5 w-5" />
              Edit Line
            </>
          )}
        </CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Create a new production line with all required details'
            : 'Update the production line information'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="space-y-2">
            <Label htmlFor="name">Line Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Sewing Line 1"
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Line Code *</Label>
            <Input
              id="code"
              type="text"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value)}
              placeholder="e.g., SL-01"
              required
              className="w-full"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange('isActive', checked)}
            />
            <Label htmlFor="isActive">Active</Label>
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
                  {loading ? 'Creating...' : 'Create Line'}
                </>
              ) : (
                <>
                  <IconEdit className="h-4 w-4 mr-2" />
                  {loading ? 'Updating...' : 'Update Line'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
