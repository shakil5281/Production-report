'use client';

import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { ProductionItem } from './schema';
import { formatDateRange } from './schema';
import { RowActions } from './actions';

function StatusBadge({ status }: { status: ProductionItem['status'] }) {
  const config = {
    RUNNING: { className: 'bg-green-100 text-green-800', label: 'Running' },
    PENDING: { className: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    COMPLETE: { className: 'bg-blue-100 text-blue-800', label: 'Complete' },
    CANCELLED: { className: 'bg-red-100 text-red-800', label: 'Cancelled' },
  }[status];
  return <Badge className={config.className}>{config.label}</Badge>;
}

interface ProductionRowProps {
  item: ProductionItem;
  index: number;
  onView: (item: ProductionItem) => void;
  onEdit: (item: ProductionItem) => void;
  onDelete: (item: ProductionItem) => void;
}

export function ProductionRow({ item, index, onView, onEdit, onDelete }: ProductionRowProps) {
  return (
    <TableRow key={item.id}>
      <TableCell className="font-medium">{index + 1}</TableCell>
      <TableCell className="font-medium">{item.programCode}</TableCell>
      <TableCell className="font-medium">{item.styleNo}</TableCell>
      <TableCell>{item.buyer}</TableCell>
      <TableCell>{item.item}</TableCell>
      <TableCell className="text-center font-medium">{item.totalQty?.toLocaleString() || 0}</TableCell>
      <TableCell className="text-right">${Number(item.price).toFixed(2)}</TableCell>
      <TableCell className="text-right">{Number(item.percentage).toFixed(1)}%</TableCell>
      <TableCell>
        <StatusBadge status={item.status} />
      </TableCell>
      <TableCell className="w-24">
        <RowActions item={item} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </TableCell>
    </TableRow>
  );
}