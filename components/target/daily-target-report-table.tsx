'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IconTarget, IconTrendingUp, IconClock } from '@tabler/icons-react';
import { format } from 'date-fns';

import { DailyTargetReportTableProps, DailyTargetData } from './types';

export function DailyTargetReportTable({ data, loading, selectedDate }: DailyTargetReportTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof DailyTargetData | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  const handleSort = (key: keyof DailyTargetData) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortConfig.direction === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    return 0;
  });

  const getSortIcon = (key: keyof DailyTargetData) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <IconClock className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-spin" />
          <p className="text-muted-foreground">Loading daily target report...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <IconTarget className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">No data available for {format(selectedDate, 'MMM dd, yyyy')}</p>
        </div>
      </div>
    );
  }

  // Calculate footer totals
  const footerTotals = {
    lineTarget: data.reduce((sum, item) => sum + item.lineTarget, 0),
    totalTarget: data.reduce((sum, item) => sum + item.totalTarget, 0),
    totalProduction: data.reduce((sum, item) => sum + item.totalProduction, 0),
    averageProductionPerHour: data.reduce((sum, item) => sum + item.averageProductionPerHour, 0) / data.length,
    hourlyProduction: {
      '8-9': data.reduce((sum, item) => sum + item.hourlyProduction['8-9'], 0),
      '9-10': data.reduce((sum, item) => sum + item.hourlyProduction['9-10'], 0),
      '10-11': data.reduce((sum, item) => sum + item.hourlyProduction['10-11'], 0),
      '11-12': data.reduce((sum, item) => sum + item.hourlyProduction['11-12'], 0),
      '12-1': data.reduce((sum, item) => sum + item.hourlyProduction['12-1'], 0),
      '1-2': data.reduce((sum, item) => sum + item.hourlyProduction['1-2'], 0),
      '2-3': data.reduce((sum, item) => sum + item.hourlyProduction['2-3'], 0),
      '3-4': data.reduce((sum, item) => sum + item.hourlyProduction['3-4'], 0),
      '4-5': data.reduce((sum, item) => sum + item.hourlyProduction['4-5'], 0),
      '5-6': data.reduce((sum, item) => sum + item.hourlyProduction['5-6'], 0),
      '6-7': data.reduce((sum, item) => sum + item.hourlyProduction['6-7'], 0),
      '7-8': data.reduce((sum, item) => sum + item.hourlyProduction['7-8'], 0),
    }
  };

  return (
    <div className="space-y-4">
      <ScrollArea className="h-[600px] w-full rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead 
                className="sticky left-0 bg-background z-20 cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('lineNo')}
              >
                <div className="flex items-center gap-1">
                  Line {getSortIcon('lineNo')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('styleNo')}
              >
                <div className="flex items-center gap-1">
                  Style {getSortIcon('styleNo')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('buyer')}
              >
                <div className="flex items-center gap-1">
                  Buyer {getSortIcon('buyer')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('item')}
              >
                <div className="flex items-center gap-1">
                  Item {getSortIcon('item')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('lineTarget')}
              >
                <div className="flex items-center gap-1">
                  Line Target {getSortIcon('lineTarget')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('totalTarget')}
              >
                <div className="flex items-center gap-1">
                  Total Target {getSortIcon('totalTarget')}
                </div>
              </TableHead>
              
              {/* Hourly Production Columns */}
              <TableHead className="text-center bg-muted/50">8-9</TableHead>
              <TableHead className="text-center bg-muted/50">9-10</TableHead>
              <TableHead className="text-center bg-muted/50">10-11</TableHead>
              <TableHead className="text-center bg-muted/50">11-12</TableHead>
              <TableHead className="text-center bg-muted/50">12-1</TableHead>
              <TableHead className="text-center bg-muted/50">1-2</TableHead>
              <TableHead className="text-center bg-muted/50">2-3</TableHead>
              <TableHead className="text-center bg-muted/50">3-4</TableHead>
              <TableHead className="text-center bg-muted/50">4-5</TableHead>
              <TableHead className="text-center bg-muted/50">5-6</TableHead>
              <TableHead className="text-center bg-muted/50">6-7</TableHead>
              <TableHead className="text-center bg-muted/50">7-8</TableHead>
              
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('totalProduction')}
              >
                <div className="flex items-center gap-1">
                  Total Production {getSortIcon('totalProduction')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('averageProductionPerHour')}
              >
                <div className="flex items-center gap-1">
                  Avg/Hour {getSortIcon('averageProductionPerHour')}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((row, index) => (
              <TableRow key={row.id} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                <TableCell className="sticky left-0 bg-background font-medium">
                  <Badge variant="outline">{row.lineNo}</Badge>
                </TableCell>
                <TableCell className="font-medium">{row.styleNo}</TableCell>
                <TableCell>{row.buyer}</TableCell>
                <TableCell>{row.item}</TableCell>
                <TableCell className="text-right font-medium">
                  {row.lineTarget.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {row.totalTarget.toLocaleString()}
                </TableCell>
                
                {/* Hourly Production Cells */}
                <TableCell className="text-center">{row.hourlyProduction['8-9'].toLocaleString()}</TableCell>
                <TableCell className="text-center">{row.hourlyProduction['9-10'].toLocaleString()}</TableCell>
                <TableCell className="text-center">{row.hourlyProduction['10-11'].toLocaleString()}</TableCell>
                <TableCell className="text-center">{row.hourlyProduction['11-12'].toLocaleString()}</TableCell>
                <TableCell className="text-center">{row.hourlyProduction['12-1'].toLocaleString()}</TableCell>
                <TableCell className="text-center">{row.hourlyProduction['1-2'].toLocaleString()}</TableCell>
                <TableCell className="text-center">{row.hourlyProduction['2-3'].toLocaleString()}</TableCell>
                <TableCell className="text-center">{row.hourlyProduction['3-4'].toLocaleString()}</TableCell>
                <TableCell className="text-center">{row.hourlyProduction['4-5'].toLocaleString()}</TableCell>
                <TableCell className="text-center">{row.hourlyProduction['5-6'].toLocaleString()}</TableCell>
                <TableCell className="text-center">{row.hourlyProduction['6-7'].toLocaleString()}</TableCell>
                <TableCell className="text-center">{row.hourlyProduction['7-8'].toLocaleString()}</TableCell>
                
                <TableCell className="text-right font-bold text-green-600">
                  {row.totalProduction.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {row.averageProductionPerHour.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
            
            {/* Footer Row with Totals */}
            <TableRow className="bg-muted/50 font-bold">
              <TableCell className="sticky left-0 bg-muted/50">TOTAL</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
              <TableCell className="text-right">{footerTotals.lineTarget.toLocaleString()}</TableCell>
              <TableCell className="text-right">{footerTotals.totalTarget.toLocaleString()}</TableCell>
              
                             {/* Hourly Totals */}
               <TableCell className="text-center bg-muted/70">{footerTotals.hourlyProduction['8-9'].toLocaleString()}</TableCell>
               <TableCell className="text-center bg-muted/70">{footerTotals.hourlyProduction['9-10'].toLocaleString()}</TableCell>
               <TableCell className="text-center bg-muted/70">{footerTotals.hourlyProduction['10-11'].toLocaleString()}</TableCell>
               <TableCell className="text-center bg-muted/70">{footerTotals.hourlyProduction['11-12'].toLocaleString()}</TableCell>
               <TableCell className="text-center bg-muted/70">{footerTotals.hourlyProduction['12-1'].toLocaleString()}</TableCell>
               <TableCell className="text-center bg-muted/70">{footerTotals.hourlyProduction['1-2'].toLocaleString()}</TableCell>
               <TableCell className="text-center bg-muted/70">{footerTotals.hourlyProduction['2-3'].toLocaleString()}</TableCell>
               <TableCell className="text-center bg-muted/70">{footerTotals.hourlyProduction['3-4'].toLocaleString()}</TableCell>
               <TableCell className="text-center bg-muted/70">{footerTotals.hourlyProduction['4-5'].toLocaleString()}</TableCell>
               <TableCell className="text-center bg-muted/70">{footerTotals.hourlyProduction['5-6'].toLocaleString()}</TableCell>
               <TableCell className="text-center bg-muted/70">{footerTotals.hourlyProduction['6-7'].toLocaleString()}</TableCell>
               <TableCell className="text-center bg-muted/70">{footerTotals.hourlyProduction['7-8'].toLocaleString()}</TableCell>
              
              <TableCell className="text-right text-green-600 bg-muted/70">
                {footerTotals.totalProduction.toLocaleString()}
              </TableCell>
              <TableCell className="text-right bg-muted/70">
                {footerTotals.averageProductionPerHour.toFixed(2)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </ScrollArea>
      
      {/* Summary Footer */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Total Lines</div>
              <div className="text-xl font-bold">{data.length}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Total Target</div>
              <div className="text-xl font-bold">{footerTotals.totalTarget.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Total Production</div>
              <div className="text-xl font-bold text-green-600">{footerTotals.totalProduction.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Average/Hour</div>
              <div className="text-xl font-bold">{footerTotals.averageProductionPerHour.toFixed(2)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
