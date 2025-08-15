"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  CalendarIcon, 
  TrendingUpIcon, 
  TrendingDownIcon, 
  DollarSignIcon, 
  ArrowRightIcon,
  WalletIcon,
  ReceiptIcon,
  FileTextIcon,
  PlusIcon
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface CashbookSummary {
  totalCashReceived: number
  totalExpenses: number
  netCashFlow: number
  openingBalance: number
  closingBalance: number
  transactionCount: number
  lastTransactionTime: string
}

interface RecentTransaction {
  id: string
  type: "income" | "expense"
  description: string
  amount: number
  category: string
  time: string
  balance: number
}

const mockSummary: CashbookSummary = {
  totalCashReceived: 12450.00,
  totalExpenses: 8750.50,
  netCashFlow: 3699.50,
  openingBalance: 10500.00,
  closingBalance: 14199.50,
  transactionCount: 47,
  lastTransactionTime: "16:45:00"
}

const mockRecentTransactions: RecentTransaction[] = [
  {
    id: "1",
    type: "income",
    description: "Product sales payment from ABC Corp",
    amount: 2500.00,
    category: "Sales Revenue",
    time: "16:45:00",
    balance: 14199.50
  },
  {
    id: "2",
    type: "expense",
    description: "Office supplies purchase",
    amount: 125.50,
    category: "Office Supplies",
    time: "15:30:00",
    balance: 11699.50
  },
  {
    id: "3",
    type: "income",
    description: "Service consultation fee",
    amount: 800.00,
    category: "Service Revenue",
    time: "14:15:00",
    balance: 11825.00
  },
  {
    id: "4",
    type: "expense",
    description: "Fuel and transportation",
    amount: 180.00,
    category: "Transportation",
    time: "13:20:00",
    balance: 11025.00
  },
  {
    id: "5",
    type: "expense",
    description: "Equipment maintenance",
    amount: 450.00,
    category: "Maintenance",
    time: "11:45:00",
    balance: 11205.00
  }
]

const quickActions = [
  {
    title: "Cash Received",
    description: "Record money received and track revenue sources",
    icon: TrendingUpIcon,
    href: "/cashbook/cash-received",
    color: "text-green-600",
    bgColor: "bg-green-50"
  },
  {
    title: "Daily Expense",
    description: "Track daily expenses with real-time balance updates",
    icon: TrendingDownIcon,
    href: "/cashbook/daily-expense", 
    color: "text-red-600",
    bgColor: "bg-red-50"
  },
  {
    title: "Monthly Express Report",
    description: "Generate comprehensive monthly cashbook reports",
    icon: FileTextIcon,
    href: "/cashbook/monthly-express-report",
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  }
]

export default function CashbookPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("today")
  const [searchTerm, setSearchTerm] = useState("")

  // Filter recent transactions based on search
  const filteredTransactions = mockRecentTransactions.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0 lg:gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Cashbook</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Comprehensive cash flow management and financial tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Cash Received</CardTitle>
            <TrendingUpIcon className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-lg sm:text-2xl font-bold text-green-600">${mockSummary.totalCashReceived.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total inflow today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDownIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${mockSummary.totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total outflow today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${mockSummary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${mockSummary.netCashFlow.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Net change today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <WalletIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockSummary.closingBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {mockSummary.transactionCount} transactions today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Balance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Balance Summary</CardTitle>
          <CardDescription>
            Opening balance, transactions, and closing balance overview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg bg-blue-50">
              <div className="text-sm text-muted-foreground">Opening Balance</div>
              <div className="text-2xl font-bold text-blue-600">${mockSummary.openingBalance.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Start of day</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Net Movement</div>
              <div className={`text-2xl font-bold ${mockSummary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {mockSummary.netCashFlow >= 0 ? '+' : ''}${mockSummary.netCashFlow.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">Today's change</div>
            </div>
            <div className="text-center p-4 border rounded-lg bg-green-50">
              <div className="text-sm text-muted-foreground">Closing Balance</div>
              <div className="text-2xl font-bold text-green-600">${mockSummary.closingBalance.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Current position</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Access key cashbook functions and reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-lg ${action.bgColor} flex items-center justify-center mb-4`}>
                      <action.icon className={`h-6 w-6 ${action.color}`} />
                    </div>
                    <h3 className="font-semibold mb-2">{action.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {action.description}
                    </p>
                    <div className="flex items-center text-sm font-medium text-primary">
                      Access <ArrowRightIcon className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Latest cashbook entries with running balance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Button asChild>
              <Link href="/cashbook/cash-received">
                <PlusIcon className="h-4 w-4 mr-2" />
                New Transaction
              </Link>
            </Button>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.time}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={transaction.type === "income" ? "default" : "secondary"}
                        className={transaction.type === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        {transaction.type === "income" ? "Cash In" : "Cash Out"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate" title={transaction.description}>
                      {transaction.description}
                    </TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell className={`font-medium ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {transaction.type === "income" ? "+" : "-"}${transaction.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-medium">${transaction.balance.toFixed(2)}</TableCell>
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