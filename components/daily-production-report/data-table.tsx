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
  isMobile: boolean;
  onViewReport: (report: DailyProductionReport, lineNo?: string) => void;
  productionHours: Record<string, number>;
}

export function DataTable({
  reportsByLine,
  reportsWithoutLine,
  lineSummaries,
  selectedDate,
  isMobile,
  onViewReport,
  productionHours = {}
}: DataTableProps) {
  // Check if we have any data to display
  const hasData = Object.keys(reportsByLine).length > 0 || reportsWithoutLine.length > 0;

  if (!hasData) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-2">
            <IconClipboardList className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-lg font-medium text-muted-foreground">No reports found</div>
            <div className="text-sm text-muted-foreground">
              No production reports for the selected date
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reports grouped by lines */}
      {Object.entries(reportsByLine).map(([lineNo, lineReports]) => {
        const lineSummary = lineSummaries[lineNo];

        return (
          <Card key={lineNo}>
            <CardHeader className="bg-muted/50">
              <div className="flex items-center justify-between">
                <div className='py-2'>
                  <CardTitle className="flex items-center gap-2">
                    <span>Line {lineNo} Production Report</span>
                  </CardTitle>
                  <CardDescription>
                    Production performance for {format(selectedDate, 'PPP')}
                  </CardDescription>
                </div>
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
                        <TableHead className="text-center w-24">Targets</TableHead>
                        <TableHead className="text-right w-16">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineReports.map((report) => {
                        return (
                          <TableRow key={report.id}>
                            <TableCell className="font-medium text-sm">
                              <div className="flex flex-col">
                                <span>{report.styleNo}</span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {report.productionList.buyer} - {report.productionList.item}
                                </span>
                              </div>
                            </TableCell>
                                                         <TableCell className="text-center">
                               <div className="flex flex-col items-center">
                                 <span className="font-medium">{(report.targetQty || 0) * (productionHours[`${report.lineNo}-${report.styleNo}`] || 1)}</span>
                                 <span className="text-xs text-muted-foreground">
                                   targets ({(productionHours[`${report.lineNo}-${report.styleNo}`] || 1)}h)
                                 </span>
                               </div>
                             </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewReport(report, lineNo)}
                                className="h-8 w-8 p-0"
                              >
                                <IconEye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                // Desktop Full Table Layout
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Style No</TableHead>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-center">Targets</TableHead>
                        <TableHead className="text-center">Production Qty</TableHead>
                        <TableHead className="text-center">Unit Price</TableHead>
                        <TableHead className="text-center">Total Amount</TableHead>
                        <TableHead className="text-center">%</TableHead>
                        <TableHead className="text-center">Net Amount</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineReports.map((report) => {
                        // Calculate targets: Target Qty * actual production hours
                        const key = `${report.lineNo}-${report.styleNo}`;
                        const hours = productionHours[key] || 1; // Use actual hours or default to 1
                        const targets = (report.targetQty || 0) * hours;
                        
                        return (
                          <TableRow key={report.id}>
                            <TableCell className="font-medium">{report.styleNo}</TableCell>
                            <TableCell>{report.productionList.buyer}</TableCell>
                            <TableCell>{report.productionList.item}</TableCell>
                            <TableCell className="text-center font-mono">{targets.toLocaleString()}</TableCell>
                            <TableCell className="text-center font-mono">{(report.productionQty || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-center font-mono">${Number(report.unitPrice || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-center font-mono">${Number(report.totalAmount || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-center font-mono text-blue-600 font-semibold">{Number(report.productionList?.percentage || 0).toFixed(2)}%</TableCell>
                            <TableCell className="text-center font-mono text-green-600 font-semibold">{Number(report.netAmount || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewReport(report, lineNo)}
                                className="h-8 w-8 p-0"
                              >
                                <IconEye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            
            {/* Footer with Line Totals */}
            {lineSummary && (
              <div className="bg-muted/30 p-4 border-t">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                  <div className="text-center">
                                                         <div className="font-bold text-blue-600">{(() => {
                     let total = 0;
                     lineReports.forEach(report => {
                       const key = `${report.lineNo}-${report.styleNo}`;
                       const hours = productionHours[key] || 1;
                       total += (report.targetQty || 0) * hours;
                     });
                     return total.toLocaleString();
                   })()}</div>
                   <div className="text-muted-foreground">Total Targets (actual hours)</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-green-600">{(lineSummary?.totalProductionQty || 0).toLocaleString()}</div>
                    <div className="text-muted-foreground">Total Production</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-purple-600">${(lineSummary?.totalUnitPrice || 0).toLocaleString()}</div>
                    <div className="text-muted-foreground">Total UNIT PRICE</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-cyan-600">${(lineSummary?.totalAmount || 0).toLocaleString()}</div>
                    <div className="text-muted-foreground">Total Amount</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-blue-600">{(lineSummary?.averagePercentage || 0).toFixed(2)}%</div>
                    <div className="text-muted-foreground">Average %</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-orange-600">{(lineSummary?.totalNetAmount || 0).toLocaleString()}</div>
                    <div className="text-muted-foreground">Net Amount (BDT)</div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        );
      })}

      {/* Reports without line assignment */}
      {reportsWithoutLine.length > 0 && (
        <Card>
          <CardHeader className="bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span>Unassigned Production Reports</span>
                </CardTitle>
                <CardDescription>
                  Production reports not assigned to any line for {format(selectedDate, 'PPP')}
                </CardDescription>
              </div>
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
                    {reportsWithoutLine.map((report) => {
                      return (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium text-sm">
                            <div className="flex flex-col">
                              <span>{report.styleNo}</span>
                              <span className="text-xs text-muted-foreground truncate">
                                {report.productionList.buyer} - {report.productionList.item}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-medium">{report.productionQty}</span>
                                                             <span className="text-xs text-muted-foreground">
                                 {(report.targetQty || 0) * (productionHours[`${report.lineNo || 'unassigned'}-${report.styleNo}`] || 1)} targets
                               </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewReport(report)}
                              className="h-8 w-8 p-0"
                            >
                              <IconEye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              // Desktop Full Table Layout
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Style No</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center">Targets</TableHead>
                      <TableHead className="text-center">Production Qty</TableHead>
                      <TableHead className="text-center">Unit Price</TableHead>
                      <TableHead className="text-center">Total Amount</TableHead>
                      <TableHead className="text-center">%</TableHead>
                      <TableHead className="text-center">Net Amount</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportsWithoutLine.map((report) => {
                      return (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">{report.styleNo}</TableCell>
                          <TableCell>{report.productionList.buyer}</TableCell>
                          <TableCell>{report.productionList.item}</TableCell>
                                                     <TableCell className="text-center font-mono">{((report.targetQty || 0) * (productionHours[`${report.lineNo || 'unassigned'}-${report.styleNo}`] || 1)).toLocaleString()}</TableCell>
                          <TableCell className="text-center font-mono">{(report.productionQty || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-center font-mono">${Number(report.unitPrice || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-center font-mono">${Number(report.totalAmount || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-center font-mono text-blue-600 font-semibold">{Number(report.productionList?.percentage || 0).toFixed(2)}%</TableCell>
                          <TableCell className="text-center font-mono text-green-600 font-semibold">{Number(report.netAmount || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewReport(report)}
                              className="h-8 w-8 p-0"
                            >
                              <IconEye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          
          {/* Footer with Unassigned Reports Totals */}
          {reportsWithoutLine.length > 0 && (
            <div className="bg-muted/20 p-4 border-t">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                <div className="text-center">
                                     <div className="font-bold text-blue-600">
                     {reportsWithoutLine.reduce((sum, report) => {
                       const key = `${report.lineNo || 'unassigned'}-${report.styleNo}`;
                       const hours = productionHours[key] || 1;
                       return sum + ((report.targetQty || 0) * hours);
                     }, 0).toLocaleString()}
                   </div>
                   <div className="text-muted-foreground">Total Targets (actual hours)</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-600">
                    {reportsWithoutLine.reduce((sum, report) => sum + (report.productionQty || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-muted-foreground">Total Production</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-purple-600">
                    ${reportsWithoutLine.reduce((sum, report) => sum + Number(report.unitPrice || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-muted-foreground">Total UNIT PRICE</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-cyan-600">
                    ${reportsWithoutLine.reduce((sum, report) => sum + Number(report.totalAmount || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-muted-foreground">Total Amount</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-600">
                    {(reportsWithoutLine.reduce((sum, report) => sum + Number(report.productionList?.percentage || 0), 0) / Math.max(reportsWithoutLine.length, 1)).toFixed(2)}%
                  </div>
                  <div className="text-muted-foreground">Average %</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-orange-600">
                    {reportsWithoutLine.reduce((sum, report) => sum + Number(report.netAmount || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-muted-foreground">Net Amount (BDT)</div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Overall Totals Footer */}
      {hasData && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <CardHeader className="bg-blue-100/50">
            <CardTitle className="text-lg font-bold text-blue-800 text-center">
              📊 OVERALL TOTALS - {format(selectedDate, 'PPP')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-6 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-600">
                  {(() => {
                                         let total = 0;
                     // Add totals from line reports
                     Object.entries(reportsByLine).forEach(([lineNo, lineReports]) => {
                       total += lineReports.reduce((sum, report) => {
                         const key = `${report.lineNo}-${report.styleNo}`;
                         const hours = productionHours[key] || 1;
                         return sum + ((report.targetQty || 0) * hours);
                       }, 0);
                     });
                     // Add totals from unassigned reports
                     total += reportsWithoutLine.reduce((sum, report) => {
                       const key = `${report.lineNo || 'unassigned'}-${report.styleNo}`;
                       const hours = productionHours[key] || 1;
                       return sum + ((report.targetQty || 0) * hours);
                     }, 0);
                     return total.toLocaleString();
                  })()}
                </div>
                                 <div className="text-sm font-medium text-blue-700">Total Targets (actual hours)</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-600">
                  {(() => {
                    let total = 0;
                    // Add totals from line reports
                    Object.entries(reportsByLine).forEach(([lineNo, lineReports]) => {
                      total += lineReports.reduce((sum, report) => sum + (report.productionQty || 0), 0);
                    });
                    // Add totals from unassigned reports
                    total += reportsWithoutLine.reduce((sum, report) => sum + (report.productionQty || 0), 0);
                    return total.toLocaleString();
                  })()}
                </div>
                <div className="text-sm font-medium text-green-700">Total Production Qty</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-2xl font-bold text-purple-600">
                  ${(() => {
                    let total = 0;
                    // Add totals from line reports
                    Object.entries(reportsByLine).forEach(([lineNo, lineReports]) => {
                      total += lineReports.reduce((sum, report) => sum + Number(report.unitPrice || 0), 0);
                    });
                    // Add totals from unassigned reports
                    total += reportsWithoutLine.reduce((sum, report) => sum + Number(report.unitPrice || 0), 0);
                    return total.toLocaleString();
                  })()}
                </div>
                <div className="text-sm font-medium text-purple-700">Total UNIT PRICE</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-2xl font-bold text-cyan-600">
                  ${(() => {
                    let total = 0;
                    // Add totals from line reports
                    Object.entries(reportsByLine).forEach(([lineNo, lineReports]) => {
                      total += lineReports.reduce((sum, report) => sum + Number(report.totalAmount || 0), 0);
                    });
                    // Add totals from unassigned reports
                    total += reportsWithoutLine.reduce((sum, report) => sum + Number(report.totalAmount || 0), 0);
                    return total.toLocaleString();
                  })()}
                </div>
                <div className="text-sm font-medium text-cyan-700">Total Amount</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-600">
                  {(() => {
                    let total = 0;
                    let count = 0;
                    // Add totals from line reports
                    Object.entries(reportsByLine).forEach(([lineNo, lineReports]) => {
                      total += lineReports.reduce((sum, report) => sum + Number(report.productionList?.percentage || 0), 0);
                      count += lineReports.length;
                    });
                    // Add totals from unassigned reports
                    total += reportsWithoutLine.reduce((sum, report) => sum + Number(report.productionList?.percentage || 0), 0);
                    count += reportsWithoutLine.length;
                    return count > 0 ? (total / count).toFixed(2) : '0.00';
                  })()}%
                </div>
                <div className="text-sm font-medium text-blue-700">Average %</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-2xl font-bold text-orange-600">
                  {(() => {
                    let total = 0;
                    // Add totals from line reports
                    Object.entries(reportsByLine).forEach(([lineNo, lineReports]) => {
                      total += lineReports.reduce((sum, report) => sum + Number(report.netAmount || 0), 0);
                    });
                    // Add totals from unassigned reports
                    total += reportsWithoutLine.reduce((sum, report) => sum + Number(report.netAmount || 0), 0);
                    return total.toLocaleString();
                  })()}
                </div>
                <div className="text-sm font-medium text-orange-700">Net Amount (BDT)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
