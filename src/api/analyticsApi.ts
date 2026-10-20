// =============================================================================
// API CLIENT: BACKEND ANALÍTICO — VISONS S.A.C.
// Conexión directa a http://localhost:5000/api/v1/analytics (Python / Flask)
// =============================================================================

import axios from 'axios';

const getDynamicAnalyticsUrl = (): string => {
  if (import.meta.env.VITE_ANALYTICS_API_URL) {
    return import.meta.env.VITE_ANALYTICS_API_URL;
  }
  const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
  return `http://${host}:5000/api/v1/analytics`;
};

export const ANALYTICS_BASE_URL = getDynamicAnalyticsUrl();

export const analyticsClient = axios.create({
  baseURL: ANALYTICS_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export interface DashboardKpis {
  comercial: {
    total_ordenes: number;
    ordenes_pendientes: number;
    facturacion_total_usd: number;
  };
  logistica: {
    total_envios: number;
    envios_en_transito: number;
  };
  calidad: {
    total_inspecciones: number;
    tasa_aprobacion_pct: number;
  };
  inventario: {
    lotes_en_inventario: number;
    lotes_en_produccion: number;
  };
  seguridad: {
    total_auditorias: number;
    logins_recientes: number;
  };
  maestros: {
    total_clientes: number;
    total_proveedores: number;
  };
}

export interface VentasMensualItem {
  periodo: string;
  total_ordenes: number;
  ordenes_pagadas: number;
  ordenes_pendientes: number;
  facturacion_usd: number;
}

export interface CalidadDistribucionItem {
  estado: string;
  cantidad: number;
  porcentaje: number;
}

export interface CalidadDistribucionResponse {
  total_inspecciones: number;
  tasa_aprobacion_pct: number;
  tasa_rechazo_pct: number;
  distribucion: CalidadDistribucionItem[];
}

export interface EnviosResumenResponse {
  total_envios: number;
  envios_en_transito: number;
}

export interface InventarioResumenResponse {
  lotes_en_inventario_mongo: number;
  lotes_produccion_sql: number;
}

export interface AccionPorRecursoItem {
  recurso: string;
  cantidad: number;
}

export interface AuditResumenResponse {
  total_logs: number;
  logins_recientes: number;
  acciones_por_recurso: AccionPorRecursoItem[];
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// ── Métodos API ─────────────────────────────────────────────────────────────

export const getDashboardKpis = async (): Promise<DashboardKpis> => {
  const res = await analyticsClient.get<ApiResponse<DashboardKpis>>('/dashboard/kpis');
  return res.data.data;
};

export const getVentasMensual = async (): Promise<VentasMensualItem[]> => {
  const res = await analyticsClient.get<ApiResponse<VentasMensualItem[]>>('/ventas/mensual');
  return res.data.data;
};

export const getCalidadDistribucion = async (): Promise<CalidadDistribucionResponse> => {
  const res = await analyticsClient.get<ApiResponse<CalidadDistribucionResponse>>('/calidad/distribucion');
  return res.data.data;
};

export const getEnviosResumen = async (): Promise<EnviosResumenResponse> => {
  const res = await analyticsClient.get<ApiResponse<EnviosResumenResponse>>('/envios/resumen');
  return res.data.data;
};

export const getInventarioResumen = async (): Promise<InventarioResumenResponse> => {
  const res = await analyticsClient.get<ApiResponse<InventarioResumenResponse>>('/inventario/resumen');
  return res.data.data;
};

export const getAuditResumen = async (): Promise<AuditResumenResponse> => {
  const res = await analyticsClient.get<ApiResponse<AuditResumenResponse>>('/audit/resumen');
  return res.data.data;
};
