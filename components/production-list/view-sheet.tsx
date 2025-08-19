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
      <SheetContent side="right" className="w-full sm:w-[500px] max-w-full overflow-y-auto">
        <SheetHeader className="space-y-2 pb-4 border-b">
          <SheetTitle className="text-xl font-bold">Production Item Details</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Complete information about production item
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6 space-y-6">
          {item && (
            <>
              {/* Basic Information Card */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-base mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center py-2 border-b border-muted">
                    <span className="text-sm font-medium text-muted-foreground">Program Code</span>
                    <span className="font-medium">{item.programCode}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-muted">
                    <span className="text-sm font-medium text-muted-foreground">Style No</span>
                    <span className="font-medium text-primary">{item.styleNo}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-muted">
                    <span className="text-sm font-medium text-muted-foreground">Buyer</span>
                    <span className="font-medium">{item.buyer}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-muted">
                    <span className="text-sm font-medium text-muted-foreground">Item</span>
                    <span className="font-medium">{item.item}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-muted-foreground">Status</span>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              </div>

              {/* Financial Information Card */}
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-base mb-3 text-blue-700 dark:text-blue-300">Financial Information</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center py-2 border-b border-blue-200 dark:border-blue-800">
                    <span className="text-sm font-medium text-muted-foreground">Unit Price</span>
                    <span className="font-bold text-lg text-green-600">${Number(item.price).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-blue-200 dark:border-blue-800">
                    <span className="text-sm font-medium text-muted-foreground">Percentage</span>
                    <span className="font-semibold text-blue-600">{Number(item.percentage).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-muted-foreground">Total Quantity</span>
                    <span className="font-bold text-lg text-primary">{item.totalQty?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>
              
              {/* Quantity Breakdown Card */}
              <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-base mb-3 text-green-700 dark:text-green-300">Quantity Breakdown</h3>
                <div className="space-y-3">
                  {item.quantities && item.quantities.length > 0 ? (
                    item.quantities.map((qty, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {qty.variant}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {qty.color}
                            </Badge>
                          </div>
                          <div className="font-bold text-right text-primary">
                            {qty.qty.toLocaleString()} pcs
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground bg-white dark:bg-gray-800 rounded-lg border border-dashed">
                      <p className="text-sm">No quantity details available</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}