'use client';

import { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProduction } from '@/hooks/use-production';
import type { ProductionItem, ProductionFormData } from './schema';
import { ProductionRow } from './row';
import { EditSheet } from './edit-sheet';
import { ViewSheet } from './view-sheet';
import { DeleteDialog } from './delete-dialog';
import { PaginationControls } from './pagination';

interface ProductionListDataTableProps {
  statusFilter?: 'all' | 'RUNNING' | 'PENDING' | 'COMPLETE' | 'CANCELLED';
}

export function ProductionListDataTable({ statusFilter = 'all' }: ProductionListDataTableProps) {
  const { productionItems, updateProductionItem, deleteProductionItem } = useProduction();
  const [editingItem, setEditingItem] = useState<ProductionItem | null>(null);
  const [viewingItem, setViewingItem] = useState<ProductionItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ProductionItem | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const data = statusFilter === 'all' ? productionItems : productionItems.filter(i => i.status === statusFilter);
    return data;
  }, [productionItems, statusFilter]);

  const total = filtered.length;
  const startIndex = (page - 1) * pageSize;
  const pageItems = filtered.slice(startIndex, startIndex + pageSize);

  const handleEdit = (item: ProductionItem) => { setEditingItem(item); };
  const handleView = (item: ProductionItem) => { setViewingItem(item); };
  const handleDelete = (item: ProductionItem) => { setItemToDelete(item); setDeleteOpen(true); };

  const handleUpdateItem = async (formData: ProductionFormData) => {
    if (editingItem) {
      const success = await updateProductionItem(editingItem.id, formData);
      if (success) {
        setEditingItem(null);
        return true;
      }
    }
    return false;
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      const success = await deleteProductionItem(itemToDelete.id);
      if (success) {
        setDeleteOpen(false);
        setItemToDelete(null);
      }
    }
  };

  return (
    <>
      <ScrollArea className="h-[600px] w-full rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">SL</TableHead>
              <TableHead>Program Code</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((item, idx) => (
              <ProductionRow key={item.id} item={item} index={startIndex + idx} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
            {pageItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-6 text-muted-foreground">No records</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={(p) => setPage(Math.max(1, p))}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
      />

      <EditSheet
        open={!!editingItem}
        onOpenChange={(o) => { if (!o) setEditingItem(null); }}
        item={editingItem}
        onSubmit={handleUpdateItem}
        onCancel={() => setEditingItem(null)}
      />

      <ViewSheet
        open={!!viewingItem}
        onOpenChange={(o) => { if (!o) setViewingItem(null); }}
        item={viewingItem}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={(o) => setDeleteOpen(o)}
        item={itemToDelete}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}