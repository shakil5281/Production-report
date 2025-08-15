'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ResponsiveTableProps extends React.ComponentProps<'div'> {
  data: any[];
  columns: Array<{
    key: string;
    label: string;
    className?: string;
    hideOnMobile?: boolean;
    render?: (value: any, row: any) => React.ReactNode;
  }>;
  emptyMessage?: string;
  mobileCardRender?: (row: any, index: number) => React.ReactNode;
}

export function ResponsiveTable({
  data,
  columns,
  emptyMessage = 'No data available',
  mobileCardRender,
  className,
  ...props
}: ResponsiveTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)} {...props}>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <ScrollArea className="w-full">
          <div className="overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        'h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
                        column.className
                      )}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {data.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          'p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
                          column.className
                        )}
                      >
                        {column.render
                          ? column.render(row[column.key], row)
                          : row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {data.map((row, index) => (
          <Card key={index} className="p-0">
            <CardContent className="p-4">
              {mobileCardRender ? (
                mobileCardRender(row, index)
              ) : (
                <div className="space-y-2">
                  {columns
                    .filter((column) => !column.hideOnMobile)
                    .map((column) => (
                      <div key={column.key} className="flex justify-between items-start">
                        <span className="text-sm font-medium text-muted-foreground min-w-0 flex-1">
                          {column.label}:
                        </span>
                        <span className="text-sm ml-2 text-right">
                          {column.render
                            ? column.render(row[column.key], row)
                            : row[column.key]}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
