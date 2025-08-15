'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Filter,
  Search,
  Calendar,
  User,
  Database,
  Globe,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success' | 'debug';
  category: 'auth' | 'database' | 'api' | 'system' | 'security' | 'user';
  message: string;
  userId?: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  details?: any;
}

// Mock log data
const mockLogs: LogEntry[] = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    level: 'info',
    category: 'auth',
    message: 'User logged in successfully',
    userId: '123',
    userName: 'Super Administrator',
    ipAddress: '192.168.1.1',
    endpoint: '/api/auth/sign-in',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    level: 'error',
    category: 'database',
    message: 'Failed to connect to database',
    details: { error: 'Connection timeout', duration: '30s' },
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    level: 'warning',
    category: 'security',
    message: 'Multiple failed login attempts detected',
    ipAddress: '192.168.1.100',
    details: { attempts: 5, timeframe: '5 minutes' },
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    level: 'success',
    category: 'system',
    message: 'System backup completed successfully',
    details: { size: '15.2 MB', duration: '2.3s' },
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    level: 'info',
    category: 'api',
    message: 'API endpoint called',
    endpoint: '/api/admin/users',
    userId: '123',
    userName: 'Super Administrator',
  },
];

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [loading, setLoading] = useState(false);

  const refreshLogs = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    toast.success('Logs refreshed');
  };

  const exportLogs = () => {
    const filteredLogs = getFilteredLogs();
    const csvContent = [
      'Timestamp,Level,Category,Message,User,IP Address,Endpoint',
      ...filteredLogs.map(log => 
        `"${log.timestamp}","${log.level}","${log.category}","${log.message}","${log.userName || ''}","${log.ipAddress || ''}","${log.endpoint || ''}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Logs exported successfully');
  };

  const getFilteredLogs = () => {
    return logs.filter(log => {
      const matchesSearch = searchTerm === '' || 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.endpoint?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
      const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
      
      // Time range filter
      const logTime = new Date(log.timestamp);
      const now = new Date();
      let timeMatch = true;
      
      switch (selectedTimeRange) {
        case '1h':
          timeMatch = now.getTime() - logTime.getTime() <= 60 * 60 * 1000;
          break;
        case '24h':
          timeMatch = now.getTime() - logTime.getTime() <= 24 * 60 * 60 * 1000;
          break;
        case '7d':
          timeMatch = now.getTime() - logTime.getTime() <= 7 * 24 * 60 * 60 * 1000;
          break;
        case '30d':
          timeMatch = now.getTime() - logTime.getTime() <= 30 * 24 * 60 * 60 * 1000;
          break;
      }
      
      return matchesSearch && matchesLevel && matchesCategory && timeMatch;
    });
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'info':
        return <Info className="w-4 h-4" />;
      case 'debug':
        return <Activity className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-500/10 text-red-700 border-red-200';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'success':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'info':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'debug':
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'auth':
        return <User className="w-4 h-4" />;
      case 'database':
        return <Database className="w-4 h-4" />;
      case 'api':
        return <Globe className="w-4 h-4" />;
      case 'security':
        return <Shield className="w-4 h-4" />;
      case 'system':
        return <Activity className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const filteredLogs = getFilteredLogs();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">System Logs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor system activity, errors, and security events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportLogs}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { level: 'error', count: logs.filter(l => l.level === 'error').length, color: 'text-red-600' },
          { level: 'warning', count: logs.filter(l => l.level === 'warning').length, color: 'text-yellow-600' },
          { level: 'success', count: logs.filter(l => l.level === 'success').length, color: 'text-green-600' },
          { level: 'info', count: logs.filter(l => l.level === 'info').length, color: 'text-blue-600' },
          { level: 'debug', count: logs.filter(l => l.level === 'debug').length, color: 'text-gray-600' },
        ].map(({ level, count, color }) => (
          <Card key={level}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className={color}>
                  {getLevelIcon(level)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground capitalize">{level}</p>
                  <p className="text-xl font-bold">{count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>System Logs ({filteredLogs.length})</CardTitle>
          <CardDescription>Filter and search through system activity logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="database">Database</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger>
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="w-full">
              <Filter className="w-4 h-4 mr-2" />
              Advanced
            </Button>
          </div>

          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="group">
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getLevelColor(log.level)}>
                        <span className="flex items-center gap-1">
                          {getLevelIcon(log.level)}
                          {log.level}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(log.category)}
                        <span className="capitalize">{log.category}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{log.message}</p>
                        {log.endpoint && (
                          <code className="text-xs text-muted-foreground bg-muted px-1 rounded">
                            {log.endpoint}
                          </code>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.userName ? (
                        <div className="text-sm">
                          <p>{log.userName}</p>
                          {log.userId && (
                            <p className="text-xs text-muted-foreground">ID: {log.userId}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">System</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.ipAddress && (
                        <code className="text-xs bg-muted px-1 rounded">
                          {log.ipAddress}
                        </code>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No logs found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
