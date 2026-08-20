import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from 'generated/prisma';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PromoCodesService } from './promo-codes.service';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';
import { PromoCodeFilterDto } from './dto/promo-code-filter.dto';

@ApiTags('Codes promo')
@Controller('promo-codes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class PromoCodesController {
  constructor(private readonly promoCodesService: PromoCodesService) {}

  @Get()
  findAll(@Query() filter: PromoCodeFilterDto) {
    return this.promoCodesService.findAll(filter);
  }

  @Post()
  create(@Body() dto: CreatePromoCodeDto) {
    return this.promoCodesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePromoCodeDto) {
    return this.promoCodesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promoCodesService.remove(id);
  }
}
