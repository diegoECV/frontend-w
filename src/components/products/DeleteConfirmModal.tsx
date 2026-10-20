import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName: string;
  isLoading?: boolean;
  isSoftDelete?: boolean;
  confirmButtonText?: string;
  lang: 'es' | 'en';
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  message,
  itemName,
  isLoading = false,
  isSoftDelete = true,
  confirmButtonText,
  lang,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden p-6 text-left">
        {/* Header Icon */}
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
            isSoftDelete
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
              : 'bg-red-500/10 border-red-500/20 text-red-500'
          }`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              {title}
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              {isSoftDelete
                ? lang === 'es'
                  ? 'Podrás restaurar este registro desde la Papelera'
                  : 'You can restore this record anytime from Trash'
                : lang === 'es'
                ? 'Esta acción es irreversible'
                : 'This action cannot be undone'}
            </p>
          </div>
        </div>

        {/* Message */}
        <div className="mb-6 space-y-2">
          <p className="text-sm text-[var(--text-secondary)]">
            {message}
          </p>
          <div className={`p-3 rounded-xl text-sm font-semibold break-all border ${
            isSoftDelete
              ? 'bg-amber-500/5 border-amber-500/20 text-amber-400'
              : 'bg-red-500/5 border-red-500/20 text-red-400'
          }`}>
            {itemName}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors disabled:opacity-50"
          >
            {lang === 'es' ? 'Cancelar' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg transition-all disabled:opacity-50 cursor-pointer ${
              isSoftDelete
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
            }`}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {confirmButtonText || (isSoftDelete
              ? lang === 'es' ? 'Mover a Papelera' : 'Move to Trash'
              : lang === 'es' ? 'Eliminar Definitivamente' : 'Delete Permanently')}
          </button>
        </div>
      </div>
    </div>
  );
};
