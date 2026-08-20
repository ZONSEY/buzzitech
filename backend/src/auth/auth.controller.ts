import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { User } from 'generated/prisma';

const REFRESH_COOKIE = 'refreshToken';
// Doit correspondre à JWT_REFRESH_EXPIRES_IN (7 jours par défaut).
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Créer un nouveau compte utilisateur',
  })
  @ApiResponse({
    status: 201,
    description: 'Compte créé avec succès.',
  })
  @ApiResponse({
    status: 409,
    description: 'Email déjà utilisé.',
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, ...body } =
      await this.authService.register(registerDto);
    this.setRefreshCookie(res, refreshToken);
    return body;
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Connexion utilisateur',
  })
  @ApiOkResponse({
    description: 'Connexion réussie',
    type: AuthResponseDto,
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, ...body } = await this.authService.login(loginDto);
    this.setRefreshCookie(res, refreshToken);
    return body;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return this.authService.me(user.id);
  }

  @Post('refresh')
  @ApiOperation({
    summary:
      'Renouvelle les tokens à partir du refresh token (cookie httpOnly)',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = (req.cookies as Record<string, string> | undefined)?.[
      REFRESH_COOKIE
    ];

    if (!token) {
      throw new UnauthorizedException('Session expirée, reconnectez-vous.');
    }

    const { refreshToken, ...body } = await this.authService.refresh(token);
    this.setRefreshCookie(res, refreshToken);
    return body;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.logout(user.id);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    return result;
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Demande de réinitialisation de mot de passe par email',
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Réinitialise le mot de passe à partir du token reçu par email',
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('verify-email')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: "Confirme l'adresse email à partir du token reçu par email",
  })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: "Renvoie l'email de vérification" })
  resendVerification(@CurrentUser() user: User) {
    return this.authService.resendVerificationEmail(user.id);
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      // Restreint le cookie aux endpoints d'auth uniquement.
      path: '/api/auth',
      maxAge: REFRESH_COOKIE_MAX_AGE,
    });
  }
}
