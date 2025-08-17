'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Globe,
  Database,
  Shield,
  Activity,
  Settings,
  Users,
  Server,
  Code,
  Eye,
  Play,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface ApiRoute {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  permissions: string[];
  parameters?: string[];
  example?: Record<string, unknown>;
  status: 'active' | 'deprecated' | 'beta';
}

const API_ROUTES: Record<string, ApiRoute[]> = {
  authentication: [
    {
      path: '/api/auth/sign-in',
      method: 'POST',
      description: 'User authentication with email and password',
      permissions: ['PUBLIC'],
      parameters: ['email', 'password'],
      example: { email: 'user@example.com', password: 'password' },
      status: 'active',
    },
    {
      path: '/api/auth/sign-up',
      method: 'POST',
      description: 'User registration',
      permissions: ['PUBLIC'],
      parameters: ['name', 'email', 'password', 'confirmPassword'],
      status: 'active',
    },
    {
      path: '/api/auth/sign-out',
      method: 'POST',
      description: 'User logout',
      permissions: ['AUTHENTICATED'],
      status: 'active',
    },
    {
      path: '/api/auth/me',
      method: 'GET',
      description: 'Get current user information',
      permissions: ['AUTHENTICATED'],
      status: 'active',
    },
  ],
  admin: [
    {
      path: '/api/admin/users',
      method: 'GET',
      description: 'Get all users',
      permissions: ['SUPER_ADMIN'],
      status: 'active',
    },
    {
      path: '/api/admin/users',
      method: 'POST',
      description: 'Create new user',
      permissions: ['SUPER_ADMIN'],
      parameters: ['name', 'email', 'password', 'role'],
      status: 'active',
    },
    {
      path: '/api/admin/users/[id]',
      method: 'GET',
      description: 'Get specific user',
      permissions: ['SUPER_ADMIN'],
      parameters: ['id'],
      status: 'active',
    },
    {
      path: '/api/admin/users/[id]',
      method: 'PUT',
      description: 'Update user information',
      permissions: ['SUPER_ADMIN'],
      parameters: ['id', 'name', 'email', 'role'],
      status: 'active',
    },
    {
      path: '/api/admin/users/[id]/permissions',
      method: 'PUT',
      description: 'Update user permissions',
      permissions: ['SUPER_ADMIN', 'ADMIN'],
      parameters: ['id', 'permissions[]'],
      status: 'active',
    },
    {
      path: '/api/admin/settings',
      method: 'GET',
      description: 'Get system settings',
      permissions: ['SUPER_ADMIN'],
      status: 'active',
    },
    {
      path: '/api/admin/settings',
      method: 'PUT',
      description: 'Update system settings',
      permissions: ['SUPER_ADMIN'],
      status: 'active',
    },
  ],
  production: [
    {
      path: '/api/production',
      method: 'GET',
      description: 'Get all production entries',
      permissions: ['READ_PRODUCTION'],
      status: 'active',
    },
    {
      path: '/api/production',
      method: 'POST',
      description: 'Create production entry',
      permissions: ['CREATE_PRODUCTION'],
      status: 'active',
    },
    {
      path: '/api/production/[id]',
      method: 'GET',
      description: 'Get specific production entry',
      permissions: ['READ_PRODUCTION'],
      status: 'active',
    },
    {
      path: '/api/production/[id]',
      method: 'PUT',
      description: 'Update production entry',
      permissions: ['UPDATE_PRODUCTION'],
      status: 'active',
    },
    {
      path: '/api/production/[id]',
      method: 'DELETE',
      description: 'Delete production entry',
      permissions: ['DELETE_PRODUCTION'],
      status: 'active',
    },
    {
      path: '/api/production/dashboard',
      method: 'GET',
      description: 'Get production dashboard data',
      permissions: ['READ_PRODUCTION'],
      status: 'active',
    },
    {
      path: '/api/production/reports',
      method: 'GET',
      description: 'Generate production reports',
      permissions: ['READ_REPORT'],
      status: 'active',
    },
  ],
  cashbook: [
    {
      path: '/api/cashbook',
      method: 'GET',
      description: 'Get cashbook entries',
      permissions: ['READ_CASHBOOK'],
      status: 'active',
    },
    {
      path: '/api/cashbook',
      method: 'POST',
      description: 'Create cashbook entry',
      permissions: ['CREATE_CASHBOOK'],
      status: 'active',
    },
    {
      path: '/api/cashbook/[id]',
      method: 'PUT',
      description: 'Update cashbook entry',
      permissions: ['UPDATE_CASHBOOK'],
      status: 'active',
    },
    {
      path: '/api/cashbook/[id]',
      method: 'DELETE',
      description: 'Delete cashbook entry',
      permissions: ['DELETE_CASHBOOK'],
      status: 'active',
    },
  ],
  lines: [
    {
      path: '/api/lines',
      method: 'GET',
      description: 'Get all production lines',
      permissions: ['READ_LINE'],
      status: 'active',
    },
    {
      path: '/api/lines',
      method: 'POST',
      description: 'Create production line',
      permissions: ['CREATE_LINE'],
      status: 'active',
    },
    {
      path: '/api/lines/[id]',
      method: 'PUT',
      description: 'Update production line',
      permissions: ['UPDATE_LINE'],
      status: 'active',
    },
  ],
  expenses: [
    {
      path: '/api/expenses',
      method: 'GET',
      description: 'Get expense entries',
      permissions: ['READ_EXPENSE'],
      status: 'active',
    },
    {
      path: '/api/expenses',
      method: 'POST',
      description: 'Create expense entry',
      permissions: ['CREATE_EXPENSE'],
      status: 'active',
    },
  ],
};

export default function ApiRoutesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const router = useRouter();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPath(text);
      setTimeout(() => setCopiedPath(null), 2000);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'POST':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'PUT':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'DELETE':
        return 'bg-red-500/10 text-red-700 border-red-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'deprecated':
        return 'bg-red-500/10 text-red-700 border-red-200';
      case 'beta':
        return 'bg-orange-500/10 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const filteredRoutes = () => {
    let routes: ApiRoute[] = [];
    
    if (selectedCategory === 'all') {
      routes = Object.values(API_ROUTES).flat();
    } else {
      routes = API_ROUTES[selectedCategory] || [];
    }

    if (searchTerm) {
      routes = routes.filter(route =>
        route.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.method.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return routes;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">API Routes Manager</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Comprehensive overview of all system API endpoints and their permissions
          </p>
        </div>
        <Button variant="outline" className="w-fit">
          <Code className="w-4 h-4 mr-2" />
          API Documentation
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Endpoints</p>
                <p className="text-2xl font-bold">{Object.values(API_ROUTES).flat().length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Routes</p>
                <p className="text-2xl font-bold">
                  {Object.values(API_ROUTES).flat().filter(r => r.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Server className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{Object.keys(API_ROUTES).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Protected</p>
                <p className="text-2xl font-bold">
                  {Object.values(API_ROUTES).flat().filter(r => !r.permissions.includes('PUBLIC')).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>API Routes</CardTitle>
          <CardDescription>Browse and manage all system API endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search routes, methods, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-background min-w-[200px]"
            >
              <option value="all">All Categories</option>
              {Object.keys(API_ROUTES).map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Method</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoutes().map((route, index) => (
                  <TableRow key={`${route.method}-${route.path}-${index}`}>
                    <TableCell>
                      <Badge className={getMethodColor(route.method)}>
                        {route.method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {route.path}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(route.path)}
                        >
                          {copiedPath === route.path ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{route.description}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {route.permissions.map(permission => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(route.status)}>
                        {route.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost">
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Play className="w-3 h-3" />
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

      {/* API Testing */}
      <Card>
        <CardHeader>
          <CardTitle>API Testing</CardTitle>
          <CardDescription>Test API endpoints directly from the dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              API testing functionality will be available in the next update. Use external tools like Postman or curl for now.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
