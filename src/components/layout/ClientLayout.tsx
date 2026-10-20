// =============================================================================
// CLIENT LAYOUT — VISONS S.A.C.
// =============================================================================
// Layout independiente exclusivo para el Cliente B2B Internacional (Importador).
// Incluye barra lateral ClientSidebar, selector de moneda ($ USD / € EUR),
// soporte bilingüe y aislamiento total según RBAC.
// =============================================================================

import { useState } from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';
import ClientSidebar, { type ClientTabId } from './ClientSidebar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import {
  Sun,
  Moon,
  Globe,
  Building2,
  Ship,
} from 'lucide-react';

export default function ClientLayout() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [currency, setCurrency] = useState<'USD' | 'EUR'>('USD');
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab activo sincronizado con URL (?tab=...)
  const activeTab = (searchParams.get('tab') as ClientTabId) || 'tracking';

  const handleSelectTab = (tab: ClientTabId) => {
    setSearchParams({ tab });
  };

  const toggleLang = () => setLang((prev) => (prev === 'es' ? 'en' : 'es'));

  // Título dinámico para el Topbar
  const TAB_TITLES: Record<ClientTabId, { es: string; en: string }> = {
    tracking: { es: 'Live Tracking de Embarques & Altamar', en: 'Live Ocean Shipment Tracking' },
    catalog: { es: 'Catálogo de Frutas Frescas & Cotizador', en: 'Fresh Fruit Catalog & RFQ' },
    'cold-chain': { es: 'Monitoreo de Cadena de Frío en Tránsito', en: 'In-Transit Cold Chain Telemetry' },
    documents: { es: 'Centro de Documentación Aduanera (Doc Hub)', en: 'Customs & Shipping Documentation' },
    invoices: { es: 'Facturación & Estado de Cuenta Comercial', en: 'Invoicing & Commercial Statement' },
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors">
      {/* ── BARRA LATERAL EXCLUSIVA DEL CLIENTE (CLIENT SIDEBAR) ── */}
      <ClientSidebar
        lang={lang}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* ── COLUMNA DERECHA: TOPBAR + CONTENIDO B2B ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar B2B Internacional */}
        <header className="h-16 px-6 border-b border-[var(--border-subtle)] bg-[var(--surface-card)] flex items-center justify-between gap-4 shrink-0 shadow-sm">
          {/* Módulo Actual & Identificación B2B */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Ship size={18} />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-[var(--text-primary)] truncate">
                {TAB_TITLES[activeTab]?.[lang] || 'Portal B2B Internacional'}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {user?.company?.companyName || 'Importador Acreditado'}
                </span>
                <span>•</span>
                <span>{user?.company?.country ? `${user.company.country}` : 'Comercio Exterior'}</span>
              </div>
            </div>
          </div>

          {/* Acciones de Cabecera (Moneda, Idioma, Tema, Perfil) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Selector de Moneda USD / EUR */}
            <div className="flex items-center p-0.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-hover)]">
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currency === 'USD'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                $ USD
              </button>
              <button
                type="button"
                onClick={() => setCurrency('EUR')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currency === 'EUR'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                € EUR
              </button>
            </div>

            {/* Selector de Idioma */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-hover)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
              title="Cambiar idioma"
            >
              <Globe size={14} />
              <span>{lang.toUpperCase()}</span>
            </button>

            {/* Selector de Tema */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
            >
              {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-600" />}
            </button>

            {/* Perfil de Empresa */}
            <div className="flex items-center gap-2 pl-2 border-l border-[var(--border-subtle)]">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                <Building2 size={16} />
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-[var(--text-primary)] leading-tight truncate max-w-[130px]">
                  {user?.company?.companyName || user?.name || 'Cliente B2B'}
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold leading-tight">
                  Importador
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Área de Contenido Principal con scroll fluido */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet context={{ lang, currency, setCurrency, activeTab, onSelectTab: handleSelectTab }} />
        </main>
      </div>
    </div>
  );
}
