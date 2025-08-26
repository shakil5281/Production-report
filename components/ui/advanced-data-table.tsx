'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { 
  IconSearch, 
  IconFilter, 
  IconRefresh,
  IconChevronLeft,
  IconChevronRight,
  IconArrowUp,
  IconArrowDown,
  IconDots,

} from '@tabler/icons-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Column<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  render?: (value: any, row: T) => React.ReactNode;
}

interface Filter {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface AdvancedDataTableProps<T> {
  title: string;
  description?: string;
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  filters?: Filter[];
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onFilterChange?: (filters: Record<string, any>) => void;
  onRefresh?: () => void;
  actions?: React.ReactNode;
  emptyMessage?: string;
  showFilters?: boolean;
  defaultFiltersVisible?: boolean;
}

export function AdvancedDataTable<T extends Record<string, any>>({
  title,
  description,
  columns,
  data,
  loading = false,
  filters = [],
  pagination,
  onPageChange,
  onLimitChange,
  onSortChange,
  onFilterChange,
  onRefresh,
  actions,
  emptyMessage = "No data available",
  showFilters = true,
  defaultFiltersVisible = false
}: AdvancedDataTableProps<T>) {
  const isMobile = useIsMobile();
  const [filtersVisible, setFiltersVisible] = useState(defaultFiltersVisible);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: any) => {
    const newFilters = { ...filterValues, [key]: value };
    setFilterValues(newFilters);
    onFilterChange?.(newFilters);
  }, [filterValues, onFilterChange]);

  // Handle sort changes
  const handleSortChange = (columnKey: string) => {
    const newSortOrder = sortBy === columnKey && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(columnKey);
    setSortOrder(newSortOrder);
    onSortChange?.(columnKey, newSortOrder);
  };

  // Reset filters
  const resetFilters = () => {
    setFilterValues({});
    onFilterChange?.({});
  };

  // Render filter input based on type
  const renderFilterInput = (filter: Filter) => {
    const value = filterValues[filter.key] || '';

    switch (filter.type) {
      case 'select':
        return (
          <Select value={value} onValueChange={(v) => handleFilterChange(filter.key, v)}>
            <SelectTrigger>
              <SelectValue placeholder={filter.placeholder || `Select ${filter.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All {filter.label}</SelectItem>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
          />
        );

      case 'dateRange':
        return (
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              placeholder="From"
              value={filterValues[`${filter.key}From`] || ''}
              onChange={(e) => handleFilterChange(`${filter.key}From`, e.target.value)}
            />
            <Input
              type="date"
              placeholder="To"
              value={filterValues[`${filter.key}To`] || ''}
              onChange={(e) => handleFilterChange(`${filter.key}To`, e.target.value)}
            />
          </div>
        );

      default: // text
        return (
          <div className="relative">
            <IconSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={filter.placeholder || `Search ${filter.label.toLowerCase()}...`}
              value={value}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              className="pl-10"
            />
          </div>
        );
    }
  };

  // Render cell value
  const renderCellValue = (column: Column<T>, row: T) => {
    const keyString = String(column.key);
    const value = keyString.includes('.') 
      ? keyString.split('.').reduce((obj, key) => obj?.[key], row)
      : row[column.key as keyof T];

    if (column.render) {
      return column.render(value, row);
    }

    // Default rendering based on value type
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toLocaleString();
    if (value instanceof Date) {
      return (value as Date).toLocaleDateString();
    }
    return String(value);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>{title}</CardTitle>
              {description && (
                <CardDescription>{description}</CardDescription>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {actions}
              {onRefresh && (
                <Button variant="outline" onClick={onRefresh} disabled={loading}>
                  <IconRefresh className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              )}
              {showFilters && filters.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => setFiltersVisible(!filtersVisible)}
                >
                  <IconFilter className="h-4 w-4 mr-2" />
                  {filtersVisible ? 'Hide' : 'Show'} Filters
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Filters */}
        {showFilters && filters.length > 0 && filtersVisible && (
          <CardContent className="border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filters.map((filter) => (
                <div key={filter.key} className="space-y-2">
                  <Label>{filter.label}</Label>
                  {renderFilterInput(filter)}
                </div>
              ))}
              <div className="flex items-end">
                <Button onClick={resetFilters} variant="outline" className="w-full">
                  Reset Filters
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="p-6">
              <Alert>
                <AlertDescription>{emptyMessage}</AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead 
                        key={String(column.key)} 
                        className={`${column.width || ''} ${column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                        onClick={() => column.sortable && handleSortChange(String(column.key))}
                      >
                        <div className="flex items-center gap-2">
                          {column.title}
                          {column.sortable && (
                            <div className="flex flex-col">
                              <IconArrowUp 
                                className={`h-3 w-3 ${
                                  sortBy === column.key && sortOrder === 'asc' 
                                    ? 'text-primary' 
                                    : 'text-muted-foreground'
                                }`} 
                              />
                              <IconArrowDown 
                                className={`h-3 w-3 -mt-1 ${
                                  sortBy === column.key && sortOrder === 'desc' 
                                    ? 'text-primary' 
                                    : 'text-muted-foreground'
                                }`} 
                              />
                            </div>
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, index) => (
                    <TableRow key={index}>
                      {columns.map((column) => (
                        <TableCell key={String(column.key)}>
                          {renderCellValue(column, row)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile-Responsive Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Row Information and Page Size Selector */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                
                {onLimitChange && (
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Per page:</Label>
                    <Select 
                      value={pagination.limit.toString()} 
                      onValueChange={(value) => onLimitChange(parseInt(value))}
                    >
                      <SelectTrigger className="w-16 sm:w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(isMobile ? [5, 10, 15, 20] : [10, 20, 50, 100]).map((size) => (
                          <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              {/* Pagination Controls */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
                <div className="flex items-center justify-center text-sm font-medium">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onPageChange?.(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <IconChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {(() => {
                      const maxVisiblePages = isMobile ? 3 : 5;
                      const startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
                      const endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
                      
                      const visiblePages = [];
                      for (let i = startPage; i <= endPage; i++) {
                        visiblePages.push(i);
                      }
                      
                      return (
                        <>
                          {/* Show ellipsis at start if needed */}
                          {startPage > 1 && (
                            <div className="flex items-center">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => onPageChange?.(1)}
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
                              variant={pagination.page === pageNum ? "default" : "outline"}
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => onPageChange?.(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          ))}
                          
                          {/* Show ellipsis at end if needed */}
                          {endPage < pagination.totalPages && (
                            <div className="flex items-center">
                              {endPage < pagination.totalPages - 1 && (
                                <div className="px-2 text-muted-foreground">
                                  <IconDots className="h-4 w-4" />
                                </div>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => onPageChange?.(pagination.totalPages)}
                              >
                                {pagination.totalPages}
                              </Button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  
                  <Button 
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onPageChange?.(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    <IconChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
