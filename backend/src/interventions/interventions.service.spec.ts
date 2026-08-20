import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InterventionsService } from './interventions.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { EmailService } from 'src/email/email.service';
import { SmsService } from 'src/sms/sms.service';
import { InterventionStatus, UserRole } from 'generated/prisma';

describe('InterventionsService', () => {
  let service: InterventionsService;

  const prisma = {
    user: { findUnique: jest.fn() },
    intervention: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    interventionMaterial: {
      create: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
    interventionPhoto: { create: jest.fn(), delete: jest.fn() },
    materialItem: { findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  };

  const notificationsService = { create: jest.fn() };
  const emailService = { sendInterventionCompleted: jest.fn() };
  const smsService = {
    sendInterventionOnTheWay: jest.fn(),
    sendInterventionCompleted: jest.fn(),
  };

  const technician = { id: 'tech-1', role: UserRole.TECHNICIEN };
  const otherTechnician = { id: 'tech-2', role: UserRole.TECHNICIEN };
  const client = { id: 'client-1', role: UserRole.CLIENT };
  const admin = { id: 'admin-1', role: UserRole.ADMIN };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterventionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: EmailService, useValue: emailService },
        { provide: SmsService, useValue: smsService },
      ],
    }).compile();

    service = module.get<InterventionsService>(InterventionsService);
  });

  describe('create', () => {
    it('rejette si le client est introuvable', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          title: 'Installation caméra',
          scheduledAt: '2026-09-01T10:00:00.000Z',
          clientId: 'client-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("rejette si l'utilisateur assigné n'a pas le rôle Technicien", async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: 'client-1', role: UserRole.CLIENT })
        .mockResolvedValueOnce({ id: 'user-x', role: UserRole.CLIENT });

      await expect(
        service.create({
          title: 'Installation caméra',
          scheduledAt: '2026-09-01T10:00:00.000Z',
          clientId: 'client-1',
          technicianId: 'user-x',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('crée la mission et notifie le technicien assigné', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: 'client-1', role: UserRole.CLIENT })
        .mockResolvedValueOnce({ id: 'tech-1', role: UserRole.TECHNICIEN });
      prisma.intervention.create.mockResolvedValue({
        id: 'int-1',
        technicianId: 'tech-1',
        title: 'Installation caméra',
        scheduledAt: new Date('2026-09-01T10:00:00.000Z'),
      });

      await service.create({
        title: 'Installation caméra',
        scheduledAt: '2026-09-01T10:00:00.000Z',
        clientId: 'client-1',
        technicianId: 'tech-1',
      });

      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'tech-1' }),
      );
    });
  });

  describe('findOne — contrôle d’accès', () => {
    const intervention = {
      id: 'int-1',
      clientId: 'client-1',
      technicianId: 'tech-1',
    };

    it('autorise le technicien assigné', async () => {
      prisma.intervention.findUnique.mockResolvedValue(intervention);
      await expect(service.findOne(technician, 'int-1')).resolves.toBe(
        intervention,
      );
    });

    it('rejette un autre technicien', async () => {
      prisma.intervention.findUnique.mockResolvedValue(intervention);
      await expect(service.findOne(otherTechnician, 'int-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('autorise le client concerné', async () => {
      prisma.intervention.findUnique.mockResolvedValue(intervention);
      await expect(service.findOne(client, 'int-1')).resolves.toBe(
        intervention,
      );
    });

    it('autorise un admin', async () => {
      prisma.intervention.findUnique.mockResolvedValue(intervention);
      await expect(service.findOne(admin, 'int-1')).resolves.toBe(intervention);
    });
  });

  describe('start', () => {
    it("rejette si la mission n'appartient pas au technicien", async () => {
      prisma.intervention.findUnique.mockResolvedValue({
        id: 'int-1',
        technicianId: 'tech-1',
        status: InterventionStatus.SCHEDULED,
      });

      await expect(service.start(otherTechnician, 'int-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("rejette si la mission n'est pas en déplacement", async () => {
      prisma.intervention.findUnique.mockResolvedValue({
        id: 'int-1',
        technicianId: 'tech-1',
        status: InterventionStatus.SCHEDULED,
      });

      await expect(service.start(technician, 'int-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('démarre la mission et notifie le client', async () => {
      prisma.intervention.findUnique.mockResolvedValue({
        id: 'int-1',
        technicianId: 'tech-1',
        status: InterventionStatus.ON_THE_WAY,
      });
      prisma.intervention.update.mockResolvedValue({
        id: 'int-1',
        clientId: 'client-1',
        title: 'Installation caméra',
        status: InterventionStatus.IN_PROGRESS,
      });

      await service.start(technician, 'int-1');

      const updateCall = prisma.intervention.update as jest.Mock<
        unknown,
        [{ data: { status: InterventionStatus } }]
      >;
      expect(updateCall.mock.calls[0][0].data.status).toBe(
        InterventionStatus.IN_PROGRESS,
      );
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'client-1' }),
      );
    });
  });

  describe('accept', () => {
    it("rejette si ce n'est pas le technicien assigné", async () => {
      prisma.intervention.findUnique.mockResolvedValue({
        id: 'int-1',
        technicianId: 'tech-1',
        status: InterventionStatus.SCHEDULED,
      });

      await expect(service.accept(otherTechnician, 'int-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("rejette si un admin tente d'accepter à la place du technicien", async () => {
      prisma.intervention.findUnique.mockResolvedValue({
        id: 'int-1',
        technicianId: 'tech-1',
        status: InterventionStatus.SCHEDULED,
      });

      await expect(service.accept(admin, 'int-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("rejette si la mission n'est pas planifiée", async () => {
      prisma.intervention.findUnique.mockResolvedValue({
        id: 'int-1',
        technicianId: 'tech-1',
        status: InterventionStatus.ACCEPTED,
      });

      await expect(service.accept(technician, 'int-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('accepte la mission', async () => {
      prisma.intervention.findUnique.mockResolvedValue({
        id: 'int-1',
        technicianId: 'tech-1',
        status: InterventionStatus.SCHEDULED,
      });
      prisma.intervention.update.mockResolvedValue({
        id: 'int-1',
        status: InterventionStatus.ACCEPTED,
      });

      const result = await service.accept(technician, 'int-1');

      expect(result.status).toBe(InterventionStatus.ACCEPTED);
    });
  });

  describe('markOnTheWay', () => {
    it("rejette si la mission n'a pas été acceptée", async () => {
      prisma.intervention.findUnique.mockResolvedValue({
        id: 'int-1',
        technicianId: 'tech-1',
        status: InterventionStatus.SCHEDULED,
      });

      await expect(service.markOnTheWay(technician, 'int-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('passe la mission en déplacement et notifie le client', async () => {
      prisma.intervention.findUnique.mockResolvedValue({
        id: 'int-1',
        technicianId: 'tech-1',
        status: InterventionStatus.ACCEPTED,
      });
      prisma.intervention.update.mockResolvedValue({
        id: 'int-1',
        clientId: 'client-1',
        title: 'Installation caméra',
        status: InterventionStatus.ON_THE_WAY,
      });

      await service.markOnTheWay(technician, 'int-1');

      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'client-1' }),
      );
    });
  });

  describe('getTechnicianStats', () => {
    it('agrège les compteurs et la note moyenne du tableau de bord', async () => {
      prisma.intervention.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(5);
      prisma.intervention.aggregate.mockResolvedValue({
        _avg: { clientRating: 4.66 },
        _count: { clientRating: 3 },
      });

      const result = await service.getTechnicianStats('tech-1');

      expect(result).toEqual({
        active: 3,
        today: 1,
        completedThisMonth: 5,
        averageRating: 4.7,
        ratingCount: 3,
      });
    });

    it("renvoie une note nulle si aucune note n'existe", async () => {
      prisma.intervention.count.mockResolvedValue(0);
      prisma.intervention.aggregate.mockResolvedValue({
        _avg: { clientRating: null },
        _count: { clientRating: 0 },
      });

      const result = await service.getTechnicianStats('tech-1');

      expect(result.averageRating).toBeNull();
      expect(result.ratingCount).toBe(0);
    });
  });

  describe('rateIntervention', () => {
    it("rejette si l'utilisateur n'est pas le client de la mission", async () => {
      prisma.intervention.findUnique.mockResolvedValue({
        id: 'int-1',
        clientId: 'client-1',
        status: InterventionStatus.COMPLETED,
      });

      await expect(
        service.rateIntervention(
          { id: 'client-2', role: UserRole.CLIENT },
          'int-1',
          {
            rating: 5,
          },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it("rejette si la mission n'est pas terminée", async () => {
      prisma.intervention.findUnique.mockResolvedValue({
        id: 'int-1',
        clientId: 'client-1',
        status: InterventionStatus.IN_PROGRESS,
      });

      await expect(
        service.rateIntervention(client, 'int-1', { rating: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('enregistre la note et notifie le technicien', async () => {
      prisma.intervention.findUnique.mockResolvedValue({
        id: 'int-1',
        clientId: 'client-1',
        status: InterventionStatus.COMPLETED,
      });
      prisma.intervention.update.mockResolvedValue({
        id: 'int-1',
        title: 'Installation caméra',
        technicianId: 'tech-1',
        clientRating: 4,
      });

      await service.rateIntervention(client, 'int-1', {
        rating: 4,
        comment: 'Très professionnel',
      });

      const updateCall = prisma.intervention.update as jest.Mock<
        unknown,
        [{ data: { clientRating: number; clientRatingComment: string } }]
      >;
      expect(updateCall.mock.calls[0][0].data.clientRating).toBe(4);
      expect(updateCall.mock.calls[0][0].data.clientRatingComment).toBe(
        'Très professionnel',
      );
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'tech-1' }),
      );
    });
  });

  describe('complete', () => {
    it("rejette si la mission n'a pas été démarrée", async () => {
      prisma.intervention.findUnique.mockResolvedValue({
        id: 'int-1',
        technicianId: 'tech-1',
        status: InterventionStatus.SCHEDULED,
      });

      await expect(
        service.complete(technician, 'int-1', { report: 'Terminé' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('calcule la durée réelle à partir de startedAt si non fournie', async () => {
      const startedAt = new Date(Date.now() - 30 * 60000);
      prisma.intervention.findUnique.mockResolvedValue({
        id: 'int-1',
        technicianId: 'tech-1',
        status: InterventionStatus.IN_PROGRESS,
        startedAt,
      });
      prisma.intervention.update.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) => ({
          id: 'int-1',
          clientId: 'client-1',
          title: 'Installation caméra',
          reference: 'INT-TEST',
          client: { email: 'a@b.com', nom: 'Doe', prenom: 'John' },
          ...data,
        }),
      );

      const result = await service.complete(technician, 'int-1', {
        report: 'Installation terminée avec succès.',
      });

      expect(result.actualDuration).toBeGreaterThanOrEqual(0);
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'client-1' }),
      );
      expect(emailService.sendInterventionCompleted).toHaveBeenCalled();
    });

    it('utilise la durée fournie explicitement plutôt que le calcul', async () => {
      prisma.intervention.findUnique.mockResolvedValue({
        id: 'int-1',
        technicianId: 'tech-1',
        status: InterventionStatus.IN_PROGRESS,
        startedAt: new Date('2026-09-01T10:00:00.000Z'),
      });
      prisma.intervention.update.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) => ({
          id: 'int-1',
          clientId: 'client-1',
          client: { email: 'a@b.com', nom: 'Doe', prenom: 'John' },
          ...data,
        }),
      );

      const result = await service.complete(technician, 'int-1', {
        report: 'Terminé',
        actualDuration: 90,
      });

      expect(result.actualDuration).toBe(90);
    });
  });

  describe('addMaterial', () => {
    beforeEach(() => {
      prisma.intervention.findUnique.mockResolvedValue({
        id: 'int-1',
        technicianId: 'tech-1',
      });
      prisma.$transaction.mockImplementation(
        (cb: (tx: typeof prisma) => unknown) => cb(prisma),
      );
    });

    it('rejette si ni article de catalogue ni nom ne sont fournis', async () => {
      await expect(
        service.addMaterial(technician, 'int-1', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('décrémente le stock et utilise le nom du catalogue', async () => {
      prisma.materialItem.findUnique.mockResolvedValue({
        id: 'mat-1',
        name: 'Caméra dôme 4MP',
        isActive: true,
        stockQuantity: 5,
      });

      await service.addMaterial(technician, 'int-1', {
        materialItemId: 'mat-1',
        quantity: 2,
      });

      expect(prisma.materialItem.update).toHaveBeenCalledWith({
        where: { id: 'mat-1' },
        data: { stockQuantity: { decrement: 2 } },
      });
      expect(prisma.interventionMaterial.create).toHaveBeenCalledWith({
        data: {
          interventionId: 'int-1',
          name: 'Caméra dôme 4MP',
          quantity: 2,
          materialItemId: 'mat-1',
        },
      });
    });

    it('rejette si le stock est insuffisant', async () => {
      prisma.materialItem.findUnique.mockResolvedValue({
        id: 'mat-1',
        name: 'Caméra dôme 4MP',
        isActive: true,
        stockQuantity: 1,
      });

      await expect(
        service.addMaterial(technician, 'int-1', {
          materialItemId: 'mat-1',
          quantity: 2,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.interventionMaterial.create).not.toHaveBeenCalled();
    });

    it('accepte un nom libre sans toucher au stock', async () => {
      await service.addMaterial(technician, 'int-1', {
        name: 'Câble UTP (chute)',
        quantity: 1,
      });

      expect(prisma.materialItem.update).not.toHaveBeenCalled();
      expect(prisma.interventionMaterial.create).toHaveBeenCalledWith({
        data: {
          interventionId: 'int-1',
          name: 'Câble UTP (chute)',
          quantity: 1,
          materialItemId: undefined,
        },
      });
    });
  });

  describe('removeMaterial', () => {
    beforeEach(() => {
      prisma.intervention.findUnique.mockResolvedValue({
        id: 'int-1',
        technicianId: 'tech-1',
      });
      prisma.$transaction.mockImplementation(
        (cb: (tx: typeof prisma) => unknown) => cb(prisma),
      );
    });

    it('recrédite le stock quand le matériel venait du catalogue', async () => {
      prisma.interventionMaterial.findUnique.mockResolvedValue({
        id: 'im-1',
        materialItemId: 'mat-1',
        quantity: 3,
      });

      await service.removeMaterial(technician, 'int-1', 'im-1');

      expect(prisma.materialItem.update).toHaveBeenCalledWith({
        where: { id: 'mat-1' },
        data: { stockQuantity: { increment: 3 } },
      });
      expect(prisma.interventionMaterial.delete).toHaveBeenCalledWith({
        where: { id: 'im-1' },
      });
    });

    it('ne touche pas au stock pour un matériel en nom libre', async () => {
      prisma.interventionMaterial.findUnique.mockResolvedValue({
        id: 'im-1',
        materialItemId: null,
        quantity: 1,
      });

      await service.removeMaterial(technician, 'int-1', 'im-1');

      expect(prisma.materialItem.update).not.toHaveBeenCalled();
    });

    it('rejette si le matériel est introuvable', async () => {
      prisma.interventionMaterial.findUnique.mockResolvedValue(null);

      await expect(
        service.removeMaterial(technician, 'int-1', 'im-missing'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getReportPdf', () => {
    const completedIntervention = {
      id: 'int-1',
      reference: 'INT-TEST',
      title: 'Installation caméra',
      status: InterventionStatus.COMPLETED,
      scheduledAt: new Date('2026-09-01T10:00:00.000Z'),
      startedAt: new Date('2026-09-01T10:05:00.000Z'),
      completedAt: new Date('2026-09-01T11:05:00.000Z'),
      actualDuration: 60,
      observations: 'RAS',
      report: 'Installation terminée avec succès.',
      clientSignature: null,
      clientId: 'client-1',
      technicianId: 'tech-1',
      client: { nom: 'Doe', prenom: 'John' },
      technician: { nom: 'Tech', prenom: 'Nick' },
      materials: [],
    };

    it('rejette si la mission est introuvable', async () => {
      prisma.intervention.findUnique.mockResolvedValue(null);

      await expect(
        service.getReportPdf(technician, 'int-missing'),
      ).rejects.toThrow(NotFoundException);
    });

    it("rejette si l'utilisateur n'a pas accès à cette mission", async () => {
      prisma.intervention.findUnique.mockResolvedValue(completedIntervention);

      await expect(
        service.getReportPdf(otherTechnician, 'int-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it("rejette si la mission n'est pas encore terminée", async () => {
      prisma.intervention.findUnique.mockResolvedValue({
        ...completedIntervention,
        status: InterventionStatus.IN_PROGRESS,
      });

      await expect(service.getReportPdf(technician, 'int-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('génère un PDF pour une mission terminée', async () => {
      prisma.intervention.findUnique.mockResolvedValue(completedIntervention);

      const buffer = await service.getReportPdf(client, 'int-1');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });
});
