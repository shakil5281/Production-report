export interface ProductionItem {
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

export interface ProductionFormData {
  programCode: string;
  buyer: string;
  quantity: number;
  item: string;
  price: number;
  status?: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'CANCELLED';
  notes?: string;
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