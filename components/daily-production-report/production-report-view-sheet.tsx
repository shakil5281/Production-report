'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { IconClipboardList } from '@tabler/icons-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DailyProductionReport } from './types';

interface ProductionReportViewSheetProps {
  report: DailyProductionReport | null;
  lineNo?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductionReportViewSheet({ 
  report, 
  lineNo, 
  open, 
  onOpenChange 
}: ProductionReportViewSheetProps) {
  if (!report) return null;



  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:w-[500px] overflow-y-auto">
        <SheetHeader className="space-y-3">
          <SheetTitle className="flex items-center gap-2">
            <IconClipboardList className="h-5 w-5" />
            Production Report Details
          </SheetTitle>
          <SheetDescription>
            Complete production information for {report.styleNo}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Basic Information */}
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="font-medium">{report.styleNo}</Badge>
                {lineNo && <Badge variant="secondary">Line {lineNo}</Badge>}

              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Buyer</div>
                  <div className="text-sm font-medium">{report.productionList.buyer}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Item</div>
                  <div className="text-sm">{report.productionList.item}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Date</div>
                  <div className="text-sm">{format(new Date(report.date), 'PPP')}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Production Metrics */}
          <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300">
                Production Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                  <div className="text-xs font-medium text-muted-foreground">Target Quantity</div>
                  <div className="text-lg font-bold font-mono text-blue-600">
                    {report.targetQty.toLocaleString()}
                  </div>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                  <div className="text-xs font-medium text-muted-foreground">Production Quantity</div>
                  <div className="text-lg font-bold font-mono text-green-600">
                    {report.productionQty.toLocaleString()}
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex justify-between items-center p-2 bg-white/50 dark:bg-gray-900/50 rounded">
                  <span className="text-xs font-medium text-muted-foreground">Unit Price</span>
                  <span className="font-mono font-medium">${Number(report.unitPrice).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white/50 dark:bg-gray-900/50 rounded">
                  <span className="text-xs font-medium text-muted-foreground">Total Amount (USD)</span>
                  <span className="font-mono font-medium">${Number(report.totalAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-100/50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                  <span className="text-xs font-semibold text-green-700 dark:text-green-300">Net Amount (BDT)</span>
                  <span className="font-mono font-bold text-green-600">{Number(report.netAmount).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Section */}
          {report.notes && (
            <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm bg-white/50 dark:bg-gray-900/50 p-3 rounded border">
                  {report.notes}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
