import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Building2, 
  FileText, 
  Globe2, 
  MapPin, 
  Phone, 
  Anchor, 
  Coins, 
  ArrowLeft, 
  CheckCircle2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { CompanyInfo, ClientRegistrationRequest } from '../../types/auth';

const companySchema = z.object({
  companyName: z.string().min(3, 'La Razón Social debe tener al menos 3 caracteres'),
  documentType: z.enum(['RUC', 'TAX_ID', 'EIN', 'VAT']),
  documentNumber: z.string().min(5, 'El número de documento fiscal es obligatorio'),
  country: z.string().min(2, 'Selecciona el país de operación'),
  address: z.string().min(5, 'Ingresa la dirección fiscal o sede comercial'),
  phone: z.string().min(6, 'Ingresa un teléfono corporativo válido'),
  preferredIncoterm: z.enum(['FOB', 'CIF', 'CFR']),
  preferredCurrency: z.enum(['USD', 'EUR', 'PEN']),
});

type CompanyFormValues = z.infer<typeof companySchema>;

interface CompanyOnboardingFormProps {
  onBack: () => void;
  onSuccess: (request: ClientRegistrationRequest) => void;
}

const COUNTRIES = [
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'NL', name: 'Países Bajos (Holanda)', flag: '🇳🇱' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'CA', name: 'Canadá', flag: '🇨🇦' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'DE', name: 'Alemania', flag: '🇩🇪' },
];

export default function CompanyOnboardingForm({ onBack, onSuccess }: CompanyOnboardingFormProps) {
  const { tempRegistrationUser, registerClient } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: '',
      documentType: 'EIN',
      documentNumber: '',
      country: 'Estados Unidos',
      address: '',
      phone: '',
      preferredIncoterm: 'CIF',
      preferredCurrency: 'USD',
    },
  });

  const selectedIncoterm = watch('preferredIncoterm');
  const selectedCurrency = watch('preferredCurrency');

  const onSubmit = async (data: CompanyFormValues) => {
    setIsSubmitting(true);
    try {
      const companyPayload: CompanyInfo = {
        companyName: data.companyName,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        country: data.country,
        address: data.address,
        phone: data.phone,
        preferredIncoterm: data.preferredIncoterm,
        preferredCurrency: data.preferredCurrency,
      };

      const newRequest = await registerClient({
        name: tempRegistrationUser?.name || data.companyName,
        email: tempRegistrationUser?.email || 'contacto@empresa.com',
        avatar: tempRegistrationUser?.avatar,
        company: companyPayload,
        authProvider: tempRegistrationUser?.avatar ? 'GOOGLE' : 'EMAIL',
      });

      toast.success('¡Solicitud B2B enviada con éxito!', {
        description: `Tu solicitud para "${data.companyName}" ha quedado en revisión por administración.`,
      });
      onSuccess(newRequest);
    } catch {
      toast.error('Error al procesar el registro empresarial.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Botón Volver y Paso */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-hint)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          Volver a inicio
        </button>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <Sparkles size={12} />
          Paso 2 de 2: Datos de Empresa
        </span>
      </div>

      {/* Header del Onboarding */}
      <div>
        <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
          Información de tu Empresa
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Completa los datos fiscales y comerciales de tu organización para remitir tu solicitud de acceso a Visons S.A.C.
        </p>
      </div>

      {/* Badge de Cuenta Google o Correo Vinculado */}
      {tempRegistrationUser && (
        <div className="p-3 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tempRegistrationUser.avatar ? (
              <img
                src={tempRegistrationUser.avatar}
                alt={tempRegistrationUser.name}
                className="w-10 h-10 rounded-full border border-emerald-500 object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                {tempRegistrationUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[var(--text-primary)]">{tempRegistrationUser.name}</span>
                <CheckCircle2 size={13} className="text-emerald-500" />
              </div>
              <span className="text-[11px] text-[var(--text-hint)] block">{tempRegistrationUser.email}</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            {tempRegistrationUser.avatar ? 'Google Verificado' : 'Correo Verificado'}
          </span>
        </div>
      )}

      {/* Formulario de Empresa */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Razón Social */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
            <Building2 size={14} className="text-emerald-500" />
            Razón Social o Nombre Comercial *
          </label>
          <input
            type="text"
            {...register('companyName')}
            placeholder="Ej: Global Fresh Imports LLC / Agrícola del Norte S.A."
            className="w-full px-3.5 py-2.5 bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-hint)] focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
          />
          {errors.companyName && (
            <p className="text-red-500 text-xs mt-0.5">{errors.companyName.message}</p>
          )}
        </div>

        {/* Tipo y Número de Documento */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <FileText size={14} className="text-emerald-500" />
              Documento *
            </label>
            <select
              {...register('documentType')}
              className="w-full px-3 py-2.5 bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="EIN">EIN (EE.UU.)</option>
              <option value="TAX_ID">TAX ID (Global)</option>
              <option value="RUC">RUC (Perú)</option>
              <option value="VAT">VAT (Europa)</option>
            </select>
          </div>
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-[var(--text-primary)]">
              Número de Identificación Fiscal *
            </label>
            <input
              type="text"
              {...register('documentNumber')}
              placeholder="Ej: 82-1940291 o 20601234567"
              className="w-full px-3.5 py-2.5 bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-hint)] focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
            />
            {errors.documentNumber && (
              <p className="text-red-500 text-xs mt-0.5">{errors.documentNumber.message}</p>
            )}
          </div>
        </div>

        {/* País y Teléfono */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <Globe2 size={14} className="text-emerald-500" />
              País de Destino / Operación *
            </label>
            <select
              {...register('country')}
              className="w-full px-3 py-2.5 bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.name}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <Phone size={14} className="text-emerald-500" />
              Teléfono de Contacto B2B *
            </label>
            <input
              type="text"
              {...register('phone')}
              placeholder="+1 (562) 555-0199"
              className="w-full px-3.5 py-2.5 bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-hint)] focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-0.5">{errors.phone.message}</p>
            )}
          </div>
        </div>

        {/* Dirección */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
            <MapPin size={14} className="text-emerald-500" />
            Dirección Fiscal o Almacén *
          </label>
          <input
            type="text"
            {...register('address')}
            placeholder="Calle, Número, Ciudad, Estado / Código Postal"
            className="w-full px-3.5 py-2.5 bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-hint)] focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
          />
          {errors.address && (
            <p className="text-red-500 text-xs mt-0.5">{errors.address.message}</p>
          )}
        </div>

        {/* Preferencias Comerciales: Incoterm & Moneda */}
        <div className="p-3.5 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-3">
          <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider block">
            Condiciones de Negociación Preferidas
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Incoterm */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                <Anchor size={13} className="text-blue-500" />
                Incoterm Habitual
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['CIF', 'FOB', 'CFR'] as const).map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => setValue('preferredIncoterm', inc)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                      selectedIncoterm === inc
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        : 'border-[var(--border-subtle)] text-[var(--text-hint)] hover:bg-[var(--surface-card)]'
                    }`}
                  >
                    {inc}
                  </button>
                ))}
              </div>
            </div>

            {/* Moneda */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                <Coins size={13} className="text-amber-500" />
                Moneda de Liquidación
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['USD', 'EUR', 'PEN'] as const).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setValue('preferredCurrency', curr)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                      selectedCurrency === curr
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        : 'border-[var(--border-subtle)] text-[var(--text-hint)] hover:bg-[var(--surface-card)]'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Botón de Finalización */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Finalizar Onboarding y Entrar al Dashboard</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
