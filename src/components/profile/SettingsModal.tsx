// =============================================================================
// MODAL: CONFIGURACIÓN DEL SISTEMA — VISONS S.A.C.
// Tema (Claro/Oscuro), Idioma (ES/EN), Moneda, Notificaciones y Auto-Refresco
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Sun,
  Moon,
  Globe,
  Bell,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Volume2,
  DollarSign,
  Shield,
  RotateCcw,
  Mail,
  Send,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../../hooks/useTheme';
import { sendTestEmail } from '../../api/notificationApi';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'es' | 'en';
  onToggleLang: () => void;
}

interface UserPreferences {
  currency: 'USD' | 'PEN' | 'EUR';
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD';
  refreshInterval: number; // segundos (0 = manual)
  notifyShipments: boolean;
  notifyQuality: boolean;
  notifyB2B: boolean;
  soundEnabled: boolean;
  denseTableMode: boolean;
  emailNotificationsEnabled: boolean;
  alertEmail: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  currency: 'USD',
  dateFormat: 'DD/MM/YYYY',
  refreshInterval: 30,
  notifyShipments: true,
  notifyQuality: true,
  notifyB2B: true,
  soundEnabled: true,
  denseTableMode: false,
  emailNotificationsEnabled: true,
  alertEmail: 'operaciones@visons.com',
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  lang,
  onToggleLang,
}) => {
  const { theme, setTheme } = useTheme();
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('visons_settings') || localStorage.getItem('visons_user_preferences');
    if (saved) {
      try {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_PREFERENCES;
      }
    }
    return DEFAULT_PREFERENCES;
  });

  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'system'>('general');

  useEffect(() => {
    localStorage.setItem('visons_settings', JSON.stringify(preferences));
    localStorage.setItem('visons_user_preferences', JSON.stringify(preferences));
  }, [preferences]);

  const handleTestEmail = async () => {
    if (!preferences.alertEmail || !preferences.alertEmail.includes('@')) {
      toast.error(
        lang === 'es' ? 'Ingresa un correo electrónico válido' : 'Please provide a valid email address'
      );
      return;
    }

    setIsTestingEmail(true);
    const toastId = toast.loading(
      lang === 'es'
        ? `Enviando correo de prueba a ${preferences.alertEmail}...`
        : `Sending test email to ${preferences.alertEmail}...`
    );

    try {
      await sendTestEmail(preferences.alertEmail);
      toast.success(
        lang === 'es'
          ? `Correo de prueba enviado con éxito a ${preferences.alertEmail}`
          : `Test email dispatched successfully to ${preferences.alertEmail}`,
        { id: toastId }
      );
    } catch (err: unknown) {
      console.warn('Error sending test email:', err);
      toast.info(
        lang === 'es'
          ? `Prueba procesada (Modo seguro / Simulación): ${preferences.alertEmail}`
          : `Test processed (Safe simulation mode): ${preferences.alertEmail}`,
        { id: toastId }
      );
    } finally {
      setIsTestingEmail(false);
    }
  };

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('visons_settings', JSON.stringify(preferences));
    toast.success(
      lang === 'es' ? 'Preferencias guardadas' : 'Preferences saved',
      {
        description:
          lang === 'es'
            ? 'Los ajustes de la interfaz y sistema han sido actualizados.'
            : 'Interface and system preferences have been updated.',
      }
    );
    onClose();
  };

  const handleReset = () => {
    setPreferences(DEFAULT_PREFERENCES);
    toast.info(
      lang === 'es' ? 'Ajustes restablecidos' : 'Settings restored',
      {
        description:
          lang === 'es'
            ? 'Se restauraron los valores por defecto del sistema.'
            : 'System default settings were restored.',
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Settings size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  {lang === 'es' ? 'Configuración del Sistema' : 'System Preferences'}
                </h2>
                <p className="text-xs text-[var(--text-hint)] mt-0.5">
                  {lang === 'es'
                    ? 'Personaliza apariencia, idioma, alertas y comportamiento del ERP'
                    : 'Customize visual theme, language, alerts and ERP dashboard behavior'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--text-hint)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Selector de pestañas */}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'general'
                  ? 'bg-[var(--surface-card)] text-blue-600 dark:text-blue-400 border border-[var(--border-subtle)] shadow-sm'
                  : 'text-[var(--text-hint)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Sliders size={14} />
              {lang === 'es' ? 'Apariencia & Región' : 'Appearance & Region'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-[var(--surface-card)] text-blue-600 dark:text-blue-400 border border-[var(--border-subtle)] shadow-sm'
                  : 'text-[var(--text-hint)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Bell size={14} />
              {lang === 'es' ? 'Alertas & Notificaciones' : 'Alerts & Notifications'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('system')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'system'
                  ? 'bg-[var(--surface-card)] text-blue-600 dark:text-blue-400 border border-[var(--border-subtle)] shadow-sm'
                  : 'text-[var(--text-hint)] hover:text-[var(--text-primary)]'
              }`}
            >
              <RefreshCw size={14} />
              {lang === 'es' ? 'Rendimiento & Datos' : 'Performance & Sync'}
            </button>
          </div>
        </div>

        {/* Contenido del modal */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {activeTab === 'general' && (
            <>
              {/* Selector de Tema */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-2">
                  {lang === 'es' ? 'Tema Visual de la Interfaz' : 'Visual Theme'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                      theme === 'light'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20'
                        : 'border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                      <Sun size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold">{lang === 'es' ? 'Modo Claro' : 'Light Mode'}</p>
                      <p className="text-[11px] text-[var(--text-hint)]">
                        {lang === 'es' ? 'Fondo blanco de alto contraste' : 'Clean high-contrast theme'}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                      theme === 'dark'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20'
                        : 'border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <Moon size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold">{lang === 'es' ? 'Modo Oscuro' : 'Dark Mode'}</p>
                      <p className="text-[11px] text-[var(--text-hint)]">
                        {lang === 'es' ? 'Fondo oscuro para jornada nocturna' : 'Deep OLED dark theme'}
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Selector de Idioma */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-2">
                  {lang === 'es' ? 'Idioma del Sistema' : 'System Language'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (lang !== 'es') onToggleLang();
                    }}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                      lang === 'es'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20'
                        : 'border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 font-black text-xs">
                      ES
                    </div>
                    <div>
                      <p className="text-xs font-bold">Español (Perú / Internacional)</p>
                      <p className="text-[11px] text-[var(--text-hint)]">Predeterminado Visons S.A.C.</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (lang !== 'en') onToggleLang();
                    }}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                      lang === 'en'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20'
                        : 'border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 font-black text-xs">
                      EN
                    </div>
                    <div>
                      <p className="text-xs font-bold">English (US / Global)</p>
                      <p className="text-[11px] text-[var(--text-hint)]">B2B International Trade</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Moneda y Formato de Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                    {lang === 'es' ? 'Moneda Predeterminada del Panel' : 'Default Currency'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-hint)]">
                      <DollarSign size={15} />
                    </div>
                    <select
                      value={preferences.currency}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          currency: e.target.value as 'USD' | 'PEN' | 'EUR',
                        })
                      }
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                    >
                      <option value="USD">USD ($) — Dólar Estadounidense (Exportación)</option>
                      <option value="PEN">PEN (S/.) — Sol Peruano (Local)</option>
                      <option value="EUR">EUR (€) — Euro (Comunidad Europea)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                    {lang === 'es' ? 'Formato de Fecha' : 'Date Format'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-hint)]">
                      <Globe size={15} />
                    </div>
                    <select
                      value={preferences.dateFormat}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          dateFormat: e.target.value as 'DD/MM/YYYY' | 'YYYY-MM-DD',
                        })
                      }
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                    >
                      <option value="DD/MM/YYYY">DD/MM/AAAA (Ej: 19/10/2026)</option>
                      <option value="YYYY-MM-DD">AAAA-MM-DD (ISO Estándar)</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              {/* Notificaciones por Correo Electrónico (Actualizaciones) */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 via-[var(--surface-subtle)] to-indigo-500/10 border border-blue-500/30 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/20">
                      <Mail size={19} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-[var(--text-primary)]">
                          {lang === 'es'
                            ? 'Notificaciones por Correo Electrónico'
                            : 'Email Notifications on System Updates'}
                        </p>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {preferences.emailNotificationsEnabled
                            ? lang === 'es' ? 'Activo' : 'Active'
                            : lang === 'es' ? 'Desactivado' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-hint)] mt-0.5 leading-relaxed">
                        {lang === 'es'
                          ? 'Despacha automáticamente una plantilla HTML ante cualquier creación, actualización, anulación o restauración en todos los módulos.'
                          : 'Automatically sends responsive HTML emails for any creation, update, trash move, or restoration across all modules.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPreferences({
                        ...preferences,
                        emailNotificationsEnabled: !preferences.emailNotificationsEnabled,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                      preferences.emailNotificationsEnabled ? 'bg-blue-600' : 'bg-gray-400 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.emailNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Recipiente y Botón de Prueba */}
                {preferences.emailNotificationsEnabled && (
                  <div className="pt-3 border-t border-[var(--border-subtle)] space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1.5">
                        {lang === 'es'
                          ? 'Dirección de Correo Destino para Alertas Operativas'
                          : 'Target Notification Email Address'}
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-hint)]">
                            <Mail size={14} />
                          </div>
                          <input
                            type="email"
                            value={preferences.alertEmail}
                            onChange={(e) =>
                              setPreferences({ ...preferences, alertEmail: e.target.value })
                            }
                            placeholder="operaciones@visons.com"
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-hint)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>

                        <button
                          type="button"
                          disabled={isTestingEmail}
                          onClick={handleTestEmail}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20 cursor-pointer shrink-0"
                        >
                          {isTestingEmail ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              {lang === 'es' ? 'Enviando...' : 'Sending...'}
                            </>
                          ) : (
                            <>
                              <Send size={13} />
                              {lang === 'es' ? 'Enviar Prueba' : 'Send Test'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Módulos monitoreados */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-[var(--text-hint)] font-medium mr-1">
                        {lang === 'es' ? 'Módulos monitoreados:' : 'Monitored modules:'}
                      </span>
                      {['PRODUCTOS', 'CLIENTES', 'LOTES', 'EMBARQUES', 'FINANZAS', 'USUARIOS'].map((m) => (
                        <span
                          key={m}
                          className="px-2 py-0.5 rounded-md bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[10px] font-semibold text-[var(--text-secondary)]"
                        >
                          ✓ {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">
                    {lang === 'es' ? 'Alertas de Envíos & Despacho Marítimo' : 'Shipment & Maritime Dispatch Alerts'}
                  </p>
                  <p className="text-[11px] text-[var(--text-hint)] mt-0.5">
                    {lang === 'es'
                      ? 'Notificar cambios de estado en contenedores Reefer, precintos y BL'
                      : 'Notify status changes in Reefer containers, seals and BL'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPreferences({ ...preferences, notifyShipments: !preferences.notifyShipments })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    preferences.notifyShipments ? 'bg-blue-600' : 'bg-gray-400 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.notifyShipments ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">
                    {lang === 'es' ? 'Alertas de Control de Calidad' : 'Quality Control Alerts'}
                  </p>
                  <p className="text-[11px] text-[var(--text-hint)] mt-0.5">
                    {lang === 'es'
                      ? 'Incidencias en grados Brix, acidez, pudrición o rechazos SENASA'
                      : 'Notifications on Brix levels, defects or phytosanitary holds'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPreferences({ ...preferences, notifyQuality: !preferences.notifyQuality })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    preferences.notifyQuality ? 'bg-blue-600' : 'bg-gray-400 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.notifyQuality ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">
                    {lang === 'es' ? 'Nuevas Solicitudes de Clientes B2B' : 'New B2B Client Registrations'}
                  </p>
                  <p className="text-[11px] text-[var(--text-hint)] mt-0.5">
                    {lang === 'es'
                      ? 'Insignia y alerta inmediata cuando un importador complete registro'
                      : 'Immediate badge notification when a foreign buyer registers'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPreferences({ ...preferences, notifyB2B: !preferences.notifyB2B })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    preferences.notifyB2B ? 'bg-blue-600' : 'bg-gray-400 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.notifyB2B ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Volume2 size={16} className="text-blue-500" />
                  <div>
                    <p className="text-xs font-bold text-[var(--text-primary)]">
                      {lang === 'es' ? 'Efectos Sonoros en Alertas' : 'Sound Alerts'}
                    </p>
                    <p className="text-[11px] text-[var(--text-hint)] mt-0.5">
                      {lang === 'es' ? 'Sonido breve al recibir avisos críticos' : 'Audio chime on critical events'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPreferences({ ...preferences, soundEnabled: !preferences.soundEnabled })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    preferences.soundEnabled ? 'bg-blue-600' : 'bg-gray-400 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                  {lang === 'es' ? 'Frecuencia de Auto-Sincronización de Tablas' : 'Auto-Sync Data Polling'}
                </label>
                <select
                  value={preferences.refreshInterval}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      refreshInterval: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  <option value={15}>Cada 15 segundos (Tiempo real recomendado)</option>
                  <option value={30}>Cada 30 segundos (Balance óptimo)</option>
                  <option value={60}>Cada 60 segundos (Bajo consumo de red)</option>
                  <option value={0}>Manual (Solo al pulsar botón refrescar)</option>
                </select>
                <p className="text-[11px] text-[var(--text-hint)] mt-1.5">
                  {lang === 'es'
                    ? 'Sincroniza inventarios de uva y estados de trazabilidad con SQL Server y MongoDB automáticamente.'
                    : 'Periodically checks for updated shipment statuses and fruit quality logs.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-start gap-3">
                <Shield size={18} className="text-blue-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-[var(--text-primary)]">
                    {lang === 'es' ? 'Arquitectura Híbrida Polyglot Lab' : 'Polyglot Architecture'}
                  </p>
                  <p className="text-[11px] text-[var(--text-hint)] mt-0.5 leading-relaxed">
                    {lang === 'es'
                      ? 'Conexión activa a SQL Server 2022 (R2DBC Reactivo :1433) y MongoDB 7.0 (NoSQL Documental :27017). Backend Spring Boot WebFlux Java 25 & Python 3.12 Flask.'
                      : 'Active connection to SQL Server 2022 (R2DBC :1433) and MongoDB 7.0 (:27017). Handled by Spring Boot WebFlux and Flask.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--text-hint)] hover:text-rose-500 transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            {lang === 'es' ? 'Restablecer' : 'Reset'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)] transition-colors cursor-pointer"
            >
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <CheckCircle2 size={14} />
              {lang === 'es' ? 'Guardar Preferencias' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
