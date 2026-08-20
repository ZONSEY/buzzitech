export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  isActive: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  displayOrder: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  sku: string | null;
  price: string;
  stock: number;
  isActive: boolean;
  featured: boolean;
  warranty: number | null;
  brand: Brand;
  category: Category;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedProducts {
  data: Product[];
  meta: PaginationMeta;
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  sort?: 'name' | 'price' | 'createdAt';
  order?: 'asc' | 'desc';
}
