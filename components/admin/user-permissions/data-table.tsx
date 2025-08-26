'use client';

import { useState, useMemo } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuCheckboxItem, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IconChevronDown, IconChevronLeft, IconChevronRight, IconFilter, IconSearch, IconUsersGroup } from '@tabler/icons-react';
import { UserRole } from '@prisma/client';
import { columns } from './table-columns';
import { getRoleDisplayName } from './schema';
import type { UserPermissionData } from './schema';
import { MobileResponsivePagination } from '@/components/ui/mobile-responsive-pagination';
import { useIsMobile } from '@/hooks/use-mobile';

interface UserPermissionsDataTableProps {
  data: UserPermissionData[];
  loading?: boolean;
  roleFilter?: UserRole | 'all';
  statusFilter?: 'all' | 'active' | 'inactive';
  onView: (user: UserPermissionData) => void;
  onEdit: (user: UserPermissionData) => void;
  onRoleFilterChange?: (role: UserRole | 'all') => void;
  onStatusFilterChange?: (status: 'all' | 'active' | 'inactive') => void;
}

export function UserPermissionsDataTable({ 
  data, 
  loading = false,
  roleFilter = 'all',
  statusFilter = 'all',
  onView, 
  onEdit,
  onRoleFilterChange,
  onStatusFilterChange
}: UserPermissionsDataTableProps) {
  const isMobile = useIsMobile();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');

  // Filter data based on role and status
  const filteredData = useMemo(() => {
    let filtered = data;
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.isActive : !user.isActive
      );
    }
    
    return filtered;
  }, [data, roleFilter, statusFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const user = row.original;
      const searchString = `${user.name} ${user.email} ${user.role}`.toLowerCase();
      return searchString.includes(filterValue.toLowerCase());
    },
    meta: {
      onView: (user: UserPermissionData) => onView(user),
      onEdit: (user: UserPermissionData) => onEdit(user),
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Global Search */}
        <div className="flex-1">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by name, email, or role..."
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Role Filter */}
        <Select value={roleFilter} onValueChange={(value) => onRoleFilterChange?.(value as UserRole | 'all')}>
          <SelectTrigger className="min-w-[160px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {Object.values(UserRole).map(role => (
              <SelectItem key={role} value={role}>
                {getRoleDisplayName(role)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange?.(value as 'all' | 'active' | 'inactive')}>
          <SelectTrigger className="min-w-[120px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Column Visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <IconFilter className="mr-2 h-4 w-4" />
              Columns
              <IconChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id === 'isActive' ? 'Status' : column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Results Summary */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <IconUsersGroup className="w-4 h-4" />
        <span>
          Showing {table.getFilteredRowModel().rows.length} of {data.length} users
          {roleFilter !== 'all' && ` with role ${getRoleDisplayName(roleFilter)}`}
          {statusFilter !== 'all' && ` (${statusFilter})`}
        </span>
      </div>

      {/* Data Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <IconUsersGroup className="w-8 h-8" />
                    <p>No users found matching your criteria.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile-Responsive Pagination */}
      <MobileResponsivePagination
        pageIndex={table.getState().pagination.pageIndex}
        pageSize={table.getState().pagination.pageSize}
        pageCount={table.getPageCount()}
        totalRows={data.length}
        filteredRows={table.getFilteredRowModel().rows.length}
        selectedRows={table.getFilteredSelectedRowModel().rows.length}
        onPageChange={(page) => table.setPageIndex(page)}
        onPageSizeChange={(size) => table.setPageSize(size)}
        pageSizeOptions={isMobile ? [5, 10, 15, 20] : [10, 20, 30, 40, 50]}
        maxVisiblePages={isMobile ? 3 : 5}
      />
    </div>
  );
}
