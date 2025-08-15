import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success' | 'debug';
  category: 'auth' | 'database' | 'api' | 'system' | 'security' | 'user';
  message: string;
  userId?: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  details?: any;
}

// Mock log data for now - in production, this would come from a real logging system
const mockLogs: LogEntry[] = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    level: 'info',
    category: 'auth',
    message: 'User logged in successfully',
    userId: '123',
    userName: 'Super Administrator',
    ipAddress: '192.168.1.1',
    endpoint: '/api/auth/sign-in',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    level: 'error',
    category: 'database',
    message: 'Failed to connect to database',
    details: { error: 'Connection timeout', duration: '30s' },
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    level: 'warning',
    category: 'security',
    message: 'Multiple failed login attempts detected',
    ipAddress: '192.168.1.100',
    details: { attempts: 5, timeframe: '5 minutes' },
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    level: 'success',
    category: 'system',
    message: 'System backup completed successfully',
    details: { size: '15.2 MB', duration: '2.3s' },
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    level: 'info',
    category: 'api',
    message: 'API endpoint called',
    endpoint: '/api/admin/users',
    userId: '123',
    userName: 'Super Administrator',
  },
];

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has SUPER_ADMIN role
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const category = searchParams.get('category');
    const timeRange = searchParams.get('timeRange');
    const search = searchParams.get('search');

    let filteredLogs = [...mockLogs];

    // Filter by level
    if (level && level !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    // Filter by category
    if (category && category !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }

    // Filter by time range
    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      const timeRangeMs = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      }[timeRange];

      if (timeRangeMs) {
        filteredLogs = filteredLogs.filter(log => {
          const logTime = new Date(log.timestamp);
          return now.getTime() - logTime.getTime() <= timeRangeMs;
        });
      }
    }

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filteredLogs = filteredLogs.filter(log =>
        log.message.toLowerCase().includes(searchLower) ||
        log.userName?.toLowerCase().includes(searchLower) ||
        log.endpoint?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      logs: filteredLogs,
      total: filteredLogs.length,
      stats: {
        total: mockLogs.length,
        error: mockLogs.filter(l => l.level === 'error').length,
        warning: mockLogs.filter(l => l.level === 'warning').length,
        success: mockLogs.filter(l => l.level === 'success').length,
        info: mockLogs.filter(l => l.level === 'info').length,
        debug: mockLogs.filter(l => l.level === 'debug').length,
      },
    });
  } catch (error) {
    console.error('Get logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has SUPER_ADMIN role
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'clear_logs':
        // In production, this would clear the actual logs
        return NextResponse.json({ message: 'Logs cleared successfully' });
        
      case 'export_logs':
        // In production, this would generate and return a download link
        return NextResponse.json({ 
          message: 'Export prepared',
          downloadUrl: '/api/admin/logs/export'
        });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Post logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
