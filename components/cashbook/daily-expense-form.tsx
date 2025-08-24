'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { IconCalendar, IconReceipt, IconHash } from '@tabler/icons-react';
import { toast } from 'sonner';

interface DailyExpenseFormProps {
  onSubmit: (data: { date: Date; volumeNumber: string; description: string; amount: number }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  initialData?: {
    date: Date;
    volumeNumber: string;
    description: string;
    amount: number;
  };
  mode: 'create' | 'edit';
}

interface FormData {
  date: Date | undefined;
  volumeNumber: string;
  description: string;
  amount: string;
}

export default function DailyExpenseForm({ 
  onSubmit, 
  onCancel, 
  loading = false, 
  initialData,
  mode 
}: DailyExpenseFormProps) {
  const [formData, setFormData] = useState<FormData>({
    date: initialData?.date || new Date(),
    volumeNumber: initialData?.volumeNumber || '',
    description: initialData?.description || '',
    amount: initialData?.amount.toString() || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.description || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await onSubmit({
        date: formData.date,
        volumeNumber: formData.volumeNumber,
        description: formData.description,
        amount
      });
      
      // Reset form on successful submission
      if (mode === 'create') {
        setFormData({
          date: new Date(),
          volumeNumber: '',
          description: '',
          amount: ''
        });
      }
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-3">
          <IconReceipt className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold">
          {mode === 'create' ? 'Add Daily Expense' : 'Edit Daily Expense'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === 'create' 
            ? 'Enter the details of the daily expense transaction' 
            : 'Update the details of the daily expense transaction'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="date" className="text-sm font-medium">
            Date <span className="text-red-500">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-11",
                  !formData.date && "text-muted-foreground"
                )}
              >
                <IconCalendar className="mr-2 h-4 w-4" />
                {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.date}
                onSelect={(date) => setFormData({ ...formData, date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="volumeNumber" className="text-sm font-medium">
            Volume Number
          </Label>
          <div className="relative">
            <IconHash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="volumeNumber"
              type="text"
              placeholder="Volume number (optional)"
              value={formData.volumeNumber}
              onChange={(e) => setFormData({ ...formData, volumeNumber: e.target.value })}
              className="h-11 pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Description <span className="text-red-500">*</span>
          </Label>
          <Input
            id="description"
            type="text"
            placeholder="Expense description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-medium">
            Amount (BDT) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="h-11"
          />
        </div>

        <div className="flex flex-col space-y-2 pt-4">
          <Button 
            type="submit" 
            disabled={loading || !formData.date || !formData.description || !formData.amount}
            className="w-full h-11"
          >
            {loading 
              ? (mode === 'create' ? 'Creating...' : 'Updating...') 
              : (mode === 'create' ? 'Create Entry' : 'Update Entry')
            }
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="w-full h-11"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
