'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { useCalendarAutoClose } from '@/hooks/use-calendar-auto-close';

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
  const { isCalendarOpen, setIsCalendarOpen } = useCalendarAutoClose();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [manpowerData, setManpowerData] = useState<ManpowerSection[]>([]);
  const [overtimeRecords, setOvertimeRecords] = useState<OvertimeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasManpowerData, setHasManpowerData] = useState(false);
  const [mounted, setMounted] = useState(false);
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
        const overtimeData = await fetchOvertimeDataAndReturn();
        await fetchManpowerDataWithOvertimeData(overtimeData);
      };
      loadData();
    }
  }, [selectedDate, mounted]);


  const fetchManpowerDataWithOvertimeData = async (currentOvertimeRecords: OvertimeRecord[]) => {
    try {
      setLoading(true);
      const formattedDate = selectedDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format, consistent with timezone
      console.log('Fetching manpower data, received overtimeRecords length:', currentOvertimeRecords.length);
      const response = await fetch(`/api/overtime/manpower?date=${formattedDate}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch manpower data');
      }

      const result = await response.json();
      
      if (result.success) {
        setManpowerData(result.data.sections);
        setHasManpowerData(result.data.hasManpowerData);
        
        console.log('Before manpower merge - current overtime records:', currentOvertimeRecords);
        
        // Always update manpower data, but preserve overtime details if they exist
        if (currentOvertimeRecords.length === 0) {
          // No existing records, create new ones with empty overtime details
          const initialRecords = result.data.sections.map((section: ManpowerSection) => ({
            section: section.section,
            presentWorkers: section.presentWorkers,
            totalWorkers: section.totalWorkers,
            overtimeDetails: [],
            totalOtHours: 0
          }));
          console.log('Setting initial records:', initialRecords);
          setOvertimeRecords(initialRecords);
        } else {
          // Update manpower data for existing records, preserve overtime details
          const updatedRecords = result.data.sections.map((manpowerSection: ManpowerSection) => {
            const existingRecord = currentOvertimeRecords.find(r => r.section === manpowerSection.section);
            if (existingRecord) {
              // Keep existing overtime details, update manpower data
              console.log(`Preserving overtime data for ${manpowerSection.section}: ${existingRecord.overtimeDetails?.length || 0} details`);
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
          
          console.log('Setting updated records with preserved overtime:', updatedRecords);
          setOvertimeRecords(updatedRecords);
        }
      } else {
        setHasManpowerData(false);
        setManpowerData([]);
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

  const fetchManpowerData = async () => {
    try {
      setLoading(true);
      const formattedDate = selectedDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format, consistent with timezone
      console.log('Fetching manpower data, current overtimeRecords length:', overtimeRecords.length);
      const response = await fetch(`/api/overtime/manpower?date=${formattedDate}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch manpower data');
      }

      const result = await response.json();
      
      if (result.success) {
        setManpowerData(result.data.sections);
        setHasManpowerData(result.data.hasManpowerData);
        
        console.log('Before manpower merge - overtimeRecords:', overtimeRecords);
        
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
        setManpowerData([]);
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

  const fetchOvertimeDataAndReturn = async (): Promise<OvertimeRecord[]> => {
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
          
          // console.log('Setting overtime records with mappedRecords:', mappedRecords);
          setOvertimeRecords(mappedRecords);
          setSummary(result.data.summary);
          
          return mappedRecords;
        }
      }
    } catch (err) {
      console.error('Error fetching overtime data:', err);
    }
    return [];
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
            console.log('Setting overtime records with mappedRecords:', mappedRecords);
            setOvertimeRecords(mappedRecords);
            setSummary(result.data.summary);
            
            // Verify the state was set
            setTimeout(() => {
              console.log('Overtime records after setState (with timeout):', overtimeRecords);
            }, 100);
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
      
      // Format date as YYYY-MM-DD in local timezone to avoid timezone issues
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      

      
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
    <div className="container mx-auto py-4 md:py-6 space-y-4 md:space-y-6 px-4 md:px-6" suppressHydrationWarning={true}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center justify-center sm:justify-start gap-2">
            <Clock className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <span className="break-words">Overtime Management</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Manage daily overtime hours by section
          </p>
        </div>
      </div>

      {/* Date Selection & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Date Selection */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarIcon className="h-4 w-4 md:h-5 md:w-5" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10 md:h-11",
                    !selectedDate && "text-muted-foreground"
                  )}
                  onClick={() => setIsCalendarOpen(true)}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  <span className="text-sm md:text-base">
                    {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Pick a date'}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
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

            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={fetchManpowerData} 
                disabled={loading}
                variant="outline"
                className="h-10 md:h-11 text-sm md:text-base"
                size="sm"
              >
                <RefreshCw className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">{loading ? 'Loading...' : 'Refresh'}</span>
                <span className="sm:hidden">{loading ? '...' : 'Refresh'}</span>
              </Button>
              
              <Button 
                onClick={saveOvertimeData} 
                disabled={saving || !hasManpowerData}
                className="h-10 md:h-11 text-sm md:text-base"
                size="sm"
              >
                <Save className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
                <span className="sm:hidden">{saving ? '...' : 'Save'}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-4 w-4 md:h-5 md:w-5" />
              Workers Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 md:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm text-muted-foreground">Total Sections:</span>
              <span className="font-medium text-sm md:text-base">{summary.totalSections}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm text-muted-foreground">Present Workers:</span>
              <span className="font-medium text-green-600 text-sm md:text-base">{summary.totalPresentWorkers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm text-muted-foreground">Total Workers:</span>
              <span className="font-medium text-sm md:text-base">{summary.totalWorkers}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-4 w-4 md:h-5 md:w-5" />
              Overtime Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 md:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm text-muted-foreground">Total OT Hours:</span>
              <span className="font-bold text-lg md:text-2xl text-primary">{summary.totalOtHours}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm text-muted-foreground">Average OT/Worker:</span>
              <span className="font-medium text-sm md:text-base">
                {summary.totalPresentWorkers > 0 ? (summary.totalOtHours / summary.totalPresentWorkers).toFixed(1) : '0'}h
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overtime Data Entry */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <span className="flex items-center gap-2 text-lg md:text-xl">
              <Calculator className="h-4 w-4 md:h-5 md:w-5" />
              <span className="break-words">
                Overtime Hours Entry
                <span className="hidden sm:inline"> - </span>
                <span className="block sm:inline text-sm md:text-base font-normal text-muted-foreground">
                  {selectedDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
              </span>
            </span>
            {hasManpowerData && (
              <Badge variant="secondary" className="text-xs md:text-sm self-start sm:self-center">
                {overtimeRecords.length} sections
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6">
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
            <div className="space-y-4 md:space-y-6">
              {overtimeRecords.map((record) => {
                const manpowerSection = manpowerData.find(s => s.section === record.section);
                return (
                  <Card key={record.section} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <Badge className={`${getSectionBadgeColor(record.section)} text-xs md:text-sm`}>
                            {record.section}
                          </Badge>
                          {manpowerSection?.type === 'line_group' && manpowerSection.lineCount && (
                            <span className="text-xs md:text-sm text-muted-foreground">
                              ({manpowerSection.lineCount} lines)
                            </span>
                          )}
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="text-xl md:text-2xl font-bold text-green-600">
                            {manpowerSection?.manpowerDisplay || `${record.presentWorkers}/${record.totalWorkers}`}
                          </div>
                          <div className="text-xs text-muted-foreground">Present/Total</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-3 md:px-6">
                      {/* Overtime Details */}
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <Label className="text-sm md:text-base font-medium">Overtime Breakdown:</Label>
                            <div className="text-xs md:text-sm text-muted-foreground">
                              Available: <span className="font-medium text-green-600">{getAvailableWorkers(record)}</span> / 
                              <span className="font-medium">{record.presentWorkers}</span> workers
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addOvertimeDetail(record.section)}
                            disabled={getAvailableWorkers(record) === 0}
                            className="h-9 md:h-8 px-4 md:px-3 text-sm md:text-xs self-start sm:self-center"
                          >
                            <Plus className="h-4 w-4 md:h-3 md:w-3 mr-2 md:mr-1" />
                            Add
                          </Button>
                        </div>

                        {record.overtimeDetails.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground bg-gray-50 rounded-lg">
                            No overtime assigned. Click "Add" to assign overtime hours.
                          </div>
                        ) : (
                          <div className="space-y-3 md:space-y-2">
                            {record.overtimeDetails.map((detail, index) => (
                              <div key={index} className="flex flex-col lg:flex-row lg:items-center gap-3 p-3 md:p-4 border rounded-lg bg-blue-50">
                                
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                                  {/* People Input */}
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Label className="text-sm md:text-base font-medium min-w-[60px] md:min-w-[70px]">People:</Label>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 w-9 md:h-8 md:w-8 p-0 touch-manipulation"
                                        onClick={() => updateOvertimeDetail(record.section, index, 'workerCount', Math.max(0, detail.workerCount - 1))}
                                        disabled={detail.workerCount <= 0}
                                      >
                                        <Minus className="h-4 w-4 md:h-3 md:w-3" />
                                      </Button>
                                      <Input
                                        type="number"
                                        value={detail.workerCount}
                                        onChange={(e) => updateOvertimeDetail(record.section, index, 'workerCount', parseInt(e.target.value) || 0)}
                                        className="w-16 md:w-14 text-center h-9 md:h-8 text-sm md:text-base"
                                        min="0"
                                        max={getAvailableWorkers(record) + detail.workerCount}
                                      />
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 w-9 md:h-8 md:w-8 p-0 touch-manipulation"
                                        onClick={() => updateOvertimeDetail(record.section, index, 'workerCount', detail.workerCount + 1)}
                                        disabled={getAvailableWorkers(record) <= 0}
                                      >
                                        <Plus className="h-4 w-4 md:h-3 md:w-3" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Hours Input */}
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Label className="text-sm md:text-base font-medium min-w-[50px] md:min-w-[55px]">Hours:</Label>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 w-9 md:h-8 md:w-8 p-0 touch-manipulation"
                                        onClick={() => updateOvertimeDetail(record.section, index, 'hours', Math.max(0, detail.hours - 0.5))}
                                        disabled={detail.hours <= 0}
                                      >
                                        <Minus className="h-4 w-4 md:h-3 md:w-3" />
                                      </Button>
                                      <Input
                                        type="number"
                                        value={detail.hours}
                                        onChange={(e) => updateOvertimeDetail(record.section, index, 'hours', parseFloat(e.target.value) || 0)}
                                        className="w-16 md:w-14 text-center h-9 md:h-8 text-sm md:text-base"
                                        min="0"
                                        max="24"
                                        step="0.5"
                                      />
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 w-9 md:h-8 md:w-8 p-0 touch-manipulation"
                                        onClick={() => updateOvertimeDetail(record.section, index, 'hours', Math.min(24, detail.hours + 0.5))}
                                        disabled={detail.hours >= 24}
                                      >
                                        <Plus className="h-4 w-4 md:h-3 md:w-3" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Total Calculation */}
                                  <div className="text-sm md:text-base font-medium text-purple-600 min-w-[90px] md:min-w-[100px] text-center sm:text-left">
                                    = {(detail.workerCount * detail.hours).toFixed(1)} hrs
                                  </div>
                                </div>

                                {/* Remove Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-9 w-9 md:h-8 md:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 self-end lg:self-center touch-manipulation"
                                  onClick={() => removeOvertimeDetail(record.section, index)}
                                >
                                  <Minus className="h-4 w-4 md:h-3 md:w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Total for this section */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-3 border-t">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="font-medium text-sm md:text-base">Section Total:</span>
                            <div className="text-xs md:text-sm text-muted-foreground">
                              ({getTotalAssignedWorkers(record)} of {record.presentWorkers} workers assigned)
                            </div>
                          </div>
                          <span className="font-bold text-lg md:text-xl text-primary self-start sm:self-center">
                            {record.totalOtHours.toFixed(1)} hours
                          </span>
                        </div>

                        {/* Full allocation warning */}
                        {getAvailableWorkers(record) === 0 && record.presentWorkers > 0 && (
                          <div className="text-xs md:text-sm text-amber-600 bg-amber-50 p-2 md:p-3 rounded border border-amber-200">
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
                <CardContent className="pt-4 md:pt-6 px-4 md:px-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-center sm:text-left">
                    <span className="font-semibold text-base md:text-lg">Grand Total Overtime Hours:</span>
                    <span className="font-bold text-2xl md:text-3xl text-primary">
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
