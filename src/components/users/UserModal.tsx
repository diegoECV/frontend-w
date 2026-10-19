import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Mail,
  Lock,
  Phone,
  Shield,
  Briefcase,
  AlertCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import type { User, UserRole, UserDepartment } from '../../types/user';

interface UserModalProps {
  isOpen: boolean;
  user: User | null;
  existingUsers: User[];
  isLoading: boolean;
  lang: 'es' | 'en';
  onSave: (userData: Partial<User>) => Promise<boolean | void>;
  onClose: () => void;
}

const DEPARTMENTS: UserDepartment[] = [
  'Administración',
  'Operaciones',
  'Control de Calidad',
  'Comercial & Exportación',
  'Finanzas & Facturación',
  'Logística & Almacén',
];

const ROLES: { value: UserRole; labelEs: string; labelEn: string; descEs: string; descEn: string; color: string }[] = [
  {
    value: 'ADMIN',
    labelEs: 'Super Administrador (Full RBAC)',
    labelEn: 'Super Administrator (Full RBAC)',
    descEs: 'Acceso total a todos los módulos, gestión de usuarios, auditoría y configuraciones.',
    descEn: 'Full access to all panels, user management, audit logs and system settings.',
    color: 'rose',
  },
  {
    value: 'WORKER',
    labelEs: 'Trabajador / Operador de Planta',
    labelEn: 'Worker / Plant Operator',
    descEs: 'Registro de lotes, inspección de calidad en packing y supervisión de embarques.',
    descEn: 'Batch logging, quality inspections at packing facility and shipment tracking.',
    color: 'blue',
  },
  {
    value: 'CLIENT',
    labelEs: 'Cliente B2B / Importador',
    labelEn: 'B2B Client / Importer',
    descEs: 'Portal de autoservicio para consulta de catálogos, seguimiento de pedidos y facturas.',
    descEn: 'Self-service portal for catalog requests, order tracking and tax invoices.',
    color: 'emerald',
  },
  {
    value: 'OPERATOR',
    labelEs: 'Operador Logístico / Despacho',
    labelEn: 'Logistics Operator / Dispatch',
    descEs: 'Gestión de guías de remisión, precintos de seguridad y contenedores marítimos.',
    descEn: 'Waybill management, security seals and ocean reefer container dispatch.',
    color: 'amber',
  },
];

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  user,
  existingUsers,
  isLoading,
  lang,
  onSave,
  onClose,
}) => {
  const isEditing = Boolean(user);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    role: 'WORKER' as UserRole,
    department: 'Operaciones',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Cargar datos cuando se abre para edición o inicializar para nuevo
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        password: '',
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: (user.role as UserRole) || 'WORKER',
        department: user.department || 'Operaciones',
        isActive: user.isActive !== undefined ? user.isActive : true,
      });
    } else {
      setFormData({
        username: '',
        password: '',
        name: '',
        email: '',
        phone: '',
        role: 'WORKER',
        department: 'Operaciones',
        isActive: true,
      });
    }
    setErrors({});
    setSubmissionError(null);
  }, [user, isOpen]);

  // Detección de duplicados en tiempo real
  const normalizedEmail = formData.email.trim().toLowerCase();
  const normalizedUsername = formData.username.trim().toLowerCase();

  const isDuplicateEmail = Boolean(
    normalizedEmail &&
      existingUsers.some(
        (u) =>
          u.email?.trim().toLowerCase() === normalizedEmail &&
          (!isEditing || u.id !== user?.id)
      )
  );

  const isDuplicateUsername = Boolean(
    normalizedUsername &&
      existingUsers.some(
        (u) =>
          u.username?.trim().toLowerCase() === normalizedUsername &&
          (!isEditing || u.id !== user?.id)
      )
  );

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name =
        lang === 'es' ? 'El nombre completo es obligatorio.' : 'Full name is required.';
    }

    if (!formData.email.trim()) {
      newErrors.email =
        lang === 'es' ? 'El correo corporativo es obligatorio.' : 'Corporate email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email =
        lang === 'es' ? 'Formato de correo inválido.' : 'Invalid email format.';
    } else if (isDuplicateEmail) {
      newErrors.email =
        lang === 'es'
          ? 'ALERTA: Ya existe un usuario registrado con este correo.'
          : 'WARNING: A user with this email already exists.';
    }

    if (!formData.username.trim()) {
      newErrors.username =
        lang === 'es' ? 'El nombre de usuario es obligatorio.' : 'Username is required.';
    } else if (formData.username.trim().length < 3) {
      newErrors.username =
        lang === 'es' ? 'El usuario debe tener al menos 3 caracteres.' : 'Username must have at least 3 chars.';
    } else if (isDuplicateUsername) {
      newErrors.username =
        lang === 'es'
          ? 'ALERTA: Este nombre de usuario ya está en uso.'
          : 'WARNING: This username is already taken.';
    }

    if (!isEditing && !formData.password.trim()) {
      newErrors.password =
        lang === 'es' ? 'La contraseña inicial es obligatoria.' : 'Initial password is required.';
    } else if (!isEditing && formData.password.trim().length < 6) {
      newErrors.password =
        lang === 'es'
          ? 'La contraseña debe tener mínimo 6 caracteres.'
          : 'Password must have at least 6 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    if (!validate()) {
      return;
    }

    try {
      const payload: Partial<User> = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        username: formData.username.trim(),
        phone: formData.phone.trim() || undefined,
        role: formData.role,
        department: formData.department,
        isActive: formData.isActive,
      };

      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      await onSave(payload);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : lang === 'es'
          ? 'Error al procesar la solicitud en el servidor'
          : 'Server error processing request';
      setSubmissionError(message);
    }
  };

  if (!isOpen) return null;

  const currentRoleInfo = ROLES.find((r) => r.value === formData.role) || ROLES[1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
              <Shield size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {isEditing
                  ? lang === 'es' ? 'Editar Usuario del Sistema' : 'Edit System User'
                  : lang === 'es' ? 'Registrar Nuevo Usuario' : 'Register New User'}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {lang === 'es'
                  ? 'Configuración de credenciales, roles RBAC y pertenencia departamental'
                  : 'Credential setup, RBAC role permissions and department assignment'}
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-left bg-[var(--surface-card)]">
          {/* Submission Failure Retry Alert (Preserva datos ingresados) */}
          {submissionError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-start justify-between gap-3 animate-shake">
              <div className="flex items-start gap-2.5">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    {lang === 'es' ? 'Error al guardar usuario' : 'Failed to save user'}
                  </h4>
                  <p className="text-xs mt-0.5 opacity-90">{submissionError}</p>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                    {lang === 'es'
                      ? 'Tus datos no se han perdido. Corrige los campos necesarios o haz clic en Reintentar.'
                      : 'Your input was preserved. Correct any fields and click Retry.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer shadow-sm transition-all"
              >
                <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                {lang === 'es' ? 'Reintentar' : 'Retry'}
              </button>
            </div>
          )}

          {/* Duplicate Alarms */}
          {(isDuplicateEmail || isDuplicateUsername) && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-start gap-2.5">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <h4 className="font-bold">
                  {lang === 'es' ? 'Alerta de Duplicidad en el Sistema' : 'Duplicate Information Warning'}
                </h4>
                {isDuplicateEmail && (
                  <p>
                    {lang === 'es'
                      ? `El correo "${formData.email}" ya pertenece a otro usuario activo.`
                      : `The email "${formData.email}" belongs to another account.`}
                  </p>
                )}
                {isDuplicateUsername && (
                  <p>
                    {lang === 'es'
                      ? `El nombre de usuario "${formData.username}" ya está registrado.`
                      : `The username "${formData.username}" is already in use.`}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Full Name & Username */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                {lang === 'es' ? 'Nombre Completo' : 'Full Name'} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
                  <UserIcon size={16} />
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={lang === 'es' ? 'Ej. Ing. Carlos Mendoza' : 'e.g. Carlos Mendoza'}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-subtle)] border text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all ${
                    errors.name ? 'border-rose-500 bg-rose-500/5' : 'border-[var(--border-subtle)]'
                  }`}
                />
              </div>
              {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                {lang === 'es' ? 'Nombre de Usuario (Login)' : 'Username (Login)'} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
                  <span className="text-xs font-bold font-mono">@</span>
                </div>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="cmendoza"
                  className={`w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-subtle)] border text-sm font-mono text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all ${
                    errors.username || isDuplicateUsername
                      ? 'border-rose-500 bg-rose-500/5'
                      : 'border-[var(--border-subtle)]'
                  }`}
                />
              </div>
              {errors.username && <p className="text-[11px] text-rose-500 mt-1">{errors.username}</p>}
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                {lang === 'es' ? 'Correo Electrónico Corporativo' : 'Corporate Email'} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="carlos.mendoza@visons.pe"
                  className={`w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-subtle)] border text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all ${
                    errors.email || isDuplicateEmail
                      ? 'border-rose-500 bg-rose-500/5'
                      : 'border-[var(--border-subtle)]'
                  }`}
                />
              </div>
              {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                {lang === 'es' ? 'Teléfono Móvil / WhatsApp' : 'Mobile Phone / WhatsApp'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
                  <Phone size={16} />
                </div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+51 987 654 321"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              {isEditing
                ? lang === 'es'
                  ? 'Nueva Contraseña (dejar en blanco para mantener actual)'
                  : 'New Password (leave blank to keep current)'
                : lang === 'es'
                ? 'Contraseña de Acceso'
                : 'Account Password'}
              {!isEditing && ' *'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
                <Lock size={16} />
              </div>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={isEditing ? '••••••••' : lang === 'es' ? 'Mínimo 6 caracteres' : 'Min 6 characters'}
                className={`w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-subtle)] border text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all ${
                  errors.password ? 'border-rose-500 bg-rose-500/5' : 'border-[var(--border-subtle)]'
                }`}
              />
            </div>
            {errors.password && <p className="text-[11px] text-rose-500 mt-1">{errors.password}</p>}
          </div>

          {/* Role & Department */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                {lang === 'es' ? 'Rol en el Sistema (RBAC)' : 'System Role (RBAC)'} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
                  <Shield size={16} />
                </div>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all cursor-pointer"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {lang === 'es' ? r.labelEs : r.labelEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                {lang === 'es' ? 'Área / Departamento' : 'Department / Business Unit'} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
                  <Briefcase size={16} />
                </div>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all cursor-pointer"
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

          {/* Role Description Card */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-xs font-bold text-[var(--text-primary)]">
                {lang === 'es' ? currentRoleInfo.labelEs : currentRoleInfo.labelEn}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {lang === 'es' ? currentRoleInfo.descEs : currentRoleInfo.descEn}
            </p>
          </div>

          {/* Account Status Switch */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-[var(--text-primary)]">
                {lang === 'es' ? 'Estado de la Cuenta' : 'Account Status'}
              </h4>
              <p className="text-xs text-[var(--text-secondary)]">
                {formData.isActive
                  ? lang === 'es'
                    ? 'Cuenta habilitada para iniciar sesión y operar'
                    : 'Account active and allowed to sign in'
                  : lang === 'es'
                  ? 'Cuenta deshabilitada / acceso bloqueado'
                  : 'Account disabled / access blocked'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                formData.isActive ? 'bg-rose-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            {lang === 'es' ? 'Cancelar' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || isDuplicateEmail || isDuplicateUsername}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {lang === 'es' ? 'Guardando en Base de Datos...' : 'Saving to Database...'}
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                {isEditing
                  ? lang === 'es' ? 'Actualizar Usuario' : 'Update User'
                  : lang === 'es' ? 'Crear Usuario' : 'Create User'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
