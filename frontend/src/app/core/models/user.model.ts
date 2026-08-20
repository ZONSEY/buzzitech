export type UserRole = 'ADMIN' | 'CLIENT' | 'TECHNICIEN';

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  avatar?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface RegisterPayload {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
