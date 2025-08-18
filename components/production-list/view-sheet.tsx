'use client';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { ProductionItem } from './schema';
import { Badge } from '@/components/ui/badge';
import { formatDateRange } from './schema';

function StatusBadge({ status }: { status: ProductionItem['status'] }) {
  const config = {
    RUNNING: { className: 'bg-green-100 text-green-800', label: 'Running' },
    PENDING: { className: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    COMPLETE: { className: 'bg-blue-100 text-blue-800', label: 'Complete' },
    CANCELLED: { className: 'bg-red-100 text-red-800', label: 'Cancelled' },
  }[status];
  return <Badge className={config.className}>{config.label}</Badge>;
}

interface ViewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ProductionItem | null;
}

export function ViewSheet({ open, onOpenChange, item }: ViewSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[600px] max-w-full">
        <SheetHeader>
          <SheetTitle>Production Item Details</SheetTitle>
          <SheetDescription>View detailed information about the production item</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {item && (
            <div className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Program Code</label>
                  <p className="text-lg">{item.programCode}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Style No</label>
                  <p className="text-lg">{item.styleNo}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Buyer</label>
                  <p className="text-lg">{item.buyer}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Item</label>
                  <p className="text-lg">{item.item}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Quantity</label>
                  <p className="text-lg font-semibold text-green-600">{item.totalQty?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Price</label>
                  <p className="text-lg">${Number(item.price).toFixed(2)}</p>
                </div>
              </div>
              
              {/* Quantities Details */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Quantity Breakdown</label>
                <div className="mt-2 space-y-2">
                  {item.quantities && item.quantities.length > 0 ? (
                    item.quantities.map((qty, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{qty.variant}</Badge>
                          <Badge variant="secondary">{qty.color}</Badge>
                        </div>
                        <div className="font-medium">{qty.qty.toLocaleString()}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No quantity details available</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Percentage</label>
                  <p className="text-lg">{Number(item.percentage).toFixed(1)}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1"><StatusBadge status={item.status} /></div>
                </div>
              </div>

            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}