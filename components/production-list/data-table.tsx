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
import { LoadingSpinner } from '@/components/ui/loading';

interface ProductionListDataTableProps {
  statusFilter?: 'all' | 'RUNNING' | 'PENDING' | 'COMPLETE' | 'CANCELLED';
}

export function ProductionListDataTable({ statusFilter = 'all' }: ProductionListDataTableProps) {
  const { productionItems, updateProductionItem, deleteProductionItem, loading, error } = useProduction();
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
          <p className="text-red-600 mb-2">Error loading production data</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <ScrollArea className="h-[600px] w-full rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">SL</TableHead>
                <TableHead>Program Code</TableHead>
                <TableHead>Style No</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-center">Total Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead>Status</TableHead>
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
      </div>

      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={(p) => setPage(Math.max(1, p))}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
      />

      {editingItem && (
        <EditSheet
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          item={editingItem}
          onSubmit={handleUpdateItem}
          onCancel={() => setEditingItem(null)}
        />
      )}

      {viewingItem && (
        <ViewSheet
          open={!!viewingItem}
          onOpenChange={(open) => !open && setViewingItem(null)}
          item={viewingItem}
        />
      )}

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleConfirmDelete}
        item={itemToDelete}
      />
    </>
  );
}