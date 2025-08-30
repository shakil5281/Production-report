import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, readdir, unlink, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { format } from 'date-fns';

const execAsync = promisify(exec);

interface BackupConfig {
  database: boolean;
  files: boolean;
  productionData: boolean;
  userData: boolean;
  settings: boolean;
  compression: boolean;
  encryption: boolean;
  retention: number; // days
}

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
    const { 
      backupType = 'full',
      config = {
        database: true,
        files: true,
        productionData: true,
        userData: true,
        settings: true,
        compression: true,
        encryption: false,
        retention: 30
      }
    } = body;

    // Create backup directory if it doesn't exist
    const backupDir = path.join(process.cwd(), 'backups', format(new Date(), 'yyyy-MM-dd'));
    if (!existsSync(backupDir)) {
      await mkdir(backupDir, { recursive: true });
    }

    // Generate backup ID
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const backupPath = path.join(backupDir, backupId);
    
    // Ensure the specific backup directory exists
    if (!existsSync(backupPath)) {
      await mkdir(backupPath, { recursive: true });
    }

    // Create backup metadata
    const backupMetadata: BackupMetadata = {
      id: backupId,
      timestamp: new Date(),
      type: backupType as 'full' | 'incremental' | 'differential',
      size: 0,
      status: 'in_progress',
      config,
      checksum: '',
      location: backupPath
    };

    // Start backup process
    const backupResult = await performBackup(backupMetadata, config);

    if (backupResult.success) {
      // Save backup metadata to database
      await saveBackupMetadata(backupMetadata);
      
      return NextResponse.json({
        success: true,
        message: 'Backup completed successfully',
        backup: {
          id: backupId,
          timestamp: backupMetadata.timestamp,
          type: backupType,
          size: backupResult.size,
          location: backupPath,
          downloadUrl: `/api/backup/download/${backupId}`
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: backupResult.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json({
      success: false,
      error: 'Backup failed',
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

    // Get backup list
    const backups = await getBackupList();
    
    return NextResponse.json({
      success: true,
      backups
    });

  } catch (error) {
    console.error('Error fetching backups:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch backups'
    }, { status: 500 });
  }
}

async function performBackup(metadata: BackupMetadata, config: BackupConfig): Promise<{ success: boolean; size?: number; error?: string }> {
  try {
    const backupPath = metadata.location;
    
    // Ensure the backup directory exists
    if (!existsSync(backupPath)) {
      await mkdir(backupPath, { recursive: true });
    }
    
    const backupFiles: string[] = [];

    // 1. Database Backup
    if (config.database) {
      try {
        const dbBackupPath = path.join(backupPath, 'database.sql');
        await backupDatabase(dbBackupPath);
        backupFiles.push(dbBackupPath);
      } catch (error) {
        console.warn('Database backup failed, continuing with other backups:', error);
      }
    }

    // 2. Production Data Backup
    if (config.productionData) {
      try {
        const productionBackupPath = path.join(backupPath, 'production_data.json');
        await backupProductionData(productionBackupPath);
        backupFiles.push(productionBackupPath);
      } catch (error) {
        console.warn('Production data backup failed, continuing with other backups:', error);
      }
    }

    // 3. User Data Backup
    if (config.userData) {
      try {
        const userBackupPath = path.join(backupPath, 'user_data.json');
        await backupUserData(userBackupPath);
        backupFiles.push(userBackupPath);
      } catch (error) {
        console.warn('User data backup failed, continuing with other backups:', error);
      }
    }

    // 4. Settings Backup
    if (config.settings) {
      try {
        const settingsBackupPath = path.join(backupPath, 'settings.json');
        await backupSettings(settingsBackupPath);
        backupFiles.push(settingsBackupPath);
      } catch (error) {
        console.warn('Settings backup failed, continuing with other backups:', error);
      }
    }

    // 5. File System Backup
    if (config.files) {
      try {
        const filesBackupPath = path.join(backupPath, 'files_backup.zip');
        await backupFileSystem(filesBackupPath);
        backupFiles.push(filesBackupPath);
      } catch (error) {
        console.warn('File system backup failed, continuing with other backups:', error);
      }
    }

    // 6. Create backup manifest
    const manifestPath = path.join(backupPath, 'manifest.json');
    const manifest = {
      id: metadata.id,
      timestamp: metadata.timestamp,
      type: metadata.type,
      config,
      files: backupFiles.map(file => ({
        path: file,
        size: 0, // Will be calculated
        checksum: '' // Will be calculated
      }))
    };

    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    backupFiles.push(manifestPath);

    // Check if any backup files were created
    if (backupFiles.length === 1) { // Only manifest file
      throw new Error('No backup files were created successfully');
    }

    // 7. Compression (if enabled)
    if (config.compression) {
      const compressedPath = await compressBackup(backupPath);
      if (compressedPath) {
        backupFiles.push(compressedPath);
      }
    }

    // Calculate total size
    const totalSize = await calculateBackupSize(backupFiles);
    metadata.size = totalSize;

    // Generate checksum
    metadata.checksum = await generateChecksum(backupPath);
    metadata.status = 'success';

    return { success: true, size: totalSize };

  } catch (error) {
    metadata.status = 'failed';
    metadata.error = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: metadata.error };
  }
}

async function backupDatabase(outputPath: string): Promise<void> {
  try {
    // Ensure the output directory exists
    const outputDir = path.dirname(outputPath);
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }

    // For SQLite database
    if (process.env.DATABASE_URL?.includes('file:')) {
      const dbPath = process.env.DATABASE_URL.replace('file:', '').replace('?connection_limit=1', '');
      await execAsync(`sqlite3 "${dbPath}" .dump > "${outputPath}"`);
    }
    // For PostgreSQL database
    else if (process.env.DATABASE_URL?.includes('postgresql')) {
      const url = new URL(process.env.DATABASE_URL);
      const pgDumpCmd = `pg_dump -h ${url.hostname} -U ${url.username} -d ${url.pathname.slice(1)} -f "${outputPath}"`;
      process.env.PGPASSWORD = url.password || '';
      await execAsync(pgDumpCmd);
    }
    // For MySQL database
    else if (process.env.DATABASE_URL?.includes('mysql')) {
      const url = new URL(process.env.DATABASE_URL);
      const mysqldumpCmd = `mysqldump -h ${url.hostname} -u ${url.username} -p${url.password} ${url.pathname.slice(1)} > "${outputPath}"`;
      await execAsync(mysqldumpCmd);
    }
    // Fallback for unsupported database types
    else {
      console.warn('Unsupported database type, creating empty database backup file');
      await writeFile(outputPath, '-- Database backup not supported for this database type');
    }
  } catch (error) {
    console.error('Database backup failed:', error);
    throw new Error(`Database backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function backupProductionData(outputPath: string): Promise<void> {
  try {
    // Backup all production-related data
    const productionData = {
      dailyProductionReports: await prisma.dailyProductionReport.findMany(),
      productionList: await prisma.productionList.findMany(),
      targets: await prisma.target.findMany(),
      lines: await prisma.line.findMany(),
      styleAssignments: await prisma.styleAssignment.findMany(),
      productionEntries: await prisma.productionEntry.findMany(),
      expenseCategories: await prisma.expenseCategory.findMany(),
      expenses: await prisma.expense.findMany(),
      cashbookEntries: await prisma.cashbookEntry.findMany(),
      salaryEntries: await prisma.salaryEntry.findMany(),
      shipments: await prisma.shipment.findMany(),
      employees: await prisma.employee.findMany(),
      dailyAttendances: await prisma.dailyAttendance.findMany(),
      manpowerSummaries: await prisma.manpowerSummary.findMany(),
      overtimeRecords: await prisma.overtimeRecord.findMany(),
      dailySalaries: await prisma.dailySalary.findMany(),
      monthlyExpenses: await prisma.monthlyExpense.findMany(),
      monthlyAttendanceReports: await prisma.monthlyAttendanceReport.findMany()
    };

    await writeFile(outputPath, JSON.stringify(productionData, null, 2));
  } catch (error) {
    console.error('Production data backup failed:', error);
    throw new Error(`Production data backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function backupUserData(outputPath: string): Promise<void> {
  try {
    const userData = {
      users: await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      userPermissions: await prisma.userPermission.findMany(),
      roles: await prisma.role.findMany()
    };

    await writeFile(outputPath, JSON.stringify(userData, null, 2));
  } catch (error) {
    console.error('User data backup failed:', error);
    throw new Error(`User data backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function backupSettings(outputPath: string): Promise<void> {
  try {
    const settings = {
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? '***HIDDEN***' : undefined,
      backupRetention: process.env.BACKUP_RETENTION_DAYS || 30,
      maxBackupSize: process.env.MAX_BACKUP_SIZE_MB || 1000,
      compressionEnabled: process.env.BACKUP_COMPRESSION === 'true',
      encryptionEnabled: process.env.BACKUP_ENCRYPTION === 'true'
    };

    await writeFile(outputPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Settings backup failed:', error);
    throw new Error(`Settings backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function backupFileSystem(outputPath: string): Promise<void> {
  try {
    // Backup important configuration files
    const filesToBackup = [
      'package.json',
      'next.config.ts',
      'tsconfig.json',
      'prisma/schema.prisma',
      '.env.example'
    ];

    const fileBackupData: Record<string, string> = {};
    
    for (const file of filesToBackup) {
      try {
        const filePath = path.join(process.cwd(), file);
        if (existsSync(filePath)) {
          const content = await readFile(filePath, 'utf-8');
          fileBackupData[file] = content;
        }
      } catch (error) {
        console.warn(`Failed to backup file ${file}:`, error);
      }
    }

    await writeFile(outputPath, JSON.stringify(fileBackupData, null, 2));
  } catch (error) {
    console.error('Files backup failed:', error);
    throw new Error(`Files backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function compressBackup(backupPath: string): Promise<string | null> {
  try {
    const compressedPath = `${backupPath}.tar.gz`;
    const cmd = `tar -czf "${compressedPath}" -C "${path.dirname(backupPath)}" "${path.basename(backupPath)}"`;
    await execAsync(cmd);
    return compressedPath;
  } catch (error) {
    console.warn('Compression failed:', error);
    return null;
  }
}

async function calculateBackupSize(files: string[]): Promise<number> {
  try {
    let totalSize = 0;
    for (const file of files) {
      if (existsSync(file)) {
        const stats = await import('fs/promises').then(fs => fs.stat(file));
        totalSize += stats.size;
      }
    }
    return totalSize;
  } catch (error) {
    console.warn('Failed to calculate backup size:', error);
    return 0;
  }
}

async function generateChecksum(backupPath: string): Promise<string> {
  try {
    // Simple checksum generation (in production, use crypto.createHash)
    // Since backupPath is a directory, we'll generate a hash based on the manifest
    const manifestPath = path.join(backupPath, 'manifest.json');
    if (existsSync(manifestPath)) {
      const content = await readFile(manifestPath, 'utf-8');
      let hash = 0;
      for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash.toString(16);
    }
    return '';
  } catch (error) {
    console.warn('Failed to generate checksum:', error);
    return '';
  }
}

async function saveBackupMetadata(metadata: BackupMetadata): Promise<void> {
  try {
    // Save to database if backup table exists, otherwise save to file
    const backupTablePath = path.join(process.cwd(), 'backups', 'backup_metadata.json');
    let existingBackups: BackupMetadata[] = [];
    
    if (existsSync(backupTablePath)) {
      const content = await readFile(backupTablePath, 'utf-8');
      existingBackups = JSON.parse(content);
    }
    
    existingBackups.push(metadata);
    await writeFile(backupTablePath, JSON.stringify(existingBackups, null, 2));
  } catch (error) {
    console.error('Failed to save backup metadata:', error);
  }
}

async function getBackupList(): Promise<BackupMetadata[]> {
  try {
    const backupTablePath = path.join(process.cwd(), 'backups', 'backup_metadata.json');
    
    if (existsSync(backupTablePath)) {
      const content = await readFile(backupTablePath, 'utf-8');
      return JSON.parse(content);
    }
    
    return [];
  } catch (error) {
    console.error('Failed to get backup list:', error);
    return [];
  }
}
