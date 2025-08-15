'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Users,
  Search,
  Edit,
  Save,
  X,
  UserCheck,
  Settings,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
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
  lastLogin?: Date;
  createdAt: Date;
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
  const [editingUser, setEditingUser] = useState<UserPermission | null>(null);
  const [tempPermissions, setTempPermissions] = useState<PermissionType[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
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
    setEditingUser(user);
    setTempPermissions([...user.permissions]);
    setIsSheetOpen(true);
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setTempPermissions([]);
    setIsSheetOpen(false);
  };

  const savePermissions = async () => {
    if (!editingUser) return;
    
    try {
      setSaving(true);
      
      const response = await fetch(`/api/admin/users/${editingUser.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          permissions: tempPermissions
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update permissions');
      }

      await response.json();
      
      // Update the user in the local state
      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? { ...user, permissions: [...tempPermissions] }
          : user
      ));
      
      toast.success('Permissions updated successfully');
      setEditingUser(null);
      setTempPermissions([]);
      setIsSheetOpen(false);
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (permission: PermissionType) => {
    if (tempPermissions.includes(permission)) {
      setTempPermissions(tempPermissions.filter(p => p !== permission));
    } else {
      setTempPermissions([...tempPermissions, permission]);
    }
  };

  const toggleAllCategoryPermissions = (categoryPermissions: PermissionType[]) => {
    const allSelected = categoryPermissions.every(permission => 
      tempPermissions.includes(permission)
    );
    
    if (allSelected) {
      // Remove all category permissions
      setTempPermissions(tempPermissions.filter(p => 
        !categoryPermissions.includes(p)
      ));
    } else {
      // Add all category permissions
      const newPermissions = [...tempPermissions];
      categoryPermissions.forEach(permission => {
        if (!newPermissions.includes(permission)) {
          newPermissions.push(permission);
        }
      });
      setTempPermissions(newPermissions);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'bg-red-500/10 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400';
      case UserRole.ADMIN:
        return 'bg-purple-500/10 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400';
      case UserRole.MANAGER:
        return 'bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400';
      case UserRole.CASHBOOK_MANAGER:
        return 'bg-green-500/10 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400';
      case UserRole.PRODUCTION_MANAGER:
        return 'bg-orange-500/10 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-400';
      case UserRole.CUTTING_MANAGER:
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400';
      case UserRole.REPORT_VIEWER:
        return 'bg-indigo-500/10 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400';
      case UserRole.USER:
        return 'bg-gray-500/10 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400';
    }
  };

  const getPermissionColor = (permission: PermissionType) => {
    if (permission.toString().includes('CREATE')) return 'text-green-600 dark:text-green-400';
    if (permission.toString().includes('READ')) return 'text-blue-600 dark:text-blue-400';
    if (permission.toString().includes('UPDATE')) return 'text-yellow-600 dark:text-yellow-400';
    if (permission.toString().includes('DELETE')) return 'text-red-600 dark:text-red-400';
    if (permission.toString().includes('MANAGE')) return 'text-purple-600 dark:text-purple-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getPermissionIcon = (permission: PermissionType) => {
    if (permission.toString().includes('CREATE')) return <CheckCircle2 className="w-3 h-3" />;
    if (permission.toString().includes('READ')) return <Shield className="w-3 h-3" />;
    if (permission.toString().includes('UPDATE')) return <Edit className="w-3 h-3" />;
    if (permission.toString().includes('DELETE')) return <X className="w-3 h-3" />;
    if (permission.toString().includes('MANAGE')) return <Settings className="w-3 h-3" />;
    return <AlertCircle className="w-3 h-3" />;
  };

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const formatLastLogin = (lastLogin?: Date) => {
    if (!lastLogin) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - new Date(lastLogin).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Permission Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage user permissions and role-based access control</p>
        </div>
        <Button 
          onClick={() => router.push('/admin/users')}
          variant="outline"
          className="flex items-center gap-2 w-fit"
        >
          <Users className="w-4 h-4" />
          User Management
        </Button>
      </div>

      {/* Role Permissions Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Role-Based Permissions Overview
          </CardTitle>
          <CardDescription>Default permissions assigned to each role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(UserRole).map(role => (
              <div key={role} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={getRoleBadgeColor(role)}>
                    {getRoleDisplayName(role)}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  {ROLE_PERMISSIONS[role]?.slice(0, 3).map(permission => (
                    <div key={permission} className={`flex items-center gap-2 ${getPermissionColor(permission)}`}>
                      {getPermissionIcon(permission)}
                      {permission.replace(/_/g, ' ').toLowerCase()}
                    </div>
                  ))}
                  {ROLE_PERMISSIONS[role]?.length > 3 && (
                    <div className="text-muted-foreground flex items-center gap-2">
                      <ChevronRight className="w-3 h-3" />
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
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            User Permissions ({filteredUsers.length} users)
          </CardTitle>
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
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 min-w-[200px] bg-background"
            >
              <option value="all">All Roles</option>
              {Object.values(UserRole).map(role => (
                <option key={role} value={role}>
                  {getRoleDisplayName(role)}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-md border overflow-hidden">
            <ScrollArea className="h-[600px]">
              <div className="min-w-[800px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur">
                    <TableRow>
                      <TableHead className="min-w-[250px]">User</TableHead>
                      <TableHead className="min-w-[150px]">Role</TableHead>
                      <TableHead className="min-w-[120px] hidden sm:table-cell">Status</TableHead>
                      <TableHead className="min-w-[120px] hidden md:table-cell">Last Login</TableHead>
                      <TableHead className="min-w-[300px] hidden lg:table-cell">Permissions</TableHead>
                      <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{user.name}</div>
                            <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                            <div className="sm:hidden text-xs text-muted-foreground mt-1">
                              {formatLastLogin(user.lastLogin)} • {user.permissions.length} permissions
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {getRoleDisplayName(user.role)}
                          </Badge>
                          <Badge 
                            variant={user.isActive ? "default" : "secondary"}
                            className={`sm:hidden ${user.isActive ? "bg-green-500/10 text-green-700 border-green-200" : ""}`}
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge 
                          variant={user.isActive ? "default" : "secondary"}
                          className={user.isActive ? "bg-green-500/10 text-green-700 border-green-200" : ""}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {formatLastLogin(user.lastLogin)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {user.permissions.slice(0, 3).map(permission => (
                            <Badge 
                              key={permission} 
                              variant="outline"
                              className={`text-xs ${getPermissionColor(permission)}`}
                            >
                              {permission.replace(/_/g, ' ').toLowerCase()}
                            </Badge>
                          ))}
                          {user.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{user.permissions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditing(user)}
                          disabled={user.role === UserRole.SUPER_ADMIN}
                          className="h-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No users found matching your search criteria.
                      </TableCell>
                    </TableRow>
                  )}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Edit Permissions Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl"
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                {editingUser?.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-lg font-semibold">{editingUser?.name}</div>
                <div className="text-sm text-muted-foreground">{editingUser?.email}</div>
              </div>
            </SheetTitle>
            <SheetDescription>
              Manage permissions for this user. Changes will be saved to the database.
            </SheetDescription>
          </SheetHeader>

          {editingUser && (
            <div className="space-y-6 mt-6">
              {/* User Info */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge className={getRoleBadgeColor(editingUser.role)}>
                    {getRoleDisplayName(editingUser.role)}
                  </Badge>
                  <Badge variant={editingUser.isActive ? "default" : "secondary"}>
                    {editingUser.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {tempPermissions.length} permissions selected
                </div>
              </div>

              {/* Permission Categories */}
              <ScrollArea className="h-[calc(100vh-280px)] lg:h-[calc(100vh-300px)]">
                <div className="space-y-6 pr-2 lg:pr-4">
                  {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => {
                    const allSelected = permissions.every(permission => 
                      tempPermissions.includes(permission)
                    );

                    return (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-muted-foreground" />
                            <h4 className="font-medium">{category}</h4>
                            <Badge variant="outline" className="text-xs">
                              {permissions.filter(p => tempPermissions.includes(p)).length}/{permissions.length}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleAllCategoryPermissions(permissions)}
                            className="h-8 text-xs"
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                          {permissions.map(permission => (
                            <label 
                              key={permission} 
                              className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                            >
                              <Checkbox
                                checked={tempPermissions.includes(permission)}
                                onCheckedChange={() => togglePermission(permission)}
                              />
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className={getPermissionColor(permission)}>
                                  {getPermissionIcon(permission)}
                                </span>
                                <span className="text-sm truncate">
                                  {permission.replace(/_/g, ' ').toLowerCase()}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                        
                        {category !== 'System' && <Separator className="my-4" />}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Quick Actions for Mobile */}
              <div className="lg:hidden">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Use &quot;Select All&quot; / &quot;Deselect All&quot; buttons in each category for quick changes.
                  </AlertDescription>
                </Alert>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {tempPermissions.length !== editingUser.permissions.length || 
                   !tempPermissions.every(p => editingUser.permissions.includes(p)) ? (
                    <span className="flex items-center gap-1 text-orange-600">
                      <AlertCircle className="h-3 w-3" />
                      You have unsaved changes
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      No changes made
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={cancelEditing}
                    disabled={saving}
                    className="flex-1 sm:flex-none"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={savePermissions}
                    disabled={saving || 
                      (tempPermissions.length === editingUser.permissions.length && 
                       tempPermissions.every(p => editingUser.permissions.includes(p)))}
                    className="flex-1 sm:flex-none"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Permission Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Permission Reference
          </CardTitle>
          <CardDescription>Complete list of available permissions by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
              <div key={category} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {category}
                  <Badge variant="outline" className="text-xs">
                    {permissions.length}
                  </Badge>
                </h4>
                <div className="space-y-2">
                  {permissions.map(permission => (
                    <div 
                      key={permission} 
                      className={`text-sm flex items-center gap-2 ${getPermissionColor(permission)}`}
                    >
                      {getPermissionIcon(permission)}
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