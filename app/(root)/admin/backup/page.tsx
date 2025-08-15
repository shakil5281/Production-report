'use client';

import { useState, useEffect } from 'react';
import {
  Download,
  Upload,
  RefreshCw,
  Calendar,
  Clock,
  HardDrive,
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Play,
  Pause,
  Settings,
  Trash2,
  Archive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface BackupEntry {
  id: string;
  name: string;
  type: 'automatic' | 'manual' | 'scheduled';
  size: string;
  createdAt: string;
  status: 'completed' | 'failed' | 'in_progress';
  location: string;
  duration?: string;
}

interface BackupSettings {
  autoBackup: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  retention: number;
  location: string;
  compression: boolean;
  encryption: boolean;
}

const mockBackups: BackupEntry[] = [
  {
    id: '1',
    name: 'production-backup-2024-01-15',
    type: 'automatic',
    size: '15.2 MB',
    createdAt: new Date().toISOString(),
    status: 'completed',
    location: './backups/auto/',
    duration: '2.3s',
  },
  {
    id: '2',
    name: 'manual-backup-2024-01-14',
    type: 'manual',
    size: '14.8 MB',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    location: './backups/manual/',
    duration: '3.1s',
  },
  {
    id: '3',
    name: 'weekly-backup-2024-01-13',
    type: 'scheduled',
    size: '14.5 MB',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    location: './backups/scheduled/',
    duration: '2.8s',
  },
  {
    id: '4',
    name: 'backup-failed-2024-01-12',
    type: 'automatic',
    size: '0 MB',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'failed',
    location: './backups/auto/',
    duration: '0s',
  },
];

const defaultSettings: BackupSettings = {
  autoBackup: true,
  frequency: 'daily',
  retention: 7,
  location: './backups',
  compression: true,
  encryption: false,
};

export default function BackupRecoveryPage() {
  const [backups, setBackups] = useState<BackupEntry[]>(mockBackups);
  const [settings, setSettings] = useState<BackupSettings>(defaultSettings);
  const [backupProgress, setBackupProgress] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [loading, setLoading] = useState(false);

  const createBackup = async () => {
    try {
      setIsBackingUp(true);
      setBackupProgress(0);
      
      // Simulate backup progress
      for (let i = 0; i <= 100; i += 10) {
        setBackupProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Create new backup entry
      const newBackup: BackupEntry = {
        id: Date.now().toString(),
        name: `manual-backup-${new Date().toISOString().split('T')[0]}`,
        type: 'manual',
        size: '15.2 MB',
        createdAt: new Date().toISOString(),
        status: 'completed',
        location: './backups/manual/',
        duration: '2.1s',
      };
      
      setBackups(prev => [newBackup, ...prev]);
      toast.success('Backup created successfully');
    } catch (error) {
      toast.error('Failed to create backup');
    } finally {
      setIsBackingUp(false);
      setBackupProgress(0);
    }
  };

  const restoreBackup = async (backupId: string) => {
    try {
      setIsRestoring(true);
      const backup = backups.find(b => b.id === backupId);
      
      if (!backup) {
        throw new Error('Backup not found');
      }
      
      // Simulate restore process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast.success(`Database restored from ${backup.name}`);
    } catch (error) {
      toast.error('Failed to restore backup');
    } finally {
      setIsRestoring(false);
    }
  };

  const deleteBackup = async (backupId: string) => {
    try {
      setBackups(prev => prev.filter(b => b.id !== backupId));
      toast.success('Backup deleted successfully');
    } catch (error) {
      toast.error('Failed to delete backup');
    }
  };

  const downloadBackup = (backup: BackupEntry) => {
    // Simulate download
    toast.success(`Downloading ${backup.name}`);
  };

  const updateSettings = async (newSettings: Partial<BackupSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    toast.success('Backup settings updated');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'in_progress':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'failed':
        return 'bg-red-500/10 text-red-700 border-red-200';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'automatic':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'manual':
        return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'scheduled':
        return 'bg-orange-500/10 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const completedBackups = backups.filter(b => b.status === 'completed');
  const totalSize = completedBackups.reduce((acc, backup) => {
    const size = parseFloat(backup.size.replace(' MB', ''));
    return acc + (isNaN(size) ? 0 : size);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Backup & Recovery</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage database backups and ensure data protection
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Upload Backup
          </Button>
          <Button onClick={createBackup} disabled={isBackingUp}>
            {isBackingUp ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Create Backup
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Archive className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Backups</p>
                <p className="text-2xl font-bold">{backups.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Successful</p>
                <p className="text-2xl font-bold">{completedBackups.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <HardDrive className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Size</p>
                <p className="text-2xl font-bold">{totalSize.toFixed(1)} MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Backup</p>
                <p className="text-sm font-medium">
                  {backups[0] ? new Date(backups[0].createdAt).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup Progress */}
      {isBackingUp && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Creating backup...</span>
                <span className="text-sm text-muted-foreground">{backupProgress}%</span>
              </div>
              <Progress value={backupProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="backups" className="space-y-6">
        <TabsList>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        {/* Backups Tab */}
        <TabsContent value="backups" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Backup History ({backups.length})</CardTitle>
              <CardDescription>Manage your database backups and restore points</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((backup) => (
                      <TableRow key={backup.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Archive className="w-4 h-4" />
                            <code className="text-sm">{backup.name}</code>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(backup.type)}>
                            {backup.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{backup.size}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(backup.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>{backup.duration}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(backup.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(backup.status)}
                              {backup.status.replace('_', ' ')}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {backup.status === 'completed' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => downloadBackup(backup)}
                                >
                                  <Download className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => restoreBackup(backup.id)}
                                  disabled={isRestoring}
                                >
                                  <Play className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => deleteBackup(backup.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Backup Configuration</CardTitle>
              <CardDescription>Configure automatic backup settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Automatic Backup</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable automatic database backups
                  </p>
                </div>
                <Switch
                  checked={settings.autoBackup}
                  onCheckedChange={(checked) => updateSettings({ autoBackup: checked })}
                />
              </div>

              {settings.autoBackup && (
                <>
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Backup Frequency</Label>
                      <Select
                        value={settings.frequency}
                        onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                          updateSettings({ frequency: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="retention">Retention Period (days)</Label>
                      <Input
                        id="retention"
                        type="number"
                        value={settings.retention}
                        onChange={(e) => updateSettings({ retention: parseInt(e.target.value) || 7 })}
                        min="1"
                        max="365"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Backup Location</Label>
                    <Input
                      id="location"
                      value={settings.location}
                      onChange={(e) => updateSettings({ location: e.target.value })}
                      placeholder="./backups"
                    />
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Advanced Options</h4>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Compression</Label>
                    <p className="text-sm text-muted-foreground">
                      Compress backup files to save storage space
                    </p>
                  </div>
                  <Switch
                    checked={settings.compression}
                    onCheckedChange={(checked) => updateSettings({ compression: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Encryption</Label>
                    <p className="text-sm text-muted-foreground">
                      Encrypt backup files for additional security
                    </p>
                  </div>
                  <Switch
                    checked={settings.encryption}
                    onCheckedChange={(checked) => updateSettings({ encryption: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Backup Schedule</CardTitle>
              <CardDescription>Configure when automatic backups should run</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  Advanced scheduling options will be available in the next update. Currently using simple frequency-based scheduling.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
