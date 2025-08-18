'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { IconPlus, IconEdit, IconTrash, IconEye, IconRefresh, IconFilter, IconDownload } from '@tabler/icons-react';
import { toast } from 'sonner';

// Interfaces
interface DailyProductionEntry {
  id: string;
  date: string;
  programCode: string;
  styleNo: string;
  lineNo: string;
  shift: 'Day' | 'Night';
  inputQty: number;
  outputQty: number;
  defectQty: number;
  reworkQty: number;
  efficiency: number;
  target: number;
  achievement: number;
  operator: string;
  supervisor: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

interface BalanceReportEntry {
  programCode: string;
  styleNo: string;
  lineNo: string;
  totalProduction: number;
  totalTarget: number;
  variance: number;
  efficiency: number;
  status: 'On Track' | 'Behind' | 'Ahead';
}

interface DailyProductionFormData {
  date: string;
  programCode: string;
  styleNo: string;
  lineNo: string;
  shift: 'Day' | 'Night';
  inputQty: number;
  outputQty: number;
  defectQty: number;
  reworkQty: number;
  target: number;
  operator: string;
  supervisor: string;
  remarks?: string;
}

export default function DailyProductionReportPage() {
  const [entries, setEntries] = useState<DailyProductionEntry[]>([]);
  const [balanceData, setBalanceData] = useState<BalanceReportEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DailyProductionEntry | null>(null);

  
  const [formData, setFormData] = useState<DailyProductionFormData>({
    date: new Date().toISOString().split('T')[0],
    programCode: '',
    styleNo: '',
    lineNo: '',
    shift: 'Day',
    inputQty: 0,
    outputQty: 0,
    defectQty: 0,
    reworkQty: 0,
    target: 0,
    operator: '',
    supervisor: '',
    remarks: ''
  });

  // Mock data for demonstration
  const mockEntries: DailyProductionEntry[] = [
    {
      id: '1',
      date: '2025-01-17',
      programCode: 'PRG-001',
      styleNo: 'STY-001',
      lineNo: 'LINE-A',
      shift: 'Day',
      inputQty: 1000,
      outputQty: 950,
      defectQty: 30,
      reworkQty: 20,
      efficiency: 95,
      target: 1000,
      achievement: 95,
      operator: 'John Doe',
      supervisor: 'Jane Smith',
      remarks: 'Good production day',
      createdAt: '2025-01-17T08:00:00Z',
      updatedAt: '2025-01-17T17:00:00Z'
    },
    {
      id: '2',
      date: '2025-01-17',
      programCode: 'PRG-002',
      styleNo: 'STY-002',
      lineNo: 'LINE-B',
      shift: 'Day',
      inputQty: 800,
      outputQty: 780,
      defectQty: 15,
      reworkQty: 5,
      efficiency: 97.5,
      target: 800,
      achievement: 97.5,
      operator: 'Mike Johnson',
      supervisor: 'Sarah Wilson',
      remarks: 'Minor quality issues resolved',
      createdAt: '2025-01-17T08:00:00Z',
      updatedAt: '2025-01-17T17:00:00Z'
    }
  ];

  const mockBalanceData: BalanceReportEntry[] = [
    {
      programCode: 'PRG-001',
      styleNo: 'STY-001',
      lineNo: 'LINE-A',
      totalProduction: 4750,
      totalTarget: 5000,
      variance: -250,
      efficiency: 95,
      status: 'Behind'
    },
    {
      programCode: 'PRG-002',
      styleNo: 'STY-002',
      lineNo: 'LINE-B',
      totalProduction: 3900,
      totalTarget: 4000,
      variance: -100,
      efficiency: 97.5,
      status: 'Behind'
    },
    {
      programCode: 'PRG-003',
      styleNo: 'STY-003',
      lineNo: 'LINE-C',
      totalProduction: 2100,
      totalTarget: 2000,
      variance: 100,
      efficiency: 105,
      status: 'Ahead'
    }
  ];

  useEffect(() => {
    fetchEntries();
    fetchBalanceData();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/production/daily-reports');
      // const data = await response.json();
      setEntries(mockEntries);
    } catch (error) {
      console.error('Error fetching daily production entries:', error);
      toast.error('Failed to fetch daily production entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalanceData = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/production/balance-report');
      // const data = await response.json();
      setBalanceData(mockBalanceData);
    } catch (error) {
      console.error('Error fetching balance data:', error);
      toast.error('Failed to fetch balance data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const calculatedEfficiency = formData.target > 0 ? (formData.outputQty / formData.target) * 100 : 0;
      const calculatedAchievement = calculatedEfficiency;

      const newEntry: DailyProductionEntry = {
        id: editingEntry ? editingEntry.id : Date.now().toString(),
        ...formData,
        efficiency: calculatedEfficiency,
        achievement: calculatedAchievement,
        createdAt: editingEntry ? editingEntry.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingEntry) {
        // TODO: Replace with actual API call
        // await fetch(`/api/production/daily-reports/${editingEntry.id}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(newEntry)
        // });
        setEntries(prev => prev.map(entry => 
          entry.id === editingEntry.id ? newEntry : entry
        ));
        toast.success('Daily production entry updated successfully');
      } else {
        // TODO: Replace with actual API call
        // await fetch('/api/production/daily-reports', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(newEntry)
        // });
        setEntries(prev => [...prev, newEntry]);
        toast.success('Daily production entry created successfully');
      }

      handleSheetClose();
      fetchBalanceData(); // Refresh balance data
    } catch (error) {
      console.error('Error saving daily production entry:', error);
      toast.error('Failed to save daily production entry');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry: DailyProductionEntry) => {
    setFormData({
      date: entry.date,
      programCode: entry.programCode,
      styleNo: entry.styleNo,
      lineNo: entry.lineNo,
      shift: entry.shift,
      inputQty: entry.inputQty,
      outputQty: entry.outputQty,
      defectQty: entry.defectQty,
      reworkQty: entry.reworkQty,
      target: entry.target,
      operator: entry.operator,
      supervisor: entry.supervisor,
      remarks: entry.remarks || ''
    });
    setEditingEntry(entry);
    setSheetOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/production/daily-reports/${id}`, {
      //   method: 'DELETE'
      // });
      setEntries(prev => prev.filter(entry => entry.id !== id));
      toast.success('Daily production entry deleted successfully');
      fetchBalanceData(); // Refresh balance data
      } catch (error) {
      console.error('Error deleting daily production entry:', error);
      toast.error('Failed to delete daily production entry');
      } finally {
        setLoading(false);
      }
    };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setEditingEntry(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      programCode: '',
      styleNo: '',
      lineNo: '',
      shift: 'Day',
      inputQty: 0,
      outputQty: 0,
      defectQty: 0,
      reworkQty: 0,
      target: 0,
      operator: '',
      supervisor: '',
      remarks: ''
    });
  };

  const getStatusBadge = (status: BalanceReportEntry['status']) => {
    const colors = {
      'On Track': 'bg-green-100 text-green-800',
      'Behind': 'bg-red-100 text-red-800',
      'Ahead': 'bg-blue-100 text-blue-800'
    };
    return <Badge className={colors[status]}>{status}</Badge>;
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 100) return 'text-green-600';
    if (efficiency >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

    return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Daily Production Report</h2>
          <p className="text-muted-foreground">
            Track daily production activities and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchEntries} disabled={loading}>
            <IconRefresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <IconFilter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <IconDownload className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Balance Report - First Table */}
      <Card>
        <CardHeader>
          <CardTitle>Production Balance Report</CardTitle>
          <CardDescription>
            Summary of production performance by program code, style, and line
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program Code</TableHead>
                  <TableHead>Style No</TableHead>
                  <TableHead>Line No</TableHead>
                  <TableHead>Total Production</TableHead>
                  <TableHead>Total Target</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Efficiency</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balanceData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No balance data available.
                    </TableCell>
                  </TableRow>
                ) : (
                  balanceData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.programCode}</TableCell>
                      <TableCell>{item.styleNo}</TableCell>
                      <TableCell>{item.lineNo}</TableCell>
                      <TableCell>{item.totalProduction.toLocaleString()}</TableCell>
                      <TableCell>{item.totalTarget.toLocaleString()}</TableCell>
                      <TableCell className={item.variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {item.variance >= 0 ? '+' : ''}{item.variance.toLocaleString()}
                      </TableCell>
                      <TableCell className={getEfficiencyColor(item.efficiency)}>
                        {item.efficiency.toFixed(1)}%
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Daily Production Report - Second Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daily Production Entries</CardTitle>
              <CardDescription>
                View and manage daily production records
              </CardDescription>
            </div>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button onClick={() => setEditingEntry(null)}>
                  <IconPlus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </SheetTrigger>
                <SheetContent className="w-full sm:w-[600px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>
                      {editingEntry ? 'Edit Production Entry' : 'Add New Production Entry'}
                    </SheetTitle>
                    <SheetDescription>
                      {editingEntry 
                        ? 'Update the production entry details'
                        : 'Enter daily production information'
                      }
                    </SheetDescription>
                  </SheetHeader>

                  <form onSubmit={handleSubmit} className="space-y-6 mt-6 pb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date" className="text-sm font-medium">
                          Date
                        </Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                          className="w-full"
                          required
                        />
      </div>

                      <div className="space-y-2">
                        <Label htmlFor="shift" className="text-sm font-medium">
                          Shift
                        </Label>
                        <Select
                          value={formData.shift}
                          onValueChange={(value: 'Day' | 'Night') =>
                            setFormData(prev => ({ ...prev, shift: value }))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select shift" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Day">Day Shift</SelectItem>
                            <SelectItem value="Night">Night Shift</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="programCode" className="text-sm font-medium">
                          Program Code
                        </Label>
                        <Input
                          id="programCode"
                          value={formData.programCode}
                          onChange={(e) => setFormData(prev => ({ ...prev, programCode: e.target.value }))}
                          placeholder="e.g., PRG-001"
                          className="w-full"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="styleNo" className="text-sm font-medium">
                          Style Number
                        </Label>
                        <Input
                          id="styleNo"
                          value={formData.styleNo}
                          onChange={(e) => setFormData(prev => ({ ...prev, styleNo: e.target.value }))}
                          placeholder="e.g., STY-001"
                          className="w-full"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lineNo" className="text-sm font-medium">
                          Line Number
                        </Label>
                        <Input
                          id="lineNo"
                          value={formData.lineNo}
                          onChange={(e) => setFormData(prev => ({ ...prev, lineNo: e.target.value }))}
                          placeholder="e.g., LINE-A"
                          className="w-full"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="target" className="text-sm font-medium">
                          Target Quantity
                        </Label>
                        <Input
                          id="target"
                          type="number"
                          min="0"
                          value={formData.target}
                          onChange={(e) => setFormData(prev => ({ ...prev, target: parseInt(e.target.value) || 0 }))}
                          placeholder="e.g., 1000"
                          className="w-full"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="inputQty" className="text-sm font-medium">
                          Input Quantity
                        </Label>
                        <Input
                          id="inputQty"
                          type="number"
                          min="0"
                          value={formData.inputQty}
                          onChange={(e) => setFormData(prev => ({ ...prev, inputQty: parseInt(e.target.value) || 0 }))}
                          placeholder="e.g., 1000"
                          className="w-full"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="outputQty" className="text-sm font-medium">
                          Output Quantity
                        </Label>
                        <Input
                          id="outputQty"
                          type="number"
                          min="0"
                          value={formData.outputQty}
                          onChange={(e) => setFormData(prev => ({ ...prev, outputQty: parseInt(e.target.value) || 0 }))}
                          placeholder="e.g., 950"
                          className="w-full"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="defectQty" className="text-sm font-medium">
                          Defect Quantity
                        </Label>
                        <Input
                          id="defectQty"
                          type="number"
                          min="0"
                          value={formData.defectQty}
                          onChange={(e) => setFormData(prev => ({ ...prev, defectQty: parseInt(e.target.value) || 0 }))}
                          placeholder="e.g., 30"
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reworkQty" className="text-sm font-medium">
                          Rework Quantity
                        </Label>
                        <Input
                          id="reworkQty"
                          type="number"
                          min="0"
                          value={formData.reworkQty}
                          onChange={(e) => setFormData(prev => ({ ...prev, reworkQty: parseInt(e.target.value) || 0 }))}
                          placeholder="e.g., 20"
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="operator" className="text-sm font-medium">
                          Operator
                        </Label>
                        <Input
                          id="operator"
                          value={formData.operator}
                          onChange={(e) => setFormData(prev => ({ ...prev, operator: e.target.value }))}
                          placeholder="e.g., John Doe"
                          className="w-full"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="supervisor" className="text-sm font-medium">
                          Supervisor
                        </Label>
                        <Input
                          id="supervisor"
                          value={formData.supervisor}
                          onChange={(e) => setFormData(prev => ({ ...prev, supervisor: e.target.value }))}
                          placeholder="e.g., Jane Smith"
                          className="w-full"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="remarks" className="text-sm font-medium">
                        Remarks
                      </Label>
                      <Input
                        id="remarks"
                        value={formData.remarks}
                        onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                        placeholder="Optional remarks"
                        className="w-full"
                      />
                    </div>

                    <Separator />

                    <div className="flex flex-col sm:flex-row gap-3 pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSheetClose}
                        className="w-full sm:w-auto order-2 sm:order-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto order-1 sm:order-2"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          editingEntry ? 'Update Entry' : 'Create Entry'
                        )}
                      </Button>
                    </div>
                  </form>
                </SheetContent>
              </Sheet>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Program Code</TableHead>
                    <TableHead>Style No</TableHead>
                    <TableHead>Line No</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Output</TableHead>
                    <TableHead>Efficiency</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center">
                        No daily production entries found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{entry.programCode}</TableCell>
                        <TableCell>{entry.styleNo}</TableCell>
                        <TableCell>{entry.lineNo}</TableCell>
                        <TableCell>
                          <Badge variant={entry.shift === 'Day' ? 'default' : 'secondary'}>
                            {entry.shift}
                          </Badge>
                        </TableCell>
                        <TableCell>{entry.target.toLocaleString()}</TableCell>
                        <TableCell>{entry.outputQty.toLocaleString()}</TableCell>
                        <TableCell className={getEfficiencyColor(entry.efficiency)}>
                          {entry.efficiency.toFixed(1)}%
                        </TableCell>
                        <TableCell>{entry.operator}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(entry)}
                            >
                              <IconEdit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(entry.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <IconTrash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
