import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/pagination.dto';

export class EquipmentFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Recherche par nom, marque ou client' })
  @IsOptional()
  @IsString()
  search?: string;
}
