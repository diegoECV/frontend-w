// =============================================================================
// API CLIENT: USUARIOS, AUDITORÍA & SESIONES RBAC — VISONS S.A.C.
// =============================================================================

import { api } from './axiosConfig';
import type { User, AuditLog, RevokedToken } from '../types/user';

// ===== USUARIOS & IDENTIDAD =====

export const getUsers = (limit?: number) => {
  const url = limit && limit > 0 ? `/users?limit=${limit}` : '/users';
  return api.get<User[]>(url);
};

export const getUserById = (id: string) => {
  return api.get<User>(`/users/${id}`);
};

export const createUser = (user: Partial<User>) => {
  return api.post<User>('/users', user);
};

export const updateUser = (id: string, user: Partial<User>) => {
  return api.put<User>(`/users/${id}`, user);
};

export const deleteUser = (id: string) => {
  return api.delete(`/users/${id}`);
};

export const hardDeleteUser = (id: string) => {
  return api.delete(`/users/${id}/hard`);
};

export const restoreUser = (id: string) => {
  return api.patch<User>(`/users/${id}/restore`);
};

export const toggleUserStatus = (id: string) => {
  return api.patch<User>(`/users/${id}/toggle-status`);
};

export const inviteWorker = (worker: Partial<User>) => {
  return api.post<User>('/users/invite-worker', worker);
};

export const approveUser = (id: string) => {
  return api.put<User>(`/users/${id}/approve`);
};

// ===== REPORTES Y EXPORTACIÓN =====

export const exportUsersExcel = async () => {
  const res = await api.get('/users/export/excel', { responseType: 'blob' });
  const blob = new Blob([res.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `padron_usuarios_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const exportUsersPdf = async () => {
  const res = await api.get('/users/export/pdf', { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `padron_usuarios_${new Date().toISOString().slice(0, 10)}.pdf`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const exportUsersCsv = async () => {
  const res = await api.get('/users/export/csv', { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `padron_usuarios_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

// ===== LOGS DE AUDITORÍA (SQL SERVER) =====

export const getAuditLogs = () => {
  return api.get<AuditLog[]>('/audit-logs');
};

export const getAuditLogById = (id: number) => {
  return api.get<AuditLog>(`/audit-logs/${id}`);
};

export const createAuditLog = (log: Partial<AuditLog>) => {
  return api.post<AuditLog>('/audit-logs', log);
};

export const deleteAuditLog = (id: number) => {
  return api.delete(`/audit-logs/${id}`);
};

// ===== TOKENS REVOCADOS & SESIONES (MONGODB) =====

export const getRevokedTokens = () => {
  return api.get<RevokedToken[]>('/revoked-tokens');
};

export const createRevokedToken = (token: Partial<RevokedToken>) => {
  return api.post<RevokedToken>('/revoked-tokens', token);
};

export const deleteRevokedToken = (id: string) => {
  return api.delete(`/revoked-tokens/${id}`);
};
