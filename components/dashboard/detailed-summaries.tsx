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
  BarChart3,
  LineChart,
  PieChart
} from 'lucide-react';

interface DetailedSummariesProps {
  data: {
    production: any;
    target: any;
    cashbook: any;
    cutting: any;
  };
}

export function DetailedSummaries({ data }: DetailedSummariesProps) {
  const { production, target, cashbook, cutting } = data;

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 75) return 'text-yellow-600';
    if (efficiency >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Production Summary Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            Production Summary Details
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Detailed breakdown of production by stage and line
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {/* Production by Stage */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Production by Stage</h4>
              {production?.byStage && (
                <div className="space-y-2">
                  {Object.entries(production.byStage).map(([stage, data]: [string, any]) => (
                    <div key={stage} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                      <span className="capitalize font-medium">{stage}</span>
                      <div className="text-right">
                        <div className="font-semibold">{data.output}</div>
                        <div className="text-xs text-gray-500">
                          WIP: {data.wip} | Input: {data.input}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Performing Lines */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Top Performing Lines</h4>
              {production?.byLine?.slice(0, 5).map((line: any, index: number) => (
                <div key={line.lineId} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <div>
                    <div className="font-medium">{line.lineCode}</div>
                    <div className="text-xs text-gray-500">{line.lineName}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${getEfficiencyColor(line.efficiency)}`}>
                      {line.efficiency}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {line.totalOutput} units
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Top Styles */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Top Performing Styles</h4>
              {production?.topStyles?.slice(0, 5).map((style: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <div>
                    <div className="font-medium">{style.styleNumber}</div>
                    <div className="text-xs text-gray-500">{style.buyer}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${getEfficiencyColor(style.efficiency)}`}>
                      {style.efficiency}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {style.totalOutput} units
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target Summary Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Target className="h-4 w-4 sm:h-5 sm:w-5" />
            Target Summary Details
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Target vs actual performance analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* Target vs Actual */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Target vs Actual</h4>
              {target?.targetVsActual && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span className="font-medium text-sm">Target</span>
                    <span className="font-semibold text-blue-600">{target.targetVsActual.totalTarget}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span className="font-medium text-sm">Actual</span>
                    <span className="font-semibold text-green-600">{target.targetVsActual.totalActual}</span>
                  </div>
                  <div className={`flex justify-between items-center p-3 rounded ${
                    target.targetVsActual.variance >= 0 ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <span className="font-medium text-sm">Variance</span>
                    <span className={`font-semibold ${
                      target.targetVsActual.variance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {target.targetVsActual.variance > 0 ? '+' : ''}{target.targetVsActual.variance}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Top Performing Lines */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Top Performing Lines</h4>
              {target?.topPerformingLines?.map((line: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <span className="font-medium">Line {line.lineNo}</span>
                  <div className="text-right">
                    <div className={`font-semibold ${getEfficiencyColor(line.efficiency)}`}>
                      {line.efficiency}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {line.totalProduction} units
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cashbook Summary Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
            Financial Summary Details
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Monthly financial overview and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {/* Monthly Overview */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Monthly Overview</h4>
              {cashbook?.monthlyTrend && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                    <span className="font-medium">Current Month</span>
                    <span className={`font-semibold ${
                      cashbook.monthlyTrend.currentMonth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {cashbook.monthlyTrend.currentMonth >= 0 ? '+' : ''}{cashbook.monthlyTrend.currentMonth.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                    <span className="font-medium">Previous Month</span>
                    <span className={`font-semibold ${
                      cashbook.monthlyTrend.previousMonth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {cashbook.monthlyTrend.previousMonth >= 0 ? '+' : ''}{cashbook.monthlyTrend.previousMonth.toLocaleString()}
                    </span>
                  </div>
                  <div className={`flex justify-between items-center p-2 rounded ${
                    cashbook.monthlyTrend.change >= 0 ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <span className="font-medium text-sm">Change</span>
                    <span className={`font-semibold ${
                      cashbook.monthlyTrend.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {cashbook.monthlyTrend.change > 0 ? '+' : ''}{cashbook.monthlyTrend.changePercentage}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Top Categories */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Top Categories</h4>
              {cashbook?.topCategories?.map((category: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <div>
                    <div className="font-medium">{category.category}</div>
                    <div className="text-xs text-gray-500">{category.type}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{category.totalAmount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">
                      {category.transactionCount} transactions
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Line Performance */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Line Performance</h4>
              {cashbook?.byLine?.slice(0, 5).map((line: any, index: number) => (
                <div key={line.lineId} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <div>
                    <div className="font-medium">{line.lineCode}</div>
                    <div className="text-xs text-gray-500">{line.lineName}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${
                      line.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {line.netAmount >= 0 ? '+' : ''}{line.netAmount.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      D: {line.totalDebits.toLocaleString()} | C: {line.totalCredits.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cutting Summary Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Scissors className="h-4 w-4 sm:h-5 sm:w-5" />
            Cutting Summary Details
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Cutting department performance and efficiency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* Cutting Overview */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Cutting Overview</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <span className="font-medium">Total Input</span>
                  <span className="font-semibold">{cutting?.totalCuttingInput || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <span className="font-medium">Total Output</span>
                  <span className="font-semibold text-green-600">{cutting?.totalCuttingOutput || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <span className="font-medium">WIP</span>
                  <span className="font-semibold text-orange-600">{cutting?.totalCuttingWIP || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <span className="font-medium">Defects</span>
                  <span className="font-semibold text-red-600">{cutting?.totalCuttingDefects || 0}</span>
                </div>
              </div>
            </div>

            {/* Top Performing Lines */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Top Performing Lines</h4>
              {cutting?.topPerformingLines?.map((line: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <span className="font-medium">{line.lineName}</span>
                  <div className="text-right">
                    <div className={`font-semibold ${getEfficiencyColor(line.efficiency)}`}>
                      {line.efficiency}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {line.outputQty} units
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
