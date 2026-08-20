import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateMaterialItemDto } from './create-material-item.dto';

export class UpdateMaterialItemDto extends PartialType(CreateMaterialItemDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
