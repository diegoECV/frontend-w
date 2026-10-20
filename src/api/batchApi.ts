import { api } from './axiosConfig';
import type { Batch, InventoryBatch, QualityInspection, TemperatureLog } from '../types/batch';

// --- LOTES DE COSECHA & PACKING (BATCHES) ---
export const getBatches = (limit?: number) => {
  const url = limit && limit > 0 ? `/batches?limit=${limit}` : '/batches';
  return api.get<Batch[]>(url);
};

export const getBatchById = (id: number) => {
  return api.get<Batch>(`/batches/${id}`);
};

export const createBatch = (batch: Omit<Batch, 'batchId'>) => {
  return api.post<Batch>('/batches', batch);
};

export const updateBatch = (id: number, batch: Partial<Batch>) => {
  return api.put<Batch>(`/batches/${id}`, batch);
};

export const deleteBatch = (id: number) => {
  return api.delete(`/batches/${id}`);
};

// --- INVENTARIO DE PLANTA (INVENTORY BATCHES) ---
export const getInventoryBatches = (limit?: number) => {
  const url = limit && limit > 0 ? `/inventory-batches?limit=${limit}` : '/inventory-batches';
  return api.get<InventoryBatch[]>(url);
};

export const createInventoryBatch = (inv: Omit<InventoryBatch, 'id'>) => {
  return api.post<InventoryBatch>('/inventory-batches', inv);
};

export const updateInventoryBatch = (id: string, inv: Partial<InventoryBatch>) => {
  return api.put<InventoryBatch>(`/inventory-batches/${id}`, inv);
};

export const deleteInventoryBatch = (id: string) => {
  return api.delete(`/inventory-batches/${id}`);
};

// --- CONTROL DE CALIDAD SENASA (QUALITY INSPECTIONS) ---
export const getQualityInspections = (limit?: number) => {
  const url = limit && limit > 0 ? `/quality-inspections?limit=${limit}` : '/quality-inspections';
  return api.get<QualityInspection[]>(url);
};

export const createQualityInspection = (insp: Omit<QualityInspection, 'id'>) => {
  return api.post<QualityInspection>('/quality-inspections', insp);
};

export const updateQualityInspection = (id: string, insp: Partial<QualityInspection>) => {
  return api.put<QualityInspection>(`/quality-inspections/${id}`, insp);
};

export const deleteQualityInspection = (id: string) => {
  return api.delete(`/quality-inspections/${id}`);
};

// --- TELEMETRÍA DE TEMPERATURA & CADENA DE FRÍO ---
export const getTemperatureLogs = () => {
  return api.get<TemperatureLog[]>('/temperature-logs');
};

export const createTemperatureLog = (log: Omit<TemperatureLog, 'id'>) => {
  return api.post<TemperatureLog>('/temperature-logs', log);
};

