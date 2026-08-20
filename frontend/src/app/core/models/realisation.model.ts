import { BusinessServiceCategory } from './business-service.model';

export interface RealisationImage {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  displayOrder: number;
}

export interface Realisation {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  clientName: string | null;
  location: string | null;
  completedAt: string | null;
  featured: boolean;
  isActive: boolean;
  category: BusinessServiceCategory | null;
  images: RealisationImage[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedRealisations {
  data: Realisation[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
