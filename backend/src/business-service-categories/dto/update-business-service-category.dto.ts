import { PartialType } from '@nestjs/swagger';

import { CreateBusinessServiceCategoryDto } from './create-business-service-category.dto';

export class UpdateBusinessServiceCategoryDto extends PartialType(
  CreateBusinessServiceCategoryDto,
) {}
