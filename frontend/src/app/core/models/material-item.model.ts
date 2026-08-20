export interface MaterialItem {
  id: string;
  name: string;
  unit?: string;
  stockQuantity: number;
  minStockAlert?: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialItemFilter {
  page?: number;
  limit?: number;
  search?: string;
  activeOnly?: boolean;
}

export interface PaginatedMaterialItems {
  data: MaterialItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface CreateMaterialItemPayload {
  name: string;
  unit?: string;
  stockQuantity?: number;
  minStockAlert?: number;
}

export interface UpdateMaterialItemPayload
  extends Partial<CreateMaterialItemPayload> {
  isActive?: boolean;
}
