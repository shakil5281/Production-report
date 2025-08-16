'use client';

import { useState, useEffect } from 'react';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PermissionType } from '@prisma/client';
import { getCurrentUser, UserWithPermissions } from '@/lib/auth';
import DailyProductionTable from '@/components/production-reports/daily-production-table';

export default function DailyProductionReportPage() {
  const [user, setUser] = useState<UserWithPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <PermissionGuard 
      user={user}
      requiredPermissions={[PermissionType.READ_PRODUCTION, PermissionType.READ_REPORT]}
    >
      <div className="container mx-auto py-6">
        <DailyProductionTable />
      </div>
    </PermissionGuard>
  );
}
