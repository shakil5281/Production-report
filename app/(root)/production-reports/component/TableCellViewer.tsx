"use client"
import * as React from "react"
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ProductionRecord } from "../data/productionData"

export function TableCellViewer({ item }: { item: ProductionRecord }) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="link" className="px-0 text-left">
          {item.programCode}
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Record #{item.id}</DrawerTitle>
          <DrawerDescription>Details for {item.programCode}</DrawerDescription>
        </DrawerHeader>

        <div className="p-4 grid gap-4">
          <div>
            <Label>Buyer</Label>
            <Input value={item.buyer} readOnly />
          </div>
          <div>
            <Label>Item</Label>
            <Input value={item.item} readOnly />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Quantity</Label>
              <Input value={String(item.quantity)} readOnly />
            </div>
            <div>
              <Label>Price</Label>
              <Input value={`$${item.price}`} readOnly />
            </div>
          </div>
          <div>
            <Label>Status</Label>
            <Input value={item.status} readOnly />
          </div>
        </div>

        <DrawerFooter>
          <Button>Close</Button>
          <DrawerClose asChild>
            <Button variant="outline">Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
