import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class AddMaterialDto {
  @ApiPropertyOptional({
    description: "Nom libre si l'article n'est pas dans le catalogue",
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Article du catalogue (décompte automatique du stock)',
  })
  @IsOptional()
  @IsUUID()
  materialItemId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}
