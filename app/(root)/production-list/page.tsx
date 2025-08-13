'use client';

import { ProductionListDataTable } from '@/components/production-list/data-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconList, IconFilter, IconPlus, IconX } from '@tabler/icons-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ProductionForm } from '@/components/production-form';
import { useProduction } from '@/hooks/use-production';
import { useState, useCallback } from 'react';

interface ProductionFormData {
  programCode: string;
  buyer: string;
  quantity: number;
  item: string;
  price: number;
  status?: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'CANCELLED';
  notes?: string;
}

export default function ProductionListPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'RUNNING' | 'PENDING' | 'COMPLETE' | 'CANCELLED'>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const { createProductionItem, productionItems, loading, error, fetchProductionItems } = useProduction();

  const handleCreateItem = useCallback(async (formData: ProductionFormData) => {
    try {
      const success = await createProductionItem(formData);
      if (success) {
        setSheetOpen(false);
        // Auto-reload the production items
        await fetchProductionItems();
      }
      return success;
    } catch (error) {
      console.error('Error creating item:', error);
      return false;
    }
  }, [createProductionItem, fetchProductionItems]);

  const handleSheetClose = () => {
    setSheetOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Production List</h1>
          <p className="text-muted-foreground">
            View and manage all production records and items
          </p>
        </div>
        
        {/* Add Item Button */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button className="flex items-center gap-2">
              <IconPlus className="h-4 w-4" />
              Add Item
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[600px] sm:w-[600px]">
            <SheetHeader>
              <SheetTitle>Add New Production Item</SheetTitle>
              <SheetDescription>
                Create a new production item with all required details
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <ProductionForm
                mode="create"
                onSubmit={handleCreateItem}
                onCancel={handleSheetClose}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFilter className="h-5 w-5" />
            Status Filter
          </CardTitle>
          <CardDescription>
            Filter production items by status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium">
              Status Filter
            </label>
            <Select value={statusFilter} onValueChange={(value: 'all' | 'RUNNING' | 'PENDING' | 'COMPLETE' | 'CANCELLED') => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="RUNNING">Running</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="COMPLETE">Complete</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <IconX className="h-4 w-4" />
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.reload()}
                className="ml-auto text-red-700 hover:text-red-800"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Production Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconList className="h-5 w-5" />
            Production Items
            {loading && <span className="text-sm text-muted-foreground">(Loading...)</span>}
          </CardTitle>
          <CardDescription>
            Complete list of all production records from the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductionListDataTable statusFilter={statusFilter} />
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <IconList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productionItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Production records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {productionItems.filter(item => item.status === 'RUNNING').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active productions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <div className="h-4 w-4 rounded-full bg-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {productionItems.filter(item => item.status === 'PENDING').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Waiting to start
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complete</CardTitle>
            <div className="h-4 w-4 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {productionItems.filter(item => item.status === 'COMPLETE').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Finished productions
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
