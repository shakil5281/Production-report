'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  IconClipboardList, 
  IconTarget, 
  IconActivity, 
  IconCurrency, 
  IconTrendingUp 
} from '@tabler/icons-react';
import { ProductionSummary } from './types';

interface SummaryCardsProps {
  summary: ProductionSummary | null;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  if (!summary) return null;

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Total Styles</CardTitle>
          <IconClipboardList className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-2xl font-bold">{summary.totalReports || 0}</div>
          <p className="text-xs text-muted-foreground">Total reports</p>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Target Qty</CardTitle>
          <IconTarget className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-2xl font-bold">{(summary.totalTargetQty || 0).toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Total target quantity</p>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Production Qty</CardTitle>
          <IconActivity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-2xl font-bold">{(summary.totalProductionQty || 0).toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Actual production</p>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Total Amount</CardTitle>
          <IconCurrency className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-2xl font-bold">${(summary.totalAmount || 0).toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Total production value</p>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Net Amount</CardTitle>
          <IconCurrency className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-2xl font-bold">{(summary.totalNetAmount || 0).toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Net production value (BDT)</p>
        </CardContent>
      </Card>



      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Active Lines</CardTitle>
          <IconActivity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-2xl font-bold">{summary.linesWithProduction || 0}</div>
          <p className="text-xs text-muted-foreground">Lines with production</p>
        </CardContent>
      </Card>
    </div>
  );
}
