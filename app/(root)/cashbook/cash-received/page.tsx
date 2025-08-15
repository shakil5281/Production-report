"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, PlusIcon, TrendingUpIcon, DollarSignIcon, ReceiptIcon } from "lucide-react"
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

interface MoneyReceivedEntry {
  id: string
  transactionId: string
  source: string
  description: string
  amount: number
  paymentMethod: "cash" | "bank" | "check" | "card" | "online"
  reference: string
  receivedBy: string
  invoiceNumber?: string
  customerName?: string
  date: string
  time: string
  status: "confirmed" | "pending" | "disputed"
  balance: number
}

const mockData: MoneyReceivedEntry[] = [
  {
    id: "1",
    transactionId: "CBR001",
    source: "Product Sales",
    description: "Payment for Order #ORD-2024-001",
    amount: 2500.00,
    paymentMethod: "bank",
    reference: "TXN-2024-001",
    receivedBy: "Jane Sales",
    invoiceNumber: "INV-2024-001",
    customerName: "ABC Manufacturing Ltd",
    date: "2024-01-15",
    time: "10:30:00",
    status: "confirmed",
    balance: 7500.00
  },
  {
    id: "2",
    transactionId: "CBR002",
    source: "Service Revenue",
    description: "Consulting services payment",
    amount: 800.00,
    paymentMethod: "cash",
    reference: "SRV-2024-003",
    receivedBy: "John Consultant",
    customerName: "XYZ Corp",
    date: "2024-01-15",
    time: "13:15:00",
    status: "confirmed",
    balance: 8300.00
  },
  {
    id: "3",
    transactionId: "CBR003",
    source: "Refund",
    description: "Insurance claim settlement",
    amount: 1200.00,
    paymentMethod: "check",
    reference: "INS-2024-007",
    receivedBy: "Sarah Finance",
    date: "2024-01-15",
    time: "15:45:00",
    status: "pending",
    balance: 9500.00
  },
  {
    id: "4",
    transactionId: "CBR004",
    source: "Investment",
    description: "Partner capital injection",
    amount: 5000.00,
    paymentMethod: "online",
    reference: "CAP-2024-001",
    receivedBy: "Mike CFO",
    date: "2024-01-15",
    time: "16:20:00",
    status: "confirmed",
    balance: 14500.00
  }
]

const revenueSources = [
  "Product Sales",
  "Service Revenue",
  "Investment",
  "Loan",
  "Refund",
  "Grant",
  "Commission",
  "Interest",
  "Miscellaneous"
]

export default function DailyMoneyReceivedPage() {
  const [revenueData, setRevenueData] = useState<MoneyReceivedEntry[]>(mockData)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSource, setFilterSource] = useState("all")
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("all")

  // Filter data
  const filteredData = revenueData.filter(entry => {
    const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.reference.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSource = filterSource === "all" || entry.source === filterSource
    const matchesPaymentMethod = filterPaymentMethod === "all" || entry.paymentMethod === filterPaymentMethod
    return matchesSearch && matchesSource && matchesPaymentMethod
  })

  // Calculate summary statistics
  const totalReceived = filteredData.reduce((sum, entry) => sum + entry.amount, 0)
  const confirmedReceived = filteredData.filter(entry => entry.status === "confirmed")
    .reduce((sum, entry) => sum + entry.amount, 0)
  const pendingReceived = filteredData.filter(entry => entry.status === "pending")
    .reduce((sum, entry) => sum + entry.amount, 0)
  const totalTransactions = filteredData.length
  const currentBalance = revenueData.length > 0 ? revenueData[revenueData.length - 1].balance : 0

  // Source breakdown
  const sourceTotals = filteredData.reduce((acc, entry) => {
    acc[entry.source] = (acc[entry.source] || 0) + entry.amount
    return acc
  }, {} as Record<string, number>)

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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Cashbook - Daily Money Received</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track and manage daily cash inflows and revenue transactions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <PlusIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Record Receipt</span>
              <span className="sm:hidden">Record</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="mx-4 sm:mx-0 sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Money Received</DialogTitle>
              <DialogDescription>
                Add a new revenue transaction to the cashbook with detailed information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transactionId">Transaction ID</Label>
                  <Input id="transactionId" placeholder="CBR005" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input id="amount" type="number" step="0.01" placeholder="2500.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source">Revenue Source</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {revenueSources.map(source => (
                        <SelectItem key={source} value={source.toLowerCase().replace(/\s+/g, '-')}>
                          {source}
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
                      <SelectItem value="online">Online Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Detailed description of the payment received..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer/Payer Name</Label>
                  <Input id="customerName" placeholder="ABC Manufacturing Ltd" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice Number (Optional)</Label>
                  <Input id="invoiceNumber" placeholder="INV-2024-001" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reference">Reference Number</Label>
                  <Input id="reference" placeholder="TXN-2024-001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receivedBy">Received By</Label>
                  <Input id="receivedBy" placeholder="Jane Sales" />
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
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="disputed">Disputed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={() => setIsDialogOpen(false)}>Record Receipt</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalReceived.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{totalTransactions} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${confirmedReceived.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Verified receipts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pendingReceived.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${currentBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Updated balance</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Source Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Sources</CardTitle>
            <CardDescription>Daily income categorized by source</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(sourceTotals).map(([source, total]) => (
                <div key={source} className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="font-medium">{source}</div>
                  <div className="text-lg font-bold text-green-600">${total.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Daily receipts by payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(paymentMethodTotals).map(([method, total]) => (
                <div key={method} className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold">${total.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground capitalize">{method}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Transactions</CardTitle>
          <CardDescription>
            Detailed record of daily money received with real-time balance tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by description, customer, transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {revenueSources.map(source => (
                  <SelectItem key={source} value={source}>{source}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Customer/Payer</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.transactionId}</TableCell>
                    <TableCell>{entry.time}</TableCell>
                    <TableCell>{entry.source}</TableCell>
                    <TableCell>{entry.customerName || "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={entry.description}>
                      {entry.description}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">+${entry.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {entry.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">${entry.balance.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          entry.status === "confirmed" ? "default" :
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
