'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MobileResponsivePagination } from './mobile-responsive-pagination';
import { SimpleMobilePagination } from './simple-mobile-pagination';
import { useIsMobile } from '@/hooks/use-mobile';

export function PaginationDemo() {
  const isMobile = useIsMobile();
  const [tanStackPage, setTanStackPage] = useState(0);
  const [tanStackPageSize, setTanStackPageSize] = useState(10);
  const [simplePage, setSimplePage] = useState(1);
  const [simplePageSize, setSimplePageSize] = useState(10);
  
  // Mock data for demo
  const totalRecords = 150;
  const totalPages = Math.ceil(totalRecords / simplePageSize);
  const tanStackTotalPages = Math.ceil(totalRecords / tanStackPageSize);

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Mobile-Responsive Pagination Demo</h1>
        <p className="text-muted-foreground mt-2">
          Showcasing the new mobile-responsive pagination components
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Current device: {isMobile ? 'Mobile' : 'Desktop/Tablet'}
        </p>
      </div>

      {/* TanStack Table Pagination Example */}
      <Card>
        <CardHeader>
          <CardTitle>TanStack Table Pagination</CardTitle>
          <CardDescription>
            For data tables using TanStack Table with built-in pagination state
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>• Automatically detects mobile vs desktop</p>
              <p>• Mobile: Shows 3 page numbers, smaller page size options</p>
              <p>• Desktop: Shows 5 page numbers, full page size options</p>
              <p>• Responsive layout with proper spacing</p>
            </div>
            
            <MobileResponsivePagination
              pageIndex={tanStackPage}
              pageSize={tanStackPageSize}
              pageCount={tanStackTotalPages}
              totalRows={totalRecords}
              filteredRows={totalRecords}
              selectedRows={0}
              onPageChange={setTanStackPage}
              onPageSizeChange={setTanStackPageSize}
              pageSizeOptions={isMobile ? [5, 10, 15, 20] : [10, 20, 30, 40, 50]}
              maxVisiblePages={isMobile ? 3 : 5}
            />
          </div>
        </CardContent>
      </Card>

      {/* Simple Pagination Example */}
      <Card>
        <CardHeader>
          <CardTitle>Simple Pagination</CardTitle>
          <CardDescription>
            For basic data tables with manual pagination state management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>• Uses 1-based page indexing (traditional pagination)</p>
              <p>• Same mobile-responsive features as TanStack version</p>
              <p>• Perfect for server-side pagination or custom implementations</p>
            </div>
            
            <SimpleMobilePagination
              currentPage={simplePage}
              pageSize={simplePageSize}
              totalPages={totalPages}
              totalRecords={totalRecords}
              selectedRecords={0}
              onPageChange={setSimplePage}
              onPageSizeChange={setSimplePageSize}
              pageSizeOptions={isMobile ? [5, 10, 15, 20] : [10, 20, 30, 40, 50]}
              maxVisiblePages={isMobile ? 3 : 5}
            />
          </div>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Key Features</CardTitle>
          <CardDescription>
            What makes these pagination components mobile-responsive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold">Mobile Optimizations</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Fewer visible page numbers (3 vs 5)</li>
                <li>• Smaller page size options (5, 10, 15, 20)</li>
                <li>• Compact button spacing</li>
                <li>• Hidden first/last buttons on small screens</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Responsive Layout</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Stacked layout on mobile</li>
                <li>• Side-by-side on larger screens</li>
                <li>• Adaptive spacing and sizing</li>
                <li>• Touch-friendly button sizes</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Smart Page Display</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Ellipsis for long page ranges</li>
                <li>• Always shows first and last page</li>
                <li>• Centers current page in range</li>
                <li>• Handles edge cases gracefully</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Accessibility</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Proper ARIA labels</li>
                <li>• Keyboard navigation support</li>
                <li>• Screen reader friendly</li>
                <li>• Semantic HTML structure</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
          <CardDescription>
            Implementation guide for developers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">For TanStack Tables:</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`import { MobileResponsivePagination } from '@/components/ui/mobile-responsive-pagination';

<MobileResponsivePagination
  pageIndex={table.getState().pagination.pageIndex}
  pageSize={table.getState().pagination.pageSize}
  pageCount={table.getPageCount()}
  totalRows={data.length}
  filteredRows={table.getFilteredRowModel().rows.length}
  selectedRows={table.getFilteredSelectedRowModel().rows.length}
  onPageChange={(page) => table.setPageIndex(page)}
  onPageSizeChange={(size) => table.setPageSize(size)}
/>`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">For Simple Tables:</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`import { SimpleMobilePagination } from '@/components/ui/simple-mobile-pagination';

<SimpleMobilePagination
  currentPage={currentPage}
  pageSize={pageSize}
  totalPages={totalPages}
  totalRecords={totalRecords}
  onPageChange={setCurrentPage}
  onPageSizeChange={setPageSize}
/>`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
