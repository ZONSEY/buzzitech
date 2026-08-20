import { UserRole } from 'generated/prisma';

export interface CurrentUserData {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: UserRole;
}
