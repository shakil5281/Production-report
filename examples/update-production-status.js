// ========================================
// Examples of Updating Production List Status
// ========================================

// 1. Frontend JavaScript/TypeScript Example
async function updateProductionStatus(productionId, newStatus) {
  try {
    const response = await fetch(`/api/production/${productionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Only status is required for status update
        status: newStatus, // 'PENDING' | 'RUNNING' | 'COMPLETE' | 'CANCELLED'
        
        // Note: Other fields are also required by the API, so you need to include them:
        programCode: "PRG-001",
        styleNo: "STY-001", 
        buyer: "Nike Inc.",
        item: "T-Shirt",
        price: 15.99,
        quantities: [
          { qty: 100, color: 'Red', variant: 'S' },
          { qty: 200, color: 'Red', variant: 'M' }
        ],
        percentage: 25
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Status updated successfully:', result.data);
      return result.data;
    } else {
      console.error('Failed to update status:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
}

// 2. React Hook Usage (using existing useProduction hook)
import { useProduction } from '@/hooks/use-production';

function MyComponent() {
  const { updateProductionItem } = useProduction();
  
  const handleStatusChange = async (itemId, newStatus) => {
    // Get the existing item data first
    const existingItem = productionItems.find(item => item.id === itemId);
    
    if (existingItem) {
      const success = await updateProductionItem(itemId, {
        ...existingItem,
        status: newStatus
      });
      
      if (success) {
        toast.success(`Status updated to ${newStatus}`);
      } else {
        toast.error('Failed to update status');
      }
    }
  };
  
  return (
    <button onClick={() => handleStatusChange('item-id', 'RUNNING')}>
      Mark as Running
    </button>
  );
}

// 3. Status Update with Validation
function updateStatusWithValidation(itemId, newStatus) {
  const validStatuses = ['PENDING', 'RUNNING', 'COMPLETE', 'CANCELLED'];
  
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }
  
  return updateProductionStatus(itemId, newStatus);
}

// 4. Bulk Status Update
async function bulkUpdateStatus(itemIds, newStatus) {
  const results = [];
  
  for (const itemId of itemIds) {
    const result = await updateProductionStatus(itemId, newStatus);
    results.push({ itemId, success: result !== null });
  }
  
  return results;
}

// 5. Status Update with Progress Callback
async function updateStatusWithProgress(itemId, newStatus, onProgress) {
  onProgress?.('Starting update...');
  
  try {
    onProgress?.('Validating data...');
    // Validation logic here
    
    onProgress?.('Updating database...');
    const result = await updateProductionStatus(itemId, newStatus);
    
    if (result) {
      onProgress?.('Update completed successfully!');
      return result;
    } else {
      onProgress?.('Update failed');
      return null;
    }
  } catch (error) {
    onProgress?.(`Error: ${error.message}`);
    return null;
  }
}

export {
  updateProductionStatus,
  updateStatusWithValidation,
  bulkUpdateStatus,
  updateStatusWithProgress
};
