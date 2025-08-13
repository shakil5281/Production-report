'use client';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { ProductionItem, ProductionFormData } from './schema';
import { ProductionForm } from '@/components/production-form';

interface EditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ProductionItem | null;
  onSubmit: (data: ProductionFormData) => Promise<boolean>;
  onCancel: () => void;
}

export function EditSheet({ open, onOpenChange, item, onSubmit, onCancel }: EditSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[600px] sm:w-[600px]">
        <SheetHeader>
          <SheetTitle>Edit Production Item</SheetTitle>
          <SheetDescription>Update the production item information</SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <ProductionForm
            mode="edit"
            item={item}
            onSubmit={onSubmit}
            onCancel={onCancel}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}