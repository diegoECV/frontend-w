// =============================================================================
// CLIENT SIDEBAR — VISONS S.A.C.
// =============================================================================
// Barra lateral colapsable exclusiva para Clientes e Importadores B2B Internacionales.
// Totalmente independiente del Sidebar del Administrador y del Trabajador.
// =============================================================================

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Ship,
  Package,
  Snowflake,
  FileText,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Leaf,
  Globe,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

export type ClientTabId = 'tracking' | 'catalog' | 'cold-chain' | 'documents' | 'invoices';

interface ClientSidebarProps {
  lang: 'es' | 'en';
  activeTab: ClientTabId;
  onSelectTab: (tab: ClientTabId) => void;
}

interface ClientNavItem {
  id: ClientTabId;
  label: string;
  labelEn: string;
  icon: React.ReactNode;
  accent: string;
}

export default function ClientSidebar({ lang, activeTab, onSelectTab }: ClientSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success(lang === 'es' ? 'Sesión de Cliente Cerrada' : 'Client Session Ended', {
      description: lang === 'es'
        ? 'Has salido del Portal B2B Internacional de Visons S.A.C.'
        : 'You have signed out from the Visons S.A.C. International B2B Portal.',
    });
    navigate('/login');
  };

  const NAV_ITEMS: ClientNavItem[] = [
    {
      id: 'tracking',
      label: 'Live Tracking & Embarques',
      labelEn: 'Live Shipment Tracking',
      icon: <Ship size={19} />,
      accent: '#0284c7',
    },
    {
      id: 'catalog',
      label: 'Catálogo de Frutas & Cotizar',
      labelEn: 'Fruit Catalog & Orders',
      icon: <Package size={19} />,
      accent: '#10b981',
    },
    {
      id: 'cold-chain',
      label: 'Cadena de Frío en Altamar',
      labelEn: 'Ocean Cold Chain (IoT)',
      icon: <Snowflake size={19} />,
      accent: '#06b6d4',
    },
    {
      id: 'documents',
      label: 'Documentos Aduaneros',
      labelEn: 'Customs & BL Docs',
      icon: <FileText size={19} />,
      accent: '#8b5cf6',
    },
    {
      id: 'invoices',
      label: 'Facturación & Estado de Cuenta',
      labelEn: 'Invoices & Statement',
      icon: <DollarSign size={19} />,
      accent: '#f59e0b',
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
      {/* ── Logo & Identificación del Portal B2B ── */}
      <div className="flex items-center h-16 px-4 border-b border-[var(--border-subtle)] overflow-hidden">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-500/30">
          <Leaf size={18} strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="ml-3 overflow-hidden whitespace-nowrap min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-[var(--text-primary)] tracking-tight block leading-tight">
                VISONS <span className="text-emerald-600 dark:text-emerald-400">GLOBAL</span>
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
              <Globe size={10} />
              Portal B2B Clientes
            </span>
          </div>
        )}
      </div>

      {/* ── Navegación del Cliente B2B ── */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden space-y-1 px-2.5">
        {NAV_ITEMS.map((item) => {
          const isCurrentActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (location.pathname !== '/cliente') {
                  navigate('/cliente');
                }
                onSelectTab(item.id);
              }}
              title={collapsed ? (lang === 'es' ? item.label : item.labelEn) : undefined}
              className={`
                group relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl
                transition-all duration-150 cursor-pointer text-left
                ${
                  isCurrentActive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] font-medium'
                }
                ${collapsed ? 'justify-center px-0' : ''}
              `}
            >
              {/* Barra indicadora vertical */}
              {isCurrentActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                  style={{ backgroundColor: item.accent }}
                />
              )}

              {/* Ícono */}
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

      {/* ── Perfil de la Empresa Importadora & Salir ── */}
      <div className="p-3 border-t border-[var(--border-subtle)] space-y-2 bg-[var(--sidebar-bg)]">
        {/* Tarjeta de la Empresa */}
        {!collapsed ? (
          <div className="p-2.5 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
              <Building2 size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[var(--text-primary)] truncate leading-tight">
                {user?.company?.companyName || user?.name || 'Global Fresh Imports'}
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold leading-tight mt-0.5">
                {user?.company?.country ? `${user.company.country} 🌐` : 'Cliente B2B'}
              </p>
            </div>
          </div>
        ) : (
          <div
            className="w-9 h-9 mx-auto rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs"
            title={user?.company?.companyName || 'Cliente B2B'}
          >
            <Building2 size={16} />
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
