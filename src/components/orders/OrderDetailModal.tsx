import React, { useState } from 'react';
import { X, Plus, Trash2, Package, Loader2, AlertCircle } from 'lucide-react';
import type { Order, OrderDetail } from '../../types/order';
import type { Product } from '../../types/product';
import type { Batch } from '../../types/batch';
import { createOrderDetail, deleteOrderDetail } from '../../api/orderApi';
import { toast } from 'sonner';

interface OrderDetailModalProps {
  isOpen: boolean;
  order: Order | null;
  items: OrderDetail[];
  products: Product[];
  batches: Batch[];
  lang: 'es' | 'en';
  onRefresh: () => void;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  isOpen,
  order,
  items,
  products,
  batches,
  lang,
  onRefresh,
  onClose,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [newItem, setNewItem] = useState<Partial<OrderDetail>>({
    productId: products.length > 0 ? (products[0].id || products[0].code || '') : '',
    batchId: batches.length > 0 ? String(batches[0].batchId || '') : '',
    quantityKg: 20000,
    quantityBoxes: 2000,
    unitPrice: 2.85,
  });

  if (!isOpen || !order) return null;

  const orderItems = items.filter((it) => it.orderId === order.orderId);

  const totalKg = orderItems.reduce((acc, it) => acc + (it.quantityKg || 0), 0);
  const totalBoxes = orderItems.reduce((acc, it) => acc + (it.quantityBoxes || 0), 0);
  const totalFob = orderItems.reduce((acc, it) => acc + (it.totalPrice || (it.quantityKg * it.unitPrice) || 0), 0);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.productId || !newItem.quantityKg || !newItem.unitPrice) {
      toast.error(lang === 'es' ? 'Complete los campos obligatorios' : 'Fill required fields');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const payload: Partial<OrderDetail> = {
        orderId: order.orderId,
        productId: newItem.productId,
        batchId: newItem.batchId || undefined,
        quantityKg: Number(newItem.quantityKg),
        quantityBoxes: Number(newItem.quantityBoxes) || Math.round(Number(newItem.quantityKg) / 10),
        unitPrice: Number(newItem.unitPrice),
        totalPrice: Number(newItem.quantityKg) * Number(newItem.unitPrice),
      };

      await createOrderDetail(payload);
      toast.success(lang === 'es' ? 'Item añadido a la orden' : 'Item added to order');
      setIsAdding(false);
      onRefresh();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        (lang === 'es' ? 'Error al guardar el item' : 'Error saving item');
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (detailId: number) => {
    try {
      await deleteOrderDetail(detailId);
      toast.success(lang === 'es' ? 'Item eliminado de la orden' : 'Item removed from order');
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error(lang === 'es' ? 'No se pudo eliminar el item' : 'Could not remove item');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                {lang === 'es' ? 'Detalle de Orden:' : 'Order Items:'}
                <span className="text-violet-400 font-mono">{order.orderCode}</span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {lang === 'es' ? 'Productos, lotes de cosecha asignados y valorización FOB' : 'Products, harvest batches and FOB valuation'}
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
          {/* Summary KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
              <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                {lang === 'es' ? 'Kilos Netos' : 'Net Weight (Kg)'}
              </p>
              <p className="text-lg font-bold text-[var(--text-primary)] mt-0.5">
                {totalKg.toLocaleString()} kg
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
              <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                {lang === 'es' ? 'Cajas Totales' : 'Total Boxes'}
              </p>
              <p className="text-lg font-bold text-[var(--text-primary)] mt-0.5">
                {totalBoxes.toLocaleString()} cx
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/80">
                {lang === 'es' ? 'Total FOB' : 'Total FOB Value'}
              </p>
              <p className="text-lg font-bold mt-0.5">
                ${totalFob.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {order.currency || 'USD'}
              </p>
            </div>
          </div>

          {/* Server Error Banner */}
          {serverError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <span className="font-bold">{lang === 'es' ? 'Error al guardar item: ' : 'Error saving item: '}</span>
                {serverError}
              </div>
            </div>
          )}

          {/* Add Item Form */}
          {isAdding ? (
            <form onSubmit={handleAddItem} className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                  {lang === 'es' ? 'Agregar Producto / Lote a la Orden' : 'Add Product / Batch to Order'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  {lang === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase mb-1">
                    {lang === 'es' ? 'Producto *' : 'Product *'}
                  </label>
                  <select
                    value={newItem.productId}
                    onChange={(e) => setNewItem({ ...newItem, productId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-violet-500"
                  >
                    {products.map((p) => {
                      const val = p.id || p.code || '';
                      return (
                        <option key={val} value={val}>
                          {p.name} ({p.variety || 'Estándar'}) - {p.categoryId || 'Fruta'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase mb-1">
                    {lang === 'es' ? 'Lote de Cosecha & Packing' : 'Harvest Batch'}
                  </label>
                  <select
                    value={newItem.batchId || ''}
                    onChange={(e) => setNewItem({ ...newItem, batchId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-violet-500"
                  >
                    <option value="">{lang === 'es' ? '-- Sin lote asignado --' : '-- No batch --'}</option>
                    {batches.map((b) => (
                      <option key={b.batchId} value={String(b.batchId)}>
                        LOTE-{b.batchId} - {b.fieldName || 'Fundo'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase mb-1">
                    {lang === 'es' ? 'Cantidad (Kg) *' : 'Quantity (Kg) *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={newItem.quantityKg || ''}
                    onChange={(e) => setNewItem({ ...newItem, quantityKg: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase mb-1">
                    {lang === 'es' ? 'Cajas (Boxes)' : 'Boxes'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.quantityBoxes || ''}
                    onChange={(e) => setNewItem({ ...newItem, quantityBoxes: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase mb-1">
                    {lang === 'es' ? 'Precio Unitario FOB ($/kg) *' : 'Unit Price FOB ($/kg) *'}
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={newItem.unitPrice || ''}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  {lang === 'es' ? 'Subtotal Estimado: ' : 'Estimated Subtotal: '}
                  <span className="text-emerald-400 font-bold">
                    ${((Number(newItem.quantityKg) || 0) * (Number(newItem.unitPrice) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-lg shadow-violet-600/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                  {lang === 'es' ? 'Guardar Item' : 'Save Item'}
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-violet-500/30 hover:border-violet-500 text-violet-400 hover:bg-violet-500/5 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus size={15} />
              {lang === 'es' ? 'Añadir Línea de Producto a esta Orden' : 'Add Product Line Item to this Order'}
            </button>
          )}

          {/* Items Table */}
          <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-semibold border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="py-2.5 px-3">Producto</th>
                  <th className="py-2.5 px-3">Lote Cosecha</th>
                  <th className="py-2.5 px-3 text-right">Kilos (Kg)</th>
                  <th className="py-2.5 px-3 text-right">Cajas</th>
                  <th className="py-2.5 px-3 text-right">Precio/Kg</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                  <th className="py-2.5 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                {orderItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[var(--text-secondary)]">
                      {lang === 'es' ? 'No hay items registrados para esta orden.' : 'No items registered for this order.'}
                    </td>
                  </tr>
                ) : (
                  orderItems.map((it) => {
                    const prod = products.find((p) => (p.id || p.code) === it.productId);
                    const subtotal = it.totalPrice || ((it.quantityKg || 0) * (it.unitPrice || 0));
                    return (
                      <tr key={it.orderDetailId} className="hover:bg-[var(--bg-subtle)] transition-colors">
                        <td className="py-2.5 px-3 font-medium">
                          {prod ? prod.name : it.productId}
                        </td>
                        <td className="py-2.5 px-3 text-[var(--text-secondary)] font-mono">
                          {it.batchId || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold">
                          {it.quantityKg?.toLocaleString()} kg
                        </td>
                        <td className="py-2.5 px-3 text-right text-[var(--text-secondary)]">
                          {it.quantityBoxes?.toLocaleString() || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          ${it.unitPrice?.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                          ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(it.orderDetailId)}
                            className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title={lang === 'es' ? 'Eliminar item' : 'Remove item'}
                          >
                            <Trash2 size={14} />
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

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            {lang === 'es' ? 'Cerrar' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
