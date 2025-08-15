"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, PlusIcon, TrendingUpIcon, LayersIcon, ScissorsIcon, PackageIcon } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface DailyInputEntry {
  id: string
  batchNumber: string
  styleNumber: string
  color: string
  fabricType: string
  quantity: number
  cuttingLine: string
  operator: string
  receivedTime: string
  priority: "high" | "medium" | "low"
  orderNumber: string
  notes: string
  status: "received" | "in-cutting" | "completed"
}

const mockData: DailyInputEntry[] = [
  {
    id: "1",
    batchNumber: "BATCH-001",
    styleNumber: "STY-001",
    color: "Navy Blue",
    fabricType: "Cotton Twill",
    quantity: 150,
    cuttingLine: "Line A",
    operator: "John Cutter",
    receivedTime: "08:30:00",
    priority: "high",
    orderNumber: "ORD-2024-001",
    notes: "Rush order for premium client",
    status: "in-cutting"
  },
  {
    id: "2",
    batchNumber: "BATCH-002",
    styleNumber: "STY-002",
    color: "Black",
    fabricType: "Polyester Blend",
    quantity: 200,
    cuttingLine: "Line B",
    operator: "Jane Expert",
    receivedTime: "09:15:00",
    priority: "medium",
    orderNumber: "ORD-2024-002",
    notes: "Standard production batch",
    status: "received"
  },
  {
    id: "3",
    batchNumber: "BATCH-003",
    styleNumber: "STY-003",
    color: "White",
    fabricType: "Cotton Canvas",
    quantity: 120,
    cuttingLine: "Line C",
    operator: "Mike Senior",
    receivedTime: "10:45:00",
    priority: "low",
    orderNumber: "ORD-2024-003",
    notes: "Quality check required",
    status: "completed"
  }
]

const fabricTypes = [
  "Cotton Twill",
  "Polyester Blend", 
  "Cotton Canvas",
  "Denim",
  "Linen",
  "Silk",
  "Wool",
  "Synthetic Blend"
]

const cuttingLines = [
  "Line A",
  "Line B",
  "Line C", 
  "Line D"
]

export default function DailyInputPage() {
  const [inputData, setInputData] = useState<DailyInputEntry[]>(mockData)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")

  // Filter data based on search and filters
  const filteredData = inputData.filter(entry => {
    const matchesSearch = entry.styleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.operator.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || entry.status === filterStatus
    const matchesPriority = filterPriority === "all" || entry.priority === filterPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  // Calculate summary statistics
  const totalQuantity = filteredData.reduce((sum, entry) => sum + entry.quantity, 0)
  const receivedCount = filteredData.filter(entry => entry.status === "received").length
  const inCuttingCount = filteredData.filter(entry => entry.status === "in-cutting").length
  const completedCount = filteredData.filter(entry => entry.status === "completed").length
  const highPriorityCount = filteredData.filter(entry => entry.priority === "high").length

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0 lg:gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Daily Input Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track and manage daily fabric input for cutting operations
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <PlusIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Input Entry</span>
              <span className="sm:hidden">Add Entry</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="mx-4 sm:mx-0 sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Input Entry</DialogTitle>
              <DialogDescription>
                Record new fabric input for cutting department processing.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchNumber">Batch Number</Label>
                  <Input id="batchNumber" placeholder="BATCH-004" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orderNumber">Order Number</Label>
                  <Input id="orderNumber" placeholder="ORD-2024-004" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="styleNumber">Style Number</Label>
                  <Input id="styleNumber" placeholder="STY-004" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input id="color" placeholder="Royal Blue" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fabricType">Fabric Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fabric type" />
                    </SelectTrigger>
                    <SelectContent>
                      {fabricTypes.map(fabric => (
                        <SelectItem key={fabric} value={fabric.toLowerCase().replace(/\s+/g, '-')}>
                          {fabric}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" type="number" placeholder="150" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cuttingLine">Cutting Line</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cutting line" />
                    </SelectTrigger>
                    <SelectContent>
                      {cuttingLines.map(line => (
                        <SelectItem key={line} value={line.toLowerCase().replace(/\s+/g, '-')}>
                          {line}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="operator">Operator</Label>
                  <Input id="operator" placeholder="John Cutter" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="Additional notes or special instructions..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={() => setIsDialogOpen(false)}>Add Entry</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Quantity</CardTitle>
            <PackageIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">{totalQuantity}</div>
            <p className="text-xs text-muted-foreground">Pieces received</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">In Cutting</CardTitle>
            <ScissorsIcon className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-lg sm:text-2xl font-bold text-green-600">{inCuttingCount}</div>
            <p className="text-xs text-muted-foreground">Currently processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Completed</CardTitle>
            <TrendingUpIcon className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-lg sm:text-2xl font-bold text-purple-600">{completedCount}</div>
            <p className="text-xs text-muted-foreground">Finished batches</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">High Priority</CardTitle>
            <LayersIcon className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-lg sm:text-2xl font-bold text-red-600">{highPriorityCount}</div>
            <p className="text-xs text-muted-foreground">Urgent batches</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Current status of all batches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 border rounded-lg bg-blue-50">
                <span className="font-medium">Received</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {receivedCount}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg bg-green-50">
                <span className="font-medium">In Cutting</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {inCuttingCount}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg bg-purple-50">
                <span className="font-medium">Completed</span>
                <Badge variant="outline" className="bg-purple-100 text-purple-800">
                  {completedCount}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Priority Analysis</CardTitle>
            <CardDescription>Breakdown by priority levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg bg-red-50">
                <div className="text-2xl font-bold text-red-600">
                  {filteredData.filter(e => e.priority === "high").length}
                </div>
                <div className="text-sm text-muted-foreground">High Priority</div>
                <div className="text-xs text-red-600 mt-1">
                  {filteredData.filter(e => e.priority === "high").reduce((sum, e) => sum + e.quantity, 0)} pieces
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg bg-yellow-50">
                <div className="text-2xl font-bold text-yellow-600">
                  {filteredData.filter(e => e.priority === "medium").length}
                </div>
                <div className="text-sm text-muted-foreground">Medium Priority</div>
                <div className="text-xs text-yellow-600 mt-1">
                  {filteredData.filter(e => e.priority === "medium").reduce((sum, e) => sum + e.quantity, 0)} pieces
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg bg-green-50">
                <div className="text-2xl font-bold text-green-600">
                  {filteredData.filter(e => e.priority === "low").length}
                </div>
                <div className="text-sm text-muted-foreground">Low Priority</div>
                <div className="text-xs text-green-600 mt-1">
                  {filteredData.filter(e => e.priority === "low").reduce((sum, e) => sum + e.quantity, 0)} pieces
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Input Records</CardTitle>
          <CardDescription>
            Detailed record of daily fabric input entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by batch, style, color, or operator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="in-cutting">In Cutting</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-full sm:w-[130px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Number</TableHead>
                  <TableHead>Style Number</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Fabric Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Cutting Line</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.batchNumber}</TableCell>
                    <TableCell className="font-medium">{entry.styleNumber}</TableCell>
                    <TableCell>{entry.color}</TableCell>
                    <TableCell>{entry.fabricType}</TableCell>
                    <TableCell className="font-medium">{entry.quantity}</TableCell>
                    <TableCell>{entry.cuttingLine}</TableCell>
                    <TableCell>{entry.operator}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          entry.priority === "high" ? "destructive" :
                          entry.priority === "medium" ? "secondary" : "outline"
                        }
                      >
                        {entry.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          entry.status === "completed" ? "default" :
                          entry.status === "in-cutting" ? "secondary" : "outline"
                        }
                      >
                        {entry.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
