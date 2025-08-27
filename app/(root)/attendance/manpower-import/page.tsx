'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Users, TrendingUp, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface ManpowerImportResult {
  success: boolean;
  data?: {
    processedRecords: number;
    sections: string[];
    errors: number;
    errorDetails: string[];
    date: string;
    summary: Array<{
      section: string;
      present: number;
      absent: number;
      leave: number;
      others: number;
      total: number;
    }>;
  };
  message?: string;
  error?: string;
}

const sampleExcelStructure = [
  { column: 'A', field: 'Section/Line', example: 'Cutting, Line-01(Helper), Security, Others', required: true },
  { column: 'B', field: 'Present', example: '22', required: true },
  { column: 'C', field: 'Absent', example: '6', required: true },
  { column: 'D', field: 'Leave', example: '0', required: true },
  { column: 'E', field: 'Others', example: '0', required: true },
  { column: 'F', field: 'Total', example: '28', required: true },
  { column: 'G', field: 'Remarks', example: 'Optional notes', required: false },
];

export default function ManpowerImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<ManpowerImportResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid Excel file (.xlsx or .xls)');
        return;
      }

      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    if (!date) {
      toast.error('Please select a date');
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('date', format(date, 'yyyy-MM-dd'));

      const response = await fetch('/api/attendance/manpower-import', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result: ManpowerImportResult = await response.json();
      setImportResult(result);

      if (result.success) {
        toast.success(result.message || 'Manpower data imported successfully');
      } else {
        toast.error(result.error || 'Import failed');
      }

    } catch (error) {
      console.error('Import error:', error);
      toast.error('An error occurred during import');
      setImportResult({
        success: false,
        error: 'An unexpected error occurred'
      });
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/attendance/manpower-template');
      
      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'manpower_summary_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Upload className="h-8 w-8 text-primary" />
            Manpower Summary Import
          </h1>
          <p className="text-muted-foreground">
            Import daily manpower data from Excel files with hierarchical sections and totals
          </p>
        </div>
      </div>

      {/* Step-by-step Instructions */}
      <Card className="border-l-4 border-l-blue-500 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <AlertCircle className="h-5 w-5" />
            How to Import Manpower Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
            <div>
              <p className="font-medium">Download Template</p>
              <p className="text-muted-foreground">Click the "Template" button to download the Excel template with the correct format.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
            <div>
              <p className="font-medium">Fill Your Data</p>
              <p className="text-muted-foreground">Enter your manpower data following the template structure with sections, lines, and totals.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
            <div>
              <p className="font-medium">Select Date & Upload</p>
              <p className="text-muted-foreground">Choose the date for your data and upload the completed Excel file.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
            <div>
              <p className="font-medium">View Results</p>
              <p className="text-muted-foreground">After import, go to "Attendance Summary" to view, analyze, or delete your data.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Manpower Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="file">Select Excel File</Label>
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="w-full"
              />
              {selectedFile && (
                <p className="text-sm text-green-600 mt-1">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {loading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  Processing manpower data... {uploadProgress}%
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleImport} 
                disabled={!selectedFile || !date || loading}
                className="flex-1"
              >
                {loading ? 'Importing...' : 'Import Data'}
              </Button>
              <Button 
                variant="outline" 
                onClick={downloadTemplate}
              >
                <Download className="h-4 w-4 mr-2" />
                Template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Excel Format Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Excel Format Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Excel should follow hierarchical structure with sections, subsections, lines, and totals:
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {sampleExcelStructure.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.column}</Badge>
                    <span className="font-medium">{item.field}</span>
                    {item.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                  </div>
                  <span className="text-sm text-muted-foreground">{item.example}</span>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div>
              <h4 className="font-medium mb-2">Structure Examples:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Main Section</Badge>
                  <span>Cutting, Finishing, Quality, Security, Others</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Line Item</Badge>
                  <span>Line-01(Helper), Line-02(Operator)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">Totals</Badge>
                  <span>Total (Helper), Total, Grand Total</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
          <CardContent>
            {importResult.success ? (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{importResult.message}</AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <Building className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="text-2xl font-bold">{importResult.data?.processedRecords}</p>
                          <p className="text-sm text-muted-foreground">Records Created</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <Users className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="text-2xl font-bold">{importResult.data?.sections.length}</p>
                          <p className="text-sm text-muted-foreground">Sections</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-8 w-8 text-orange-600" />
                        <div>
                          <p className="text-2xl font-bold">{importResult.data?.errors}</p>
                          <p className="text-sm text-muted-foreground">Errors</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {importResult.data?.summary && importResult.data.summary.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Section Summary</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Section</TableHead>
                          <TableHead className="text-center">Present</TableHead>
                          <TableHead className="text-center">Absent</TableHead>
                          <TableHead className="text-center">Leave</TableHead>
                          <TableHead className="text-center">Others</TableHead>
                          <TableHead className="text-center">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.data.summary.map((summary, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{summary.section}</TableCell>
                            <TableCell className="text-center text-green-600">{summary.present}</TableCell>
                            <TableCell className="text-center text-red-600">{summary.absent}</TableCell>
                            <TableCell className="text-center text-blue-600">{summary.leave}</TableCell>
                            <TableCell className="text-center text-orange-600">{summary.others}</TableCell>
                            <TableCell className="text-center font-bold">{summary.total}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {importResult.data?.errorDetails && importResult.data.errorDetails.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-orange-600">Issues Found:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {importResult.data.errorDetails.map((error, index) => (
                        <li key={index} className="text-orange-600">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {importResult.error || 'Import failed'}
                  {importResult.data?.errorDetails && (
                    <ul className="list-disc list-inside mt-2">
                      {importResult.data.errorDetails.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}