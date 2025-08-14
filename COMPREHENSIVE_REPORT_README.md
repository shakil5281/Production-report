# Comprehensive Target Report System

## Overview

The Comprehensive Target Report system provides a detailed view of production targets and actual production data organized by production lines and styles. It displays hourly production data in a structured table format similar to traditional production reports.

## Features

- **Multi-line Support**: Shows data for multiple production lines
- **Style-based Rows**: Each style gets its own row with detailed information
- **Hourly Production Tracking**: Displays production data for specific time slots
- **Target vs Actual**: Compares target production with actual production
- **Calculated Fields**: Automatically calculates totals, averages, and time-based targets
- **Export Functionality**: CSV export for data analysis
- **Date Selection**: Choose specific dates for reporting
- **Responsive Design**: Works on both desktop and mobile devices

## Data Structure

### API Response Format

```typescript
interface ComprehensiveReportResponse {
  success: boolean;
  data: ComprehensiveTargetData[];
  summary: SummaryData;
  timeSlotHeaders: string[];
  timeSlotTotals: Record<string, number>;
  message?: string;
  error?: string;
}
```

### Target Data Structure

```typescript
interface ComprehensiveTargetData {
  id: string;
  lineNo: string;
  lineName: string;
  styleNo: string;
  buyer: string;
  item: string;
  target: number;           // Per-hour target
  hours: number;            // Working hours
  targets: number;          // Total target (target × hours)
  hourlyProduction: Record<string, number>; // Production by time slot
  totalProduction: number;  // Total production for the day
  averageProductionPerHour: number; // Average production per hour
}
```

## Table Columns

1. **Line**: Production line number and name
2. **Style**: Style number for the product
3. **Buyer**: Customer/buyer name
4. **Item**: Product item description
5. **Target**: Per-hour production target
6. **Hours**: Working hours for the style
7. **Targets**: Total target (Target × Hours)
8. **Time Slots**: Hourly production data (e.g., 08:00-09:00, 11:00-12:00)
9. **Total**: Total production for the day
10. **Avg/Hour**: Average production per hour

## Time Slots

The system uses standard time slots:
- 08:00-09:00
- 11:00-12:00
- 14:00-15:00
- 17:00-18:00

These time slots are mapped from the `hourIndex` in production entries:
- hourIndex 8 → 08:00-09:00
- hourIndex 11 → 11:00-12:00
- hourIndex 14 → 14:00-15:00
- hourIndex 17 → 17:00-18:00

## API Endpoint

```
GET /api/target/comprehensive-report?date=YYYY-MM-DD
```

### Query Parameters

- `date`: Date in YYYY-MM-DD format (optional, defaults to current date)

### Response

Returns comprehensive target and production data for the specified date, including:
- All targets for the date
- Actual production data mapped to time slots
- Calculated totals and averages
- Summary statistics

## Components

### ComprehensiveReportTable

A reusable table component that displays the comprehensive report data with:
- Responsive design
- Hover effects
- Color-coded columns
- Totals row
- Professional styling

### ComprehensiveTargetReportPage

The main page component that:
- Fetches data from the API
- Manages state and loading states
- Provides date selection
- Handles export functionality
- Displays summary cards

## Usage

1. Navigate to the comprehensive report page
2. Select a date using the date picker
3. View the report data in the table
4. Export data to CSV if needed
5. Refresh data using the refresh button

## Styling

The table uses a professional design with:
- Gradient headers
- Color-coded columns (blue for targets, green for totals)
- Hover effects on rows
- Responsive borders and spacing
- Consistent typography

## Data Flow

1. **Target Data**: Retrieved from the `targets` table
2. **Production Data**: Retrieved from the `production_entries` table
3. **Line Information**: Retrieved from the `lines` table
4. **Style Information**: Retrieved from the `production_list` table
5. **Data Processing**: Targets and production data are matched by line and style
6. **Calculations**: Totals and averages are calculated
7. **Display**: Data is formatted and displayed in the table

## Export Format

The CSV export includes all table columns:
- Line, Style, Buyer, Item
- Target, Hours, Targets
- Hourly production data for each time slot
- Total production and average per hour

## Future Enhancements

- Filtering by line, style, or buyer
- Date range selection
- Performance metrics and charts
- Real-time updates
- Print-friendly layouts
- Multiple export formats (PDF, Excel)
