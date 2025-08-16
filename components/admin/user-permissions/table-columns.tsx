'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IconDotsVertical, IconEdit, IconEye, IconShield, IconUser, IconCircleCheck, IconCircleX } from '@tabler/icons-react';
import { UserRole } from '@prisma/client';
import type { UserPermissionData } from './schema';
import { formatLastLogin, getRoleDisplayName, getRoleBadgeColor, getPermissionColor } from './schema';

function UserAvatar({ name }: { name: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge 
      variant={isActive ? "default" : "secondary"}
      className={isActive ? "bg-green-500/10 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400" : ""}
    >
      {isActive ? (
        <>
          <IconCircleCheck className="w-3 h-3 mr-1" />
          Active
        </>
      ) : (
        <>
          <IconCircleX className="w-3 h-3 mr-1" />
          Inactive
        </>
      )}
    </Badge>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return <IconShield className="w-3 h-3 mr-1" />;
      case UserRole.USER:
        return <IconUser className="w-3 h-3 mr-1" />;
      default:
        return <IconUser className="w-3 h-3 mr-1" />;
    }
  };

  return (
    <Badge className={getRoleBadgeColor(role)}>
      {getRoleIcon(role)}
      {getRoleDisplayName(role)}
    </Badge>
  );
}

function PermissionsBadges({ permissions }: { permissions: string[] }) {
  const displayCount = 3;
  const visiblePermissions = permissions.slice(0, displayCount);
  const remainingCount = permissions.length - displayCount;

  return (
    <div className="flex flex-wrap gap-1 max-w-md">
      {visiblePermissions.map(permission => (
        <Badge 
          key={permission} 
          variant="outline"
          className={`text-xs ${getPermissionColor(permission as any)}`}
        >
          {permission.replace(/_/g, ' ').toLowerCase()}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
}

export const columns: ColumnDef<UserPermissionData>[] = [
  {
    accessorKey: 'name',
    header: 'User',
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3 min-w-[200px]">
          <UserAvatar name={user.name} />
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{user.name}</div>
            <div className="text-sm text-muted-foreground truncate">{user.email}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => <RoleBadge role={row.getValue('role')} />,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => <StatusBadge isActive={row.getValue('isActive')} />,
    filterFn: (row, id, value) => {
      const isActive = row.getValue(id) as boolean;
      return value === 'all' || (value === 'active' && isActive) || (value === 'inactive' && !isActive);
    },
  },
  {
    accessorKey: 'lastLogin',
    header: 'Last Login',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatLastLogin(row.getValue('lastLogin'))}
      </span>
    ),
  },
  {
    accessorKey: 'permissions',
    header: 'Permissions',
    cell: ({ row }) => <PermissionsBadges permissions={row.getValue('permissions')} />,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row, table }) => {
      const user = row.original;
      const meta = table.options.meta as {
        onView: (user: UserPermissionData) => void;
        onEdit: (user: UserPermissionData) => void;
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <IconDotsVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => meta.onView(user)}>
              <IconEye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => meta.onEdit(user)}
              disabled={user.role === UserRole.SUPER_ADMIN}
            >
              <IconEdit className="mr-2 h-4 w-4" />
              Edit Permissions
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    size: 80,
  },
];
