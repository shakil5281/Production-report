'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { IconFilter, IconX } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';

export interface FilterState {
  status: 'all' | 'RUNNING' | 'PENDING' | 'COMPLETE' | 'CANCELLED';
  search: string;
  programCode: string;
  buyer: string;
  item: string;
}

interface FilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

export function FilterSheet({ open, onOpenChange, filters, onFiltersChange, onClearFilters }: FilterSheetProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onOpenChange(false);
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterState = {
      status: 'all',
      search: '',
      programCode: '',
      buyer: '',
      item: '',
    };
    setLocalFilters(clearedFilters);
    onClearFilters();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.search) count++;
    if (filters.programCode) count++;
    if (filters.buyer) count++;
    if (filters.item) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

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
            Filter Production Items
          </SheetTitle>
          <SheetDescription>
            Use the filters below to narrow down your production items
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 p-4 space-y-6">
          {/* Search Filter */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search all columns..."
              value={localFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={localFilters.status}
              onValueChange={(value: 'all' | 'RUNNING' | 'PENDING' | 'COMPLETE' | 'CANCELLED') => 
                handleFilterChange('status', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="RUNNING">Running</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="COMPLETE">Complete</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Program Code Filter */}
          <div className="space-y-2">
            <Label htmlFor="programCode">Program Code</Label>
            <Input
              id="programCode"
              placeholder="Filter by program code..."
              value={localFilters.programCode}
              onChange={(e) => handleFilterChange('programCode', e.target.value)}
            />
          </div>

          {/* Buyer Filter */}
          <div className="space-y-2">
            <Label htmlFor="buyer">Buyer</Label>
            <Input
              id="buyer"
              placeholder="Filter by buyer..."
              value={localFilters.buyer}
              onChange={(e) => handleFilterChange('buyer', e.target.value)}
            />
          </div>

          {/* Item Filter */}
          <div className="space-y-2">
            <Label htmlFor="item">Item</Label>
            <Input
              id="item"
              placeholder="Filter by item..."
              value={localFilters.item}
              onChange={(e) => handleFilterChange('item', e.target.value)}
            />
          </div>

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
                {filters.status !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Status: {filters.status}
                  </Badge>
                )}
                {filters.search && (
                  <Badge variant="secondary" className="text-xs">
                    Search: {filters.search}
                  </Badge>
                )}
                {filters.programCode && (
                  <Badge variant="secondary" className="text-xs">
                    Program: {filters.programCode}
                  </Badge>
                )}
                {filters.buyer && (
                  <Badge variant="secondary" className="text-xs">
                    Buyer: {filters.buyer}
                  </Badge>
                )}
                {filters.item && (
                  <Badge variant="secondary" className="text-xs">
                    Item: {filters.item}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
