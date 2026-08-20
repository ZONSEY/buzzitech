import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('SearchService', () => {
  let service: SearchService;

  const prisma = {
    product: { findMany: jest.fn().mockResolvedValue([]) },
    businessService: { findMany: jest.fn().mockResolvedValue([]) },
    realisation: { findMany: jest.fn().mockResolvedValue([]) },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [SearchService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  it('interroge les trois catalogues en parallèle', async () => {
    const result = await service.search('caméra');

    expect(prisma.product.findMany).toHaveBeenCalled();
    expect(prisma.businessService.findMany).toHaveBeenCalled();
    expect(prisma.realisation.findMany).toHaveBeenCalled();
    expect(result).toEqual({ products: [], services: [], realisations: [] });
  });
});
