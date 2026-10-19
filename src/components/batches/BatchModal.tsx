import { useState, useEffect } from 'react';
import { X, AlertCircle, AlertTriangle, Check, Loader2, Layers, ShieldCheck } from 'lucide-react';
import type { Batch, QualityStatus } from '../../types/batch';
import type { Product } from '../../types/product';
import type { Provider } from '../../types/provider';

interface BatchModalProps {
  isOpen: boolean;
  batch?: Batch | null;
  products: Product[];
  providers: Provider[];
  existingBatches: Batch[];
  lang: 'es' | 'en';
  onClose: () => void;
  onSubmit: (batchData: Partial<Batch>) => Promise<void>;
}

export const BatchModal = ({
  isOpen,
  batch,
  products,
  providers,
  existingBatches,
  lang,
  onClose,
  onSubmit,
}: BatchModalProps) => {
  const isEditing = Boolean(batch?.batchId);

  // Form State
  const [productId, setProductId] = useState('');
  const [providerId, setProviderId] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [harvestDate, setHarvestDate] = useState('');
  const [packingDate, setPackingDate] = useState('');
  const [productionDate, setProductionDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [inspector, setInspector] = useState('');
  const [qualityStatus, setQualityStatus] = useState<QualityStatus>('PASSED');
  const [notes, setNotes] = useState('');

  // Validation & Error States
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (batch) {
        setProductId(batch.productId || products[0]?.code || products[0]?.id || '');
        setProviderId(batch.providerId || providers[0]?.documentNumber || providers[0]?.id || '');
        setFieldName(batch.fieldName || '');
        setHarvestDate(batch.harvestDate || '');
        setPackingDate(batch.packingDate || '');
        setProductionDate(batch.productionDate || '');
        setExpirationDate(batch.expirationDate || '');

        const firstInsp = batch.inspections?.[0];
        setInspector(firstInsp?.inspector || '');
        setQualityStatus(firstInsp?.qualityStatus || 'PASSED');
        setNotes(firstInsp?.notes || '');
      } else {
        const today = new Date().toISOString().slice(0, 10);
        const expDate = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);

        setProductId(products[0]?.code || products[0]?.id || 'PROD-001');
        setProviderId(providers[0]?.documentNumber || providers[0]?.id || 'RUC001');
        setFieldName('Fundo Principal - Sector 1');
        setHarvestDate(today);
        setPackingDate(today);
        setProductionDate(today);
        setExpirationDate(expDate);
        setInspector('Ing. SENASA — Inspector Oficial');
        setQualityStatus('PASSED');
        setNotes('Inspección de sanidad vegetal aprobada para exportación.');
      }
      setTouched({});
      setErrors({});
      setDuplicateWarning(null);
      setServerError(null);
    }
  }, [isOpen, batch, products, providers]);

  // Real-time validation & duplicate detection
  useEffect(() => {
    if (fieldName.trim() && harvestDate && productId) {
      const isDuplicate = existingBatches.some(
        (b) =>
          b.fieldName.toLowerCase() === fieldName.trim().toLowerCase() &&
          b.harvestDate === harvestDate &&
          b.productId === productId &&
          (!isEditing || b.batchId !== batch?.batchId)
      );

      if (isDuplicate) {
        setDuplicateWarning(
          lang === 'es'
            ? `Alerta de Duplicidad: Ya existe un lote registrado para este producto, fundo y fecha de cosecha.`
            : `Duplicate Alert: A batch with this product, farm and harvest date already exists.`
        );
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }

    const newErrors: Record<string, string> = {};
    if (touched.fieldName && !fieldName.trim()) {
      newErrors.fieldName = lang === 'es' ? 'El fundo o parcela es obligatorio' : 'Farm/Plot is required';
    }
    if (touched.harvestDate && !harvestDate) {
      newErrors.harvestDate = lang === 'es' ? 'Fecha de cosecha obligatoria' : 'Harvest date required';
    }

    setErrors(newErrors);
  }, [fieldName, harvestDate, productId, existingBatches, isEditing, batch, touched, lang]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    setTouched({ fieldName: true, harvestDate: true });

    if (!fieldName.trim()) {
      setErrors((p) => ({ ...p, fieldName: lang === 'es' ? 'Fundo obligatorio' : 'Farm required' }));
      return;
    }
    if (!harvestDate) {
      setErrors((p) => ({ ...p, harvestDate: lang === 'es' ? 'Fecha obligatoria' : 'Date required' }));
      return;
    }

    if (duplicateWarning) {
      setServerError(
        lang === 'es'
          ? 'Por favor verifica los datos del lote para evitar duplicados.'
          : 'Please review batch information to prevent duplicates.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        productId,
        providerId,
        fieldName: fieldName.trim(),
        harvestDate: harvestDate || null,
        packingDate: packingDate || null,
        productionDate: productionDate || null,
        expirationDate: expirationDate || null,
        inspections: inspector.trim()
          ? [
              {
                inspector: inspector.trim(),
                inspectionTime: new Date().toISOString(),
                qualityStatus,
                notes: notes.trim() || null,
              },
            ]
          : [],
      });
      onClose();
    } catch (err: unknown) {
      console.error('Error al guardar lote:', err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        (lang === 'es'
          ? 'Error al comunicarse con el backend. Por favor verifica los datos y reintenta.'
          : 'Backend communication error. Please check data and retry.');
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl shadow-2xl overflow-hidden my-8 text-left">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-lime-500/10 border border-lime-500/20 text-lime-500 flex items-center justify-center">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
                {isEditing
                  ? lang === 'es'
                    ? 'Editar Lote de Cosecha & Packing'
                    : 'Edit Harvest & Packing Batch'
                  : lang === 'es'
                  ? 'Registrar Nuevo Lote de Cosecha'
                  : 'Register New Harvest Batch'}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {lang === 'es'
                  ? 'Trazabilidad de campo, packing y certificación de sanidad SENASA'
                  : 'Field traceability, packing dates and SENASA phytosanitary certification'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-[var(--surface-card)]">
          {/* Server Error Alert Banner */}
          {serverError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-500 animate-shake">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <span className="font-semibold block">
                  {lang === 'es' ? 'Fallo al procesar lote:' : 'Request failed:'}
                </span>
                <p className="text-xs opacity-90 mt-1">{serverError}</p>
              </div>
              <button
                type="button"
                onClick={() => setServerError(null)}
                className="text-xs font-semibold px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 transition-colors"
              >
                {lang === 'es' ? 'Cerrar' : 'Dismiss'}
              </button>
            </div>
          )}

          {/* Duplicate Alarm Banner */}
          {duplicateWarning && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-600 dark:text-amber-400">
              <AlertTriangle size={20} className="shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <span className="font-semibold block">
                  {lang === 'es' ? 'Atención: Lote Duplicado' : 'Warning: Duplicate Batch'}
                </span>
                <p className="text-xs opacity-90 mt-0.5">{duplicateWarning}</p>
              </div>
            </div>
          )}

          {/* Section 1: Product & Origin */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-lime-500">
              {lang === 'es' ? '1. Origen Agrícola & Producto' : '1. Farm Origin & Product'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  {lang === 'es' ? 'Producto Exportación' : 'Export Product'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20"
                >
                  {products.map((p) => (
                    <option key={p.id || p.code} value={p.code || p.id}>
                      {p.code ? `[${p.code}] ` : ''}{p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  {lang === 'es' ? 'Proveedor / Productor' : 'Supplier / Grower'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20"
                >
                  {providers.map((pr) => (
                    <option key={pr.id || pr.documentNumber} value={pr.documentNumber || pr.id}>
                      {pr.companyName || pr.documentNumber} ({pr.documentType || 'RUC'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  {lang === 'es' ? 'Fundo / Parcela / Sector' : 'Farm / Field / Plot'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, fieldName: true }))}
                  placeholder="Ej. Fundo El Sol - Lote 3B"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none transition-all ${
                    errors.fieldName
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-[var(--border-subtle)] focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20'
                  }`}
                />
                {errors.fieldName && <p className="text-xs text-red-500 mt-1">{errors.fieldName}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Dates (Harvest, Packing, Expiration) */}
          <div className="space-y-3 pt-3 border-t border-[var(--border-subtle)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-lime-500">
              {lang === 'es' ? '2. Cronograma de Cosecha & Vida Útil' : '2. Harvest Schedule & Shelf Life'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  {lang === 'es' ? 'Fecha Cosecha' : 'Harvest Date'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, harvestDate: true }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-lime-500"
                />
                {errors.harvestDate && <p className="text-xs text-red-500 mt-1">{errors.harvestDate}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  {lang === 'es' ? 'Fecha Empaque' : 'Packing Date'}
                </label>
                <input
                  type="date"
                  value={packingDate}
                  onChange={(e) => setPackingDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-lime-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  {lang === 'es' ? 'Fecha Producción' : 'Production Date'}
                </label>
                <input
                  type="date"
                  value={productionDate}
                  onChange={(e) => setProductionDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-lime-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  {lang === 'es' ? 'Fecha Vencimiento' : 'Expiration Date'}
                </label>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-lime-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: SENASA Quality Inspection Event */}
          <div className="space-y-3 pt-3 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-lime-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-lime-500">
                {lang === 'es' ? '3. Inspección Fitosanitaria SENASA / Control de Calidad' : '3. SENASA Phytosanitary & Quality Inspection'}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  {lang === 'es' ? 'Inspector / Certificador' : 'Inspector / Auditor'}
                </label>
                <input
                  type="text"
                  value={inspector}
                  onChange={(e) => setInspector(e.target.value)}
                  placeholder="Ej. Ing. SENASA — Certificador Oficial"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  {lang === 'es' ? 'Dictamen de Calidad' : 'Quality Verdict'}
                </label>
                <select
                  value={qualityStatus}
                  onChange={(e) => setQualityStatus(e.target.value as QualityStatus)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 font-semibold"
                >
                  <option value="PASSED">{lang === 'es' ? 'APROBADO — Conforme para Exportación' : 'PASSED — Export Ready'}</option>
                  <option value="CONDITIONALLY_ACCEPTED">{lang === 'es' ? 'ACEPTADO CONDICIONAL — Reinspección en Planta' : 'CONDITIONALLY ACCEPTED'}</option>
                  <option value="PENDING">{lang === 'es' ? 'PENDIENTE — En Espera de Laboratorio' : 'PENDING — Lab In Process'}</option>
                  <option value="REJECTED">{lang === 'es' ? 'RECHAZADO — No Apto para Exportación' : 'REJECTED — Not Eligible'}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                {lang === 'es' ? 'Observaciones Técnicas / Resultados' : 'Technical Notes / Test Results'}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Grados Brix 14.5°, materia seca 23%, ausencia de plagas cuarentenarias."
                className="w-full px-4 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-lime-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-600 text-zinc-950 text-sm font-bold shadow-lg shadow-lime-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{lang === 'es' ? 'Guardando lote...' : 'Saving batch...'}</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>
                    {isEditing
                      ? lang === 'es'
                        ? 'Actualizar Lote'
                        : 'Update Batch'
                      : lang === 'es'
                      ? 'Registrar Lote'
                      : 'Register Batch'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
