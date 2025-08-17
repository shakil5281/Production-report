'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Users, Calculator, Save, RefreshCw, AlertTriangle, Plus, Minus } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface ManpowerSection {
  section: string;
  type: 'section' | 'line_group';
  presentWorkers: number;
  totalWorkers: number;
  suggestedWorkers: number;
  lineCount?: number;
}

interface OvertimeRecord {
  section: string;
  workerCount: number;
  otHours: number;
  totalOtHours: number;
  remarks: string;
}

export default function OvertimeManagementPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [manpowerSections, setManpowerSections] = useState<ManpowerSection[]>([]);
  const [overtimeRecords, setOvertimeRecords] = useState<OvertimeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasManpowerData, setHasManpowerData] = useState(false);
  const [summary, setSummary] = useState({
    totalSections: 0,
    totalWorkers: 0,
    totalOtHours: 0
  });

  useEffect(() => {
    fetchManpowerData();
    fetchOvertimeData();
  }, [selectedDate]);

  const fetchManpowerData = async () => {
    try {
      setLoading(true);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/overtime/manpower?date=${formattedDate}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch manpower data');
      }

      const result = await response.json();
      
      if (result.success) {
        setManpowerSections(result.data.sections);
        setHasManpowerData(result.data.hasManpowerData);
        
        // Initialize overtime records if empty
        if (overtimeRecords.length === 0) {
          const initialRecords = result.data.sections.map((section: ManpowerSection) => ({
            section: section.section,
            workerCount: section.suggestedWorkers,
            otHours: 0,
            totalOtHours: 0,
            remarks: ''
          }));
          setOvertimeRecords(initialRecords);
        }
      } else {
        setHasManpowerData(false);
        setManpowerSections([]);
        toast.error(result.error || 'Failed to fetch manpower data');
      }
    } catch (err) {
      console.error('Error fetching manpower data:', err);
      setHasManpowerData(false);
      toast.error('Failed to fetch manpower data');
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
          setOvertimeRecords(result.data.records);
          setSummary(result.data.summary);
        }
      }
    } catch (err) {
      console.error('Error fetching overtime data:', err);
    }
  };

  const updateOvertimeRecord = (section: string, field: keyof OvertimeRecord, value: any) => {
    setOvertimeRecords(records => {
      const updated = records.map(record => {
        if (record.section === section) {
          const updatedRecord = { ...record, [field]: value };
          
          // Recalculate total OT hours when worker count or OT hours change
          if (field === 'workerCount' || field === 'otHours') {
            updatedRecord.totalOtHours = Number(updatedRecord.workerCount) * Number(updatedRecord.otHours);
          }
          
          return updatedRecord;
        }
        return record;
      });
      
      // Update summary
      const newSummary = {
        totalSections: updated.length,
        totalWorkers: updated.reduce((sum, r) => sum + Number(r.workerCount), 0),
        totalOtHours: updated.reduce((sum, r) => sum + Number(r.totalOtHours), 0)
      };
      setSummary(newSummary);
      
      return updated;
    });
  };

  const saveOvertimeData = async () => {
    try {
      setSaving(true);
      
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch('/api/overtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: formattedDate,
          records: overtimeRecords
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
        setSummary(result.data.summary);
      } else {
        toast.error(result.error || 'Failed to save overtime data');
      }
    } catch (err) {
      console.error('Error saving overtime data:', err);
      toast.error('Failed to save overtime data');
    } finally {
      setSaving(false);
    }
  };

  const getSectionBadgeColor = (section: string) => {
    switch (section) {
      case 'Operator': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Helper': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cutting': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Finishing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Quality': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clock className="h-8 w-8 text-primary" />
            Overtime Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage daily overtime hours by section
          </p>
        </div>
      </div>

      {/* Date Selection & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                onClick={fetchManpowerData} 
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
              
              <Button 
                onClick={saveOvertimeData} 
                disabled={saving || !hasManpowerData}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Workers Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Sections:</span>
              <span className="font-medium">{summary.totalSections}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Workers:</span>
              <span className="font-medium">{summary.totalWorkers}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Overtime Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total OT Hours:</span>
              <span className="font-bold text-2xl text-primary">{summary.totalOtHours}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Average OT/Worker:</span>
              <span className="font-medium">
                {summary.totalWorkers > 0 ? (summary.totalOtHours / summary.totalWorkers).toFixed(1) : '0'}h
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overtime Data Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Overtime Hours Entry - {format(selectedDate, "MMMM dd, yyyy")}
            </span>
            {hasManpowerData && (
              <Badge variant="secondary">
                {overtimeRecords.length} sections
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Loading manpower data...</p>
              </div>
            </div>
          ) : !hasManpowerData ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No manpower data found for {format(selectedDate, "MMMM dd, yyyy")}. 
                Please import manpower data first from the "Import from Excel" page.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Section</TableHead>
                    <TableHead className="text-center">Available Workers</TableHead>
                    <TableHead className="text-center">Workers for OT</TableHead>
                    <TableHead className="text-center">OT Hours</TableHead>
                    <TableHead className="text-center">Total OT Hours</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overtimeRecords.map((record, index) => {
                    const manpowerSection = manpowerSections.find(s => s.section === record.section);
                    return (
                      <TableRow key={record.section}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={getSectionBadgeColor(record.section)}>
                              {record.section}
                            </Badge>
                            {manpowerSection?.type === 'line_group' && manpowerSection.lineCount && (
                              <span className="text-xs text-muted-foreground">
                                ({manpowerSection.lineCount} lines)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-center">
                          <span className="font-medium text-green-600">
                            {manpowerSection?.presentWorkers || 0}
                          </span>
                          <span className="text-muted-foreground">
                            /{manpowerSection?.totalWorkers || 0}
                          </span>
                        </TableCell>
                        
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => updateOvertimeRecord(record.section, 'workerCount', Math.max(0, record.workerCount - 1))}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={record.workerCount}
                              onChange={(e) => updateOvertimeRecord(record.section, 'workerCount', parseInt(e.target.value) || 0)}
                              className="w-16 text-center"
                              min="0"
                              max={manpowerSection?.presentWorkers || 999}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => updateOvertimeRecord(record.section, 'workerCount', Math.min(manpowerSection?.presentWorkers || 999, record.workerCount + 1))}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => updateOvertimeRecord(record.section, 'otHours', Math.max(0, record.otHours - 0.5))}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={record.otHours}
                              onChange={(e) => updateOvertimeRecord(record.section, 'otHours', parseFloat(e.target.value) || 0)}
                              className="w-16 text-center"
                              min="0"
                              step="0.5"
                              max="24"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => updateOvertimeRecord(record.section, 'otHours', Math.min(24, record.otHours + 0.5))}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-center">
                          <span className="font-bold text-primary text-lg">
                            {record.totalOtHours}
                          </span>
                          <span className="text-muted-foreground text-sm ml-1">hrs</span>
                        </TableCell>
                        
                        <TableCell>
                          <Input
                            placeholder="Optional remarks..."
                            value={record.remarks}
                            onChange={(e) => updateOvertimeRecord(record.section, 'remarks', e.target.value)}
                            className="w-full"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Total Row */}
              <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">Total Overtime Hours:</span>
                  <span className="font-bold text-2xl text-primary">
                    {summary.totalOtHours} hours
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
