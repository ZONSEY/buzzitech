import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';
import { PaymentsModule } from './payments/payments.module';
import { BusinessServiceCategoriesModule } from './business-service-categories/business-service-categories.module';
import { BusinessServicesModule } from './business-services/business-services.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ProductsModule } from './products/products.module';
import { ProductImagesModule } from './product-images/product-images.module';
import { ProjectRequestsModule } from './project-requests/project-requests.module';
import { AddressesModule } from './addresses/addresses.module';
import { AuditModule } from './audit/audit.module';
import { EmailModule } from './email/email.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ContactMessagesModule } from './contact-messages/contact-messages.module';
import { RealisationsModule } from './realisations/realisations.module';
import { RealisationImagesModule } from './realisation-images/realisation-images.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { ProductReviewsModule } from './product-reviews/product-reviews.module';
import { InterventionsModule } from './interventions/interventions.module';
import { MaterialItemsModule } from './material-items/material-items.module';
import { SearchModule } from './search/search.module';
import { PromoCodesModule } from './promo-codes/promo-codes.module';
import { EquipmentModule } from './equipment/equipment.module';
import { MaintenanceContractsModule } from './maintenance-contracts/maintenance-contracts.module';
import { envValidationSchema } from './config/env.validation';

import {
  appConfig,
  cloudinaryConfig,
  databaseConfig,
  jwtConfig,
  mailConfig,
  mobilePaymentsConfig,
  redisConfig,
  stripeConfig,
} from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,

      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],

      validationSchema: envValidationSchema,

      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        mailConfig,
        stripeConfig,
        mobilePaymentsConfig,
        cloudinaryConfig,
        redisConfig,
      ],
    }),

    ThrottlerModule.forRoot([
      {
        // Fenêtre globale par défaut ; les endpoints sensibles (login,
        // register, forgot-password, contact) resserrent la limite via
        // @Throttle() directement sur leur handler.
        ttl: 60_000,
        limit: 60,
      },
    ]),

    ScheduleModule.forRoot(),

    CommonModule,

    PrismaModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    BrandsModule,
    PaymentsModule,
    BusinessServiceCategoriesModule,
    BusinessServicesModule,
    CartModule,
    OrdersModule,
    DashboardModule,
    ProductsModule,
    ProductImagesModule,
    ProjectRequestsModule,
    AddressesModule,
    AuditModule,
    EmailModule,
    NotificationsModule,
    ContactMessagesModule,
    RealisationsModule,
    RealisationImagesModule,
    WishlistModule,
    ProductReviewsModule,
    InterventionsModule,
    MaterialItemsModule,
    SearchModule,
    PromoCodesModule,
    EquipmentModule,
    MaintenanceContractsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
