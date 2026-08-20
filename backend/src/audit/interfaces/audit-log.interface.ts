import { AuditSeverity } from 'generated/prisma';

export interface AuditLog {
  userId: string;

  action: string;

  entity: string;

  entityId: string;

  details?: Record<string, unknown>;

  success?: boolean;

  severity?: AuditSeverity;

  ipAddress?: string;

  userAgent?: string;
}
