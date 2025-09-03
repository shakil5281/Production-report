'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Activity, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  HardDrive,
  Users,
  Building,
  TrendingUp,
  FileText,
  DollarSign,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

interface DatabaseStatus {
  status: {
    connected: boolean;
    message: string;
  };
  statistics: {
    users: number;
    factories: number;
    lines: number;
    styles: number;
    productionList: number;
    targets: number;
    dailyProductionReports: number;
    productionEntries: number;
    expenseCategories: number;
    expenses: number;
    salaryEntries: number;
    cashbookEntries: number;
    dailySalaries: number;
    monthlyExpenses: number;
    monthlyAttendanceReports: number;
    overtimeRecords: number;
    userPermissions: number;
    totalRecords: number;
  };
  timestamp: string;
}

interface CleanupResult {
  success: boolean;
  message: string;
  results: {
    cleaned: number;
    errors: number;
    details: Record<string, any>;
  };
}

export default function DatabaseManagementPage() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [cleanupOptions, setCleanupOptions] = useState({
    type: 'all',
    olderThanDays: 365,
    dryRun: true
  });

  useEffect(() => {
    fetchDatabaseStatus();
  }, []);

  const fetchDatabaseStatus = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/database/status');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStatus(data.data);
        }
      } else {
        toast.error('Failed to fetch database status');
      }
    } catch (error) {
      console.error('Error fetching database status:', error);
      toast.error('Failed to fetch database status');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleCleanup = async () => {
    try {
      setIsCleaning(true);
      setCleanupResult(null);

      const response = await fetch('/api/database/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanupOptions)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Cleanup failed');
      }

      setCleanupResult(result);
      
      if (result.success) {
        toast.success(result.message);
        // Refresh status after cleanup
        fetchDatabaseStatus();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      toast.error(error instanceof Error ? error.message : 'Cleanup failed');
    } finally {
      setIsCleaning(false);
    }
  };

  const getStatusIcon = (connected: boolean) => {
    return connected ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <AlertCircle className="h-5 w-5 text-red-600" />
    );
  };

  const getStatusColor = (connected: boolean) => {
    return connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Database Management</h1>
          <p className="text-muted-foreground">
            Monitor database health, statistics, and perform maintenance operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchDatabaseStatus}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Database className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* Database Status */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Database Status
            </CardTitle>
            <CardDescription>
              Last updated: {new Date(status.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(status.status.connected)}
                <span className="font-medium">Connection Status</span>
              </div>
              <Badge className={getStatusColor(status.status.connected)}>
                {status.status.connected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {status.status.message}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Database Statistics */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.statistics.totalRecords.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across all tables
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.statistics.users}</div>
              <p className="text-xs text-muted-foreground">
                Active user accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Production Data</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(status.statistics.dailyProductionReports + status.statistics.productionEntries).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Production records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Financial Data</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(status.statistics.expenses + status.statistics.cashbookEntries + status.statistics.monthlyExpenses).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Financial records
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Statistics */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Statistics</CardTitle>
            <CardDescription>
              Record counts by table
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Users</span>
                  <Badge variant="secondary">{status.statistics.users}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Factories</span>
                  <Badge variant="secondary">{status.statistics.factories}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Lines</span>
                  <Badge variant="secondary">{status.statistics.lines}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Styles</span>
                  <Badge variant="secondary">{status.statistics.styles}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Production List</span>
                  <Badge variant="secondary">{status.statistics.productionList}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Targets</span>
                  <Badge variant="secondary">{status.statistics.targets}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Daily Reports</span>
                  <Badge variant="secondary">{status.statistics.dailyProductionReports}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Production Entries</span>
                  <Badge variant="secondary">{status.statistics.productionEntries}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Expenses</span>
                  <Badge variant="secondary">{status.statistics.expenses}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Cashbook Entries</span>
                  <Badge variant="secondary">{status.statistics.cashbookEntries}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Monthly Expenses</span>
                  <Badge variant="secondary">{status.statistics.monthlyExpenses}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Daily Salaries</span>
                  <Badge variant="secondary">{status.statistics.dailySalaries}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Database Cleanup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Database Cleanup
          </CardTitle>
          <CardDescription>
            Remove old data, duplicates, and orphaned records to optimize database performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Cleanup Type</Label>
              <Select
                value={cleanupOptions.type}
                onValueChange={(value) => setCleanupOptions(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cleanup</SelectItem>
                  <SelectItem value="old_data">Old Data Only</SelectItem>
                  <SelectItem value="duplicates">Duplicates Only</SelectItem>
                  <SelectItem value="orphaned">Orphaned Records Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Older Than (Days)</Label>
              <Input
                type="number"
                value={cleanupOptions.olderThanDays}
                onChange={(e) => setCleanupOptions(prev => ({ 
                  ...prev, 
                  olderThanDays: parseInt(e.target.value) || 365 
                }))}
                min="1"
                max="3650"
              />
            </div>

            <div className="space-y-2">
              <Label>Mode</Label>
              <Select
                value={cleanupOptions.dryRun ? 'dry' : 'live'}
                onValueChange={(value) => setCleanupOptions(prev => ({ 
                  ...prev, 
                  dryRun: value === 'dry' 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dry">Dry Run (Preview)</SelectItem>
                  <SelectItem value="live">Live Cleanup</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleCleanup}
            disabled={isCleaning}
            variant={cleanupOptions.dryRun ? "outline" : "destructive"}
            className="w-full"
          >
            {isCleaning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Cleaning...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                {cleanupOptions.dryRun ? 'Preview Cleanup' : 'Execute Cleanup'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Cleanup Results */}
      {cleanupResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {cleanupResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Cleanup Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className={cleanupResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription>
                {cleanupResult.message}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Processed: {cleanupResult.results.cleaned}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm">Errors: {cleanupResult.results.errors}</span>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="space-y-2">
              <Label>Cleanup Details</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {Object.entries(cleanupResult.results.details).map(([key, details]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between p-2 border rounded">
                    <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                    {details.error ? (
                      <Badge variant="destructive" className="text-xs">
                        Error: {details.error}
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          Found: {details.found || 0}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Deleted: {details.deleted || 0}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Warning:</strong> Database cleanup operations can permanently delete data. 
          Always backup your database before performing cleanup operations. 
          Use "Dry Run" mode first to preview what will be cleaned.
        </AlertDescription>
      </Alert>
    </div>
  );
}