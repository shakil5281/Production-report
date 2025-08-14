'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { IconDotsVertical, IconEye, IconEdit, IconTrash } from '@tabler/icons-react';
import type { Line } from './schema';

export const columns: ColumnDef<Line>[] = [
  {
    accessorKey: 'code',
    header: 'Line Code',
    cell: ({ row }) => <div className="font-medium">{row.getValue('code')}</div>,
  },
  {
    accessorKey: 'name',
    header: 'Line Name',
    cell: ({ row }) => <div>{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean;
      return (
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      );
    },
  },
  {
    accessorKey: '_count.styleAssignments',
    header: 'Style Assignments',
    cell: ({ row }) => {
      const count = row.original._count?.styleAssignments || 0;
      return <div className="text-center">{count}</div>;
    },
  },
  {
    accessorKey: '_count.productionEntries',
    header: 'Production Entries',
    cell: ({ row }) => {
      const count = row.original._count?.productionEntries || 0;
      return <div className="text-center">{count}</div>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => <div>{new Date(row.getValue('createdAt')).toLocaleDateString()}</div>,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row, table }) => {
      const item = row.original;
      const meta = table.options.meta as {
        onView: (item: Line) => void;
        onEdit: (item: Line) => void;
        onDelete: (item: Line) => void;
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
