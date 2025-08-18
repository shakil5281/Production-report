export interface QuantityItem {
  variant: string;
  color: string;
  qty: number;
}

export interface ProductionItem {
  id: string;
  programCode: string;
  styleNo: string;
  buyer: string;
  item: string;
  price: number;
  percentage: number;
  quantities: QuantityItem[];
  totalQty: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface ProductionFormData {
  programCode: string;
  styleNo: string;
  buyer: string;
  item: string;
  price: number;
  percentage: number;
  quantities: QuantityItem[];
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString();
}

export function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate && !endDate) return '-';
  if (startDate && endDate) return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  if (startDate) return `From: ${formatDate(startDate)}`;
  if (endDate) return `To: ${formatDate(endDate)}`;
  return '-';
}

export function calculateTotalQuantity(quantities: QuantityItem[]): number {
  return quantities.reduce((total, item) => total + item.qty, 0);
}

export function validateQuantityItem(item: QuantityItem): boolean {
  return item.variant.trim() !== '' && 
         item.color.trim() !== '' && 
         item.qty > 0;
}

export function validateQuantities(quantities: QuantityItem[]): boolean {
  return quantities.length > 0 && quantities.every(validateQuantityItem);
}