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

} from '@tabler/icons-react';

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

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </p>
                {onLimitChange && (
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Per page:</Label>
                    <Select 
                      value={pagination.limit.toString()} 
                      onValueChange={(value) => onLimitChange(parseInt(value))}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onPageChange?.(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <IconChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {(() => {
                    const maxVisiblePages = 5;
                    const startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
                    const endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
                    
                    return [...Array(endPage - startPage + 1)].map((_, i) => {
                      const pageNum = startPage + i;
                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => onPageChange?.(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    });
                  })()}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onPageChange?.(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                  <IconChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
