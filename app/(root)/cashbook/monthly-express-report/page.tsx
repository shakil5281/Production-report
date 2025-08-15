"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  CalendarIcon, 
  TrendingUpIcon, 
  TrendingDownIcon, 
  DollarSignIcon, 
  DownloadIcon,
  PrinterIcon,
  FileTextIcon,
  BarChart3Icon,
  PieChartIcon
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

interface MonthlyReportData {
  month: string
  year: string
  openingBalance: number
  totalIncome: number
  totalExpenses: number
  netCashFlow: number
  closingBalance: number
  transactionCount: number
  avgDailyIncome: number
  avgDailyExpense: number
  highestSingleIncome: number
  highestSingleExpense: number
  workingDays: number
}

interface CategoryBreakdown {
  category: string
  type: "income" | "expense"
  amount: number
  transactionCount: number
  percentage: number
  avgTransaction: number
}

interface DailySummary {
  date: string
  openingBalance: number
  totalIncome: number
  totalExpenses: number
  closingBalance: number
  netFlow: number
}

const mockReportData: MonthlyReportData = {
  month: "January",
  year: "2024",
  openingBalance: 45000.00,
  totalIncome: 125750.00,
  totalExpenses: 89320.50,
  netCashFlow: 36429.50,
  closingBalance: 81429.50,
  transactionCount: 324,
  avgDailyIncome: 4056.45,
  avgDailyExpense: 2881.95,
  highestSingleIncome: 8500.00,
  highestSingleExpense: 3200.00,
  workingDays: 31
}

const mockCategoryBreakdown: CategoryBreakdown[] = [
  {
    category: "Product Sales",
    type: "income",
    amount: 75500.00,
    transactionCount: 85,
    percentage: 60.1,
    avgTransaction: 888.24
  },
  {
    category: "Service Revenue",
    type: "income",
    amount: 35250.00,
    transactionCount: 42,
    percentage: 28.0,
    avgTransaction: 839.29
  },
  {
    category: "Investment Income",
    type: "income",
    amount: 15000.00,
    transactionCount: 3,
    percentage: 11.9,
    avgTransaction: 5000.00
  },
  {
    category: "Raw Materials",
    type: "expense",
    amount: 32450.00,
    transactionCount: 58,
    percentage: 36.3,
    avgTransaction: 559.48
  },
  {
    category: "Utilities",
    type: "expense",
    amount: 18750.50,
    transactionCount: 31,
    percentage: 21.0,
    avgTransaction: 604.85
  },
  {
    category: "Transportation",
    type: "expense",
    amount: 12680.00,
    transactionCount: 45,
    percentage: 14.2,
    avgTransaction: 281.78
  },
  {
    category: "Office Supplies",
    type: "expense",
    amount: 8940.00,
    transactionCount: 67,
    percentage: 10.0,
    avgTransaction: 133.43
  },
  {
    category: "Maintenance",
    type: "expense",
    amount: 16500.00,
    transactionCount: 23,
    percentage: 18.5,
    avgTransaction: 717.39
  }
]

const mockDailySummary: DailySummary[] = [
  { date: "2024-01-15", openingBalance: 48500.00, totalIncome: 4200.00, totalExpenses: 2850.00, closingBalance: 49850.00, netFlow: 1350.00 },
  { date: "2024-01-14", openingBalance: 47200.00, totalIncome: 3800.00, totalExpenses: 2500.00, closingBalance: 48500.00, netFlow: 1300.00 },
  { date: "2024-01-13", openingBalance: 46100.00, totalIncome: 2950.00, totalExpenses: 1850.00, closingBalance: 47200.00, netFlow: 1100.00 },
  { date: "2024-01-12", openingBalance: 45800.00, totalIncome: 4100.00, totalExpenses: 3800.00, closingBalance: 46100.00, netFlow: 300.00 },
  { date: "2024-01-11", openingBalance: 44650.00, totalIncome: 5200.00, totalExpenses: 4050.00, closingBalance: 45800.00, netFlow: 1150.00 }
]

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export default function MonthlyExpressReportPage() {
  const [selectedMonth, setSelectedMonth] = useState("January")
  const [selectedYear, setSelectedYear] = useState("2024")
  const [filterType, setFilterType] = useState("all")

  // Filter category breakdown based on type
  const filteredCategories = mockCategoryBreakdown.filter(category => {
    if (filterType === "all") return true
    return category.type === filterType
  })

  const totalIncomeCategories = mockCategoryBreakdown.filter(cat => cat.type === "income")
  const totalExpenseCategories = mockCategoryBreakdown.filter(cat => cat.type === "expense")

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monthly Express Report</h1>
          <p className="text-muted-foreground">
            Comprehensive monthly cashbook analysis and financial overview
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <PrinterIcon className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Period Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex gap-2 items-center">
              <Label htmlFor="monthSelect">Report Period:</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1" />
            <Badge variant="outline" className="text-sm">
              {mockReportData.workingDays} working days
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opening Balance</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockReportData.openingBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Start of {selectedMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${mockReportData.totalIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Avg: ${mockReportData.avgDailyIncome.toFixed(2)}/day
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDownIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${mockReportData.totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Avg: ${mockReportData.avgDailyExpense.toFixed(2)}/day
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closing Balance</CardTitle>
            <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockReportData.closingBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Net: ${mockReportData.netCashFlow.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Summary</CardTitle>
            <CardDescription>Monthly income vs expenses breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 border rounded-lg bg-blue-50">
                <div>
                  <div className="font-medium">Opening Balance</div>
                  <div className="text-sm text-muted-foreground">Beginning of month</div>
                </div>
                <div className="text-lg font-bold">${mockReportData.openingBalance.toFixed(2)}</div>
              </div>
              
              <div className="flex justify-between items-center p-4 border rounded-lg bg-green-50">
                <div>
                  <div className="font-medium text-green-700">Total Income</div>
                  <div className="text-sm text-muted-foreground">{totalIncomeCategories.reduce((sum, cat) => sum + cat.transactionCount, 0)} transactions</div>
                </div>
                <div className="text-lg font-bold text-green-600">+${mockReportData.totalIncome.toFixed(2)}</div>
              </div>

              <div className="flex justify-between items-center p-4 border rounded-lg bg-red-50">
                <div>
                  <div className="font-medium text-red-700">Total Expenses</div>
                  <div className="text-sm text-muted-foreground">{totalExpenseCategories.reduce((sum, cat) => sum + cat.transactionCount, 0)} transactions</div>
                </div>
                <div className="text-lg font-bold text-red-600">-${mockReportData.totalExpenses.toFixed(2)}</div>
              </div>

              <div className="flex justify-between items-center p-4 border rounded-lg bg-green-50">
                <div>
                  <div className="font-medium">Closing Balance</div>
                  <div className="text-sm text-muted-foreground">End of month</div>
                </div>
                <div className="text-lg font-bold text-green-600">${mockReportData.closingBalance.toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Key financial indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-green-600">${mockReportData.highestSingleIncome.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Highest Income</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-red-600">${mockReportData.highestSingleExpense.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Highest Expense</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold">{mockReportData.transactionCount}</div>
                  <div className="text-sm text-muted-foreground">Total Transactions</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold">{(mockReportData.transactionCount / mockReportData.workingDays).toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Avg/Day</div>
                </div>
              </div>

              <div className="text-center p-4 border rounded-lg bg-blue-50">
                <div className="text-2xl font-bold text-blue-600">
                  {((mockReportData.totalIncome / mockReportData.totalExpenses) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Income to Expense Ratio</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Analysis</CardTitle>
          <CardDescription>
            Income and expense breakdown by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="income">Income Only</SelectItem>
                <SelectItem value="expense">Expenses Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Avg. Transaction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.category}>
                    <TableCell className="font-medium">{category.category}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={category.type === "income" ? "default" : "secondary"}
                        className={category.type === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        {category.type}
                      </Badge>
                    </TableCell>
                    <TableCell className={`font-medium ${category.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      ${category.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>{category.transactionCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{category.percentage.toFixed(1)}%</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${category.type === "income" ? "bg-green-500" : "bg-red-500"}`}
                            style={{ width: `${Math.min(category.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>${category.avgTransaction.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Daily Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Daily Summary</CardTitle>
          <CardDescription>
            Last 5 days cash flow summary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Opening Balance</TableHead>
                  <TableHead>Income</TableHead>
                  <TableHead>Expenses</TableHead>
                  <TableHead>Net Flow</TableHead>
                  <TableHead>Closing Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockDailySummary.map((day) => (
                  <TableRow key={day.date}>
                    <TableCell className="font-medium">{day.date}</TableCell>
                    <TableCell>${day.openingBalance.toFixed(2)}</TableCell>
                    <TableCell className="text-green-600">${day.totalIncome.toFixed(2)}</TableCell>
                    <TableCell className="text-red-600">${day.totalExpenses.toFixed(2)}</TableCell>
                    <TableCell className={`font-medium ${day.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {day.netFlow >= 0 ? '+' : ''}${day.netFlow.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-medium">${day.closingBalance.toFixed(2)}</TableCell>
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
