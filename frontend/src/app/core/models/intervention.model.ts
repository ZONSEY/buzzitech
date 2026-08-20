export type InterventionStatus =
  | 'SCHEDULED'
  | 'ACCEPTED'
  | 'ON_THE_WAY'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface InterventionPerson {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
}

export interface InterventionAddress {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  postalCode?: string;
}

export interface InterventionPhoto {
  id: string;
  url: string;
  createdAt: string;
}

export interface InterventionMaterial {
  id: string;
  name: string;
  quantity: number;
  createdAt: string;
}

export interface Intervention {
  id: string;
  reference: string;
  title: string;
  description?: string;
  status: InterventionStatus;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  actualDuration?: number;
  observations?: string;
  report?: string;
  clientSignature?: string;
  clientRating?: number;
  clientRatingComment?: string;
  ratedAt?: string;
  clientId: string;
  client: InterventionPerson;
  technicianId?: string;
  technician?: InterventionPerson;
  addressId?: string;
  address?: InterventionAddress;
  addressText?: string;
  locationLat?: number | null;
  locationLng?: number | null;
  locationAddress?: string | null;
  orderItemId?: string;
  projectRequestId?: string;
  photos: InterventionPhoto[];
  materials: InterventionMaterial[];
  createdAt: string;
  updatedAt: string;
}

export interface InterventionFilter {
  page?: number;
  limit?: number;
  status?: InterventionStatus | '';
  technicianId?: string;
  search?: string;
  from?: string;
  to?: string;
}

export interface PaginatedInterventions {
  data: Intervention[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface CreateInterventionPayload {
  title: string;
  description?: string;
  scheduledAt: string;
  clientId: string;
  technicianId?: string;
  addressId?: string;
  addressText?: string;
  locationLat?: number;
  locationLng?: number;
  locationAddress?: string;
  orderItemId?: string;
  projectRequestId?: string;
}

export interface UpdateInterventionPayload
  extends Partial<CreateInterventionPayload> {
  status?: InterventionStatus;
}

export const INTERVENTION_STATUS_LABELS: Record<InterventionStatus, string> = {
  SCHEDULED: 'Planifiée',
  ACCEPTED: 'Acceptée',
  ON_THE_WAY: 'En déplacement',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

export interface TechnicianStats {
  active: number;
  today: number;
  completedThisMonth: number;
  averageRating: number | null;
  ratingCount: number;
}
