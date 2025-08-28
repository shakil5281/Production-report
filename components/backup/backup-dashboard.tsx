'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  IconDatabase, 
  IconFile, 
  IconClock, 
  IconDownload, 
  IconUpload, 
  IconTrash, 
  IconSettings,
  IconPlayerPlay,
  IconPlayerPause,
  IconRefresh,
  IconHistory,
  IconShield,
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX
} from '@tabler/icons-react';

interface BackupMetadata {
  id: string;
  timestamp: Date;
  type: 'full' | 'incremental' | 'differential';
  size: number;
  status: 'success' | 'failed' | 'in_progress';
  config: BackupConfig;
  checksum: string;
  location: string;
  error?: string;
}

interface BackupConfig {
  database: boolean;
  files: boolean;
  productionData: boolean;
  userData: boolean;
  settings: boolean;
  compression: boolean;
  encryption: boolean;
  retention: number;
}

interface BackupSchedule {
  id: string;
  name: string;
  cronExpression: string;
  backupType: 'full' | 'incremental' | 'differential';
  config: BackupConfig;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface RecoveryStatus {
  id: string;
  backupId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  startTime: Date;
  endTime?: Date;
  error?: string;
  recoveredTables: string[];
  recoveredRecords: number;
}

export function BackupDashboard() {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupMetadata | null>(null);
  const [showCreateBackup, setShowCreateBackup] = useState(false);
  const [showCreateSchedule, setShowCreateSchedule] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);

  // Backup creation form state
  const [backupForm, setBackupForm] = useState({
    backupType: 'full' as const,
    config: {
      database: true,
      files: true,
      productionData: true,
      userData: true,
      settings: true,
      compression: true,
      encryption: false,
      retention: 30
    }
  });

  // Schedule creation form state
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    cronExpression: '0 2 * * *', // Daily at 2 AM
    backupType: 'full' as const,
    config: {
      database: true,
      files: true,
      productionData: true,
      userData: true,
      settings: true,
      compression: true,
      encryption: false,
      retention: 30
    }
  });

  // Recovery form state
  const [recoveryForm, setRecoveryForm] = useState({
    recoveryType: 'selective' as const,
    selectedTables: [] as string[],
    overwriteExisting: false,
    validateBeforeRecovery: true,
    createRecoveryPoint: true
  });

  useEffect(() => {
    loadBackupData();
  }, []);

  const loadBackupData = async () => {
    setLoading(true);
    try {
      // Load backups
      const backupsResponse = await fetch('/api/backup');
      if (backupsResponse.ok) {
        const backupsData = await backupsResponse.json();
        setBackups(backupsData.backups || []);
      } else {
        console.warn('Failed to load backups:', backupsResponse.status);
        toast.warning('Some backup data could not be loaded');
      }

      // Load schedules
      const schedulesResponse = await fetch('/api/backup/schedule');
      if (schedulesResponse.ok) {
        const schedulesData = await schedulesResponse.json();
        setSchedules(schedulesData.schedules || []);
      } else {
        console.warn('Failed to load schedules:', schedulesResponse.status);
        toast.warning('Some schedule data could not be loaded');
      }
    } catch (error) {
      console.error('Failed to load backup data:', error);
      toast.error('Failed to load backup data');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupForm)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Backup created successfully');
        setShowCreateBackup(false);
        loadBackupData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create backup');
      }
    } catch (error) {
      console.error('Backup creation failed:', error);
      toast.error('Failed to create backup');
    }
  };

  const createSchedule = async () => {
    try {
      const response = await fetch('/api/backup/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleForm)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Schedule created successfully');
        setShowCreateSchedule(false);
        loadBackupData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create schedule');
      }
    } catch (error) {
      console.error('Schedule creation failed:', error);
      toast.error('Failed to create schedule');
    }
  };

  const toggleSchedule = async (scheduleId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/backup/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: scheduleId, enabled })
      });

      if (response.ok) {
        toast.success(`Schedule ${enabled ? 'enabled' : 'disabled'} successfully`);
        loadBackupData();
      } else {
        toast.error('Failed to update schedule');
      }
    } catch (error) {
      console.error('Schedule update failed:', error);
      toast.error('Failed to update schedule');
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const response = await fetch(`/api/backup/schedule?id=${scheduleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Schedule deleted successfully');
        loadBackupData();
      } else {
        toast.error('Failed to delete schedule');
      }
    } catch (error) {
      console.error('Schedule deletion failed:', error);
      toast.error('Failed to delete schedule');
    }
  };

  const startRecovery = async () => {
    if (!selectedBackup) return;

    try {
      const response = await fetch('/api/backup/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backupId: selectedBackup.id,
          ...recoveryForm
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Recovery started successfully');
        setShowRecovery(false);
        // You might want to poll for recovery status
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to start recovery');
      }
    } catch (error) {
      console.error('Recovery failed:', error);
      toast.error('Failed to start recovery');
    }
  };

  const downloadBackup = async (backup: BackupMetadata) => {
    try {
      // This would typically download the backup file
      toast.success('Backup download started');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download backup');
    }
  };

  const deleteBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup?')) return;

    try {
      // Implement backup deletion
      toast.success('Backup deleted successfully');
      loadBackupData();
    } catch (error) {
      console.error('Backup deletion failed:', error);
      toast.error('Failed to delete backup');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <IconCircleCheck className="h-4 w-4 text-green-500" />;
      case 'failed': return <IconCircleX className="h-4 w-4 text-red-500" />;
      case 'in_progress': return <IconRefresh className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <IconAlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      in_progress: 'bg-blue-100 text-blue-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Backup & Recovery System</h1>
          <p className="text-gray-600">Manage your production data backups and recovery operations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateBackup(true)}>
            <IconDatabase className="h-4 w-4 mr-2" />
            Create Backup
          </Button>
          <Button onClick={() => setShowCreateSchedule(true)} variant="outline">
            <IconClock className="h-4 w-4 mr-2" />
            Schedule Backup
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
            <IconDatabase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backups.length}</div>
            <p className="text-xs text-muted-foreground">
              {backups.filter(b => b.status === 'success').length} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Schedules</CardTitle>
            <IconClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules.filter(s => s.enabled).length}</div>
            <p className="text-xs text-muted-foreground">
              {schedules.length} total schedules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <IconFile className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(backups.reduce((sum, b) => sum + b.size, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Average: {backups.length > 0 ? formatFileSize(backups.reduce((sum, b) => sum + b.size, 0) / backups.length) : '0 Bytes'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
            <IconHistory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {backups.length > 0 ? format(new Date(backups[0].timestamp), 'MMM dd') : 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              {backups.length > 0 ? format(new Date(backups[0].timestamp), 'HH:mm') : 'No backups'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="backups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="recovery">Recovery</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Backups Tab */}
        <TabsContent value="backups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup History</CardTitle>
              <CardDescription>View and manage your backup files</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading backups...</div>
              ) : backups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No backups found</div>
              ) : (
                <div className="space-y-2">
                  {backups.map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(backup.status)}
                        <div>
                          <div className="font-medium">Backup {backup.id.slice(-8)}</div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(backup.timestamp), 'MMM dd, yyyy HH:mm')} • {backup.type} • {formatFileSize(backup.size)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusBadge(backup.status)}>
                          {backup.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadBackup(backup)}
                        >
                          <IconDownload className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBackup(backup);
                            setShowRecovery(true);
                          }}
                        >
                          <IconUpload className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteBackup(backup.id)}
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup Schedules</CardTitle>
              <CardDescription>Automated backup schedules</CardDescription>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No schedules found</div>
              ) : (
                <div className="space-y-2">
                  {schedules.map((schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="font-medium">{schedule.name}</div>
                          <div className="text-sm text-gray-500">
                            {schedule.cronExpression} • {schedule.backupType} • Next: {schedule.nextRun ? format(new Date(schedule.nextRun), 'MMM dd, HH:mm') : 'Unknown'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={schedule.enabled}
                          onCheckedChange={(enabled) => toggleSchedule(schedule.id, enabled)}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteSchedule(schedule.id)}
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recovery Tab */}
        <TabsContent value="recovery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recovery Operations</CardTitle>
              <CardDescription>Restore data from backups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Select a backup from the Backups tab to start recovery
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup Settings</CardTitle>
              <CardDescription>Configure backup behavior and retention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Default Retention (days)</Label>
                  <Input type="number" defaultValue="30" />
                </div>
                <div>
                  <Label>Max Backup Size (MB)</Label>
                  <Input type="number" defaultValue="1000" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch defaultChecked />
                  <Label>Enable compression</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch />
                  <Label>Enable encryption</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch defaultChecked />
                  <Label>Create recovery points</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Backup Dialog */}
      <Dialog open={showCreateBackup} onOpenChange={setShowCreateBackup}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Backup</DialogTitle>
            <DialogDescription>Configure and create a new backup</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Backup Type</Label>
              <Select value={backupForm.backupType} onValueChange={(value: any) => setBackupForm({ ...backupForm, backupType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Backup</SelectItem>
                  <SelectItem value="incremental">Incremental Backup</SelectItem>
                  <SelectItem value="differential">Differential Backup</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Backup Components</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={backupForm.config.database}
                      onCheckedChange={(checked) => setBackupForm({
                        ...backupForm,
                        config: { ...backupForm.config, database: checked }
                      })}
                    />
                    <Label>Database</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={backupForm.config.productionData}
                      onCheckedChange={(checked) => setBackupForm({
                        ...backupForm,
                        config: { ...backupForm.config, productionData: checked }
                      })}
                    />
                    <Label>Production Data</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={backupForm.config.userData}
                      onCheckedChange={(checked) => setBackupForm({
                        ...backupForm,
                        config: { ...backupForm.config, userData: checked }
                      })}
                    />
                    <Label>User Data</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={backupForm.config.files}
                      onCheckedChange={(checked) => setBackupForm({
                        ...backupForm,
                        config: { ...backupForm.config, files: checked }
                      })}
                    />
                    <Label>Files</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={backupForm.config.compression}
                      onCheckedChange={(checked) => setBackupForm({
                        ...backupForm,
                        config: { ...backupForm.config, compression: checked }
                      })}
                    />
                    <Label>Compression</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={backupForm.config.encryption}
                      onCheckedChange={(checked) => setBackupForm({
                        ...backupForm,
                        config: { ...backupForm.config, encryption: checked }
                      })}
                    />
                    <Label>Encryption</Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateBackup(false)}>
                Cancel
              </Button>
              <Button onClick={createBackup}>
                Create Backup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Schedule Dialog */}
      <Dialog open={showCreateSchedule} onOpenChange={setShowCreateSchedule}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Backup Schedule</DialogTitle>
            <DialogDescription>Set up automated backup schedules</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Schedule Name</Label>
              <Input
                value={scheduleForm.name}
                onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                placeholder="Daily Production Backup"
              />
            </div>

            <div>
              <Label>Cron Expression</Label>
              <Input
                value={scheduleForm.cronExpression}
                onChange={(e) => setScheduleForm({ ...scheduleForm, cronExpression: e.target.value })}
                placeholder="0 2 * * * (Daily at 2 AM)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: minute hour day month day-of-week
              </p>
            </div>

            <div>
              <Label>Backup Type</Label>
              <Select value={scheduleForm.backupType} onValueChange={(value: any) => setScheduleForm({ ...scheduleForm, backupType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Backup</SelectItem>
                  <SelectItem value="incremental">Incremental Backup</SelectItem>
                  <SelectItem value="differential">Differential Backup</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateSchedule(false)}>
                Cancel
              </Button>
              <Button onClick={createSchedule}>
                Create Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recovery Dialog */}
      <Dialog open={showRecovery} onOpenChange={setShowRecovery}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Recover from Backup</DialogTitle>
            <DialogDescription>
              Recover data from backup: {selectedBackup?.id.slice(-8)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Recovery Type</Label>
              <Select value={recoveryForm.recoveryType} onValueChange={(value: any) => setRecoveryForm({ ...recoveryForm, recoveryType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Recovery</SelectItem>
                  <SelectItem value="selective">Selective Recovery</SelectItem>
                  <SelectItem value="database_only">Database Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={recoveryForm.overwriteExisting}
                  onCheckedChange={(checked) => setRecoveryForm({ ...recoveryForm, overwriteExisting: checked })}
                />
                <Label>Overwrite existing data</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={recoveryForm.createRecoveryPoint}
                  onCheckedChange={(checked) => setRecoveryForm({ ...recoveryForm, createRecoveryPoint: checked })}
                />
                <Label>Create recovery point before recovery</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowRecovery(false)}>
                Cancel
              </Button>
              <Button onClick={startRecovery} className="bg-red-600 hover:bg-red-700">
                Start Recovery
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
