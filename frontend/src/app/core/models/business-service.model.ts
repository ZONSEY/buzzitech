export interface BusinessServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  servicesCount?: number;
}

export interface BusinessService {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  price: string;
  estimatedDuration: number | null;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  featured: boolean;
  image: string | null;
  category: BusinessServiceCategory;
}
