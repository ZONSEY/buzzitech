import { Test, TestingModule } from '@nestjs/testing';
import { SmsService } from './sms.service';
import { ConsoleSmsProvider } from './providers/console-sms.provider';

describe('SmsService', () => {
  let service: SmsService;

  const provider = { send: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        { provide: ConsoleSmsProvider, useValue: provider },
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);
  });

  describe('sendInterventionOnTheWay', () => {
    it("n'envoie rien si le client n'a pas de téléphone", async () => {
      await service.sendInterventionOnTheWay({
        title: 'Maintenance CCTV',
        reference: 'INT-001',
        client: { telephone: null },
      });

      expect(provider.send).not.toHaveBeenCalled();
    });

    it('envoie un SMS au numéro du client', async () => {
      await service.sendInterventionOnTheWay({
        title: 'Maintenance CCTV',
        reference: 'INT-001',
        client: { telephone: '+22670000000' },
      });

      expect(provider.send).toHaveBeenCalledWith(
        '+22670000000',
        expect.stringContaining('Maintenance CCTV'),
      );
    });

    it("n'interrompt pas l'appelant si le provider échoue", async () => {
      provider.send.mockRejectedValue(new Error('provider down'));

      await expect(
        service.sendInterventionOnTheWay({
          title: 'Maintenance CCTV',
          reference: 'INT-001',
          client: { telephone: '+22670000000' },
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('sendOrderConfirmation', () => {
    it('formate le montant dans le message', async () => {
      await service.sendOrderConfirmation({
        reference: 'CMD-001',
        totalAmount: 15000,
        user: { telephone: '+22670000000' },
      });

      expect(provider.send).toHaveBeenCalledWith(
        '+22670000000',
        expect.stringContaining('CMD-001'),
      );
    });
  });
});
