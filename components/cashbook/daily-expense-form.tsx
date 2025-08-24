'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { IconCalendar, IconReceipt, IconHash } from '@tabler/icons-react';
import { toast } from 'sonner';
import { useCalendarAutoClose } from '@/hooks/use-calendar-auto-close';

interface DailyExpenseFormProps {
  form: {
    date: Date | undefined;
    volumeNumber: string;
    description: string;
    amount: string;
  };
  setForm: (form: any) => void;
  onSubmit: () => Promise<void>;
  isSubmitting?: boolean;
  onCancel: () => void;
}

export default function DailyExpenseForm({ form, setForm, onSubmit, isSubmitting = false, onCancel }: DailyExpenseFormProps) {
  const { isCalendarOpen, setIsCalendarOpen } = useCalendarAutoClose();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.description || !form.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    await onSubmit();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-3">
          <IconReceipt className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          Daily Expense Entry
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enter the details of the daily expense transaction
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="date" className="text-sm font-medium text-gray-700">
            Date <span className="text-red-500">*</span>
          </Label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-11",
                  !form.date && "text-muted-foreground"
                )}
                onClick={() => setIsCalendarOpen(true)}
              >
                <IconCalendar className="mr-2 h-4 w-4" />
                {form.date ? format(form.date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={form.date}
                onSelect={(date) => {
                  if (date) {
                    setForm({ ...form, date });
                    setIsCalendarOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="volumeNumber" className="text-sm font-medium text-gray-700">
            Volume Number
          </Label>
          <div className="relative">
            <IconHash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="volumeNumber"
              type="text"
              placeholder="Volume number (optional)"
              value={form.volumeNumber}
              onChange={(e) => setForm({ ...form, volumeNumber: e.target.value })}
              className="h-12 pl-10 border-gray-300 focus:border-red-500 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-gray-700">
            Description <span className="text-red-500">*</span>
          </Label>
          <Input
            id="description"
            type="text"
            placeholder="Expense description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="h-12 border-gray-300 focus:border-red-500 focus:ring-red-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
            Amount (BDT) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="h-12 border-gray-300 focus:border-red-500 focus:ring-red-500"
          />
        </div>

        <div className="flex flex-col space-y-3 pt-6">
          <Button 
            type="submit" 
            disabled={isSubmitting || !form.date || !form.description || !form.amount}
            className="w-full h-12 bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-sm font-medium"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </div>
            ) : (
              'Submit Entry'
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="w-full h-12 border-gray-300 hover:bg-gray-50 font-medium"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
