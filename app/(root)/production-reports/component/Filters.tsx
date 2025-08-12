"use client"
import * as React from "react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type StatusFilter = "all" | "running" | "pending" | "complete"

export function Filters({
  status,
  onStatusChange,
  search,
  onSearchChange,
}: {
  status: StatusFilter
  onStatusChange: (s: StatusFilter) => void
  search: string
  onSearchChange: (q: string) => void
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex items-center gap-2">
        <Label className="text-sm">Status</Label>
        <Select value={status} onValueChange={(v) => onStatusChange(v as StatusFilter)}>
          <SelectTrigger className="w-44" size="sm">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 flex-1">
        <Label className="sr-only">Search</Label>
        <Input
          placeholder="Search program code, buyer, or item..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  )
}
