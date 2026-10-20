// =============================================================================
// WORKER LAYOUT — VISONS S.A.C.
// =============================================================================
// Layout independiente con su propia barra lateral (WorkerSidebar) exclusiva de
// Planta y Control de Calidad, totalmente separada del administrador.
// =============================================================================

import { useState } from 'react';
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import WorkerSidebar, { type WorkerTabId } from './WorkerSidebar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import {
  Sun,
  Moon,
  Globe,
  BarChart3,
  HardHat,
} from 'lucide-react';

export default function WorkerLayout() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab activo sincronizado con URL (?tab=...)
  const activeTab = (searchParams.get('tab') as WorkerTabId) || 'overview';

  const handleSelectTab = (tab: WorkerTabId) => {
    setSearchParams({ tab });
  };

  const toggleLang = () => setLang((prev) => (prev === 'es' ? 'en' : 'es'));

  // Título dinámico para el Topbar
  const TAB_TITLES: Record<WorkerTabId, { es: string; en: string }> = {
    overview: { es: 'Resumen Operativo de Turno', en: 'Shift Operations Overview' },
    quality: { es: 'Control de Calidad & Muestreo Fitosanitario', en: 'Quality Control & Phytosanitary Sampling' },
    batches: { es: 'Recepción de Materia Prima & Lotes de Campo', en: 'Raw Material Reception & Field Batches' },
    'cold-chain': { es: 'Monitoreo de Cadena de Frío & Sensores', en: 'Cold Chain Monitoring & Sensors' },
    'packing-list': { es: 'Pedidos de Despacho & Packing List', en: 'Dispatch Orders & Packing List' },
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors">
      {/* ── BARRA LATERAL PROPIA DEL TRABAJADOR (WORKER SIDEBAR) ── */}
      <WorkerSidebar
        lang={lang}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* ── COLUMNA DERECHA: TOPBAR + CONTENIDO ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar del Trabajador */}
        <header className="h-16 px-6 border-b border-[var(--border-subtle)] bg-[var(--surface-card)] flex items-center justify-between gap-4 shrink-0 shadow-sm">
          {/* Módulo Actual & Turno */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
              <HardHat size={18} />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-[var(--text-primary)] truncate">
                {TAB_TITLES[activeTab]?.[lang] || 'Terminal Operativo de Planta'}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Turno Mañana (07:00 - 15:30)
                </span>
                <span>•</span>
                <span>Visons S.A.C.</span>
              </div>
            </div>
          </div>

          {/* Acciones de Cabecera */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Acceso Directo al Dashboard Analítico */}
            <button
              onClick={() => navigate('/analitica')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30 transition-all cursor-pointer shadow-sm"
              title="Ir al Dashboard Analítico"
            >
              <BarChart3 size={15} />
              <span className="hidden sm:inline">Dashboard Analítico</span>
            </button>

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

            {/* Perfil del Operario */}
            <div className="flex items-center gap-2 pl-2 border-l border-[var(--border-subtle)]">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'OP'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-[var(--text-primary)] leading-tight truncate max-w-[130px]">
                  {user?.name || 'Carlos Ramírez'}
                </p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold leading-tight">
                  Operario Planta
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Área de Contenido Principal con scroll fluido */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet context={{ lang, activeTab, onSelectTab: handleSelectTab }} />
        </main>
      </div>
    </div>
  );
}
