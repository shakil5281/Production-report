'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IconCode, IconPlus, IconX } from '@tabler/icons-react';
import { LineForm } from '@/components/lines/line-form';
import { LinesDataTable } from '@/components/lines/lines-data-table';
import { useLines } from '@/hooks/use-lines';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { Line, LineFormData } from '@/components/lines/schema';

export default function LinesPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Line | null>(null);
  const router = useRouter();
  const { createLine, updateLine, deleteLine, lines, loading, error, fetchLines } = useLines();

  useEffect(() => {
    fetchLines();
  }, [fetchLines]);

  const handleCreateItem = useCallback(async (formData: LineFormData) => {
    try {
      const success = await createLine({
        name: formData.name,
        code: formData.code
      });
      if (success) {
        setSheetOpen(false);
        toast.success('Line created successfully!');
        router.refresh();
      } else {
        toast.error('Failed to create line');
      }
      return success;
    } catch (error) {
      console.error('Error creating line:', error);
      toast.error('Error creating line');
      return false;
    }
  }, [createLine, router]);

  const handleEditItem = useCallback(async (formData: LineFormData) => {
    if (!editingItem) return false;
    
    try {
      const success = await updateLine(editingItem.id, formData);
      if (success) {
        setEditingItem(null);
        toast.success('Line updated successfully!');
        router.refresh();
      } else {
        toast.error('Failed to update line');
      }
      return success;
    } catch (error) {
      console.error('Error updating line:', error);
      toast.error('Error updating line');
      return false;
    }
  }, [editingItem, updateLine, router]);

  const handleViewItem = (item: Line) => {
    // Handle view action - you can implement a view sheet here
    console.log('View line:', item);
  };

  const handleEditItemOpen = (item: Line) => {
    setEditingItem(item);
    setSheetOpen(true);
  };

  const handleDeleteItem = async (item: Line) => {
    if (confirm('Are you sure you want to delete this line?')) {
      try {
        const success = await deleteLine(item.id);
        if (success) {
          toast.success('Line deleted successfully!');
          router.refresh();
        } else {
          toast.error('Failed to delete line');
        }
      } catch (error) {
        console.error('Error deleting line:', error);
        toast.error('Error deleting line');
      }
    }
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Production Lines</h1>
          <p className="text-muted-foreground">
            Manage production lines and their configurations
          </p>
        </div>

        {/* Add Line Button */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button className="flex items-center gap-2 w-full sm:w-auto">
              <IconPlus className="h-4 w-4" />
              Add Line
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[600px] max-w-full">
            <SheetHeader>
              <SheetTitle>{editingItem ? 'Edit Line' : 'Add New Line'}</SheetTitle>
              <SheetDescription>
                {editingItem 
                  ? 'Update the production line information'
                  : 'Create a new production line with all required details'
                }
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className='h-[calc(100vh-100px)]'>
              <div className="mt-6">
                <LineForm
                  mode={editingItem ? 'edit' : 'create'}
                  item={editingItem}
                  onSubmit={editingItem ? handleEditItem : handleCreateItem}
                  onCancel={handleSheetClose}
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

      {/* Lines Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCode className="h-5 w-5" />
            Production Lines
            {loading && <span className="text-sm text-muted-foreground">(Loading...)</span>}
          </CardTitle>
          <CardDescription>
            Complete list of all production lines from the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LinesDataTable 
            data={lines} 
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
            <CardTitle className="text-sm font-medium">Total Lines</CardTitle>
            <IconCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{lines.length}</div>
            <p className="text-xs text-muted-foreground">
              Production lines
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Lines</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              {lines.filter(line => line.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>


      </div>
    </div>
  );
}
