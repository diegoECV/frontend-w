// =============================================================================
// MAIN LAYOUT — VISONS S.A.C. ADMIN DASHBOARD
// Sidebar colapsable + Topbar + Área de Contenido
// =============================================================================

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';

export default function MainLayout() {
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const { pendingRequestsCount } = useAuth();

  const toggleLang = () => setLang((prev) => (prev === 'es' ? 'en' : 'es'));

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors">

      {/* ── Sidebar Colapsable ── */}
      <Sidebar lang={lang} pendingCount={pendingRequestsCount} />

      {/* ── Columna Derecha: Topbar + Contenido ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        
        {/* Topbar fija */}
        <Topbar lang={lang} onToggleLang={toggleLang} />

        {/* Área de Contenido Principal con scroll */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet context={{ lang }} />
        </main>
      </div>
    </div>
  );
}
