import { PartialType } from '@nestjs/swagger';
import { CreateBusinessServiceDto } from './create-business-service.dto';

export class UpdateBusinessServiceDto extends PartialType(
  CreateBusinessServiceDto,
) {}
