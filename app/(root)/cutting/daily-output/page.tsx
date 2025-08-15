"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, PlusIcon, TrendingDownIcon, CheckCircleIcon, ScissorsIcon, AlertTriangleIcon, PackageIcon } from "lucide-react"
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

interface DailyOutputEntry {
  id: string
  batchNumber: string
  styleNumber: string
  color: string
  sizeRange: string
  quantityProduced: number
  quantityPassed: number
  quantityRejected: number
  defectType?: string
  cuttingLine: string
  operator: string
  completedTime: string
  qualityGrade: "A" | "B" | "C"
  notes: string
  status: "completed" | "in-qc" | "approved" | "rejected"
  efficiency: number
}

const mockData: DailyOutputEntry[] = [
  {
    id: "1",
    batchNumber: "BATCH-001",
    styleNumber: "STY-001",
    color: "Navy Blue",
    sizeRange: "S-XL",
    quantityProduced: 145,
    quantityPassed: 142,
    quantityRejected: 3,
    defectType: "Minor cutting variance",
    cuttingLine: "Line A",
    operator: "John Cutter",
    completedTime: "16:30:00",
    qualityGrade: "A",
    notes: "Good quality output",
    status: "approved",
    efficiency: 96.7
  },
  {
    id: "2",
    batchNumber: "BATCH-002",
    styleNumber: "STY-002",
    color: "Black",
    sizeRange: "M-XXL",
    quantityProduced: 185,
    quantityPassed: 180,
    quantityRejected: 5,
    defectType: "Edge fraying",
    cuttingLine: "Line B",
    operator: "Jane Expert",
    completedTime: "15:45:00",
    qualityGrade: "A",
    notes: "Standard production batch completed",
    status: "in-qc",
    efficiency: 97.3
  },
  {
    id: "3",
    batchNumber: "BATCH-003",
    styleNumber: "STY-003",
    color: "White",
    sizeRange: "XS-L",
    quantityProduced: 110,
    quantityPassed: 105,
    quantityRejected: 5,
    defectType: "Pattern mismatch",
    cuttingLine: "Line C",
    operator: "Mike Senior",
    completedTime: "14:20:00",
    qualityGrade: "B",
    notes: "Some pattern alignment issues",
    status: "completed",
    efficiency: 95.5
  }
]

const sizeRanges = [
  "XS-S",
  "S-M",
  "M-L",
  "L-XL",
  "XL-XXL",
  "S-XL",
  "M-XXL",
  "XS-L",
  "All Sizes"
]

const defectTypes = [
  "Minor cutting variance",
  "Edge fraying",
  "Pattern mismatch", 
  "Fabric defect",
  "Size variance",
  "Color variation",
  "Measurement error",
  "Other"
]

const cuttingLines = [
  "Line A",
  "Line B", 
  "Line C",
  "Line D"
]

export default function DailyOutputPage() {
  const [outputData, setOutputData] = useState<DailyOutputEntry[]>(mockData)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterGrade, setFilterGrade] = useState("all")

  // Filter data based on search and filters
  const filteredData = outputData.filter(entry => {
    const matchesSearch = entry.styleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.operator.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || entry.status === filterStatus
    const matchesGrade = filterGrade === "all" || entry.qualityGrade === filterGrade
    return matchesSearch && matchesStatus && matchesGrade
  })

  // Calculate summary statistics
  const totalProduced = filteredData.reduce((sum, entry) => sum + entry.quantityProduced, 0)
  const totalPassed = filteredData.reduce((sum, entry) => sum + entry.quantityPassed, 0)
  const totalRejected = filteredData.reduce((sum, entry) => sum + entry.quantityRejected, 0)
  const avgEfficiency = filteredData.length > 0 
    ? filteredData.reduce((sum, entry) => sum + entry.efficiency, 0) / filteredData.length 
    : 0
  
  const approvedCount = filteredData.filter(entry => entry.status === "approved").length
  const inQcCount = filteredData.filter(entry => entry.status === "in-qc").length
  const rejectedCount = filteredData.filter(entry => entry.status === "rejected").length

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0 lg:gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Daily Output Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track and manage daily cutting output and quality control
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <PlusIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Output Entry</span>
              <span className="sm:hidden">Add Entry</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="mx-4 sm:mx-0 sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Output Entry</DialogTitle>
              <DialogDescription>
                Record cutting output and quality control results.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchNumber">Batch Number</Label>
                  <Input id="batchNumber" placeholder="BATCH-004" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="styleNumber">Style Number</Label>
                  <Input id="styleNumber" placeholder="STY-004" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input id="color" placeholder="Royal Blue" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sizeRange">Size Range</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size range" />
                    </SelectTrigger>
                    <SelectContent>
                      {sizeRanges.map(size => (
                        <SelectItem key={size} value={size.toLowerCase().replace(/\s+/g, '-')}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantityProduced">Qty Produced</Label>
                  <Input id="quantityProduced" type="number" placeholder="150" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantityPassed">Qty Passed</Label>
                  <Input id="quantityPassed" type="number" placeholder="145" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantityRejected">Qty Rejected</Label>
                  <Input id="quantityRejected" type="number" placeholder="5" />
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qualityGrade">Quality Grade</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a">Grade A</SelectItem>
                      <SelectItem value="b">Grade B</SelectItem>
                      <SelectItem value="c">Grade C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defectType">Defect Type (if any)</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select defect type" />
                    </SelectTrigger>
                    <SelectContent>
                      {defectTypes.map(defect => (
                        <SelectItem key={defect} value={defect.toLowerCase().replace(/\s+/g, '-')}>
                          {defect}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="Additional notes about the output..." />
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
            <CardTitle className="text-xs sm:text-sm font-medium">Total Produced</CardTitle>
            <ScissorsIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">{totalProduced}</div>
            <p className="text-xs text-muted-foreground">Pieces cut today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Quality Passed</CardTitle>
            <CheckCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-lg sm:text-2xl font-bold text-green-600">{totalPassed}</div>
            <p className="text-xs text-muted-foreground">Approved pieces</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Rejected</CardTitle>
            <AlertTriangleIcon className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-lg sm:text-2xl font-bold text-red-600">{totalRejected}</div>
            <p className="text-xs text-muted-foreground">Quality failures</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Avg Efficiency</CardTitle>
            <TrendingDownIcon className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-lg sm:text-2xl font-bold text-purple-600">{avgEfficiency.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Overall efficiency</p>
          </CardContent>
        </Card>
      </div>

      {/* Quality Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quality Distribution</CardTitle>
            <CardDescription>Output quality grade breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-4 border rounded-lg bg-green-50">
                <div className="text-2xl font-bold text-green-600">
                  {filteredData.filter(e => e.qualityGrade === "A").length}
                </div>
                <div className="text-sm text-muted-foreground">Grade A</div>
                <div className="text-xs text-green-600 mt-1">
                  {filteredData.filter(e => e.qualityGrade === "A").reduce((sum, e) => sum + e.quantityPassed, 0)} pieces
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg bg-yellow-50">
                <div className="text-2xl font-bold text-yellow-600">
                  {filteredData.filter(e => e.qualityGrade === "B").length}
                </div>
                <div className="text-sm text-muted-foreground">Grade B</div>
                <div className="text-xs text-yellow-600 mt-1">
                  {filteredData.filter(e => e.qualityGrade === "B").reduce((sum, e) => sum + e.quantityPassed, 0)} pieces
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg bg-red-50">
                <div className="text-2xl font-bold text-red-600">
                  {filteredData.filter(e => e.qualityGrade === "C").length}
                </div>
                <div className="text-sm text-muted-foreground">Grade C</div>
                <div className="text-xs text-red-600 mt-1">
                  {filteredData.filter(e => e.qualityGrade === "C").reduce((sum, e) => sum + e.quantityPassed, 0)} pieces
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Processing Status</CardTitle>
            <CardDescription>Current status of output batches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 border rounded-lg bg-green-50">
                <span className="font-medium">Approved</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {approvedCount}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg bg-blue-50">
                <span className="font-medium">In QC</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {inQcCount}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg bg-red-50">
                <span className="font-medium">Rejected</span>
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  {rejectedCount}
                </Badge>
              </div>
              
              <div className="pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {((totalPassed / totalProduced) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Overall Pass Rate
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Output Records</CardTitle>
          <CardDescription>
            Detailed record of daily cutting output and quality results
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
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in-qc">In QC</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterGrade} onValueChange={setFilterGrade}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="A">Grade A</SelectItem>
                <SelectItem value="B">Grade B</SelectItem>
                <SelectItem value="C">Grade C</SelectItem>
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
                  <TableHead>Size Range</TableHead>
                  <TableHead>Produced</TableHead>
                  <TableHead>Passed</TableHead>
                  <TableHead>Rejected</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Efficiency</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.batchNumber}</TableCell>
                    <TableCell className="font-medium">{entry.styleNumber}</TableCell>
                    <TableCell>{entry.color}</TableCell>
                    <TableCell>{entry.sizeRange}</TableCell>
                    <TableCell className="font-medium">{entry.quantityProduced}</TableCell>
                    <TableCell className="text-green-600 font-medium">{entry.quantityPassed}</TableCell>
                    <TableCell className="text-red-600 font-medium">{entry.quantityRejected}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          entry.qualityGrade === "A" ? "default" :
                          entry.qualityGrade === "B" ? "secondary" : "destructive"
                        }
                      >
                        Grade {entry.qualityGrade}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{entry.efficiency.toFixed(1)}%</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          entry.status === "approved" ? "default" :
                          entry.status === "in-qc" ? "secondary" : 
                          entry.status === "rejected" ? "destructive" : "outline"
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
