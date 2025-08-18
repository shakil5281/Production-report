'use client';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { ProductionItem, ProductionFormData } from './schema';
import { ProductionForm } from './production-form';
import { ScrollArea } from '../ui/scroll-area';

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
      <SheetContent side="right" className="w-full sm:w-[600px] max-w-full">
        <SheetHeader>
          <SheetTitle>Edit Production Item</SheetTitle>
          <SheetDescription>Update the production item information</SheetDescription>
        </SheetHeader>
        <ScrollArea className='h-[calc(100vh-100px)]'>
          <div className="mt-6">
            <ProductionForm
              mode="edit"
              item={item}
              onSubmit={onSubmit}
              onCancel={onCancel}
            />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}