'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IconTarget, IconPlus, IconX } from '@tabler/icons-react';
import { TargetForm } from '@/components/target/target-form';
import { TargetDataTable } from '@/components/target/target-data-table';
import { useTarget } from '@/hooks/use-target';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { Target, TargetFormData, ProductionListItem, Line } from '@/components/target/schema';

export default function TargetPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Target | null>(null);
	const [lines, setLines] = useState<Line[]>([]);
  const [productionItems, setProductionItems] = useState<ProductionListItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const router = useRouter();
  const { createTarget, updateTarget, deleteTarget, targets, loading, error, fetchTargetsByDate } = useTarget();

  useEffect(() => {
    // Format date as YYYY-MM-DD in local timezone to avoid UTC conversion issues
    const formattedDate = selectedDate.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format
    fetchTargetsByDate(formattedDate);
    fetchLines();
    fetchProductionItems();
  }, [fetchTargetsByDate, selectedDate]);

  const fetchLines = async () => {
    try {
      const response = await fetch('/api/lines');
      const data = await response.json();
      if (data.success) {
        setLines(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching lines:', error);
    }
  };

  const fetchProductionItems = async () => {
    try {
      // Fetch only running styles from production list instead of styles API
      const response = await fetch('/api/production?status=RUNNING');
      const data = await response.json();
      if (data.success) {
        setProductionItems(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching running production items:', error);
    }
  };

  const handleCreateItem = useCallback(async (formData: TargetFormData) => {
    try {
      const success = await createTarget(formData);
      if (success) {
        setSheetOpen(false);
        toast.success('Target created successfully!');
        router.refresh();
      } else {
        toast.error('Failed to create target');
      }
      return success;
    } catch (error) {
      console.error('Error creating target:', error);
      toast.error('Error creating target');
      return false;
    }
  }, [createTarget, router]);

  const handleEditItem = useCallback(async (formData: TargetFormData) => {
    if (!editingItem) return false;
    
    try {
      const success = await updateTarget(editingItem.id, formData);
      if (success) {
        setEditingItem(null);
        toast.success('Target updated successfully!');
        router.refresh();
      } else {
        toast.error('Failed to update target');
      }
      return success;
    } catch (error) {
      console.error('Error updating target:', error);
      toast.error('Error updating target');
      return false;
    }
  }, [editingItem, updateTarget, router]);

  const handleViewItem = (item: Target) => {
    // Handle view action - you can implement a view sheet here
    console.log('View target:', item);
  };

  const handleEditItemOpen = (item: Target) => {
    setEditingItem(item);
    setSheetOpen(true);
  };

  const handleDeleteItem = async (item: Target) => {
    if (confirm('Are you sure you want to delete this target?')) {
      try {
        const success = await deleteTarget(item.id);
        if (success) {
          toast.success('Target deleted successfully!');
          router.refresh();
        } else {
          toast.error('Failed to delete target');
        }
      } catch (error) {
        console.error('Error deleting target:', error);
        toast.error('Error deleting target');
      }
    }
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setEditingItem(null);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

	return (
		<div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Production Targets</h1>
          <p className="text-muted-foreground">
            Set and manage production targets for lines and running styles - {selectedDate.toLocaleDateString()}
          </p>
        </div>

        {/* Add Target Button */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button className="flex items-center gap-2 w-full sm:w-auto">
              <IconPlus className="h-4 w-4" />
              Add Target
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[600px] max-w-full">
            <SheetHeader>
              <SheetTitle>{editingItem ? 'Edit Target' : 'Add New Target'}</SheetTitle>
              <SheetDescription>
                {editingItem 
                  ? 'Update the production target information'
                  : 'Create a new production target with all required details'
                }
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className='h-[calc(100vh-100px)]'>
              <div className="mt-6">
                <TargetForm
                  mode={editingItem ? 'edit' : 'create'}
                  item={editingItem}
                  onSubmit={editingItem ? handleEditItem : handleCreateItem}
                  onCancel={handleSheetClose}
                  productionItems={productionItems}
                  lines={lines}
                />
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
			</div>

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

      {/* Target Data Table */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<IconTarget className="h-5 w-5" />
            Production Targets for {selectedDate.toLocaleDateString()}
            {loading && <span className="text-sm text-muted-foreground">(Loading...)</span>}
					</CardTitle>
          <CardDescription>
            Complete list of all production targets for {selectedDate.toLocaleDateString()} (only running styles)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TargetDataTable 
            data={targets} 
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            onView={handleViewItem}
            onEdit={handleEditItemOpen}
            onDelete={handleDeleteItem}
          />
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Targets for {selectedDate.toLocaleDateString()}</CardTitle>
            <IconTarget className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{targets.length}</div>
            <p className="text-xs text-muted-foreground">
              Production targets
            </p>
				</CardContent>
			</Card>

			<Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Line Target</CardTitle>
            <div className="h-4 w-4 rounded-full bg-blue-500" />
				</CardHeader>
				<CardContent>
            <div className="text-xl md:text-2xl font-bold">
              {targets.reduce((sum, target) => sum + target.lineTarget, 0).toLocaleString()}
												</div>
            <p className="text-xs text-muted-foreground">
              Combined targets
            </p>
				</CardContent>
			</Card>

			<Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Production</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
				</CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              {targets.reduce((sum, target) => sum + target.hourlyProduction, 0).toLocaleString()}
							</div>
            <p className="text-xs text-muted-foreground">
              Sum of hourly production
            </p>
				</CardContent>
			</Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Production</CardTitle>
            <div className="h-4 w-4 rounded-full bg-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              {targets.length > 0 
                ? (targets.reduce((sum, target) => sum + target.hourlyProduction, 0) / targets.length).toFixed(2)
                : '0.00'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Average hourly production
            </p>
          </CardContent>
				</Card>
      </div>
		</div>
	);
}
