// =============================================================================
// CENTRAL NOTIFICATION SERVICE — VISONS S.A.C.
// Despacha notificaciones por correo electrónico al backend y sincroniza
// el centro de notificaciones (Campana de la barra superior) en tiempo real
// =============================================================================

import { sendEmailNotification, type EmailNotificationPayload } from '../api/notificationApi';
import { toast } from 'sonner';

export interface SystemNotificationItem {
  id: string;
  module: string;
  actionType: string;
  entityName: string;
  details: string;
  timestamp: string;
  user: string;
  read: boolean;
  emailSent: boolean;
  link?: string;
}

const STORAGE_KEY = 'visons_system_notifications_v1';
const PREFS_KEY = 'visons_user_preferences';

/**
 * Obtiene el historial de notificaciones locales para el dropdown de la campana
 */
export function getLocalNotifications(): SystemNotificationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Guarda las notificaciones locales y dispara evento de actualización
 */
export function saveLocalNotifications(items: SystemNotificationItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 30)));
    window.dispatchEvent(new CustomEvent('visons_notifications_updated'));
  } catch (err) {
    console.error('Error saving notifications:', err);
  }
}

/**
 * Marca todas las notificaciones como leídas
 */
export function markAllNotificationsAsRead() {
  const items = getLocalNotifications().map((item) => ({ ...item, read: true }));
  saveLocalNotifications(items);
}

/**
 * Limpia el historial de notificaciones
 */
export function clearNotificationsHistory() {
  saveLocalNotifications([]);
}

export interface NotificationEmailPreferences {
  emailNotificationsEnabled: boolean;
  alertEmail: string;
}

export function getNotificationEmailConfig(): NotificationEmailPreferences {
  try {
    const raw = localStorage.getItem('visons_settings') || localStorage.getItem(PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        emailNotificationsEnabled: parsed.emailNotificationsEnabled !== false,
        alertEmail: parsed.alertEmail || 'operaciones@visons.com',
      };
    }
  } catch {}
  return {
    emailNotificationsEnabled: true,
    alertEmail: 'operaciones@visons.com',
  };
}

/**
 * Despacha una notificación por correo electrónico de cualquier actualización operativa
 */
export async function notifyOperationUpdate(params: {
  module: 'PRODUCTOS' | 'CLIENTES' | 'LOTES' | 'EMBARQUES' | 'FINANZAS' | 'USUARIOS';
  actionType: 'ACTUALIZACIÓN' | 'RESTAURACIÓN' | 'PAPELERA' | 'CREACIÓN' | 'CAMBIO DE ESTADO';
  entityName: string;
  details: string;
  user?: string;
  link?: string;
}) {
  // Verificar preferencias de usuario
  const { emailNotificationsEnabled, alertEmail } = getNotificationEmailConfig();
  const targetEmail = alertEmail;
  const emailEnabled = emailNotificationsEnabled;

  // Operador actual
  let currentUser = params.user || 'Administrador Visons';
  try {
    const rawUser = localStorage.getItem('visons_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u.name || u.email) currentUser = u.name || u.email;
    }
  } catch {
    // fallback
  }

  const payload: EmailNotificationPayload = {
    to: targetEmail,
    module: params.module,
    actionType: params.actionType,
    entityName: params.entityName,
    details: params.details,
    user: currentUser,
    link: params.link || window.location.href,
  };

  // Registrar localmente en la campana de notificaciones
  const newItem: SystemNotificationItem = {
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    module: params.module,
    actionType: params.actionType,
    entityName: params.entityName,
    details: params.details,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    user: currentUser,
    read: false,
    emailSent: emailEnabled,
    link: params.link,
  };

  const existing = getLocalNotifications();
  saveLocalNotifications([newItem, ...existing]);

  // Si las notificaciones por correo están habilitadas, despachar al backend
  if (emailEnabled) {
    try {
      await sendEmailNotification(payload);
      toast.info(`📧 Notificación de ${params.actionType.toLowerCase()} enviada a ${targetEmail}`, {
        duration: 3500,
      });
    } catch (err) {
      console.warn('[NotificationService] Envío de correo encolado/simulado:', err);
    }
  }
}
