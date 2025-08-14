export interface ProductionItem {
  id: string;
  programCode: string;
  styleNo: string;
  buyer: string;
  quantity: number;
  item: string;
  price: number;
  percentage: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface ProductionFormData {
  programCode: string;
  styleNo: string;
  buyer: string;
  quantity: number;
  item: string;
  price: number;
  percentage: number;
  status?: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'CANCELLED';
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