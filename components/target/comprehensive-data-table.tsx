"use client";

import { useMemo, useState } from 'react';
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IconChevronLeft, IconChevronRight, IconFilter } from '@tabler/icons-react';
import type { ComprehensiveTargetData } from './types';

interface ComprehensiveDataTableProps {
  data: ComprehensiveTargetData[];
  timeSlotHeaders: string[];
  timeSlotTotals: Record<string, number>;
}

export function ComprehensiveDataTable({ data, timeSlotHeaders, timeSlotTotals }: ComprehensiveDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const columns = useMemo<ColumnDef<ComprehensiveTargetData>[]>(() => {
    const base: ColumnDef<ComprehensiveTargetData>[] = [
      {
        accessorKey: 'lineNo',
        header: 'Line',
        cell: ({ row }) => (
          <div className="font-semibold">
            {row.original.lineNo}
            {row.original.lineName ? (
              <div className="text-xs text-muted-foreground font-normal">{row.original.lineName}</div>
            ) : null}
          </div>
        ),
        enableHiding: false,
      },
      {
        accessorKey: 'styleNo',
        header: 'Style',
        cell: ({ row }) => <div className="font-medium">{row.original.styleNo}</div>,
        enableHiding: false,
      },
      {
        accessorKey: 'buyer',
        header: 'Buyer',
        cell: ({ row }) => <div>{row.original.buyer}</div>,
        enableHiding: false,
      },
      {
        accessorKey: 'item',
        header: 'Item',
        cell: ({ row }) => <div>{row.original.item}</div>,
        enableHiding: false,
      },
      {
        accessorKey: 'target',
        header: () => <div className="text-center">Target</div>,
        cell: ({ row }) => <div className="text-center font-semibold text-blue-700">{row.original.target.toLocaleString()}</div>,
        enableHiding: false,
      },
      {
        accessorKey: 'hours',
        header: () => <div className="text-center">Hours</div>,
        cell: ({ row }) => <div className="text-center">{row.original.hours}h</div>,
        enableHiding: false,
      },
      {
        accessorKey: 'targets',
        header: () => <div className="text-center">Targets</div>,
        cell: ({ row }) => <div className="text-center font-semibold text-blue-700">{row.original.targets.toLocaleString()}</div>,
        enableHiding: false,
      },
    ];

    const dynamicTimeColumns: ColumnDef<ComprehensiveTargetData>[] = timeSlotHeaders.map((slot) => ({
      id: slot,
      header: () => <div className="text-center">{slot}</div>,
      accessorFn: (row) => row.hourlyProduction[slot] ?? 0,
      cell: ({ row }) => (
        <div className="text-center">{(row.original.hourlyProduction[slot] ?? 0).toLocaleString()}</div>
      ),
      enableHiding: true,
      enableSorting: true,
    }));

    const trailing: ColumnDef<ComprehensiveTargetData>[] = [
      {
        accessorKey: 'totalProduction',
        header: () => <div className="text-center">Total</div>,
        cell: ({ row }) => (
          <div className="text-center font-bold text-green-700">{row.original.totalProduction.toLocaleString()}</div>
        ),
        enableHiding: false,
      },
      {
        accessorKey: 'averageProductionPerHour',
        header: () => <div className="text-center">Avg/Hour</div>,
        cell: ({ row }) => (
          <div className="text-center font-semibold text-green-700">{row.original.averageProductionPerHour.toFixed(0)}</div>
        ),
        enableHiding: false,
      },
    ];

    return [...base, ...dynamicTimeColumns, ...trailing];
  }, [timeSlotHeaders]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const totals = useMemo(() => {
    const sumTarget = data.reduce((sum, row) => sum + row.target, 0);
    const sumHours = data.reduce((sum, row) => sum + row.hours, 0);
    const sumTargets = data.reduce((sum, row) => sum + row.targets, 0);
    const sumTotalProduction = data.reduce((sum, row) => sum + row.totalProduction, 0);
    const avgAvg = data.length > 0
      ? data.reduce((sum, row) => sum + row.averageProductionPerHour, 0) / data.length
      : 0;
    return { sumTarget, sumHours, sumTargets, sumTotalProduction, avgAvg };
  }, [data]);

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <IconFilter className="mr-2 h-4 w-4" /> Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              <>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {/* Totals Row */}
                <TableRow className="bg-muted/50 font-bold">
                  {/* TOTALS label spans the first 4 columns (non-hideable) */}
                  <TableCell colSpan={4}>TOTALS</TableCell>
                  <TableCell className="text-center text-blue-800">{totals.sumTarget.toLocaleString()}</TableCell>
                  <TableCell className="text-center text-blue-800">{totals.sumHours}h</TableCell>
                  <TableCell className="text-center text-blue-800">{totals.sumTargets.toLocaleString()}</TableCell>
                  {timeSlotHeaders.map((slot) => (
                    <TableCell key={slot} className="text-center text-blue-800">
                      {(timeSlotTotals[slot] ?? 0).toLocaleString()}
                    </TableCell>
                  ))}
                  <TableCell className="text-center text-green-800">{totals.sumTotalProduction.toLocaleString()}</TableCell>
                  <TableCell className="text-center text-green-800">{totals.avgAvg.toFixed(0)}</TableCell>
                </TableRow>
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <IconChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}