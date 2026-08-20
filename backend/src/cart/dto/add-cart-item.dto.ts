import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min, ValidateIf } from 'class-validator';

export class AddCartItemDto {
  @ApiPropertyOptional({
    description: 'Identifiant du produit',
  })
  @ValidateIf((o: AddCartItemDto) => !o.businessServiceId)
  @IsUUID()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({
    description: 'Identifiant du service',
  })
  @ValidateIf((o: AddCartItemDto) => !o.productId)
  @IsUUID()
  @IsOptional()
  businessServiceId?: string;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
  })
  @IsInt()
  @Min(1)
  quantity = 1;
}
