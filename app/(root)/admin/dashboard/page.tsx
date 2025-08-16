'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Shield,
  Activity,
  Database,
  UserCheck,
  UserX,
  TrendingUp,
  Settings,
  Clock,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserRole } from '@/lib/types/auth';
import { toast } from 'sonner';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  superAdmins: number;
  regularUsers: number;
  recentActivity: ActivityLog[];
}

interface ActivityLog {
  id: string;
  action: string;
  user: string;
  target?: string;
  timestamp: string;
  details: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch users data
      const usersResponse = await fetch('/api/admin/users', {
        credentials: 'include',
      });

      if (!usersResponse.ok) {
        if (usersResponse.status === 403) {
          router.push('/unauthorized');
          return;
        }
        throw new Error('Failed to fetch users');
      }

      const usersData = await usersResponse.json();
      const users = usersData.users;

      // Calculate stats
      const dashboardStats: DashboardStats = {
        totalUsers: users.length,
        activeUsers: users.filter((u: User) => u.isActive).length,
        inactiveUsers: users.filter((u: User) => !u.isActive).length,
        superAdmins: users.filter((u: User) => u.role === UserRole.SUPER_ADMIN).length,
        regularUsers: users.filter((u: User) => u.role === UserRole.USER).length,
        recentActivity: [] // This would come from an audit log API
      };

      setStats(dashboardStats);
      
      // Get recent users (last 10 created)
      const sortedUsers = users
        .sort((a: User, b: User) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
      
      setRecentUsers(sortedUsers);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'bg-red-100 text-red-800';
      case UserRole.USER:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load dashboard data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Comprehensive system management and user oversight</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => router.push('/admin/users')}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Manage Users
          </Button>
          <Button 
            onClick={() => router.push('/admin/settings')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.activeUsers} active, {stats.inactiveUsers} inactive
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% of total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Administrators</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.superAdmins}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Full system access
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.regularUsers}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Business operations access
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Role Distribution</CardTitle>
          <CardDescription>User distribution across different roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-8 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-3xl font-semibold text-red-600">{stats.superAdmins}</div>
              <div className="text-sm text-muted-foreground">Super Admin</div>
              <div className="text-xs text-muted-foreground mt-1">
                Full system & user management
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-semibold text-blue-600">{stats.regularUsers}</div>
              <div className="text-sm text-muted-foreground">User</div>
              <div className="text-xs text-muted-foreground mt-1">
                Business operations only
              </div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">New Simplified Role System</h4>
            <p className="text-sm text-muted-foreground">
              The system now uses a simplified two-role approach: Super Admins have full system access including user management, 
              while Users have access to all business operations but cannot manage users or system settings.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Created Users</CardTitle>
          <CardDescription>Latest users added to the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(user.lastLogin)}
                    </TableCell>
                    <TableCell>
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/admin/users`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used administrative functions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => router.push('/admin/users')}
              className="flex items-center gap-2 h-16"
              variant="outline"
            >
              <Users className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Manage Users</div>
                <div className="text-sm text-muted-foreground">Add, edit, or remove users</div>
              </div>
            </Button>
            
            <Button 
              onClick={() => router.push('/admin/settings')}
              className="flex items-center gap-2 h-16"
              variant="outline"
            >
              <Settings className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">System Settings</div>
                <div className="text-sm text-muted-foreground">Configure system parameters</div>
              </div>
            </Button>
            
            <Button 
              onClick={() => router.push('/production-reports')}
              className="flex items-center gap-2 h-16"
              variant="outline"
            >
              <TrendingUp className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">View Reports</div>
                <div className="text-sm text-muted-foreground">Access all system reports</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
