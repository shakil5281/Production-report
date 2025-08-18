export interface LineAssignment {
  id: string;
  lineId: string;
  styleId: string;
  startDate: string;
  endDate?: string | null;
  targetPerHour: number;
  createdAt: string;
  updatedAt: string;
  line: {
    id: string;
    name: string;
    code: string;
    isActive: boolean;
  };
  style: {
    id: string;
    styleNumber: string;
    buyer: string;
    orderQty: number;
    unitPrice: number | string; // Can be Decimal from Prisma or number
    status: string;
  };
}

export interface LineAssignmentFormData {
  lineId: string;
  styleNo: string;
  targetPerHour?: number;
}

export interface Line {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface ProductionListItem {
  id: string;
  programCode: string;
  styleNo: string;
  buyer: string;
  item: string;
  price: number | string; // Can be Decimal from Prisma or number
  percentage: number | string; // Can be Decimal from Prisma or number
  quantities: Array<{
    variant: string;
    color: string;
    qty: number;
  }>;
  totalQty: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentSummary {
  totalAssignments: number;
  activeAssignments: number;
  totalLines: number;
  totalProductionItems: number;
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString();
}

export function formatDateRange(startDate?: string, endDate?: string | null): string {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  
  if (start === '-' && end === '-') return '-';
  if (end === '-') return `From: ${start}`;
  return `${start} - ${end}`;
}

export function isAssignmentActive(assignment: LineAssignment): boolean {
  const now = new Date();
  const start = new Date(assignment.startDate);
  const end = assignment.endDate ? new Date(assignment.endDate) : null;
  
  return start <= now && (!end || end >= now);
}

export function validateAssignmentDates(startDate: string, endDate?: string): { isValid: boolean; error?: string } {
  const start = new Date(startDate);
  
  if (isNaN(start.getTime())) {
    return { isValid: false, error: 'Invalid start date' };
  }
  
  if (endDate) {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      return { isValid: false, error: 'Invalid end date' };
    }
    
    if (end <= start) {
      return { isValid: false, error: 'End date must be after start date' };
    }
  }
  
  return { isValid: true };
}

export function formatPrice(price: number | string): string {
  return `$${Number(price).toFixed(2)}`;
}

export function formatPriceWithUnit(price: number | string): string {
  return `${formatPrice(price)}/unit`;
}
