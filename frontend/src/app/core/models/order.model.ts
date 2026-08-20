export interface CartItem {
  id: string;
  type: 'PRODUCT' | 'SERVICE';
  itemId: string;
  name: string;
  image?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totalItems: number;
  productsTotal: number;
  servicesTotal: number;
  grandTotal: number;
}

export interface Address {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  postalCode?: string;
  isDefault: boolean;
}

export type AddressPayload = Omit<Address, 'id' | 'isDefault'> & {
  isDefault?: boolean;
};

export type PaymentMethod = 'STRIPE' | 'PAYDUNYA' | 'ORANGE_MONEY' | 'WAVE';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: string;
  product?: { id: string; name: string; images?: { url: string }[] } | null;
  businessService?: { id: string; name: string } | null;
}

export interface Payment {
  id: string;
  amount: string;
  status: string;
  gateway: string;
  method: string;
}

export interface Order {
  id: string;
  reference: string;
  status: OrderStatus;
  subtotal: string;
  shippingCost: string;
  discount: string;
  totalAmount: string;
  createdAt: string;
  items: OrderItem[];
  payments: Payment[];
  address?: Address;
  // Présent uniquement sur les listings admin (GET /orders).
  user?: { id: string; nom: string; prenom: string; email: string };
}

export interface PaginatedOrders {
  data: Order[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
