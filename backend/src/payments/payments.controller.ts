import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';

import type { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PaymentGateway, UserRole } from 'generated/prisma';
import type { CurrentUserData } from 'src/common/interfaces/current-user.interface';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { PaymentFilterDto } from './dto/payment-filter.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { CheckoutDto } from './dto/checkout.dto';

@ApiTags('Payment')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhook')
  async webhook(
    // ⚠️ Stripe exige le corps BRUT (non parsé en JSON) pour vérifier
    // la signature. Ça suppose que ton main.ts active le raw body :
    //   const app = await NestFactory.create(AppModule, { rawBody: true });
    // sinon req.rawBody sera undefined et la vérification échouera.
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new Error(
        'Le corps brut de la requête est requis pour vérifier la signature Stripe (active rawBody dans main.ts).',
      );
    }

    await this.paymentsService.handleWebhook(
      req.rawBody,
      signature,
      PaymentGateway.STRIPE,
    );

    return { received: true };
  }

  @Post('webhook/orange-money')
  async orangeMoneyWebhook(@Req() req: RawBodyRequest<Request>) {
    if (!req.rawBody) {
      throw new Error('Le corps brut de la requête est requis.');
    }

    await this.paymentsService.handleWebhook(
      req.rawBody,
      '',
      PaymentGateway.ORANGE_MONEY,
    );

    return { received: true };
  }

  @Post('webhook/wave')
  async waveWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('wave-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new Error('Le corps brut de la requête est requis.');
    }

    await this.paymentsService.handleWebhook(
      req.rawBody,
      signature,
      PaymentGateway.WAVE,
    );

    return { received: true };
  }

  @Post('webhook/paydunya')
  async paydunyaWebhook(@Req() req: RawBodyRequest<Request>) {
    if (!req.rawBody) {
      throw new Error('Le corps brut de la requête est requis.');
    }

    await this.paymentsService.handleWebhook(
      req.rawBody,
      '',
      PaymentGateway.PAYDUNYA,
    );

    return { received: true };
  }

  @Post(':orderId/checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  checkout(
    @CurrentUser() user: CurrentUserData,
    @Param('orderId') orderId: string,
    @Body() dto: CheckoutDto,
  ) {
    return this.paymentsService.checkout(orderId, user, dto.gateway);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMyPayments(
    @CurrentUser() user: CurrentUserData,
    @Query() filter: PaymentFilterDto,
  ) {
    return this.paymentsService.getMyPayments(user.id, filter);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getPayment(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.paymentsService.getPaymentById(id, user);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  getPayments(@Query() filter: PaymentFilterDto) {
    return this.paymentsService.getPayments(filter);
  }

  @Post('refund')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  refund(@Body() dto: RefundPaymentDto) {
    return this.paymentsService.refund(dto.paymentId);
  }
}
