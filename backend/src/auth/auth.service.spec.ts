import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PasswordService } from 'src/common/services/password.service';
import { TokenService } from './token.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { EmailService } from 'src/email/email.service';

describe('AuthService', () => {
  let service: AuthService;

  const usersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    updateRefreshToken: jest.fn(),
    setResetPasswordToken: jest.fn(),
    findByResetPasswordToken: jest.fn(),
    resetPassword: jest.fn(),
    setEmailVerificationToken: jest.fn(),
    findByEmailVerificationToken: jest.fn(),
    markEmailVerified: jest.fn(),
  };

  const passwordService = {
    hash: jest.fn().mockResolvedValue('hashed'),
    compare: jest.fn(),
  };

  const tokenService = {
    generateTokens: jest
      .fn()
      .mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' }),
  };

  const notificationsService = { create: jest.fn() };
  const emailService = {
    sendWelcomeEmail: jest.fn(),
    sendVerificationEmail: jest.fn(),
    sendPasswordReset: jest.fn(),
  };

  const configService = {
    get: jest.fn().mockReturnValue('http://localhost:4200'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    passwordService.hash.mockResolvedValue('hashed');
    tokenService.generateTokens.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
    });
    configService.get.mockReturnValue('http://localhost:4200');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: PasswordService, useValue: passwordService },
        { provide: TokenService, useValue: tokenService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: EmailService, useValue: emailService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it("rejette si l'email est déjà utilisé", async () => {
      usersService.findByEmail.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({
          nom: 'Doe',
          prenom: 'John',
          email: 'john@doe.com',
          password: 'Azerty@123',
        }),
      ).rejects.toThrow(ConflictException);

      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('crée le compte, envoie les emails et connecte automatiquement', async () => {
      usersService.findByEmail
        .mockResolvedValueOnce(null) // vérif unicité
        .mockResolvedValueOnce(null); // pas encore utilisé pour d'autres besoins
      const createdUser = {
        id: 'user-1',
        email: 'john@doe.com',
        nom: 'Doe',
        prenom: 'John',
        emailVerified: false,
      };
      usersService.create.mockResolvedValue(createdUser);
      usersService.findById.mockResolvedValue(createdUser);

      const result = await service.register({
        nom: 'Doe',
        prenom: 'John',
        email: 'john@doe.com',
        password: 'Azerty@123',
      });

      expect(usersService.create).toHaveBeenCalled();
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(createdUser);
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        'user-1',
        'hashed',
      );
      expect(result.accessToken).toBe('access');
    });
  });

  describe('forgotPassword', () => {
    it('renvoie un message générique et ne fait rien si l’email est inconnu', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword({
        email: 'inconnu@test.com',
      });

      expect(result.message).toMatch(/Si cette adresse existe/);
      expect(usersService.setResetPasswordToken).not.toHaveBeenCalled();
      expect(emailService.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('génère un token, le stocke hashé et envoie l’email si l’utilisateur existe', async () => {
      const user = { id: 'user-1', email: 'john@doe.com' };
      usersService.findByEmail.mockResolvedValue(user);

      const result = await service.forgotPassword({ email: user.email });

      expect(usersService.setResetPasswordToken).toHaveBeenCalledWith(
        'user-1',
        expect.any(String),
        expect.any(Date),
      );
      expect(emailService.sendPasswordReset).toHaveBeenCalledWith(
        user,
        expect.stringContaining(
          '/espace-client/reinitialiser-mot-de-passe?token=',
        ),
      );
      expect(result.message).toMatch(/Si cette adresse existe/);
    });
  });

  describe('resetPassword', () => {
    it('rejette si le token est invalide ou expiré', async () => {
      usersService.findByResetPasswordToken.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'bad-token', password: 'Azerty@123' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('réinitialise le mot de passe pour un token valide', async () => {
      const user = { id: 'user-1' };
      usersService.findByResetPasswordToken.mockResolvedValue(user);

      const result = await service.resetPassword({
        token: 'good-token',
        password: 'NewPass@123',
      });

      const expectedHash = crypto
        .createHash('sha256')
        .update('good-token')
        .digest('hex');
      expect(usersService.findByResetPasswordToken).toHaveBeenCalledWith(
        expectedHash,
      );
      expect(usersService.resetPassword).toHaveBeenCalledWith(
        'user-1',
        expect.any(String),
      );
      expect(result.message).toMatch(/réinitialisé/);
    });
  });

  describe('verifyEmail', () => {
    it('rejette si le token est invalide ou expiré', async () => {
      usersService.findByEmailVerificationToken.mockResolvedValue(null);

      await expect(service.verifyEmail({ token: 'bad' })).rejects.toThrow(
        BadRequestException,
      );
      expect(usersService.markEmailVerified).not.toHaveBeenCalled();
    });

    it('marque l’email comme vérifié pour un token valide', async () => {
      usersService.findByEmailVerificationToken.mockResolvedValue({
        id: 'user-1',
      });

      const result = await service.verifyEmail({ token: 'good' });

      expect(usersService.markEmailVerified).toHaveBeenCalledWith('user-1');
      expect(result.message).toMatch(/vérifié/);
    });
  });
});
