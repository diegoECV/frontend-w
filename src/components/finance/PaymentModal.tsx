import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle, AlertTriangle, Loader2, RefreshCw, CreditCard, DollarSign, Calendar, FileText } from 'lucide-react';
import type { Payment } from '../../types/finance';
import type { Order } from '../../types/order';

interface PaymentModalProps {
  isOpen: boolean;
  payment: Payment | null;
  existingPayments: Payment[];
  orders: Order[];
  isLoading: boolean;
  lang: 'es' | 'en';
  onSave: (paymentData: Partial<Payment>) => Promise<boolean | void>;
  onClose: () => void;
}

const PAYMENT_METHODS = [
  { value: 'WIRE_TRANSFER', labelEs: 'Transferencia Bancaria Internacional (SWIFT / ABA)', labelEn: 'International Wire Transfer (SWIFT)' },
  { value: 'LETTER_OF_CREDIT', labelEs: 'Carta de Crédito Irrevocable (L/C Confirmada)', labelEn: 'Irrevocable Letter of Credit (L/C)' },
  { value: 'DEPOSITO_BANCARIO', labelEs: 'Depósito en Cuenta Corriente (BCP / Interbank)', labelEn: 'Direct Bank Deposit (Checking Account)' },
  { value: 'CREDIT_CARD', labelEs: 'Tarjeta Corporativa / Cobro Online', labelEn: 'Corporate Credit Card / Online Gateway' },
  { value: 'PAYPAL', labelEs: 'PayPal / B2B Gateway', labelEn: 'PayPal / B2B Gateway' },
  { value: 'CHECK', labelEs: 'Cheque de Gerencia / Cheque Bancario', labelEn: 'Banker’s Draft / Cashier’s Check' },
];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  payment,
  existingPayments,
  orders,
  isLoading,
  lang,
  onSave,
  onClose,
}) => {
  const isEditing = Boolean(payment);

  const [formData, setFormData] = useState<Partial<Payment>>({
    orderId: orders.length > 0 ? orders[0].orderId : 1,
    amount: 10000,
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'WIRE_TRANSFER',
    referenceCode: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (payment) {
      setFormData({
        orderId: payment.orderId,
        amount: payment.amount || 0,
        paymentDate: payment.paymentDate ? payment.paymentDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
        paymentMethod: payment.paymentMethod || 'WIRE_TRANSFER',
        referenceCode: payment.referenceCode || '',
        notes: payment.notes || '',
      });
    } else {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setFormData({
        orderId: orders.length > 0 ? orders[0].orderId : 1,
        amount: 15000,
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod: 'WIRE_TRANSFER',
        referenceCode: `SWIFT-PE-${randomSuffix}`,
        notes: 'Pago recibido conforme en cuenta corriente BCP USD',
      });
    }
    setErrors({});
    setServerError(null);
  }, [payment, isOpen, orders]);

  // Duplicate Reference Code Check
  const isDuplicateReference = useMemo(() => {
    if (!formData.referenceCode) return false;
    const cleanRef = formData.referenceCode.trim().toUpperCase();
    return existingPayments.some((p) => {
      if (isEditing && p.paymentId === payment?.paymentId) return false;
      return p.referenceCode?.trim().toUpperCase() === cleanRef;
    });
  }, [formData.referenceCode, existingPayments, isEditing, payment]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.orderId) {
      errs.orderId = lang === 'es' ? 'Debe seleccionar una orden' : 'An order is required';
    }
    if (!formData.amount || formData.amount <= 0) {
      errs.amount = lang === 'es' ? 'El monto debe ser mayor a 0' : 'Amount must be greater than 0';
    }
    if (!formData.referenceCode?.trim()) {
      errs.referenceCode = lang === 'es' ? 'El código de operación es requerido' : 'Reference code is required';
    } else if (isDuplicateReference) {
      errs.referenceCode = lang === 'es' ? 'Este código de operación ya fue registrado' : 'This reference code already exists';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setServerError(null);
    try {
      const payload: Partial<Payment> = {
        ...formData,
        paymentDate: formData.paymentDate ? `${formData.paymentDate}T00:00:00` : undefined,
      };

      const result = await onSave(payload);
      if (result === false) {
        setServerError(
          lang === 'es'
            ? 'Error en el servidor al registrar el pago. Datos preservados en el formulario.'
            : 'Server error registering payment. Data preserved in form.'
        );
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        (lang === 'es' ? 'Error al guardar el pago' : 'Error saving payment');
      setServerError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {isEditing
                  ? lang === 'es' ? 'Editar Cobranza / Pago' : 'Edit Payment / Collection'
                  : lang === 'es' ? 'Registrar Cobranza B2B' : 'Register B2B Payment'}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {lang === 'es'
                  ? 'Conciliación de transferencias bancarias y cartas de crédito'
                  : 'Reconciliation of wire transfers and letters of credit'}
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-left">
          {/* Server Error Banner */}
          {serverError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-semibold">{lang === 'es' ? 'Fallo en el registro' : 'Registration Failed'}</p>
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

          {/* Duplicate Reference Code Warning */}
          {isDuplicateReference && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-3">
              <AlertTriangle size={18} className="shrink-0 animate-bounce" />
              <div className="text-xs">
                <span className="font-bold">
                  {lang === 'es' ? 'Alarma de Duplicidad: ' : 'Duplicate Warning: '}
                </span>
                {lang === 'es'
                  ? `La referencia bancaria "${formData.referenceCode}" ya fue registrada anteriormente.`
                  : `Bank reference "${formData.referenceCode}" has already been recorded.`}
              </div>
            </div>
          )}

          {/* Row 1: Associated Order & Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {o.orderCode} - {o.clientId} ({o.currency || 'USD'})
                  </option>
                ))}
              </select>
              {errors.orderId && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.orderId}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <DollarSign size={13} /> {lang === 'es' ? 'Monto Cobrado (USD / Divisa) *' : 'Amount Paid *'}
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {errors.amount && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.amount}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              {lang === 'es' ? 'Medio de Pago / Instrumento Financiero' : 'Payment Method / Instrument'}
            </label>
            <select
              value={formData.paymentMethod || 'WIRE_TRANSFER'}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {lang === 'es' ? m.labelEs : m.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Row 3: Reference Code & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                {lang === 'es' ? 'Código de Referencia / N° Operación *' : 'Reference / Transaction Code *'}
              </label>
              <input
                type="text"
                value={formData.referenceCode || ''}
                onChange={(e) => setFormData({ ...formData, referenceCode: e.target.value.toUpperCase() })}
                placeholder="e.g. SWIFT-BK-99412"
                className={`w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border text-[var(--text-primary)] text-sm focus:outline-none transition-colors ${
                  errors.referenceCode || isDuplicateReference
                    ? 'border-red-500'
                    : 'border-[var(--border-subtle)] focus:border-emerald-500'
                }`}
              />
              {errors.referenceCode && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.referenceCode}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} /> {lang === 'es' ? 'Fecha de Abono Bancario' : 'Payment Date'}
                </span>
              </label>
              <input
                type="date"
                value={formData.paymentDate || ''}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Row 4: Notes */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1.5">
                <FileText size={13} /> {lang === 'es' ? 'Notas / Conciliación Bancaria' : 'Notes / Bank Reconciliation'}
              </span>
            </label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={lang === 'es' ? 'Banco corresponsal, comisiones o deducciones bancarias...' : 'Correspondent bank, fees or wire deductions...'}
              className="w-full px-4 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
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
            disabled={isLoading || isDuplicateReference}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isEditing
              ? lang === 'es' ? 'Actualizar Pago' : 'Update Payment'
              : lang === 'es' ? 'Registrar Cobranza' : 'Register Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};
