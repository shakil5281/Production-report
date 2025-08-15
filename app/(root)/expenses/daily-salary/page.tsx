"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, PlusIcon, UserIcon, DollarSignIcon, ClockIcon } from "lucide-react"
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

interface DailySalaryEntry {
  id: string
  employeeId: string
  employeeName: string
  position: string
  baseSalary: number
  overtime: number
  bonus: number
  deductions: number
  netSalary: number
  date: string
  paymentStatus: "paid" | "pending" | "processing"
}

const mockData: DailySalaryEntry[] = [
  {
    id: "1",
    employeeId: "EMP001",
    employeeName: "John Doe",
    position: "Production Worker",
    baseSalary: 120.00,
    overtime: 30.00,
    bonus: 10.00,
    deductions: 5.00,
    netSalary: 155.00,
    date: "2024-01-15",
    paymentStatus: "paid"
  },
  {
    id: "2",
    employeeId: "EMP002",
    employeeName: "Jane Smith",
    position: "Supervisor",
    baseSalary: 180.00,
    overtime: 45.00,
    bonus: 25.00,
    deductions: 10.00,
    netSalary: 240.00,
    date: "2024-01-15",
    paymentStatus: "processing"
  },
  {
    id: "3",
    employeeId: "EMP003",
    employeeName: "Mike Johnson",
    position: "Machine Operator",
    baseSalary: 150.00,
    overtime: 22.50,
    bonus: 15.00,
    deductions: 7.50,
    netSalary: 180.00,
    date: "2024-01-15",
    paymentStatus: "pending"
  }
]

export default function DailySalaryPage() {
  const [salaryData, setSalaryData] = useState<DailySalaryEntry[]>(mockData)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  // Filter data based on search and status filter
  const filteredData = salaryData.filter(entry => {
    const matchesSearch = entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || entry.paymentStatus === filterStatus
    return matchesSearch && matchesStatus
  })

  // Calculate summary statistics
  const totalEmployees = filteredData.length
  const totalBaseSalary = filteredData.reduce((sum, entry) => sum + entry.baseSalary, 0)
  const totalOvertime = filteredData.reduce((sum, entry) => sum + entry.overtime, 0)
  const totalNetSalary = filteredData.reduce((sum, entry) => sum + entry.netSalary, 0)

  // Payment status counts
  const paidCount = filteredData.filter(entry => entry.paymentStatus === "paid").length
  const pendingCount = filteredData.filter(entry => entry.paymentStatus === "pending").length

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0 lg:gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Daily Salary Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track daily salary payments, overtime, and bonuses
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <PlusIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Salary Entry</span>
              <span className="sm:hidden">Add Entry</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="mx-4 sm:mx-0 sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Daily Salary Entry</DialogTitle>
              <DialogDescription>
                Enter employee salary details for daily payment processing.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input id="employeeId" placeholder="EMP001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeeName">Employee Name</Label>
                  <Input id="employeeName" placeholder="John Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input id="position" placeholder="Production Worker" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baseSalary">Base Salary ($)</Label>
                  <Input id="baseSalary" type="number" step="0.01" placeholder="120.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overtime">Overtime ($)</Label>
                  <Input id="overtime" type="number" step="0.01" placeholder="30.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bonus">Bonus ($)</Label>
                  <Input id="bonus" type="number" step="0.01" placeholder="10.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deductions">Deductions ($)</Label>
                  <Input id="deductions" type="number" step="0.01" placeholder="5.00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={() => setIsDialogOpen(false)}>Save Entry</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Employees</CardTitle>
            <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-lg sm:text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              {paidCount} paid, {pendingCount} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Base Salary</CardTitle>
            <DollarSignIcon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-lg sm:text-2xl font-bold">${totalBaseSalary.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Daily base salaries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Overtime Pay</CardTitle>
            <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-lg sm:text-2xl font-bold">${totalOvertime.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Extra hours compensation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Net Payroll</CardTitle>
            <DollarSignIcon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-lg sm:text-2xl font-bold">${totalNetSalary.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total daily payroll</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Salary Records</CardTitle>
          <CardDescription>
            Manage daily salary payments and track compensation details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by employee name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Base Salary</TableHead>
                  <TableHead>Overtime</TableHead>
                  <TableHead>Bonus</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.employeeId}</TableCell>
                    <TableCell>{entry.employeeName}</TableCell>
                    <TableCell>{entry.position}</TableCell>
                    <TableCell>${entry.baseSalary.toFixed(2)}</TableCell>
                    <TableCell>${entry.overtime.toFixed(2)}</TableCell>
                    <TableCell>${entry.bonus.toFixed(2)}</TableCell>
                    <TableCell>${entry.deductions.toFixed(2)}</TableCell>
                    <TableCell className="font-medium">${entry.netSalary.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          entry.paymentStatus === "paid" ? "default" :
                          entry.paymentStatus === "processing" ? "secondary" : "destructive"
                        }
                      >
                        {entry.paymentStatus}
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
