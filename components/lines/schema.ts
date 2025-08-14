export interface Line {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    styleAssignments: number;
    productionEntries: number;
  };
}

export interface LineFormData {
  name: string;
  code: string;
  isActive: boolean;
}

export interface CreateLineData {
  name: string;
  code: string;
}

export interface UpdateLineData {
  name?: string;
  code?: string;
  isActive?: boolean;
}
