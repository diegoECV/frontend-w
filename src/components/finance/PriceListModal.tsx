import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Tag, Loader2, AlertCircle, RefreshCw, Calendar } from 'lucide-react';
import type { PriceList, PriceItem } from '../../types/finance';
import type { Product } from '../../types/product';

interface PriceListModalProps {
  isOpen: boolean;
  priceList: PriceList | null;
  products: Product[];
  isLoading: boolean;
  lang: 'es' | 'en';
  onSave: (listData: Partial<PriceList>) => Promise<boolean | void>;
  onClose: () => void;
}

export const PriceListModal: React.FC<PriceListModalProps> = ({
  isOpen,
  priceList,
  products,
  isLoading,
  lang,
  onSave,
  onClose,
}) => {
  const isEditing = Boolean(priceList);

  const [formData, setFormData] = useState<Partial<PriceList>>({
    name: '',
    currency: 'USD',
    validFrom: new Date().toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    items: [],
  });

  const [items, setItems] = useState<PriceItem[]>([]);
  const [newItem, setNewItem] = useState<PriceItem>({
    productId: products.length > 0 ? (products[0].id || products[0].code || '') : '',
    price: 3.2,
    minQuantity: 5000,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (priceList) {
      setFormData({
        name: priceList.name || '',
        currency: priceList.currency || 'USD',
        validFrom: priceList.validFrom ? priceList.validFrom.slice(0, 10) : new Date().toISOString().slice(0, 10),
        validUntil: priceList.validUntil ? priceList.validUntil.slice(0, 10) : '',
        items: priceList.items || [],
      });
      setItems(priceList.items || []);
    } else {
      setFormData({
        name: 'Tarifario Exportación Campaña 2026',
        currency: 'USD',
        validFrom: new Date().toISOString().slice(0, 10),
        validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        items: [],
      });
      setItems([
        { productId: products.length > 0 ? (products[0].id || products[0].code || '') : 'PROD-001', price: 2.85, minQuantity: 10000 },
      ]);
    }
    setErrors({});
    setServerError(null);
  }, [priceList, isOpen, products]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    if (!newItem.productId || newItem.price <= 0) return;
    setItems([...items, { ...newItem }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name?.trim()) {
      errs.name = lang === 'es' ? 'El nombre del tarifario es requerido' : 'Price list name is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setServerError(null);
    try {
      const payload: Partial<PriceList> = {
        ...formData,
        validFrom: formData.validFrom ? `${formData.validFrom}T00:00:00Z` : undefined,
        validUntil: formData.validUntil ? `${formData.validUntil}T23:59:59Z` : undefined,
        items,
      };

      const result = await onSave(payload);
      if (result === false) {
        setServerError(
          lang === 'es'
            ? 'Error al guardar la lista de precios. Datos conservados en el formulario.'
            : 'Error saving price list. Data preserved in form.'
        );
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        (lang === 'es' ? 'Error al guardar' : 'Error saving');
      setServerError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Tag size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {isEditing
                  ? lang === 'es' ? 'Editar Lista de Precios' : 'Edit Price List'
                  : lang === 'es' ? 'Nueva Lista de Precios / Tarifario B2B' : 'New B2B Price Agreement'}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {lang === 'es' ? 'Precios base FOB por temporada y volumen mínimo' : 'Baseline FOB prices per season and minimum volume'}
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

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-left bg-[var(--surface-card)]">
          {serverError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-semibold">{lang === 'es' ? 'Fallo en el guardado' : 'Saving Failed'}</p>
                <p className="text-xs opacity-90 mt-0.5">{serverError}</p>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shrink-0 cursor-pointer"
              >
                <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                {lang === 'es' ? 'Reintentar' : 'Retry'}
              </button>
            </div>
          )}

          {/* Name & Currency */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                {lang === 'es' ? 'Nombre del Tarifario / Temporada *' : 'Agreement / Season Name *'}
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Campaña Palta Hass Europa 2026"
                className={`w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border text-[var(--text-primary)] text-sm focus:outline-none transition-colors ${
                  errors.name ? 'border-red-500' : 'border-[var(--border-subtle)] focus:border-emerald-500'
                }`}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                {lang === 'es' ? 'Moneda' : 'Currency'}
              </label>
              <select
                value={formData.currency || 'USD'}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="PEN">PEN (S/)</option>
              </select>
            </div>
          </div>

          {/* Validity Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} /> {lang === 'es' ? 'Válido Desde' : 'Valid From'}
                </span>
              </label>
              <input
                type="date"
                value={formData.validFrom || ''}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} /> {lang === 'es' ? 'Válido Hasta' : 'Valid Until'}
                </span>
              </label>
              <input
                type="date"
                value={formData.validUntil || ''}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Price Items Box */}
          <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3">
            <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              {lang === 'es' ? 'Productos y Precios Acordados' : 'Products & Agreed Prices'}
            </h4>

            {/* Quick add product row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
              <div className="md:col-span-2">
                <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                  {lang === 'es' ? 'Producto' : 'Product'}
                </label>
                <select
                  value={newItem.productId}
                  onChange={(e) => setNewItem({ ...newItem, productId: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  {products.map((p) => {
                    const val = p.id || p.code || '';
                    return (
                      <option key={val} value={val}>
                        {p.name} ({p.variety || 'Estándar'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                  {lang === 'es' ? 'Precio FOB ($/kg)' : 'FOB Price ($/kg)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newItem.price || ''}
                  onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                <Plus size={14} />
                {lang === 'es' ? 'Añadir' : 'Add'}
              </button>
            </div>

            {/* Items list */}
            <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden mt-2">
              <table className="w-full text-xs text-left">
                <thead className="bg-[var(--bg-card)] text-[var(--text-secondary)] font-semibold border-b border-[var(--border-subtle)]">
                  <tr>
                    <th className="py-2 px-3">Producto</th>
                    <th className="py-2 px-3 text-right">Precio Unitario</th>
                    <th className="py-2 px-3 text-right">Mínimo (Kg)</th>
                    <th className="py-2 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-[var(--text-secondary)]">
                        {lang === 'es' ? 'Sin productos añadidos.' : 'No products added.'}
                      </td>
                    </tr>
                  ) : (
                    items.map((it, idx) => {
                      const prod = products.find((p) => (p.id || p.code) === it.productId);
                      return (
                        <tr key={idx} className="hover:bg-[var(--bg-card)]/50">
                          <td className="py-2 px-3 font-medium">{prod ? prod.name : it.productId}</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-400">
                            ${it.price?.toFixed(2)} {formData.currency}
                          </td>
                          <td className="py-2 px-3 text-right text-[var(--text-secondary)]">
                            {it.minQuantity?.toLocaleString() || '-'} kg
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-rose-400 hover:text-rose-300 rounded cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {lang === 'es' ? 'Cancelar' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isEditing
              ? lang === 'es' ? 'Actualizar Tarifario' : 'Update Price List'
              : lang === 'es' ? 'Guardar Tarifario' : 'Save Price List'}
          </button>
        </div>
      </div>
    </div>
  );
};
