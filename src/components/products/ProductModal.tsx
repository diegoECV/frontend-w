import { useState, useEffect } from 'react';
import { X, AlertCircle, AlertTriangle, Check, Loader2, Sparkles } from 'lucide-react';
import type { Product, ProductCategory, ProductUnitMeasure } from '../../types/product';

interface ProductModalProps {
  isOpen: boolean;
  product?: Product | null;
  existingCodes: string[];
  lang: 'es' | 'en';
  onClose: () => void;
  onSubmit: (productData: Partial<Product>) => Promise<void>;
}

const CATEGORIES: { value: ProductCategory; labelEs: string; labelEn: string }[] = [
  { value: 'PALTAS', labelEs: 'Paltas (Aguacates)', labelEn: 'Avocados' },
  { value: 'MANGOS', labelEs: 'Mangos de Exportación', labelEn: 'Export Mangoes' },
  { value: 'ARANDANOS', labelEs: 'Arándanos Frescos (Blueberries)', labelEn: 'Fresh Blueberries' },
  { value: 'UVAS', labelEs: 'Uvas de Mesa', labelEn: 'Table Grapes' },
  { value: 'CITRICOS', labelEs: 'Cítricos (Mandarina / Limón)', labelEn: 'Citrus' },
  { value: 'ESPARRAGOS', labelEs: 'Espárragos Verdes', labelEn: 'Green Asparagus' },
  { value: 'OTRO', labelEs: 'Otro Producto Agroindustrial', labelEn: 'Other Agro Product' },
];

const UNIT_MEASURES: { value: ProductUnitMeasure; label: string }[] = [
  { value: 'CAJA_4KG', label: 'Caja de 4.0 Kg (Export Standard)' },
  { value: 'CAJA_10KG', label: 'Caja de 10.0 Kg (Bulk / Retail)' },
  { value: 'CAJA_4.5KG', label: 'Caja de 4.5 Kg (Flat)' },
  { value: 'PALLET', label: 'Pallet Completo (Reefer)' },
  { value: 'TM', label: 'Tonelada Métrica (TM)' },
  { value: 'KG', label: 'Kilogramo (Kg)' },
];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  product,
  existingCodes,
  lang,
  onClose,
  onSubmit,
}) => {
  const isEditing = Boolean(product?.id);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string>('PALTAS');
  const [variety, setVariety] = useState('');
  const [caliber, setCaliber] = useState('');
  const [unitMeasure, setUnitMeasure] = useState<string>('CAJA_4KG');
  const [hsCode, setHsCode] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Validation & Error States
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form when modal opens or product changes
  useEffect(() => {
    if (isOpen) {
      if (product) {
        setCode(product.code || '');
        setName(product.name || '');
        setCategoryId(product.categoryId || 'PALTAS');
        setVariety(product.variety || '');
        setCaliber(product.caliber || '');
        setUnitMeasure(product.unitMeasure || 'CAJA_4KG');
        setHsCode(product.hsCode || '');
        setIsActive(product.isActive ?? true);
      } else {
        // Auto-suggest next code
        const nextNum = existingCodes.length + 1;
        const suggestedCode = `PROD-${String(nextNum).padStart(3, '0')}`;
        setCode(suggestedCode);
        setName('');
        setCategoryId('PALTAS');
        setVariety('Hass');
        setCaliber('Calibre 14');
        setUnitMeasure('CAJA_4KG');
        setHsCode('0804.40.00.00');
        setIsActive(true);
      }
      setTouched({});
      setErrors({});
      setDuplicateWarning(null);
      setServerError(null);
    }
  }, [isOpen, product]);

  // Real-time duplicate & validation check
  useEffect(() => {
    const trimmedCode = code.trim().toUpperCase();
    if (trimmedCode) {
      const isDuplicate = existingCodes.some(
        (c) => c.toUpperCase() === trimmedCode && (!isEditing || c.toUpperCase() !== product?.code?.toUpperCase())
      );
      if (isDuplicate) {
        setDuplicateWarning(
          lang === 'es'
            ? `Alerta de Duplicidad: El código "${trimmedCode}" ya existe en el catálogo.`
            : `Duplicate Alert: Code "${trimmedCode}" already exists in the catalog.`
        );
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }

    // Field-level error validation
    const newErrors: Record<string, string> = {};
    if (touched.code && !code.trim()) {
      newErrors.code = lang === 'es' ? 'El código es obligatorio' : 'Product code is required';
    }
    if (touched.name && !name.trim()) {
      newErrors.name = lang === 'es' ? 'El nombre del producto es obligatorio' : 'Product name is required';
    } else if (touched.name && name.trim().length < 3) {
      newErrors.name = lang === 'es' ? 'Debe tener al menos 3 caracteres' : 'Must have at least 3 characters';
    }
    setErrors(newErrors);
  }, [code, name, existingCodes, isEditing, product, touched, lang]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Mark all as touched
    setTouched({ code: true, name: true });

    // Validate
    if (!code.trim()) {
      setErrors((prev) => ({
        ...prev,
        code: lang === 'es' ? 'El código es obligatorio' : 'Product code is required',
      }));
      return;
    }
    if (!name.trim()) {
      setErrors((prev) => ({
        ...prev,
        name: lang === 'es' ? 'El nombre es obligatorio' : 'Product name is required',
      }));
      return;
    }

    // Prevent submitting duplicate code
    if (duplicateWarning) {
      setServerError(
        lang === 'es'
          ? 'Corrige el código duplicado antes de guardar.'
          : 'Please fix duplicate code before saving.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        categoryId,
        variety: variety.trim() || null,
        caliber: caliber.trim() || null,
        unitMeasure,
        hsCode: hsCode.trim() || null,
        isActive,
      });
      onClose();
    } catch (err: unknown) {
      console.error('Error al guardar producto:', err);
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
      <div className="relative w-full max-w-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl shadow-2xl overflow-hidden my-8 text-left">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
                {isEditing
                  ? lang === 'es'
                    ? 'Editar Producto de Exportación'
                    : 'Edit Export Product'
                  : lang === 'es'
                  ? 'Registrar Nuevo Producto'
                  : 'Register New Product'}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {lang === 'es'
                  ? 'Catálogo comercial sincronizado con base de datos MongoDB'
                  : 'Commercial catalog synced with MongoDB database'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-[var(--surface-card)]">
          {/* Server Error Alert Banner */}
          {serverError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-500 animate-shake">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <span className="font-semibold block">
                  {lang === 'es' ? 'Fallo al procesar la solicitud:' : 'Request failed:'}
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
                  {lang === 'es' ? 'Atención: Registro Duplicado' : 'Warning: Duplicate Entry'}
                </span>
                <p className="text-xs opacity-90 mt-0.5">{duplicateWarning}</p>
              </div>
            </div>
          )}

          {/* Row 1: Code and Name */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                {lang === 'es' ? 'Código de Catálogo' : 'Catalog Code'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onBlur={() => setTouched((p) => ({ ...p, code: true }))}
                placeholder="Ej. PROD-AVO-01"
                className={`w-full px-4 py-2.5 rounded-xl border bg-[var(--bg-app)] text-[var(--text-primary)] text-sm font-mono focus:outline-none transition-all ${
                  errors.code || duplicateWarning
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-[var(--border-subtle)] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                }`}
              />
              {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                {lang === 'es' ? 'Nombre Comercial del Producto' : 'Commercial Product Name'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                placeholder="Ej. Palta Hass Calibre 14 Premium Export"
                className={`w-full px-4 py-2.5 rounded-xl border bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none transition-all ${
                  errors.name
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-[var(--border-subtle)] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                }`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
          </div>

          {/* Row 2: Category, Variety, Caliber */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                {lang === 'es' ? 'Categoría' : 'Category'}
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {lang === 'es' ? cat.labelEs : cat.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                {lang === 'es' ? 'Variedad Botánica' : 'Botanical Variety'}
              </label>
              <input
                type="text"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder="Ej. Hass, Kent, Biloxi"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                {lang === 'es' ? 'Calibre / Tamaño' : 'Caliber / Size'}
              </label>
              <input
                type="text"
                value={caliber}
                onChange={(e) => setCaliber(e.target.value)}
                placeholder="Ej. Calibre 12-14, Jumbo"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Row 3: Unit Measure, HS Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                {lang === 'es' ? 'Unidad de Medida Comercial' : 'Commercial Unit of Measure'}
              </label>
              <select
                value={unitMeasure}
                onChange={(e) => setUnitMeasure(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              >
                {UNIT_MEASURES.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                {lang === 'es' ? 'Partida Arancelaria (HS Code)' : 'HS Tariff Code'}
              </label>
              <input
                type="text"
                value={hsCode}
                onChange={(e) => setHsCode(e.target.value)}
                placeholder="Ej. 0804.40.00.00"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm font-mono focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
              <p className="text-[11px] text-[var(--text-hint)] mt-1">
                {lang === 'es'
                  ? 'Código arancelario oficial de exportación SUNAT/Aduanas.'
                  : 'Official customs tariff code for international shipment.'}
              </p>
            </div>
          </div>

          {/* Row 4: Status Toggle */}
          <div className="p-4 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-[var(--text-primary)] block">
                {lang === 'es' ? 'Estado en Catálogo' : 'Catalog Status'}
              </span>
              <p className="text-xs text-[var(--text-secondary)]">
                {isActive
                  ? lang === 'es'
                    ? 'Producto activo y visible para cotizaciones y pedidos B2B.'
                    : 'Active product available for B2B quotation and orders.'
                  : lang === 'es'
                  ? 'Producto temporalmente suspendido fuera de temporada.'
                  : 'Product currently suspended / out of season.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isActive ? 'bg-emerald-500' : 'bg-zinc-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isActive ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
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
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{lang === 'es' ? 'Guardando en backend...' : 'Saving to backend...'}</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>
                    {isEditing
                      ? lang === 'es'
                        ? 'Actualizar Producto'
                        : 'Update Product'
                      : lang === 'es'
                      ? 'Registrar Producto'
                      : 'Register Product'}
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
