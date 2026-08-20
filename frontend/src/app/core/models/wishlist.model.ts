import { Product } from './product.model';

export interface WishlistItem {
  id: string;
  createdAt: string;
  product: Product;
}
