// =============================================================================
// API CLIENT: NOTIFICACIONES POR CORREO ELECTRÓNICO — VISONS S.A.C.
// =============================================================================

import { api } from './axiosConfig';

export interface EmailNotificationPayload {
  to?: string;
  module: string;       // 'PRODUCTOS' | 'CLIENTES' | 'LOTES' | 'EMBARQUES' | 'FINANZAS' | 'USUARIOS'
  actionType: string;   // 'ACTUALIZACIÓN' | 'RESTAURACIÓN' | 'PAPELERA' | 'CREACIÓN' | 'CAMBIO DE ESTADO'
  entityName: string;   // ej: 'Lote LOT-0042', 'Orden EXP-2026-089'
  details: string;      // Resumen del cambio
  user?: string;        // Operador responsable
  link?: string;        // Enlace directo en el panel
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  recipient?: string;
  module?: string;
}

export interface NotificationConfig {
  enabled: boolean;
  fromEmail: string;
  provider: string;
  status: string;
}

/**
 * Envía una notificación por correo al detectarse una actualización o cambio en el sistema
 */
export const sendEmailNotification = async (payload: EmailNotificationPayload) => {
  return api.post<NotificationResponse>('/notifications/email', payload);
};

/**
 * Envía un correo de prueba para verificar que el servicio SMTP responda
 */
export const sendTestEmail = async (to: string) => {
  return api.post<NotificationResponse>('/notifications/test-email', { to });
};

/**
 * Obtiene el estado del servicio de notificaciones por correo
 */
export const getNotificationConfig = async () => {
  return api.get<NotificationConfig>('/notifications/config');
};
