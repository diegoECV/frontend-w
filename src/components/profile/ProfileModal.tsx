// =============================================================================
// MODAL: MI PERFIL CORPORATIVO — VISONS S.A.C.
// Edición de datos personales, teléfono, departamento, avatar y empresa B2B
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Camera,
  Loader2,
  Globe,
  FileText,
  MapPin,
  DollarSign,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { updateUser as updateBackendUser } from '../../api/userApi';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'es' | 'en';
}

const PRESET_AVATARS = [
  {
    label: 'Ejecutivo / Directivo',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
  },
  {
    label: 'Ingeniero Agrónomo',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
  },
  {
    label: 'Control de Calidad',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80',
  },
  {
    label: 'Logística & Comercio',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
  },
];

const DEPARTMENTS = [
  'Dirección General & Operaciones',
  'Sistemas & Tecnologías de Información',
  'Control de Calidad & Certificaciones',
  'Logística, Packing & Despacho Marítimo',
  'Comercial & Exportaciones B2B',
  'Finanzas, Costos & Contabilidad',
  'Importación & Retail Internacional',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, lang }) => {
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    avatar: '',
    companyName: '',
    documentNumber: '',
    country: '',
    address: '',
    preferredIncoterm: 'CIF',
    preferredCurrency: 'USD',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'empresa'>('personal');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '+51 988 222 333',
        department: user.department || 'Dirección General & Operaciones',
        avatar: user.avatar || '',
        companyName: user.company?.companyName || '',
        documentNumber: user.company?.documentNumber || '',
        country: user.company?.country || 'Perú',
        address: user.company?.address || 'Panamericana Sur Km 298, Subtanjalla, Ica',
        preferredIncoterm: user.company?.preferredIncoterm || 'CIF',
        preferredCurrency: user.company?.preferredCurrency || 'USD',
      });
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updatedProfile = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        department: formData.department.trim(),
        avatar: formData.avatar.trim(),
        ...(user.company || formData.companyName
          ? {
              company: {
                companyName: formData.companyName || user.company?.companyName || 'Visons S.A.C.',
                documentType: user.company?.documentType || 'RUC',
                documentNumber: formData.documentNumber || user.company?.documentNumber || '20601234567',
                country: formData.country || 'Perú',
                address: formData.address || 'Ica, Perú',
                phone: formData.phone,
                preferredIncoterm: formData.preferredIncoterm as 'FOB' | 'CIF' | 'CFR',
                preferredCurrency: formData.preferredCurrency as 'USD' | 'EUR' | 'PEN',
              },
            }
          : {}),
      };

      // 1. Actualizar en el estado y almacenamiento local
      updateUser(updatedProfile);

      // 2. Intentar sincronizar con el backend de MongoDB/Spring Boot si tiene ID válido
      if (user.id) {
        try {
          await updateBackendUser(user.id, {
            name: updatedProfile.name,
            email: updatedProfile.email,
            phone: updatedProfile.phone,
            department: updatedProfile.department,
          });
        } catch (backendErr) {
          console.warn('Sincronización backend secundaria no disponible:', backendErr);
        }
      }

      toast.success(
        lang === 'es' ? 'Perfil actualizado con éxito' : 'Profile updated successfully',
        {
          description:
            lang === 'es'
              ? 'Tus datos corporativos se han guardado correctamente.'
              : 'Your corporate profile details have been updated.',
        }
      );
      onClose();
    } catch {
      toast.error(
        lang === 'es' ? 'Error al actualizar perfil' : 'Failed to update profile'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header con gradiente suave */}
        <div className="relative px-6 py-5 border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <User size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[var(--text-primary)]">
                    {lang === 'es' ? 'Mi Perfil de Usuario' : 'My User Profile'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {user.role}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-hint)] mt-0.5">
                  {lang === 'es'
                    ? 'Identidad, contacto y credenciales corporativas en Visons S.A.C.'
                    : 'Corporate identity, contact and credentials in Visons S.A.C.'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--text-hint)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Selector de pestañas si el usuario tiene empresa asociada */}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'personal'
                  ? 'bg-[var(--surface-card)] text-emerald-600 dark:text-emerald-400 border border-[var(--border-subtle)] shadow-sm'
                  : 'text-[var(--text-hint)] hover:text-[var(--text-primary)]'
              }`}
            >
              <User size={14} />
              {lang === 'es' ? 'Datos Personales' : 'Personal Info'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('empresa')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'empresa'
                  ? 'bg-[var(--surface-card)] text-emerald-600 dark:text-emerald-400 border border-[var(--border-subtle)] shadow-sm'
                  : 'text-[var(--text-hint)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Briefcase size={14} />
              {lang === 'es' ? 'Entidad B2B & Sede' : 'B2B Entity & Hub'}
            </button>
          </div>
        </div>

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {activeTab === 'personal' && (
            <>
              {/* Sección de Avatar con presets rápidos */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                <div className="relative group shrink-0">
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt={formData.name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-lg shadow-emerald-500/10"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-emerald-600/10">
                      {(formData.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer pointer-events-none text-white">
                    <Camera size={20} />
                  </div>
                </div>

                <div className="flex-1 w-full space-y-2">
                  <label className="block text-xs font-bold text-[var(--text-primary)]">
                    {lang === 'es' ? 'Foto de Perfil / Avatar' : 'Profile Picture / Avatar'}
                  </label>
                  <input
                    type="url"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    placeholder="https://ejemplo.com/avatar.jpg"
                    className="w-full px-3 py-1.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-hint)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-[var(--text-hint)] font-medium mr-1">
                      {lang === 'es' ? 'Sugerencias:' : 'Presets:'}
                    </span>
                    {PRESET_AVATARS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, avatar: preset.url })}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-emerald-500 text-[var(--text-secondary)] hover:text-emerald-500 transition-all cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                    {formData.avatar && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, avatar: '' })}
                        className="text-[10px] text-rose-500 hover:underline cursor-pointer ml-1"
                      >
                        {lang === 'es' ? 'Quitar foto' : 'Remove'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Nombre y Correo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                    {lang === 'es' ? 'Nombre Completo' : 'Full Name'} *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-hint)]">
                      <User size={15} />
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Diego Centeno"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-hint)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                    {lang === 'es' ? 'Correo Electrónico Corporativo' : 'Corporate Email'} *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-hint)]">
                      <Mail size={15} />
                    </div>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="diego@visons.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-hint)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Teléfono y Departamento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                    {lang === 'es' ? 'Teléfono Móvil / WhatsApp' : 'Mobile Phone / WhatsApp'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-hint)]">
                      <Phone size={15} />
                    </div>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+51 988 222 333"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-hint)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                    {lang === 'es' ? 'Área o Departamento' : 'Area or Department'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-hint)]">
                      <Building2 size={15} />
                    </div>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Ficha de Nivel de Privilegios */}
              <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-3">
                <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-[var(--text-primary)]">
                    {lang === 'es' ? 'Nivel de Acceso Corporativo' : 'Corporate Access Level'}
                  </p>
                  <p className="text-[11px] text-[var(--text-hint)] mt-0.5 leading-relaxed">
                    {lang === 'es'
                      ? `Tu cuenta cuenta con privilegios de rol "${user.role}". Tienes autorización completa para operaciones de exportación, inventario de uvas/paltas y emisión de trazabilidad.`
                      : `Your account operates under role "${user.role}". You hold full authorization for fruit export operations, inventory management and traceability certificates.`}
                  </p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'empresa' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                    {lang === 'es' ? 'Razón Social / Entidad' : 'Legal Company Name'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-hint)]">
                      <Building2 size={15} />
                    </div>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="Visons S.A.C."
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                    {lang === 'es' ? 'RUC / Tax ID / EIN' : 'Document Number / Tax ID'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-hint)]">
                      <FileText size={15} />
                    </div>
                    <input
                      type="text"
                      value={formData.documentNumber}
                      onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                      placeholder="20601234567"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                    {lang === 'es' ? 'País de Origen / Registro' : 'Country'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-hint)]">
                      <Globe size={15} />
                    </div>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="Perú"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                    {lang === 'es' ? 'Dirección de Sede / Planta' : 'Address / Packing Plant'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-hint)]">
                      <MapPin size={15} />
                    </div>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Panamericana Sur Km 298, Subtanjalla, Ica"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                    {lang === 'es' ? 'Incoterm Preferido' : 'Preferred Incoterm'}
                  </label>
                  <select
                    value={formData.preferredIncoterm}
                    onChange={(e) => setFormData({ ...formData, preferredIncoterm: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    <option value="CIF">CIF — Cost, Insurance & Freight</option>
                    <option value="FOB">FOB — Free On Board (Callao / Pisco)</option>
                    <option value="CFR">CFR — Cost and Freight</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                    {lang === 'es' ? 'Moneda de Transacción' : 'Preferred Currency'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-hint)]">
                      <DollarSign size={15} />
                    </div>
                    <select
                      value={formData.preferredCurrency}
                      onChange={(e) => setFormData({ ...formData, preferredCurrency: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                    >
                      <option value="USD">USD ($) — Dólares Americanos</option>
                      <option value="PEN">PEN (S/.) — Soles Peruanos</option>
                      <option value="EUR">EUR (€) — Euros</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)] transition-colors cursor-pointer"
          >
            {lang === 'es' ? 'Cancelar' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {lang === 'es' ? 'Guardando en Base de Datos...' : 'Saving...'}
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                {lang === 'es' ? 'Guardar Cambios' : 'Save Changes'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
