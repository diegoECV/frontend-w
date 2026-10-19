// =============================================================================
// TOPBAR CORPORATIVA — VISONS S.A.C. ADMIN DASHBOARD
// Búsqueda, Selector de Idioma, Tema, Notificaciones, Perfil de Usuario
// =============================================================================

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Sun,
  Moon,
  Bell,
  LogOut,
  User,
  Settings,
  Shield,
  ChevronDown,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';

interface TopbarProps {
  lang: 'es' | 'en';
  onToggleLang: () => void;
}

export default function Topbar({ lang, onToggleLang }: TopbarProps) {
  const navigate = useNavigate();
  const { user, logout, pendingRequestsCount } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Cierra los dropdowns al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success(lang === 'es' ? 'Sesión cerrada' : 'Logged out', {
      description: lang === 'es'
        ? 'Has cerrado sesión correctamente.'
        : 'You have been logged out successfully.',
    });
    navigate('/login');
  };

  const totalNotifications = pendingRequestsCount;

  return (
    <header className="h-16 px-5 flex items-center justify-between bg-[var(--header-bg)] border-b border-[var(--border-subtle)] shrink-0 z-40">
      
      {/* ── Lado Izquierdo: Título / Breadcrumb ── */}
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold text-[var(--text-primary)] hidden sm:block">
          {lang === 'es' ? 'Panel de Administración' : 'Administration Panel'}
        </h2>
        <span className="hidden sm:inline text-[var(--text-hint)] text-xs font-medium px-2 py-0.5 rounded-md bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
          {lang === 'es' ? 'Administrador' : 'Administrator'}
        </span>
      </div>

      {/* ── Lado Derecho: Controles ── */}
      <div className="flex items-center gap-2">

        {/* Selector de Idioma ES / EN */}
        <button
          onClick={onToggleLang}
          title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold tracking-wider transition-all cursor-pointer"
        >
          <span className={lang === 'es' ? 'text-emerald-500' : 'text-[var(--text-hint)]'}>ES</span>
          <span className="text-[var(--text-hint)]">/</span>
          <span className={lang === 'en' ? 'text-emerald-500' : 'text-[var(--text-hint)]'}>EN</span>
        </button>

        {/* Toggle Tema Claro / Oscuro */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark'
            ? (lang === 'es' ? 'Modo claro' : 'Light mode')
            : (lang === 'es' ? 'Modo oscuro' : 'Dark mode')
          }
          className="p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
        >
          {theme === 'dark'
            ? <Sun size={17} className="text-amber-400" />
            : <Moon size={17} className="text-slate-500" />
          }
        </button>

        {/* Campana de Notificaciones */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
          >
            <Bell size={17} />
            {totalNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                {totalNotifications > 9 ? '9+' : totalNotifications}
              </span>
            )}
          </button>

          {/* Dropdown de Notificaciones */}
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xl shadow-black/10 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  {lang === 'es' ? 'Notificaciones' : 'Notifications'}
                </span>
                {totalNotifications > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                    {totalNotifications}
                  </span>
                )}
              </div>

              {pendingRequestsCount > 0 ? (
                <div className="p-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 hover:bg-amber-500/12 transition-colors cursor-pointer"
                    onClick={() => { navigate('/clientes'); setNotifOpen(false); }}>
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)]">
                        {lang === 'es'
                          ? `${pendingRequestsCount} solicitud${pendingRequestsCount > 1 ? 'es' : ''} B2B pendiente${pendingRequestsCount > 1 ? 's' : ''}`
                          : `${pendingRequestsCount} pending B2B request${pendingRequestsCount > 1 ? 's' : ''}`
                        }
                      </p>
                      <p className="text-[11px] text-[var(--text-hint)] mt-0.5">
                        {lang === 'es'
                          ? 'Requieren revisión y aprobación'
                          : 'Require your review and approval'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-xs text-[var(--text-hint)]">
                  {lang === 'es' ? 'No hay notificaciones nuevas' : 'No new notifications'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Perfil de Usuario con Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
          >
            {/* Avatar */}
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-lg object-cover border border-[var(--border-subtle)]"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </div>
            )}

            {/* Nombre abreviado (solo en desktop) */}
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-[var(--text-primary)] leading-tight max-w-[100px] truncate">
                {user?.name?.split(' ')[0] || 'Admin'}
              </p>
              <p className="text-[10px] text-[var(--text-hint)] font-medium uppercase tracking-wider leading-tight">
                {user?.role || 'ADMIN'}
              </p>
            </div>

            <ChevronDown
              size={14}
              className={`text-[var(--text-hint)] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown del Perfil */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xl shadow-black/10 z-50 overflow-hidden py-1.5">
              
              {/* Info del usuario */}
              <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
                <p className="text-xs font-bold text-[var(--text-primary)] truncate">{user?.name}</p>
                <p className="text-[11px] text-[var(--text-hint)] truncate">{user?.email}</p>
              </div>

              {/* Opciones */}
              <div className="py-1.5 px-1.5 space-y-0.5">
                <button
                  onClick={() => { setDropdownOpen(false); toast.info(lang === 'es' ? 'Perfil próximamente' : 'Profile coming soon'); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] transition-all cursor-pointer text-left"
                >
                  <User size={15} className="text-[var(--text-hint)]" />
                  {lang === 'es' ? 'Mi Perfil' : 'My Profile'}
                </button>

                <button
                  onClick={() => { setDropdownOpen(false); toast.info(lang === 'es' ? 'Configuración próximamente' : 'Settings coming soon'); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] transition-all cursor-pointer text-left"
                >
                  <Settings size={15} className="text-[var(--text-hint)]" />
                  {lang === 'es' ? 'Configuración' : 'Settings'}
                </button>

                <button
                  onClick={() => { setDropdownOpen(false); toast.info(lang === 'es' ? 'Seguridad próximamente' : 'Security coming soon'); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] transition-all cursor-pointer text-left"
                >
                  <Shield size={15} className="text-[var(--text-hint)]" />
                  {lang === 'es' ? 'Seguridad' : 'Security'}
                </button>
              </div>

              {/* Separador + Cerrar Sesión */}
              <div className="px-1.5 pb-1.5 border-t border-[var(--border-subtle)] pt-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer text-left"
                >
                  <LogOut size={15} />
                  {lang === 'es' ? 'Cerrar Sesión' : 'Log Out'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
