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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { IconChevronLeft, IconChevronRight, IconCalendar, IconTrash } from '@tabler/icons-react';
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

  const table = useReactTable({
    data,
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
      <div className="flex items-center py-4 gap-4">
        <div className="flex items-center gap-2">
          <IconCalendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter by Date:</span>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[200px] justify-start text-left font-normal"
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
