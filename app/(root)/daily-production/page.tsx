'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ProductionEntry {
  id: string;
  date: string;
  hourIndex: number;
  lineId: string;
  styleId: string;
  stage: 'CUTTING' | 'SEWING' | 'FINISHING';
  inputQty: number;
  outputQty: number;
  defectQty: number;
  reworkQty: number;
  notes?: string;
  line: {
    name: string;
    code: string;
    factory: {
      name: string;
    };
  };
  style: {
    styleNumber: string;
    buyer: string;
  };
}

interface Line {
  id: string;
  name: string;
  code: string;
}

interface Style {
  id: string;
  styleNumber: string;
  buyer: string;
}

export default function DailyProductionPage() {
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ProductionEntry | null>(null);
  const [formData, setFormData] = useState({
    hourIndex: 8,
    lineId: '',
    styleId: '',
    stage: 'CUTTING' as 'CUTTING' | 'SEWING' | 'FINISHING',
    inputQty: 0,
    outputQty: 0,
    defectQty: 0,
    reworkQty: 0,
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [entriesRes, linesRes, stylesRes] = await Promise.all([
        fetch(`/api/production/entries?date=${selectedDate}`),
        fetch('/api/lines'),
        fetch('/api/styles')
      ]);

      if (!entriesRes.ok || !linesRes.ok || !stylesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [entriesData, linesData, stylesData] = await Promise.all([
        entriesRes.json(),
        linesRes.json(),
        stylesRes.json()
      ]);

      setEntries(entriesData.entries || []);
      setLines(linesData || []);
      setStyles(stylesData.styles || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingEntry 
        ? `/api/production/entries/${editingEntry.id}`
        : '/api/production/entries';
      
      const method = editingEntry ? 'PUT' : 'POST';
      const body = {
        ...formData,
        date: selectedDate
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save entry');
      }

      toast.success(editingEntry ? 'Entry updated successfully' : 'Entry created successfully');
      setIsDialogOpen(false);
      setEditingEntry(null);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleEdit = (entry: ProductionEntry) => {
    setEditingEntry(entry);
    setFormData({
      hourIndex: entry.hourIndex,
      lineId: entry.lineId,
      styleId: entry.styleId,
      stage: entry.stage,
      inputQty: entry.inputQty,
      outputQty: entry.outputQty,
      defectQty: entry.defectQty,
      reworkQty: entry.reworkQty,
      notes: entry.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      const response = await fetch(`/api/production/entries/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete entry');
      }

      toast.success('Entry deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete entry');
    }
  };

  const resetForm = () => {
    setFormData({
      hourIndex: 8,
      lineId: '',
      styleId: '',
      stage: 'CUTTING',
      inputQty: 0,
      outputQty: 0,
      defectQty: 0,
      reworkQty: 0,
      notes: ''
    });
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'CUTTING':
        return 'bg-blue-100 text-blue-800';
      case 'SEWING':
        return 'bg-green-100 text-green-800';
      case 'FINISHING':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getHourLabel = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchData} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Production</h1>
          <p className="text-muted-foreground">
            Track hourly production entries for each line and style
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="date">Date:</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingEntry(null);
                resetForm();
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingEntry ? 'Edit Production Entry' : 'Add Production Entry'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hourIndex">Hour</Label>
                    <Select
                      value={formData.hourIndex.toString()}
                      onValueChange={(value) => setFormData({ ...formData, hourIndex: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {getHourLabel(i)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="stage">Stage</Label>
                    <Select
                      value={formData.stage}
                      onValueChange={(value: 'CUTTING' | 'SEWING' | 'FINISHING') => 
                        setFormData({ ...formData, stage: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CUTTING">Cutting</SelectItem>
                        <SelectItem value="SEWING">Sewing</SelectItem>
                        <SelectItem value="FINISHING">Finishing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="lineId">Production Line</Label>
                  <Select
                    value={formData.lineId}
                    onValueChange={(value) => setFormData({ ...formData, lineId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select line" />
                    </SelectTrigger>
                    <SelectContent>
                      {lines.map((line) => (
                        <SelectItem key={line.id} value={line.id}>
                          {line.name} ({line.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="styleId">Style</Label>
                  <Select
                    value={formData.styleId}
                    onValueChange={(value) => setFormData({ ...formData, styleId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      {styles.map((style) => (
                        <SelectItem key={style.id} value={style.id}>
                          {style.styleNumber} - {style.buyer}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="inputQty">Input Qty</Label>
                    <Input
                      id="inputQty"
                      type="number"
                      min="0"
                      value={formData.inputQty}
                      onChange={(e) => setFormData({ ...formData, inputQty: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="outputQty">Output Qty</Label>
                    <Input
                      id="outputQty"
                      type="number"
                      min="0"
                      value={formData.outputQty}
                      onChange={(e) => setFormData({ ...formData, outputQty: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="defectQty">Defect Qty</Label>
                    <Input
                      id="defectQty"
                      type="number"
                      min="0"
                      value={formData.defectQty}
                      onChange={(e) => setFormData({ ...formData, defectQty: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reworkQty">Rework Qty</Label>
                    <Input
                      id="reworkQty"
                      type="number"
                      min="0"
                      value={formData.reworkQty}
                      onChange={(e) => setFormData({ ...formData, reworkQty: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optional notes..."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingEntry ? 'Update' : 'Create'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingEntry(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Production Entries */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Production Entries</h2>
        {entries.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No production entries for {selectedDate}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {entries.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">
                          {getHourLabel(entry.hourIndex)}
                        </Badge>
                        <Badge className={getStageColor(entry.stage)}>
                          {entry.stage}
                        </Badge>
                        <span className="font-medium">
                          {entry.line.name} ({entry.line.code})
                        </span>
                        <span className="text-muted-foreground">
                          - {entry.style.styleNumber}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Input:</span>
                          <span className="ml-2 font-medium">{entry.inputQty}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Output:</span>
                          <span className="ml-2 font-medium">{entry.outputQty}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Defects:</span>
                          <span className="ml-2 font-medium text-red-600">{entry.defectQty}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Rework:</span>
                          <span className="ml-2 font-medium text-orange-600">{entry.reworkQty}</span>
                        </div>
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Notes: {entry.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(entry)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
