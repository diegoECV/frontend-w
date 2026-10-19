// =============================================================================
// DASHBOARD TRABAJADOR / PLANTA — VISONS S.A.C.
// =============================================================================
// Lienzo en blanco listo para construir desde cero según especificaciones.
// =============================================================================

import { useAuth } from '../../context/AuthContext';
import { Briefcase, Plus } from 'lucide-react';

export default function WorkerDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Limpio */}
      <section className="glass rounded-2xl p-6 border-l-4 border-l-blue-500 relative overflow-hidden transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
                <Briefcase size={13} />
                Panel de Planta & Operaciones
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)]">
              Hola, {user?.name || 'Operario de Planta'} 👷‍♂️
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5 font-normal">
              Lienzo limpio preparado para construir el Dashboard de Planta paso a paso.
            </p>
          </div>
        </div>
      </section>

      {/* Área de Trabajo Limpia */}
      <section className="p-16 border-2 border-dashed border-[var(--border-subtle)] rounded-3xl text-center bg-[var(--surface-card)]">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Plus size={28} />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)]">
            Espacio Listo para Construir
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Todos los paneles anteriores han sido borrados. Listo para definir las secciones operativas que necesitas.
          </p>
        </div>
      </section>
    </div>
  );
}
