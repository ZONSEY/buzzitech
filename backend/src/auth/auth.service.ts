import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { UsersService } from '../users/users.service';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

import { BCRYPT_SALT_ROUNDS } from '../common/constants/bcrypt.constant';
import { TokenService } from './token.service';
import { PasswordService } from 'src/common/services/password.service';
import { UserMapper } from 'src/common/mappers/user.mapper';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'generated/prisma';
import { EmailService } from 'src/email/email.service';

// Durées de validité des tokens envoyés par email.
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  // Génère un token aléatoire à envoyer par email et son hash SHA-256 à
  // stocker en base : contrairement au mot de passe, ce token doit rester
  // recherchable par égalité directe (findFirst sur le hash), un hash
  // bcrypt (salé, non déterministe) ne le permettrait pas.
  private generateSecureToken(): { raw: string; hashed: string } {
    const raw = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(raw).digest('hex');
    return { raw, hashed };
  }

  private get frontendUrl(): string {
    return (
      this.configService.get<string>('CORS_ORIGIN') ?? 'http://localhost:4200'
    );
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('Cette adresse email est déjà utilisée.');
    }

    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      BCRYPT_SALT_ROUNDS,
    );

    const user = await this.usersService.create({
      nom: registerDto.nom,
      prenom: registerDto.prenom,
      email: registerDto.email,
      telephone: registerDto.telephone,
      password: hashedPassword,
    });

    await this.notificationsService.create({
      userId: user.id,
      title: 'Bienvenue',
      message: 'Votre compte Buzzitech a été créé avec succès.',
      type: NotificationType.SUCCESS,
      icon: 'user-plus',
      link: '/profile',
    });

    await this.emailService.sendWelcomeEmail(user);
    await this.sendVerificationEmail(user.id);

    // Connexion automatique après inscription, comme pour login().
    const tokens = await this.tokenService.generateTokens(user);

    const hashedRefreshToken = await this.passwordService.hash(
      tokens.refreshToken,
    );

    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    return {
      user: UserMapper.toResponse(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    const passwordValid = await this.passwordService.compare(
      loginDto.password,
      user.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    const tokens = await this.tokenService.generateTokens(user);

    const hashedRefreshToken = await this.passwordService.hash(
      tokens.refreshToken,
    );

    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    return {
      user: UserMapper.toResponse(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    return UserMapper.toResponse(user);
  }

  async refresh(refreshToken: string) {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);

    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException();
    }

    const valid = await this.passwordService.compare(
      refreshToken,
      user.hashedRefreshToken,
    );

    if (!valid) {
      throw new UnauthorizedException();
    }

    const tokens = await this.tokenService.generateTokens(user);

    const hashedRefreshToken = await this.passwordService.hash(
      tokens.refreshToken,
    );

    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    return {
      user: UserMapper.toResponse(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);

    return {
      message: 'Déconnexion réussie.',
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);

    // Message générique dans tous les cas : on ne révèle jamais si un
    // email existe ou non en base (protection contre l'énumération de
    // comptes).
    const genericResponse = {
      message:
        'Si cette adresse existe, un lien de réinitialisation vient de lui être envoyé.',
    };

    if (!user) {
      return genericResponse;
    }

    const { raw, hashed } = this.generateSecureToken();
    const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await this.usersService.setResetPasswordToken(user.id, hashed, expires);

    const resetUrl = `${this.frontendUrl}/espace-client/reinitialiser-mot-de-passe?token=${raw}`;
    await this.emailService.sendPasswordReset(user, resetUrl);

    return genericResponse;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(dto.token)
      .digest('hex');

    const user = await this.usersService.findByResetPasswordToken(hashedToken);

    if (!user) {
      throw new BadRequestException(
        'Ce lien de réinitialisation est invalide ou a expiré.',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    await this.usersService.resetPassword(user.id, hashedPassword);

    return { message: 'Mot de passe réinitialisé avec succès.' };
  }

  async sendVerificationEmail(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user || user.emailVerified) {
      return;
    }

    const { raw, hashed } = this.generateSecureToken();
    const expires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

    await this.usersService.setEmailVerificationToken(user.id, hashed, expires);

    const verifyUrl = `${this.frontendUrl}/espace-client/verifier-email?token=${raw}`;
    await this.emailService.sendVerificationEmail(user, verifyUrl);
  }

  async resendVerificationEmail(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    if (user.emailVerified) {
      return { message: 'Cette adresse email est déjà vérifiée.' };
    }

    await this.sendVerificationEmail(userId);

    return { message: 'Email de vérification renvoyé.' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(dto.token)
      .digest('hex');

    const user =
      await this.usersService.findByEmailVerificationToken(hashedToken);

    if (!user) {
      throw new BadRequestException(
        'Ce lien de vérification est invalide ou a expiré.',
      );
    }

    await this.usersService.markEmailVerified(user.id);

    return { message: 'Email vérifié avec succès.' };
  }
}
