// =============================================================================
// WORKER SIDEBAR — VISONS S.A.C.
// =============================================================================
// Barra lateral colapsable exclusiva para el personal de Planta y Control de Calidad.
// Totalmente independiente del Sidebar de administración.
// =============================================================================

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  Boxes,
  Snowflake,
  Truck,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Leaf,
  HardHat,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

export type WorkerTabId = 'overview' | 'quality' | 'batches' | 'cold-chain' | 'packing-list';

interface WorkerSidebarProps {
  lang: 'es' | 'en';
  activeTab: WorkerTabId;
  onSelectTab: (tab: WorkerTabId) => void;
}

interface WorkerNavItem {
  id: WorkerTabId | 'analytics';
  label: string;
  labelEn: string;
  icon: React.ReactNode;
  accent: string;
  isExternalRoute?: boolean;
  path?: string;
}

export default function WorkerSidebar({ lang, activeTab, onSelectTab }: WorkerSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success(lang === 'es' ? 'Sesión de Planta Finalizada' : 'Plant Session Closed', {
      description: lang === 'es'
        ? 'Has cerrado sesión del terminal de operaciones.'
        : 'You have signed out from the operations terminal.',
    });
    navigate('/login');
  };

  const NAV_ITEMS: WorkerNavItem[] = [
    {
      id: 'overview',
      label: 'Resumen de Turno',
      labelEn: 'Shift Overview',
      icon: <LayoutDashboard size={19} />,
      accent: '#3b82f6',
    },
    {
      id: 'quality',
      label: 'Control de Calidad (QA)',
      labelEn: 'Quality Control (QA)',
      icon: <ShieldCheck size={19} />,
      accent: '#10b981',
    },
    {
      id: 'batches',
      label: 'Recepción & Lotes',
      labelEn: 'Batches & Reception',
      icon: <Boxes size={19} />,
      accent: '#f59e0b',
    },
    {
      id: 'cold-chain',
      label: 'Cadena de Frío',
      labelEn: 'Cold Chain & Sensors',
      icon: <Snowflake size={19} />,
      accent: '#06b6d4',
    },
    {
      id: 'packing-list',
      label: 'Pedidos & Packing',
      labelEn: 'Orders & Packing List',
      icon: <Truck size={19} />,
      accent: '#8b5cf6',
    },
    {
      id: 'analytics',
      label: 'Dashboard Analítico',
      labelEn: 'Analytics Dashboard',
      icon: <BarChart3 size={19} />,
      accent: '#0284c7',
      isExternalRoute: true,
      path: '/analitica',
    },
  ];

  return (
    <aside
      className={`
        relative flex flex-col h-screen bg-[var(--sidebar-bg)] border-r border-[var(--border-subtle)]
        transition-all duration-300 ease-in-out shrink-0 select-none
        ${collapsed ? 'w-[64px]' : 'w-[250px]'}
      `}
    >
      {/* ── Logo & Identificación de Planta ── */}
      <div className="flex items-center h-16 px-4 border-b border-[var(--border-subtle)] overflow-hidden">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/30">
          <Leaf size={18} strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="ml-3 overflow-hidden whitespace-nowrap min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-[var(--text-primary)] tracking-tight block leading-tight">
                VISONS <span className="text-blue-600 dark:text-blue-400">PLANTA</span>
              </span>
            </div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1">
              <HardHat size={10} />
              Operaciones & QA
            </span>
          </div>
        )}
      </div>

      {/* ── Navegación Operativa del Trabajador ── */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden space-y-1 px-2.5">
        {NAV_ITEMS.map((item) => {
          const isCurrentActive = item.isExternalRoute
            ? location.pathname === item.path
            : activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.isExternalRoute && item.path) {
                  navigate(item.path);
                } else {
                  if (location.pathname !== '/trabajador') {
                    navigate('/trabajador');
                  }
                  onSelectTab(item.id as WorkerTabId);
                }
              }}
              title={collapsed ? (lang === 'es' ? item.label : item.labelEn) : undefined}
              className={`
                group relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl
                transition-all duration-150 cursor-pointer text-left
                ${
                  isCurrentActive
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] font-medium'
                }
                ${collapsed ? 'justify-center px-0' : ''}
              `}
            >
              {/* Barra indicadora vertical de selección */}
              {isCurrentActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                  style={{ backgroundColor: item.accent }}
                />
              )}

              {/* Ícono con color de acento */}
              <span
                className={`shrink-0 transition-transform ${isCurrentActive ? 'scale-105' : 'group-hover:scale-105'}`}
                style={isCurrentActive ? { color: item.accent } : undefined}
              >
                {item.icon}
              </span>

              {/* Etiqueta */}
              {!collapsed && (
                <span className="text-xs leading-none flex-1 truncate">
                  {lang === 'es' ? item.label : item.labelEn}
                </span>
              )}

              {/* Tooltip flotante al estar colapsado */}
              {collapsed && (
                <div className="
                  absolute left-full ml-3 px-3 py-1.5 rounded-xl
                  bg-[var(--surface-card)] border border-[var(--border-subtle)]
                  text-xs font-bold text-[var(--text-primary)]
                  shadow-xl whitespace-nowrap
                  opacity-0 pointer-events-none
                  group-hover:opacity-100 group-hover:pointer-events-auto
                  transition-opacity duration-150 z-50
                ">
                  {lang === 'es' ? item.label : item.labelEn}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Perfil del Trabajador, Botón de Salir & Colapsador ── */}
      <div className="p-3 border-t border-[var(--border-subtle)] space-y-2 bg-[var(--sidebar-bg)]">
        {/* Tarjeta del Trabajador */}
        {!collapsed ? (
          <div className="p-2.5 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'OP'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[var(--text-primary)] truncate leading-tight">
                {user?.name || 'Carlos Ramírez'}
              </p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold leading-tight mt-0.5">
                Operario de Planta
              </p>
            </div>
          </div>
        ) : (
          <div
            className="w-9 h-9 mx-auto rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs"
            title={user?.name || 'Carlos Ramírez'}
          >
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'OP'}
          </div>
        )}

        {/* Botón Cerrar Sesión */}
        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center gap-2 px-3 py-2 rounded-xl
            text-xs font-bold text-rose-600 dark:text-rose-400
            hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer
            ${collapsed ? 'justify-center px-0' : ''}
          `}
          title={collapsed ? (lang === 'es' ? 'Cerrar Sesión' : 'Sign Out') : undefined}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span>{lang === 'es' ? 'Cerrar Sesión' : 'Sign Out'}</span>}
        </button>

        {/* Botón de Colapsar / Expandir */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`
            w-full flex items-center gap-2 px-3 py-1.5 rounded-xl
            text-[11px] font-semibold text-[var(--text-hint)]
            hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer
            ${collapsed ? 'justify-center px-0' : ''}
          `}
        >
          {collapsed ? (
            <ChevronRight size={15} />
          ) : (
            <>
              <ChevronLeft size={15} />
              <span>{lang === 'es' ? 'Colapsar menú' : 'Collapse'}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
