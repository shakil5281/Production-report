'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { IconCalendar, IconCash, IconX } from '@tabler/icons-react';
import { toast } from 'sonner';
import { useCalendarAutoClose } from '@/hooks/use-calendar-auto-close';

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

export default function CashReceivedForm({ mode, onSubmit, onCancel }: CashReceivedFormProps) {
  const { isCalendarOpen, setIsCalendarOpen } = useCalendarAutoClose();
  
  const [formData, setFormData] = useState({
    date: new Date(),
    amount: '',
    category: 'Cash Received',
    description: '',
    referenceType: '',
    referenceId: '',
    lineId: ''
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
          amount: '',
          category: 'Cash Received',
          description: '',
          referenceType: '',
          referenceId: '',
          lineId: ''
        });
      }
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Form submission error:', error);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 w-full max-w-md mx-auto">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto">
          <IconCash className="h-8 w-8 text-green-600" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Add Cash Received' : 'Edit Cash Received'}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {mode === 'create' 
              ? 'Enter the details of the cash received transaction' 
              : 'Update the details of the cash received transaction'
            }
          </p>
        </div>
      </div>

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date Field */}
        <div className="space-y-3">
          <Label htmlFor="date" className="text-sm font-medium text-gray-700">
            Date <span className="text-red-500">*</span>
          </Label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-11",
                  !formData.date && "text-muted-foreground"
                )}
                onClick={() => setIsCalendarOpen(true)}
              >
                <IconCalendar className="mr-3 h-5 w-5 text-gray-400" />
                {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.date}
                onSelect={(date) => {
                  if (date) {
                    setFormData({ ...formData, date });
                    setIsCalendarOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Amount Field */}
        <div className="space-y-3">
          <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
            Amount (BDT) <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className="h-12 px-4 text-lg font-medium border-gray-300 focus:border-green-500 focus:ring-green-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-gray-500 text-sm font-medium">৳</span>
            </div>
          </div>
          {formData.amount && (
            <p className="text-xs text-gray-500">
              Amount: ৳{parseFloat(formData.amount) ? parseFloat(formData.amount).toLocaleString() : '0'}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3 pt-6">
          <Button 
            type="submit" 
            disabled={!formData.date || !formData.amount}
            className="w-full h-12 bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white font-medium transition-colors duration-200"
          >
            <span>{mode === 'create' ? 'Create Entry' : 'Update Entry'}</span>
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={false}
            className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 transition-colors duration-200"
          >
            <IconX className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </form>

      {/* Form Validation Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
          </div>
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Form Requirements:</p>
            <ul className="space-y-1 text-xs">
              <li>• Date is required and must be selected</li>
              <li>• Amount must be a positive number</li>
              <li>• Amount will be stored in Bangladeshi Taka (BDT)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
