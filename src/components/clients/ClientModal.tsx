import { useState, useEffect } from 'react';
import { X, AlertCircle, AlertTriangle, Check, Loader2, Building2 } from 'lucide-react';
import type { Client, ClientDocumentType, Incoterm, PaymentTerm, Currency } from '../../types/client';

interface ClientModalProps {
  isOpen: boolean;
  client?: Client | null;
  existingDocumentNumbers: string[];
  lang: 'es' | 'en';
  onClose: () => void;
  onSubmit: (clientData: Partial<Client>) => Promise<void>;
}

const DOCUMENT_TYPES: { value: ClientDocumentType; label: string }[] = [
  { value: 'EIN', label: 'EIN (Employer Identification Number - EE.UU.)' },
  { value: 'VAT', label: 'VAT / NIF (Impuesto al Valor Añadido - Unión Europea)' },
  { value: 'TAX_ID', label: 'Tax ID General / Registro Tributario Internacional' },
  { value: 'RUC', label: 'RUC (Perú / Latinoamérica)' },
  { value: 'RFC', label: 'RFC (México)' },
  { value: 'OTRO', label: 'Otro Registro Legal de Empresa' },
];

const INCOTERMS: { value: Incoterm; label: string }[] = [
  { value: 'CIF', label: 'CIF — Cost, Insurance and Freight (Puerto destino)' },
  { value: 'FOB', label: 'FOB — Free on Board (Puerto Callao/Pisco)' },
  { value: 'CFR', label: 'CFR — Cost and Freight (Sin seguro)' },
  { value: 'DDP', label: 'DDP — Delivered Duty Paid (Entrega en almacén)' },
  { value: 'EXW', label: 'EXW — Ex Works (En planta de empaque)' },
  { value: 'FCA', label: 'FCA — Free Carrier' },
  { value: 'FAS', label: 'FAS — Free Alongside Ship' },
];

const PAYMENT_TERMS: { value: PaymentTerm; labelEs: string; labelEn: string }[] = [
  { value: 'NET_30', labelEs: 'Crédito 30 días (NET 30)', labelEn: 'Net 30 Days Credit' },
  { value: 'NET_60', labelEs: 'Crédito 60 días (NET 60)', labelEn: 'Net 60 Days Credit' },
  { value: 'ANTICIPO_30_70', labelEs: '30% Anticipo / 70% contra BL', labelEn: '30% Advance / 70% against BL' },
  { value: 'CARTA_CREDITO_LC', labelEs: 'Carta de Crédito Irrevocable (L/C)', labelEn: 'Irrevocable Letter of Credit (L/C)' },
  { value: 'CONTADO', labelEs: 'Contado contra Factura / Entrega', labelEn: 'Cash on Delivery / Immediate' },
];

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'USD', label: 'USD ($) — Dólar Estadounidense (Estándar Exportación)' },
  { value: 'EUR', label: 'EUR (€) — Euro (Comercio Europeo)' },
  { value: 'PEN', label: 'PEN (S/) — Sol Peruano (Local)' },
];

export const ClientModal = ({
  isOpen,
  client,
  existingDocumentNumbers,
  lang,
  onClose,
  onSubmit,
}: ClientModalProps) => {
  const isEditing = Boolean(client?.id);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [documentType, setDocumentType] = useState<ClientDocumentType>('EIN');
  const [documentNumber, setDocumentNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [country, setCountry] = useState('Estados Unidos');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [preferredIncoterm, setPreferredIncoterm] = useState<Incoterm>('CIF');
  const [destinationPort, setDestinationPort] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm>('NET_30');
  const [preferredCurrency, setPreferredCurrency] = useState<Currency>('USD');
  const [creditLimit, setCreditLimit] = useState<number | string>('50000');
  const [language, setLanguage] = useState('EN');

  // Validation & Error States
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (client) {
        setCompanyName(client.companyName || '');
        setDocumentType((client.documentType as ClientDocumentType) || 'EIN');
        setDocumentNumber(client.documentNumber || '');
        setContactName(client.contactName || '');
        setCountry(client.country || 'Estados Unidos');
        setEmail(client.email || '');
        setPhone(client.phone || '');
        setAddress(client.address || '');
        setPreferredIncoterm((client.preferredIncoterm as Incoterm) || 'CIF');
        setDestinationPort(client.destinationPort || '');
        setPaymentTerms((client.paymentTerms as PaymentTerm) || 'NET_30');
        setPreferredCurrency((client.preferredCurrency as Currency) || 'USD');
        setCreditLimit(client.creditLimit != null ? String(client.creditLimit) : '50000');
        setLanguage(client.language || 'EN');
      } else {
        setCompanyName('');
        setDocumentType('EIN');
        setDocumentNumber('');
        setContactName('');
        setCountry('Estados Unidos');
        setEmail('');
        setPhone('');
        setAddress('');
        setPreferredIncoterm('CIF');
        setDestinationPort('Port of Long Beach (USLGB)');
        setPaymentTerms('NET_30');
        setPreferredCurrency('USD');
        setCreditLimit('50000');
        setLanguage('EN');
      }
      setTouched({});
      setErrors({});
      setDuplicateWarning(null);
      setServerError(null);
    }
  }, [isOpen, client]);

  // Real-time validation & duplicate detection
  useEffect(() => {
    const cleanDoc = documentNumber.trim();
    if (cleanDoc) {
      const isDuplicate = existingDocumentNumbers.some(
        (d) => d === cleanDoc && (!isEditing || d !== client?.documentNumber)
      );
      if (isDuplicate) {
        setDuplicateWarning(
          lang === 'es'
            ? `Alerta de Duplicidad: El documento "${cleanDoc}" ya se encuentra registrado con otro cliente.`
            : `Duplicate Alert: Document "${cleanDoc}" is already registered to another client.`
        );
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }

    const newErrors: Record<string, string> = {};

    if (touched.companyName && !companyName.trim()) {
      newErrors.companyName = lang === 'es' ? 'La Razón Social o Empresa es obligatoria' : 'Company Name is required';
    }

    if (touched.documentNumber && !cleanDoc) {
      newErrors.documentNumber = lang === 'es' ? 'El número de identificación fiscal es obligatorio' : 'Tax ID / Document number is required';
    }

    if (touched.email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = lang === 'es' ? 'Formato de correo electrónico inválido' : 'Invalid email format';
    }

    if (touched.country && !country.trim()) {
      newErrors.country = lang === 'es' ? 'El país de destino es obligatorio' : 'Country is required';
    }

    setErrors(newErrors);
  }, [companyName, documentNumber, country, email, existingDocumentNumbers, isEditing, client, touched, lang]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    setTouched({
      companyName: true,
      documentNumber: true,
      country: true,
      email: true,
    });

    if (!companyName.trim()) {
      setErrors((p) => ({ ...p, companyName: lang === 'es' ? 'Empresa obligatoria' : 'Company required' }));
      return;
    }
    if (!documentNumber.trim()) {
      setErrors((p) => ({ ...p, documentNumber: lang === 'es' ? 'Documento obligatorio' : 'Document required' }));
      return;
    }
    if (!country.trim()) {
      setErrors((p) => ({ ...p, country: lang === 'es' ? 'País obligatorio' : 'Country required' }));
      return;
    }

    if (duplicateWarning) {
      setServerError(
        lang === 'es'
          ? 'Corrige el número de identificación fiscal duplicado antes de guardar.'
          : 'Please fix duplicate Tax ID / Document before saving.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        companyName: companyName.trim(),
        documentType,
        documentNumber: documentNumber.trim(),
        contactName: contactName.trim() || null,
        country: country.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        preferredIncoterm,
        destinationPort: destinationPort.trim() || null,
        paymentTerms,
        preferredCurrency,
        creditLimit: creditLimit ? Number(creditLimit) : null,
        language,
      });
      onClose();
    } catch (err: unknown) {
      console.error('Error al guardar cliente:', err);
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
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
                {isEditing
                  ? lang === 'es'
                    ? 'Editar Cliente Importador B2B'
                    : 'Edit B2B Importer Client'
                  : lang === 'es'
                  ? 'Registrar Nuevo Cliente B2B'
                  : 'Register New B2B Client'}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {lang === 'es'
                  ? 'Configuración de términos comerciales y documentación fiscal internacional'
                  : 'Commercial terms configuration and international customs documentation'}
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
                  {lang === 'es' ? 'Atención: Documento Fiscal Duplicado' : 'Warning: Duplicate Tax Document'}
                </span>
                <p className="text-xs opacity-90 mt-0.5">{duplicateWarning}</p>
              </div>
            </div>
          )}

          {/* Section 1: Legal Identity */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-500">
              {lang === 'es' ? '1. Identificación Legal & Tributaria' : '1. Legal & Tax Identification'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  {lang === 'es' ? 'Empresa / Razón Social' : 'Company / Legal Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, companyName: true }))}
                  placeholder="Ej. Global Fresh Imports Inc."
                  className={`w-full px-4 py-2.5 rounded-xl border bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none transition-all ${
                    errors.companyName
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-[var(--border-subtle)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
                {errors.companyName && <p className="text-xs text-red-500 mt-1">{errors.companyName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  {lang === 'es' ? 'País de Destino' : 'Destination Country'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, country: true }))}
                  placeholder="Estados Unidos"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none transition-all ${
                    errors.country
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-[var(--border-subtle)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
                {errors.country && <p className="text-xs text-red-500 mt-1">{errors.country}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  {lang === 'es' ? 'Tipo de Documento Fiscal' : 'Tax Document Type'}
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as ClientDocumentType)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
                  {lang === 'es' ? 'N° de Registro Tributario (Tax ID)' : 'Tax ID / VAT Number'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value.trim())}
                  onBlur={() => setTouched((p) => ({ ...p, documentNumber: true }))}
                  placeholder="Ej. 82-1940291 o NL854920194B01"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-[var(--bg-app)] text-[var(--text-primary)] text-sm font-mono focus:outline-none transition-all ${
                    errors.documentNumber || duplicateWarning
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-[var(--border-subtle)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
                {errors.documentNumber && <p className="text-xs text-red-500 mt-1">{errors.documentNumber}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Logistics */}
          <div className="space-y-3 pt-3 border-t border-[var(--border-subtle)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-500">
              {lang === 'es' ? '2. Contacto & Logística' : '2. Contact & Logistics'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  {lang === 'es' ? 'Trader / Director Compras' : 'Trader / Purchasing Manager'}
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Ej. John Anderson"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  {lang === 'es' ? 'Correo Electrónico' : 'Email Address'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                  placeholder="orders@company.com"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none transition-all ${
                    errors.email
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-[var(--border-subtle)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  {lang === 'es' ? 'Teléfono Internacional' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (562) 555-0199"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  {lang === 'es' ? 'Dirección de Entrega / Almacén' : 'Delivery / Warehouse Address'}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="2400 Harbor Blvd, Long Beach, CA 90802"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  {lang === 'es' ? 'Puerto Marítimo de Destino' : 'Destination Seaport'}
                </label>
                <input
                  type="text"
                  value={destinationPort}
                  onChange={(e) => setDestinationPort(e.target.value)}
                  placeholder="Port of Long Beach (USLGB)"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Commercial Terms */}
          <div className="space-y-3 pt-3 border-t border-[var(--border-subtle)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-500">
              {lang === 'es' ? '3. Términos Comerciales & Crédito' : '3. Commercial Terms & Credit'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  {lang === 'es' ? 'Incoterm Preferido' : 'Preferred Incoterm'}
                </label>
                <select
                  value={preferredIncoterm}
                  onChange={(e) => setPreferredIncoterm(e.target.value as Incoterm)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  {INCOTERMS.map((inc) => (
                    <option key={inc.value} value={inc.value}>
                      {inc.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  {lang === 'es' ? 'Condición de Pago' : 'Payment Terms'}
                </label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value as PaymentTerm)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  {PAYMENT_TERMS.map((pt) => (
                    <option key={pt.value} value={pt.value}>
                      {lang === 'es' ? pt.labelEs : pt.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  {lang === 'es' ? 'Moneda de Transacción' : 'Currency'}
                </label>
                <select
                  value={preferredCurrency}
                  onChange={(e) => setPreferredCurrency(e.target.value as Currency)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  {lang === 'es' ? 'Límite de Crédito Comercial ($)' : 'Credit Limit ($)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  placeholder="50000"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  {lang === 'es' ? 'Idioma de Comunicación' : 'Communication Language'}
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="EN">English (Inglés)</option>
                  <option value="ES">Español (Spanish)</option>
                  <option value="NL">Nederlands (Holandés)</option>
                  <option value="ZH">中文 (Chino Simplificado)</option>
                </select>
              </div>
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
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{lang === 'es' ? 'Guardando en MongoDB...' : 'Saving to MongoDB...'}</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>
                    {isEditing
                      ? lang === 'es'
                        ? 'Actualizar Cliente'
                        : 'Update Client'
                      : lang === 'es'
                      ? 'Registrar Cliente B2B'
                      : 'Register B2B Client'}
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
