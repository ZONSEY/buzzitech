import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MaintenanceContractsService } from './maintenance-contracts.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { ContractFrequency } from 'generated/prisma';

describe('MaintenanceContractsService', () => {
  let service: MaintenanceContractsService;

  const prisma = {
    maintenanceContract: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    intervention: { create: jest.fn() },
  };

  const notificationsService = { create: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenanceContractsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<MaintenanceContractsService>(
      MaintenanceContractsService,
    );
  });

  describe('create', () => {
    it('initialise nextScheduledAt à la date de début', async () => {
      prisma.maintenanceContract.create.mockResolvedValue({ id: 'mc-1' });

      await service.create({
        title: 'Maintenance CCTV',
        frequency: ContractFrequency.QUARTERLY,
        startDate: '2026-09-01',
        clientId: 'client-1',
      });

      const createCall = prisma.maintenanceContract.create as jest.Mock<
        unknown,
        [{ data: { nextScheduledAt: Date; startDate: Date } }]
      >;
      const { nextScheduledAt, startDate } = createCall.mock.calls[0][0].data;
      expect(nextScheduledAt).toEqual(startDate);
      expect(startDate.toISOString().split('T')[0]).toBe('2026-09-01');
    });
  });

  describe('generateDueInterventions', () => {
    it("ne fait rien si aucun contrat n'est dû", async () => {
      prisma.maintenanceContract.findMany.mockResolvedValue([]);

      const result = await service.generateDueInterventions();

      expect(result).toEqual({ generated: 0 });
      expect(prisma.intervention.create).not.toHaveBeenCalled();
    });

    it('génère une intervention et avance la prochaine échéance mensuelle', async () => {
      const dueContract = {
        id: 'mc-1',
        title: 'Maintenance CCTV',
        description: null,
        clientId: 'client-1',
        technicianId: 'tech-1',
        addressId: null,
        frequency: ContractFrequency.MONTHLY,
        nextScheduledAt: new Date('2026-08-01T00:00:00.000Z'),
      };
      prisma.maintenanceContract.findMany.mockResolvedValue([dueContract]);
      prisma.intervention.create.mockResolvedValue({
        id: 'int-1',
        technicianId: 'tech-1',
        title: 'Maintenance CCTV',
        scheduledAt: new Date('2026-08-01T00:00:00.000Z'),
      });

      const result = await service.generateDueInterventions();

      expect(result).toEqual({ generated: 1 });

      const interventionCreateCall = prisma.intervention.create as jest.Mock<
        unknown,
        [{ data: { maintenanceContractId: string; clientId: string } }]
      >;
      expect(
        interventionCreateCall.mock.calls[0][0].data.maintenanceContractId,
      ).toBe('mc-1');
      expect(interventionCreateCall.mock.calls[0][0].data.clientId).toBe(
        'client-1',
      );
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'tech-1' }),
      );

      const updateCall = prisma.maintenanceContract.update as jest.Mock<
        unknown,
        [{ data: { nextScheduledAt: Date } }]
      >;
      const newNextDate = updateCall.mock.calls[0][0].data.nextScheduledAt;
      expect(newNextDate.toISOString().split('T')[0]).toBe('2026-09-01');
    });

    it('ne notifie pas si aucun technicien n’est assigné', async () => {
      prisma.maintenanceContract.findMany.mockResolvedValue([
        {
          id: 'mc-1',
          title: 'Maintenance CCTV',
          description: null,
          clientId: 'client-1',
          technicianId: null,
          addressId: null,
          frequency: ContractFrequency.ANNUAL,
          nextScheduledAt: new Date('2026-08-01T00:00:00.000Z'),
        },
      ]);
      prisma.intervention.create.mockResolvedValue({
        id: 'int-1',
        technicianId: null,
      });

      await service.generateDueInterventions();

      expect(notificationsService.create).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('rejette si le contrat est introuvable', async () => {
      prisma.maintenanceContract.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
