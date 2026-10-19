import React from 'react';
import {
  X,
  ShieldAlert,
  Calendar,
  User as UserIcon,
  Globe,
  Database,
  Printer,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AuditLog } from '../../types/user';

interface AuditDetailModalProps {
  isOpen: boolean;
  log: AuditLog | null;
  lang: 'es' | 'en';
  onClose: () => void;
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({
  isOpen,
  log,
  lang,
  onClose,
}) => {
  if (!isOpen || !log) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(
      lang === 'es' ? `${label} copiado al portapapeles` : `${label} copied to clipboard`
    );
  };

  const formatJson = (raw?: string | null) => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return raw;
    }
  };

  const beforeJson = formatJson(log.changesBefore);
  const afterJson = formatJson(log.changesAfter);

  const getActionColor = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('CREATE') || act.includes('APPROVE')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    if (act.includes('UPDATE')) {
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
    if (act.includes('DELETE') || act.includes('REJECT')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
    if (act.includes('LOGIN') || act.includes('LOGOUT')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
    return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {lang === 'es' ? 'Detalle del Evento de Auditoría' : 'Audit Trail Event Details'}
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getActionColor(log.action)}`}>
                  {log.action}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                {lang === 'es'
                  ? `Registro inmutable de seguridad en AUDIT_LOGS #ID: ${log.id}`
                  : `Immutable security log in AUDIT_LOGS #ID: ${log.id}`}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-left">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                <Calendar size={13} className="text-rose-400" />
                {lang === 'es' ? 'Fecha & Hora' : 'Timestamp'}
              </div>
              <p className="text-xs font-mono font-semibold text-[var(--text-primary)]">
                {new Date(log.timestamp).toLocaleString()}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                <UserIcon size={13} className="text-blue-400" />
                {lang === 'es' ? 'Operador / Usuario' : 'Operator / User'}
              </div>
              <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                {log.username || log.userId || 'Sistema'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                <Database size={13} className="text-emerald-400" />
                {lang === 'es' ? 'Entidad / Recurso' : 'Resource Entity'}
              </div>
              <p className="text-xs font-mono font-bold text-emerald-400">
                {log.resource} {log.resourceId ? `(${log.resourceId})` : ''}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                <Globe size={13} className="text-purple-400" />
                {lang === 'es' ? 'Dirección IP' : 'Origin IP'}
              </div>
              <p className="text-xs font-mono text-[var(--text-primary)]">
                {log.ipAddress || '127.0.0.1 (Local)'}
              </p>
            </div>
          </div>

          {/* Side by side state diff */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center justify-between">
              <span>{lang === 'es' ? 'Trazabilidad de Cambios de Estado' : 'State Changes Diff'}</span>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    JSON.stringify({ before: log.changesBefore, after: log.changesAfter }, null, 2),
                    'Diff JSON'
                  )
                }
                className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
              >
                <Copy size={12} />
                {lang === 'es' ? 'Copiar Diff' : 'Copy Diff'}
              </button>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Before */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
                  <span className="text-rose-400">← {lang === 'es' ? 'Estado Previo' : 'Previous State'}</span>
                </div>
                <div className="h-48 overflow-y-auto rounded-lg bg-[var(--bg-card)] p-3 border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--text-secondary)] whitespace-pre-wrap">
                  {beforeJson || (
                    <span className="text-[var(--text-secondary)]/50 italic">
                      {lang === 'es' ? '(Sin registro previo / Objeto creado)' : '(No previous record / Newly created)'}
                    </span>
                  )}
                </div>
              </div>

              {/* After */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
                  <span className="text-emerald-400">→ {lang === 'es' ? 'Nuevo Estado Resultante' : 'Resulting State'}</span>
                </div>
                <div className="h-48 overflow-y-auto rounded-lg bg-[var(--bg-card)] p-3 border border-[var(--border-subtle)] font-mono text-[11px] text-emerald-400/90 whitespace-pre-wrap">
                  {afterJson || (
                    <span className="text-[var(--text-secondary)]/50 italic">
                      {lang === 'es' ? '(Objeto eliminado / Sin estado posterior)' : '(Object deleted / No resulting state)'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            {lang === 'es' ? 'Cerrar' : 'Close'}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] transition-all cursor-pointer"
          >
            <Printer size={14} />
            {lang === 'es' ? 'Imprimir Ficha de Auditoría' : 'Print Audit Sheet'}
          </button>
        </div>
      </div>
    </div>
  );
};
