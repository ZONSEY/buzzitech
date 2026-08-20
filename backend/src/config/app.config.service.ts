import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  get jwtSecret(): string {
    return this.config.getOrThrow<string>('jwt.secret');
  }

  get databaseUrl(): string {
    return this.config.getOrThrow<string>('database.url');
  }

  get stripeSecretKey(): string {
    return this.config.getOrThrow<string>('stripe.secretKey');
  }
}
