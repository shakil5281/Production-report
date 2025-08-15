'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IconPlus, IconEdit, IconTrash, IconShield, IconCheck, IconX, IconSettings } from '@tabler/icons-react';
import { toast } from 'sonner';

interface Permission {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  permission: Permission;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  rolePermissions: RolePermission[];
}

export default function PermissionManagementPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('permissions');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [permissionForm, setPermissionForm] = useState({
    name: '',
    description: ''
  });
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/permissions');
      if (!response.ok) throw new Error('Failed to fetch permissions');
      
      const data = await response.json();
      setPermissions(data.data.permissions || []);
      setRoles(data.data.roles || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const resetPermissionForm = () => {
    setPermissionForm({
      name: '',
      description: ''
    });
  };

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissionForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create permission');
      }

      toast.success('Permission created successfully');
      setIsSheetOpen(false);
      resetPermissionForm();
      fetchData();
    } catch (error) {
      console.error('Error creating permission:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create permission');
    }
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setRolePermissions(role.rolePermissions.map(rp => rp.permissionId));
    setActiveTab('role-permissions');
  };

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    setRolePermissions(prev => 
      checked 
        ? [...prev, permissionId]
        : prev.filter(id => id !== permissionId)
    );
  };

  const handleUpdateRolePermissions = async () => {
    if (!selectedRole) return;

    try {
      const response = await fetch('/api/admin/role-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: selectedRole.id,
          permissionIds: rolePermissions
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update role permissions');
      }

      toast.success('Role permissions updated successfully');
      fetchData();
    } catch (error) {
      console.error('Error updating role permissions:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update permissions');
    }
  };

  const getPermissionCategory = (permissionName: string) => {
    if (permissionName.includes('USER')) return 'User Management';
    if (permissionName.includes('PRODUCTION')) return 'Production';
    if (permissionName.includes('CASHBOOK')) return 'Cashbook';
    if (permissionName.includes('EXPENSE')) return 'Expenses';
    if (permissionName.includes('TARGET')) return 'Targets';
    if (permissionName.includes('LINE')) return 'Lines';
    if (permissionName.includes('SHIPMENT')) return 'Shipments';
    if (permissionName.includes('CUTTING')) return 'Cutting';
    if (permissionName.includes('REPORT')) return 'Reports';
    if (permissionName.includes('SYSTEM') || permissionName.includes('ROLE') || permissionName.includes('PERMISSION')) return 'System';
    return 'Other';
  };

  const getPermissionsByCategory = () => {
    const categories: Record<string, Permission[]> = {};
    permissions.forEach(permission => {
      const category = getPermissionCategory(permission.name);
      if (!categories[category]) categories[category] = [];
      categories[category].push(permission);
    });
    return categories;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Permission Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage system permissions and role assignments
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="role-permissions">Role Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-6">
          {/* Permissions Management */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">System Permissions</h2>
              <p className="text-sm text-muted-foreground">
                {permissions.length} permissions configured
              </p>
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button className="w-full sm:w-auto" onClick={resetPermissionForm}>
                  <IconPlus className="h-4 w-4 mr-2" />
                  Add Permission
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[400px] max-w-full overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Add New Permission</SheetTitle>
                  <SheetDescription>
                    Create a new system permission
                  </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleCreatePermission} className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="permission-name">Permission Name *</Label>
                    <Input
                      id="permission-name"
                      value={permissionForm.name}
                      onChange={(e) => setPermissionForm({ ...permissionForm, name: e.target.value })}
                      placeholder="e.g., CREATE_REPORT"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="permission-description">Description</Label>
                    <Textarea
                      id="permission-description"
                      value={permissionForm.description}
                      onChange={(e) => setPermissionForm({ ...permissionForm, description: e.target.value })}
                      placeholder="Describe what this permission allows"
                      rows={3}
                    />
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsSheetOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      <IconX className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto">
                      <IconCheck className="h-4 w-4 mr-2" />
                      Create Permission
                    </Button>
                  </div>
                </form>
              </SheetContent>
            </Sheet>
          </div>

          {/* Permissions by Category */}
          <div className="space-y-6">
            {Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconShield className="h-5 w-5" />
                    {category}
                  </CardTitle>
                  <CardDescription>
                    {categoryPermissions.length} permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryPermissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex flex-col gap-2 p-3 border rounded-lg"
                      >
                        <div className="font-medium text-sm">{permission.name}</div>
                        {permission.description && (
                          <div className="text-xs text-muted-foreground">
                            {permission.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="role-permissions" className="space-y-6">
          {/* Role Selection */}
          <div className="grid gap-4 md:grid-cols-3">
            {roles.map((role) => (
              <Card 
                key={role.id}
                className={`cursor-pointer transition-colors ${
                  selectedRole?.id === role.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => handleRoleSelect(role)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{role.name}</span>
                    <Badge variant="outline">
                      {role.rolePermissions.length} permissions
                    </Badge>
                  </CardTitle>
                  {role.description && (
                    <CardDescription>{role.description}</CardDescription>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Role Permission Management */}
          {selectedRole && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Permissions for {selectedRole.name}</span>
                  <Button onClick={handleUpdateRolePermissions}>
                    <IconCheck className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </CardTitle>
                <CardDescription>
                  Select permissions for this role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => (
                    <div key={category} className="space-y-3">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <IconSettings className="h-4 w-4" />
                        {category}
                      </h3>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {categoryPermissions.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`permission-${permission.id}`}
                              checked={rolePermissions.includes(permission.id)}
                              onCheckedChange={(checked) => 
                                handlePermissionToggle(permission.id, !!checked)
                              }
                            />
                            <Label 
                              htmlFor={`permission-${permission.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {permission.name.replace(/_/g, ' ')}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
