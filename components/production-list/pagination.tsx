'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from '@tabler/icons-react';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function PaginationControls({ page, pageSize, total, onPageChange, onPageSizeChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < pages;

  return (
    <div className="flex items-center justify-between px-2 py-2">
      <div className="hidden text-sm text-muted-foreground md:block">
        Page {page} of {pages}
      </div>
      <div className="flex w-full items-center gap-4 md:w-auto">
        <div className="hidden items-center gap-2 md:flex">
          <Label className="text-sm font-medium">Rows per page</Label>
          <Select value={`${pageSize}`} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="w-20" size="sm">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((n) => (
                <SelectItem key={n} value={`${n}`}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Button variant="outline" className="hidden h-8 w-8 p-0 md:flex" onClick={() => onPageChange(1)} disabled={!canPrev}>
            <span className="sr-only">First</span>
            <IconChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="h-8 w-8 p-0" onClick={() => onPageChange(page - 1)} disabled={!canPrev}>
            <span className="sr-only">Prev</span>
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="h-8 w-8 p-0" onClick={() => onPageChange(page + 1)} disabled={!canNext}>
            <span className="sr-only">Next</span>
            <IconChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="hidden h-8 w-8 p-0 md:flex" onClick={() => onPageChange(pages)} disabled={!canNext}>
            <span className="sr-only">Last</span>
            <IconChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}