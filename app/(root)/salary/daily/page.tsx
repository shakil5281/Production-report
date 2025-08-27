'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, DollarSign, Users, Calculator, Save, RefreshCw, AlertTriangle, Settings, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useCalendarAutoClose } from '@/hooks/use-calendar-auto-close';

interface SalaryRecord {
  section: string;
  workerCount: number;
  regularRate: number;
  overtimeHours: number;
  overtimeRate: number;
  regularAmount: number;
  overtimeAmount: number;
  totalAmount: number;
}



export default function DailySalaryPage() {
  const { isCalendarOpen, setIsCalendarOpen } = useCalendarAutoClose();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [salaryData, setSalaryData] = useState<SalaryRecord[]>([]);
  // Default hardcoded salary rates
  const defaultSalaryRates = {
    'Staff': { regular: 960, overtime: 0 },
    'Operator': { regular: 492, overtime: 80 },
    'Helper': { regular: 367, overtime: 55.45 },
    'Cutting': { regular: 404, overtime: 62.04 },
    'Finishing': { regular: 451, overtime: 71.10 },
    'Quality': { regular: 410, overtime: 63.15 },
    'Inputman': { regular: 382, overtime: 57.75 },
    'Ironman': { regular: 382, overtime: 57.75 },
    'Cleaner': { regular: 360, overtime: 53.55 },
    'Loader': { regular: 435, overtime: 0 },
    'Security': { regular: 472, overtime: 0 },
    'Others': { regular: 0, overtime: 0 }
  };
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [summary, setSummary] = useState({
    totalSections: 0,
    totalWorkers: 0,
    totalRegularAmount: 0,
    totalOvertimeAmount: 0,
    grandTotalAmount: 0,
    totalOvertimeHours: 0
  });
  const [manpowerSummary, setManpowerSummary] = useState({
    totalPresentWorkers: 0,
    totalWorkers: 0,
    attendanceRate: 0
  });
  const [hasManpowerData, setHasManpowerData] = useState(false);
  const [loadingManpower, setLoadingManpower] = useState(false);

  const [availableManpowerSections, setAvailableManpowerSections] = useState<any[]>([]);

  // Default sections with new structure
  const defaultSections = [
    'Staff', 'Operator', 'Helper', 'Cutting', 'Finishing', 'Quality', 
    'Inputman', 'Ironman', 'Cleaner', 'Loader', 'Security', 'Others'
  ];

  useEffect(() => {
    const loadData = async () => {
      await fetchSalaryData();
      await fetchManpowerData();
      await fetchOvertimeData(); // Fetch overtime data last to update records
    };
    loadData();
  }, [selectedDate]);



  const fetchSalaryData = async () => {
    try {
      setLoading(true);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/salary?date=${formattedDate}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.records.length > 0) {
          setSalaryData(result.data.records);
          setSummary(result.data.summary);
        } else {
          // Initialize with default sections and rates
          initializeDefaultRecords();
        }
      } else {
        initializeDefaultRecords();
      }
    } catch (err) {
      console.error('Error fetching salary data:', err);
      initializeDefaultRecords();
    } finally {
      setLoading(false);
    }
  };

  const fetchOvertimeData = async () => {
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      console.log('Fetching overtime data for date:', formattedDate);
      const response = await fetch(`/api/overtime?date=${formattedDate}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Overtime API response:', result);
        
        if (result.success && result.data && result.data.records && result.data.records.length > 0) {
          console.log('Found overtime records:', result.data.records);
          
          // Update salary records with overtime hours from overtime management
          setSalaryData(current => {
            console.log('Current salary records before overtime update:', current);
            
            const updated = current.map(record => {
              const overtimeRecord = result.data.records.find((ot: any) => ot.section === record.section);
              if (overtimeRecord && overtimeRecord.totalOtHours > 0) {
                console.log(`Updating ${record.section} with ${overtimeRecord.totalOtHours} OT hours`);
                const updatedRecord = {
                  ...record,
                  overtimeHours: Number(overtimeRecord.totalOtHours) || 0
                };
                // Recalculate amounts
                updatedRecord.overtimeAmount = updatedRecord.overtimeHours * updatedRecord.overtimeRate;
                updatedRecord.totalAmount = updatedRecord.regularAmount + updatedRecord.overtimeAmount;
                return updatedRecord;
              }
              return record;
            });
            
            console.log('Updated salary records with overtime hours:', updated);
            return updated;
          });
          
          toast.success('Overtime hours loaded successfully');
        } else {
          console.log('No overtime records found for this date');
        }
      } else {
        console.error('Failed to fetch overtime data, status:', response.status);
      }
    } catch (err) {
      console.error('Error fetching overtime data:', err);
    }
  };

  const fetchManpowerData = async () => {
    try {
      setLoadingManpower(true);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/overtime/manpower?date=${formattedDate}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setHasManpowerData(result.data.hasManpowerData);
          setAvailableManpowerSections(result.data.sections);
          
          // Transform overtime manpower data to salary format
          const salaryManpowerSummary = {
            totalPresentWorkers: result.data.sections.reduce((sum: number, section: any) => sum + (section.presentWorkers || 0), 0),
            totalWorkers: result.data.sections.reduce((sum: number, section: any) => sum + (section.totalWorkers || 0), 0),
            attendanceRate: 0
          };
          
          if (salaryManpowerSummary.totalWorkers > 0) {
            salaryManpowerSummary.attendanceRate = Number(((salaryManpowerSummary.totalPresentWorkers / salaryManpowerSummary.totalWorkers) * 100).toFixed(1));
          }
          
          setManpowerSummary(salaryManpowerSummary);
          
          // Create salary records for all manpower sections if we don't have any existing data
          if (result.data.hasManpowerData && result.data.sections.length > 0) {
            initializeFromManpowerData(result.data.sections);
          }
        } else {
          setHasManpowerData(false);
          setAvailableManpowerSections([]);
          // Fall back to default sections if no manpower data
          if (salaryData.length === 0) {
            initializeDefaultRecords();
          }
        }
      }
    } catch (err) {
      console.error('Error fetching manpower data:', err);
      setHasManpowerData(false);
      setAvailableManpowerSections([]);
      // Fall back to default sections on error
      if (salaryData.length === 0) {
        initializeDefaultRecords();
      }
    } finally {
      setLoadingManpower(false);
    }
  };

  const syncWithManpowerData = async (manpowerSections?: any[]) => {
    try {
      let sectionsData = manpowerSections;
      
      if (!sectionsData) {
        setLoadingManpower(true);
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const response = await fetch(`/api/overtime/manpower?date=${formattedDate}`);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data.hasManpowerData) {
            sectionsData = result.data.sections;
            setAvailableManpowerSections(result.data.sections);
            setHasManpowerData(true);
          } else {
            toast.error('No manpower data found for this date');
            setHasManpowerData(false);
            return;
          }
        } else {
          toast.error('Failed to fetch manpower data');
          return;
        }
      }

      // Define section mapping and aggregation rules (same as initialization)
      const sectionMapping = {
        'Office Staff': 'Staff',
        'Mechanical Staff': 'Staff',
        'Production Staff': 'Staff',
        'Inputman': 'Inputman',
        'Ironman': 'Ironman',
        'Cleaner': 'Cleaner',
        'Loader': 'Loader',
        'Cutting': 'Cutting',
        'Finishing': 'Finishing',
        'Quality': 'Quality',
        'Helper': 'Helper',
        'Operator': 'Operator',
        'Security': 'Security',
        'Others': 'Others'
      };

      // Aggregate workers by salary section
      const aggregatedWorkers: Record<string, number> = {};

      sectionsData?.forEach((section: any) => {
        const salarySection = sectionMapping[section.section as keyof typeof sectionMapping] || section.section;
        
        if (!aggregatedWorkers[salarySection]) {
          aggregatedWorkers[salarySection] = 0;
        }
        
        aggregatedWorkers[salarySection] += section.presentWorkers || 0;
      });

      // Update salary records with aggregated worker counts
      setSalaryData(current => 
        current.map(record => {
          const presentWorkers = aggregatedWorkers[record.section] || 0;
          const updatedRecord = {
            ...record,
            workerCount: presentWorkers
          };
          // Recalculate amounts
          updatedRecord.regularAmount = updatedRecord.workerCount * updatedRecord.regularRate;
          updatedRecord.totalAmount = updatedRecord.regularAmount + updatedRecord.overtimeAmount;
          return updatedRecord;
        })
      );

      const updatedSections = sectionsData?.map((section: any) => section.section) || [];
      console.log('Synced worker counts for sections:', updatedSections);
      toast.success('Worker counts updated from manpower data');
    } catch (err) {
      console.error('Error syncing with manpower data:', err);
      toast.error('Failed to sync with manpower data');
    } finally {
      setLoadingManpower(false);
    }
  };

  const initializeDefaultRecords = () => {
    const records = defaultSections.map(section => {
      const rate = defaultSalaryRates[section as keyof typeof defaultSalaryRates] || { regular: 345, overtime: 0 };
      return {
        section,
        workerCount: 0,
        regularRate: rate.regular,
        overtimeHours: 0,
        overtimeRate: rate.overtime,
        regularAmount: 0,
        overtimeAmount: 0,
        totalAmount: 0
      };
    });
    setSalaryData(records);
  };

  const initializeFromManpowerData = (manpowerSections: any[]) => {
    // Always initialize/update from manpower data to show all sections

    // Define section mapping and aggregation rules
    const sectionMapping = {
      'Office Staff': 'Staff',
      'Mechanical Staff': 'Staff',
      'Production Staff': 'Staff',
      'Inputman': 'Inputman',
      'Ironman': 'Ironman',
      'Cleaner': 'Cleaner',
      'Loader': 'Loader',
      'Cutting': 'Cutting',
      'Finishing': 'Finishing',
      'Quality': 'Quality',
      'Helper': 'Helper',
      'Operator': 'Operator',
      'Security': 'Security',
      'Others': 'Others'
    };

    // Aggregate workers by salary section
    const aggregatedSections: Record<string, { presentWorkers: number; totalWorkers: number; sections: string[] }> = {};

    manpowerSections.forEach(section => {
      const salarySection = sectionMapping[section.section as keyof typeof sectionMapping] || section.section;
      
      if (!aggregatedSections[salarySection]) {
        aggregatedSections[salarySection] = {
          presentWorkers: 0,
          totalWorkers: 0,
          sections: []
        };
      }
      
      aggregatedSections[salarySection].presentWorkers += section.presentWorkers || 0;
      aggregatedSections[salarySection].totalWorkers += section.totalWorkers || 0;
      aggregatedSections[salarySection].sections.push(section.section);
    });

    // Create salary records for aggregated sections
    const records = Object.entries(aggregatedSections).map(([sectionName, data]) => {
      const rate = defaultSalaryRates[sectionName as keyof typeof defaultSalaryRates] || { regular: 345, overtime: 0 };
      return {
        section: sectionName,
        workerCount: data.presentWorkers,
        regularRate: rate.regular,
        overtimeHours: 0,
        overtimeRate: rate.overtime,
        regularAmount: data.presentWorkers * rate.regular,
        overtimeAmount: 0,
        totalAmount: data.presentWorkers * rate.regular
      };
    });
    
    setSalaryData(records);
    console.log('Initialized salary records with aggregated sections:', records);
    console.log('Section aggregation details:', aggregatedSections);
    
    // Fetch overtime data after initializing records
    setTimeout(() => {
      fetchOvertimeData();
    }, 100);
  };

  const updateSalaryRecord = (section: string, field: keyof SalaryRecord, value: any) => {
    setSalaryData(records => {
      const updated = records.map(record => {
        if (record.section === section) {
          const updatedRecord = { ...record, [field]: value };
          
          // Recalculate amounts when relevant fields change
          if (['workerCount', 'regularRate', 'overtimeHours', 'overtimeRate'].includes(field)) {
            updatedRecord.regularAmount = Number(updatedRecord.workerCount) * Number(updatedRecord.regularRate);
            updatedRecord.overtimeAmount = Number(updatedRecord.overtimeHours) * Number(updatedRecord.overtimeRate);
            updatedRecord.totalAmount = updatedRecord.regularAmount + updatedRecord.overtimeAmount;
          }
          
          return updatedRecord;
        }
        return record;
      });
      
      // Update summary
      const newSummary = {
        totalSections: updated.length,
        totalWorkers: updated.reduce((sum, r) => sum + Number(r.workerCount), 0),
        totalRegularAmount: updated.reduce((sum, r) => sum + Number(r.regularAmount), 0),
        totalOvertimeAmount: updated.reduce((sum, r) => sum + Number(r.overtimeAmount), 0),
        grandTotalAmount: updated.reduce((sum, r) => sum + Number(r.totalAmount), 0),
        totalOvertimeHours: updated.reduce((sum, r) => sum + Number(r.overtimeHours), 0)
      };
      setSummary(newSummary);
      
      return updated;
    });
  };

  const saveSalaryData = async () => {
    try {
      setSaving(true);
      
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch('/api/salary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: formattedDate,
          records: salaryData
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
        setSummary(result.data.summary);
      } else {
        toast.error(result.error || 'Failed to save salary data');
      }
    } catch (err) {
      console.error('Error saving salary data:', err);
      toast.error('Failed to save salary data');
    } finally {
      setSaving(false);
    }
  };





  const getSectionBadgeColor = (section: string) => {
    switch (section) {
      case 'Staff': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Operator': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Helper': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cutting': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Finishing': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'Quality': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Security': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-2 sm:py-4 md:py-6 space-y-3 sm:space-y-4 md:space-y-6 px-2 sm:px-4 md:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-lg sm:text-2xl md:text-3xl font-bold flex items-center justify-center sm:justify-start gap-2">
            <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />
            <span className="break-words">Daily Salary Management</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm md:text-base">
            Calculate daily salary including regular and overtime payments
          </p>
        </div>
      </div>

      {/* Date Selection - Full Width */}
      <Card className="w-full">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            Select Date & Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row lg:flex-row gap-3 sm:gap-4 lg:gap-6 items-start sm:items-center lg:items-center">
            {/* Date Picker */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Date</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-10",
                      !selectedDate && "text-muted-foreground"
                    )}
                    onClick={() => setIsCalendarOpen(true)}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span className="truncate">
                      {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Pick a date"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(newDate) => {
                      if (newDate) {
                        setSelectedDate(newDate);
                        setIsCalendarOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Manpower Status */}
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <Label className="text-xs sm:text-sm font-medium">Manpower Status</Label>
              {hasManpowerData ? (
                <div className="p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg min-w-full sm:min-w-48">
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    <span className="text-xs sm:text-sm font-medium text-green-800">Available</span>
                  </div>
                  <div className="mt-1 text-xs sm:text-sm text-green-700">
                    {manpowerSummary.totalPresentWorkers} workers present
                  </div>
                </div>
              ) : (
                <div className="p-2 sm:p-3 bg-orange-50 border border-orange-200 rounded-lg min-w-full sm:min-w-48">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                    <span className="text-xs sm:text-sm font-medium text-orange-800">Not Found</span>
                  </div>
                  <div className="mt-1 text-xs sm:text-sm text-orange-700">
                    No manpower data for this date
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 w-full sm:flex-1">
              <Label className="text-xs sm:text-sm font-medium">Actions</Label>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-2">
                <Button
                  onClick={fetchSalaryData}
                  disabled={loading}
                  variant="outline"
                  className="h-8 sm:h-10 text-xs sm:text-sm flex-1 sm:flex-none"
                  size="sm"
                >
                  <RefreshCw className="h-3 w-3 mr-1 sm:mr-2" />
                  {loading ? 'Loading...' : 'Refresh'}
                </Button>

                <Button
                  onClick={() => syncWithManpowerData()} 
                  disabled={loadingManpower || !hasManpowerData}
                  variant="default"
                  className="h-8 sm:h-10 text-xs sm:text-sm flex-1 sm:flex-none"
                  size="sm"
                >
                  <Users className="h-3 w-3 mr-1 sm:mr-2" />
                  {loadingManpower ? 'Syncing...' : 'Sync Workers'}
                </Button>
                
                <Button
                  onClick={() => fetchOvertimeData()} 
                  disabled={loading}
                  variant="outline"
                  className="h-8 sm:h-10 text-xs sm:text-sm flex-1 sm:flex-none"
                  size="sm"
                >
                  <Clock className="h-3 w-3 mr-1 sm:mr-2" />
                  Load OT Hours
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              Workers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">Total in Salary:</span>
              <span className="font-bold text-sm sm:text-base">{summary.totalWorkers}</span>
            </div>
            {hasManpowerData && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">Present Today:</span>
                  <span className="font-bold text-green-600 text-sm sm:text-base">{manpowerSummary.totalPresentWorkers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">Attendance:</span>
                  <span className="font-medium text-sm sm:text-base">{manpowerSummary.attendanceRate}%</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">Sections:</span>
              <span className="font-medium text-sm sm:text-base">{summary.totalSections}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              Overtime
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">Total Hours:</span>
              <span className="font-bold text-sm sm:text-base">{summary.totalOvertimeHours}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">OT Data:</span>
              <Badge variant={summary.totalOvertimeHours > 0 ? "default" : "secondary"} className="text-xs">
                {summary.totalOvertimeHours > 0 ? "Loaded" : "No Data"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">Amount:</span>
              <span className="font-medium text-green-600 text-sm sm:text-base">{formatCurrency(summary.totalOvertimeAmount)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
              Total Amount
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">Regular:</span>
              <span className="font-medium text-sm sm:text-base">{formatCurrency(summary.totalRegularAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">Grand Total:</span>
              <span className="font-bold text-base sm:text-lg md:text-2xl text-primary">{formatCurrency(summary.grandTotalAmount)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Salary Calculation Table */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3 md:pb-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <span className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
              <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="break-words">
                Daily Salary Calculation
                <span className="hidden sm:inline"> - </span>
                <span className="block sm:inline text-xs sm:text-sm md:text-base font-normal text-muted-foreground">
                  {format(selectedDate, "MMM dd, yyyy")}
                </span>
              </span>
            </span>
            <Button 
              onClick={saveSalaryData} 
              disabled={saving}
              className="h-8 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base self-start sm:self-center"
            >
              <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-3 md:px-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Section</TableHead>
                  <TableHead className="text-center text-xs sm:text-sm">Workers</TableHead>
                  <TableHead className="text-center text-xs sm:text-sm">Regular Rate</TableHead>
                  <TableHead className="text-center text-xs sm:text-sm">Regular Amount</TableHead>
                  <TableHead className="text-center text-xs sm:text-sm">OT Hours</TableHead>
                  <TableHead className="text-center text-xs sm:text-sm">OT Rate</TableHead>
                  <TableHead className="text-center text-xs sm:text-sm">OT Amount</TableHead>
                  <TableHead className="text-center text-xs sm:text-sm">Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaryData.map((record) => (
                  <TableRow key={record.section}>
                    <TableCell>
                      <Badge className={`${getSectionBadgeColor(record.section)} text-xs sm:text-sm`}>
                        {record.section}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        value={record.workerCount}
                        onChange={(e) => updateSalaryRecord(record.section, 'workerCount', parseInt(e.target.value) || 0)}
                        className="w-12 sm:w-14 md:w-16 text-center h-7 sm:h-8 md:h-10 text-xs sm:text-sm"
                        min="0"
                      />
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        value={record.regularRate}
                        onChange={(e) => updateSalaryRecord(record.section, 'regularRate', parseFloat(e.target.value) || 0)}
                        className="w-14 sm:w-16 md:w-20 text-center h-7 sm:h-8 md:h-10 text-xs sm:text-sm"
                        min="0"
                      />
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <span className="font-medium text-blue-600 text-xs sm:text-sm">
                        {formatCurrency(record.regularAmount)}
                      </span>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        value={record.overtimeHours}
                        onChange={(e) => updateSalaryRecord(record.section, 'overtimeHours', parseFloat(e.target.value) || 0)}
                        className="w-12 sm:w-16 md:w-20 text-center h-7 sm:h-8 md:h-10 text-xs sm:text-sm"
                        min="0"
                        step="0.5"
                      />
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        value={record.overtimeRate}
                        onChange={(e) => updateSalaryRecord(record.section, 'overtimeRate', parseFloat(e.target.value) || 0)}
                        className="w-12 sm:w-16 md:w-20 text-center h-7 sm:h-8 md:h-10 text-xs sm:text-sm"
                        min="0"
                      />
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <span className="font-medium text-green-600 text-xs sm:text-sm">
                        {formatCurrency(record.overtimeAmount)}
                      </span>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <span className="font-bold text-primary text-xs sm:text-sm">
                        {formatCurrency(record.totalAmount)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>



            {/* Total Row */}
            <div className="mt-3 sm:mt-4 p-2 sm:p-3 md:p-4 bg-primary/5 rounded-lg">
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 text-center">
                <div>
                  <span className="block text-xs sm:text-sm text-muted-foreground">Total Workers</span>
                  <span className="font-bold text-sm sm:text-base md:text-lg">{summary.totalWorkers}</span>
                </div>
                <div>
                  <span className="block text-xs sm:text-sm text-muted-foreground">Regular Amount</span>
                  <span className="font-bold text-sm sm:text-base md:text-lg text-blue-600">{formatCurrency(summary.totalRegularAmount)}</span>
                </div>
                <div>
                  <span className="block text-xs sm:text-sm text-muted-foreground">Overtime Amount</span>
                  <span className="font-bold text-sm sm:text-base md:text-lg text-green-600">{formatCurrency(summary.totalOvertimeAmount)}</span>
                </div>
                <div className="col-span-1 sm:col-span-1 md:col-span-1">
                  <span className="block text-xs sm:text-sm text-muted-foreground">Grand Total</span>
                  <span className="font-bold text-base sm:text-xl md:text-2xl text-primary">{formatCurrency(summary.grandTotalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
