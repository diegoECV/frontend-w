// =============================================================================
// TYPES: USUARIOS, AUDITORÍA & SEGURIDAD RBAC — VISONS S.A.C.
// =============================================================================

export type UserRole = 'ADMIN' | 'WORKER' | 'CLIENT' | 'OPERATOR';

export type UserDepartment =
  | 'Administración'
  | 'Operaciones'
  | 'Control de Calidad'
  | 'Comercial & Exportación'
  | 'Finanzas & Facturación'
  | 'Logística & Almacén';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole | string;
  department?: string;
  position?: string | null;
  documentType?: string | null;
  documentNumber?: string | null;
  isActive: boolean;
  lastLogin?: string | null;
  createdAt?: string | null;
  createdBy?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'APPROVE'
  | 'REJECT';

export interface AuditLog {
  id: number;
  userId: string;
  username: string;
  action: AuditAction | string;
  resource: string;
  resourceId?: string;
  timestamp: string;
  changesBefore?: string | null;
  changesAfter?: string | null;
  ipAddress?: string | null;
}

export interface RevokedToken {
  id?: string;
  tokenSignature: string;
  revokedAt?: string;
  expiresAt?: string;
  reason?: string;
}

export interface UserFormData {
  username: string;
  password?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole | string;
  department?: string;
  isActive: boolean;
}
