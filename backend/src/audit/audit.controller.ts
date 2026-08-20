import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserRole } from 'generated/prisma';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AuditFilterDto } from './dto/audit-filter.dto';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}
  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll(@Query() filters: AuditFilterDto) {
    return this.auditService.findAll(filters);
  }
}
