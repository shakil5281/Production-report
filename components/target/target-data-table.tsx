'use client';

import { useState, useMemo } from 'react';
import {
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { IconChevronLeft, IconChevronRight, IconCalendar, IconTrash } from '@tabler/icons-react';
import { UniversalFilterSheet, FilterField, UniversalFilterState } from '@/components/ui/universal-filter-sheet';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { columns } from './table-columns';
import type { Target } from './schema';
import { useCalendarAutoClose } from '@/hooks/use-calendar-auto-close';
import { LoadingSpinner } from '@/components/ui/loading';
import { SimpleMobilePagination } from '@/components/ui/simple-mobile-pagination';
import { useIsMobile } from '@/hooks/use-mobile';

interface TargetDataTableProps {
  data: Target[];
  selectedDate: Date;
  onDateChange: (date: Date | undefined) => void;
  onView: (item: Target) => void;
  onEdit: (item: Target) => void;
  onDelete: (item: Target) => void;
  onBulkDelete: (targetIds: string[]) => void;
  loading?: boolean;
  error?: string | null;
  // Pagination props
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function TargetDataTable({ 
  data, 
  selectedDate, 
  onDateChange, 
  onView, 
  onEdit, 
  onDelete, 
  onBulkDelete,
  loading = false,
  error = null,
  // Pagination props
  currentPage,
  pageSize,
  totalPages,
  totalRecords,
  hasMore,
  onPageChange,
  onPageSizeChange
}: TargetDataTableProps) {
  const { isCalendarOpen, setIsCalendarOpen } = useCalendarAutoClose();
  const isMobile = useIsMobile();
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  
  // Filter states
  const [filters, setFilters] = useState<UniversalFilterState>({
    lineNo: '',
    styleNo: '',
    inTime: '',
    outTime: '',
    lineTargetMin: '',
    lineTargetMax: '',
    hourlyProductionMin: '',
    hourlyProductionMax: ''
  });
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Filter fields configuration
  const filterFields: FilterField[] = [
    {
      key: 'lineNo',
      label: 'Line No',
      type: 'text',
      placeholder: 'Filter by line number...'
    },
    {
      key: 'styleNo',
      label: 'Style No',
      type: 'text',
      placeholder: 'Filter by style number...'
    },
    {
      key: 'inTime',
      label: 'In Time',
      type: 'text',
      placeholder: 'Filter by in time...'
    },
    {
      key: 'outTime',
      label: 'Out Time',
      type: 'text',
      placeholder: 'Filter by out time...'
    },
    {
      key: 'lineTargetMin',
      label: 'Min Line Target',
      type: 'text',
      placeholder: 'Minimum line target...'
    },
    {
      key: 'lineTargetMax',
      label: 'Max Line Target',
      type: 'text',
      placeholder: 'Maximum line target...'
    },
    {
      key: 'hourlyProductionMin',
      label: 'Min Hourly Production',
      type: 'text',
      placeholder: 'Minimum hourly production...'
    },
    {
      key: 'hourlyProductionMax',
      label: 'Max Hourly Production',
      type: 'text',
      placeholder: 'Maximum hourly production...'
    }
  ];

  // Filter data based on filters
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Text filters
      const matchesLine = !filters.lineNo || item.lineNo.toLowerCase().includes(filters.lineNo.toLowerCase());
      const matchesStyle = !filters.styleNo || item.styleNo.toLowerCase().includes(filters.styleNo.toLowerCase());
      const matchesInTime = !filters.inTime || item.inTime.includes(filters.inTime);
      const matchesOutTime = !filters.outTime || item.outTime.includes(filters.outTime);
      
      // Numeric range filters
      const matchesLineTargetMin = !filters.lineTargetMin || item.lineTarget >= Number(filters.lineTargetMin);
      const matchesLineTargetMax = !filters.lineTargetMax || item.lineTarget <= Number(filters.lineTargetMax);
      const matchesHourlyProductionMin = !filters.hourlyProductionMin || item.hourlyProduction >= Number(filters.hourlyProductionMin);
      const matchesHourlyProductionMax = !filters.hourlyProductionMax || item.hourlyProduction <= Number(filters.hourlyProductionMax);
      
      return matchesLine && matchesStyle && matchesInTime && matchesOutTime && 
             matchesLineTargetMin && matchesLineTargetMax && 
             matchesHourlyProductionMin && matchesHourlyProductionMax;
    });
  }, [data, filters]);

  // Filter handlers
  const handleFiltersChange = (newFilters: UniversalFilterState) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: UniversalFilterState = {
      lineNo: '',
      styleNo: '',
      inTime: '',
      outTime: '',
      lineTargetMin: '',
      lineTargetMax: '',
      hourlyProductionMin: '',
      hourlyProductionMax: ''
    };
    setFilters(clearedFilters);
  };

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
    meta: {
      onView: (item: Target) => onView(item),
      onEdit: (item: Target) => onEdit(item),
      onDelete: (item: Target) => onDelete(item),
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading target data</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-row items-start md:items-center py-4 gap-4 overflow-x-auto">
        <div className="flex items-center gap-2">
          <IconCalendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium hidden md:inline-block">Filter by Date:</span>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full md:w-[200px] justify-start text-left font-normal"
              >
                {selectedDate ? (
                  format(selectedDate, 'PPP')
                ) : (
                  <span className="text-muted-foreground">Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    onDateChange(date);
                    setIsCalendarOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Universal Filter Sheet */}
        <UniversalFilterSheet
          open={filterSheetOpen}
          onOpenChange={setFilterSheetOpen}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          fields={filterFields}
          title="Filter Targets"
          description="Use the filters below to narrow down your targets"
        />
        
        {/* Bulk Delete Button */}
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <IconTrash className="h-4 w-4 mr-2" />
                Delete Selected ({table.getFilteredSelectedRowModel().rows.length})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the selected targets.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    const selectedIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id);
                    onBulkDelete(selectedIds);
                    setRowSelection({});
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile-Responsive Pagination */}
      <SimpleMobilePagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        totalRecords={totalRecords}
        selectedRecords={table.getFilteredSelectedRowModel().rows.length}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={isMobile ? [5, 10, 15, 20] : [5, 10, 20, 50]}
        maxVisiblePages={isMobile ? 3 : 5}
      />
    </div>
  );
}
