"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, PlusIcon, ReceiptIcon, DollarSignIcon, TrendingUpIcon } from "lucide-react"
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

interface DailyExpenseEntry {
  id: string
  category: string
  description: string
  amount: number
  vendor: string
  receiptNumber: string
  paymentMethod: string
  approvedBy: string
  date: string
  status: "approved" | "pending" | "rejected"
}

const mockData: DailyExpenseEntry[] = [
  {
    id: "1",
    category: "Raw Materials",
    description: "Cotton fabric for production line A",
    amount: 1250.00,
    vendor: "ABC Textiles Ltd",
    receiptNumber: "RCP001",
    paymentMethod: "Bank Transfer",
    approvedBy: "John Manager",
    date: "2024-01-15",
    status: "approved"
  },
  {
    id: "2",
    category: "Utilities",
    description: "Electricity bill for manufacturing unit",
    amount: 850.00,
    vendor: "City Power Company",
    receiptNumber: "RCP002",
    paymentMethod: "Check",
    approvedBy: "Jane Supervisor",
    date: "2024-01-15",
    status: "approved"
  },
  {
    id: "3",
    category: "Maintenance",
    description: "Machine repair and spare parts",
    amount: 320.00,
    vendor: "Tech Repair Services",
    receiptNumber: "RCP003",
    paymentMethod: "Cash",
    approvedBy: "Mike Tech",
    date: "2024-01-15",
    status: "pending"
  },
  {
    id: "4",
    category: "Transportation",
    description: "Fuel for delivery vehicles",
    amount: 180.00,
    vendor: "Shell Gas Station",
    receiptNumber: "RCP004",
    paymentMethod: "Credit Card",
    approvedBy: "Sarah Fleet",
    date: "2024-01-15",
    status: "approved"
  }
]

const expenseCategories = [
  "Raw Materials",
  "Utilities", 
  "Maintenance",
  "Transportation",
  "Office Supplies",
  "Marketing",
  "Insurance",
  "Legal & Professional",
  "Miscellaneous"
]

export default function DailyExpensePage() {
  const [expenseData, setExpenseData] = useState<DailyExpenseEntry[]>(mockData)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  // Filter data based on search, category, and status
  const filteredData = expenseData.filter(entry => {
    const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || entry.category === filterCategory
    const matchesStatus = filterStatus === "all" || entry.status === filterStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Calculate summary statistics
  const totalExpenses = filteredData.reduce((sum, entry) => sum + entry.amount, 0)
  const approvedExpenses = filteredData.filter(entry => entry.status === "approved")
    .reduce((sum, entry) => sum + entry.amount, 0)
  const pendingExpenses = filteredData.filter(entry => entry.status === "pending")
    .reduce((sum, entry) => sum + entry.amount, 0)
  const totalTransactions = filteredData.length

  // Category breakdown
  const categoryTotals = filteredData.reduce((acc, entry) => {
    acc[entry.category] = (acc[entry.category] || 0) + entry.amount
    return acc
  }, {} as Record<string, number>)

  const topCategory = Object.entries(categoryTotals).sort(([,a], [,b]) => b - a)[0]

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0 lg:gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Daily Expense Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track and manage daily operational expenses and receipts
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <PlusIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Expense</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="mx-4 sm:mx-0 sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>
                Record a new daily expense with receipt details and approval information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map(category => (
                        <SelectItem key={category} value={category.toLowerCase().replace(/\s+/g, '-')}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input id="amount" type="number" step="0.01" placeholder="1250.00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Detailed description of the expense..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor/Supplier</Label>
                  <Input id="vendor" placeholder="ABC Company Ltd" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receiptNumber">Receipt Number</Label>
                  <Input id="receiptNumber" placeholder="RCP001" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                      <SelectItem value="credit-card">Credit Card</SelectItem>
                      <SelectItem value="debit-card">Debit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="approvedBy">Approved By</Label>
                  <Input id="approvedBy" placeholder="John Manager" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={() => setIsDialogOpen(false)}>Save Expense</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Expenses</CardTitle>
            <DollarSignIcon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-lg sm:text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{totalTransactions} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${approvedExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Ready for payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pendingExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topCategory ? `$${topCategory[1].toFixed(0)}` : "$0"}
            </div>
            <p className="text-xs text-muted-foreground">
              {topCategory ? topCategory[0] : "No data"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Records</CardTitle>
          <CardDescription>
            Manage daily expenses with receipt tracking and approval workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by description, vendor, or receipt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {expenseCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.category}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={entry.description}>
                      {entry.description}
                    </TableCell>
                    <TableCell className="font-medium">${entry.amount.toFixed(2)}</TableCell>
                    <TableCell>{entry.vendor}</TableCell>
                    <TableCell>{entry.receiptNumber}</TableCell>
                    <TableCell>{entry.paymentMethod}</TableCell>
                    <TableCell>{entry.approvedBy}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          entry.status === "approved" ? "default" :
                          entry.status === "pending" ? "secondary" : "destructive"
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
