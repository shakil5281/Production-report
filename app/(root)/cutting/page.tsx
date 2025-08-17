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
  ScissorsIcon, 
  ArrowRightIcon,
  LayersIcon,
  PackageIcon,
  ClockIcon,
  PlusIcon,
  TargetIcon
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

interface CuttingSummary {
  totalInput: number
  totalOutput: number
  efficiency: number
  wastage: number
  currentStock: number
  completedOrders: number
  pendingOrders: number
  dailyTarget: number
  achieved: number
  variance: number
}

interface RecentCuttingActivity {
  id: string
  type: "input" | "output"
  styleNumber: string
  color: string
  quantity: number
  operator: string
  time: string
  status: "completed" | "in-progress" | "pending"
}

interface CuttingLine {
  id: string
  lineName: string
  operator: string
  currentStyle: string
  target: number
  achieved: number
  efficiency: number
  status: "active" | "idle" | "maintenance"
}

const mockSummary: CuttingSummary = {
  totalInput: 2450,
  totalOutput: 2280,
  efficiency: 93.1,
  wastage: 170,
  currentStock: 1850,
  completedOrders: 15,
  pendingOrders: 8,
  dailyTarget: 2500,
  achieved: 2280,
  variance: -220
}

const mockRecentActivities: RecentCuttingActivity[] = [
  {
    id: "1",
    type: "output",
    styleNumber: "STY-001",
    color: "Navy Blue",
    quantity: 85,
    operator: "John Cutter",
    time: "16:30:00",
    status: "completed"
  },
  {
    id: "2",
    type: "input",
    styleNumber: "STY-002", 
    color: "Black",
    quantity: 120,
    operator: "Jane Supervisor",
    time: "15:45:00",
    status: "completed"
  },
  {
    id: "3",
    type: "output",
    styleNumber: "STY-003",
    color: "White",
    quantity: 95,
    operator: "Mike Senior",
    time: "14:20:00",
    status: "in-progress"
  },
  {
    id: "4",
    type: "input",
    styleNumber: "STY-001",
    color: "Gray",
    quantity: 110,
    operator: "Sarah Lead",
    time: "13:15:00",
    status: "completed"
  }
]

const mockCuttingLines: CuttingLine[] = [
  {
    id: "1",
    lineName: "Cutting Line A",
    operator: "John Cutter",
    currentStyle: "STY-001",
    target: 350,
    achieved: 325,
    efficiency: 92.9,
    status: "active"
  },
  {
    id: "2",
    lineName: "Cutting Line B",
    operator: "Jane Expert",
    currentStyle: "STY-002",
    target: 300,
    achieved: 285,
    efficiency: 95.0,
    status: "active"
  },
  {
    id: "3",
    lineName: "Cutting Line C",
    operator: "Mike Senior",
    currentStyle: "STY-003",
    target: 275,
    achieved: 260,
    efficiency: 94.5,
    status: "active"
  },
  {
    id: "4",
    lineName: "Cutting Line D",
    operator: "Sarah Lead",
    currentStyle: "-",
    target: 0,
    achieved: 0,
    efficiency: 0,
    status: "maintenance"
  }
]

const quickActions = [
  {
    title: "Daily Input",
    description: "Record fabric input and cutting allocations",
    icon: TrendingUpIcon,
    href: "/cutting/daily-input",
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    title: "Daily Output", 
    description: "Track cutting output and production completion",
    icon: TrendingDownIcon,
    href: "/cutting/daily-output",
    color: "text-green-600",
    bgColor: "bg-green-50"
  },
  {
    title: "Monthly Report",
    description: "Generate comprehensive cutting performance reports",
    icon: CalendarIcon,
    href: "/cutting/monthly-report",
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  }
]

export default function CuttingPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("today")
  const [searchTerm, setSearchTerm] = useState("")

  // Filter recent activities based on search
  const filteredActivities = mockRecentActivities.filter(activity =>
    activity.styleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.operator.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0 lg:gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Cutting Department</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Comprehensive cutting operations management and tracking
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
            <CardTitle className="text-xs sm:text-sm font-medium">Total Input</CardTitle>
            <TrendingUpIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">{mockSummary.totalInput}</div>
            <p className="text-xs text-muted-foreground">Pieces processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Output</CardTitle>
            <TrendingDownIcon className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-lg sm:text-2xl font-bold text-green-600">{mockSummary.totalOutput}</div>
            <p className="text-xs text-muted-foreground">Pieces completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Efficiency</CardTitle>
            <TargetIcon className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-lg sm:text-2xl font-bold text-purple-600">{mockSummary.efficiency}%</div>
            <p className="text-xs text-muted-foreground">Department efficiency</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Current Stock</CardTitle>
            <PackageIcon className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-lg sm:text-2xl font-bold text-orange-600">{mockSummary.currentStock}</div>
            <p className="text-xs text-muted-foreground">Ready for cutting</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today&apos;s Performance</CardTitle>
            <CardDescription>Daily targets vs achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 border rounded-lg bg-blue-50">
                <div>
                  <div className="font-medium text-blue-700">Daily Target</div>
                  <div className="text-sm text-muted-foreground">Cutting target for today</div>
                </div>
                <div className="text-lg font-bold text-blue-600">{mockSummary.dailyTarget}</div>
              </div>
              
              <div className="flex justify-between items-center p-4 border rounded-lg bg-green-50">
                <div>
                  <div className="font-medium text-green-700">Achieved</div>
                  <div className="text-sm text-muted-foreground">Pieces cut today</div>
                </div>
                <div className="text-lg font-bold text-green-600">{mockSummary.achieved}</div>
              </div>

              <div className="flex justify-between items-center p-4 border rounded-lg bg-red-50">
                <div>
                  <div className="font-medium text-red-700">Variance</div>
                  <div className="text-sm text-muted-foreground">Difference from target</div>
                </div>
                <div className="text-lg font-bold text-red-600">{mockSummary.variance}</div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full"
                  style={{ width: `${Math.min((mockSummary.achieved / mockSummary.dailyTarget) * 100, 100)}%` }}
                />
              </div>
              <div className="text-center text-sm text-muted-foreground">
                {((mockSummary.achieved / mockSummary.dailyTarget) * 100).toFixed(1)}% of daily target achieved
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Key metrics overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-green-600">{mockSummary.completedOrders}</div>
                  <div className="text-xs text-muted-foreground">Completed Orders</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-orange-600">{mockSummary.pendingOrders}</div>
                  <div className="text-xs text-muted-foreground">Pending Orders</div>
                </div>
              </div>
              
              <div className="text-center p-4 border rounded-lg bg-red-50">
                <div className="text-2xl font-bold text-red-600">{mockSummary.wastage}</div>
                <div className="text-sm text-muted-foreground">Wastage (pieces)</div>
              </div>

              <div className="text-center p-4 border rounded-lg bg-blue-50">
                <div className="text-2xl font-bold text-blue-600">
                  {((mockSummary.totalOutput / mockSummary.totalInput) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Output Ratio</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Access key cutting department functions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4 sm:p-6">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${action.bgColor} flex items-center justify-center mb-3 sm:mb-4`}>
                      <action.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${action.color}`} />
                    </div>
                    <h3 className="font-semibold mb-2 text-sm sm:text-base">{action.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                      {action.description}
                    </p>
                    <div className="flex items-center text-xs sm:text-sm font-medium text-primary">
                      Access <ArrowRightIcon className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cutting Lines Status */}
      <Card>
        <CardHeader>
          <CardTitle>Cutting Lines Status</CardTitle>
          <CardDescription>
            Real-time status of all cutting lines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Line</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Current Style</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Achieved</TableHead>
                  <TableHead>Efficiency</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockCuttingLines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium">{line.lineName}</TableCell>
                    <TableCell>{line.operator}</TableCell>
                    <TableCell>{line.currentStyle}</TableCell>
                    <TableCell>{line.target}</TableCell>
                    <TableCell className="font-medium">{line.achieved}</TableCell>
                    <TableCell>{line.efficiency}%</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          line.status === "active" ? "default" :
                          line.status === "idle" ? "secondary" : "destructive"
                        }
                      >
                        {line.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>
            Latest cutting input and output transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by style, color, or operator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/cutting/daily-input">
                <PlusIcon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">New Entry</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </Button>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Style Number</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.time}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={activity.type === "input" ? "default" : "secondary"}
                        className={activity.type === "input" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}
                      >
                        {activity.type === "input" ? "Input" : "Output"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{activity.styleNumber}</TableCell>
                    <TableCell>{activity.color}</TableCell>
                    <TableCell className="font-medium">{activity.quantity}</TableCell>
                    <TableCell>{activity.operator}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          activity.status === "completed" ? "default" :
                          activity.status === "in-progress" ? "secondary" : "outline"
                        }
                      >
                        {activity.status}
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
