import { IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/pagination.dto';

export class AuditFilterDto extends PaginationDto {
  @IsOptional()
  action?: string;

  @IsOptional()
  entity?: string;

  @IsOptional()
  userId?: string;

  @IsOptional()
  from?: string;

  @IsOptional()
  to?: string;

  @IsOptional()
  sortBy?: string = 'createdAt';

  @IsOptional()
  order: 'asc' | 'desc' = 'desc';
}
