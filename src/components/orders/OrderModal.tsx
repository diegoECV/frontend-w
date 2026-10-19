import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle, AlertTriangle, Loader2, RefreshCw, ShoppingCart, Calendar, Globe, DollarSign, Anchor } from 'lucide-react';
import type { Order } from '../../types/order';
import type { Client } from '../../types/client';

interface OrderModalProps {
  isOpen: boolean;
  order: Order | null;
  existingOrders: Order[];
  clients: Client[];
  isLoading: boolean;
  lang: 'es' | 'en';
  onSave: (orderData: Partial<Order>) => Promise<boolean | void>;
  onClose: () => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  order,
  existingOrders,
  clients,
  isLoading,
  lang,
  onSave,
  onClose,
}) => {
  const isEditing = Boolean(order);

  // Form State
  const [formData, setFormData] = useState<Partial<Order>>({
    orderCode: '',
    clientId: '',
    orderDate: new Date().toISOString().slice(0, 10),
    incoterm: 'FOB',
    currency: 'USD',
    paymentTerms: '30% Anticipo / 70% contra BL',
    destinationPort: 'Rotterdam (NLRTM)',
    estimatedShippingDate: '',
    status: 'PENDING',
    statusDescription: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Populate on open
  useEffect(() => {
    if (order) {
      setFormData({
        orderCode: order.orderCode || '',
        clientId: order.clientId || '',
        orderDate: order.orderDate ? order.orderDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
        incoterm: order.incoterm || 'FOB',
        currency: order.currency || 'USD',
        paymentTerms: order.paymentTerms || '30% Anticipo / 70% contra BL',
        destinationPort: order.destinationPort || 'Rotterdam (NLRTM)',
        estimatedShippingDate: order.estimatedShippingDate ? order.estimatedShippingDate.slice(0, 10) : '',
        status: order.status || 'PENDING',
        statusDescription: order.statusDescription || '',
      });
    } else {
      // Suggest automatic next order code like ORD-012
      const maxId = existingOrders.reduce((max, o) => Math.max(max, o.orderId || 0), 0);
      const nextNum = String(maxId + 1).padStart(3, '0');
      setFormData({
        orderCode: `ORD-${nextNum}`,
        clientId: clients.length > 0 ? (clients[0].id || '') : '',
        orderDate: new Date().toISOString().slice(0, 10),
        incoterm: 'FOB',
        currency: 'USD',
        paymentTerms: '30% Anticipo / 70% contra BL',
        destinationPort: 'Rotterdam (NLRTM)',
        estimatedShippingDate: '',
        status: 'PENDING',
        statusDescription: '',
      });
    }
    setErrors({});
    setServerError(null);
  }, [order, isOpen, clients, existingOrders]);

  // Real-time Duplicate Detection
  const isDuplicateCode = useMemo(() => {
    if (!formData.orderCode) return false;
    const cleanCode = formData.orderCode.trim().toLowerCase();
    return existingOrders.some((o) => {
      if (isEditing && o.orderId === order?.orderId) return false;
      return o.orderCode?.trim().toLowerCase() === cleanCode;
    });
  }, [formData.orderCode, existingOrders, isEditing, order]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.orderCode?.trim()) {
      errs.orderCode = lang === 'es' ? 'El código de orden es requerido' : 'Order code is required';
    } else if (isDuplicateCode) {
      errs.orderCode = lang === 'es' ? 'Ya existe una orden con este código' : 'An order with this code already exists';
    }

    if (!formData.clientId) {
      errs.clientId = lang === 'es' ? 'Debe seleccionar un cliente B2B' : 'You must select a B2B client';
    }

    if (!formData.orderDate) {
      errs.orderDate = lang === 'es' ? 'La fecha de orden es requerida' : 'Order date is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setServerError(null);
    try {
      const result = await onSave(formData);
      // If result is specifically false, consider it failed
      if (result === false) {
        setServerError(
          lang === 'es'
            ? 'Error al procesar la solicitud en el servidor. Tus datos fueron conservados, por favor intenta nuevamente.'
            : 'Error processing request on the server. Your data was preserved, please try again.'
        );
      }
    } catch (err: unknown) {
      const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        (lang === 'es' ? 'Error al guardar la orden en el servidor' : 'Error saving order on the server');
      setServerError(errMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {isEditing
                  ? lang === 'es' ? 'Editar Orden Comercial' : 'Edit Commercial Order'
                  : lang === 'es' ? 'Nueva Orden Comercial de Exportación' : 'New Export Commercial Order'}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {lang === 'es'
                  ? 'Contrato de venta B2B, Incoterm y programación de despacho'
                  : 'B2B sales contract, Incoterm and dispatch scheduling'}
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

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-left bg-[var(--surface-card)]">
          {/* Server Error Banner ("si falla el formulario") */}
          {serverError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-start gap-3 animate-shake">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-semibold">{lang === 'es' ? 'Fallo en el guardado' : 'Saving Failed'}</p>
                <p className="text-xs opacity-90 mt-0.5">{serverError}</p>
                <p className="text-xs text-rose-300 mt-1 font-medium">
                  {lang === 'es'
                    ? '💡 No se han perdido tus cambios. Puedes corregir los campos o pulsar reintentar.'
                    : '💡 Your changes were kept. You can fix fields or click retry.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shrink-0 cursor-pointer transition-colors"
              >
                <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                {lang === 'es' ? 'Reintentar' : 'Retry'}
              </button>
            </div>
          )}

          {/* Real-time Duplicate Warning Alarm */}
          {isDuplicateCode && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-3">
              <AlertTriangle size={18} className="shrink-0 animate-bounce" />
              <div className="text-xs">
                <span className="font-bold">
                  {lang === 'es' ? 'Alarma de Duplicidad: ' : 'Duplicate Warning: '}
                </span>
                {lang === 'es'
                  ? `El código "${formData.orderCode}" ya pertenece a otra orden comercial registrada.`
                  : `Code "${formData.orderCode}" already belongs to an existing commercial order.`}
              </div>
            </div>
          )}

          {/* Row 1: Order Code & Client */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                {lang === 'es' ? 'Código de Orden *' : 'Order Code *'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.orderCode || ''}
                  onChange={(e) => setFormData({ ...formData, orderCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. ORD-011"
                  className={`w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border text-[var(--text-primary)] text-sm focus:outline-none transition-colors ${
                    errors.orderCode || isDuplicateCode
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-[var(--border-subtle)] focus:border-violet-500'
                  }`}
                />
              </div>
              {errors.orderCode && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.orderCode}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                {lang === 'es' ? 'Cliente B2B *' : 'B2B Client *'}
              </label>
              <select
                value={formData.clientId || ''}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border text-[var(--text-primary)] text-sm focus:outline-none transition-colors ${
                  errors.clientId ? 'border-red-500' : 'border-[var(--border-subtle)] focus:border-violet-500'
                }`}
              >
                <option value="">{lang === 'es' ? '-- Seleccione Cliente --' : '-- Select Client --'}</option>
                {clients.map((c) => {
                  const val = c.id || '';
                  return (
                    <option key={val} value={val}>
                      {c.companyName} ({c.country || 'Global'}) - {c.documentNumber || val}
                    </option>
                  );
                })}
              </select>
              {errors.clientId && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.clientId}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Order Date & Incoterm */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} /> {lang === 'es' ? 'Fecha de Orden *' : 'Order Date *'}
                </span>
              </label>
              <input
                type="date"
                value={formData.orderDate || ''}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Globe size={13} /> Incoterm 2020
                </span>
              </label>
              <select
                value={formData.incoterm || 'FOB'}
                onChange={(e) => setFormData({ ...formData, incoterm: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-violet-500 transition-colors"
              >
                <option value="FOB">FOB (Free On Board - Puerto Origen)</option>
                <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                <option value="CFR">CFR (Cost & Freight)</option>
                <option value="EXW">EXW (Ex Works - Planta Visons)</option>
                <option value="FCA">FCA (Free Carrier)</option>
                <option value="DDP">DDP (Delivered Duty Paid)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <DollarSign size={13} /> {lang === 'es' ? 'Moneda' : 'Currency'}
                </span>
              </label>
              <select
                value={formData.currency || 'USD'}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-violet-500 transition-colors"
              >
                <option value="USD">USD ($ - Dólar Estadounidense)</option>
                <option value="EUR">EUR (€ - Euro Unión Europea)</option>
                <option value="GBP">GBP (£ - Libra Esterlina)</option>
                <option value="PEN">PEN (S/ - Sol Peruano)</option>
              </select>
            </div>
          </div>

          {/* Row 3: Destination Port & Estimated Shipping Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Anchor size={13} /> {lang === 'es' ? 'Puerto de Destino' : 'Destination Port'}
                </span>
              </label>
              <input
                type="text"
                value={formData.destinationPort || ''}
                onChange={(e) => setFormData({ ...formData, destinationPort: e.target.value })}
                placeholder="e.g. Rotterdam (NLRTM), Philadelphia (USPHL)"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} /> {lang === 'es' ? 'Fecha Estimada Embarque (ETD)' : 'Estimated Shipping (ETD)'}
                </span>
              </label>
              <input
                type="date"
                value={formData.estimatedShippingDate || ''}
                onChange={(e) => setFormData({ ...formData, estimatedShippingDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          {/* Row 4: Payment Terms & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                {lang === 'es' ? 'Condiciones de Pago' : 'Payment Terms'}
              </label>
              <input
                type="text"
                value={formData.paymentTerms || ''}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                placeholder="e.g. 30% Anticipo / 70% contra BL"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                {lang === 'es' ? 'Estado Comercial' : 'Commercial Status'}
              </label>
              <select
                value={formData.status || 'PENDING'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-medium focus:outline-none focus:border-violet-500 transition-colors"
              >
                <option value="PENDING">🟡 PENDING (Pendiente de Aprobación)</option>
                <option value="CONFIRMED">🔵 CONFIRMED (Confirmada / Contrato Firmado)</option>
                <option value="PROCESSING">🟣 PROCESSING (En Packing & Preparación)</option>
                <option value="SHIPPED">🚢 SHIPPED (Embarcada / En Navegación)</option>
                <option value="DELIVERED">🟢 DELIVERED (Entregada en Puerto Destino)</option>
                <option value="COMPLETED">✅ COMPLETED (Liquidada & Cerrada)</option>
                <option value="CANCELLED">🔴 CANCELLED (Cancelada)</option>
              </select>
            </div>
          </div>

          {/* Row 5: Notes / Status Description */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              {lang === 'es' ? 'Observaciones / Especificaciones' : 'Notes / Specifications'}
            </label>
            <textarea
              rows={2}
              value={formData.statusDescription || ''}
              onChange={(e) => setFormData({ ...formData, statusDescription: e.target.value })}
              placeholder={
                lang === 'es'
                  ? 'Requerimientos de empaque, calibres especiales o instrucciones de naviera...'
                  : 'Packaging requirements, specific sizes or shipping line instructions...'
              }
              className="w-full px-4 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none"
            />
          </div>
        </form>

        {/* Footer Actions */}
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
            disabled={isLoading || isDuplicateCode}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-lg shadow-violet-600/25 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isEditing
              ? lang === 'es' ? 'Actualizar Orden' : 'Update Order'
              : lang === 'es' ? 'Crear Orden Comercial' : 'Create Commercial Order'}
          </button>
        </div>
      </div>
    </div>
  );
};
