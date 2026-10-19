import { useState, useEffect } from 'react';
import { X, AlertCircle, AlertTriangle, Check, Loader2, Building, ShieldCheck } from 'lucide-react';
import type { Provider, ProviderDocumentType, ProviderCertification } from '../../types/provider';

interface ProviderModalProps {
  isOpen: boolean;
  provider?: Provider | null;
  existingDocumentNumbers: string[];
  lang: 'es' | 'en';
  onClose: () => void;
  onSubmit: (providerData: Partial<Provider>) => Promise<void>;
}

const DOCUMENT_TYPES: { value: ProviderDocumentType; label: string }[] = [
  { value: 'RUC', label: 'RUC (Registro Único de Contribuyente - 11 dígitos)' },
  { value: 'DNI', label: 'DNI (Documento Nacional de Identidad - 8 dígitos)' },
  { value: 'CE', label: 'Carné de Extranjería (CE)' },
  { value: 'PASAPORTE', label: 'Pasaporte Internacional' },
];

const CERTIFICATIONS: { value: ProviderCertification; labelEs: string; labelEn: string; color: string }[] = [
  { value: 'GLOBAL_GAP', labelEs: 'GLOBAL G.A.P. (Buenas Prácticas Agrícolas)', labelEn: 'GLOBAL G.A.P. (Certified)', color: 'emerald' },
  { value: 'SENASA_VIGENTE', labelEs: 'SENASA Certificado Fitosanitario Oficial', labelEn: 'Official SENASA Certified', color: 'blue' },
  { value: 'ORGANIC_USDA', labelEs: 'Certificación Orgánica (USDA Organic / UE)', labelEn: 'USDA / EU Organic', color: 'green' },
  { value: 'SMETA', labelEs: 'SMETA / Sedex (Auditoría Ética & Laboral)', labelEn: 'SMETA / Sedex Ethical Audit', color: 'purple' },
  { value: 'BRCGS', labelEs: 'BRCGS Food Safety (Inocuidad)', labelEn: 'BRCGS Food Safety', color: 'indigo' },
  { value: 'EN_TRAMITE', labelEs: 'Auditoría en Trámite / En Proceso', labelEn: 'Audit Pending / In Process', color: 'amber' },
  { value: 'NO_CERTIFICADO', labelEs: 'Sin Certificación Registrada', labelEn: 'Not Certified', color: 'zinc' },
];

export const ProviderModal: React.FC<ProviderModalProps> = ({
  isOpen,
  provider,
  existingDocumentNumbers,
  lang,
  onClose,
  onSubmit,
}) => {
  const isEditing = Boolean(provider?.id);

  // Form State
  const [documentType, setDocumentType] = useState<ProviderDocumentType>('RUC');
  const [documentNumber, setDocumentNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [country, setCountry] = useState('Perú');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [ubigeo, setUbigeo] = useState('');
  const [bankAccountCci, setBankAccountCci] = useState('');
  const [certificationStatus, setCertificationStatus] = useState<ProviderCertification>('GLOBAL_GAP');

  // Validation State
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (provider) {
        setDocumentType((provider.documentType as ProviderDocumentType) || 'RUC');
        setDocumentNumber(provider.documentNumber || '');
        setCompanyName(provider.companyName || '');
        setContactName(provider.contactName || '');
        setCountry(provider.country || 'Perú');
        setEmail(provider.email || '');
        setPhone(provider.phone || '');
        setAddress(provider.address || '');
        setUbigeo(provider.ubigeo || '');
        setBankAccountCci(provider.bankAccountCci || '');
        setCertificationStatus((provider.certificationStatus as ProviderCertification) || 'GLOBAL_GAP');
      } else {
        setDocumentType('RUC');
        setDocumentNumber('');
        setCompanyName('');
        setContactName('');
        setCountry('Perú');
        setEmail('');
        setPhone('');
        setAddress('');
        setUbigeo('150401'); // Cañete default
        setBankAccountCci('');
        setCertificationStatus('GLOBAL_GAP');
      }
      setTouched({});
      setErrors({});
      setDuplicateWarning(null);
      setServerError(null);
    }
  }, [isOpen, provider]);

  // Real-time validation & duplicate detection
  useEffect(() => {
    const cleanDoc = documentNumber.trim();
    if (cleanDoc) {
      const isDuplicate = existingDocumentNumbers.some(
        (d) => d === cleanDoc && (!isEditing || d !== provider?.documentNumber)
      );
      if (isDuplicate) {
        setDuplicateWarning(
          lang === 'es'
            ? `Alerta de Duplicidad: El documento "${cleanDoc}" ya pertenece a otro proveedor registrado.`
            : `Duplicate Alert: Document "${cleanDoc}" already belongs to another registered supplier.`
        );
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }

    const newErrors: Record<string, string> = {};

    if (touched.documentNumber) {
      if (!cleanDoc) {
        newErrors.documentNumber = lang === 'es' ? 'El número de documento es obligatorio' : 'Document number is required';
      } else if (documentType === 'RUC') {
        if (!/^\d{11}$/.test(cleanDoc)) {
          newErrors.documentNumber = lang === 'es' ? 'El RUC debe tener exactamente 11 dígitos numéricos' : 'RUC must have 11 digits';
        } else if (!cleanDoc.startsWith('10') && !cleanDoc.startsWith('20')) {
          newErrors.documentNumber = lang === 'es' ? 'El RUC peruano válido inicia con 10 o 20' : 'Peruvian RUC starts with 10 or 20';
        }
      } else if (documentType === 'DNI' && !/^\d{8}$/.test(cleanDoc)) {
        newErrors.documentNumber = lang === 'es' ? 'El DNI debe tener 8 dígitos numéricos' : 'DNI must have 8 digits';
      }
    }

    if (touched.companyName && !companyName.trim()) {
      newErrors.companyName = lang === 'es' ? 'La Razón Social o Fundo es obligatorio' : 'Company or Farm name is required';
    }

    if (touched.email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = lang === 'es' ? 'Formato de correo electrónico inválido' : 'Invalid email format';
    }

    if (touched.ubigeo && ubigeo.trim() && !/^\d{6}$/.test(ubigeo.trim())) {
      newErrors.ubigeo = lang === 'es' ? 'El código Ubigeo debe tener 6 dígitos' : 'Ubigeo must have 6 digits';
    }

    if (touched.bankAccountCci && bankAccountCci.trim() && bankAccountCci.replace(/[-\s]/g, '').length !== 20) {
      newErrors.bankAccountCci = lang === 'es' ? 'El código CCI bancario interbancario debe tener 20 dígitos' : 'Bank CCI must have 20 digits';
    }

    setErrors(newErrors);
  }, [documentNumber, documentType, companyName, email, ubigeo, bankAccountCci, existingDocumentNumbers, isEditing, provider, touched, lang]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Touch required fields
    setTouched({
      documentNumber: true,
      companyName: true,
      email: true,
      ubigeo: true,
      bankAccountCci: true,
    });

    if (!documentNumber.trim()) {
      setErrors((p) => ({ ...p, documentNumber: lang === 'es' ? 'Documento obligatorio' : 'Document required' }));
      return;
    }
    if (!companyName.trim()) {
      setErrors((p) => ({ ...p, companyName: lang === 'es' ? 'Razón Social obligatoria' : 'Company name required' }));
      return;
    }
    if (duplicateWarning) {
      setServerError(
        lang === 'es'
          ? 'Corrige el número de documento duplicado antes de guardar.'
          : 'Please fix duplicate document number before saving.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        documentType,
        documentNumber: documentNumber.trim(),
        companyName: companyName.trim(),
        contactName: contactName.trim() || null,
        country: country.trim() || 'Perú',
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        ubigeo: ubigeo.trim() || null,
        bankAccountCci: bankAccountCci.trim() || null,
        certificationStatus,
      });
      onClose();
    } catch (err: unknown) {
      console.error('Error al guardar proveedor:', err);
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
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Building size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
                {isEditing
                  ? lang === 'es'
                    ? 'Editar Proveedor Agrícola'
                    : 'Edit Agricultural Supplier'
                  : lang === 'es'
                  ? 'Registrar Nuevo Proveedor / Productor'
                  : 'Register New Supplier / Farm'}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {lang === 'es'
                  ? 'Red de agricultores y fundos certificados para agroexportación'
                  : 'Network of certified farms and growers for agroexport'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-[var(--surface-card)]">
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
                  {lang === 'es' ? 'Atención: Documento Duplicado' : 'Warning: Duplicate Document'}
                </span>
                <p className="text-xs opacity-90 mt-0.5">{duplicateWarning}</p>
              </div>
            </div>
          )}

          {/* Row 1: Document Type, Document Number, Company Name */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                {lang === 'es' ? 'Tipo Documento' : 'Document Type'} <span className="text-red-500">*</span>
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as ProviderDocumentType)}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                {DOCUMENT_TYPES.map((dt) => (
                  <option key={dt.value} value={dt.value}>
                    {dt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                {lang === 'es' ? 'N° de Documento / RUC' : 'Document / RUC No.'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value.replace(/\D/g, ''))}
                onBlur={() => setTouched((p) => ({ ...p, documentNumber: true }))}
                placeholder={documentType === 'RUC' ? '20485960312 (11 dígitos)' : '12345678'}
                className={`w-full px-4 py-2.5 rounded-xl border bg-[var(--bg-app)] text-[var(--text-primary)] text-sm font-mono focus:outline-none transition-all ${
                  errors.documentNumber || duplicateWarning
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-[var(--border-subtle)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
              {errors.documentNumber && <p className="text-xs text-red-500 mt-1">{errors.documentNumber}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                {lang === 'es' ? 'Razón Social o Fundo' : 'Company or Farm Name'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, companyName: true }))}
                placeholder="Ej. Agrícola Cañete S.A.C."
                className={`w-full px-4 py-2.5 rounded-xl border bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none transition-all ${
                  errors.companyName
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-[var(--border-subtle)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
              {errors.companyName && <p className="text-xs text-red-500 mt-1">{errors.companyName}</p>}
            </div>
          </div>

          {/* Row 2: Contact Name, Country, Certification */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                {lang === 'es' ? 'Contacto / Administrador' : 'Contact / Farm Manager'}
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Ej. Manuel Mendoza"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                {lang === 'es' ? 'País de Origen' : 'Country of Origin'}
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Perú"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                {lang === 'es' ? 'Certificación Agrícola' : 'Agricultural Certification'}
              </label>
              <select
                value={certificationStatus}
                onChange={(e) => setCertificationStatus(e.target.value as ProviderCertification)}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                {CERTIFICATIONS.map((cert) => (
                  <option key={cert.value} value={cert.value}>
                    {lang === 'es' ? cert.labelEs : cert.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Email and Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                {lang === 'es' ? 'Correo Electrónico de Contacto' : 'Contact Email'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                placeholder="ventas@agricola.pe"
                className={`w-full px-4 py-2.5 rounded-xl border bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none transition-all ${
                  errors.email
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-[var(--border-subtle)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                {lang === 'es' ? 'Teléfono / WhatsApp' : 'Phone / WhatsApp'}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+51 987 654 321"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Row 4: Address, Ubigeo, Bank CCI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                {lang === 'es' ? 'Ubicación / Fundo' : 'Farm Location / Address'}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Valle Hermoso Km 42, Cañete"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                {lang === 'es' ? 'Código Ubigeo (6 dígitos)' : 'Ubigeo Code (6 digits)'}
              </label>
              <input
                type="text"
                value={ubigeo}
                onChange={(e) => setUbigeo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onBlur={() => setTouched((p) => ({ ...p, ubigeo: true }))}
                placeholder="150401 (Cañete)"
                className={`w-full px-4 py-2.5 rounded-xl border bg-[var(--bg-app)] text-[var(--text-primary)] text-sm font-mono focus:outline-none transition-all ${
                  errors.ubigeo
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-[var(--border-subtle)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
              {errors.ubigeo && <p className="text-xs text-red-500 mt-1">{errors.ubigeo}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                {lang === 'es' ? 'Cuenta CCI (20 dígitos)' : 'Bank CCI (20 digits)'}
              </label>
              <input
                type="text"
                value={bankAccountCci}
                onChange={(e) => setBankAccountCci(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, bankAccountCci: true }))}
                placeholder="002-191-000000000000-54"
                className={`w-full px-4 py-2.5 rounded-xl border bg-[var(--bg-app)] text-[var(--text-primary)] text-sm font-mono focus:outline-none transition-all ${
                  errors.bankAccountCci
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-[var(--border-subtle)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
              {errors.bankAccountCci && <p className="text-xs text-red-500 mt-1">{errors.bankAccountCci}</p>}
            </div>
          </div>

          {/* Certification Badge Notice */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3 text-xs text-emerald-400">
            <ShieldCheck size={18} className="shrink-0" />
            <span>
              {lang === 'es'
                ? 'Los proveedores con certificación GLOBAL G.A.P. o SENASA están habilitados para asignación inmediata en lotes de exportación hacia EE.UU. y Europa.'
                : 'Suppliers with GLOBAL G.A.P. or SENASA certification are immediately eligible for export lot allocation to the US and Europe.'}
            </span>
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
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
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
                        ? 'Actualizar Proveedor'
                        : 'Update Supplier'
                      : lang === 'es'
                      ? 'Registrar Proveedor'
                      : 'Register Supplier'}
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
