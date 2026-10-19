import React from 'react';
import { X, CheckCircle2, Clock, Ship, FileText, ShieldCheck, Thermometer, Anchor, ArrowRight } from 'lucide-react';
import type { Order, Shipment, CustomsDeclaration } from '../../types/order';

interface OrderTrackingModalProps {
  isOpen: boolean;
  order: Order | null;
  shipment: Shipment | null;
  declaration: CustomsDeclaration | null;
  lang: 'es' | 'en';
  onClose: () => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  order,
  shipment,
  declaration,
  lang,
  onClose,
}) => {
  if (!isOpen || !order) return null;

  // Derive steps progression based on status
  const status = (order.status || 'PENDING').toUpperCase();

  const steps = [
    {
      id: 1,
      titleEs: 'Orden Comercial Registrada',
      titleEn: 'Commercial Order Placed',
      descEs: `Contrato firmado bajo Incoterm ${order.incoterm || 'FOB'} con destino a ${order.destinationPort || 'Europa'}.`,
      descEn: `Contract signed under Incoterm ${order.incoterm || 'FOB'} bound for ${order.destinationPort || 'Europe'}.`,
      date: order.orderDate,
      done: true,
      icon: <FileText size={16} />,
    },
    {
      id: 2,
      titleEs: 'Packing & Lotes Asignados',
      titleEn: 'Packing & Harvest Batches Assigned',
      descEs: 'Clasificación de fruta fresca, paletizado y control de calidad fitosanitario.',
      descEn: 'Fresh fruit grading, palletizing and phytosanitary quality control.',
      date: order.orderDate,
      done: ['PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(status),
      icon: <ShieldCheck size={16} />,
    },
    {
      id: 3,
      titleEs: 'Booking Naviero & Contenedor Reefer',
      titleEn: 'Ocean Booking & Reefer Container',
      descEs: shipment
        ? `Naviera: ${shipment.freightForwarder || 'Maersk'} | Contenedor: ${shipment.containerNumber || 'Asignado'} | Setpoint: ${shipment.temperatureSetpoint ?? 0.5}°C`
        : 'Reserva confirmada con naviera y asignación de atmósfera controlada.',
      descEn: shipment
        ? `Carrier: ${shipment.freightForwarder || 'Maersk'} | Container: ${shipment.containerNumber || 'Assigned'} | Setpoint: ${shipment.temperatureSetpoint ?? 0.5}°C`
        : 'Confirmed ocean carrier booking and controlled atmosphere allocation.',
      date: shipment?.departureDate?.slice(0, 10) || order.estimatedShippingDate,
      done: Boolean(shipment) || ['SHIPPED', 'DELIVERED', 'COMPLETED'].includes(status),
      icon: <Thermometer size={16} />,
    },
    {
      id: 4,
      titleEs: 'Despacho Aduanero SUNAT (DAM)',
      titleEn: 'SUNAT Customs Clearance (DAM)',
      descEs: declaration
        ? `Declaración Aduanera Nº ${declaration.damNumber} - Canal ${declaration.status || 'VERDE'}`
        : 'Aprobación de levante aduanero y certificado de origen exportador.',
      descEn: declaration
        ? `Customs Declaration Nº ${declaration.damNumber} - Channel ${declaration.status || 'GREEN'}`
        : 'Customs release approval and export certificate of origin.',
      date: declaration?.filingDate?.slice(0, 10) || shipment?.departureDate?.slice(0, 10),
      done: Boolean(declaration) || ['SHIPPED', 'DELIVERED', 'COMPLETED'].includes(status),
      icon: <Anchor size={16} />,
    },
    {
      id: 5,
      titleEs: 'Zarpe & Navegación Marítima',
      titleEn: 'Vessel Departure & Ocean Voyage',
      descEs: shipment
        ? `Buque ${shipment.vesselName || 'Ocean Vessel'} zarpó de ${shipment.departurePort || 'Callao'} hacia ${shipment.arrivalPort || 'Destino'}.`
        : 'En tránsito marítimo con monitoreo continuo de telemetría de frío.',
      descEn: shipment
        ? `Vessel ${shipment.vesselName || 'Ocean Vessel'} departed from ${shipment.departurePort || 'Callao'} to ${shipment.arrivalPort || 'Destination'}.`
        : 'Ocean transit with continuous cold chain telemetry monitoring.',
      date: shipment?.departureDate?.slice(0, 10),
      done: ['SHIPPED', 'DELIVERED', 'COMPLETED'].includes(status) || shipment?.status === 'IN_TRANSIT',
      icon: <Ship size={16} />,
    },
    {
      id: 6,
      titleEs: 'Arribo a Destino & Entrega al Cliente',
      titleEn: 'Arrival at Destination & Final Delivery',
      descEs: `Descarga en ${order.destinationPort || 'Puerto de Destino'} y recepción de la carga conforme.`,
      descEn: `Discharged at ${order.destinationPort || 'Destination Port'} and accepted by B2B client.`,
      date: shipment?.estimatedArrival?.slice(0, 10),
      done: ['DELIVERED', 'COMPLETED'].includes(status) || shipment?.status === 'DELIVERED',
      icon: <CheckCircle2 size={16} />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
              <Ship size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                {lang === 'es' ? 'Trazabilidad de Exportación:' : 'Export Tracking:'}
                <span className="text-violet-400 font-mono">{order.orderCode}</span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {lang === 'es'
                  ? 'Cadena logística de exportación desde fundo hasta puerto de destino'
                  : 'Export supply chain tracking from orchard packing to destination port'}
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
          {/* Linked Shipment & Customs badges */}
          <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase">
                {lang === 'es' ? 'Ruta de Transporte' : 'Shipping Route'}
              </p>
              <div className="flex items-center gap-2 mt-1 text-sm font-semibold text-[var(--text-primary)]">
                <span>{shipment?.departurePort || 'Puerto del Callao (PE)'}</span>
                <ArrowRight size={14} className="text-violet-400" />
                <span>{shipment?.arrivalPort || order.destinationPort || 'Rotterdam (NL)'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {shipment && (
                <div className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold">
                  ❄️ {shipment.containerNumber} ({shipment.temperatureSetpoint ?? 0.5}°C)
                </div>
              )}
              {declaration && (
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
                  📋 {declaration.damNumber} ({declaration.status || 'VERDE'})
                </div>
              )}
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[var(--border-subtle)]">
            {steps.map((st) => (
              <div key={st.id} className="relative flex items-start gap-4">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 -ml-6 border transition-all ${
                    st.done
                      ? 'bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-600/30'
                      : 'bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                  }`}
                >
                  {st.done ? <CheckCircle2 size={14} /> : <Clock size={12} />}
                </div>

                <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] p-3.5 rounded-xl hover:border-violet-500/40 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <span className={st.done ? 'text-violet-400' : 'text-[var(--text-secondary)]'}>
                        {st.icon}
                      </span>
                      {lang === 'es' ? st.titleEs : st.titleEn}
                    </h4>
                    {st.date && (
                      <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                        {st.date}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {lang === 'es' ? st.descEs : st.descEn}
                  </p>
                </div>
              </div>
            ))}
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
