'use client';

import { useState, useEffect } from 'react';

interface NavigationItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
  parentId?: string;
  order: number;
  isActive: boolean;
  isPublic: boolean;
  children?: NavigationItem[];
}

export function useNavigation() {
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNavigation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/navigation', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch navigation');
      }
      
      const data = await response.json();
      setNavigationItems(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching navigation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNavigation();
  }, []);

  return {
    navigationItems,
    loading,
    error,
    refetch: fetchNavigation
  };
}
