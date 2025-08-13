'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProductionForm } from './production-form';
import { useProduction } from '@/hooks/use-production';
import { IconEdit, IconTrash, IconEye, IconDotsVertical } from '@tabler/icons-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProductionItem {
  id: string;
  programCode: string;
  buyer: string;
  quantity: number;
  item: string;
  price: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductionFormData {
  programCode: string;
  buyer: string;
  quantity: number;
  item: string;
  price: number;
  status?: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'CANCELLED';
  notes?: string;
}

interface ProductionDataTableProps {
  statusFilter?: 'all' | 'RUNNING' | 'PENDING' | 'COMPLETE' | 'CANCELLED';
}

export function ProductionDataTable({ statusFilter = 'all' }: ProductionDataTableProps) {
  const { productionItems, updateProductionItem, deleteProductionItem } = useProduction();
  const [editingItem, setEditingItem] = useState<ProductionItem | null>(null);
  const [viewingItem, setViewingItem] = useState<ProductionItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ProductionItem | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);

  // Filter data based on status
  const filteredData = statusFilter === 'all' 
    ? productionItems 
    : productionItems.filter(item => item.status === statusFilter);

  const handleEdit = (item: ProductionItem) => {
    setEditingItem(item);
    setEditSheetOpen(true);
  };

  const handleView = (item: ProductionItem) => {
    setViewingItem(item);
    setViewSheetOpen(true);
  };

  const handleDelete = (item: ProductionItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleUpdateItem = async (formData: ProductionFormData) => {
    if (editingItem) {
      try {
        const success = await updateProductionItem(editingItem.id, formData);
        if (success) {
          setEditSheetOpen(false);
          setEditingItem(null);
          return true;
        }
      } catch (error) {
        console.error('Error updating item:', error);
      }
    }
    return false;
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      try {
        console.log('Deleting item:', itemToDelete.id);
        const success = await deleteProductionItem(itemToDelete.id);
        console.log('Delete result:', success);
        if (success) {
          setDeleteDialogOpen(false);
          setItemToDelete(null);
        }
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      RUNNING: { color: 'bg-green-100 text-green-800', label: 'Running' },
      PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      COMPLETE: { color: 'bg-blue-100 text-blue-800', label: 'Complete' },
      CANCELLED: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateRange = (startDate?: string, endDate?: string) => {
    if (!startDate && !endDate) return '-';
    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    if (startDate) return `From: ${formatDate(startDate)}`;
    if (endDate) return `To: ${formatDate(endDate)}`;
    return '-';
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
            {filteredData.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell className="font-medium">{item.programCode}</TableCell>
                <TableCell>{item.buyer}</TableCell>
                <TableCell>{item.item}</TableCell>
                <TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell>
                <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateRange(item.startDate, item.endDate)}
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={item.notes || ''}>
                  {item.notes || '-'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <IconDotsVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(item)}>
                        <IconEye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(item)}>
                        <IconEdit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(item)}
                        className="text-red-600"
                      >
                        <IconTrash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Edit Sheet */}
      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent side="right" className="w-[600px] sm:w-[600px]">
          <SheetHeader>
            <SheetTitle>Edit Production Item</SheetTitle>
            <SheetDescription>
              Update the production item information
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <ProductionForm
              mode="edit"
              item={editingItem}
              onSubmit={handleUpdateItem}
              onCancel={() => {
                setEditSheetOpen(false);
                setEditingItem(null);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* View Sheet */}
      <Sheet open={viewSheetOpen} onOpenChange={setViewSheetOpen}>
        <SheetContent side="right" className="w-[600px] sm:w-[600px]">
          <SheetHeader>
            <SheetTitle>Production Item Details</SheetTitle>
            <SheetDescription>
              View detailed information about the production item
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {viewingItem && (
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Program Code</label>
                    <p className="text-lg">{viewingItem.programCode}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Buyer</label>
                    <p className="text-lg">{viewingItem.buyer}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Item</label>
                    <p className="text-lg">{viewingItem.item}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">{getStatusBadge(viewingItem.status)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                    <p className="text-lg">{viewingItem.quantity.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Price</label>
                    <p className="text-lg">${viewingItem.price.toFixed(2)}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dates</label>
                  <p className="text-lg">{formatDateRange(viewingItem.startDate, viewingItem.endDate)}</p>
                </div>
                {viewingItem.notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Notes</label>
                    <p className="text-lg">{viewingItem.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the production item &quot;{itemToDelete?.programCode}&quot;? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
