"use client"
import * as React from "react"
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { productionData, ProductionRecord } from "../data/productionData"
import { tableColumns } from "./TableColumns"
import { DraggableRow } from "./DraggableRow"
import { DragHandle } from "./DragHandle"
import { TableCellViewer } from "./TableCellViewer"
import { StatusFilter } from "./Filters"
import { Pagination } from "./Pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react"
import type { Row } from "@tanstack/react-table"

export function DataTable({ statusFilter }: { statusFilter?: "all" | "running" | "pending" | "complete" }) {
  // local data for demonstration — you can lift this up to context or server state
  const [data, setData] = React.useState<ProductionRecord[]>(productionData || [])
  const [status, setStatus] = React.useState<StatusFilter>(statusFilter || "all")
  const [search] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(5)
  const [editingItem, setEditingItem] = React.useState<ProductionRecord | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [itemToDelete, setItemToDelete] = React.useState<ProductionRecord | null>(null)
  const [editDrawerOpen, setEditDrawerOpen] = React.useState(false)
  const [viewingItem, setViewingItem] = React.useState<ProductionRecord | null>(null)
  const [viewDrawerOpen, setViewDrawerOpen] = React.useState(false)

  // Validate data on mount
  React.useEffect(() => {
    if (!productionData || !Array.isArray(productionData)) {
      console.warn('Production data is not available or invalid');
      setData([]);
    }
  }, []);

  // Update status when statusFilter prop changes
  React.useEffect(() => {
    if (statusFilter) {
      setStatus(statusFilter);
    }
  }, [statusFilter]);

  // filtering
  const filtered = React.useMemo(() => {
    try {
      const byStatus = status === "all" ? data : data.filter((d) => d.status === status)
      if (!search || search.trim() === '') return byStatus
      const q = search.toLowerCase().trim()
      return byStatus.filter(
        (d) =>
          String(d.id).includes(q) ||
          (d.programCode && d.programCode.toLowerCase().includes(q)) ||
          (d.buyer && d.buyer.toLowerCase().includes(q)) ||
          (d.item && d.item.toLowerCase().includes(q))
      )
    } catch (error) {
      console.error('Error filtering data:', error);
      return data;
    }
  }, [data, status, search])

  // pagination slice
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(Math.max(1, page), pageCount)
  const start = (currentPage - 1) * pageSize
  const paged = filtered.slice(start, start + pageSize)

  // Ensure page is valid when filtered data changes
  React.useEffect(() => {
    if (page > pageCount && pageCount > 0) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  // Reset page when status filter changes
  React.useEffect(() => {
    setPage(1);
  }, [status]);

  // DnD handlers (reordering the main data array by id)
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    try {
      if (!active || !over || active.id === over.id) return
      if (!active.id || !over.id) return
      
      setData((prev) => {
        if (!prev || prev.length === 0) return prev
        const ids = prev.map((p) => String(p.id))
        const oldIndex = ids.indexOf(String(active.id))
        const newIndex = ids.indexOf(String(over.id))
        if (oldIndex === -1 || newIndex === -1) return prev
        return arrayMove(prev, oldIndex, newIndex)
      })
    } catch (error) {
      console.error('Error handling drag end:', error);
    }
  }

  // Handle edit item
  const handleEdit = (item: ProductionRecord) => {
    setEditingItem(item);
    setEditDrawerOpen(true);
  }

  // Handle view item
  const handleView = (item: ProductionRecord) => {
    setViewingItem(item);
    setViewDrawerOpen(true);
  }

  // Handle delete item
  const handleDelete = (item: ProductionRecord) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  }

  // Confirm delete
  const confirmDelete = () => {
    if (itemToDelete) {
      setData(prev => prev.filter(item => item.id !== itemToDelete.id));
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  }

  // Handle save edit
  const handleSaveEdit = (updatedItem: ProductionRecord) => {
    setData(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    setEditDrawerOpen(false);
    setEditingItem(null);
  }

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500 text-white';
      case 'pending':
        return 'bg-yellow-500 text-white';
      case 'complete':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }

  return (
    <div className="space-y-4">
      {/* <Filters status={status} onStatusChange={setStatus} search={search} onSearchChange={setSearch} /> */}
      {/* <ProductionTabs /> */}

      <div className="rounded-lg border overflow-hidden">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-8">Drag</TableHead>
                {tableColumns && tableColumns.length > 0 ? tableColumns.map((c) => (
                  <TableHead key={c.accessor}>{c.header}</TableHead>
                )) : (
                  <TableHead>No columns defined</TableHead>
                )}
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={tableColumns.length + 3} className="text-center py-8">
                    {filtered.length === 0 ? (
                      <div className="text-muted-foreground">
                        {search ? 'No results found for your search.' : 'No data available.'}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        No results on this page. Try adjusting your search or filters.
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                <SortableContext items={paged.map((d) => String(d.id))} strategy={verticalListSortingStrategy}>
                  {paged.map((row) => (
                    <DraggableRow
                      key={row.id}
                      // create a fake TanStack Row-like object for the DraggableRow to render default cells
                      row={{
                        id: String(row.id),
                        original: row,
                        getVisibleCells: () => [],
                        getIsSelected: () => false,
                      } as unknown as Row<ProductionRecord>}
                    >
                      {/* custom children cells for rendering */}
                      <TableCell className="w-8">
                        <DragHandle id={String(row.id)} />
                      </TableCell>
                      <TableCell>
                        <TableCellViewer item={row} />
                      </TableCell>
                      <TableCell>{row.programCode || '-'}</TableCell>
                      <TableCell>{row.buyer || '-'}</TableCell>
                      <TableCell>{row.quantity || 0}</TableCell>
                      <TableCell>{row.item || '-'}</TableCell>
                      <TableCell>${row.price || 0}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(row.status)}>
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(row)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleView(row)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(row)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </DraggableRow>
                  ))}
                </SortableContext>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      <Pagination
        page={currentPage}
        pageSize={pageSize}
        total={filtered.length}
        onPageChange={(p) => {
          const newPage = Math.max(1, Math.min(p, pageCount));
          setPage(newPage);
        }}
        onPageSizeChange={(s) => {
          const newPageSize = Math.max(1, Math.min(s, 100)); // Limit page size to reasonable bounds
          setPageSize(newPageSize);
          setPage(1); // Reset to first page when page size changes
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{itemToDelete?.programCode}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Drawer Sheet */}
      <Drawer open={editDrawerOpen} onOpenChange={setEditDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit Production Record</DrawerTitle>
            <DrawerDescription>
              Update the production record details below.
            </DrawerDescription>
          </DrawerHeader>
          {editingItem && (
            <EditForm 
              item={editingItem} 
              onSave={handleSaveEdit}
              onCancel={() => setEditDrawerOpen(false)}
            />
          )}
        </DrawerContent>
      </Drawer>

      {/* View Drawer Sheet */}
      <Drawer open={viewDrawerOpen} onOpenChange={setViewDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>View Production Record</DrawerTitle>
            <DrawerDescription>
              View the production record details below.
            </DrawerDescription>
          </DrawerHeader>
          {viewingItem && (
            <ViewForm 
              item={viewingItem}
              onClose={() => setViewDrawerOpen(false)}
            />
          )}
        </DrawerContent>
      </Drawer>
    </div>
  )
}

// Edit Form Component
function EditForm({ 
  item, 
  onSave, 
  onCancel 
}: { 
  item: ProductionRecord; 
  onSave: (item: ProductionRecord) => void; 
  onCancel: () => void;
}) {
  const [formData, setFormData] = React.useState<ProductionRecord>(item);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="programCode">Program Code</Label>
          <Input
            id="programCode"
            value={formData.programCode}
            onChange={(e) => setFormData(prev => ({ ...prev, programCode: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="buyer">Buyer</Label>
          <Input
            id="buyer"
            value={formData.buyer}
            onChange={(e) => setFormData(prev => ({ ...prev, buyer: e.target.value }))}
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="item">Item</Label>
        <Input
          id="item"
          value={formData.item}
          onChange={(e) => setFormData(prev => ({ ...prev, item: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value: "running" | "pending" | "complete") => 
            setFormData(prev => ({ ...prev, status: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DrawerFooter>
        <Button variant="outline" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button type="submit">
          Save Changes
        </Button>
      </DrawerFooter>
    </form>
  );
}

// View Form Component
function ViewForm({ 
  item, 
  onClose 
}: { 
  item: ProductionRecord; 
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Program Code</Label>
          <div className="p-2 bg-muted rounded-md text-sm">{item.programCode}</div>
        </div>
        <div className="space-y-2">
          <Label>Buyer</Label>
          <div className="p-2 bg-muted rounded-md text-sm">{item.buyer}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Quantity</Label>
          <div className="p-2 bg-muted rounded-md text-sm">{item.quantity}</div>
        </div>
        <div className="space-y-2">
          <Label>Price</Label>
          <div className="p-2 bg-muted rounded-md text-sm">${item.price}</div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Item</Label>
        <div className="p-2 bg-muted rounded-md text-sm">{item.item}</div>
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <div className="p-2 bg-muted rounded-md text-sm">
          <Badge className={item.status === 'running' ? 'bg-blue-500 text-white' : 
                           item.status === 'pending' ? 'bg-yellow-500 text-white' : 
                           'bg-green-500 text-white'}>
            {item.status}
          </Badge>
        </div>
      </div>

      <DrawerFooter>
        <Button onClick={onClose}>
          Close
        </Button>
      </DrawerFooter>
    </div>
  );
}
