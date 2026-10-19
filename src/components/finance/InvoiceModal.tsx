import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle, AlertTriangle, Loader2, RefreshCw, DollarSign, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import type { Invoice } from '../../types/finance';
import type { Order } from '../../types/order';

interface InvoiceModalProps {
  isOpen: boolean;
  invoice: Invoice | null;
  existingInvoices: Invoice[];
  orders: Order[];
  isLoading: boolean;
  lang: 'es' | 'en';
  onSave: (invoiceData: Partial<Invoice>) => Promise<boolean | void>;
  onClose: () => void;
}

const DOCUMENT_TYPES = [
  { value: 'FACTURA_EXPORTACION', labelEs: 'Factura Electrónica de Exportación (0% IGV)', labelEn: 'Export Electronic Invoice (0% VAT)' },
  { value: 'FACTURA_ELECTRONICA', labelEs: 'Factura Comercial Gravada (18% IGV)', labelEn: 'Commercial Taxed Invoice (18% VAT)' },
  { value: 'BOLETA_VENTA', labelEs: 'Boleta de Venta Electrónica', labelEn: 'Electronic Sales Receipt' },
  { value: 'NOTA_CREDITO', labelEs: 'Nota de Crédito Electrónica', labelEn: 'Electronic Credit Note' },
];

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  invoice,
  existingInvoices,
  orders,
  isLoading,
  lang,
  onSave,
  onClose,
}) => {
  const isEditing = Boolean(invoice);

  const [formData, setFormData] = useState<Partial<Invoice>>({
    orderId: orders.length > 0 ? orders[0].orderId : 1,
    invoiceNumber: '',
    documentType: 'FACTURA_EXPORTACION',
    exchangeRate: 3.765,
    sunatCdrStatus: 'ACEPTADO',
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    currency: 'USD',
    subtotal: 15000,
    taxes: 0,
    total: 15000,
    status: 'UNPAID',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (invoice) {
      setFormData({
        orderId: invoice.orderId,
        invoiceNumber: invoice.invoiceNumber || '',
        documentType: invoice.documentType || 'FACTURA_EXPORTACION',
        exchangeRate: invoice.exchangeRate ?? 3.765,
        sunatCdrStatus: invoice.sunatCdrStatus || 'ACEPTADO',
        issueDate: invoice.issueDate ? invoice.issueDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
        dueDate: invoice.dueDate ? invoice.dueDate.slice(0, 10) : '',
        currency: invoice.currency || 'USD',
        subtotal: invoice.subtotal || 0,
        taxes: invoice.taxes ?? 0,
        total: invoice.total || 0,
        status: invoice.status || 'UNPAID',
      });
    } else {
      // Suggest sequential invoice number like E001-0000011
      const maxId = existingInvoices.reduce((max, i) => Math.max(max, i.invoiceId || 0), 0);
      const nextNum = String(maxId + 1).padStart(7, '0');
      setFormData({
        orderId: orders.length > 0 ? orders[0].orderId : 1,
        invoiceNumber: `E001-${nextNum}`,
        documentType: 'FACTURA_EXPORTACION',
        exchangeRate: 3.765,
        sunatCdrStatus: 'ACEPTADO',
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        currency: 'USD',
        subtotal: 25000,
        taxes: 0,
        total: 25000,
        status: 'UNPAID',
      });
    }
    setErrors({});
    setServerError(null);
  }, [invoice, isOpen, orders, existingInvoices]);

  // Real-time Duplicate Invoice Number Alarm
  const isDuplicateNumber = useMemo(() => {
    if (!formData.invoiceNumber) return false;
    const cleanNum = formData.invoiceNumber.trim().toUpperCase();
    return existingInvoices.some((inv) => {
      if (isEditing && inv.invoiceId === invoice?.invoiceId) return false;
      return inv.invoiceNumber?.trim().toUpperCase() === cleanNum;
    });
  }, [formData.invoiceNumber, existingInvoices, isEditing, invoice]);

  if (!isOpen) return null;

  // Auto-recalculate tax & total when subtotal or document type changes
  const handleSubtotalChange = (sub: number, docType = formData.documentType) => {
    const isTaxed = docType === 'FACTURA_ELECTRONICA';
    const taxes = isTaxed ? Math.round(sub * 0.18 * 100) / 100 : 0;
    const total = Math.round((sub + taxes) * 100) / 100;
    setFormData((prev) => ({
      ...prev,
      subtotal: sub,
      taxes,
      total,
    }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.invoiceNumber?.trim()) {
      errs.invoiceNumber = lang === 'es' ? 'El número de factura es obligatorio' : 'Invoice number is required';
    } else if (isDuplicateNumber) {
      errs.invoiceNumber = lang === 'es' ? 'Ya existe un comprobante con este número' : 'An invoice with this number already exists';
    }
    if (!formData.orderId) {
      errs.orderId = lang === 'es' ? 'Debe vincular una orden' : 'An order must be selected';
    }
    if ((formData.subtotal || 0) <= 0) {
      errs.subtotal = lang === 'es' ? 'El subtotal debe ser mayor a 0' : 'Subtotal must be greater than 0';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setServerError(null);
    try {
      const payload: Partial<Invoice> = {
        ...formData,
        issueDate: formData.issueDate ? `${formData.issueDate}T00:00:00` : undefined,
        dueDate: formData.dueDate ? `${formData.dueDate}T00:00:00` : undefined,
      };

      const result = await onSave(payload);
      if (result === false) {
        setServerError(
          lang === 'es'
            ? 'Error en el servidor al procesar la factura. Tus datos están a salvo en el formulario.'
            : 'Server error processing the invoice. Your data is safe in this form.'
        );
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        (lang === 'es' ? 'Error al guardar la factura' : 'Error saving invoice');
      setServerError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {isEditing
                  ? lang === 'es' ? 'Editar Factura / Comprobante' : 'Edit Invoice / Receipt'
                  : lang === 'es' ? 'Emitir Factura Electrónica SUNAT' : 'Issue Electronic Invoice (SUNAT)'}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {lang === 'es'
                  ? 'Facturación electrónica UBL 2.1 con validación CDR SUNAT'
                  : 'Electronic invoicing UBL 2.1 with SUNAT CDR validation'}
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
          {/* Server Error Banner ("si falla el formulario") */}
          {serverError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-semibold">{lang === 'es' ? 'Fallo en la emisión' : 'Issuance Failed'}</p>
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

          {/* Real-time Duplicate Warning */}
          {isDuplicateNumber && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-3">
              <AlertTriangle size={18} className="shrink-0 animate-bounce" />
              <div className="text-xs">
                <span className="font-bold">
                  {lang === 'es' ? 'Alarma de Duplicidad: ' : 'Duplicate Warning: '}
                </span>
                {lang === 'es'
                  ? `El número "${formData.invoiceNumber}" ya está emitido en el sistema tributario.`
                  : `Invoice number "${formData.invoiceNumber}" already exists in the system.`}
              </div>
            </div>
          )}

          {/* Row 1: Invoice Number & Order Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                {lang === 'es' ? 'Nº de Comprobante / Factura *' : 'Invoice Number *'}
              </label>
              <input
                type="text"
                value={formData.invoiceNumber || ''}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. E001-0000045"
                className={`w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border text-[var(--text-primary)] text-sm focus:outline-none transition-colors ${
                  errors.invoiceNumber || isDuplicateNumber
                    ? 'border-red-500'
                    : 'border-[var(--border-subtle)] focus:border-emerald-500'
                }`}
              />
              {errors.invoiceNumber && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.invoiceNumber}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                {lang === 'es' ? 'Orden Comercial Asociada *' : 'Associated Order *'}
              </label>
              <select
                value={formData.orderId || ''}
                onChange={(e) => setFormData({ ...formData, orderId: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="">{lang === 'es' ? '-- Seleccione Orden --' : '-- Select Order --'}</option>
                {orders.map((o) => (
                  <option key={o.orderId} value={o.orderId}>
                    {o.orderCode} - {o.clientId} ({o.incoterm || 'FOB'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Document Type & Currency */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <FileText size={13} /> {lang === 'es' ? 'Tipo de Documento Tributario' : 'Tax Document Type'}
                </span>
              </label>
              <select
                value={formData.documentType || 'FACTURA_EXPORTACION'}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, documentType: val });
                  handleSubtotalChange(formData.subtotal || 0, val);
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {DOCUMENT_TYPES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {lang === 'es' ? d.labelEs : d.labelEn}
                  </option>
                ))}
              </select>
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
                <option value="USD">USD ($ - Dólar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="PEN">PEN (S/ - Sol)</option>
              </select>
            </div>
          </div>

          {/* Row 3: Issue Date, Due Date & Exchange Rate */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} /> {lang === 'es' ? 'Fecha de Emisión *' : 'Issue Date *'}
                </span>
              </label>
              <input
                type="date"
                value={formData.issueDate || ''}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} /> {lang === 'es' ? 'Fecha de Vencimiento' : 'Due Date'}
                </span>
              </label>
              <input
                type="date"
                value={formData.dueDate || ''}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                {lang === 'es' ? 'Tipo de Cambio (SUNAT)' : 'Exchange Rate (SUNAT)'}
              </label>
              <input
                type="number"
                step="0.001"
                value={formData.exchangeRate ?? 3.765}
                onChange={(e) => setFormData({ ...formData, exchangeRate: parseFloat(e.target.value) || 1 })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Row 4: Financial Calculations (Subtotal, Tax, Total) */}
          <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3">
            <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              {lang === 'es' ? 'Desglose de Montos' : 'Amount Breakdown'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase mb-1">
                  {lang === 'es' ? 'Subtotal *' : 'Subtotal *'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-[var(--text-secondary)] font-bold">
                    {formData.currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={formData.subtotal || ''}
                    onChange={(e) => handleSubtotalChange(parseFloat(e.target.value) || 0)}
                    className="w-full pl-12 pr-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase mb-1">
                  {lang === 'es' ? 'Impuestos (IGV)' : 'Taxes (VAT)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-[var(--text-secondary)] font-bold">
                    {formData.currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    readOnly
                    value={formData.taxes ?? 0}
                    className="w-full pl-12 pr-4 py-2 rounded-xl bg-[var(--bg-card)]/50 border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-secondary)] cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-emerald-400 uppercase mb-1">
                  {lang === 'es' ? 'Total a Cobrar' : 'Total Amount'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-emerald-400 font-bold">
                    {formData.currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    readOnly
                    value={formData.total ?? 0}
                    className="w-full pl-12 pr-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm font-black text-emerald-400 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row 5: SUNAT CDR Status & Payment Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  {lang === 'es' ? 'Estado SUNAT CDR' : 'SUNAT CDR Status'}
                </span>
              </label>
              <select
                value={formData.sunatCdrStatus || 'ACEPTADO'}
                onChange={(e) => setFormData({ ...formData, sunatCdrStatus: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="ACEPTADO">✅ ACEPTADO (CDR Aprobado con Éxito)</option>
                <option value="PENDIENTE">⏳ PENDIENTE (En Cola de Envío)</option>
                <option value="OBSERVADO">⚠️ OBSERVADO (Requiere Corrección)</option>
                <option value="RECHAZADO">❌ RECHAZADO (Comprobante Rechazado)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                {lang === 'es' ? 'Estado de Cobranza' : 'Payment Collection Status'}
              </label>
              <select
                value={formData.status || 'UNPAID'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="UNPAID">🔴 UNPAID (Pendiente de Cobro)</option>
                <option value="PARTIAL">🟡 PARTIAL (Cobro Parcial / Anticipo)</option>
                <option value="PAID">🟢 PAID (Completamente Cobrado)</option>
                <option value="CANCELLED">⚪ CANCELLED (Anulado)</option>
              </select>
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
            disabled={isLoading || isDuplicateNumber}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isEditing
              ? lang === 'es' ? 'Actualizar Factura' : 'Update Invoice'
              : lang === 'es' ? 'Emitir Factura Electrónica' : 'Issue Electronic Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
};
