import { Product } from 'generated/prisma';
import { ProductResponseDto } from '../dto/product-response.dto';

export class ProductMapper {
  static toResponse(
    product: Product & {
      // categoryId et brandId sont obligatoires sur le modèle Product
      // (schema.prisma), donc ces relations sont toujours chargées
      // avec include: { category: true, brand: true } — jamais null,
      // jamais undefined. D'où le retrait du "?" et du fallback null
      // plus bas, qui causaient l'erreur de typage.
      category: {
        id: string;
        name: string;
        slug: string;
      };
      brand: {
        id: string;
        name: string;
        slug: string;
      };
    },
  ): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,

      price: Number(product.price),

      stock: product.stock,

      isActive: product.isActive,

      featured: product.featured,

      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      },

      brand: {
        id: product.brand.id,
        name: product.brand.name,
        slug: product.brand.slug,
      },
    };
  }

  static toResponseList(
    products: (Product & {
      category: {
        id: string;
        name: string;
        slug: string;
      };
      brand: {
        id: string;
        name: string;
        slug: string;
      };
    })[],
  ): ProductResponseDto[] {
    return products.map((product) => this.toResponse(product));
  }
}
