'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IconDotsVertical, IconEye, IconEdit, IconTrash, IconCircleCheckFilled, IconCircleX, IconLoader } from '@tabler/icons-react';
import type { ProductionItem } from './schema';
import { QuantityCell } from './quantity-cell';

function StatusBadge({ status }: { status: ProductionItem['status'] }) {
  const config = {
    RUNNING: { className: 'bg-gray-100 text-gray-800', label: 'Running' },
    PENDING: { className: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    COMPLETE: { className: 'bg-blue-100 text-blue-800', label: 'Complete' },
    CANCELLED: { className: 'bg-red-100 text-red-800', label: 'Cancelled' },
  }[status];
  const getStatusIcon = () => {
    switch (status) {
      case 'RUNNING':
        return <IconLoader className={config.className} />
      case 'PENDING':
        return <IconCircleX className={config.className} />
      case 'COMPLETE':
        return <IconCircleCheckFilled className={config.className} />
      case 'CANCELLED':
        return <IconCircleX className={config.className} />
      default:
        return <IconLoader className={config.className} />
    }
  };

  return <Badge variant='outline'>
    {getStatusIcon()}
    {config.label}
  </Badge>;
}

export const columns: ColumnDef<ProductionItem>[] = [
  {
    accessorKey: 'programCode',
    header: 'Program Code',
    cell: ({ row }) => <div className="font-medium">{row.getValue('programCode')}</div>,
  },
  {
    accessorKey: 'styleNo',
    header: 'Style No',
    cell: ({ row }) => <div className="font-medium">{row.getValue('styleNo')}</div>,
  },
  {
    accessorKey: 'buyer',
    header: 'Buyer',
    cell: ({ row }) => <div>{row.getValue('buyer')}</div>,
  },
  {
    accessorKey: 'item',
    header: 'Item',
    cell: ({ row }) => <div>{row.getValue('item')}</div>,
  },
  {
    accessorKey: 'quantities',
    header: 'Quantities',
    cell: ({ row }) => {
      const quantities = row.getValue('quantities') as any[];
      const totalQty = row.original.totalQty || 0;
      
      return (
        <QuantityCell 
          quantities={quantities || []} 
          totalQty={totalQty} 
        />
      );
    },
    size: 300,
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => <div className="text-left">${Number(row.getValue('price')).toFixed(2)}</div>,
  },
  {
    accessorKey: 'percentage',
    header: '%',
    cell: ({ row }) => <div className="text-left">{Number(row.getValue('percentage')).toFixed(1)}%</div>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row, table }) => {
      const item = row.original;
      const meta = table.options.meta as {
        onView: (item: ProductionItem) => void;
        onEdit: (item: ProductionItem) => void;
        onDelete: (item: ProductionItem) => void;
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
