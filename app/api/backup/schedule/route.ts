import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { CronJob } from 'cron';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { format } from 'date-fns';

interface BackupSchedule {
  id: string;
  name: string;
  cronExpression: string;
  backupType: 'full' | 'incremental' | 'differential';
  config: {
    database: boolean;
    files: boolean;
    productionData: boolean;
    userData: boolean;
    settings: boolean;
    compression: boolean;
    encryption: boolean;
    retention: number;
  };
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ScheduleConfig {
  name: string;
  cronExpression: string;
  backupType: 'full' | 'incremental' | 'differential';
  config: {
    database: boolean;
    files: boolean;
    productionData: boolean;
    userData: boolean;
    settings: boolean;
    compression: boolean;
    encryption: boolean;
    retention: number;
  };
}

// In-memory storage for cron jobs (in production, use Redis or database)
const activeJobs = new Map<string, CronJob>();
const schedulesPath = path.join(process.cwd(), 'backups', 'schedules.json');

export async function POST(request: NextRequest) {
  try {
    // Check user authentication and permissions
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has backup permissions
    if (!user.role || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions - SUPER_ADMIN access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, cronExpression, backupType, config }: ScheduleConfig = body;

    // Validate required fields
    if (!name || !cronExpression || !backupType || !config) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate cron expression
    if (!isValidCronExpression(cronExpression)) {
      return NextResponse.json({ error: 'Invalid cron expression' }, { status: 400 });
    }

    // Create schedule
    const schedule: BackupSchedule = {
      id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      cronExpression,
      backupType,
      config,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save schedule
    await saveSchedule(schedule);

    // Start the cron job
    await startScheduledBackup(schedule);

    return NextResponse.json({
      success: true,
      message: 'Backup schedule created successfully',
      schedule: {
        id: schedule.id,
        name: schedule.name,
        cronExpression: schedule.cronExpression,
        backupType: schedule.backupType,
        enabled: schedule.enabled,
        nextRun: schedule.nextRun
      }
    });

  } catch (error) {
    console.error('Schedule creation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create backup schedule',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check user authentication and permissions
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has backup permissions
    if (!user.role || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions - SUPER_ADMIN access required' }, { status: 403 });
    }

    const schedules = await getSchedules();
    
    return NextResponse.json({
      success: true,
      schedules: schedules.map(schedule => ({
        id: schedule.id,
        name: schedule.name,
        cronExpression: schedule.cronExpression,
        backupType: schedule.backupType,
        enabled: schedule.enabled,
        lastRun: schedule.lastRun,
        nextRun: schedule.nextRun,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch backup schedules'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.role || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions - SUPER_ADMIN access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, enabled, cronExpression, config } = body;

    if (!id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    // Update schedule
    const updated = await updateSchedule(id, { enabled, cronExpression, config });
    
    if (updated) {
      // Restart the cron job with new settings
      await restartScheduledBackup(id);
      
      return NextResponse.json({
        success: true,
        message: 'Schedule updated successfully'
      });
    } else {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

  } catch (error) {
    console.error('Schedule update error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update schedule'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.role || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions - SUPER_ADMIN access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    // Stop and remove the cron job
    await stopScheduledBackup(id);
    
    // Delete schedule
    const deleted = await deleteSchedule(id);
    
    if (deleted) {
      return NextResponse.json({
        success: true,
        message: 'Schedule deleted successfully'
      });
    } else {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

  } catch (error) {
    console.error('Schedule deletion error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete schedule'
    }, { status: 500 });
  }
}

async function startScheduledBackup(schedule: BackupSchedule): Promise<void> {
  try {
    // Stop existing job if it exists
    if (activeJobs.has(schedule.id)) {
      activeJobs.get(schedule.id)?.stop();
      activeJobs.delete(schedule.id);
    }

    // Create new cron job
    const job = new CronJob(schedule.cronExpression, async () => {
      try {
        
        // Update last run time
        schedule.lastRun = new Date();
        schedule.nextRun = job.nextDate().toJSDate();
        await updateSchedule(schedule.id, { lastRun: schedule.lastRun, nextRun: schedule.nextRun });

        // Execute backup
        await executeScheduledBackup(schedule);

      } catch (error) {
        console.error(`❌ Scheduled backup failed: ${schedule.name}`, error);
      }
    });

    // Start the job
    job.start();
    
    // Store the job reference
    activeJobs.set(schedule.id, job);
    
    // Update next run time
    schedule.nextRun = job.nextDate().toJSDate();
    await updateSchedule(schedule.id, { nextRun: schedule.nextRun });

  } catch (error) {
    console.error(`Failed to start scheduled backup: ${schedule.name}`, error);
  }
}

async function executeScheduledBackup(schedule: BackupSchedule): Promise<void> {
  try {
    // Call the main backup API
    const backupResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/backup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BACKUP_API_KEY || 'scheduled-backup'}` // Use API key for scheduled backups
      },
      body: JSON.stringify({
        backupType: schedule.backupType,
        config: schedule.config
      })
    });

    if (!backupResponse.ok) {
      throw new Error(`Backup API returned ${backupResponse.status}`);
    }

    const result = await backupResponse.json();
    if (!result.success) {
      throw new Error(result.error || 'Backup failed');
    }

  } catch (error) {
    console.error(`❌ Scheduled backup execution failed: ${schedule.name}`, error);
    throw error;
  }
}

async function restartScheduledBackup(scheduleId: string): Promise<void> {
  try {
    const schedule = await getScheduleById(scheduleId);
    if (schedule) {
      await startScheduledBackup(schedule);
    }
  } catch (error) {
    console.error(`Failed to restart scheduled backup: ${scheduleId}`, error);
  }
}

async function stopScheduledBackup(scheduleId: string): Promise<void> {
  try {
    if (activeJobs.has(scheduleId)) {
      const job = activeJobs.get(scheduleId);
      job?.stop();
      activeJobs.delete(scheduleId);
    }
  } catch (error) {
    console.error(`Failed to stop scheduled backup: ${scheduleId}`, error);
  }
}

async function saveSchedule(schedule: BackupSchedule): Promise<void> {
  try {
    const schedules = await getSchedules();
    schedules.push(schedule);
    
    // Ensure directory exists
    const dir = path.dirname(schedulesPath);
    await mkdir(dir, { recursive: true });
    
    await writeFile(schedulesPath, JSON.stringify(schedules, null, 2));
  } catch (error) {
    console.error('Failed to save schedule:', error);
    throw error;
  }
}

async function getSchedules(): Promise<BackupSchedule[]> {
  try {
    if (!existsSync(schedulesPath)) {
      return [];
    }
    
    const content = await readFile(schedulesPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to get schedules:', error);
    return [];
  }
}

async function getScheduleById(id: string): Promise<BackupSchedule | null> {
  try {
    const schedules = await getSchedules();
    return schedules.find(s => s.id === id) || null;
  } catch (error) {
    console.error('Failed to get schedule by ID:', error);
    return null;
  }
}

async function updateSchedule(id: string, updates: Partial<BackupSchedule>): Promise<boolean> {
  try {
    const schedules = await getSchedules();
    const index = schedules.findIndex(s => s.id === id);
    
    if (index === -1) {
      return false;
    }
    
    schedules[index] = { ...schedules[index], ...updates, updatedAt: new Date() };
    await writeFile(schedulesPath, JSON.stringify(schedules, null, 2));
    
    return true;
  } catch (error) {
    console.error('Failed to update schedule:', error);
    return false;
  }
}

async function deleteSchedule(id: string): Promise<boolean> {
  try {
    const schedules = await getSchedules();
    const filtered = schedules.filter(s => s.id !== id);
    
    if (filtered.length === schedules.length) {
      return false; // Schedule not found
    }
    
    await writeFile(schedulesPath, JSON.stringify(filtered, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to delete schedule:', error);
    return false;
  }
}

function isValidCronExpression(expression: string): boolean {
  try {
    // Basic cron validation (you can use a library like cron-validator for more robust validation)
    const parts = expression.split(' ');
    if (parts.length !== 5) {
      return false;
    }
    
    // Validate each part
    const validators = [
      /^(\*|[0-5]?[0-9])$/, // minute: 0-59
      /^(\*|[0-2]?[0-9]|3[0-1])$/, // hour: 0-23
      /^(\*|[1-9]|[12][0-9]|3[01])$/, // day: 1-31
      /^(\*|[1-9]|1[0-2])$/, // month: 1-12
      /^(\*|[0-6])$/ // day of week: 0-6 (Sunday = 0)
    ];
    
    for (let i = 0; i < 5; i++) {
      if (!validators[i].test(parts[i])) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

// Initialize scheduled backups on server start
async function initializeScheduledBackups(): Promise<void> {
  try {
    const schedules = await getSchedules();
    
    for (const schedule of schedules) {
      if (schedule.enabled) {
        await startScheduledBackup(schedule);
      }
    }
    
  } catch (error) {
    console.error('Failed to initialize scheduled backups:', error);
  }
}

// Clean up cron jobs on server shutdown
function cleanupScheduledBackups(): void {
  try {
    for (const [id, job] of activeJobs) {
      job.stop();
    }
    activeJobs.clear();
  } catch (error) {
    console.error('Failed to cleanup scheduled backups:', error);
  }
}
