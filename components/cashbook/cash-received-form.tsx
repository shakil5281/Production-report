'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { IconCalendar, IconCash } from '@tabler/icons-react';
import { toast } from 'sonner';

interface CashReceivedFormProps {
  onSubmit: (data: { date: Date; amount: number }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  initialData?: {
    date: Date;
    amount: number;
  };
  mode: 'create' | 'edit';
}

interface FormData {
  date: Date | undefined;
  amount: string;
}

export default function CashReceivedForm({ 
  onSubmit, 
  onCancel, 
  loading = false, 
  initialData,
  mode 
}: CashReceivedFormProps) {
  const [formData, setFormData] = useState<FormData>({
    date: initialData?.date || new Date(),
    amount: initialData?.amount.toString() || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.amount) {
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
        amount
      });
      
      // Reset form on successful submission
      if (mode === 'create') {
        setFormData({
          date: new Date(),
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
        <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
          <IconCash className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold">
          {mode === 'create' ? 'Add Cash Received' : 'Edit Cash Received'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === 'create' 
            ? 'Enter the details of the cash received transaction' 
            : 'Update the details of the cash received transaction'
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
            disabled={loading || !formData.date || !formData.amount}
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
