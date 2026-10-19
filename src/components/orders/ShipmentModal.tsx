import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle, AlertTriangle, Loader2, RefreshCw, Ship, Thermometer, Anchor, Navigation, Calendar } from 'lucide-react';
import type { Shipment, Order } from '../../types/order';

interface ShipmentModalProps {
  isOpen: boolean;
  shipment: Shipment | null;
  existingShipments: Shipment[];
  orders: Order[];
  isLoading: boolean;
  lang: 'es' | 'en';
  onSave: (shipmentData: Partial<Shipment>) => Promise<boolean | void>;
  onClose: () => void;
}

const FREIGHT_FORWARDERS = [
  'Maersk Line',
  'MSC (Mediterranean Shipping Company)',
  'Hapag-Lloyd',
  'CMA CGM',
  'ONE (Ocean Network Express)',
  'Hamburg Süd',
  'Cosco Shipping',
  'Evergreen Marine',
];

const PORTS_ORIGIN = [
  'Puerto del Callao (PECALL)',
  'Puerto de Paita (PEPAI)',
  'Puerto de Paracas / Pisco (PEPRC)',
  'Aeropuerto Jorge Chávez (LIM Cargo)',
];

export const ShipmentModal: React.FC<ShipmentModalProps> = ({
  isOpen,
  shipment,
  existingShipments,
  orders,
  isLoading,
  lang,
  onSave,
  onClose,
}) => {
  const isEditing = Boolean(shipment);

  const [formData, setFormData] = useState<Partial<Shipment>>({
    orderId: orders.length > 0 ? orders[0].orderId : 1,
    containerNumber: '',
    blNumber: '',
    bookingNumber: '',
    freightForwarder: 'Maersk Line',
    vesselName: '',
    departurePort: 'Puerto del Callao (PECALL)',
    arrivalPort: 'Rotterdam (NLRTM)',
    departureDate: '',
    estimatedArrival: '',
    temperatureSetpoint: 0.5,
    status: 'BOOKED',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (shipment) {
      setFormData({
        orderId: shipment.orderId,
        containerNumber: shipment.containerNumber || '',
        blNumber: shipment.blNumber || '',
        bookingNumber: shipment.bookingNumber || '',
        freightForwarder: shipment.freightForwarder || 'Maersk Line',
        vesselName: shipment.vesselName || '',
        departurePort: shipment.departurePort || 'Puerto del Callao (PECALL)',
        arrivalPort: shipment.arrivalPort || 'Rotterdam (NLRTM)',
        departureDate: shipment.departureDate ? shipment.departureDate.slice(0, 16) : '',
        estimatedArrival: shipment.estimatedArrival ? shipment.estimatedArrival.slice(0, 16) : '',
        temperatureSetpoint: shipment.temperatureSetpoint ?? 0.5,
        status: shipment.status || 'BOOKED',
      });
    } else {
      // Suggest next container code like MSKU-849102-1
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      setFormData({
        orderId: orders.length > 0 ? orders[0].orderId : 1,
        containerNumber: `MSKU-${randomSuffix}-1`,
        blNumber: `BL-MSK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        bookingNumber: `BKG-${Math.floor(100000 + Math.random() * 900000)}`,
        freightForwarder: 'Maersk Line',
        vesselName: 'Maersk Mc-Kinney',
        departurePort: 'Puerto del Callao (PECALL)',
        arrivalPort: 'Rotterdam (NLRTM)',
        departureDate: new Date().toISOString().slice(0, 16),
        estimatedArrival: '',
        temperatureSetpoint: 0.5,
        status: 'BOOKED',
      });
    }
    setErrors({});
    setServerError(null);
  }, [shipment, isOpen, orders]);

  // Real-time Duplicate Container Warning
  const isDuplicateContainer = useMemo(() => {
    if (!formData.containerNumber) return false;
    const cleanNum = formData.containerNumber.trim().toUpperCase();
    return existingShipments.some((s) => {
      if (isEditing && s.shipmentId === shipment?.shipmentId) return false;
      return s.containerNumber?.trim().toUpperCase() === cleanNum;
    });
  }, [formData.containerNumber, existingShipments, isEditing, shipment]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.orderId) {
      errs.orderId = lang === 'es' ? 'Debe seleccionar una orden asociada' : 'Associated order is required';
    }
    if (!formData.containerNumber?.trim()) {
      errs.containerNumber = lang === 'es' ? 'El número de contenedor es requerido' : 'Container number is required';
    } else if (isDuplicateContainer) {
      errs.containerNumber = lang === 'es' ? 'Este contenedor ya está registrado' : 'Container is already registered';
    }
    if (!formData.departurePort?.trim()) {
      errs.departurePort = lang === 'es' ? 'El puerto de origen es requerido' : 'Departure port is required';
    }
    if (!formData.arrivalPort?.trim()) {
      errs.arrivalPort = lang === 'es' ? 'El puerto de destino es requerido' : 'Arrival port is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setServerError(null);
    try {
      const res = await onSave(formData);
      if (res === false) {
        setServerError(
          lang === 'es'
            ? 'Error al procesar el embarque. Los datos permanecen guardados en el formulario.'
            : 'Error processing shipment. Data remains saved in form.'
        );
      }
    } catch (err: unknown) {
      const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        (lang === 'es' ? 'Error al registrar embarque' : 'Error saving shipment');
      setServerError(errMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Ship size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {isEditing
                  ? lang === 'es' ? 'Editar Embarque Reefer' : 'Edit Reefer Shipment'
                  : lang === 'es' ? 'Nuevo Embarque & Contenedor Reefer' : 'New Reefer Shipment & Container'}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {lang === 'es'
                  ? 'Asignación de Booking, BL, Buque y Cadena de Frío'
                  : 'Booking, Bill of Lading, Vessel and Cold Chain setup'}
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
          {/* Server Error Banner */}
          {serverError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-semibold">{lang === 'es' ? 'Fallo en la comunicación' : 'Communication Failure'}</p>
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

          {/* Duplicate Container Warning */}
          {isDuplicateContainer && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-3">
              <AlertTriangle size={18} className="shrink-0 animate-bounce" />
              <div className="text-xs">
                <span className="font-bold">
                  {lang === 'es' ? 'Alarma de Duplicidad: ' : 'Duplicate Warning: '}
                </span>
                {lang === 'es'
                  ? `El contenedor "${formData.containerNumber}" ya se encuentra asignado a otro embarque activo.`
                  : `Container "${formData.containerNumber}" is already assigned to another active shipment.`}
              </div>
            </div>
          )}

          {/* Row 1: Associated Order & Container Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                {lang === 'es' ? 'Orden Comercial Asociada *' : 'Associated Order *'}
              </label>
              <select
                value={formData.orderId || ''}
                onChange={(e) => setFormData({ ...formData, orderId: Number(e.target.value) })}
                className={`w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border text-[var(--text-primary)] text-sm focus:outline-none transition-colors ${
                  errors.orderId ? 'border-red-500' : 'border-[var(--border-subtle)] focus:border-cyan-500'
                }`}
              >
                <option value="">{lang === 'es' ? '-- Seleccione Orden --' : '-- Select Order --'}</option>
                {orders.map((o) => (
                  <option key={o.orderId} value={o.orderId}>
                    {o.orderCode} - {o.clientId} ({o.incoterm || 'FOB'}) - {o.status}
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
                {lang === 'es' ? 'Nº de Contenedor Reefer *' : 'Reefer Container Nº *'}
              </label>
              <input
                type="text"
                value={formData.containerNumber || ''}
                onChange={(e) => setFormData({ ...formData, containerNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. MSKU-948210-4"
                className={`w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border text-[var(--text-primary)] text-sm focus:outline-none transition-colors ${
                  errors.containerNumber || isDuplicateContainer
                    ? 'border-red-500'
                    : 'border-[var(--border-subtle)] focus:border-cyan-500'
                }`}
              />
              {errors.containerNumber && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.containerNumber}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: BL Number & Booking Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Bill of Lading (B/L)
              </label>
              <input
                type="text"
                value={formData.blNumber || ''}
                onChange={(e) => setFormData({ ...formData, blNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. BL-MAEU-2026-9021"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                {lang === 'es' ? 'Nº de Reserva / Booking' : 'Booking / Reservation Nº'}
              </label>
              <input
                type="text"
                value={formData.bookingNumber || ''}
                onChange={(e) => setFormData({ ...formData, bookingNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. BKG-847291"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Row 3: Freight Forwarder & Vessel Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Ship size={13} /> {lang === 'es' ? 'Línea Naviera / Agente' : 'Shipping Line / Forwarder'}
                </span>
              </label>
              <select
                value={formData.freightForwarder || 'Maersk Line'}
                onChange={(e) => setFormData({ ...formData, freightForwarder: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              >
                {FREIGHT_FORWARDERS.map((ff) => (
                  <option key={ff} value={ff}>
                    {ff}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Navigation size={13} /> {lang === 'es' ? 'Nombre del Buque (Vessel)' : 'Vessel Name'}
                </span>
              </label>
              <input
                type="text"
                value={formData.vesselName || ''}
                onChange={(e) => setFormData({ ...formData, vesselName: e.target.value })}
                placeholder="e.g. MSC Laurence / Maersk Mc-Kinney"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Row 4: Departure & Arrival Ports */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Anchor size={13} /> {lang === 'es' ? 'Puerto de Zarpe (Origen) *' : 'Departure Port (Origin) *'}
                </span>
              </label>
              <select
                value={formData.departurePort || 'Puerto del Callao (PECALL)'}
                onChange={(e) => setFormData({ ...formData, departurePort: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              >
                {PORTS_ORIGIN.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Anchor size={13} /> {lang === 'es' ? 'Puerto de Destino *' : 'Arrival Port *'}
                </span>
              </label>
              <input
                type="text"
                value={formData.arrivalPort || ''}
                onChange={(e) => setFormData({ ...formData, arrivalPort: e.target.value })}
                placeholder="e.g. Rotterdam (NLRTM), Philadelphia (USPHL)"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Row 5: Dates (Departure & ETA) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} /> {lang === 'es' ? 'Fecha y Hora de Zarpe (ETD)' : 'Departure Date/Time (ETD)'}
                </span>
              </label>
              <input
                type="datetime-local"
                value={formData.departureDate || ''}
                onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} /> {lang === 'es' ? 'Fecha Estimada de Arribo (ETA)' : 'Estimated Arrival (ETA)'}
                </span>
              </label>
              <input
                type="datetime-local"
                value={formData.estimatedArrival || ''}
                onChange={(e) => setFormData({ ...formData, estimatedArrival: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Row 6: Temperature Setpoint & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Thermometer size={13} /> {lang === 'es' ? 'Setpoint Temperatura Reefer (°C)' : 'Reefer Temp Setpoint (°C)'}
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={formData.temperatureSetpoint ?? 0.5}
                  onChange={(e) => setFormData({ ...formData, temperatureSetpoint: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <span className="absolute right-4 top-2.5 text-xs text-cyan-400 font-bold">°C</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                {lang === 'es'
                  ? 'Recomendado: 0.5°C para Palta Hass y Arándanos'
                  : 'Recommended: 0.5°C for Hass Avocado & Blueberries'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                {lang === 'es' ? 'Estado del Embarque' : 'Shipment Status'}
              </label>
              <select
                value={formData.status || 'BOOKED'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-semibold focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="BOOKED">📋 BOOKED (Reserva Confirmada)</option>
                <option value="GATE_IN">🏭 GATE_IN (Ingreso al Puerto Callao/Paita)</option>
                <option value="IN_TRANSIT">🚢 IN_TRANSIT (En Altamar / Navegando)</option>
                <option value="CUSTOMS_HOLD">🛂 CUSTOMS_HOLD (En Inspección Aduanera)</option>
                <option value="DELIVERED">✅ DELIVERED (Descargado / Entregado)</option>
                <option value="CANCELLED">❌ CANCELLED (Cancelado)</option>
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
            disabled={isLoading || isDuplicateContainer}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold shadow-lg shadow-cyan-600/25 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isEditing
              ? lang === 'es' ? 'Actualizar Embarque' : 'Update Shipment'
              : lang === 'es' ? 'Registrar Embarque Reefer' : 'Register Reefer Shipment'}
          </button>
        </div>
      </div>
    </div>
  );
};
