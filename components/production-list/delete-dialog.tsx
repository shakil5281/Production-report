'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ProductionItem } from './schema';

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ProductionItem | null;
  onConfirm: () => Promise<void> | void;
}

export function DeleteDialog({ open, onOpenChange, item, onConfirm }: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the production item "{item?.programCode}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={() => onConfirm()}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}