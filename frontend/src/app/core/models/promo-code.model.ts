export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface PromoCode {
  id: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: string;
  minOrderAmount?: string;
  maxUses?: number;
  maxUsesPerUser?: number;
  isActive: boolean;
  startsAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { orders: number };
}

export interface PaginatedPromoCodes {
  data: PromoCode[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface CreatePromoCodePayload {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  startsAt?: string;
  expiresAt?: string;
}

export interface UpdatePromoCodePayload
  extends Partial<CreatePromoCodePayload> {
  isActive?: boolean;
}
