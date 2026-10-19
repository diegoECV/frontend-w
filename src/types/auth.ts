// =============================================================================
// TIPOS DE AUTENTICACIÓN Y ROLES — VISONS S.A.C.
// =============================================================================

export type UserRole = 'ADMIN' | 'TRABAJADOR' | 'CLIENTE';
export type ClientStatus = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface CompanyInfo {
  companyName: string;
  documentType: 'RUC' | 'TAX_ID' | 'EIN' | 'VAT';
  documentNumber: string;
  country: string;
  address: string;
  phone: string;
  preferredIncoterm?: 'FOB' | 'CIF' | 'CFR';
  preferredCurrency?: 'USD' | 'EUR' | 'PEN';
}

export interface ClientRegistrationRequest {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'CLIENTE';
  company: CompanyInfo;
  status: ClientStatus;
  rejectionReason?: string;
  authProvider: 'GOOGLE' | 'EMAIL';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: ClientStatus;
  department?: string;
  phone?: string;
  avatar?: string;
  company?: CompanyInfo;
  isCompanyComplete?: boolean;
  createdAt?: string;
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

