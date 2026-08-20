export interface SearchProductResult {
  id: string;
  name: string;
  slug: string;
  price: string;
  images: { url: string }[];
}

export interface SearchServiceResult {
  id: string;
  name: string;
  slug: string;
  price: string;
  image?: string;
}

export interface SearchRealisationResult {
  id: string;
  title: string;
  slug: string;
  images: { url: string }[];
}

export interface SearchResults {
  products: SearchProductResult[];
  services: SearchServiceResult[];
  realisations: SearchRealisationResult[];
}
