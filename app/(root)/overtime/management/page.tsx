'use client';

import { useState, useEffect } from 'react';
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
  manpowerDisplay: string; // Format like "22/28"
}

interface OvertimeDetail {
  hours: number;
  workerCount: number;
}

interface OvertimeRecord {
  section: string;
  presentWorkers: number;
  totalWorkers: number;
  overtimeDetails: OvertimeDetail[];
  totalOtHours: number;
}

export default function OvertimeManagementPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [manpowerSections, setManpowerSections] = useState<ManpowerSection[]>([]);
  const [overtimeRecords, setOvertimeRecords] = useState<OvertimeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasManpowerData, setHasManpowerData] = useState(false);
  const [summary, setSummary] = useState({
    totalSections: 0,
    totalPresentWorkers: 0,
    totalWorkers: 0,
    totalOtHours: 0
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Fetch overtime data first, then manpower data
      // This ensures overtime details are loaded before manpower data overwrites them
      const loadData = async () => {
        await fetchOvertimeData();
        await fetchManpowerData();
      };
      loadData();
    }
  }, [selectedDate, mounted]);

  const fetchManpowerData = async () => {
    try {
      setLoading(true);
      const formattedDate = selectedDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format, consistent with timezone
      const response = await fetch(`/api/overtime/manpower?date=${formattedDate}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch manpower data');
      }

      const result = await response.json();
      
      if (result.success) {
        setManpowerSections(result.data.sections);
        setHasManpowerData(result.data.hasManpowerData);
        
        // Always update manpower data, but preserve overtime details if they exist
        if (overtimeRecords.length === 0) {
          // No existing records, create new ones with empty overtime details
          const initialRecords = result.data.sections.map((section: ManpowerSection) => ({
            section: section.section,
            presentWorkers: section.presentWorkers,
            totalWorkers: section.totalWorkers,
            overtimeDetails: [],
            totalOtHours: 0
          }));
          setOvertimeRecords(initialRecords);
        } else {
          // Update manpower data for existing records, preserve overtime details
          const updatedRecords = result.data.sections.map((manpowerSection: ManpowerSection) => {
            const existingRecord = overtimeRecords.find(r => r.section === manpowerSection.section);
            if (existingRecord) {
              // Keep existing overtime details, update manpower data
              return {
                ...existingRecord,
                presentWorkers: manpowerSection.presentWorkers,
                totalWorkers: manpowerSection.totalWorkers
              };
            } else {
              // New section found in manpower data
              return {
                section: manpowerSection.section,
                presentWorkers: manpowerSection.presentWorkers,
                totalWorkers: manpowerSection.totalWorkers,
                overtimeDetails: [],
                totalOtHours: 0
              };
            }
          });
          
          // Only update records if we don't have overtime data already loaded
          // This prevents overwriting overtime details during normal operations
          if (overtimeRecords.length === 0 || overtimeRecords.every(r => r.overtimeDetails.length === 0)) {
            setOvertimeRecords(updatedRecords);
          } else {
            // Just update manpower data without affecting overtime details
            setOvertimeRecords(currentRecords => 
              currentRecords.map(currentRecord => {
                const manpowerData = result.data.sections.find((s: ManpowerSection) => s.section === currentRecord.section);
                if (manpowerData) {
                  return {
                    ...currentRecord,
                    presentWorkers: manpowerData.presentWorkers,
                    totalWorkers: manpowerData.totalWorkers
                  };
                }
                return currentRecord;
              })
            );
          }
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
      const formattedDate = selectedDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format, consistent with timezone
      const response = await fetch(`/api/overtime?date=${formattedDate}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.records.length > 0) {
          const mappedRecords = result.data.records.map((record: any) => ({
            section: record.section,
            presentWorkers: record.presentWorkers,
            totalWorkers: record.totalWorkers,
            overtimeDetails: record.overtimeDetails || [],
            totalOtHours: record.totalOtHours
          }));
          
          // Always prioritize database data for overtime details, but merge with manpower data
          setOvertimeRecords(mappedRecords);
          setSummary(result.data.summary);
        } else {
          // No overtime data found, but keep existing records if they have manpower data
          if (overtimeRecords.length > 0) {
            // Reset overtime details but keep manpower structure
            const resetRecords = overtimeRecords.map(record => ({
              ...record,
              overtimeDetails: [],
              totalOtHours: 0
            }));
            setOvertimeRecords(resetRecords);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching overtime data:', err);
    }
  };

  const updateOvertimeRecord = (section: string, overtimeDetails: OvertimeDetail[]) => {
    setOvertimeRecords(records => {
      const updated = records.map(record => {
        if (record.section === section) {
          // Calculate total OT hours from details
          const totalOtHours = overtimeDetails.reduce((sum, detail) => {
            return sum + (detail.workerCount * detail.hours);
          }, 0);
          
          return {
            ...record,
            overtimeDetails,
            totalOtHours
          };
        }
        return record;
      });
      
      // Update summary
      const newSummary = {
        totalSections: updated.length,
        totalPresentWorkers: updated.reduce((sum, r) => sum + Number(r.presentWorkers), 0),
        totalWorkers: updated.reduce((sum, r) => sum + Number(r.totalWorkers), 0),
        totalOtHours: updated.reduce((sum, r) => sum + Number(r.totalOtHours), 0)
      };
      setSummary(newSummary);
      
      return updated;
    });
  };

  const addOvertimeDetail = (section: string) => {
    const record = overtimeRecords.find(r => r.section === section);
    if (!record) return;

    const newDetail: OvertimeDetail = { hours: 0, workerCount: 0 };
    const updatedDetails = [...record.overtimeDetails, newDetail];
    updateOvertimeRecord(section, updatedDetails);
  };

  const updateOvertimeDetail = (section: string, index: number, field: keyof OvertimeDetail, value: number) => {
    const record = overtimeRecords.find(r => r.section === section);
    if (!record) return;

    // If updating worker count, validate against available workers
    if (field === 'workerCount') {
      const currentTotalWorkers = record.overtimeDetails.reduce((sum, detail, i) => {
        return sum + (i === index ? 0 : detail.workerCount); // Exclude current detail being updated
      }, 0);
      
      const maxAllowedForThisDetail = record.presentWorkers - currentTotalWorkers;
      value = Math.min(value, maxAllowedForThisDetail, record.presentWorkers);
      value = Math.max(0, value); // Ensure non-negative
    }

    const updatedDetails = record.overtimeDetails.map((detail, i) => 
      i === index ? { ...detail, [field]: value } : detail
    );
    updateOvertimeRecord(section, updatedDetails);
  };

  const getTotalAssignedWorkers = (record: OvertimeRecord) => {
    return record.overtimeDetails.reduce((sum, detail) => sum + detail.workerCount, 0);
  };

 

  const getAvailableWorkers = (record: OvertimeRecord) => {
    return record.presentWorkers - getTotalAssignedWorkers(record);
  };

  const removeOvertimeDetail = (section: string, index: number) => {
    const record = overtimeRecords.find(r => r.section === section);
    if (!record) return;

    const updatedDetails = record.overtimeDetails.filter((_, i) => i !== index);
    updateOvertimeRecord(section, updatedDetails);
  };

  const saveOvertimeData = async () => {
    try {
      setSaving(true);
      
      const formattedDate = selectedDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format, consistent with timezone
      

      
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
        toast.success(result.message || 'Overtime data saved successfully');
        setSummary(result.data.summary);
        
        // Update the summary but keep the current UI state
        // The data is already saved, so no need to reload
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
    const colorMap: Record<string, string> = {
      'Operator': 'bg-blue-100 text-blue-800 border-blue-200',
      'Helper': 'bg-green-100 text-green-800 border-green-200',
      'Cutting': 'bg-orange-100 text-orange-800 border-orange-200',
      'Finishing': 'bg-purple-100 text-purple-800 border-purple-200',
      'Quality': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colorMap[section] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Prevent hydration mismatch by not rendering until client-side mounted
  if (!mounted) {
    return (
      <div className="container mx-auto py-6 space-y-6" suppressHydrationWarning={true}>
        <div className="flex items-center justify-center py-12" suppressHydrationWarning={true}>
          <div className="text-center space-y-3" suppressHydrationWarning={true}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading overtime management...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6" suppressHydrationWarning={true}>
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
                  {selectedDate ? selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
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
              <span className="text-sm text-muted-foreground">Present Workers:</span>
              <span className="font-medium text-green-600">{summary.totalPresentWorkers}</span>
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
                {summary.totalPresentWorkers > 0 ? (summary.totalOtHours / summary.totalPresentWorkers).toFixed(1) : '0'}h
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
              Overtime Hours Entry - {selectedDate.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
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
            <div className="flex items-center justify-center py-12" suppressHydrationWarning={true}>
              <div className="text-center space-y-3" suppressHydrationWarning={true}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Loading manpower data...</p>
              </div>
            </div>
          ) : !hasManpowerData ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No manpower data found for {selectedDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}. 
                Please import manpower data first from the "Import from Excel" page.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {overtimeRecords.map((record) => {
                const manpowerSection = manpowerSections.find(s => s.section === record.section);
                return (
                  <Card key={record.section} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={getSectionBadgeColor(record.section)}>
                            {record.section}
                          </Badge>
                          {manpowerSection?.type === 'line_group' && manpowerSection.lineCount && (
                            <span className="text-sm text-muted-foreground">
                              ({manpowerSection.lineCount} lines)
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {manpowerSection?.manpowerDisplay || `${record.presentWorkers}/${record.totalWorkers}`}
                          </div>
                          <div className="text-xs text-muted-foreground">Present/Total</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Overtime Details */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Label className="text-sm font-medium">Overtime Breakdown:</Label>
                            <div className="text-xs text-muted-foreground">
                              Available: <span className="font-medium text-green-600">{getAvailableWorkers(record)}</span> / 
                              <span className="font-medium">{record.presentWorkers}</span> workers
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addOvertimeDetail(record.section)}
                            disabled={getAvailableWorkers(record) === 0}
                            className="h-7 px-3 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>

                        {record.overtimeDetails.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground bg-gray-50 rounded-lg">
                            No overtime assigned. Click "Add" to assign overtime hours.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {record.overtimeDetails.map((detail, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-blue-50">
                                
                                <div className="flex items-center gap-3 flex-1">
                                  {/* People Input */}
                                  <div className="flex items-center gap-2">
                                    <Label className="text-sm font-medium min-w-[60px]">People:</Label>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => updateOvertimeDetail(record.section, index, 'workerCount', Math.max(0, detail.workerCount - 1))}
                                        disabled={detail.workerCount <= 0}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <Input
                                        type="number"
                                        value={detail.workerCount}
                                        onChange={(e) => updateOvertimeDetail(record.section, index, 'workerCount', parseInt(e.target.value) || 0)}
                                        className="w-16 text-center h-7"
                                        min="0"
                                        max={getAvailableWorkers(record) + detail.workerCount}
                                      />
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => updateOvertimeDetail(record.section, index, 'workerCount', detail.workerCount + 1)}
                                        disabled={getAvailableWorkers(record) <= 0}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Hours Input */}
                                  <div className="flex items-center gap-2">
                                    <Label className="text-sm font-medium min-w-[45px]">Hours:</Label>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => updateOvertimeDetail(record.section, index, 'hours', Math.max(0, detail.hours - 0.5))}
                                        disabled={detail.hours <= 0}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <Input
                                        type="number"
                                        value={detail.hours}
                                        onChange={(e) => updateOvertimeDetail(record.section, index, 'hours', parseFloat(e.target.value) || 0)}
                                        className="w-16 text-center h-7"
                                        min="0"
                                        max="24"
                                        step="0.5"
                                      />
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => updateOvertimeDetail(record.section, index, 'hours', Math.min(24, detail.hours + 0.5))}
                                        disabled={detail.hours >= 24}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Total Calculation */}
                                  <div className="text-sm font-medium text-purple-600 min-w-[80px]">
                                    = {(detail.workerCount * detail.hours).toFixed(1)} hrs
                                  </div>
                                </div>

                                {/* Remove Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => removeOvertimeDetail(record.section, index)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Total for this section */}
                        <div className="flex justify-between items-center pt-3 border-t">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Section Total:</span>
                            <div className="text-xs text-muted-foreground">
                              ({getTotalAssignedWorkers(record)} of {record.presentWorkers} workers assigned)
                            </div>
                          </div>
                          <span className="font-bold text-xl text-primary">
                            {record.totalOtHours.toFixed(1)} hours
                          </span>
                        </div>

                        {/* Full allocation warning */}
                        {getAvailableWorkers(record) === 0 && record.presentWorkers > 0 && (
                          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                            ⚠️ All available workers ({record.presentWorkers}) have been assigned overtime
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Grand Total */}
              <Card className="border-2 border-primary bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">Grand Total Overtime Hours:</span>
                    <span className="font-bold text-3xl text-primary">
                      {summary.totalOtHours} hours
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
