// =============================================================================
// SIDEBAR COLAPSABLE CON ICONOS — VISONS S.A.C. ADMIN DASHBOARD
// Expandido: icono + etiqueta | Colapsado: solo icono con tooltip
// =============================================================================

import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Package,
  Layers,
  Ship,
  DollarSign,
  Users,
  ChevronLeft,
  ChevronRight,
  Leaf,
  LogOut,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

interface NavItem {
  id: string;
  label: string;
  labelEn: string;
  icon: React.ReactNode;
  path: string;
  accent: string;    // color de acento para el ítem activo
  badge?: number;    // badge numérico (solicitudes pendientes, etc.)
}

interface SidebarProps {
  lang: 'es' | 'en';
  pendingCount?: number;
}

export default function Sidebar({ lang, pendingCount = 0 }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success(lang === 'es' ? 'Sesión cerrada correctamente' : 'Logged out successfully', {
      description: lang === 'es'
        ? 'Has salido del sistema de administración.'
        : 'You have signed out from the admin system.',
    });
    navigate('/login');
  };

  const NAV_ITEMS: NavItem[] = [
    {
      id: 'overview',
      label: 'Resumen Ejecutivo',
      labelEn: 'Executive Overview',
      icon: <LayoutDashboard size={20} />,
      path: '/',
      accent: '#10b981',
    },
    {
      id: 'clients',
      label: 'Clientes B2B',
      labelEn: 'B2B Clients',
      icon: <Building2 size={20} />,
      path: '/clientes',
      accent: '#3b82f6',
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      id: 'products',
      label: 'Productos & Proveedores',
      labelEn: 'Products & Suppliers',
      icon: <Package size={20} />,
      path: '/productos',
      accent: '#f59e0b',
    },
    {
      id: 'lots',
      label: 'Lotes & Calidad',
      labelEn: 'Lots & Quality',
      icon: <Layers size={20} />,
      path: '/lotes',
      accent: '#84cc16',
    },
    {
      id: 'shipments',
      label: 'Órdenes & Embarques',
      labelEn: 'Orders & Shipments',
      icon: <Ship size={20} />,
      path: '/embarques',
      accent: '#8b5cf6',
    },
    {
      id: 'finance',
      label: 'Finanzas & Facturación',
      labelEn: 'Finance & Billing',
      icon: <DollarSign size={20} />,
      path: '/finanzas',
      accent: '#059669',
    },
    {
      id: 'users',
      label: 'Usuarios & Auditoría',
      labelEn: 'Users & Audit',
      icon: <Users size={20} />,
      path: '/usuarios',
      accent: '#f43f5e',
    },
    {
      id: 'analytics',
      label: 'Dashboard Analítico',
      labelEn: 'Analytics Dashboard',
      icon: <BarChart3 size={20} />,
      path: '/analitica',
      accent: '#06b6d4',
    },
  ];


  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`
        relative flex flex-col h-screen bg-[var(--sidebar-bg)] border-r border-[var(--border-subtle)]
        transition-all duration-300 ease-in-out shrink-0
        ${collapsed ? 'w-[64px]' : 'w-[240px]'}
      `}
    >
      {/* ── Logo / Marca ── */}
      <div className={`flex items-center h-16 px-4 border-b border-[var(--border-subtle)] overflow-hidden`}>
        <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-500/30">
          <Leaf size={16} strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="ml-3 overflow-hidden whitespace-nowrap">
            <span className="text-sm font-black text-[var(--text-primary)] tracking-tight block leading-tight">
              VISONS
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              S.A.C.
            </span>
          </div>
        )}
      </div>

      {/* ── Navegación Principal ── */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden space-y-0.5 px-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <NavLink
              key={item.id}
              to={item.path}
              title={collapsed ? (lang === 'es' ? item.label : item.labelEn) : undefined}
              className={`
                group relative flex items-center gap-3 px-2.5 py-2.5 rounded-xl
                transition-all duration-150 cursor-pointer select-none
                ${active
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-[var(--text-hint)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              {/* Indicador de ítem activo */}
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                  style={{ backgroundColor: item.accent }}
                />
              )}

              {/* Ícono con color de acento si está activo */}
              <span
                className={`shrink-0 transition-colors ${active ? '' : 'group-hover:text-[var(--text-primary)]'}`}
                style={active ? { color: item.accent } : undefined}
              >
                {item.icon}
              </span>

              {/* Etiqueta (visible solo expandido) */}
              {!collapsed && (
                <span className="text-[13px] leading-none flex-1 truncate">
                  {lang === 'es' ? item.label : item.labelEn}
                </span>
              )}

              {/* Badge de notificación */}
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`
                    shrink-0 min-w-[18px] h-[18px] px-1 rounded-full
                    flex items-center justify-center
                    text-[10px] font-black text-white bg-amber-500
                    ${collapsed ? 'absolute -top-1 -right-1' : ''}
                  `}
                >
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}

              {/* Tooltip solo cuando está colapsado */}
              {collapsed && (
                <div className="
                  absolute left-full ml-3 px-2.5 py-1.5 rounded-lg
                  bg-[var(--surface-card)] border border-[var(--border-subtle)]
                  text-[12px] font-semibold text-[var(--text-primary)]
                  shadow-lg whitespace-nowrap
                  opacity-0 pointer-events-none
                  group-hover:opacity-100 group-hover:pointer-events-auto
                  transition-opacity duration-150 z-50
                ">
                  {lang === 'es' ? item.label : item.labelEn}
                  {item.badge ? (
                    <span className="ml-1.5 px-1 rounded-full bg-amber-500 text-white text-[9px]">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Sección de Usuario & Acciones Inferiores ── */}
      <div className="p-2 border-t border-[var(--border-subtle)] space-y-1">
        {/* Info de Usuario (solo cuando expandido) */}
        {!collapsed && user && (
          <div className="flex items-center gap-2.5 px-2.5 py-2 mb-1 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-lg object-cover border border-[var(--border-subtle)] shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
                {(user.name || 'A').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xs font-bold text-[var(--text-primary)] truncate leading-tight">
                {user.name}
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider truncate">
                {user.role}
              </p>
            </div>
          </div>
        )}

        {/* Botón Salir / Cerrar Sesión */}
        <button
          onClick={handleLogout}
          title={collapsed ? (lang === 'es' ? 'Cerrar sesión' : 'Log out') : undefined}
          className={`
            group relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl
            text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600
            border border-rose-500/20 hover:border-rose-600
            shadow-sm hover:shadow-md hover:shadow-rose-600/20
            transition-all duration-150 cursor-pointer font-bold text-xs select-none
            ${collapsed ? 'justify-center p-2.5' : ''}
          `}
        >
          <LogOut size={16} className="shrink-0 transition-transform duration-150 group-hover:-translate-x-0.5" />
          {!collapsed && (
            <span className="truncate">
              {lang === 'es' ? 'Cerrar sesión' : 'Log out'}
            </span>
          )}

          {/* Tooltip solo colapsado */}
          {collapsed && (
            <div className="
              absolute left-full ml-3 px-2.5 py-1.5 rounded-lg
              bg-[var(--surface-card)] border border-rose-500/30
              text-[12px] font-bold text-rose-400
              shadow-xl whitespace-nowrap
              opacity-0 pointer-events-none
              group-hover:opacity-100 group-hover:pointer-events-auto
              transition-opacity duration-150 z-50
            ">
              {lang === 'es' ? 'Cerrar sesión' : 'Log out'}
            </div>
          )}
        </button>

        {/* Botón Colapsar / Expandir */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? (lang === 'es' ? 'Expandir menú' : 'Expand menu') : undefined}
          className={`
            group relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl
            text-[var(--text-hint)] hover:text-[var(--text-primary)]
            hover:bg-[var(--surface-subtle)] transition-all cursor-pointer select-none
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <span className="shrink-0 transition-transform duration-300">
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          </span>
          {!collapsed && (
            <span className="text-[12px] font-medium truncate">
              {lang === 'es' ? 'Colapsar menú' : 'Collapse menu'}
            </span>
          )}

          {/* Tooltip solo colapsado */}
          {collapsed && (
            <div className="
              absolute left-full ml-3 px-2.5 py-1.5 rounded-lg
              bg-[var(--surface-card)] border border-[var(--border-subtle)]
              text-[12px] font-semibold text-[var(--text-primary)]
              shadow-lg whitespace-nowrap
              opacity-0 pointer-events-none
              group-hover:opacity-100 group-hover:pointer-events-auto
              transition-opacity duration-150 z-50
            ">
              {lang === 'es' ? 'Expandir menú' : 'Expand menu'}
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
