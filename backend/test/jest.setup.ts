// Lightweight runtime mocks for tests

// Mock generated Prisma client and enums.
// IMPORTANT : ces enums doivent rester synchronisés avec
// prisma/schema.prisma. Un enum absent d'ici (ou laissé à `{}`) se
// résout à `undefined` dans tout le code testé qui le compare
// (ex: `status !== BusinessServiceStatus.AVAILABLE`), ce qui casse
// silencieusement des chemins de code entiers sans erreur claire.
jest.mock('generated/prisma', () => {
  class PrismaClient {}
  const enums = {
    UserRole: { ADMIN: 'ADMIN', CLIENT: 'CLIENT', TECHNICIEN: 'TECHNICIEN' },
    OrderStatus: {
      PENDING: 'PENDING',
      CONFIRMED: 'CONFIRMED',
      PROCESSING: 'PROCESSING',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
    },
    PaymentStatus: {
      PENDING: 'PENDING',
      PAID: 'PAID',
      FAILED: 'FAILED',
      REFUNDED: 'REFUNDED',
    },
    ProjectStatus: {
      NEW: 'NEW',
      ANALYSIS: 'ANALYSIS',
      APPROVED: 'APPROVED',
      IN_PROGRESS: 'IN_PROGRESS',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
    },
    BusinessServiceStatus: {
      AVAILABLE: 'AVAILABLE',
      UNAVAILABLE: 'UNAVAILABLE',
    },
    PaymentMethod: {
      STRIPE: 'STRIPE',
      CASH: 'CASH',
      MOBILE_MONEY: 'MOBILE_MONEY',
    },
    PaymentGateway: {
      STRIPE: 'STRIPE',
      PAYDUNYA: 'PAYDUNYA',
      ORANGE_MONEY: 'ORANGE_MONEY',
      WAVE: 'WAVE',
    },
    AuditSeverity: {
      INFO: 'INFO',
      WARNING: 'WARNING',
      ERROR: 'ERROR',
      CRITICAL: 'CRITICAL',
    },
    NotificationType: {
      INFO: 'INFO',
      SUCCESS: 'SUCCESS',
      WARNING: 'WARNING',
      ERROR: 'ERROR',
    },
    EmailStatus: { PENDING: 'PENDING', SENT: 'SENT', FAILED: 'FAILED' },
    InterventionStatus: {
      SCHEDULED: 'SCHEDULED',
      ACCEPTED: 'ACCEPTED',
      ON_THE_WAY: 'ON_THE_WAY',
      IN_PROGRESS: 'IN_PROGRESS',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
    },
    DiscountType: {
      PERCENTAGE: 'PERCENTAGE',
      FIXED: 'FIXED',
    },
    ContractFrequency: {
      MONTHLY: 'MONTHLY',
      QUARTERLY: 'QUARTERLY',
      BIANNUAL: 'BIANNUAL',
      ANNUAL: 'ANNUAL',
    },
  };
  return { PrismaClient, ...enums };
});

jest.mock('generated/prisma/edge', () => ({
  UserRole: {},
}));

// Mock Prisma service used across the app
jest.mock('src/prisma/prisma.service', () => {
  class PrismaService {
    constructor() {}
    $connect = async () => {};
    $disconnect = async () => {};
  }
  return { PrismaService };
});

// Mock Cloudinary service
jest.mock('src/common/storage/cloudinary.service', () => {
  class CloudinaryService {
    uploadBuffer() {
      return Promise.resolve({
        secure_url: 'http://test.local/image.png',
        public_id: 'test-id',
      });
    }
    delete() {
      return Promise.resolve({ result: 'ok' });
    }
  }
  return { CloudinaryService };
});

// Mock CurrentUser decorator to a no-op decorator
jest.mock('src/auth/decorators/current-user.decorator', () => ({
  CurrentUser: () => () => {},
}));

// Mock roles decorator
jest.mock('src/auth/decorators/roles.decorator', () => ({
  Roles: () => () => {},
}));

// Mock Guards to be no-op classes
jest.mock('src/auth/guards/jwt-auth.guard', () => ({
  JwtAuthGuard: class JwtAuthGuard {},
}));
jest.mock('src/auth/guards/roles.guard', () => ({
  RolesGuard: class RolesGuard {},
}));

// Auto-inject simple providers for constructor dependencies in tests
import { Test } from '@nestjs/testing';
import type {
  TestingModuleBuilder,
  TestingModuleOptions,
} from '@nestjs/testing';
import type { ModuleMetadata, Provider, Type } from '@nestjs/common';

type ProviderCtor = Type<unknown>;

// `.bind()` doit être utilisé ici : createTestingModule() est une méthode
// statique dont on capture la valeur ORIGINALE avant de la réécrire juste
// en dessous — un simple wrapper qui rappellerait `Test.createTestingModule`
// au moment de l'appel bouclerait à l'infini sur la version patchée.
// Sans `strictBindCallApply` dans tsconfig, `.bind()` perd son typage
// (comportement connu de TS), d'où l'any explicite plutôt qu'un
// cast trompeur vers un type qui ne serait pas vérifié.
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const originalCreate: (
  metadata: ModuleMetadata,
  options?: TestingModuleOptions,
) => TestingModuleBuilder = Test.createTestingModule.bind(Test);

function collectParamTypes(target: ProviderCtor): ProviderCtor[] {
  try {
    const types = Reflect.getMetadata('design:paramtypes', target) as
      ProviderCtor[] | undefined;
    return types ?? [];
  } catch {
    return [];
  }
}

function providerToken(provider: Provider): unknown {
  if (typeof provider === 'function') {
    return provider;
  }
  return 'provide' in provider ? provider.provide : undefined;
}

Test.createTestingModule = function (metadata: ModuleMetadata) {
  const providers: Provider[] = metadata.providers
    ? [...metadata.providers]
    : [];

  const addProviderForType = (type: ProviderCtor) => {
    if (!type || typeof type !== 'function') return;
    // skip primitive/Object
    if (type === Object) return;
    // already provided
    if (providers.some((p) => providerToken(p) === type)) return;
    providers.push({ provide: type, useValue: {} });
  };

  // scan controllers
  (metadata.controllers ?? []).forEach((ctrl) => {
    collectParamTypes(ctrl as ProviderCtor).forEach(addProviderForType);
  });

  // scan providers (services under test)
  (metadata.providers ?? []).forEach((prov) => {
    const target =
      typeof prov === 'function'
        ? prov
        : 'useClass' in prov
          ? prov.useClass
          : undefined;
    if (target) {
      collectParamTypes(target as ProviderCtor).forEach(addProviderForType);
    }
  });

  const newMeta: ModuleMetadata = { ...metadata, providers };
  return originalCreate(newMeta);
};
