import { useState, useCallback } from 'react';
import type { Target, TargetFormData } from '@/components/target/schema';

export function useTarget() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTargets = useCallback(async (date?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = date ? `/api/target?date=${date}` : '/api/target';
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setTargets(data.data);
      } else {
        setError(data.error || 'Failed to fetch targets');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch targets');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTargetsByDate = useCallback(async (date: string) => {
    await fetchTargets(date);
  }, [fetchTargets]);

  const createTarget = useCallback(async (targetData: TargetFormData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/target', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(targetData),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchTargets();
        return true;
      } else {
        setError(data.error || 'Failed to create target');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create target');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTargets]);

  const updateTarget = useCallback(async (id: string, targetData: TargetFormData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/target/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(targetData),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchTargets();
        return true;
      } else {
        setError(data.error || 'Failed to update target');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update target');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTargets]);

  const deleteTarget = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/target/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchTargets();
        return true;
      } else {
        setError(data.error || 'Failed to delete target');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete target');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTargets]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    targets,
    loading,
    error,
    fetchTargets,
    fetchTargetsByDate,
    createTarget,
    updateTarget,
    deleteTarget,
    clearError,
  };
}
