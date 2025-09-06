'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Target, 
  DollarSign, 
  Scissors,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';

interface SummaryCardsProps {
  data: {
    production: any;
    cashbook: any;
    cutting: any;
    overview: any;
  };
}

export function SummaryCards({ data }: SummaryCardsProps) {
  // Debug logging to help identify the issue
  console.log('SummaryCards received data:', data);
  
  // Add safety checks for data structure
  if (!data || typeof data !== 'object') {
    console.error('SummaryCards: Invalid data received', data);
    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">No data available</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  let production, cashbook, cutting, overview;
  
  try {
    ({ 
      production = {}, 
      cashbook = {}, 
      cutting = {}, 
      overview = {} 
    } = data);
  } catch (error) {
    console.error('SummaryCards: Error destructuring data', error, data);
    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">!</div>
              <p className="text-xs text-muted-foreground">Data error</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />;
    return <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {/* Production Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Total Production</CardTitle>
          <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{overview?.totalProduction || 0}</div>
          <p className="text-xs text-muted-foreground">
            Units produced today
          </p>
          {production?.byStage && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Cutting: {production.byStage.cutting?.output || 0}</span>
                <span>Sewing: {production.byStage.sewing?.output || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Finishing: {production.byStage.finishing?.output || 0}</span>
                <span>WIP: {(production.byStage.cutting?.wip || 0) + (production.byStage.sewing?.wip || 0) + (production.byStage.finishing?.wip || 0)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Target Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Target Achievement</CardTitle>
          <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{overview?.targetAchievement || 0}%</div>
          <p className="text-xs text-muted-foreground">
            {overview?.totalProduction || 0} / {overview?.totalTarget || 0} units
          </p>
        </CardContent>
      </Card>

      {/* Cashbook Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Net Cash Flow</CardTitle>
          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-xl sm:text-2xl font-bold ${getTrendColor(overview?.netCashFlow || 0)}`}>
            {(overview?.netCashFlow || 0) > 0 ? '+' : ''}{(overview?.netCashFlow || 0).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            This month
          </p>
          {cashbook?.monthlyTrend && (
            <div className="mt-2 flex items-center gap-2">
              {getTrendIcon(cashbook.monthlyTrend.change)}
              <span className={`text-xs ${getTrendColor(cashbook.monthlyTrend.change)}`}>
                {cashbook.monthlyTrend.change > 0 ? '+' : ''}{cashbook.monthlyTrend.changePercentage}% vs last month
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cutting Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Cutting Efficiency</CardTitle>
          <Scissors className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{overview?.cuttingEfficiency || 0}%</div>
          <p className="text-xs text-muted-foreground">
            {cutting?.totalCuttingOutput || 0} / {cutting?.totalCuttingInput || 0} units
          </p>
          {cutting?.cuttingTrends && (
            <div className="mt-2 flex items-center gap-2">
              {getTrendIcon(cutting.cuttingTrends.change)}
              <span className={`text-xs ${getTrendColor(cutting.cuttingTrends.change)}`}>
                {cutting.cuttingTrends.change > 0 ? '+' : ''}{cutting.cuttingTrends.changePercentage}% vs yesterday
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
