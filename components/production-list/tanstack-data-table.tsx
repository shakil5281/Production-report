'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight, IconFilter, IconSearch } from '@tabler/icons-react';
import { columns } from './table-columns';
import type { ProductionItem } from './schema';
import { QuantityCell } from './quantity-cell';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileResponsivePagination } from '@/components/ui/mobile-responsive-pagination';


interface ProductionListTanStackDataTableProps {
  data: ProductionItem[];
  statusFilter?: 'all' | 'RUNNING' | 'PENDING' | 'COMPLETE' | 'CANCELLED';
  onView: (item: ProductionItem) => void;
  onEdit: (item: ProductionItem) => void;
  onDelete: (item: ProductionItem) => void;
}





export function ProductionListTanStackDataTable({ data, statusFilter = 'all', onView, onEdit, onDelete }: ProductionListTanStackDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');
  const isMobile = useIsMobile();

  // Mobile-optimized column visibility - show only essential columns
  useEffect(() => {
    if (isMobile) {
      setColumnVisibility({
        programCode: false,
        buyer: false,
        item: false,
        price: false,
        percentage: false,
        status: false,
        // Keep: styleNo, quantities (total), actions
      });
    } else {
      setColumnVisibility({});
    }
  }, [isMobile]);

  // Filter data based on status
  const filteredData = useMemo(() => {
    if (statusFilter === 'all') return data;
    return data.filter(item => item.status === statusFilter);
  }, [data, statusFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    meta: {
      onView: (item: ProductionItem) => onView(item),
      onEdit: (item: ProductionItem) => onEdit(item),
      onDelete: (item: ProductionItem) => onDelete(item),
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });



  return (
    <div className="w-full space-y-4">
      {/* Mobile-Responsive Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:space-x-2">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search all columns..."
              value={globalFilter ?? ''}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-9 h-9 bg-background border-border/50 focus:border-primary"
            />
          </div>
          {!isMobile && (
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Filter program code..."
                value={(table.getColumn('programCode')?.getFilterValue() as string) ?? ''}
                onChange={(event) =>
                  table.getColumn('programCode')?.setFilterValue(event.target.value)
                }
                className="h-9 w-32 sm:w-40 bg-background border-border/50 focus:border-primary"
              />
            </div>
          )}
        </div>
        

      </div>

      {/* Responsive Table Layout */}
      <div className="rounded-lg border border-border/50 bg-card shadow-sm">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader className="bg-muted/30">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-border/50 hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead 
                        key={header.id} 
                        className={`${isMobile ? 'h-10 px-2 text-xs' : 'h-12 px-4'} text-left align-middle font-semibold text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]`}
                      >
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
                    className="border-border/50 transition-colors hover:bg-muted/25 data-[state=selected]:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell 
                        key={cell.id}
                        className={`${isMobile ? 'px-2 py-2 text-xs' : 'px-4 py-3'} align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]`}
                      >
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
                    className={`${isMobile ? 'h-24' : 'h-32'} text-center text-muted-foreground`}
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <IconFilter className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-muted-foreground/50`} />
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'}`}>No production items found</p>
                      <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground/80`}>
                        Try adjusting your search or filter criteria
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Mobile-Responsive Pagination */}
      <MobileResponsivePagination
        pageIndex={table.getState().pagination.pageIndex}
        pageSize={table.getState().pagination.pageSize}
        pageCount={table.getPageCount()}
        totalRows={filteredData.length}
        filteredRows={table.getFilteredRowModel().rows.length}
        selectedRows={table.getFilteredSelectedRowModel().rows.length}
        onPageChange={(page) => table.setPageIndex(page)}
        onPageSizeChange={(size) => table.setPageSize(size)}
        pageSizeOptions={isMobile ? [5, 10, 15, 20] : [10, 20, 30, 40, 50]}
        maxVisiblePages={isMobile ? 3 : 5}
      />
    </div>
  );
}
