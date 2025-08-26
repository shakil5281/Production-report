'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight, IconDots } from '@tabler/icons-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface SimpleMobilePaginationProps {
  // Basic pagination state
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  selectedRecords?: number;
  
  // Callbacks
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  
  // Customization options
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showRowCount?: boolean;
  showSelectedCount?: boolean;
  showFirstLastButtons?: boolean;
  maxVisiblePages?: number;
  className?: string;
}

export function SimpleMobilePagination({
  currentPage,
  pageSize,
  totalPages,
  totalRecords,
  selectedRecords = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 15, 20, 25, 30, 50],
  showPageSizeSelector = true,
  showRowCount = true,
  showSelectedCount = true,
  showFirstLastButtons = true,
  maxVisiblePages = 5,
  className = ''
}: SimpleMobilePaginationProps) {
  const isMobile = useIsMobile();
  
  // Calculate start and end of visible page range
  const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  // Generate page numbers to display
  const visiblePages = [];
  for (let i = startPage; i <= endPage; i++) {
    visiblePages.push(i);
  }
  
  // Mobile-optimized page size options
  const mobilePageSizeOptions = isMobile ? [5, 10, 15, 20] : pageSizeOptions;
  
  // Calculate row range display
  const startRow = ((currentPage - 1) * pageSize) + 1;
  const endRow = Math.min(currentPage * pageSize, totalRecords);
  
  return (
    <div className={`flex flex-col gap-4 p-4 border-t bg-muted/30 ${className}`}>
      {/* Top Section - Row Info and Page Size Selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Row Information */}
        {showRowCount && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="text-sm text-muted-foreground">
              {totalRecords > 0 ? (
                `Showing ${startRow} to ${endRow} of ${totalRecords} entries`
              ) : (
                'No entries to show'
              )}
            </div>
            
            {showSelectedCount && selectedRecords > 0 && (
              <div className="text-sm text-primary">
                {selectedRecords} of {totalRecords} record(s) selected
              </div>
            )}
          </div>
        )}
        
        {/* Page Size Selector */}
        {showPageSizeSelector && (
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium whitespace-nowrap">
              Rows per page
            </Label>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-16 sm:w-20 border-border/50">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {mobilePageSizeOptions.map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      {/* Bottom Section - Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Page Information */}
          <div className="flex items-center justify-center text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>
          
          {/* Pagination Buttons */}
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            {/* First Page Button */}
            {showFirstLastButtons && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 hidden sm:flex"
                onClick={() => onPageChange(1)}
                disabled={currentPage <= 1}
                aria-label="Go to first page"
              >
                <IconChevronsLeft className="h-4 w-4" />
              </Button>
            )}
            
            {/* Previous Page Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
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
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              ))}
              
              {/* Show ellipsis at end if needed */}
              {endPage < totalPages && (
                <div className="flex items-center">
                  {endPage < totalPages - 1 && (
                    <div className="px-2 text-muted-foreground">
                      <IconDots className="h-4 w-4" />
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onPageChange(totalPages)}
                  >
                    {totalPages}
                  </Button>
                </div>
              )}
            </div>
            
            {/* Next Page Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              aria-label="Go to next page"
            >
              <IconChevronRight className="h-4 w-4" />
            </Button>
            
            {/* Last Page Button */}
            {showFirstLastButtons && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 hidden sm:flex"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage >= totalPages}
                aria-label="Go to last page"
              >
                <IconChevronsRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
