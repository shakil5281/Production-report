'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IconTarget, IconPlus, IconX, IconChartBar } from '@tabler/icons-react';
import { EnhancedTargetForm } from '@/components/target/enhanced-target-form';
import { ProductionTargetForm } from '@/components/target/production-target-form';
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

  // Handler for production target form submission
  const handleCreateProductionTarget = useCallback(async (formData: any): Promise<boolean> => {
    try {
      const response = await fetch('/api/target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineNo: formData.lineId, // Map lineId to lineNo for API compatibility
          styleNo: formData.styleNo,
          lineTarget: formData.targetPerHour,
          date: formData.date,
          inTime: formData.inTime,
          outTime: formData.outTime,
          hourlyProduction: 0 // Default value, will be updated during production
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Production target created successfully!');
        setSheetOpen(false);
        // Refresh the targets for the selected date
        const formattedDate = selectedDate.toLocaleDateString('en-CA');
        await fetchTargetsByDate(formattedDate);
        return true;
      } else {
        toast.error(result.error || 'Failed to create production target');
        return false;
      }
    } catch (err) {
      toast.error('Network error occurred');
      console.error('Error creating production target:', err);
      return false;
    }
  }, [selectedDate, fetchTargetsByDate]);

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
		<div className="space-y-8 p-4 md:p-6 lg:p-8">
      {/* Modern Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600">
              <IconTarget className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Production Targets
              </h1>
              <p className="text-muted-foreground text-lg">
                Set hourly production targets for active line assignments - {selectedDate.toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Add Target Button */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg flex items-center gap-2 w-full sm:w-auto">
              <IconPlus className="h-4 w-4" />
              Add Production Target
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[600px] max-w-full">
            <SheetHeader>
              <SheetTitle className="text-xl font-semibold">
                {editingItem ? 'Edit Target' : 'Create Production Target'}
              </SheetTitle>
              <SheetDescription className="text-base">
                {editingItem 
                  ? 'Update the production target information'
                  : 'Set production targets for active line assignments'
                }
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className='h-[calc(100vh-100px)]'>
              <div className="mt-6">
                {editingItem ? (
                  <EnhancedTargetForm
                    mode="edit"
                    item={editingItem}
                    onSubmit={handleEditItem}
                    onCancel={handleSheetClose}
                    productionItems={productionItems}
                    lines={lines}
                  />
                ) : (
                  <ProductionTargetForm
                    onSubmit={handleCreateProductionTarget}
                    onCancel={handleSheetClose}
                    loading={loading}
                  />
                )}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
			</div>

      {/* Modern Error Display */}
      {error && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-700">
              <div className="p-2 bg-red-100 rounded-lg">
                <IconX className="h-4 w-4 text-red-600" />
              </div>
              <span className="flex-1 font-medium">{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modern Quick Actions */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 bg-purple-200 rounded-lg">
              <IconChartBar className="h-5 w-5 text-purple-600" />
            </div>
            Quick Actions
          </CardTitle>
          <CardDescription className="text-base">
            Access target management and reporting functions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/target/comprehensive-report')}
              className="flex items-center gap-2 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
            >
              <IconChartBar className="h-4 w-4" />
              View Comprehensive Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modern Target Data Table */}
			<Card className="border-0 shadow-xl bg-white">
				<CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
					<CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
						<div className="p-2 bg-purple-200 rounded-lg">
							<IconTarget className="h-5 w-5 text-purple-600" />
						</div>
            Production Targets for {selectedDate.toLocaleDateString()}
            {loading && (
              <div className="flex items-center gap-2 text-purple-600 text-sm">
                <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                Loading...
              </div>
            )}
					</CardTitle>
          <CardDescription className="text-base text-gray-600">
            Active production targets for assigned lines and running styles
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
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

      {/* Modern Summary Statistics */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Targets Today</CardTitle>
            <div className="p-2 bg-purple-200 rounded-lg">
              <IconTarget className="h-4 w-4 text-purple-600" />
            </div>
				</CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{targets.length}</div>
            <p className="text-xs text-purple-600 mt-1">
              Active production targets
            </p>
				</CardContent>
			</Card>

			<Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Line Target</CardTitle>
            <div className="p-2 bg-blue-200 rounded-lg">
              <div className="h-4 w-4 rounded-full bg-blue-500" />
            </div>
				</CardHeader>
				<CardContent>
            <div className="text-3xl font-bold text-blue-900">
              {targets.reduce((sum, target) => sum + target.lineTarget, 0).toLocaleString()}
												</div>
            <p className="text-xs text-blue-600 mt-1">
              Combined hourly targets
            </p>
				</CardContent>
			</Card>

			<Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Total Production</CardTitle>
            <div className="p-2 bg-green-200 rounded-lg">
              <div className="h-4 w-4 rounded-full bg-green-500" />
            </div>
				</CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">
              {targets.reduce((sum, target) => sum + target.hourlyProduction, 0).toLocaleString()}
							</div>
            <p className="text-xs text-green-600 mt-1">
              Actual hourly production
            </p>
				</CardContent>
			</Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-amber-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Avg Efficiency</CardTitle>
            <div className="p-2 bg-yellow-200 rounded-lg">
              <div className="h-4 w-4 rounded-full bg-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-900">
              {targets.length > 0 
                ? (targets.reduce((sum, target) => sum + target.hourlyProduction, 0) / targets.reduce((sum, target) => sum + target.lineTarget, 0) * 100 || 0).toFixed(1) + '%'
                : '0.0%'
              }
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              Production vs target
            </p>
          </CardContent>
				</Card>
      </div>
		</div>
	);
}
