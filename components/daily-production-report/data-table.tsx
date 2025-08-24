'use client';

import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IconEye, IconClipboardList } from '@tabler/icons-react';
import { format } from 'date-fns';
import { DailyProductionReport, LineSummary } from './types';

interface DataTableProps {
  reportsByLine: Record<string, DailyProductionReport[]>;
  reportsWithoutLine: DailyProductionReport[];
  lineSummaries: Record<string, LineSummary>;
  selectedDate: Date;
  searchTerm: string;
  lineFilter: string;
  isMobile: boolean;
  onViewReport: (report: DailyProductionReport, lineNo?: string) => void;
}

export function DataTable({
  reportsByLine,
  reportsWithoutLine,
  lineSummaries,
  selectedDate,
  searchTerm,
  lineFilter,
  isMobile,
  onViewReport
}: DataTableProps) {
  // Debug logging
  console.log('DataTable props:', {
    reportsByLine: Object.keys(reportsByLine),
    reportsWithoutLine: reportsWithoutLine.length,
    lineSummaries: Object.keys(lineSummaries),
    searchTerm,
    lineFilter
  });

  // Log the actual data structure
  console.log('DataTable detailed data:', {
    reportsByLine,
    reportsWithoutLine,
    lineSummaries
  });

  // Filter reports based on search term
  const filterReports = (reports: DailyProductionReport[]) => {
    if (!searchTerm) return reports;
    
    const searchLower = searchTerm.toLowerCase();
    return reports.filter(report => (
      report.styleNo.toLowerCase().includes(searchLower) ||
      report.productionList.buyer.toLowerCase().includes(searchLower) ||
      report.productionList.item.toLowerCase().includes(searchLower)
    ));
  };

  // Check if we have any data to display
  const hasData = Object.keys(reportsByLine).length > 0 || reportsWithoutLine.length > 0;
  const hasFilteredData = Object.entries(reportsByLine).some(([lineNo, lineReports]) => {
    if (lineFilter !== 'all' && lineNo !== lineFilter) return false;
    const filteredLineReports = filterReports(lineReports);
    return filteredLineReports.length > 0;
  }) || (lineFilter === 'all' || lineFilter === '') && filterReports(reportsWithoutLine).length > 0;

  console.log('DataTable conditions:', {
    hasData,
    hasFilteredData,
    reportsByLineKeys: Object.keys(reportsByLine),
    reportsWithoutLineLength: reportsWithoutLine.length
  });

  if (!hasData) {
    console.log('DataTable: No data available');
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-2">
            <IconClipboardList className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-lg font-medium text-muted-foreground">No reports found</div>
            <div className="text-sm text-muted-foreground">
              No production reports for the selected date and filters
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasFilteredData) {
    console.log('DataTable: No filtered data available');
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-2">
            <IconClipboardList className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-lg font-medium text-muted-foreground">No filtered results</div>
            <div className="text-sm text-muted-foreground">
              Try adjusting your search terms or filters
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  console.log('DataTable: Rendering data table with data');

  return (
    <div className="space-y-6">
      {/* Reports grouped by lines */}
      {Object.entries(reportsByLine)
        .filter(([lineNo, lineReports]) => {
          if (lineFilter !== 'all' && lineNo !== lineFilter) return false;
          const filteredLineReports = filterReports(lineReports);
          return filteredLineReports.length > 0;
        })
        .map(([lineNo, lineReports]) => {
          const lineSummary = lineSummaries[lineNo];
          const filteredLineReports = filterReports(lineReports);

          return (
            <Card key={lineNo}>
              <CardHeader className="bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span>Line Production Report</span>
                    </CardTitle>
                    <CardDescription>
                      Production performance for {format(selectedDate, 'PPP')}
                    </CardDescription>
                  </div>
                  {lineSummary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-blue-600">{(lineSummary?.totalTargetQty || 0).toLocaleString()}</div>
                        <div className="text-muted-foreground">Target</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-green-600">{(lineSummary?.totalProductionQty || 0).toLocaleString()}</div>
                        <div className="text-muted-foreground">Production</div>
                      </div>

                      <div className="text-center">
                        <div className="font-bold text-orange-600">{(lineSummary?.totalNetAmount || 0).toLocaleString()}</div>
                        <div className="text-muted-foreground">Net Amount (BDT)</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0 sm:p-0">
                {isMobile ? (
                  // Mobile Simplified Table Layout
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Style No</TableHead>
                          <TableHead className="text-center w-24">Production</TableHead>
                          <TableHead className="text-right w-16">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLineReports.map((report) => {
                          return (
                            <TableRow key={report.id}>
                              <TableCell className="font-medium text-sm">
                                <div className="flex flex-col">
                                  <span>{report.styleNo}</span>
                                  <span className="text-xs text-muted-foreground truncate">
                                    {report.productionList.buyer}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center">
                                  <span className="font-mono text-sm font-medium">
                                    {report.productionQty.toLocaleString()}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    / {report.targetQty.toLocaleString()}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => onViewReport(report, lineNo)}
                                >
                                  <IconEye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {filteredLineReports.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-6 text-sm text-muted-foreground">
                              No reports for this line
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  // Desktop Table Layout
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Style No</TableHead>
                          <TableHead>Buyer</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead>Target Qty</TableHead>
                          <TableHead>Production Qty</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Net Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLineReports.map((report) => {
                          return (
                            <TableRow key={report.id}>
                              <TableCell className="font-medium">{report.styleNo}</TableCell>
                              <TableCell>{report.productionList.buyer}</TableCell>
                              <TableCell>{report.productionList.item}</TableCell>
                              <TableCell className="font-mono">{(report.targetQty || 0).toLocaleString()}</TableCell>
                              <TableCell className="font-mono">{(report.productionQty || 0).toLocaleString()}</TableCell>
                              <TableCell className="font-mono">${Number(report.unitPrice || 0).toFixed(2)}</TableCell>
                              <TableCell className="font-mono">${Number(report.totalAmount || 0).toLocaleString()}</TableCell>
                              <TableCell className="font-mono text-green-600 font-semibold">{Number(report.netAmount || 0).toLocaleString()}</TableCell>
                            </TableRow>
                          );
                        })}
                        {filteredLineReports.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                              No reports for this line
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

      {/* Reports without line assignment */}
      {reportsWithoutLine.length > 0 && (lineFilter === 'all' || lineFilter === '') && (
        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <span>Unassigned Production Reports</span>
            </CardTitle>
            <CardDescription>
              Reports without line assignment for {format(selectedDate, 'PPP')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            {isMobile ? (
              // Mobile Simplified Table Layout
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Style No</TableHead>
                      <TableHead className="text-center w-24">Production</TableHead>
                      <TableHead className="text-right w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterReports(reportsWithoutLine).map((report) => {
                      return (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium text-sm">
                            <div className="flex flex-col">
                              <span>{report.styleNo}</span>
                              <span className="text-xs text-muted-foreground truncate">
                                {report.productionList.buyer}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-mono text-sm font-medium">
                                {report.productionQty.toLocaleString()}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                / {report.targetQty.toLocaleString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => onViewReport(report)}
                            >
                              <IconEye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filterReports(reportsWithoutLine).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-sm text-muted-foreground">
                          No unassigned reports found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              // Desktop Table Layout
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Style No</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Target Qty</TableHead>
                      <TableHead>Production Qty</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Net Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterReports(reportsWithoutLine).map((report) => {
                      return (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">{report.styleNo}</TableCell>
                          <TableCell>{report.productionList.buyer}</TableCell>
                          <TableCell>{report.productionList.item}</TableCell>
                          <TableCell className="font-mono">{(report.targetQty || 0).toLocaleString()}</TableCell>
                          <TableCell className="font-mono">{(report.productionQty || 0).toLocaleString()}</TableCell>
                          <TableCell className="font-mono">${Number(report.unitPrice || 0).toFixed(2)}</TableCell>
                          <TableCell className="font-mono">${Number(report.totalAmount || 0).toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-green-600 font-semibold">{Number(report.netAmount || 0).toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                    {filterReports(reportsWithoutLine).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                          No unassigned reports found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
