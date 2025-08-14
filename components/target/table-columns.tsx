'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IconDotsVertical, IconEye, IconEdit, IconTrash } from '@tabler/icons-react';
import type { Target } from './schema';

export const columns: ColumnDef<Target>[] = [
  {
    accessorKey: 'lineNo',
    header: 'Line No',
    cell: ({ row }) => <div className="font-medium">{row.getValue('lineNo')}</div>,
  },
  {
    accessorKey: 'styleNo',
    header: 'Style No',
    cell: ({ row }) => <div className="font-medium">{row.getValue('styleNo')}</div>,
  },
  {
    accessorKey: 'lineTarget',
    header: 'Line Target',
    cell: ({ row }) => <div className="text-left">{Number(row.getValue('lineTarget')).toLocaleString()}</div>,
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => <div>{new Date(row.getValue('date')).toLocaleDateString()}</div>,
  },
  {
    accessorKey: 'inTime',
    header: 'In Time',
    cell: ({ row }) => <div>{row.getValue('inTime')}</div>,
  },
  {
    accessorKey: 'outTime',
    header: 'Out Time',
    cell: ({ row }) => <div>{row.getValue('outTime')}</div>,
  },
  {
    accessorKey: 'hourlyProduction',
    header: 'Hourly Production',
    cell: ({ row }) => <div className="text-left">{Number(row.getValue('hourlyProduction')).toLocaleString()}</div>,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row, table }) => {
      const item = row.original;
      const meta = table.options.meta as {
        onView: (item: Target) => void;
        onEdit: (item: Target) => void;
        onDelete: (item: Target) => void;
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <IconDotsVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => meta.onView(item)}>
              <IconEye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => meta.onEdit(item)}>
              <IconEdit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => meta.onDelete(item)} className="text-red-600">
              <IconTrash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    size: 80,
  },
];
