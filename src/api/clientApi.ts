import { api } from './axiosConfig';
import type { Client } from '../types/client';

export const getClients = (limit?: number) => {
  const url = limit && limit > 0 ? `/clients?limit=${limit}` : '/clients';
  return api.get<Client[]>(url);
};

export const getClientById = (id: string) => {
  return api.get<Client>(`/clients/${id}`);
};

export const createClient = (client: Omit<Client, 'id'>) => {
  return api.post<Client>('/clients', client);
};

export const updateClient = (id: string, client: Partial<Client>) => {
  return api.put<Client>(`/clients/${id}`, client);
};

export const deleteClient = (id: string) => {
  return api.delete(`/clients/${id}`);
};

export const hardDeleteClient = (id: string) => {
  return api.delete(`/clients/${id}/hard`);
};

export const restoreClient = (id: string) => {
  return api.put<Client>(`/clients/${id}/restore`);
};

export const exportClientsExcel = async () => {
  const response = await api.get('/clients/export/excel', {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `clientes_visons_${new Date().toISOString().slice(0, 10)}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportClientsPdf = async () => {
  const response = await api.get('/clients/export/pdf', {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `directorio_clientes_${new Date().toISOString().slice(0, 10)}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportClientsCsv = async () => {
  const response = await api.get('/clients/export/csv', {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `clientes_visons_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
