import React, { useState } from 'react';
import {
  X,
  KeyRound,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import type { RevokedToken } from '../../types/user';

interface RevokeTokenModalProps {
  isOpen: boolean;
  isLoading: boolean;
  lang: 'es' | 'en';
  onSave: (tokenData: Partial<RevokedToken>) => Promise<boolean | void>;
  onClose: () => void;
}

const COMMON_REASONS = [
  'Revocación administrativa por cambio de cargo',
  'Cierre de sesión forzado por inactividad',
  'Alerta de seguridad / Sospecha de token filtrado',
  'Desvinculación o baja de colaborador',
  'Mantenimiento preventivo de seguridad RBAC',
];

export const RevokeTokenModal: React.FC<RevokeTokenModalProps> = ({
  isOpen,
  isLoading,
  lang,
  onSave,
  onClose,
}) => {
  const [signature, setSignature] = useState('');
  const [reason, setReason] = useState(COMMON_REASONS[0]);
  const [expiryHours, setExpiryHours] = useState('24');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!signature.trim()) {
      setError(
        lang === 'es'
          ? 'Debe ingresar la firma digital o identificador de token a revocar.'
          : 'Please enter token signature or session token to revoke.'
      );
      return;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + parseInt(expiryHours, 10) * 3600 * 1000);

    try {
      await onSave({
        tokenSignature: signature.trim(),
        revokedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        reason: reason.trim(),
      });
      setSignature('');
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : lang === 'es'
          ? 'Error al revocar token en base de datos'
          : 'Failed to revoke token in database';
      setError(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {lang === 'es' ? 'Revocar Sesión / Token JWT' : 'Revoke Session / JWT Token'}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {lang === 'es'
                  ? 'Invalida credenciales activas en MongoDB blacklist'
                  : 'Invalidate active JWT in MongoDB token blacklist'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left bg-[var(--surface-card)]">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2.5 text-xs">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              {lang === 'es' ? 'Firma del Token / Hash de Sesión' : 'Token Signature / Session Hash'} *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
                <KeyRound size={16} />
              </div>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
              />
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1">
              {lang === 'es'
                ? 'Puedes pegar la firma del encabezado o el hash SHA-256 de la sesión del usuario.'
                : 'Paste the JWT signature or SHA-256 session identifier.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              {lang === 'es' ? 'Motivo de Revocación' : 'Revocation Reason'}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all cursor-pointer"
            >
              {COMMON_REASONS.map((r, i) => (
                <option key={i} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              {lang === 'es' ? 'Vigencia de la Lista Negra (Horas)' : 'Blacklist Retention (Hours)'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
                <Clock size={16} />
              </div>
              <input
                type="number"
                min="1"
                max="720"
                value={expiryHours}
                onChange={(e) => setExpiryHours(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            {lang === 'es' ? 'Cancelar' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !signature.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
          >
            {isLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCircle2 size={14} />
            )}
            {lang === 'es' ? 'Revocar Inmediatamente' : 'Revoke Immediately'}
          </button>
        </div>
      </div>
    </div>
  );
};
