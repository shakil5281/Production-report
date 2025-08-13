import { ProductionRecord } from '@/app/(root)/production-reports/data/productionData';

// Shared in-memory storage for demo purposes
// In production, this would be replaced with a database
const productionItems: ProductionRecord[] = [
  { id: 1, programCode: "PRG-001", buyer: "Buyer A", quantity: 1000, item: "Shirt", price: 10, status: "running" },
  { id: 2, programCode: "PRG-002", buyer: "Buyer B", quantity: 500, item: "Pants", price: 20, status: "pending" },
  { id: 3, programCode: "PRG-003", buyer: "Buyer C", quantity: 1500, item: "Jacket", price: 30, status: "complete" },
  { id: 4, programCode: "PRG-004", buyer: "Buyer D", quantity: 750, item: "T-Shirt", price: 15, status: "running" },
];

export const productionStore = {
  // Get all production items
  getAll: () => [...productionItems],
  
  // Get production item by ID
  getById: (id: number) => productionItems.find(item => item.id === id),
  
  // Create new production item
  create: (item: Omit<ProductionRecord, 'id'>) => {
    const newItem: ProductionRecord = {
      ...item,
      id: Math.max(...productionItems.map(p => p.id), 0) + 1,
    };
    productionItems.push(newItem);
    return newItem;
  },
  
  // Update production item
  update: (id: number, updates: Partial<ProductionRecord>) => {
    const index = productionItems.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    productionItems[index] = { ...productionItems[index], ...updates };
    return productionItems[index];
  },
  
  // Delete production item
  delete: (id: number) => {
    const index = productionItems.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    const deletedItem = productionItems[index];
    productionItems.splice(index, 1);
    return deletedItem;
  },
  
  // Check if program code exists
  programCodeExists: (programCode: string, excludeId?: number) => {
    return productionItems.some(item => 
      item.programCode === programCode && item.id !== excludeId
    );
  }
};
