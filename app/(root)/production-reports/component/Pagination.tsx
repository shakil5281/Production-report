"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (p: number) => void
  onPageSizeChange: (s: number) => void
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Label>Rows per page</Label>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="w-20" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="top">
            {[5, 10, 20, 50].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(1)} disabled={page <= 1}>
          {"<<"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          {"<"}
        </Button>
        <div className="px-2">
          Page {page} of {pageCount}
        </div>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}>
          {">"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(pageCount)} disabled={page >= pageCount}>
          {">>"}
        </Button>
      </div>
    </div>
  )
}
