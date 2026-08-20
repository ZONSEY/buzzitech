import { UserRole } from 'generated/prisma';

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};
