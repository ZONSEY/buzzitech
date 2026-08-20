import { ApiProperty } from '@nestjs/swagger';

export class BrandResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({
    nullable: true,
  })
  logo?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  productsCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
