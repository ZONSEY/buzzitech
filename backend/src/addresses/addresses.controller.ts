import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
// "import type" requis avec isolatedModules + emitDecoratorMetadata,
// puisque ce type apparaît dans la signature d'une méthode décorée.
import type { CurrentUserData } from 'src/common/interfaces/current-user.interface';
import { CreateAddressDto } from './dto/create-address.dto';
import { AddressesService } from './addresses.service';
import { UpdateAddressDto } from './dto/update-address.dto';

@Controller('addresses')
export class AddressesController {
  // addressesService était utilisé plus bas sans jamais être injecté.
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateAddressDto) {
    return this.addressesService.create(user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: CurrentUserData) {
    return this.addressesService.findAll(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.addressesService.findOne(user.id, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.update(user.id, id, dto);
  }

  @Patch(':id/default')
  @UseGuards(JwtAuthGuard)
  setDefault(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.addressesService.setDefault(user.id, id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.addressesService.remove(user.id, id);
  }
}
