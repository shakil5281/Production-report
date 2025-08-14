import { useState, useCallback } from 'react';
import type { Line, CreateLineData, UpdateLineData } from '@/components/lines/schema';

export function useLines() {
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/lines');
      const data = await response.json();
      
      if (data.success) {
        setLines(data.data);
      } else {
        setError(data.error || 'Failed to fetch lines');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lines');
    } finally {
      setLoading(false);
    }
  }, []);

  const createLine = useCallback(async (lineData: CreateLineData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/lines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lineData),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchLines();
        return true;
      } else {
        setError(data.error || 'Failed to create line');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create line');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchLines]);

  const updateLine = useCallback(async (id: string, lineData: UpdateLineData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/lines/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lineData),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchLines();
        return true;
      } else {
        setError(data.error || 'Failed to update line');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update line');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchLines]);

  const deleteLine = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/lines/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchLines();
        return true;
      } else {
        setError(data.error || 'Failed to delete line');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete line');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchLines]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    lines,
    loading,
    error,
    fetchLines,
    createLine,
    updateLine,
    deleteLine,
    clearError,
  };
}
