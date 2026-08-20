export interface ProductReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    nom: string;
    prenom: string;
  };
}

export interface ProductReviewsResponse {
  data: ProductReview[];
  meta: {
    count: number;
    averageRating: number;
  };
}
