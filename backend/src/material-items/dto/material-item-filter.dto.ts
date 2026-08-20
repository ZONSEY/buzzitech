import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/pagination.dto';

export class MaterialItemFilterDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Ne retourner que les éléments actifs (défaut : tous)',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  activeOnly?: boolean;
}
