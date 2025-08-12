"use client"
import * as React from "react"
import { Row } from "@tanstack/react-table"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { TableRow, TableCell } from "@/components/ui/table"
import { ProductionRecord } from "../data/productionData"

export function DraggableRow({
  row,
  children,
}: {
  row: Row<ProductionRecord>
  children?: React.ReactNode
}) {
  // Use string id for dnd-kit
  const id = String(row.original.id)
  const { setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  return (
    <TableRow
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      data-dragging={isDragging ? "true" : undefined}
      className="data-[dragging=true]:opacity-80"
    >
      {/* If children provided, render them (cells). Otherwise render default cells */}
      {children ?? (
        <>
          <TableCell>{row.original.id}</TableCell>
          <TableCell>{row.original.programCode}</TableCell>
          <TableCell>{row.original.buyer}</TableCell>
          <TableCell>{row.original.quantity}</TableCell>
          <TableCell>{row.original.item}</TableCell>
          <TableCell>${row.original.price}</TableCell>
        </>
      )}
    </TableRow>
  )
}
