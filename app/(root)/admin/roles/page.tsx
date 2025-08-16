'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Settings,
  Check,
  X,
  Plus,
  Edit,
  Save,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  UserCheck,
  Lock,
  Unlock,
  Crown,
  Star,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { PERMISSION_CATEGORIES, getPermissionLabel } from '@/lib/permissions';

interface Permission {
  id: string;
  name: string;
  description?: string;
}

interface RoleData {
  name: string;
  displayName: string;
  permissions: Permission[];
  userCount: number;
  users?: any[];
  isSystemRole: boolean;
}

interface RoleEditState {
  role: RoleData | null;
  permissions: string[];
  hasChanges: boolean;
}

export default function RolesManagementPage() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleEditState>({
    role: null,
    permissions: [],
    hasChanges: false,
  });

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/roles', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      } else {
        toast.error('Failed to fetch roles');
      }
    } catch (error) {
      toast.error('Error fetching roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/admin/roles?action=permissions', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAllPermissions(data.permissions || []);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const startEditing = (role: RoleData) => {
    setEditingRole({
      role,
      permissions: role.permissions.map(p => p.name),
      hasChanges: false,
    });
    setIsSheetOpen(true);
  };

  const cancelEditing = () => {
    if (editingRole.hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        setEditingRole({ role: null, permissions: [], hasChanges: false });
        setIsSheetOpen(false);
      }
    } else {
      setEditingRole({ role: null, permissions: [], hasChanges: false });
      setIsSheetOpen(false);
    }
  };

  const togglePermission = (permissionName: string) => {
    setEditingRole(prev => {
      const newPermissions = prev.permissions.includes(permissionName)
        ? prev.permissions.filter(p => p !== permissionName)
        : [...prev.permissions, permissionName];
      
      const originalPermissions = prev.role?.permissions.map(p => p.name) || [];
      const hasChanges = JSON.stringify(newPermissions.sort()) !== JSON.stringify(originalPermissions.sort());
      
      return {
        ...prev,
        permissions: newPermissions,
        hasChanges,
      };
    });
  };

  const selectAllInCategory = (category: string) => {
    const categoryPermissions = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES] || [];
    setEditingRole(prev => {
      const newPermissions = [...new Set([...prev.permissions, ...categoryPermissions.map(p => p as string)])];
      const originalPermissions = prev.role?.permissions.map(p => p.name) || [];
      const hasChanges = JSON.stringify(newPermissions.sort()) !== JSON.stringify(originalPermissions.sort());
      
      return {
        ...prev,
        permissions: newPermissions,
        hasChanges,
      };
    });
  };

  const deselectAllInCategory = (category: string) => {
    const categoryPermissions = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES] || [];
    setEditingRole(prev => {
      const newPermissions = prev.permissions.filter(p => !categoryPermissions.map(cp => cp as string).includes(p));
      const originalPermissions = prev.role?.permissions.map(p => p.name) || [];
      const hasChanges = JSON.stringify(newPermissions.sort()) !== JSON.stringify(originalPermissions.sort());
      
      return {
        ...prev,
        permissions: newPermissions,
        hasChanges,
      };
    });
  };

  const savePermissions = async () => {
    if (!editingRole.role) return;

    try {
      setSaving(true);
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          role: editingRole.role.name,
          permissions: editingRole.permissions,
        }),
      });

      if (response.ok) {
        toast.success('Role permissions updated successfully');
        await fetchRoles();
        setEditingRole({ role: null, permissions: [], hasChanges: false });
        setIsSheetOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update role permissions');
      }
    } catch (error) {
      toast.error('Error updating role permissions');
    } finally {
      setSaving(false);
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'SUPER_ADMIN':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'ADMIN':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'MANAGER':
        return <Star className="w-4 h-4 text-purple-600" />;
      default:
        return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'SUPER_ADMIN':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'ADMIN':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'MANAGER':
        return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'PRODUCTION_MANAGER':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'CASHBOOK_MANAGER':
        return 'bg-orange-500/10 text-orange-700 border-orange-200';
      case 'CUTTING_MANAGER':
        return 'bg-pink-500/10 text-pink-700 border-pink-200';
      case 'REPORT_VIEWER':
        return 'bg-indigo-500/10 text-indigo-700 border-indigo-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const filteredRoles = roles.filter(role =>
    role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPermissionsByCategory = () => {
    const categorized: Record<string, Permission[]> = {};
    
    Object.keys(PERMISSION_CATEGORIES).forEach(category => {
      categorized[category] = allPermissions.filter(permission =>
        PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES].map(p => p as string).includes(permission.name)
      );
    });
    
    return categorized;
  };

  const categorizedPermissions = getPermissionsByCategory();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Role Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage user roles and their permissions dynamically
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchRoles} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Roles</p>
                <p className="text-2xl font-bold">{roles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">
                  {roles.reduce((sum, role) => sum + role.userCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Settings className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Permissions</p>
                <p className="text-2xl font-bold">{allPermissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Crown className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admin Roles</p>
                <p className="text-2xl font-bold">
                  {roles.filter(r => ['SUPER_ADMIN', 'ADMIN'].includes(r.name)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>System Roles ({filteredRoles.length})</CardTitle>
          <CardDescription>Manage permissions for each user role</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Roles Table */}
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur">
                <TableRow>
                  <TableHead className="min-w-[200px]">Role</TableHead>
                  <TableHead className="min-w-[100px]">Users</TableHead>
                  <TableHead className="min-w-[120px]">Permissions</TableHead>
                  <TableHead className="min-w-[300px] hidden lg:table-cell">Key Permissions</TableHead>
                  <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((role) => (
                  <TableRow key={role.name} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getRoleIcon(role.name)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{role.displayName}</span>
                            <Badge className={getRoleColor(role.name)}>
                              {role.name}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">System Role</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{role.userCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {role.permissions.length} permissions
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map((permission) => (
                          <Badge key={permission.id} variant="secondary" className="text-xs">
                            {getPermissionLabel(permission.name as any)}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{role.permissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditing(role)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Role Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={cancelEditing}>
        <SheetContent className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {editingRole.role && getRoleIcon(editingRole.role.name)}
              Edit {editingRole.role?.displayName} Permissions
              {editingRole.hasChanges && (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  Unsaved Changes
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription>
              Manage permissions for the {editingRole.role?.displayName} role. Changes will affect all users with this role.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Role Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {editingRole.role && getRoleIcon(editingRole.role.name)}
                    <div>
                      <h3 className="font-medium">{editingRole.role?.displayName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {editingRole.role?.userCount} users with this role
                      </p>
                    </div>
                  </div>
                  <Badge className={editingRole.role ? getRoleColor(editingRole.role.name) : ''}>
                    {editingRole.permissions.length} permissions
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Permissions by Category */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Permissions by Category</h3>
              
              {Object.entries(categorizedPermissions).map(([category, permissions]) => {
                if (permissions.length === 0) return null;
                
                const allSelected = permissions.every(p => editingRole.permissions.includes(p.name));
                const someSelected = permissions.some(p => editingRole.permissions.includes(p.name));
                
                return (
                  <Card key={category}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={allSelected}
                            ref={(el) => {
                              if (el) {
                                const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement;
                                if (checkbox) checkbox.indeterminate = someSelected && !allSelected;
                              }
                            }}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                selectAllInCategory(category);
                              } else {
                                deselectAllInCategory(category);
                              }
                            }}
                          />
                          <CardTitle className="text-base">{category}</CardTitle>
                          <Badge variant="secondary">
                            {permissions.filter(p => editingRole.permissions.includes(p.name)).length}/{permissions.length}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => selectAllInCategory(category)}
                            className="text-xs h-7"
                          >
                            Select All
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deselectAllInCategory(category)}
                            className="text-xs h-7"
                          >
                            Clear All
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {permissions.map((permission) => {
                          const isChecked = editingRole.permissions.includes(permission.name);
                          return (
                            <div
                              key={permission.id}
                              className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                                isChecked ? 'bg-primary/5 border-primary/20' : 'border-border'
                              }`}
                              onClick={() => togglePermission(permission.name)}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => togglePermission(permission.name)}
                              />
                              <div className="flex-1 min-w-0">
                                <label className="text-sm font-medium cursor-pointer">
                                  {getPermissionLabel(permission.name as any)}
                                </label>
                                <p className="text-xs text-muted-foreground">
                                  {permission.name}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={cancelEditing}>
                Cancel
              </Button>
              <Button 
                onClick={savePermissions} 
                disabled={!editingRole.hasChanges || saving}
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
