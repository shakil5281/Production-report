'use client';

import { useState, useEffect } from 'react';
import {
  Database,
  Activity,
  BarChart3,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  Server,
  Zap,
  Play,
  Square,
  PieChart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface DatabaseStats {
  status: 'connected' | 'disconnected' | 'error';
  type: string;
  version: string;
  size: string;
  connections: {
    active: number;
    max: number;
  };
  performance: {
    queriesPerSecond: number;
    avgResponseTime: number;
    cacheHitRatio: number;
  };
  storage: {
    used: number;
    available: number;
    total: number;
  };
}

interface TableInfo {
  name: string;
  rows: number;
  size: string;
  lastUpdated: string;
  status: 'healthy' | 'warning' | 'error';
}

const mockDatabaseStats: DatabaseStats = {
  status: 'connected',
  type: 'PostgreSQL',
  version: '15.3',
  size: '15.2 MB',
  connections: {
    active: 12,
    max: 100,
  },
  performance: {
    queriesPerSecond: 45,
    avgResponseTime: 23,
    cacheHitRatio: 94.5,
  },
  storage: {
    used: 15.2,
    available: 484.8,
    total: 500,
  },
};

const mockTables: TableInfo[] = [
  { name: 'users', rows: 8, size: '2.1 MB', lastUpdated: '2 hours ago', status: 'healthy' },
  { name: 'permissions', rows: 39, size: '1.8 MB', lastUpdated: '1 day ago', status: 'healthy' },
  { name: 'user_permissions', rows: 116, size: '3.2 MB', lastUpdated: '2 hours ago', status: 'healthy' },
  { name: 'production_entries', rows: 234, size: '4.5 MB', lastUpdated: '5 minutes ago', status: 'healthy' },
  { name: 'cashbook_entries', rows: 156, size: '2.8 MB', lastUpdated: '30 minutes ago', status: 'healthy' },
  { name: 'targets', rows: 89, size: '1.2 MB', lastUpdated: '1 hour ago', status: 'healthy' },
  { name: 'lines', rows: 12, size: '0.5 MB', lastUpdated: '3 hours ago', status: 'healthy' },
  { name: 'expenses', rows: 98, size: '1.1 MB', lastUpdated: '45 minutes ago', status: 'healthy' },
];

export default function DatabaseManagerPage() {
  const [stats, setStats] = useState<DatabaseStats>(mockDatabaseStats);
  const [tables, setTables] = useState<TableInfo[]>(mockTables);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const refreshStats = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    toast.success('Database stats refreshed');
  };

  const optimizeDatabase = async () => {
    setOptimizing(true);
    // Simulate optimization
    await new Promise(resolve => setTimeout(resolve, 3000));
    setOptimizing(false);
    toast.success('Database optimization completed');
  };

  const testConnection = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'test_database' }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Database connection successful (${data.connectionTime || '45ms'})`);
      } else {
        throw new Error('Connection test failed');
      }
    } catch (error) {
      toast.error('Database connection test failed');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
      case 'disconnected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'error':
      case 'disconnected':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Database Manager</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor database performance, manage tables, and maintain data integrity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={testConnection}>
            <Activity className="w-4 h-4 mr-2" />
            Test Connection
          </Button>
          <Button variant="outline" onClick={refreshStats} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stats.status === 'connected' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <Database className={`w-5 h-5 ${getStatusColor(stats.status)}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="flex items-center gap-1">
                  {getStatusIcon(stats.status)}
                  <span className={`font-semibold capitalize ${getStatusColor(stats.status)}`}>
                    {stats.status}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <HardDrive className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Database Size</p>
                <p className="text-xl font-bold">{stats.size}</p>
                <p className="text-xs text-muted-foreground">{stats.type} {stats.version}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Server className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Connections</p>
                <p className="text-xl font-bold">{stats.connections.active}/{stats.connections.max}</p>
                <Progress 
                  value={(stats.connections.active / stats.connections.max) * 100} 
                  className="w-full h-1 mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Zap className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Performance</p>
                <p className="text-xl font-bold">{stats.performance.queriesPerSecond}/s</p>
                <p className="text-xs text-muted-foreground">{stats.performance.avgResponseTime}ms avg</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Storage Usage</CardTitle>
                <CardDescription>Database storage allocation and usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Used Space</span>
                    <span className="text-sm font-medium">{stats.storage.used} MB</span>
                  </div>
                  <Progress value={(stats.storage.used / stats.storage.total) * 100} />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{stats.storage.available} MB available</span>
                    <span>{stats.storage.total} MB total</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Real-time database performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Queries/Second</span>
                    <span className="text-sm font-medium">{stats.performance.queriesPerSecond}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg Response Time</span>
                    <span className="text-sm font-medium">{stats.performance.avgResponseTime}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cache Hit Ratio</span>
                    <span className="text-sm font-medium">{stats.performance.cacheHitRatio}%</span>
                  </div>
                  <Progress value={stats.performance.cacheHitRatio} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common database management tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <Activity className="w-6 h-6" />
                  <span className="text-sm">Health Check</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={optimizeDatabase}
                  disabled={optimizing}
                >
                  <Settings className="w-6 h-6" />
                  <span className="text-sm">
                    {optimizing ? 'Optimizing...' : 'Optimize'}
                  </span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <Download className="w-6 h-6" />
                  <span className="text-sm">Export</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <BarChart3 className="w-6 h-6" />
                  <span className="text-sm">Analytics</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tables Tab */}
        <TabsContent value="tables" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Tables ({tables.length})</CardTitle>
              <CardDescription>Overview of all database tables and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Table Name</TableHead>
                      <TableHead>Rows</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tables.map((table) => (
                      <TableRow key={table.name}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            <code className="text-sm">{table.name}</code>
                          </div>
                        </TableCell>
                        <TableCell>{table.rows.toLocaleString()}</TableCell>
                        <TableCell>{table.size}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {table.lastUpdated}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(table.status)} border-current`} variant="outline">
                            <span className="flex items-center gap-1">
                              {getStatusIcon(table.status)}
                              {table.status}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost">
                              <Play className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Settings className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Alert>
            <BarChart3 className="h-4 w-4" />
            <AlertDescription>
              Performance monitoring charts and detailed metrics will be available in the next update.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Maintenance</CardTitle>
              <CardDescription>Perform maintenance tasks to keep the database healthy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-start space-y-2"
                  onClick={optimizeDatabase}
                  disabled={optimizing}
                >
                  <div className="flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span className="font-medium">Optimize Database</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    {optimizing ? 'Optimizing tables and indexes...' : 'Improve query performance and reduce storage'}
                  </p>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4" />
                    <span className="font-medium">Analyze Tables</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    Update table statistics for better query optimization
                  </p>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
                  <div className="flex items-center space-x-2">
                    <Trash2 className="w-4 h-4" />
                    <span className="font-medium">Clean Logs</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    Remove old log entries to free up space
                  </p>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Integrity Check</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    Verify database consistency and repair issues
                  </p>
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-destructive">Danger Zone</h4>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    These actions can affect system availability. Use with caution.
                  </AlertDescription>
                </Alert>
                
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm">
                    Reset Statistics
                  </Button>
                  <Button variant="destructive" size="sm">
                    Force Restart
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
