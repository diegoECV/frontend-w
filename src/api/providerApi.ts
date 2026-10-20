import { api } from './axiosConfig';
import type { Provider } from '../types/provider';

export const getProviders = (limit?: number) => {
  const url = limit && limit > 0 ? `/providers?limit=${limit}` : '/providers';
  return api.get<Provider[]>(url);
};

export const getProviderById = (id: string) => {
  return api.get<Provider>(`/providers/${id}`);
};

export const createProvider = (provider: Omit<Provider, 'id'>) => {
  return api.post<Provider>('/providers', provider);
};

export const updateProvider = (id: string, provider: Partial<Provider>) => {
  return api.put<Provider>(`/providers/${id}`, provider);
};

export const deleteProvider = (id: string) => {
  return api.delete(`/providers/${id}`);
};

export const hardDeleteProvider = (id: string) => {
  return api.delete(`/providers/${id}/hard`);
};

export const restoreProvider = (id: string) => {
  return api.patch<Provider>(`/providers/${id}/restore`);
};

export const exportProvidersExcel = async () => {
  const response = await api.get('/providers/export/excel', {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `proveedores_visons_${new Date().toISOString().slice(0, 10)}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportProvidersPdf = async () => {
  const response = await api.get('/providers/export/pdf', {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `directorio_proveedores_${new Date().toISOString().slice(0, 10)}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportProvidersCsv = async () => {
  const response = await api.get('/providers/export/csv', {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `proveedores_visons_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
