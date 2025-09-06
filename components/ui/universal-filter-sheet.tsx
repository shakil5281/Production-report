'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { IconFilter, IconX, IconCalendar } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date';
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
}

export interface UniversalFilterState {
  [key: string]: string;
}

interface UniversalFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: UniversalFilterState;
  onFiltersChange: (filters: UniversalFilterState) => void;
  onClearFilters: () => void;
  fields: FilterField[];
  title?: string;
  description?: string;
}

export function UniversalFilterSheet({ 
  open, 
  onOpenChange, 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  fields,
  title = "Filter Data",
  description = "Use the filters below to narrow down your data"
}: UniversalFilterSheetProps) {
  const [localFilters, setLocalFilters] = useState<UniversalFilterState>(filters);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onOpenChange(false);
  };

  const handleClearFilters = () => {
    const clearedFilters: UniversalFilterState = {};
    fields.forEach(field => {
      clearedFilters[field.key] = field.type === 'select' ? 'all' : '';
    });
    setLocalFilters(clearedFilters);
    onClearFilters();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    fields.forEach(field => {
      const value = filters[field.key];
      if (field.type === 'select') {
        if (value && value !== 'all') count++;
      } else {
        if (value && value.trim() !== '') count++;
      }
    });
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const renderFilterInput = (field: FilterField) => {
    const value = localFilters[field.key] || (field.type === 'select' ? 'all' : '');

    switch (field.type) {
      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(newValue) => handleFilterChange(field.key, newValue)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {field.label}</SelectItem>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'date':
        const dateValue = value ? new Date(value) : undefined;
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateValue && "text-muted-foreground"
                )}
              >
                <IconCalendar className="mr-2 h-4 w-4" />
                {dateValue ? format(dateValue, "MMM dd, yyyy") : <span>{field.placeholder || "Select date"}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(date) => {
                  if (date) {
                    handleFilterChange(field.key, format(date, "yyyy-MM-dd"));
                  } else {
                    handleFilterChange(field.key, "");
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
      
      case 'text':
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleFilterChange(field.key, e.target.value)}
            placeholder={field.placeholder || `Filter by ${field.label.toLowerCase()}...`}
          />
        );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <IconFilter className="h-4 w-4 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <IconFilter className="h-5 w-5" />
            {title}
          </SheetTitle>
          <SheetDescription>
            {description}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 p-4 space-y-6">
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              {renderFilterInput(field)}
            </div>
          ))}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={handleApplyFilters} className="w-full">
              Apply Filters
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClearFilters}
              className="w-full"
            >
              <IconX className="h-4 w-4 mr-2" />
              Clear All Filters
            </Button>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Active Filters:</Label>
              <div className="flex flex-wrap gap-2">
                {fields.map((field) => {
                  const value = filters[field.key];
                  const isActive = field.type === 'select' 
                    ? value && value !== 'all' 
                    : value && value.trim() !== '';
                  
                  if (!isActive) return null;

                  const displayValue = field.type === 'select' 
                    ? field.options?.find(opt => opt.value === value)?.label || value
                    : value;

                  return (
                    <Badge key={field.key} variant="secondary" className="text-xs">
                      {field.label}: {displayValue}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
