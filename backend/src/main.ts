import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  // rawBody: true nécessaire pour que req.rawBody soit disponible dans
  // PaymentsController.webhook() — Stripe exige le corps brut (non
  // parsé en JSON) pour vérifier la signature de la requête.
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(
    helmet({
      // Swagger UI (setup en /docs) charge ses propres scripts/styles inline ;
      // une CSP par défaut casserait la page de documentation.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use(cookieParser());

  // Use ConfigService for runtime configuration (CORS, ports, etc.)
  const configService = app.get(ConfigService);
  const corsOrigin =
    configService.get<string>('CORS_ORIGIN') ?? 'http://localhost:4200';
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Buzzitech API')
    .setDescription('Documentation de l API Buzzitech')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, { useGlobalPrefix: false });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalFilters(new HttpExceptionFilter());

  const port = configService.get<number>('PORT') ?? 3000;

  await app.listen(port);

  console.log(`🚀 API disponible sur http://localhost:${port}/api`);
}
void bootstrap();
