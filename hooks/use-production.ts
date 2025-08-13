import { useState, useEffect, useCallback } from 'react';

interface ProductionItem {
  id: string;
  programCode: string;
  buyer: string;
  quantity: number;
  item: string;
  price: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductionFormData {
  programCode: string;
  buyer: string;
  quantity: number;
  item: string;
  price: number;
  status?: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  notes?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  total?: number;
}

export function useProduction() {
  const [productionItems, setProductionItems] = useState<ProductionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all production items
  const fetchProductionItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/production');
      const result: ApiResponse<ProductionItem[]> = await response.json();
      
      if (result.success && result.data) {
        setProductionItems(result.data);
      } else {
        setError(result.error || 'Failed to fetch production items');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new production item
  const createProductionItem = useCallback(async (formData: ProductionFormData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/production', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result: ApiResponse<ProductionItem> = await response.json();
      
      if (result.success && result.data) {
        setProductionItems(prev => [result.data!, ...prev]);
        return true;
      } else {
        setError(result.error || 'Failed to create production item');
        return false;
      }
    } catch (err) {
      setError('Network error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update production item
  const updateProductionItem = useCallback(async (id: string, formData: ProductionFormData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/production/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result: ApiResponse<ProductionItem> = await response.json();
      
      if (result.success && result.data) {
        setProductionItems(prev => 
          prev.map(item => item.id === id ? result.data! : item)
        );
        return true;
      } else {
        setError(result.error || 'Failed to update production item');
        return false;
      }
    } catch (err) {
      setError('Network error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete production item
  const deleteProductionItem = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/production/${id}`, {
        method: 'DELETE',
      });

      const result: ApiResponse<ProductionItem> = await response.json();
      
      if (result.success) {
        setProductionItems(prev => prev.filter(item => item.id !== id));
        return true;
      } else {
        setError(result.error || 'Failed to delete production item');
        return false;
      }
    } catch (err) {
      setError('Network error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get production item by ID
  const getProductionItem = useCallback(async (id: string): Promise<ProductionItem | null> => {
    try {
      const response = await fetch(`/api/production/${id}`);
      const result: ApiResponse<ProductionItem> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.error || 'Failed to fetch production item');
        return null;
      }
    } catch (err) {
      setError('Network error occurred');
      return null;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProductionItems();
  }, [fetchProductionItems]);

  return {
    productionItems,
    loading,
    error,
    fetchProductionItems,
    createProductionItem,
    updateProductionItem,
    deleteProductionItem,
    getProductionItem,
    clearError,
  };
}
