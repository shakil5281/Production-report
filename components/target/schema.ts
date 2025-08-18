export interface Target {
  id: string;
  lineNo: string;
  styleNo: string;
  lineTarget: number;
  date: string;
  inTime: string;
  outTime: string;
  hourlyProduction: number;
  createdAt: string;
  updatedAt: string;
}

export interface TargetFormData {
  lineNo: string;
  styleNo: string;
  lineTarget: number;
  date: string;
  inTime: string;
  outTime: string;
  hourlyProduction: number;
}

export interface QuantityItem {
  variant: string;
  color: string;
  qty: number;
}

export interface ProductionListItem {
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

export interface Line {
  id: string;
  name: string;
  code: string;
  factory: { name: string };
}
