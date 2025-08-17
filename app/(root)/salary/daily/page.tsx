'use client';

import { useState, useEffect } from 'react';
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

interface SalaryRecord {
  section: string;
  workerCount: number;
  regularRate: number;
  overtimeHours: number;
  overtimeRate: number;
  regularAmount: number;
  overtimeAmount: number;
  totalAmount: number;
  remarks: string;
}

interface SalaryRate {
  section: string;
  regular: { amount: number };
  overtime: { amount: number };
}

export default function DailySalaryPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [salaryRates, setSalaryRates] = useState<SalaryRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showRatesDialog, setShowRatesDialog] = useState(false);
  const [summary, setSummary] = useState({
    totalSections: 0,
    totalWorkers: 0,
    totalRegularAmount: 0,
    totalOvertimeAmount: 0,
    grandTotalAmount: 0,
    totalOvertimeHours: 0
  });

  // Default sections as per your image
  const defaultSections = [
    'Staff', 'Operator', 'Helper', 'Cutting', 'Finishing', 'Quality', 'Security'
  ];

  useEffect(() => {
    fetchSalaryRates();
    fetchSalaryData();
    fetchOvertimeData();
  }, [selectedDate]);

  const fetchSalaryRates = async () => {
    try {
      const response = await fetch('/api/salary/rates');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSalaryRates(result.data.rates);
        }
      }
    } catch (err) {
      console.error('Error fetching salary rates:', err);
    }
  };

  const fetchSalaryData = async () => {
    try {
      setLoading(true);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/salary?date=${formattedDate}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.records.length > 0) {
          setSalaryRecords(result.data.records);
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
      const response = await fetch(`/api/overtime?date=${formattedDate}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.records.length > 0) {
          // Update salary records with overtime hours from overtime management
          setSalaryRecords(current => 
            current.map(record => {
              const overtimeRecord = result.data.records.find((ot: any) => ot.section === record.section);
              if (overtimeRecord) {
                const updatedRecord = {
                  ...record,
                  overtimeHours: overtimeRecord.totalOtHours || 0
                };
                // Recalculate amounts
                updatedRecord.overtimeAmount = updatedRecord.overtimeHours * updatedRecord.overtimeRate;
                updatedRecord.totalAmount = updatedRecord.regularAmount + updatedRecord.overtimeAmount;
                return updatedRecord;
              }
              return record;
            })
          );
        }
      }
    } catch (err) {
      console.error('Error fetching overtime data:', err);
    }
  };

  const initializeDefaultRecords = () => {
    const records = defaultSections.map(section => {
      const rate = salaryRates.find(r => r.section === section);
      return {
        section,
        workerCount: 0,
        regularRate: rate?.regular?.amount || 0,
        overtimeHours: 0,
        overtimeRate: rate?.overtime?.amount || 0,
        regularAmount: 0,
        overtimeAmount: 0,
        totalAmount: 0,
        remarks: ''
      };
    });
    setSalaryRecords(records);
  };

  const updateSalaryRecord = (section: string, field: keyof SalaryRecord, value: any) => {
    setSalaryRecords(records => {
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
          records: salaryRecords
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

  const updateSalaryRates = async (updatedRates: SalaryRate[]) => {
    try {
      const response = await fetch('/api/salary/rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rates: updatedRates }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Salary rates updated successfully');
        setSalaryRates(updatedRates);
        setShowRatesDialog(false);
        
        // Update current records with new rates
        setSalaryRecords(current => 
          current.map(record => {
            const rate = updatedRates.find(r => r.section === record.section);
            if (rate) {
              const updatedRecord = {
                ...record,
                regularRate: rate.regular.amount,
                overtimeRate: rate.overtime.amount
              };
              // Recalculate amounts
              updatedRecord.regularAmount = updatedRecord.workerCount * updatedRecord.regularRate;
              updatedRecord.overtimeAmount = updatedRecord.overtimeHours * updatedRecord.overtimeRate;
              updatedRecord.totalAmount = updatedRecord.regularAmount + updatedRecord.overtimeAmount;
              return updatedRecord;
            }
            return record;
          })
        );
      } else {
        toast.error(result.error || 'Failed to update salary rates');
      }
    } catch (err) {
      console.error('Error updating salary rates:', err);
      toast.error('Failed to update salary rates');
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
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-primary" />
            Daily Salary Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Calculate daily salary including regular and overtime payments
          </p>
        </div>
      </div>

      {/* Date Selection & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Date Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(newDate) => newDate && setSelectedDate(newDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <div className="flex gap-2">
              <Button 
                onClick={fetchSalaryData} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              
              <Dialog open={showRatesDialog} onOpenChange={setShowRatesDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    Rates
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Manage Salary Rates</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Section</TableHead>
                          <TableHead>Regular Rate</TableHead>
                          <TableHead>Overtime Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salaryRates.map((rate, index) => (
                          <TableRow key={rate.section}>
                            <TableCell>{rate.section}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={rate.regular.amount}
                                onChange={(e) => {
                                  const updated = [...salaryRates];
                                  updated[index].regular.amount = parseFloat(e.target.value) || 0;
                                  setSalaryRates(updated);
                                }}
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={rate.overtime.amount}
                                onChange={(e) => {
                                  const updated = [...salaryRates];
                                  updated[index].overtime.amount = parseFloat(e.target.value) || 0;
                                  setSalaryRates(updated);
                                }}
                                className="w-24"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <Button onClick={() => updateSalaryRates(salaryRates)}>
                      Update Rates
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Workers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total:</span>
              <span className="font-bold">{summary.totalWorkers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Sections:</span>
              <span className="font-medium">{summary.totalSections}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Overtime
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Hours:</span>
              <span className="font-bold">{summary.totalOvertimeHours}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Amount:</span>
              <span className="font-medium text-green-600">{formatCurrency(summary.totalOvertimeAmount)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Total Amount
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Regular:</span>
              <span className="font-medium">{formatCurrency(summary.totalRegularAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Grand Total:</span>
              <span className="font-bold text-2xl text-primary">{formatCurrency(summary.grandTotalAmount)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Salary Calculation Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Daily Salary Calculation - {format(selectedDate, "MMMM dd, yyyy")}
            </span>
            <Button 
              onClick={saveSalaryData} 
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Section</TableHead>
                  <TableHead className="text-center">Workers</TableHead>
                  <TableHead className="text-center">Regular Rate</TableHead>
                  <TableHead className="text-center">Regular Amount</TableHead>
                  <TableHead className="text-center">OT Hours</TableHead>
                  <TableHead className="text-center">OT Rate</TableHead>
                  <TableHead className="text-center">OT Amount</TableHead>
                  <TableHead className="text-center">Total Amount</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaryRecords.map((record) => (
                  <TableRow key={record.section}>
                    <TableCell>
                      <Badge className={getSectionBadgeColor(record.section)}>
                        {record.section}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        value={record.workerCount}
                        onChange={(e) => updateSalaryRecord(record.section, 'workerCount', parseInt(e.target.value) || 0)}
                        className="w-16 text-center"
                        min="0"
                      />
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        value={record.regularRate}
                        onChange={(e) => updateSalaryRecord(record.section, 'regularRate', parseFloat(e.target.value) || 0)}
                        className="w-20 text-center"
                        min="0"
                      />
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <span className="font-medium text-blue-600">
                        {formatCurrency(record.regularAmount)}
                      </span>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        value={record.overtimeHours}
                        onChange={(e) => updateSalaryRecord(record.section, 'overtimeHours', parseFloat(e.target.value) || 0)}
                        className="w-20 text-center"
                        min="0"
                        step="0.5"
                      />
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        value={record.overtimeRate}
                        onChange={(e) => updateSalaryRecord(record.section, 'overtimeRate', parseFloat(e.target.value) || 0)}
                        className="w-20 text-center"
                        min="0"
                      />
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <span className="font-medium text-green-600">
                        {formatCurrency(record.overtimeAmount)}
                      </span>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <span className="font-bold text-primary">
                        {formatCurrency(record.totalAmount)}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <Input
                        placeholder="Optional remarks..."
                        value={record.remarks}
                        onChange={(e) => updateSalaryRecord(record.section, 'remarks', e.target.value)}
                        className="w-full"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Total Row */}
            <div className="mt-4 p-4 bg-primary/5 rounded-lg">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <span className="block text-sm text-muted-foreground">Total Workers</span>
                  <span className="font-bold text-lg">{summary.totalWorkers}</span>
                </div>
                <div>
                  <span className="block text-sm text-muted-foreground">Regular Amount</span>
                  <span className="font-bold text-lg text-blue-600">{formatCurrency(summary.totalRegularAmount)}</span>
                </div>
                <div>
                  <span className="block text-sm text-muted-foreground">Overtime Amount</span>
                  <span className="font-bold text-lg text-green-600">{formatCurrency(summary.totalOvertimeAmount)}</span>
                </div>
                <div>
                  <span className="block text-sm text-muted-foreground">Grand Total</span>
                  <span className="font-bold text-2xl text-primary">{formatCurrency(summary.grandTotalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
