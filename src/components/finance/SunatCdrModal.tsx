import React from 'react';
import { X, CheckCircle2, ShieldCheck, FileText, AlertTriangle, Download, QrCode, Building } from 'lucide-react';
import type { Invoice } from '../../types/finance';
import type { Order } from '../../types/order';

interface SunatCdrModalProps {
  isOpen: boolean;
  invoice: Invoice | null;
  order: Order | null;
  lang: 'es' | 'en';
  onClose: () => void;
}

export const SunatCdrModal: React.FC<SunatCdrModalProps> = ({
  isOpen,
  invoice,
  order,
  lang,
  onClose,
}) => {
  if (!isOpen || !invoice) return null;

  const isAccepted = invoice.sunatCdrStatus === 'ACEPTADO';
  const isRejected = invoice.sunatCdrStatus === 'RECHAZADO';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                {lang === 'es' ? 'Constancia de Recepción SUNAT (CDR)' : 'SUNAT Receipt Certification (CDR)'}
                <span className="font-mono text-emerald-500 text-sm">{invoice.invoiceNumber}</span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {lang === 'es' ? 'Comprobante Electrónico UBL 2.1 con validez fiscal SUNAT' : 'Electronic Tax Document UBL 2.1 with SUNAT tax validity'}
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
          {/* CDR Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center gap-4 ${
              isAccepted
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : isRejected
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center shrink-0">
              {isAccepted ? <CheckCircle2 size={26} /> : isRejected ? <AlertTriangle size={26} /> : <FileText size={26} />}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">
                {isAccepted
                  ? lang === 'es' ? 'Comprobante ACEPTADO por SUNAT / OSE' : 'Document ACCEPTED by SUNAT / OSE'
                  : isRejected
                  ? lang === 'es' ? 'Comprobante RECHAZADO por SUNAT' : 'Document REJECTED by SUNAT'
                  : lang === 'es' ? 'Comprobante PENDIENTE de Envío' : 'Document PENDING Submission'}
              </h3>
              <p className="text-xs opacity-90 mt-0.5">
                {isAccepted
                  ? lang === 'es'
                    ? 'La Factura Electrónica cuenta con constancia de recepción (CDR) válida. RUC Emisor: 20608942150'
                    : 'The Electronic Invoice has a valid receipt confirmation (CDR). Issuer Tax ID: 20608942150'
                  : lang === 'es'
                  ? 'El documento presenta inconsistencias en los campos obligatorios del XML.'
                  : 'The XML document contains validation inconsistencies.'}
              </p>
            </div>
          </div>

          {/* Tax Issuer & Customer Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                <Building size={14} className="text-emerald-500" />
                {lang === 'es' ? 'Emisor Electrónico' : 'Electronic Issuer'}
              </div>
              <p className="font-bold text-sm text-[var(--text-primary)]">VISONS S.A.C.</p>
              <p className="text-xs text-[var(--text-secondary)]">RUC: 20608942150</p>
              <p className="text-xs text-[var(--text-secondary)]">Av. Manuel Olguín 325, Surco, Lima - Perú</p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                <Building size={14} className="text-violet-400" />
                {lang === 'es' ? 'Adquirente / Cliente B2B' : 'Customer / Client B2B'}
              </div>
              <p className="font-bold text-sm text-[var(--text-primary)]">
                {order ? order.clientId : 'Cliente Internacional'}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {lang === 'es' ? 'Orden Comercial Ref: ' : 'Order Reference: '}
                <span className="font-mono font-semibold text-violet-400">{order?.orderCode || `ORD-${invoice.orderId}`}</span>
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Incoterm: {order?.incoterm || 'FOB'} | Destino: {order?.destinationPort || 'Rotterdam'}
              </p>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                {lang === 'es' ? 'Liquidación y Tipo de Cambio' : 'Settlement & Exchange Rate'}
              </span>
              <span className="text-xs font-mono text-[var(--text-secondary)]">
                T/C SUNAT: S/ {invoice.exchangeRate?.toFixed(3) || '3.765'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                <span className="text-[var(--text-secondary)]">{lang === 'es' ? 'Operación de Exportación (0% IGV)' : 'Export Operation (0% VAT)'}:</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  ${invoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} {invoice.currency}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                <span className="text-[var(--text-secondary)]">{lang === 'es' ? 'Impuesto General a las Ventas (IGV)' : 'Taxes (IGV / VAT)'}:</span>
                <span className="font-semibold text-[var(--text-secondary)]">
                  ${(invoice.taxes || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {invoice.currency}
                </span>
              </div>
              <div className="flex justify-between py-1.5 text-sm font-bold text-emerald-400">
                <span>{lang === 'es' ? 'Total Factura' : 'Invoice Total'}:</span>
                <span>
                  ${invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} {invoice.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Security & XML Digital Signature Stamp */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <div className="space-y-0.5">
              <p className="font-mono text-[10px] text-[var(--text-secondary)]/80">
                Digest SHA-256: 7a8f3b21c9e8471a2b005e83912df0498721c5f3
              </p>
              <p className="text-[11px] text-emerald-400 font-semibold">
                ✓ Firma Digital Certificada por Entidad Prestadora OSE SUNAT
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)]">
              <QrCode size={24} />
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Download size={14} />
            {lang === 'es' ? 'Imprimir / Descargar CDR' : 'Print / Download CDR'}
          </button>
        </div>
      </div>
    </div>
  );
};
