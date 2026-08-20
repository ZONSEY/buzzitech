import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProjectRequestsService } from './project-requests.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { EmailService } from 'src/email/email.service';
import { UserRole } from 'generated/prisma';

describe('ProjectRequestsService', () => {
  let service: ProjectRequestsService;

  const prisma = {
    projectRequest: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    quoteLineItem: {
      create: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const emailService = {
    sendProjectCreated: jest.fn(),
    sendAdminNewProject: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectRequestsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: {} },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<ProjectRequestsService>(ProjectRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('convertit une échéance au format date (YYYY-MM-DD) en Date avant Prisma', async () => {
      prisma.projectRequest.create.mockResolvedValue({
        id: 'proj-1',
        title: 'Sécurité surveillance',
        user: { email: 'a@b.com', nom: 'Doe', prenom: 'John' },
      });

      await service.create('user-1', {
        title: 'Sécurité surveillance',
        description: 'Installation de caméras',
        budget: 650000,
        deadline: '2026-08-18',
      });

      const createCall = prisma.projectRequest.create as jest.Mock<
        unknown,
        [{ data: { deadline: unknown } }]
      >;
      expect(createCall.mock.calls[0][0].data.deadline).toBeInstanceOf(Date);
    });

    it("n'envoie pas de deadline si elle n'est pas fournie", async () => {
      prisma.projectRequest.create.mockResolvedValue({
        id: 'proj-1',
        title: 'Sécurité surveillance',
        user: { email: 'a@b.com', nom: 'Doe', prenom: 'John' },
      });

      await service.create('user-1', {
        title: 'Sécurité surveillance',
        description: 'Installation de caméras',
      });

      const createCall = prisma.projectRequest.create as jest.Mock<
        unknown,
        [{ data: { deadline: unknown } }]
      >;
      expect(createCall.mock.calls[0][0].data.deadline).toBeUndefined();
    });
  });

  describe('getQuotePdf', () => {
    const project = {
      id: 'proj-1',
      title: 'Sécurité surveillance',
      description: 'Installation de caméras',
      status: 'NEW',
      budget: 650000,
      deadline: null,
      estimatedCost: null,
      estimatedDuration: null,
      adminComment: null,
      createdAt: new Date('2026-08-14'),
      user: { nom: 'Doe', prenom: 'John', email: 'a@b.com' },
      quoteItems: [] as {
        designation: string;
        quantity: number;
        unitPrice: number;
      }[],
    };

    it('génère un PDF pour le propriétaire de la demande', async () => {
      prisma.projectRequest.findFirst.mockResolvedValue(project);

      const buffer = await service.getQuotePdf(
        { id: 'user-1', role: UserRole.CLIENT },
        'proj-1',
      );

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      expect(prisma.projectRequest.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'proj-1', userId: 'user-1' },
        }),
      );
    });

    it('ne filtre pas par utilisateur pour un admin', async () => {
      prisma.projectRequest.findFirst.mockResolvedValue(project);

      await service.getQuotePdf(
        { id: 'admin-1', role: UserRole.ADMIN },
        'proj-1',
      );

      expect(prisma.projectRequest.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'proj-1' } }),
      );
    });

    it('rejette si la demande est introuvable', async () => {
      prisma.projectRequest.findFirst.mockResolvedValue(null);

      await expect(
        service.getQuotePdf({ id: 'user-1', role: UserRole.CLIENT }, 'proj-x'),
      ).rejects.toThrow(NotFoundException);
    });

    it('génère un PDF avec des lignes de devis chiffrées', async () => {
      prisma.projectRequest.findFirst.mockResolvedValue({
        ...project,
        reference: 'DEV-20260817-1',
        quoteItems: [
          { designation: 'Caméra dôme', quantity: 2, unitPrice: 85000 },
        ],
      });

      const buffer = await service.getQuotePdf(
        { id: 'user-1', role: UserRole.CLIENT },
        'proj-1',
      );

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe('addQuoteItem', () => {
    it("rejette si le projet n'existe pas", async () => {
      prisma.projectRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.addQuoteItem('missing', { designation: 'X', unitPrice: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('crée la ligne et recalcule le total TTC (HT + 18%)', async () => {
      prisma.projectRequest.findUnique.mockResolvedValue({ id: 'proj-1' });
      prisma.quoteLineItem.aggregate.mockResolvedValue({
        _max: { displayOrder: null },
      });
      prisma.quoteLineItem.findMany.mockResolvedValue([
        { unitPrice: 85000, quantity: 2 },
      ]);
      prisma.projectRequest.update.mockResolvedValue({ id: 'proj-1' });

      await service.addQuoteItem('proj-1', {
        designation: 'Caméra dôme',
        quantity: 2,
        unitPrice: 85000,
      });

      const updateCall = prisma.projectRequest.update as jest.Mock<
        unknown,
        [{ data: { estimatedCost: number } }]
      >;
      expect(updateCall.mock.calls[0][0].data.estimatedCost).toBeCloseTo(
        2 * 85000 * 1.18,
      );
    });
  });

  describe('removeQuoteItem', () => {
    it("rejette si la ligne n'existe pas", async () => {
      prisma.quoteLineItem.findUnique.mockResolvedValue(null);

      await expect(service.removeQuoteItem('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('repasse le total à null une fois la dernière ligne supprimée', async () => {
      prisma.quoteLineItem.findUnique.mockResolvedValue({
        id: 'item-1',
        projectRequestId: 'proj-1',
      });
      prisma.quoteLineItem.findMany.mockResolvedValue([]);
      prisma.projectRequest.update.mockResolvedValue({ id: 'proj-1' });

      await service.removeQuoteItem('item-1');

      const updateCall = prisma.projectRequest.update as jest.Mock<
        unknown,
        [{ data: { estimatedCost: number | null } }]
      >;
      expect(updateCall.mock.calls[0][0].data.estimatedCost).toBeNull();
    });
  });
});
