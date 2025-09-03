'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Upload, 
  Database, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Settings,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ExportOptions {
  format: 'json' | 'csv';
  tables: string[];
}

interface ImportOptions {
  mode: 'merge' | 'replace';
  tables: string[];
}

interface ImportResult {
  success: boolean;
  message: string;
  results: {
    imported: number;
    errors: number;
    details: Record<string, any>;
  };
}

const AVAILABLE_TABLES = [
  { id: 'users', name: 'Users', description: 'User accounts and permissions' },
  { id: 'factories', name: 'Factories', description: 'Factory information' },
  { id: 'lines', name: 'Production Lines', description: 'Production line data' },
  { id: 'styles', name: 'Styles', description: 'Style definitions' },
  { id: 'productionList', name: 'Production List', description: 'Production orders' },
  { id: 'targets', name: 'Targets', description: 'Production targets' },
  { id: 'dailyProductionReport', name: 'Daily Production Reports', description: 'Daily production data' },
  { id: 'productionEntries', name: 'Production Entries', description: 'Individual production entries' },
  { id: 'expenseCategories', name: 'Expense Categories', description: 'Expense category definitions' },
  { id: 'expenses', name: 'Expenses', description: 'Expense records' },
  { id: 'salaryEntries', name: 'Salary Entries', description: 'Salary records' },
  { id: 'cashbookEntries', name: 'Cashbook Entries', description: 'Cashbook transactions' },
  { id: 'dailySalaries', name: 'Daily Salaries', description: 'Daily salary records' },
  { id: 'monthlyExpense', name: 'Monthly Expenses', description: 'Monthly expense records' },
  { id: 'monthlyAttendanceReport', name: 'Monthly Attendance', description: 'Monthly attendance reports' },
  { id: 'overtimeRecords', name: 'Overtime Records', description: 'Overtime tracking' },
  { id: 'userPermissions', name: 'User Permissions', description: 'User permission settings' },
  { id: 'employees', name: 'Employees', description: 'Employee information' },
  { id: 'dailyAttendance', name: 'Daily Attendance', description: 'Daily attendance records' },
  { id: 'manpowerSummary', name: 'Manpower Summary', description: 'Manpower summary data' },
  { id: 'shipments', name: 'Shipments', description: 'Shipment records' }
];

export default function DatabaseImportExportPage() {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    tables: []
  });
  
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    mode: 'merge',
    tables: []
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    if (exportOptions.tables.length === 0) {
      toast.error('Please select at least one table to export');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      const params = new URLSearchParams({
        format: exportOptions.format,
        tables: exportOptions.tables.join(',')
      });

      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`/api/database/export?${params}`);
      
      clearInterval(progressInterval);
      setExportProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database_export_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.${exportOptions.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Database exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error('Please select a file to import');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', importOptions.mode);
      if (importOptions.tables.length > 0) {
        formData.append('tables', importOptions.tables.join(','));
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 5, 90));
      }, 300);

      const response = await fetch('/api/database/import', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setImportProgress(100);

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }

      setImportResult(result);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const handleSelectAllTables = (section: 'export' | 'import') => {
    const allTableIds = AVAILABLE_TABLES.map(table => table.id);
    if (section === 'export') {
      setExportOptions(prev => ({ ...prev, tables: allTableIds }));
    } else {
      setImportOptions(prev => ({ ...prev, tables: allTableIds }));
    }
  };

  const handleDeselectAllTables = (section: 'export' | 'import') => {
    if (section === 'export') {
      setExportOptions(prev => ({ ...prev, tables: [] }));
    } else {
      setImportOptions(prev => ({ ...prev, tables: [] }));
    }
  };

  const toggleTable = (tableId: string, section: 'export' | 'import') => {
    if (section === 'export') {
      setExportOptions(prev => ({
        ...prev,
        tables: prev.tables.includes(tableId)
          ? prev.tables.filter(id => id !== tableId)
          : [...prev.tables, tableId]
      }));
    } else {
      setImportOptions(prev => ({
        ...prev,
        tables: prev.tables.includes(tableId)
          ? prev.tables.filter(id => id !== tableId)
          : [...prev.tables, tableId]
      }));
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Database Import/Export</h1>
          <p className="text-muted-foreground">
            Backup, restore, and migrate your database data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Database className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Database
          </CardTitle>
          <CardDescription>
            Export your database data to JSON or CSV format for backup or migration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Format */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select
              value={exportOptions.format}
              onValueChange={(value: 'json' | 'csv') => 
                setExportOptions(prev => ({ ...prev, format: value }))
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Tables to Export</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAllTables('export')}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeselectAllTables('export')}
                >
                  Deselect All
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto border rounded-lg p-4">
              {AVAILABLE_TABLES.map((table) => (
                <div key={table.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={`export-${table.id}`}
                    checked={exportOptions.tables.includes(table.id)}
                    onCheckedChange={() => toggleTable(table.id, 'export')}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor={`export-${table.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {table.name}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {table.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Exporting database...</span>
                <span>{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="w-full" />
            </div>
          )}

          {/* Export Button */}
          <Button
            onClick={handleExport}
            disabled={isExporting || exportOptions.tables.length === 0}
            className="w-full"
          >
            {isExporting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Database
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Database
          </CardTitle>
          <CardDescription>
            Import database data from JSON or CSV files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="import-file">Import File</Label>
            <Input
              id="import-file"
              type="file"
              accept=".json,.csv"
              ref={fileInputRef}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Supported formats: JSON, CSV
            </p>
          </div>

          {/* Import Mode */}
          <div className="space-y-2">
            <Label>Import Mode</Label>
            <Select
              value={importOptions.mode}
              onValueChange={(value: 'merge' | 'replace') => 
                setImportOptions(prev => ({ ...prev, mode: value }))
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="merge">Merge (Update existing, add new)</SelectItem>
                <SelectItem value="replace">Replace (Clear and import)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {importOptions.mode === 'merge' 
                ? 'Existing records will be updated, new records will be added'
                : 'All existing data will be cleared before importing'
              }
            </p>
          </div>

          {/* Table Selection for Import */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Tables to Import (Optional)</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAllTables('import')}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeselectAllTables('import')}
                >
                  Deselect All
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty to import all tables from the file
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto border rounded-lg p-4">
              {AVAILABLE_TABLES.map((table) => (
                <div key={table.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={`import-${table.id}`}
                    checked={importOptions.tables.includes(table.id)}
                    onCheckedChange={() => toggleTable(table.id, 'import')}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor={`import-${table.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {table.name}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {table.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Import Progress */}
          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importing database...</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="w-full" />
            </div>
          )}

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={isImporting}
            className="w-full"
          >
            {isImporting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import Database
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className={importResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription>
                {importResult.message}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Imported: {importResult.results.imported}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm">Errors: {importResult.results.errors}</span>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="space-y-2">
              <Label>Table Details</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {Object.entries(importResult.results.details).map(([tableName, details]: [string, any]) => (
                  <div key={tableName} className="flex items-center justify-between p-2 border rounded">
                    <span className="font-medium">{tableName}</span>
                    {details.error ? (
                      <Badge variant="destructive" className="text-xs">
                        Error: {details.error}
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          Imported: {details.imported || 0}
                        </Badge>
                        {details.errors > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            Errors: {details.errors}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Warning:</strong> Database import/export operations can affect your data integrity. 
          Always backup your database before performing these operations. 
          Import operations with "Replace" mode will permanently delete existing data.
        </AlertDescription>
      </Alert>
    </div>
  );
}
