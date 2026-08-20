import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenService } from './token.service';
import { PasswordService } from '../common/services/password.service';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [
    UsersModule,
    NotificationsModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  // TokenService et PasswordService sont injectés dans AuthService
  // (voir son constructeur) : ils doivent donc être déclarés ici
  // comme providers, sinon Nest ne peut pas les instancier.
  providers: [AuthService, JwtStrategy, TokenService, PasswordService],
})
export class AuthModule {}
