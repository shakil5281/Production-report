'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { IconPlus } from '@tabler/icons-react'
// import { DataTable } from './component/DataTable'
import dynamic from 'next/dynamic'

const ProductionTabs = dynamic(
  () => import('./component/Tabs').then((mod) => mod.ProductionTabs),
  { ssr: false }
);

export default function page() {
  return (
    <div>
      <div>
        <div className='flex items-center justify-between mb-4'>
          <h1 className='text-xl font-semibold text-primary'>Production Report</h1>
          <Button variant='outline'><IconPlus />Add Item</Button>
        </div>
      </div>
      <div>
        <div>
         {/* <DataTable /> */}
         <ProductionTabs />
        </div>
      </div>
    </div>
  )
}
