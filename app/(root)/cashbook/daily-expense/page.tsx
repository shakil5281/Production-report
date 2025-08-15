"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, PlusIcon, TrendingDownIcon, DollarSignIcon, FileTextIcon } from "lucide-react"
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

interface CashbookExpenseEntry {
  id: string
  transactionId: string
  category: string
  description: string
  amount: number
  paymentMethod: "cash" | "bank" | "check" | "card"
  reference: string
  enteredBy: string
  date: string
  time: string
  status: "completed" | "pending" | "cancelled"
  balance: number
}

const mockData: CashbookExpenseEntry[] = [
  {
    id: "1",
    transactionId: "CBE001",
    category: "Office Supplies",
    description: "Stationery and printing materials",
    amount: 125.50,
    paymentMethod: "cash",
    reference: "PO-2024-001",
    enteredBy: "John Accountant",
    date: "2024-01-15",
    time: "09:30:00",
    status: "completed",
    balance: 4874.50
  },
  {
    id: "2",
    transactionId: "CBE002",
    category: "Utilities",
    description: "Internet and telephone bills",
    amount: 250.00,
    paymentMethod: "bank",
    reference: "BILL-2024-015",
    enteredBy: "Jane Finance",
    date: "2024-01-15",
    time: "11:15:00",
    status: "completed",
    balance: 4624.50
  },
  {
    id: "3",
    transactionId: "CBE003",
    category: "Transportation",
    description: "Fuel and vehicle maintenance",
    amount: 180.00,
    paymentMethod: "card",
    reference: "VEH-2024-008",
    enteredBy: "Mike Fleet",
    date: "2024-01-15",
    time: "14:45:00",
    status: "pending",
    balance: 4444.50
  },
  {
    id: "4",
    transactionId: "CBE004",
    category: "Maintenance",
    description: "Equipment servicing and repairs",
    amount: 450.00,
    paymentMethod: "check",
    reference: "SRV-2024-012",
    enteredBy: "Sarah Tech",
    date: "2024-01-15",
    time: "16:20:00",
    status: "completed",
    balance: 3994.50
  }
]

const expenseCategories = [
  "Office Supplies",
  "Utilities",
  "Transportation", 
  "Maintenance",
  "Raw Materials",
  "Marketing",
  "Insurance",
  "Legal & Professional",
  "Miscellaneous"
]

export default function CashbookDailyExpensePage() {
  const [expenseData, setExpenseData] = useState<CashbookExpenseEntry[]>(mockData)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("all")

  // Filter data
  const filteredData = expenseData.filter(entry => {
    const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.reference.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || entry.category === filterCategory
    const matchesPaymentMethod = filterPaymentMethod === "all" || entry.paymentMethod === filterPaymentMethod
    return matchesSearch && matchesCategory && matchesPaymentMethod
  })

  // Calculate summary statistics
  const totalExpenses = filteredData.reduce((sum, entry) => sum + entry.amount, 0)
  const completedExpenses = filteredData.filter(entry => entry.status === "completed")
    .reduce((sum, entry) => sum + entry.amount, 0)
  const pendingExpenses = filteredData.filter(entry => entry.status === "pending")
    .reduce((sum, entry) => sum + entry.amount, 0)
  const totalTransactions = filteredData.length
  const currentBalance = expenseData.length > 0 ? expenseData[expenseData.length - 1].balance : 0

  // Payment method breakdown
  const paymentMethodTotals = filteredData.reduce((acc, entry) => {
    acc[entry.paymentMethod] = (acc[entry.paymentMethod] || 0) + entry.amount
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0 lg:gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Cashbook - Daily Expenses</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track and manage daily cash flow and expense transactions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <PlusIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Record Expense</span>
              <span className="sm:hidden">Record</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="mx-4 sm:mx-0 sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record New Expense</DialogTitle>
              <DialogDescription>
                Add a new expense transaction to the cashbook with detailed information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transactionId">Transaction ID</Label>
                  <Input id="transactionId" placeholder="CBE005" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input id="amount" type="number" step="0.01" placeholder="125.50" />
                </div>
              </div>
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
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Detailed description of the expense..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reference">Reference Number</Label>
                  <Input id="reference" placeholder="PO-2024-001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="enteredBy">Entered By</Label>
                  <Input id="enteredBy" placeholder="John Accountant" />
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
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={() => setIsDialogOpen(false)}>Record Expense</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDownIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{totalTransactions} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <FileTextIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${completedExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Processed expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pendingExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${currentBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Available funds</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method Breakdown</CardTitle>
          <CardDescription>Daily expenses categorized by payment method</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(paymentMethodTotals).map(([method, total]) => (
              <div key={method} className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">${total.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground capitalize">{method}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Transactions</CardTitle>
          <CardDescription>
            Detailed record of daily expense transactions with real-time balance tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by description, transaction ID, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {expenseCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.transactionId}</TableCell>
                    <TableCell>{entry.time}</TableCell>
                    <TableCell>{entry.category}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={entry.description}>
                      {entry.description}
                    </TableCell>
                    <TableCell className="font-medium text-red-600">-${entry.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {entry.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.reference}</TableCell>
                    <TableCell className="font-medium">${entry.balance.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          entry.status === "completed" ? "default" :
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
