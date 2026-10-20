// =============================================================================
// API CLIENT: IMPORTACIÓN MASIVA DE DATOS — VISONS S.A.C.
// Soporte para archivos Excel (.xlsx, .xls) y CSV (.csv) con multipart/form-data
// =============================================================================

import { api } from './axiosConfig';

export interface ImportResponse {
  success: boolean;
  message: string;
  totalProcessed: number;
  totalImported: number;
  errors: string[];
}

export type ImportableModule = 'products' | 'providers' | 'clients' | 'orders' | 'users';

/**
 * Realiza la subida multipart/form-data de un archivo de datos al endpoint del módulo
 */
export const importModuleData = async (module: ImportableModule, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post<ImportResponse>(`/${module}/import`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const importProducts = (file: File) => importModuleData('products', file);
export const importProviders = (file: File) => importModuleData('providers', file);
export const importClients = (file: File) => importModuleData('clients', file);
export const importOrders = (file: File) => importModuleData('orders', file);
export const importUsers = (file: File) => importModuleData('users', file);
