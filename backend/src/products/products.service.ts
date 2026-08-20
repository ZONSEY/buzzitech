import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Prisma } from 'generated/prisma';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuditActions } from 'src/audit/constants/audit-actions';
import { AuditService } from 'src/audit/audit.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    // Ajouté : nécessaire pour le log d'audit dans updateStock()
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateProductDto) {
    // Vérifier si le slug existe
    const slugExists = await this.prisma.product.findUnique({
      where: {
        slug: dto.slug,
      },
    });

    if (slugExists) {
      throw new ConflictException('Ce slug existe déjà.');
    }

    // Vérifier la catégorie
    const category = await this.prisma.category.findUnique({
      where: {
        id: dto.categoryId,
      },
    });

    if (!category) {
      throw new NotFoundException('Catégorie introuvable.');
    }

    // Vérifier la marque
    const brand = await this.prisma.brand.findUnique({
      where: {
        id: dto.brandId,
      },
    });

    if (!brand) {
      throw new NotFoundException('Marque introuvable.');
    }

    // verifier si le SKU existe déjà
    if (dto.sku) {
      const skuExists = await this.prisma.product.findUnique({
        where: { sku: dto.sku },
      });

      if (skuExists) {
        throw new ConflictException('Ce SKU existe déjà.');
      }
    }

    // Création
    return this.prisma.product.create({
      data: dto,
      include: {
        category: true,
        brand: true,
      },
    });
  }

  async findAll(query: ProductQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      brand,
      sort = 'createdAt',
      order = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    // Recherche
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Filtre catégorie (par slug)
    if (category) {
      where.category = {
        slug: category,
      };
    }

    // Filtre marque (par slug)
    if (brand) {
      where.brand = {
        slug: brand,
      };
    }

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
          images: true,
        },
        skip,
        take: limit,
        orderBy: {
          [sort]: order,
        },
      }),

      this.prisma.product.count({
        where,
      }),
    ]);

    return {
      data: products,

      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        images: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Produit introuvable.');
    }

    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        brand: true,
        images: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Produit introuvable.');
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    // Vérifier que le produit existe
    await this.findOne(id);

    // Vérifier le slug si modifié
    if (dto.slug) {
      const existingSlug = await this.prisma.product.findFirst({
        where: {
          slug: dto.slug,
          NOT: { id },
        },
      });

      if (existingSlug) {
        throw new ConflictException('Ce slug est déjà utilisé.');
      }
    }

    // Vérifier le SKU si modifié
    if (dto.sku) {
      const existingSku = await this.prisma.product.findFirst({
        where: {
          sku: dto.sku,
          NOT: { id },
        },
      });

      if (existingSku) {
        throw new ConflictException('Ce SKU est déjà utilisé.');
      }
    }

    // Vérifier la catégorie
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Catégorie introuvable.');
      }
    }

    // Vérifier la marque
    if (dto.brandId) {
      const brand = await this.prisma.brand.findUnique({
        where: { id: dto.brandId },
      });

      if (!brand) {
        throw new NotFoundException('Marque introuvable.');
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: {
        category: true,
        brand: true,
        images: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  async updateStock(id: string, stock: number, adminId: string) {
    // findOne() renvoie déjà le produit (ou lève NotFoundException) :
    // on le récupère pour avoir l'ancienne valeur de stock, plutôt que
    // d'ignorer son retour comme avant.
    const product = await this.findOne(id);

    const oldStock = product.stock;

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        stock,
      },
    });

    // NOTE: le bloc d'audit était orphelin en fin de fichier (hors de
    // toute méthode) et référençait oldPrice/newPrice au lieu du stock.
    // Il est ici rattaché à updateStock() et adapté aux bonnes valeurs.
    // Vérifie que AuditActions.UPDATE_PRODUCT est bien l'action voulue
    // pour un changement de stock, ou remplace par une constante plus
    // spécifique (ex: AuditActions.UPDATE_STOCK) si elle existe déjà.
    await this.auditService.log({
      userId: adminId,
      action: AuditActions.UPDATE_PRODUCT,
      entity: 'Product',
      entityId: updated.id,
      details: {
        oldStock,
        newStock: stock,
      },
    });

    return updated;
  }
}
