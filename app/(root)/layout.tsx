'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SiteHeader } from '@/components/layout/site-header';
import { UserWithPermissions } from '@/lib/types/auth';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { LoadingSection } from '@/components/ui/loading';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<UserWithPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        setIsAuthenticated(true);
      } else {
        // Redirect to login if not authenticated
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    } finally {
      setIsLoading(false);
    }
  }, [router, pathname]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/sign-out', {
        method: 'POST',
        credentials: 'include',
      });
 
      setUser(null);
      setIsAuthenticated(false);
      router.push('/login');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  if (isLoading) {
    return <LoadingSection  text="Authenticating..." />;
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect to login
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 80)", // Increased from 72 to 80 for better content visibility
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      {/* <div className="flex min-h-screen"> */}
      <AppSidebar user={user} />
      <SidebarInset>

        {/* <div className="flex-1 flex flex-col"> */}
        <SiteHeader user={user} onSignOut={handleSignOut} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-3 py-3 px-3 sm:gap-4 sm:py-4 sm:px-4 md:gap-6 md:py-6 md:px-6">
              {children}
            </div>
          </div>
        </div>
        {/* </div> */}
      </SidebarInset>
      {/* </div> */}
    </SidebarProvider>
  );
}
