'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Settings, DollarSign, Users, Plus, Edit, Trash2, Save, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface SalaryRate {
  section: string;
  regular: {
    id?: string;
    amount: number;
    effectiveDate?: Date;
    createdAt?: Date;
    updatedAt?: Date;
  } | null;
  overtime: {
    id?: string;
    amount: number;
    effectiveDate?: Date;
    createdAt?: Date;
    updatedAt?: Date;
  } | null;
}

interface RateHistory {
  id: string;
  section: string;
  rateType: 'REGULAR' | 'OVERTIME';
  amount: number;
  effectiveDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function ManageSalaryRatesPage() {
  const [salaryRates, setSalaryRates] = useState<SalaryRate[]>([]);
  const [rateHistory, setRateHistory] = useState<RateHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRates, setEditingRates] = useState<Record<string, { regular: string; overtime: string }>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSection, setNewSection] = useState('');
  const [newRegularRate, setNewRegularRate] = useState('');
  const [newOvertimeRate, setNewOvertimeRate] = useState('');
  const [activeTab, setActiveTab] = useState('current');

  // Standard sections for salary management
  const standardSections = [
    'Staff', 'Operator', 'Helper', 'Cutting', 'Finishing', 'Quality', 
    'Inputman', 'Ironman', 'Cleaner', 'Loader', 'Security'
  ];

  useEffect(() => {
    fetchSalaryRates();
    
    // Restore editing state from localStorage on page load
    const savedEditingRates = localStorage.getItem('salaryRatesEditing');
    if (savedEditingRates) {
      try {
        const parsedRates = JSON.parse(savedEditingRates);
        setEditingRates(parsedRates);
      } catch (error) {
        console.error('Error parsing saved editing rates:', error);
        localStorage.removeItem('salaryRatesEditing');
      }
    }
  }, []);

  // Save editing state to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(editingRates).length > 0) {
      localStorage.setItem('salaryRatesEditing', JSON.stringify(editingRates));
    } else {
      localStorage.removeItem('salaryRatesEditing');
    }
  }, [editingRates]);

  const fetchSalaryRates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/salary-rates');
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSalaryRates(result.data.rates || []);
          setRateHistory(result.data.allRates || []);
        } else {
          toast.error(result.error || 'Failed to fetch salary rates');
        }
      } else {
        throw new Error('Failed to fetch salary rates');
      }
    } catch (error) {
      console.error('Error fetching salary rates:', error);
      toast.error('Failed to fetch salary rates');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRate = (section: string, type: 'regular' | 'overtime', value: string) => {
    setEditingRates(prev => ({
      ...prev,
      [section]: {
        regular: prev[section]?.regular || '',
        overtime: prev[section]?.overtime || '',
        [type]: value
      }
    }));
  };

  const validateRate = (value: string): boolean => {
    const num = Number(value);
    return !isNaN(num) && num >= 0;
  };

  const saveSectionRates = async (section: string) => {
    const editingData = editingRates[section];
    if (!editingData) return;

    if (editingData.regular && !validateRate(editingData.regular)) {
      toast.error('Regular rate must be a valid positive number');
      return;
    }

    if (editingData.overtime && !validateRate(editingData.overtime)) {
      toast.error('Overtime rate must be a valid positive number');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/salary-rates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rates: [{
            section,
            regular: editingData.regular || undefined,
            overtime: editingData.overtime || undefined
          }]
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Salary rates for ${section} updated successfully`);
        await fetchSalaryRates();
        
        // Clear editing state for this section
        setEditingRates(prev => {
          const newState = { ...prev };
          delete newState[section];
          
          // Update localStorage
          if (Object.keys(newState).length > 0) {
            localStorage.setItem('salaryRatesEditing', JSON.stringify(newState));
          } else {
            localStorage.removeItem('salaryRatesEditing');
          }
          
          return newState;
        });
      } else {
        toast.error(result.error || 'Failed to update salary rates');
      }
    } catch (error) {
      console.error('Error updating salary rates:', error);
      toast.error('Failed to update salary rates');
    } finally {
      setSaving(false);
    }
  };

  const saveAllRates = async () => {
    const ratesToUpdate = Object.entries(editingRates).map(([section, rates]) => ({
      section,
      regular: rates.regular || undefined,
      overtime: rates.overtime || undefined
    }));

    if (ratesToUpdate.length === 0) {
      toast.error('No changes to save');
      return;
    }

    // Validate all rates
    for (const rate of ratesToUpdate) {
      if (rate.regular && !validateRate(rate.regular)) {
        toast.error(`Invalid regular rate for ${rate.section}`);
        return;
      }
      if (rate.overtime && !validateRate(rate.overtime)) {
        toast.error(`Invalid overtime rate for ${rate.section}`);
        return;
      }
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/salary-rates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rates: ratesToUpdate }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Salary rates updated for ${result.data.updatedSections} sections`);
        await fetchSalaryRates();
        setEditingRates({});
        localStorage.removeItem('salaryRatesEditing');
      } else {
        toast.error(result.error || 'Failed to update salary rates');
      }
    } catch (error) {
      console.error('Error updating salary rates:', error);
      toast.error('Failed to update salary rates');
    } finally {
      setSaving(false);
    }
  };

  const addNewSection = async () => {
    if (!newSection.trim()) {
      toast.error('Section name is required');
      return;
    }

    if (salaryRates.some(rate => rate.section.toLowerCase() === newSection.toLowerCase())) {
      toast.error('Section already exists');
      return;
    }

    if (!validateRate(newRegularRate) || !validateRate(newOvertimeRate)) {
      toast.error('Both regular and overtime rates must be valid positive numbers');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/salary-rates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rates: [{
            section: newSection.trim(),
            regular: newRegularRate,
            overtime: newOvertimeRate
          }]
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`New section "${newSection}" added successfully`);
        await fetchSalaryRates();
        setNewSection('');
        setNewRegularRate('');
        setNewOvertimeRate('');
        setShowAddDialog(false);
      } else {
        toast.error(result.error || 'Failed to add new section');
      }
    } catch (error) {
      console.error('Error adding new section:', error);
      toast.error('Failed to add new section');
    } finally {
      setSaving(false);
    }
  };

  const getSectionBadgeColor = (section: string) => {
    const colorMap: Record<string, string> = {
      'Staff': 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      'Operator': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      'Helper': 'bg-green-100 text-green-800 hover:bg-green-200',
      'Cutting': 'bg-orange-100 text-orange-800 hover:bg-orange-200',
      'Finishing': 'bg-red-100 text-red-800 hover:bg-red-200',
      'Quality': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      'Security': 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      'Inputman': 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200',
      'Ironman': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
      'Cleaner': 'bg-pink-100 text-pink-800 hover:bg-pink-200',
      'Loader': 'bg-teal-100 text-teal-800 hover:bg-teal-200'
    };
    return colorMap[section] || 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('BDT', '৳');
  };

  const hasUnsavedChanges = Object.keys(editingRates).length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading salary rates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Manage Salary Rates
            </h1>
            <p className="text-muted-foreground">
              Set and manage salary rates for different sections
            </p>
          </div>
          
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={fetchSalaryRates}
              variant="outline"
              size="sm"
              disabled={loading}
              className="h-8 md:h-10 text-xs md:text-sm"
            >
              <RefreshCw className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Refresh
            </Button>
            
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 md:h-10 text-xs md:text-sm">
                  <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  Add Section
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Section</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newSection">Section Name</Label>
                    <Select value={newSection} onValueChange={setNewSection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select or type section name..." />
                      </SelectTrigger>
                      <SelectContent>
                        {standardSections
                          .filter(section => !salaryRates.some(rate => rate.section === section))
                          .map(section => (
                            <SelectItem key={section} value={section}>
                              {section}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="newRegularRate">Regular Rate (৳)</Label>
                    <Input
                      id="newRegularRate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newRegularRate}
                      onChange={(e) => setNewRegularRate(e.target.value)}
                      placeholder="Enter regular rate..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="newOvertimeRate">Overtime Rate (৳)</Label>
                    <Input
                      id="newOvertimeRate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newOvertimeRate}
                      onChange={(e) => setNewOvertimeRate(e.target.value)}
                      placeholder="Enter overtime rate..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={addNewSection}
                      disabled={saving || !newSection || !newRegularRate || !newOvertimeRate}
                      className="flex-1"
                    >
                      {saving ? 'Adding...' : 'Add Section'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowAddDialog(false)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sections</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salaryRates.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rate Records</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rateHistory.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unsaved Changes</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                hasUnsavedChanges ? "text-orange-600" : "text-green-600"
              )}>
                {Object.keys(editingRates).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Unsaved Changes Alert */}
        {hasUnsavedChanges && (
          <Alert className="bg-orange-50 border-orange-200">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              You have unsaved changes for {Object.keys(editingRates).length} section(s). Values are automatically saved locally and will persist on page refresh.
              <div className="flex gap-2 mt-2">
                <Button
                  variant="link"
                  size="sm"
                  onClick={saveAllRates}
                  disabled={saving}
                  className="p-0 h-auto text-orange-800 hover:text-orange-900"
                >
                  Save All Changes
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setEditingRates({});
                    localStorage.removeItem('salaryRatesEditing');
                    toast.success('All unsaved changes cleared');
                  }}
                  disabled={saving}
                  className="p-0 h-auto text-red-600 hover:text-red-700"
                >
                  Clear All Changes
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">Current Rates</TabsTrigger>
            <TabsTrigger value="history">Rate History</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  Current Salary Rates
                </CardTitle>
                {hasUnsavedChanges && (
                  <Button
                    onClick={saveAllRates}
                    disabled={saving}
                    size="sm"
                    className="h-8 text-xs"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    {saving ? 'Saving...' : 'Save All'}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="px-3 md:px-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Section</TableHead>
                        <TableHead className="text-center">Regular Rate (৳)</TableHead>
                        <TableHead className="text-center">Overtime Rate (৳)</TableHead>
                        <TableHead className="text-center">Last Updated</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salaryRates.map((rate) => (
                        <TableRow key={rate.section} className={editingRates[rate.section] ? 'bg-yellow-50' : ''}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge className={getSectionBadgeColor(rate.section)}>
                                {rate.section}
                              </Badge>
                              {editingRates[rate.section] && (
                                <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800">
                                  Editing
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-center">
                            {editingRates[rate.section] ? (
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editingRates[rate.section].regular || rate.regular?.amount.toString() || '0'}
                                onChange={(e) => handleEditRate(rate.section, 'regular', e.target.value)}
                                className="w-24 h-8 text-center"
                              />
                            ) : (
                              <span className="font-medium">
                                {formatCurrency(rate.regular?.amount || 0)}
                              </span>
                            )}
                          </TableCell>
                          
                          <TableCell className="text-center">
                            {editingRates[rate.section] ? (
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editingRates[rate.section].overtime || rate.overtime?.amount.toString() || '0'}
                                onChange={(e) => handleEditRate(rate.section, 'overtime', e.target.value)}
                                className="w-24 h-8 text-center"
                              />
                            ) : (
                              <span className="font-medium">
                                {formatCurrency(rate.overtime?.amount || 0)}
                              </span>
                            )}
                          </TableCell>
                          
                          <TableCell className="text-center text-sm text-muted-foreground">
                            {rate.regular?.updatedAt || rate.overtime?.updatedAt ? 
                              format(new Date(rate.regular?.updatedAt || rate.overtime?.updatedAt || new Date()), 'MMM dd, yyyy') : 
                              'Never'
                            }
                          </TableCell>
                          
                          <TableCell className="text-center">
                            <div className="flex gap-1 justify-center">
                              {editingRates[rate.section] ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => saveSectionRates(rate.section)}
                                    disabled={saving}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Save className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingRates(prev => {
                                        const newState = { ...prev };
                                        delete newState[rate.section];
                                        
                                        // Update localStorage
                                        if (Object.keys(newState).length > 0) {
                                          localStorage.setItem('salaryRatesEditing', JSON.stringify(newState));
                                        } else {
                                          localStorage.removeItem('salaryRatesEditing');
                                        }
                                        
                                        return newState;
                                      });
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    ×
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingRates(prev => ({
                                      ...prev,
                                      [rate.section]: {
                                        regular: rate.regular?.amount.toString() || '0',
                                        overtime: rate.overtime?.amount.toString() || '0'
                                      }
                                    }));
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Rate Change History
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 md:px-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Section</TableHead>
                        <TableHead className="text-center">Rate Type</TableHead>
                        <TableHead className="text-center">Amount (৳)</TableHead>
                        <TableHead className="text-center">Effective Date</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rateHistory
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((historyItem) => (
                        <TableRow key={historyItem.id}>
                          <TableCell>
                            <Badge className={getSectionBadgeColor(historyItem.section)}>
                              {historyItem.section}
                            </Badge>
                          </TableCell>
                          
                          <TableCell className="text-center">
                            <Badge variant={historyItem.rateType === 'REGULAR' ? 'default' : 'secondary'}>
                              {historyItem.rateType}
                            </Badge>
                          </TableCell>
                          
                          <TableCell className="text-center font-medium">
                            {formatCurrency(historyItem.amount)}
                          </TableCell>
                          
                          <TableCell className="text-center text-sm">
                            {format(new Date(historyItem.effectiveDate), 'MMM dd, yyyy')}
                          </TableCell>
                          
                          <TableCell className="text-center">
                            <Badge variant={historyItem.isActive ? 'default' : 'outline'}>
                              {historyItem.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          
                          <TableCell className="text-center text-sm text-muted-foreground">
                            {format(new Date(historyItem.createdAt), 'MMM dd, yyyy HH:mm')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
