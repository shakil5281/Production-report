import { ChartAreaInteractive } from "@/components/layout/chart-area-interactive"
import { DataTable } from "@/components/layout/data-table"
import { SectionCards } from "@/components/layout/section-cards"

import data from "./data.json"

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={data} />
    </div>
  )
}
