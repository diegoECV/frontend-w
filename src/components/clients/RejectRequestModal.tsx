import { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface RejectRequestModalProps {
  isOpen: boolean;
  requestName: string;
  lang: 'es' | 'en';
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export const RejectRequestModal = ({
  isOpen,
  requestName,
  lang,
  onClose,
  onConfirm,
}: RejectRequestModalProps) => {
  const [reason, setReason] = useState(
    lang === 'es'
      ? 'La documentación fiscal no cumple con los requerimientos comerciales de Visons S.A.C.'
      : 'Submitted tax documentation does not meet Visons S.A.C. commercial criteria.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    setIsSubmitting(true);
    onConfirm(reason);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden p-6 text-left">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {lang === 'es' ? 'Rechazar Solicitud B2B' : 'Reject B2B Request'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">{requestName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-hint)] hover:text-[var(--text-primary)]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            {lang === 'es' ? 'Motivo del Rechazo' : 'Rejection Reason'}
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            {lang === 'es' ? 'Cancelar' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            {lang === 'es' ? 'Confirmar Rechazo' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
};
