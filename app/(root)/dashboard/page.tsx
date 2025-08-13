'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, TrendingDown, Package, DollarSign, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ProductionSummary {
  totalLines: number;
  totalStyles: number;
  byStatus: {
    running: number;
    pending: number;
    complete: number;
    waiting: number;
  };
}

interface ProductionLine {
  line: {
    id: string;
    name: string;
    code: string;
    factory: {
      name: string;
    };
  };
  styles: Array<{
    id: string;
    styleNumber: string;
    buyer: string;
    status: string;
    orderQty: number;
    dailyProgress: {
      totalOutput: number;
      totalDefects: number;
    };
  }>;
}

interface DashboardData {
  date: string;
  summary: ProductionSummary;
  lines: ProductionLine[];
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/production/dashboard?date=${selectedDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'complete':
        return 'bg-blue-100 text-blue-800';
      case 'waiting':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = (output: number, orderQty: number) => {
    return Math.round((output / orderQty) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchDashboardData} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of production status across all lines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lines</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.summary.totalLines}</div>
            <p className="text-xs text-muted-foreground">
              Active production lines
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Styles</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.summary.totalStyles}</div>
            <p className="text-xs text-muted-foreground">
              Active styles in production
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardData.summary.byStatus.running}
            </div>
            <p className="text-xs text-muted-foreground">
              Styles currently in production
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complete</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboardData.summary.byStatus.complete}
            </div>
            <p className="text-xs text-muted-foreground">
              Finished styles today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Production Lines */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Production Lines</h2>
        {dashboardData.lines.map((line) => (
          <Card key={line.line.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {line.line.name} ({line.line.code}) - {line.line.factory.name}
                </span>
                <Badge variant="outline">
                  {line.styles.length} Style{line.styles.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {line.styles.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No styles assigned to this line
                </p>
              ) : (
                <div className="space-y-3">
                  {line.styles.map((style) => (
                    <div
                      key={style.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{style.styleNumber}</h4>
                          <Badge className={getStatusColor(style.status)}>
                            {style.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {style.buyer} • Order: {style.orderQty}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          {style.dailyProgress.totalOutput}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {getProgressPercentage(
                            style.dailyProgress.totalOutput,
                            style.orderQty
                          )}% complete
                        </div>
                        {style.dailyProgress.totalDefects > 0 && (
                          <div className="text-xs text-red-600">
                            {style.dailyProgress.totalDefects} defects
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
