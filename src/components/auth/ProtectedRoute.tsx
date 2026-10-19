// =============================================================================
// RUTA PROTEGIDA CON VALIDACIÓN DE ROLES (RBAC) — VISONS S.A.C.
// =============================================================================

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types/auth';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[var(--surface-card)] p-10 rounded-3xl max-w-lg border border-red-500/30 shadow-xl space-y-6"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <ShieldAlert size={36} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Acceso Restringido</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Tu rol actual (<strong className="text-red-500 font-bold">{user.role}</strong>) no tiene los permisos suficientes para acceder a este panel.
            </p>
          </div>
          <div className="pt-2">
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-500/20 transition-all"
            >
              <ArrowLeft size={18} />
              Volver a mi panel asignado
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};
