export type ProjectStatus =
  | 'NEW'
  | 'ANALYSIS'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface QuoteLineItem {
  id: string;
  designation: string;
  quantity: number;
  unitPrice: string;
  displayOrder: number;
}

export interface ProjectRequest {
  id: string;
  reference?: string | null;
  title: string;
  description: string;
  budget: string | null;
  estimatedCost: string | null;
  estimatedDuration: number | null;
  adminComment: string | null;
  archived: boolean;
  deadline: string | null;
  status: ProjectStatus;
  locationLat?: number | null;
  locationLng?: number | null;
  locationAddress?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
  };
  quoteItems: QuoteLineItem[];
  intervention?: { id: string } | null;
}

export interface EstimateProjectPayload {
  estimatedDuration?: number;
  adminComment?: string;
}

export interface CreateQuoteItemPayload {
  designation: string;
  quantity?: number;
  unitPrice: number;
}

// Taux de TVA standard au Burkina Faso, appliqué aux devis — mêmes valeurs
// que PROJECT_QUOTE_VAT_RATE côté backend, pour un aperçu instantané avant
// enregistrement.
export const PROJECT_QUOTE_VAT_RATE = 0.18;

export interface CreateProjectRequestPayload {
  title: string;
  description: string;
  budget?: number;
  deadline?: string;
  locationLat?: number;
  locationLng?: number;
  locationAddress?: string;
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  NEW: 'Nouvelle',
  ANALYSIS: 'En analyse',
  APPROVED: 'Approuvée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

// Miroir de PROJECT_STATUS_TRANSITIONS côté backend — n'affiche que les
// transitions de statut réellement acceptées par l'API.
export const PROJECT_STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  NEW: ['ANALYSIS', 'CANCELLED'],
  ANALYSIS: ['APPROVED', 'CANCELLED'],
  APPROVED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};
