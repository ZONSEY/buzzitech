export type ContractFrequency = 'MONTHLY' | 'QUARTERLY' | 'BIANNUAL' | 'ANNUAL';

export interface MaintenanceContract {
  id: string;
  title: string;
  description?: string;
  frequency: ContractFrequency;
  startDate: string;
  endDate?: string;
  nextScheduledAt: string;
  lastGeneratedAt?: string;
  isActive: boolean;
  clientId: string;
  client?: { id: string; nom: string; prenom: string; email: string };
  technicianId?: string;
  technician?: { id: string; nom: string; prenom: string };
  createdAt: string;
  updatedAt: string;
  _count?: { interventions: number };
}

export interface PaginatedMaintenanceContracts {
  data: MaintenanceContract[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface CreateMaintenanceContractPayload {
  title: string;
  description?: string;
  frequency: ContractFrequency;
  startDate?: string;
  endDate?: string;
  clientId: string;
  technicianId?: string;
  addressId?: string;
}

export const CONTRACT_FREQUENCY_LABELS: Record<ContractFrequency, string> = {
  MONTHLY: 'Mensuel',
  QUARTERLY: 'Trimestriel',
  BIANNUAL: 'Semestriel',
  ANNUAL: 'Annuel',
};
