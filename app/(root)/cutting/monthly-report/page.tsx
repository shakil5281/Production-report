"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  CalendarIcon, 
  TrendingUpIcon, 
  TrendingDownIcon, 
  ScissorsIcon, 
  DownloadIcon,
  PrinterIcon,
  TargetIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  BarChart3Icon
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
  totalInput: number
  totalOutput: number
  totalPassed: number
  totalRejected: number
  avgEfficiency: number
  targetAchievement: number
  workingDays: number
  avgDailyOutput: number
  topPerformingLine: string
  worstPerformingLine: string
  qualityRate: number
  wastageRate: number
}

interface LinePerformance {
  lineName: string
  totalOutput: number
  efficiency: number
  qualityRate: number
  workingDays: number
  avgDailyOutput: number
  target: number
  achievement: number
}

interface DefectAnalysis {
  defectType: string
  count: number
  percentage: number
  trend: "increasing" | "decreasing" | "stable"
}

interface StylePerformance {
  styleNumber: string
  totalQuantity: number
  passedQuantity: number
  rejectedQuantity: number
  qualityRate: number
  efficiency: number
}

const mockReportData: MonthlyReportData = {
  month: "January",
  year: "2024",
  totalInput: 8450,
  totalOutput: 8180,
  totalPassed: 7850,
  totalRejected: 330,
  avgEfficiency: 96.8,
  targetAchievement: 92.1,
  workingDays: 26,
  avgDailyOutput: 314.6,
  topPerformingLine: "Line B",
  worstPerformingLine: "Line D",
  qualityRate: 95.9,
  wastageRate: 4.1
}

const mockLinePerformance: LinePerformance[] = [
  {
    lineName: "Line A",
    totalOutput: 2150,
    efficiency: 97.2,
    qualityRate: 96.5,
    workingDays: 26,
    avgDailyOutput: 82.7,
    target: 2200,
    achievement: 97.7
  },
  {
    lineName: "Line B", 
    totalOutput: 2280,
    efficiency: 98.1,
    qualityRate: 97.8,
    workingDays: 26,
    avgDailyOutput: 87.7,
    target: 2250,
    achievement: 101.3
  },
  {
    lineName: "Line C",
    totalOutput: 2050,
    efficiency: 96.8,
    qualityRate: 95.2,
    workingDays: 26,
    avgDailyOutput: 78.8,
    target: 2100,
    achievement: 97.6
  },
  {
    lineName: "Line D",
    totalOutput: 1700,
    efficiency: 94.2,
    qualityRate: 93.1,
    workingDays: 24,
    avgDailyOutput: 70.8,
    target: 2000,
    achievement: 85.0
  }
]

const mockDefectAnalysis: DefectAnalysis[] = [
  {
    defectType: "Pattern mismatch",
    count: 125,
    percentage: 37.9,
    trend: "decreasing"
  },
  {
    defectType: "Edge fraying",
    count: 89,
    percentage: 27.0,
    trend: "stable"
  },
  {
    defectType: "Size variance",
    count: 67,
    percentage: 20.3,
    trend: "increasing"
  },
  {
    defectType: "Fabric defect",
    count: 49,
    percentage: 14.8,
    trend: "stable"
  }
]

const mockStylePerformance: StylePerformance[] = [
  {
    styleNumber: "STY-001",
    totalQuantity: 1850,
    passedQuantity: 1780,
    rejectedQuantity: 70,
    qualityRate: 96.2,
    efficiency: 97.5
  },
  {
    styleNumber: "STY-002",
    totalQuantity: 2200,
    passedQuantity: 2120,
    rejectedQuantity: 80,
    qualityRate: 96.4,
    efficiency: 98.1
  },
  {
    styleNumber: "STY-003",
    totalQuantity: 1650,
    passedQuantity: 1580,
    rejectedQuantity: 70,
    qualityRate: 95.8,
    efficiency: 96.2
  },
  {
    styleNumber: "STY-004",
    totalQuantity: 2480,
    passedQuantity: 2370,
    rejectedQuantity: 110,
    qualityRate: 95.6,
    efficiency: 96.8
  }
]

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export default function CuttingMonthlyReportPage() {
  const [selectedMonth, setSelectedMonth] = useState("January")
  const [selectedYear, setSelectedYear] = useState("2024")
  const [filterMetric, setFilterMetric] = useState("all")

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0 lg:gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Monthly Cutting Report</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Comprehensive analysis of cutting department performance and metrics
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <PrinterIcon className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Output</CardTitle>
            <ScissorsIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">{mockReportData.totalOutput}</div>
            <p className="text-xs text-muted-foreground">Pieces cut this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Quality Rate</CardTitle>
            <CheckCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-lg sm:text-2xl font-bold text-green-600">{mockReportData.qualityRate}%</div>
            <p className="text-xs text-muted-foreground">Pass rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Efficiency</CardTitle>
            <TargetIcon className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-lg sm:text-2xl font-bold text-purple-600">{mockReportData.avgEfficiency}%</div>
            <p className="text-xs text-muted-foreground">Average efficiency</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Target Achievement</CardTitle>
            <BarChart3Icon className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-lg sm:text-2xl font-bold text-orange-600">{mockReportData.targetAchievement}%</div>
            <p className="text-xs text-muted-foreground">Of monthly target</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 border rounded-lg bg-blue-50">
                <div>
                  <div className="font-medium text-blue-700">Total Input</div>
                  <div className="text-sm text-muted-foreground">Fabric received</div>
                </div>
                <div className="text-lg font-bold text-blue-600">{mockReportData.totalInput}</div>
              </div>
              
              <div className="flex justify-between items-center p-4 border rounded-lg bg-green-50">
                <div>
                  <div className="font-medium text-green-700">Quality Passed</div>
                  <div className="text-sm text-muted-foreground">Approved pieces</div>
                </div>
                <div className="text-lg font-bold text-green-600">{mockReportData.totalPassed}</div>
              </div>

              <div className="flex justify-between items-center p-4 border rounded-lg bg-red-50">
                <div>
                  <div className="font-medium text-red-700">Rejected</div>
                  <div className="text-sm text-muted-foreground">Quality failures</div>
                </div>
                <div className="text-lg font-bold text-red-600">{mockReportData.totalRejected}</div>
              </div>

              <div className="flex justify-between items-center p-4 border rounded-lg bg-purple-50">
                <div>
                  <div className="font-medium text-purple-700">Daily Average</div>
                  <div className="text-sm text-muted-foreground">Pieces per day</div>
                </div>
                <div className="text-lg font-bold text-purple-600">{mockReportData.avgDailyOutput.toFixed(1)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Line Performance Ranking</CardTitle>
            <CardDescription>Cutting lines by efficiency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockLinePerformance
                .sort((a, b) => b.efficiency - a.efficiency)
                .map((line, index) => (
                <div key={line.lineName} className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{line.lineName}</div>
                      <div className="text-xs text-muted-foreground">{line.totalOutput} pieces</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{line.efficiency}%</div>
                    <div className="text-xs text-muted-foreground">efficiency</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Line Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Line Performance Details</CardTitle>
          <CardDescription>
            Comprehensive performance metrics for each cutting line
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Line Name</TableHead>
                  <TableHead>Total Output</TableHead>
                  <TableHead>Efficiency</TableHead>
                  <TableHead>Quality Rate</TableHead>
                  <TableHead>Daily Average</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Achievement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockLinePerformance.map((line) => (
                  <TableRow key={line.lineName}>
                    <TableCell className="font-medium">{line.lineName}</TableCell>
                    <TableCell className="font-medium">{line.totalOutput}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{line.efficiency}%</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${Math.min(line.efficiency, 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{line.qualityRate}%</TableCell>
                    <TableCell>{line.avgDailyOutput.toFixed(1)}</TableCell>
                    <TableCell>{line.target}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          line.achievement >= 100 ? "default" :
                          line.achievement >= 90 ? "secondary" : "destructive"
                        }
                      >
                        {line.achievement.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quality Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Defect Analysis</CardTitle>
            <CardDescription>Common defect types and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockDefectAnalysis.map((defect) => (
                <div key={defect.defectType} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{defect.defectType}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{defect.percentage.toFixed(1)}%</span>
                      <Badge variant={
                        defect.trend === "decreasing" ? "default" :
                        defect.trend === "stable" ? "secondary" : "destructive"
                      }>
                        {defect.trend}
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${defect.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {defect.count} occurrences
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Style Performance</CardTitle>
            <CardDescription>Performance by style number</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Style</TableHead>
                    <TableHead>Total Qty</TableHead>
                    <TableHead>Quality Rate</TableHead>
                    <TableHead>Efficiency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockStylePerformance.map((style) => (
                    <TableRow key={style.styleNumber}>
                      <TableCell className="font-medium">{style.styleNumber}</TableCell>
                      <TableCell>{style.totalQuantity}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{style.qualityRate}%</span>
                          <div className="w-12 bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-green-500 h-1 rounded-full"
                              style={{ width: `${style.qualityRate}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{style.efficiency}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
