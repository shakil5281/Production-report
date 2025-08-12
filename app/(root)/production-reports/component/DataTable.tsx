"use client"
import * as React from "react"
import { DndContext, closestCenter } from "@dnd-kit/core"
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { productionData, ProductionRecord } from "../data/productionData"
import { tableColumns } from "./TableColumns"
import { DraggableRow } from "./DraggableRow"
import { DragHandle } from "./DragHandle"
import { TableCellViewer } from "./TableCellViewer"
import { Filters, StatusFilter } from "./Filters"
import { Pagination } from "./Pagination"
import { ProductionTabs } from "./Tabs"

export function DataTable() {
  // local data for demonstration — you can lift this up to context or server state
  const [data, setData] = React.useState<ProductionRecord[]>(productionData)
  const [status, setStatus] = React.useState<StatusFilter>("running")
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(5)

  // filtering
  const filtered = React.useMemo(() => {
    const byStatus = status === "all" ? data : data.filter((d) => d.status === status)
    if (!search) return byStatus
    const q = search.toLowerCase()
    return byStatus.filter(
      (d) =>
        String(d.id).includes(q) ||
        d.programCode.toLowerCase().includes(q) ||
        d.buyer.toLowerCase().includes(q) ||
        d.item.toLowerCase().includes(q)
    )
  }, [data, status, search])

  // pagination slice
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * pageSize
  const paged = filtered.slice(start, start + pageSize)

  // DnD handlers (reordering the main data array by id)
  const handleDragEnd = ({ active, over }: any) => {
    if (!active || !over || active.id === over.id) return
    setData((prev) => {
      const ids = prev.map((p) => String(p.id))
      const oldIndex = ids.indexOf(String(active.id))
      const newIndex = ids.indexOf(String(over.id))
      if (oldIndex === -1 || newIndex === -1) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  return (
    <div className="space-y-4">
      {/* <Filters status={status} onStatusChange={setStatus} search={search} onSearchChange={setSearch} /> */}
      {/* <ProductionTabs /> */}

      <div className="rounded-lg border overflow-hidden">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                <TableHead />
                {tableColumns.map((c) => (
                  <TableHead key={c.accessor}>{c.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={tableColumns.length + 1} className="text-center py-8">
                    No results.
                  </TableCell>
                </TableRow>
              ) : (
                <SortableContext items={data.map((d) => String(d.id))} strategy={verticalListSortingStrategy}>
                  {paged.map((row) => (
                    <DraggableRow
                      key={row.id}
                      // create a fake TanStack Row-like object for the DraggableRow to render default cells
                      row={{
                        id: String(row.id),
                        original: row,
                        getVisibleCells: () => [],
                        getIsSelected: () => false,
                      } as any}
                    >
                      {/* custom children cells for rendering */}
                      <TableCell className="w-8">
                        <DragHandle id={String(row.id)} />
                      </TableCell>
                      <TableCell>
                        <TableCellViewer item={row} />
                      </TableCell>
                      <TableCell>{row.programCode}</TableCell>
                      <TableCell>{row.buyer}</TableCell>
                      <TableCell>{row.quantity}</TableCell>
                      <TableCell>{row.item}</TableCell>
                      <TableCell>${row.price}</TableCell>
                    </DraggableRow>
                  ))}
                </SortableContext>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      <Pagination
        page={currentPage}
        pageSize={pageSize}
        total={filtered.length}
        onPageChange={(p) => setPage(Math.max(1, Math.min(p, pageCount)))}
        onPageSizeChange={(s) => {
          setPageSize(s)
          setPage(1)
        }}
      />
    </div>
  )
}
