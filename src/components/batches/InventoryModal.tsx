import { useState, useEffect } from 'react';
import { X, Check, Loader2, Package } from 'lucide-react';
import type { InventoryBatch } from '../../types/batch';
import type { Product } from '../../types/product';
import type { Provider } from '../../types/provider';

interface InventoryModalProps {
  isOpen: boolean;
  inventoryItem?: InventoryBatch | null;
  products: Product[];
  providers: Provider[];
  lang: 'es' | 'en';
  onClose: () => void;
  onSubmit: (item: Partial<InventoryBatch>) => Promise<void>;
}

export const InventoryModal = ({
  isOpen,
  inventoryItem,
  products,
  providers,
  lang,
  onClose,
  onSubmit,
}: InventoryModalProps) => {
  const isEditing = Boolean(inventoryItem?.id);

  const [productId, setProductId] = useState('');
  const [providerId, setProviderId] = useState('');
  const [batchId, setBatchId] = useState<number | string>(1);
  const [fieldName, setFieldName] = useState('');
  const [quantity, setQuantity] = useState<number | string>(1000);
  const [expirationDate, setExpirationDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (inventoryItem) {
        setProductId(inventoryItem.productId || products[0]?.code || products[0]?.id || '');
        setProviderId(inventoryItem.providerId || providers[0]?.documentNumber || providers[0]?.id || '');
        setBatchId(inventoryItem.batchId || 1);
        setFieldName(inventoryItem.fieldName || '');
        setQuantity(inventoryItem.quantity || 1000);
        setExpirationDate(inventoryItem.expirationDate || '');
      } else {
        setProductId(products[0]?.code || products[0]?.id || 'PROD-001');
        setProviderId(providers[0]?.documentNumber || providers[0]?.id || 'RUC001');
        setBatchId(1);
        setFieldName('Almacén Frío Central');
        setQuantity(2500);
        setExpirationDate(new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10));
      }
    }
  }, [isOpen, inventoryItem, products, providers]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        productId,
        providerId,
        batchId: Number(batchId),
        fieldName,
        quantity: Number(quantity),
        expirationDate: expirationDate || null,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl shadow-2xl p-6 text-left">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {isEditing
                  ? lang === 'es'
                    ? 'Actualizar Stock en Planta'
                    : 'Update Plant Inventory'
                  : lang === 'es'
                  ? 'Registrar Entrada a Inventario'
                  : 'Register Inventory Entry'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                {lang === 'es' ? 'Existencias en cámara frigorífica' : 'Cold storage inventory balance'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-hint)] hover:text-[var(--text-primary)]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              {lang === 'es' ? 'Producto' : 'Product'}
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-xs text-[var(--text-primary)]"
            >
              {products.map((p) => (
                <option key={p.id || p.code} value={p.code || p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              {lang === 'es' ? 'Cantidad (Cajas / Kg)' : 'Quantity (Boxes / Kg)'}
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] font-mono text-sm text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              {lang === 'es' ? 'Ubicación / Fundo' : 'Location / Storage Plot'}
            </label>
            <input
              type="text"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="Cámara Frigorífica #2"
              className="w-full px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-xs text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              {lang === 'es' ? 'Fecha de Caducidad' : 'Expiration Date'}
            </label>
            <input
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-xs text-[var(--text-primary)]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)]"
            >
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              <Check size={14} />
              <span>{lang === 'es' ? 'Guardar Stock' : 'Save Stock'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
