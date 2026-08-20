export interface Equipment {
  id: string;
  name: string;
  category?: string;
  brand?: string;
  serialNumber?: string;
  installedAt: string;
  warrantyUntil?: string;
  notes?: string;
  clientId: string;
  client?: { id: string; nom: string; prenom: string; email: string };
  addressId?: string;
  address?: { address: string; city: string };
  interventionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedEquipment {
  data: Equipment[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface CreateEquipmentPayload {
  name: string;
  category?: string;
  brand?: string;
  serialNumber?: string;
  installedAt?: string;
  warrantyUntil?: string;
  notes?: string;
  clientId: string;
  addressId?: string;
  interventionId?: string;
}
