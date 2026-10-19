import { X, Building2, MapPin, Globe, Mail, Phone, Anchor, ShieldCheck, FileText } from 'lucide-react';
import type { Client } from '../../types/client';

interface ClientDetailModalProps {
  isOpen: boolean;
  client: Client | null;
  lang: 'es' | 'en';
  onClose: () => void;
  onEdit: (client: Client) => void;
}

export const ClientDetailModal = ({
  isOpen,
  client,
  lang,
  onClose,
  onEdit,
}: ClientDetailModalProps) => {
  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl shadow-2xl overflow-hidden my-8 text-left">
        {/* Header */}
        <div className="px-6 py-6 border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)] flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
              <Building2 size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">
                  {client.companyName || 'Empresa Sin Nombre'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  {client.documentType || 'EIN'}: {client.documentNumber || '—'}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1 flex items-center gap-1.5">
                <Globe size={13} className="text-blue-500" />
                <span>{client.country}</span>
                {client.destinationPort && (
                  <>
                    <span>•</span>
                    <Anchor size={13} className="text-cyan-500" />
                    <span>{client.destinationPort}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Commercial Terms Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-hint)] block mb-1">
                {lang === 'es' ? 'Incoterm' : 'Incoterm'}
              </span>
              <span className="text-sm font-black text-blue-500">
                {client.preferredIncoterm || 'FOB'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-hint)] block mb-1">
                {lang === 'es' ? 'Condición Pago' : 'Payment Terms'}
              </span>
              <span className="text-xs font-bold text-[var(--text-primary)]">
                {client.paymentTerms || 'NET_30'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-hint)] block mb-1">
                {lang === 'es' ? 'Moneda' : 'Currency'}
              </span>
              <span className="text-sm font-black text-emerald-500">
                {client.preferredCurrency || 'USD'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-hint)] block mb-1">
                {lang === 'es' ? 'Límite de Crédito' : 'Credit Limit'}
              </span>
              <span className="text-sm font-mono font-black text-[var(--text-primary)]">
                ${client.creditLimit ? client.creditLimit.toLocaleString('en-US') : '0.00'}
              </span>
            </div>
          </div>

          {/* Contact Details */}
          <div className="p-4 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              {lang === 'es' ? 'Representante Comercial & Contacto' : 'Commercial Representative & Contact'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-[var(--text-primary)]">
                <FileText size={14} className="text-blue-500 shrink-0" />
                <span>{client.contactName || (lang === 'es' ? 'No especificado' : 'Not specified')}</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--text-primary)]">
                <Mail size={14} className="text-blue-500 shrink-0" />
                <span>{client.email || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--text-primary)]">
                <Phone size={14} className="text-blue-500 shrink-0" />
                <span>{client.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--text-primary)]">
                <MapPin size={14} className="text-blue-500 shrink-0" />
                <span className="truncate">{client.address || '—'}</span>
              </div>
            </div>
          </div>

          {/* Agroexport Compliance Note */}
          <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex items-start gap-3 text-xs text-blue-400">
            <ShieldCheck size={18} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">
                {lang === 'es' ? 'Homologación de Comercio Exterior' : 'Foreign Trade Verification'}
              </span>
              <p className="mt-0.5 opacity-90">
                {lang === 'es'
                  ? 'Este cliente está habilitado para emisión de órdenes de exportación con documentación aduanera SUNAT/DAM y conocimiento de embarque (Bill of Lading).'
                  : 'This client is verified for export order creation with customs DAM documentation and maritime Bill of Lading (BL).'}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              {lang === 'es' ? 'Cerrar' : 'Close'}
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(client);
              }}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              {lang === 'es' ? 'Editar Términos' : 'Edit Terms'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
