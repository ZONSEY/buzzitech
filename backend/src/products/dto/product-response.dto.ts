import { ApiProperty } from '@nestjs/swagger';

class CategoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;
}

class BrandDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;
}

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  featured: boolean;

  @ApiProperty({
    type: CategoryDto,
  })
  category: CategoryDto;

  @ApiProperty({
    type: BrandDto,
  })
  brand: BrandDto;
}
