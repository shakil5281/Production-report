'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight, IconDots } from '@tabler/icons-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function PaginationControls({ page, pageSize, total, onPageChange, onPageSizeChange }: PaginationProps) {
  const isMobile = useIsMobile();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < pages;
  
  // Mobile-optimized page size options
  const mobilePageSizeOptions = isMobile ? [5, 10, 15, 20] : [10, 20, 30, 40, 50];
  
  // Calculate visible page range
  const maxVisiblePages = isMobile ? 3 : 5;
  const startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(pages, startPage + maxVisiblePages - 1);
  
  // Generate visible page numbers
  const visiblePages = [];
  for (let i = startPage; i <= endPage; i++) {
    visiblePages.push(i);
  }
  
  // Calculate row range display
  const startRow = ((page - 1) * pageSize) + 1;
  const endRow = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-4 p-4 border-t bg-muted/30">
      {/* Top Section - Row Info and Page Size Selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Row Information */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="text-sm text-muted-foreground">
            {total > 0 ? (
              `Showing ${startRow} to ${endRow} of ${total} entries`
            ) : (
              'No entries to show'
            )}
          </div>
        </div>
        
        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium whitespace-nowrap">
            Rows per page
          </Label>
          <Select value={`${pageSize}`} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="h-8 w-16 sm:w-20 border-border/50" size="sm">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {mobilePageSizeOptions.map((n) => (
                <SelectItem key={n} value={`${n}`}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Bottom Section - Pagination Controls */}
      {pages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Page Information */}
          <div className="flex items-center justify-center text-sm font-medium">
            Page {page} of {pages}
          </div>
          
          {/* Pagination Buttons */}
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            {/* First Page Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 p-0 hidden sm:flex" 
              onClick={() => onPageChange(1)} 
              disabled={!canPrev}
              aria-label="Go to first page"
            >
              <IconChevronsLeft className="h-4 w-4" />
            </Button>
            
            {/* Previous Page Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={() => onPageChange(page - 1)} 
              disabled={!canPrev}
              aria-label="Go to previous page"
            >
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* Page Number Buttons */}
            <div className="flex items-center gap-1">
              {/* Show ellipsis at start if needed */}
              {startPage > 1 && (
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onPageChange(1)}
                  >
                    1
                  </Button>
                  {startPage > 2 && (
                    <div className="px-2 text-muted-foreground">
                      <IconDots className="h-4 w-4" />
                    </div>
                  )}
                </div>
              )}
              
              {/* Visible page numbers */}
              {visiblePages.map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              ))}
              
              {/* Show ellipsis at end if needed */}
              {endPage < pages && (
                <div className="flex items-center">
                  {endPage < pages - 1 && (
                    <div className="px-2 text-muted-foreground">
                      <IconDots className="h-4 w-4" />
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onPageChange(pages)}
                  >
                    {pages}
                  </Button>
                </div>
              )}
            </div>
            
            {/* Next Page Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={() => onPageChange(page + 1)} 
              disabled={!canNext}
              aria-label="Go to next page"
            >
              <IconChevronRight className="h-4 w-4" />
            </Button>
            
            {/* Last Page Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 p-0 hidden sm:flex" 
              onClick={() => onPageChange(pages)} 
              disabled={!canNext}
              aria-label="Go to last page"
            >
              <IconChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}