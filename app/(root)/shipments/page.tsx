'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, AlertCircle, Package, Download, Filter, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface Shipment {
  id: string;
  date: string;
  styleId: string;
  quantity: number;
  destination: string;
  awbOrContainer?: string;
  remarks?: string;
  style: {
    styleNumber: string;
    buyer: string;
    poNumber: string;
    orderQty: number;
    unitPrice: number;
  };
}

interface Style {
  id: string;
  styleNumber: string;
  buyer: string;
  poNumber: string;
  orderQty: number;
  unitPrice: number;
}

interface ShipmentSummary {
  totalShipments: number;
  totalQuantity: number;
  totalValue: number;
  byDestination: Record<string, {
    destination: string;
    count: number;
    quantity: number;
    value: number;
  }>;
  byStyle: Record<string, {
    styleNumber: string;
    buyer: string;
    poNumber: string;
    count: number;
    quantity: number;
    value: number;
  }>;
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    styleId: '',
    poNumber: '',
    destination: ''
  });
  const [summary, setSummary] = useState<ShipmentSummary | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    styleId: '',
    quantity: 0,
    destination: '',
    awbOrContainer: '',
    remarks: ''
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  useEffect(() => {
    fetchStyles();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        ...(filters.styleId && { styleId: filters.styleId }),
        ...(filters.poNumber && { poNumber: filters.poNumber }),
        ...(filters.destination && { destination: filters.destination })
      });

      const response = await fetch(`/api/shipments?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch shipments');
      }

      const data = await response.json();
      setShipments(data.shipments || []);
      setSummary(data.summary || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to fetch shipments');
    } finally {
      setLoading(false);
    }
  };

  const fetchStyles = async () => {
    try {
      const response = await fetch('/api/styles');
      if (response.ok) {
        const data = await response.json();
        setStyles(data.styles || []);
      }
    } catch (err) {
      console.error('Failed to fetch styles:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingShipment 
        ? `/api/shipments/${editingShipment.id}`
        : '/api/shipments';
      
      const method = editingShipment ? 'PUT' : 'POST';
      const body = {
        ...formData,
        quantity: parseInt(formData.quantity.toString())
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save shipment');
      }

      toast.success(editingShipment ? 'Shipment updated successfully' : 'Shipment created successfully');
      setIsDialogOpen(false);
      setEditingShipment(null);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleEdit = (shipment: Shipment) => {
    setEditingShipment(shipment);
    setFormData({
      date: shipment.date,
      styleId: shipment.styleId,
      quantity: shipment.quantity,
      destination: shipment.destination,
      awbOrContainer: shipment.awbOrContainer || '',
      remarks: shipment.remarks || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shipment?')) return;
    
    try {
      const response = await fetch(`/api/shipments/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete shipment');
      }

      toast.success('Shipment deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete shipment');
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      styleId: '',
      quantity: 0,
      destination: '',
      awbOrContainer: '',
      remarks: ''
    });
  };

  const exportReport = () => {
    if (shipments.length === 0) {
      toast.error('No data to export');
      return;
    }

    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `shipment_report_${filters.startDate}_${filters.endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateCSV = () => {
    const headers = [
      'Date',
      'Style Number',
      'Buyer',
      'PO Number',
      'Quantity',
      'Destination',
      'AWB/Container',
      'Remarks',
      'Value'
    ];

    const rows = shipments.map(shipment => [
      shipment.date,
      shipment.style.styleNumber,
      shipment.style.buyer,
      shipment.style.poNumber,
      shipment.quantity,
      shipment.destination,
      shipment.awbOrContainer || '',
      shipment.remarks || '',
      (shipment.quantity * shipment.style.unitPrice).toFixed(2)
    ]);

    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading && shipments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && shipments.length === 0) {
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
          <h1 className="text-3xl font-bold tracking-tight">Shipments</h1>
          <p className="text-muted-foreground">
            Track shipment records and generate reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportReport} disabled={shipments.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingShipment(null);
                resetForm();
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Shipment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingShipment ? 'Edit Shipment' : 'Add Shipment'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="date">Shipment Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="styleId">Style</Label>
                  <Select
                    value={formData.styleId}
                    onValueChange={(value) => setFormData({ ...formData, styleId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      {styles.map((style) => (
                        <SelectItem key={style.id} value={style.id}>
                          {style.styleNumber} - {style.buyer} (PO: {style.poNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="Enter destination..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="awbOrContainer">AWB/Container (Optional)</Label>
                  <Input
                    id="awbOrContainer"
                    value={formData.awbOrContainer}
                    onChange={(e) => setFormData({ ...formData, awbOrContainer: e.target.value })}
                    placeholder="Enter AWB or container number..."
                  />
                </div>

                <div>
                  <Label htmlFor="remarks">Remarks (Optional)</Label>
                  <Input
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="Enter additional remarks..."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingShipment ? 'Update' : 'Create'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingShipment(null);
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

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalShipments}</div>
              <p className="text-xs text-muted-foreground">
                Shipments in period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalQuantity.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Pieces shipped
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalValue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Value shipped
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Value</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {summary.totalQuantity > 0 
                  ? formatCurrency(summary.totalValue / summary.totalQuantity)
                  : '$0.00'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Per piece
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="styleId">Style</Label>
              <Select
                value={filters.styleId}
                onValueChange={(value) => setFilters({ ...filters, styleId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All styles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All styles</SelectItem>
                  {styles.map((style) => (
                    <SelectItem key={style.id} value={style.id}>
                      {style.styleNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="poNumber">PO Number</Label>
              <Input
                id="poNumber"
                value={filters.poNumber}
                onChange={(e) => setFilters({ ...filters, poNumber: e.target.value })}
                placeholder="Filter by PO..."
              />
            </div>
            <div>
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                value={filters.destination}
                onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
                placeholder="Filter by destination..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shipment Records</CardTitle>
          <p className="text-sm text-muted-foreground">
            {shipments.length} shipments found
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No shipments found for the selected criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Style</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>AWB/Container</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell>{shipment.date}</TableCell>
                      <TableCell className="font-medium">
                        {shipment.style.styleNumber}
                      </TableCell>
                      <TableCell>{shipment.style.buyer}</TableCell>
                      <TableCell>{shipment.style.poNumber}</TableCell>
                      <TableCell className="text-right">
                        {shipment.quantity.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {shipment.destination}
                        </div>
                      </TableCell>
                      <TableCell>
                        {shipment.awbOrContainer || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(shipment.quantity * shipment.style.unitPrice)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(shipment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(shipment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Tables */}
      {summary && (
        <>
          {/* By Destination */}
          <Card>
            <CardHeader>
              <CardTitle>Shipments by Destination</CardTitle>
              <p className="text-sm text-muted-foreground">
                Breakdown of shipments by destination
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Destination</TableHead>
                    <TableHead className="text-right">Shipments</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(summary.byDestination).map((dest) => (
                    <TableRow key={dest.destination}>
                      <TableCell className="font-medium">{dest.destination}</TableCell>
                      <TableCell className="text-right">{dest.count}</TableCell>
                      <TableCell className="text-right">{dest.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(dest.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* By Style */}
          <Card>
            <CardHeader>
              <CardTitle>Shipments by Style</CardTitle>
              <p className="text-sm text-muted-foreground">
                Breakdown of shipments by style
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Style</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>PO Number</TableHead>
                    <TableHead className="text-right">Shipments</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(summary.byStyle).map((style) => (
                    <TableRow key={style.styleNumber}>
                      <TableCell className="font-medium">{style.styleNumber}</TableCell>
                      <TableCell>{style.buyer}</TableCell>
                      <TableCell>{style.poNumber}</TableCell>
                      <TableCell className="text-right">{style.count}</TableCell>
                      <TableCell className="text-right">{style.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(style.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
