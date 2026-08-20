import { ApiProperty } from '@nestjs/swagger';
import { BusinessServiceStatus } from 'generated/prisma';

export class BusinessServiceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({
    nullable: true,
  })
  shortDescription?: string;

  @ApiProperty()
  price!: number;

  @ApiProperty({
    nullable: true,
  })
  estimatedDuration?: number;

  @ApiProperty()
  status!: BusinessServiceStatus;

  @ApiProperty()
  featured!: boolean;

  @ApiProperty({
    nullable: true,
  })
  image?: string;

  @ApiProperty()
  categoryId!: string;

  @ApiProperty()
  categoryName!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
