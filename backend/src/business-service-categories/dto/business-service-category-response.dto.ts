import { ApiProperty } from '@nestjs/swagger';

export class BusinessServiceCategoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  servicesCount!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
