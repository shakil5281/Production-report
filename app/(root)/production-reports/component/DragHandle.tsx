"use client"
import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { IconGripVertical } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({ id })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
      aria-label="Drag to reorder"
    >
      <IconGripVertical className="size-4" />
      <span className="sr-only">Drag</span>
    </Button>
  )
}
