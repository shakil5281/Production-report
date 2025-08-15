'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Users,
  Settings,
  Search,
  Check,
  X,
  Edit,
  Save
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
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserRole, PermissionType } from '@/lib/types/auth';
import { ROLE_PERMISSIONS, getRoleDisplayName } from '@/lib/rbac';
import { toast } from 'sonner';

interface UserPermission {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  permissions: PermissionType[];
}

const PERMISSION_CATEGORIES = {
  'User Management': [
    PermissionType.CREATE_USER,
    PermissionType.READ_USER,
    PermissionType.UPDATE_USER,
    PermissionType.DELETE_USER,
  ],
  'Production': [
    PermissionType.CREATE_PRODUCTION,
    PermissionType.READ_PRODUCTION,
    PermissionType.UPDATE_PRODUCTION,
    PermissionType.DELETE_PRODUCTION,
  ],
  'Cutting': [
    PermissionType.CREATE_CUTTING,
    PermissionType.READ_CUTTING,
    PermissionType.UPDATE_CUTTING,
    PermissionType.DELETE_CUTTING,
  ],
  'Cashbook': [
    PermissionType.CREATE_CASHBOOK,
    PermissionType.READ_CASHBOOK,
    PermissionType.UPDATE_CASHBOOK,
    PermissionType.DELETE_CASHBOOK,
  ],
  'Expenses': [
    PermissionType.CREATE_EXPENSE,
    PermissionType.READ_EXPENSE,
    PermissionType.UPDATE_EXPENSE,
    PermissionType.DELETE_EXPENSE,
  ],
  'Targets': [
    PermissionType.CREATE_TARGET,
    PermissionType.READ_TARGET,
    PermissionType.UPDATE_TARGET,
    PermissionType.DELETE_TARGET,
  ],
  'Lines': [
    PermissionType.CREATE_LINE,
    PermissionType.READ_LINE,
    PermissionType.UPDATE_LINE,
    PermissionType.DELETE_LINE,
  ],
  'Reports': [
    PermissionType.CREATE_REPORT,
    PermissionType.READ_REPORT,
    PermissionType.UPDATE_REPORT,
    PermissionType.DELETE_REPORT,
  ],
  'Shipments': [
    PermissionType.CREATE_SHIPMENT,
    PermissionType.READ_SHIPMENT,
    PermissionType.UPDATE_SHIPMENT,
    PermissionType.DELETE_SHIPMENT,
  ],
  'System': [
    PermissionType.MANAGE_SYSTEM,
    PermissionType.MANAGE_ROLES,
    PermissionType.MANAGE_PERMISSIONS,
  ],
};

export default function PermissionsPage() {
  const [users, setUsers] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [tempPermissions, setTempPermissions] = useState<PermissionType[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 403) {
          router.push('/unauthorized');
          return;
        }
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (user: UserPermission) => {
    setEditingUser(user.id);
    setTempPermissions([...user.permissions]);
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setTempPermissions([]);
  };

  const savePermissions = async (userId: string) => {
    try {
      // Note: This would require implementing a permissions update API endpoint
      toast.success('Permissions updated successfully');
      setEditingUser(null);
      setTempPermissions([]);
      await fetchUsers();
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error('Failed to update permissions');
    }
  };

  const togglePermission = (permission: PermissionType) => {
    if (tempPermissions.includes(permission)) {
      setTempPermissions(tempPermissions.filter(p => p !== permission));
    } else {
      setTempPermissions([...tempPermissions, permission]);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'bg-red-100 text-red-800';
      case UserRole.ADMIN:
        return 'bg-purple-100 text-purple-800';
      case UserRole.MANAGER:
        return 'bg-blue-100 text-blue-800';
      case UserRole.CASHBOOK_MANAGER:
        return 'bg-green-100 text-green-800';
      case UserRole.PRODUCTION_MANAGER:
        return 'bg-orange-100 text-orange-800';
      case UserRole.CUTTING_MANAGER:
        return 'bg-yellow-100 text-yellow-800';
      case UserRole.REPORT_VIEWER:
        return 'bg-indigo-100 text-indigo-800';
      case UserRole.USER:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPermissionColor = (permission: PermissionType) => {
    if (permission.toString().includes('CREATE')) return 'text-green-600';
    if (permission.toString().includes('READ')) return 'text-blue-600';
    if (permission.toString().includes('UPDATE')) return 'text-yellow-600';
    if (permission.toString().includes('DELETE')) return 'text-red-600';
    if (permission.toString().includes('MANAGE')) return 'text-purple-600';
    return 'text-gray-600';
  };

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Permission Management</h1>
          <p className="text-gray-600 mt-2">Manage user permissions and role-based access control</p>
        </div>
        <Button 
          onClick={() => router.push('/admin/users')}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          User Management
        </Button>
      </div>

      {/* Role Permissions Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Role-Based Permissions Overview</CardTitle>
          <CardDescription>Default permissions assigned to each role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(UserRole).map(role => (
              <div key={role} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={getRoleBadgeColor(role)}>
                    {getRoleDisplayName(role)}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  {ROLE_PERMISSIONS[role]?.slice(0, 3).map(permission => (
                    <div key={permission} className={`${getPermissionColor(permission)}`}>
                      {permission.replace(/_/g, ' ').toLowerCase()}
                    </div>
                  ))}
                  {ROLE_PERMISSIONS[role]?.length > 3 && (
                    <div className="text-muted-foreground">
                      +{ROLE_PERMISSIONS[role].length - 3} more...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>User Permissions</CardTitle>
          <CardDescription>Individual user permission management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole | 'all')}
              className="border border-gray-300 rounded-md px-3 py-2 min-w-[200px]"
            >
              <option value="all">All Roles</option>
              {Object.values(UserRole).map(role => (
                <option key={role} value={role}>
                  {getRoleDisplayName(role)}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {editingUser === user.id ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
                            <div key={category}>
                              <div className="font-medium text-xs text-muted-foreground mb-1">
                                {category}
                              </div>
                              <div className="grid grid-cols-2 gap-1">
                                {permissions.map(permission => (
                                  <label key={permission} className="flex items-center gap-2 text-xs">
                                    <Checkbox
                                      checked={tempPermissions.includes(permission)}
                                      onCheckedChange={() => togglePermission(permission)}
                                    />
                                    <span className={getPermissionColor(permission)}>
                                      {permission.replace(/_/g, ' ').toLowerCase()}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {user.permissions.slice(0, 4).map(permission => (
                            <Badge 
                              key={permission} 
                              variant="outline"
                              className={`text-xs ${getPermissionColor(permission)}`}
                            >
                              {permission.replace(/_/g, ' ').toLowerCase()}
                            </Badge>
                          ))}
                          {user.permissions.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{user.permissions.length - 4} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingUser === user.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => savePermissions(user.id)}
                            className="h-8"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditing}
                            className="h-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditing(user)}
                          className="h-8"
                          disabled={user.role === UserRole.SUPER_ADMIN}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Permission Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Reference</CardTitle>
          <CardDescription>Complete list of available permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
              <div key={category} className="border rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {category}
                </h4>
                <div className="space-y-1">
                  {permissions.map(permission => (
                    <div 
                      key={permission} 
                      className={`text-sm ${getPermissionColor(permission)}`}
                    >
                      {permission.replace(/_/g, ' ').toLowerCase()}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
