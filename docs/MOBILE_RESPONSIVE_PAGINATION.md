# Mobile-Responsive Pagination System

This document describes the new mobile-responsive pagination components that have been implemented across all data tables in the application.

## Overview

The pagination system has been completely redesigned to provide an optimal user experience on both mobile and desktop devices. The new components automatically detect the device type and adjust their layout, spacing, and functionality accordingly.

## Components

### 1. MobileResponsivePagination

**Purpose**: For data tables using TanStack Table with built-in pagination state.

**Features**:
- Automatically detects mobile vs desktop
- Uses 0-based page indexing (TanStack standard)
- Responsive layout with proper spacing
- Mobile-optimized page size options
- Smart page number display with ellipsis

**Props**:
```typescript
interface MobileResponsivePaginationProps {
  pageIndex: number;           // TanStack page index (0-based)
  pageSize: number;            // Current page size
  pageCount: number;           // Total number of pages
  totalRows: number;           // Total rows in dataset
  filteredRows: number;        // Filtered rows count
  selectedRows: number;        // Selected rows count
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];  // Custom page size options
  showPageSizeSelector?: boolean;
  showRowCount?: boolean;
  showSelectedCount?: boolean;
  showFirstLastButtons?: boolean;
  maxVisiblePages?: number;    // Max visible page numbers
  className?: string;
}
```

### 2. SimpleMobilePagination

**Purpose**: For basic data tables with manual pagination state management.

**Features**:
- Uses 1-based page indexing (traditional pagination)
- Same mobile-responsive features as TanStack version
- Perfect for server-side pagination or custom implementations

**Props**:
```typescript
interface SimpleMobilePaginationProps {
  currentPage: number;         // Current page (1-based)
  pageSize: number;            // Current page size
  totalPages: number;          // Total number of pages
  totalRecords: number;        // Total records count
  selectedRecords?: number;    // Selected records count
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  // ... same customization options as above
}
```

## Mobile vs Desktop Behavior

### Mobile Devices (< 1024px)
- **Page Numbers**: Shows maximum 3 page numbers
- **Page Size Options**: Limited to [5, 10, 15, 20]
- **Layout**: Stacked vertical layout
- **Buttons**: First/Last page buttons hidden
- **Spacing**: Compact spacing between elements

### Desktop/Tablet (≥ 1024px)
- **Page Numbers**: Shows maximum 5 page numbers
- **Page Size Options**: Full range [10, 20, 30, 40, 50]
- **Layout**: Horizontal layout with proper spacing
- **Buttons**: All navigation buttons visible
- **Spacing**: Standard spacing for better usability

## Implementation Examples

### TanStack Table Integration

```tsx
import { MobileResponsivePagination } from '@/components/ui/mobile-responsive-pagination';
import { useIsMobile } from '@/hooks/use-mobile';

export function MyDataTable({ data }) {
  const isMobile = useIsMobile();
  
  return (
    <div>
      {/* Your table content */}
      
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
```

### Simple Table Integration

```tsx
import { SimpleMobilePagination } from '@/components/ui/simple-mobile-pagination';
import { useIsMobile } from '@/hooks/use-mobile';

export function MySimpleTable({ data, currentPage, pageSize, totalPages }) {
  const isMobile = useIsMobile();
  
  return (
    <div>
      {/* Your table content */}
      
      <SimpleMobilePagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        totalRecords={data.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={isMobile ? [5, 10, 15, 20] : [10, 20, 30, 40, 50]}
        maxVisiblePages={isMobile ? 3 : 5}
      />
    </div>
  );
}
```

## Updated Components

The following components have been updated to use the new mobile-responsive pagination:

1. **Production List Data Table** - Uses `SimpleMobilePagination`
2. **Production List TanStack Data Table** - Uses `MobileResponsivePagination`
3. **Lines Data Table** - Uses `MobileResponsivePagination`
4. **Admin User Permissions Data Table** - Uses `MobileResponsivePagination`
5. **Target Comprehensive Data Table** - Uses `MobileResponsivePagination`
6. **Target Data Table** - Uses `SimpleMobilePagination`
7. **Layout Data Table** - Uses `MobileResponsivePagination`
8. **Table Data Table** - Uses `MobileResponsivePagination`
9. **Advanced Data Table** - Enhanced with mobile-responsive features

## Key Features

### Responsive Layout
- Automatically adapts to screen size
- Stacked layout on mobile, horizontal on desktop
- Proper spacing and sizing for each breakpoint

### Smart Page Display
- Shows ellipsis (...) for long page ranges
- Always displays first and last page numbers
- Centers current page in the visible range
- Handles edge cases gracefully

### Mobile Optimizations
- Touch-friendly button sizes (minimum 44px)
- Reduced visual clutter on small screens
- Optimized page size options for mobile
- Hidden non-essential elements on small screens

### Accessibility
- Proper ARIA labels for screen readers
- Keyboard navigation support
- Semantic HTML structure
- Focus management

### Performance
- Efficient re-rendering with React hooks
- Minimal DOM manipulation
- Optimized for mobile devices

## Customization

Both pagination components support extensive customization:

```tsx
<MobileResponsivePagination
  // ... required props
  
  // Customization options
  pageSizeOptions={[5, 10, 25, 50, 100]}
  showPageSizeSelector={false}
  showRowCount={false}
  showSelectedCount={false}
  showFirstLastButtons={false}
  maxVisiblePages={7}
  className="custom-pagination-styles"
/>
```

## Migration Guide

### From Old Pagination

1. **Replace the old pagination JSX** with the new component
2. **Update imports** to use the new components
3. **Add mobile detection** with `useIsMobile()` hook
4. **Adjust props** to match the new interface
5. **Test on mobile devices** to ensure proper behavior

### Example Migration

**Before:**
```tsx
<div className="flex items-center justify-between space-x-2 py-4">
  <div className="flex items-center space-x-6">
    <div className="flex items-center space-x-2">
      <p className="text-sm font-medium">Rows per page</p>
      <select
        value={pageSize}
        onChange={e => onPageSizeChange(Number(e.target.value))}
        className="h-8 w-16 rounded border"
      >
        {[5, 10, 20, 50].map(size => (
          <option key={size} value={size}>{size}</option>
        ))}
      </select>
    </div>
  </div>
  {/* ... more pagination code */}
</div>
```

**After:**
```tsx
import { SimpleMobilePagination } from '@/components/ui/simple-mobile-pagination';
import { useIsMobile } from '@/hooks/use-mobile';

export function MyComponent() {
  const isMobile = useIsMobile();
  
  return (
    <SimpleMobilePagination
      currentPage={currentPage}
      pageSize={pageSize}
      totalPages={totalPages}
      totalRecords={totalRecords}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      pageSizeOptions={isMobile ? [5, 10, 15, 20] : [5, 10, 20, 50]}
      maxVisiblePages={isMobile ? 3 : 5}
    />
  );
}
```

## Testing

### Mobile Testing
- Test on various mobile devices and screen sizes
- Verify touch interactions work properly
- Check that layout adapts correctly
- Ensure page size options are appropriate for mobile

### Desktop Testing
- Verify full functionality on larger screens
- Check that all navigation buttons are visible
- Ensure proper spacing and alignment
- Test with various page count scenarios

### Responsive Testing
- Test breakpoint transitions (1024px)
- Verify smooth layout changes
- Check that functionality remains consistent
- Test with different content lengths

## Browser Support

The pagination components support:
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Touch devices with proper event handling
- Screen readers and accessibility tools

## Future Enhancements

Potential improvements for future versions:
- Virtual scrolling for very large datasets
- Infinite scroll option
- Custom page size presets
- Advanced filtering integration
- Keyboard shortcuts for power users
- Animation and transition effects

## Support

For questions or issues with the pagination system:
1. Check the component documentation
2. Review the demo component (`PaginationDemo`)
3. Test with the provided examples
4. Consult the migration guide
5. Check browser console for errors
