'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IconPlus, IconEdit, IconTrash, IconNavigation, IconCheck, IconX } from '@tabler/icons-react';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
  description: string;
}

interface NavigationPermission {
  id: string;
  roleId: string;
  canAccess: boolean;
  role: Role;
}

interface NavigationItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
  parentId?: string;
  order: number;
  isActive: boolean;
  isPublic: boolean;
  parent?: NavigationItem;
  children?: NavigationItem[];
  navigationPermissions: NavigationPermission[];
}

const iconOptions = [
  'IconDashboard', 'IconApps', 'IconFileText', 'IconTrendingUp', 'IconChartBar',
  'IconCurrencyDollar', 'IconWallet', 'IconScissors', 'IconReport', 'IconSettings',
  'IconUser', 'IconHelp', 'IconBook', 'IconCode', 'IconUsers', 'IconDatabase'
];

export default function NavigationManagementPage() {
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavigationItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    icon: '',
    parentId: '',
    order: 0,
    isActive: true,
    isPublic: false,
    rolePermissions: [] as string[]
  });

  useEffect(() => {
    fetchData();
    fetchRoles();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/navigation');
      if (!response.ok) throw new Error('Failed to fetch navigation items');
      
      const data = await response.json();
      setNavigationItems(data.data || []);
    } catch (error) {
      console.error('Error fetching navigation items:', error);
      toast.error('Failed to load navigation items');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles');
      if (!response.ok) throw new Error('Failed to fetch roles');
      
      const data = await response.json();
      setRoles(data.data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load roles');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      url: '',
      icon: '',
      parentId: '',
      order: 0,
      isActive: true,
      isPublic: false,
      rolePermissions: []
    });
    setEditingItem(null);
  };

  const handleEdit = (item: NavigationItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      url: item.url,
      icon: item.icon || '',
      parentId: item.parentId || '',
      order: item.order,
      isActive: item.isActive,
      isPublic: item.isPublic,
      rolePermissions: item.navigationPermissions
        .filter(p => p.canAccess)
        .map(p => p.roleId)
    });
    setIsSheetOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingItem 
        ? `/api/admin/navigation/${editingItem.id}`
        : '/api/admin/navigation';
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save navigation item');
      }

      toast.success(editingItem ? 'Navigation item updated' : 'Navigation item created');
      setIsSheetOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving navigation item:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save navigation item');
    }
  };

  const handleDelete = async (item: NavigationItem) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) return;
    
    try {
      const response = await fetch(`/api/admin/navigation/${item.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete navigation item');
      }

      toast.success('Navigation item deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting navigation item:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete navigation item');
    }
  };

  const handleRolePermissionChange = (roleId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      rolePermissions: checked
        ? [...prev.rolePermissions, roleId]
        : prev.rolePermissions.filter(id => id !== roleId)
    }));
  };

  const getAllNavigationItems = (items: NavigationItem[]): NavigationItem[] => {
    const result: NavigationItem[] = [];
    
    const addItems = (items: NavigationItem[], level = 0) => {
      items.forEach(item => {
        result.push({ ...item, order: level });
        if (item.children) {
          addItems(item.children, level + 1);
        }
      });
    };
    
    addItems(items);
    return result;
  };

  const flatNavigationItems = getAllNavigationItems(navigationItems);

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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Navigation Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage application navigation and permissions
          </p>
        </div>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button className="w-full sm:w-auto" onClick={resetForm}>
              <IconPlus className="h-4 w-4 mr-2" />
              Add Navigation Item
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[600px] max-w-full overflow-y-auto">
            <SheetHeader>
              <SheetTitle>
                {editingItem ? 'Edit Navigation Item' : 'Add Navigation Item'}
              </SheetTitle>
              <SheetDescription>
                {editingItem 
                  ? 'Update the navigation item details and permissions'
                  : 'Create a new navigation item with roles and permissions'
                }
              </SheetDescription>
            </SheetHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Navigation title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url">URL *</Label>
                  <Input
                    id="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="/path/to/page"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon">Icon</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) => setFormData({ ...formData, icon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select icon" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Icon</SelectItem>
                      {iconOptions.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          {icon}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentId">Parent Item</Label>
                  <Select
                    value={formData.parentId}
                    onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No parent (top level)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No parent (top level)</SelectItem>
                      {flatNavigationItems
                        .filter(item => !item.parentId && item.id !== editingItem?.id)
                        .map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order">Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPublic: !!checked })}
                  />
                  <Label htmlFor="isPublic">Public (accessible to all users)</Label>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Role Permissions</Label>
                <div className="space-y-2">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={formData.rolePermissions.includes(role.id)}
                        onCheckedChange={(checked) => handleRolePermissionChange(role.id, !!checked)}
                      />
                      <Label htmlFor={`role-${role.id}`} className="font-medium">
                        {role.name}
                      </Label>
                      <span className="text-sm text-muted-foreground">({role.description})</span>
                    </div>
                  ))}
                </div>
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
                  {editingItem ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {/* Navigation Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconNavigation className="h-5 w-5" />
            Navigation Items
          </CardTitle>
          <CardDescription>
            {flatNavigationItems.length} navigation items configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Title</TableHead>
                  <TableHead className="text-xs sm:text-sm">URL</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Icon</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden md:table-cell">Parent</TableHead>
                  <TableHead className="text-xs sm:text-sm text-center">Order</TableHead>
                  <TableHead className="text-xs sm:text-sm text-center">Status</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Roles</TableHead>
                  <TableHead className="text-xs sm:text-sm text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flatNavigationItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs sm:text-sm font-medium">
                      <div className={`${item.parentId ? 'ml-4' : ''} flex items-center gap-2`}>
                        {item.parentId && <span className="text-muted-foreground">↳</span>}
                        {item.title}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm font-mono">
                      {item.url}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                      {item.icon || '-'}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                      {item.parent?.title || '-'}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm text-center">
                      {item.order}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col gap-1">
                        <Badge variant={item.isActive ? 'default' : 'secondary'}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {item.isPublic && (
                          <Badge variant="outline" className="text-xs">
                            Public
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {item.navigationPermissions
                          .filter(p => p.canAccess)
                          .map(p => (
                            <Badge key={p.id} variant="outline" className="text-xs">
                              {p.role.name}
                            </Badge>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <IconEdit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <IconTrash className="h-4 w-4" />
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
    </div>
  );
}
