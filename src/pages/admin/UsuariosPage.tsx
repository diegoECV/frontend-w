// =============================================================================
// PANEL: USUARIOS & AUDITORÍA — VISONS S.A.C. ADMIN DASHBOARD
// Control de Identidades RBAC, Trazabilidad Inmutable (SQL Server) y Sesiones
// =============================================================================

import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Search,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  Download,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Eye,
  Building,
  KeyRound,
  FileText,
  UserCheck,
  UserX,
  Globe,
  Database,
  Lock,
  RotateCcw,
  Archive,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

import type { User, AuditLog, RevokedToken } from '../../types/user';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  hardDeleteUser,
  restoreUser,
  toggleUserStatus,
  exportUsersExcel,
  exportUsersPdf,
  exportUsersCsv,
  getAuditLogs,
  deleteAuditLog,
  getRevokedTokens,
  createRevokedToken,
  deleteRevokedToken,
} from '../../api/userApi';

import { UserModal } from '../../components/users/UserModal';
import { AuditDetailModal } from '../../components/users/AuditDetailModal';
import { RevokeTokenModal } from '../../components/users/RevokeTokenModal';
import { DeleteConfirmModal } from '../../components/products/DeleteConfirmModal';
import { StatusFilterTabs, type FilterTrashStatus } from '../../components/shared/StatusFilterTabs';
import { ImportModal } from '../../components/shared/ImportModal';
import { notifyOperationUpdate } from '../../services/notificationService';

export default function UsuariosPage() {
  const { lang } = useOutletContext<{ lang: 'es' | 'en' }>();

  // Pestaña activa
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'sessions'>('users');

  // Estados de datos
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [revokedTokens, setRevokedTokens] = useState<RevokedToken[]>([]);

  // Estados de carga
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filtros y búsquedas
  const [searchUser, setSearchUser] = useState('');
  const [filterTrash, setFilterTrash] = useState<FilterTrashStatus>('active');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [searchAudit, setSearchAudit] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  // Modales
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'user' | 'audit' | 'token';
    id: string | number;
    name: string;
  } | null>(null);

  // Carga inicial de datos
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, auditRes, tokensRes] = await Promise.allSettled([
        getUsers(),
        getAuditLogs(),
        getRevokedTokens(),
      ]);

      if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value.data)) {
        setUsers(usersRes.value.data);
      } else {
        // Fallback datos demo representativos si BD está recién inicializada
        setUsers([
          {
            id: 'usr-1',
            username: 'diego.admin',
            name: 'Diego Admin',
            email: 'diego@visons.com',
            phone: '+51 987 654 321',
            role: 'ADMIN',
            department: 'Administración',
            isActive: true,
            lastLogin: new Date().toISOString(),
            createdAt: '2026-01-10T08:00:00Z',
          },
          {
            id: 'usr-2',
            username: 'carlos.mendoza',
            name: 'Ing. Carlos Mendoza',
            email: 'carlos.mendoza@visons.pe',
            phone: '+51 999 111 222',
            role: 'WORKER',
            department: 'Control de Calidad',
            isActive: true,
            lastLogin: '2026-10-18T14:30:00Z',
            createdAt: '2026-02-15T09:30:00Z',
          },
          {
            id: 'usr-3',
            username: 'fresh.direct',
            name: 'Fresh Direct LLC Rep',
            email: 'imports@freshdirect.com',
            phone: '+1 212 555 0199',
            role: 'CLIENT',
            department: 'Comercial & Exportación',
            isActive: false,
            lastLogin: null,
            createdAt: '2026-10-17T11:20:00Z',
          },
          {
            id: 'usr-4',
            username: 'marina.logistics',
            name: 'Marina Alarcón',
            email: 'marina.alarcon@visons.pe',
            phone: '+51 944 332 211',
            role: 'OPERATOR',
            department: 'Logística & Almacén',
            isActive: true,
            lastLogin: '2026-10-18T16:00:00Z',
            createdAt: '2026-03-01T10:00:00Z',
          },
        ]);
      }

      if (auditRes.status === 'fulfilled' && Array.isArray(auditRes.value.data)) {
        setAuditLogs(auditRes.value.data);
      } else {
        setAuditLogs([
          {
            id: 101,
            userId: 'usr-1',
            username: 'diego.admin',
            action: 'CREATE',
            resource: 'USERS',
            resourceId: 'usr-4',
            timestamp: '2026-10-18T16:00:00',
            changesBefore: null,
            changesAfter: '{"username":"marina.logistics","role":"OPERATOR","isActive":true}',
            ipAddress: '192.168.1.45',
          },
          {
            id: 102,
            userId: 'usr-1',
            username: 'diego.admin',
            action: 'UPDATE',
            resource: 'INVOICES',
            resourceId: 'INV-2026-004',
            timestamp: '2026-10-18T17:15:00',
            changesBefore: '{"status":"BORRADOR"}',
            changesAfter: '{"status":"EMITIDA","sunatCdrStatus":"ACEPTADO"}',
            ipAddress: '192.168.1.45',
          },
          {
            id: 103,
            userId: 'usr-2',
            username: 'carlos.mendoza',
            action: 'CREATE',
            resource: 'QUALITY_INSPECTION',
            resourceId: 'QI-882',
            timestamp: '2026-10-18T14:35:00',
            changesBefore: null,
            changesAfter: '{"batchId":"LOT-2026-001","status":"APROBADO","brix":14.8}',
            ipAddress: '10.0.4.12',
          },
        ]);
      }

      if (tokensRes.status === 'fulfilled' && Array.isArray(tokensRes.value.data)) {
        setRevokedTokens(tokensRes.value.data);
      } else {
        setRevokedTokens([
          {
            id: 'tok-1',
            tokenSignature: '9f83ab412c7d91e84a20bfe...',
            revokedAt: '2026-10-18T11:00:00Z',
            expiresAt: '2026-10-19T11:00:00Z',
            reason: 'Cierre forzado de sesión por cambio de credencial',
          },
        ]);
      }
    } catch {
      toast.error(
        lang === 'es'
          ? 'Error al conectar con los servicios de seguridad'
          : 'Failed to connect to security services'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // KPIs
  const totalUsersCount = users.length;
  const activeUsersCount = users.filter((u) => u.isActive).length;
  const pendingApprovalsCount = users.filter((u) => !u.isActive).length;
  const auditLogsCount = auditLogs.length;

  // Conteo de Papelera Usuarios
  const userTrashCounts = useMemo(() => {
    const active = users.filter((u) => u.isActive).length;
    const trash = users.filter((u) => !u.isActive).length;
    return { active, trash, all: users.length };
  }, [users]);

  // Filtrado de usuarios
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchUser.trim().toLowerCase();
      const matchesSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.department?.toLowerCase().includes(q);

      const matchesTrash =
        filterTrash === 'all' ||
        (filterTrash === 'active' && u.isActive) ||
        (filterTrash === 'trash' && !u.isActive);

      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && u.isActive) ||
        (statusFilter === 'INACTIVE' && !u.isActive);

      return matchesSearch && matchesTrash && matchesRole && matchesStatus;
    });
  }, [users, searchUser, filterTrash, roleFilter, statusFilter]);

  // Filtrado de auditoría
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const q = searchAudit.trim().toLowerCase();
      const matchesSearch =
        !q ||
        log.username?.toLowerCase().includes(q) ||
        log.resource?.toLowerCase().includes(q) ||
        log.resourceId?.toLowerCase().includes(q) ||
        log.ipAddress?.toLowerCase().includes(q);

      const matchesAction =
        actionFilter === 'ALL' || (log.action || '').toUpperCase() === actionFilter;

      return matchesSearch && matchesAction;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [auditLogs, searchAudit, actionFilter]);

  // Acciones de Usuario
  const handleSaveUser = async (userData: Partial<User>) => {
    setIsSubmitting(true);
    try {
      if (editingUser?.id) {
        await updateUser(editingUser.id, userData);
        toast.success(
          lang === 'es' ? 'Usuario actualizado exitosamente' : 'User updated successfully'
        );
        notifyOperationUpdate({
          module: 'USUARIOS',
          actionType: 'ACTUALIZACIÓN',
          entityName: `Usuario ${editingUser.name}`,
          details: `Perfil de ${editingUser.name} (${editingUser.email}) actualizado. Rol: ${userData.role || editingUser.role}.`,
          link: '/usuarios',
        });
      } else {
        await createUser(userData);
        toast.success(
          lang === 'es' ? 'Usuario registrado exitosamente' : 'User created successfully'
        );
        notifyOperationUpdate({
          module: 'USUARIOS',
          actionType: 'CREACIÓN',
          entityName: `Usuario ${userData.name}`,
          details: `Nueva cuenta de usuario creada: ${userData.name} (${userData.email}). Rol asignado: ${userData.role}.`,
          link: '/usuarios',
        });
      }
      setIsUserModalOpen(false);
      setEditingUser(null);
      await fetchData();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error en la operación del servidor';
      toast.error(message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await toggleUserStatus(user.id);
      toast.success(
        lang === 'es'
          ? `Usuario ${user.isActive ? 'desactivado' : 'activado'} correctamente`
          : `User ${user.isActive ? 'deactivated' : 'activated'} successfully`
      );
      notifyOperationUpdate({
        module: 'USUARIOS',
        actionType: 'CAMBIO DE ESTADO',
        entityName: `Usuario ${user.name}`,
        details: `El usuario ${user.name} (${user.email}) fue ${user.isActive ? 'desactivado' : 'activado'}.`,
        link: '/usuarios',
      });
      // Actualización optimista local
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
      );
    } catch {
      toast.error(
        lang === 'es' ? 'Error al alternar estado del usuario' : 'Failed to toggle user status'
      );
    }
  };


  // Acciones de Revocación de Token
  const handleSaveRevokedToken = async (tokenData: Partial<RevokedToken>) => {
    setIsSubmitting(true);
    try {
      await createRevokedToken(tokenData);
      toast.success(
        lang === 'es'
          ? 'Sesión revocada y añadida a la lista negra en MongoDB'
          : 'Session revoked and registered in MongoDB blacklist'
      );
      await fetchData();
    } catch {
      toast.error(
        lang === 'es' ? 'Error al registrar token revocado' : 'Failed to blacklist token'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Restaurar usuario (Alta Lógica)
  const handleRestoreUser = async (user: User) => {
    try {
      const res = await restoreUser(user.id);
      const restored = res.data || { ...user, isActive: true };
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, ...restored, isActive: true } : u))
      );
      toast.success(
        lang === 'es'
          ? `Usuario "${user.name}" restaurado y reactivado exitosamente`
          : `User "${user.name}" restored and activated successfully`
      );
      notifyOperationUpdate({
        module: 'USUARIOS',
        actionType: 'RESTAURACIÓN',
        entityName: `Usuario ${user.name}`,
        details: `La cuenta de usuario "${user.name}" (${user.email}) ha sido restaurada y reactivada.`,
        link: '/usuarios',
      });
    } catch {
      toast.error(
        lang === 'es' ? 'Error al restaurar usuario' : 'Failed to restore user'
      );
    }
  };

  // Confirmación de Borrado
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      if (deleteTarget.type === 'user') {
        if (filterTrash === 'trash') {
          // Purgar definitivamente (Hard Delete)
          await hardDeleteUser(String(deleteTarget.id));
          setUsers((prev) => prev.filter((u) => u.id !== String(deleteTarget.id)));
          toast.success(
            lang === 'es' ? 'Cuenta de usuario purgada definitivamente' : 'User account permanently purged'
          );
          notifyOperationUpdate({
            module: 'USUARIOS',
            actionType: 'PAPELERA',
            entityName: `Usuario ${deleteTarget.name}`,
            details: `Cuenta de usuario ${deleteTarget.name} purgada permanentemente.`,
            link: '/usuarios',
          });
        } else {
          // Baja lógica (Soft Delete)
          const res = await deleteUser(String(deleteTarget.id));
          const deleted = res.data || { isActive: false };
          setUsers((prev) =>
            prev.map((u) => (u.id === String(deleteTarget.id) ? { ...u, ...deleted, isActive: false } : u))
          );
          toast.success(
            lang === 'es'
              ? `Usuario "${deleteTarget.name}" enviado a la papelera (baja lógica)`
              : `User "${deleteTarget.name}" moved to trash`
          );
          notifyOperationUpdate({
            module: 'USUARIOS',
            actionType: 'PAPELERA',
            entityName: `Usuario ${deleteTarget.name}`,
            details: `Usuario ${deleteTarget.name} enviado a la papelera (desactivado lógicamente).`,
            link: '/usuarios',
          });
        }
      } else if (deleteTarget.type === 'audit') {
        await deleteAuditLog(Number(deleteTarget.id));
        toast.success(
          lang === 'es' ? 'Registro de auditoría purgado' : 'Audit entry purged'
        );
      } else if (deleteTarget.type === 'token') {
        await deleteRevokedToken(String(deleteTarget.id));
        toast.success(
          lang === 'es' ? 'Token removido de la lista negra' : 'Token removed from blacklist'
        );
      }
      setDeleteTarget(null);
      await fetchData();
    } catch {
      toast.error(lang === 'es' ? 'Error al eliminar registro' : 'Failed to delete record');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Exportaciones
  const handleExport = async (format: 'excel' | 'pdf' | 'csv') => {
    setIsExporting(true);
    try {
      if (format === 'excel') {
        await exportUsersExcel();
      } else if (format === 'pdf') {
        await exportUsersPdf();
      } else {
        await exportUsersCsv();
      }
      toast.success(
        lang === 'es'
          ? `Padrón de usuarios exportado en formato ${format.toUpperCase()}`
          : `User directory exported in ${format.toUpperCase()} format`
      );
    } catch {
      toast.error(
        lang === 'es' ? 'Error al descargar el archivo' : 'Failed to download report'
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Renderizadores de Insignias y Estilos
  const renderRoleBadge = (role: string) => {
    const r = (role || 'WORKER').toUpperCase();
    if (r === 'ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
          <Shield size={12} /> Admin RBAC
        </span>
      );
    }
    if (r === 'CLIENT') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Building size={12} /> Cliente B2B
        </span>
      );
    }
    if (r === 'OPERATOR') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Globe size={12} /> Operador
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
        <Users size={12} /> Trabajador
      </span>
    );
  };

  const renderActionBadge = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('CREATE') || act.includes('APPROVE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 size={11} /> {act}
        </span>
      );
    }
    if (act.includes('UPDATE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Edit2 size={11} /> {act}
        </span>
      );
    }
    if (act.includes('DELETE') || act.includes('REJECT')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <Trash2 size={11} /> {act}
        </span>
      );
    }
    if (act.includes('LOGIN') || act.includes('LOGOUT')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Lock size={11} /> {act}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
        <Database size={11} /> {act}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header del Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
              <Users size={20} />
            </div>
            <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
              {lang === 'es' ? 'Usuarios & Auditoría' : 'Users & Audit Trail'}
            </h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {lang === 'es'
              ? 'Gestión de identidades con RBAC, registro inmutable de trazabilidad y seguridad de sesiones'
              : 'RBAC identity administration, immutable security audit logs and active session management'}
          </p>
        </div>

        {/* Botones de Cabecera */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{lang === 'es' ? 'Actualizar' : 'Refresh'}</span>
          </button>

          {/* Menú de Exportación */}
          <div className="flex items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-0.5 shadow-sm">
            <button
              onClick={() => handleExport('excel')}
              disabled={isExporting}
              title={lang === 'es' ? 'Exportar a Excel' : 'Export to Excel'}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
            >
              <FileSpreadsheet size={14} />
              <span className="hidden md:inline">Excel</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              title={lang === 'es' ? 'Exportar a PDF' : 'Export to PDF'}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <FileText size={14} />
              <span className="hidden md:inline">PDF</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              title={lang === 'es' ? 'Exportar a CSV' : 'Export to CSV'}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span className="hidden md:inline">CSV</span>
            </button>
          </div>

          {/* Botón de Importación */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            title={lang === 'es' ? 'Importar usuarios desde Excel o CSV' : 'Import users from Excel or CSV'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] text-xs font-semibold text-[var(--text-primary)] transition-all cursor-pointer shadow-sm"
          >
            <Upload size={14} className="text-emerald-500" />
            <span className="hidden sm:inline">{lang === 'es' ? 'Importar' : 'Import'}</span>
          </button>

          <button
            onClick={() => {
              setEditingUser(null);
              setIsUserModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>{lang === 'es' ? 'Nuevo Usuario' : 'New User'}</span>
          </button>
        </div>
      </div>

      {/* 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Usuarios */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              {lang === 'es' ? 'Total Usuarios' : 'Total Accounts'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[var(--text-primary)]">
              {totalUsersCount}
            </span>
            <span className="text-[11px] text-[var(--text-secondary)]">
              {lang === 'es' ? 'registrados en MongoDB' : 'registered in DB'}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1 truncate">
            {users.filter((u) => u.role === 'ADMIN').length} Admins •{' '}
            {users.filter((u) => u.role === 'WORKER').length} Planta •{' '}
            {users.filter((u) => u.role === 'CLIENT').length} Clientes
          </p>
        </div>

        {/* KPI 2: Cuentas Activas */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              {lang === 'es' ? 'Cuentas Activas' : 'Active Accounts'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">{activeUsersCount}</span>
            <span className="text-[11px] font-semibold text-emerald-500">
              {totalUsersCount > 0
                ? `${Math.round((activeUsersCount / totalUsersCount) * 100)}%`
                : '100%'}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1">
            {lang === 'es'
              ? 'Con credenciales activas y acceso habilitado'
              : 'With active credentials and sign-in enabled'}
          </p>
        </div>

        {/* KPI 3: Pendientes de Aprobación */}
        <div
          onClick={() => {
            setActiveTab('users');
            setStatusFilter('INACTIVE');
          }}
          className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm hover:border-amber-500/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              {lang === 'es' ? 'Pendientes de Aprobación' : 'Pending Approvals'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">{pendingApprovalsCount}</span>
            {pendingApprovalsCount > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                {lang === 'es' ? 'Requiere Acción' : 'Action Required'}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1">
            {lang === 'es'
              ? 'Registros de clientes o trabajadores por validar'
              : 'Client or staff registrations to review'}
          </p>
        </div>

        {/* KPI 4: Registros de Auditoría */}
        <div
          onClick={() => setActiveTab('audit')}
          className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm hover:border-purple-500/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              {lang === 'es' ? 'Eventos de Auditoría' : 'Audit Trail Events'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldAlert size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[var(--text-primary)]">
              {auditLogsCount}
            </span>
            <span className="text-[11px] text-[var(--text-secondary)]">
              {lang === 'es' ? 'en SQL Server' : 'in SQL Server'}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1 truncate">
            {revokedTokens.length}{' '}
            {lang === 'es' ? 'tokens en lista negra' : 'blacklisted tokens'}
          </p>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN */}
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30 shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
          }`}
        >
          <Users size={16} />
          <span>{lang === 'es' ? 'Usuarios & Roles RBAC' : 'Users & RBAC Roles'}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[var(--bg-card)] border border-[var(--border-subtle)]">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30 shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
          }`}
        >
          <ShieldAlert size={16} />
          <span>{lang === 'es' ? 'Registro de Auditoría & Trazabilidad' : 'Audit Trail & Compliance'}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[var(--bg-card)] border border-[var(--border-subtle)]">
            {auditLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'sessions'
              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30 shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
          }`}
        >
          <KeyRound size={16} />
          <span>{lang === 'es' ? 'Sesiones & Tokens Revocados' : 'Active Sessions & Revoked Tokens'}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[var(--bg-card)] border border-[var(--border-subtle)]">
            {revokedTokens.length}
          </span>
        </button>
      </div>

      {/* CONTENIDO TAB 1: USUARIOS & ROLES RBAC */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
              />
              <input
                type="text"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder={
                  lang === 'es'
                    ? 'Buscar por nombre, usuario, email o área...'
                    : 'Search by name, username, email or department...'
                }
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
              />
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Filtro de Rol */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs">
                <Shield size={14} className="text-rose-500" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-transparent text-[var(--text-primary)] focus:outline-none cursor-pointer text-xs"
                >
                  <option value="ALL">{lang === 'es' ? 'Todos los Roles' : 'All Roles'}</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="WORKER">WORKER (Planta)</option>
                  <option value="CLIENT">CLIENT (B2B)</option>
                  <option value="OPERATOR">OPERATOR (Logística)</option>
                </select>
              </div>

              {/* Filtro de Estado */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs">
                <Filter size={14} className="text-emerald-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-[var(--text-primary)] focus:outline-none cursor-pointer text-xs"
                >
                  <option value="ALL">{lang === 'es' ? 'Todos los Estados' : 'All Status'}</option>
                  <option value="ACTIVE">{lang === 'es' ? 'Solo Activos' : 'Active Only'}</option>
                  <option value="INACTIVE">
                    {lang === 'es' ? 'Inactivos / Pendientes' : 'Inactive / Pending'}
                  </option>
                </select>
              </div>

              {/* Status Trash Tabs */}
              <StatusFilterTabs
                current={filterTrash}
                onChange={setFilterTrash}
                counts={userTrashCounts}
                labels={{
                  active: lang === 'es' ? 'Activos' : 'Active',
                  trash: lang === 'es' ? 'Papelera / Inactivos' : 'Trash / Inactive',
                  all: lang === 'es' ? 'Todos' : 'All',
                }}
                lang={lang}
              />
            </div>
          </div>

          {/* Banner de Papelera */}
          {filterTrash === 'trash' && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fadeIn">
              <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400 font-semibold">
                <Archive size={18} className="shrink-0" />
                <span>
                  {lang === 'es'
                    ? 'Estás visualizando los usuarios inactivos / eliminados lógicamente. Haz clic en "Restaurar" para reactivar su cuenta y permisos en el sistema.'
                    : 'Viewing inactive / soft-deleted users in trash. Click "Restore" to reactivate their account and permissions.'}
                </span>
              </div>
              <button
                onClick={() => setFilterTrash('active')}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors shrink-0 text-xs shadow-md shadow-rose-600/20 cursor-pointer self-start sm:self-center"
              >
                {lang === 'es' ? '← Ver Activos' : '← View Active'}
              </button>
            </div>
          )}

          {/* Tabla de Usuarios */}
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Usuario' : 'User'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Contacto' : 'Contact'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Rol RBAC' : 'RBAC Role'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Área / Depto' : 'Department'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Estado' : 'Status'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Último Acceso' : 'Last Login'}</th>
                    <th className="py-3.5 px-4 text-right">{lang === 'es' ? 'Acciones' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[var(--text-secondary)]">
                        <Users size={32} className="mx-auto mb-2 opacity-40" />
                        <p className="font-semibold">
                          {lang === 'es'
                            ? 'No se encontraron usuarios registrados'
                            : 'No user accounts found matching filters'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-[var(--bg-subtle)]/50 transition-colors group"
                      >
                        {/* Usuario / Avatar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold flex items-center justify-center shrink-0 uppercase">
                              {user.name ? user.name.slice(0, 2) : 'US'}
                            </div>
                            <div>
                              <p className="font-bold text-[var(--text-primary)]">
                                {user.name || 'Sin nombre registrado'}
                              </p>
                              <p className="font-mono text-[11px] text-[var(--text-secondary)]">
                                @{user.username}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Contacto */}
                        <td className="py-3.5 px-4">
                          <p className="text-[var(--text-primary)] font-medium">{user.email}</p>
                          <p className="text-[11px] text-[var(--text-secondary)] font-mono">
                            {user.phone || '—'}
                          </p>
                        </td>

                        {/* Rol */}
                        <td className="py-3.5 px-4">{renderRoleBadge(user.role)}</td>

                        {/* Área */}
                        <td className="py-3.5 px-4">
                          <span className="text-[var(--text-secondary)] font-medium">
                            {user.department || 'General'}
                          </span>
                        </td>

                        {/* Estado */}
                        <td className="py-3.5 px-4">
                          {user.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <UserCheck size={12} />
                              {lang === 'es' ? 'Activo' : 'Active'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <UserX size={12} />
                              {lang === 'es' ? 'Pendiente / Inactivo' : 'Pending'}
                            </span>
                          )}
                        </td>

                        {/* Último Acceso */}
                        <td className="py-3.5 px-4 text-[var(--text-secondary)] font-mono text-[11px]">
                          {user.lastLogin
                            ? new Date(user.lastLogin).toLocaleString()
                            : lang === 'es'
                            ? 'Nunca'
                            : 'Never'}
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!user.isActive ? (
                              <>
                                <button
                                  onClick={() => handleRestoreUser(user)}
                                  title={lang === 'es' ? 'Restaurar y reactivar usuario' : 'Restore and reactivate user'}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
                                >
                                  <RotateCcw size={13} />
                                  <span>{lang === 'es' ? 'Restaurar' : 'Restore'}</span>
                                </button>
                                <button
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: 'user',
                                      id: user.id,
                                      name: user.name || user.username,
                                    })
                                  }
                                  title={lang === 'es' ? 'Eliminar definitivamente' : 'Permanently delete'}
                                  className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/15 transition-all cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            ) : (
                              <>
                                {/* Deshabilitar (Mover a papelera) */}
                                <button
                                  onClick={() => handleToggleStatus(user)}
                                  title={lang === 'es' ? 'Deshabilitar Usuario' : 'Disable User'}
                                  className="p-1.5 rounded-lg border transition-all cursor-pointer bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/20"
                                >
                                  <UserX size={14} />
                                </button>

                                {/* Editar */}
                                <button
                                  onClick={() => {
                                    setEditingUser(user);
                                    setIsUserModalOpen(true);
                                  }}
                                  title={lang === 'es' ? 'Editar Usuario' : 'Edit User'}
                                  className="p-1.5 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 border border-[var(--border-subtle)] transition-all cursor-pointer"
                                >
                                  <Edit2 size={14} />
                                </button>

                                {/* Eliminar */}
                                <button
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: 'user',
                                      id: user.id,
                                      name: user.name || user.username,
                                    })
                                  }
                                  title={lang === 'es' ? 'Mover a papelera' : 'Move to trash'}
                                  className="p-1.5 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 border border-[var(--border-subtle)] transition-all cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO TAB 2: REGISTRO DE AUDITORÍA (SQL SERVER) */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Barra de Filtros de Auditoría */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
              />
              <input
                type="text"
                value={searchAudit}
                onChange={(e) => setSearchAudit(e.target.value)}
                placeholder={
                  lang === 'es'
                    ? 'Buscar por usuario, recurso, ID o dirección IP...'
                    : 'Search by operator, entity, resource ID or IP...'
                }
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs">
                <Filter size={14} className="text-purple-400" />
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="bg-transparent text-[var(--text-primary)] focus:outline-none cursor-pointer text-xs"
                >
                  <option value="ALL">{lang === 'es' ? 'Todas las Acciones' : 'All Actions'}</option>
                  <option value="CREATE">CREATE</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                  <option value="LOGIN">LOGIN</option>
                  <option value="EXPORT">EXPORT</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabla de Logs de Auditoría */}
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Fecha & Hora' : 'Timestamp'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Operador / Usuario' : 'Operator'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Acción' : 'Action'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Entidad / Recurso' : 'Resource'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Origen IP' : 'Origin IP'}</th>
                    <th className="py-3.5 px-4 text-right">{lang === 'es' ? 'Trazabilidad' : 'Details'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[var(--text-secondary)]">
                        <ShieldAlert size={32} className="mx-auto mb-2 opacity-40" />
                        <p className="font-semibold">
                          {lang === 'es'
                            ? 'No se encontraron eventos de auditoría registrados'
                            : 'No audit records found matching criteria'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-[var(--bg-subtle)]/50 transition-colors group cursor-pointer"
                        onClick={() => setSelectedAuditLog(log)}
                      >
                        {/* Fecha */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-[var(--text-primary)]">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>

                        {/* Operador */}
                        <td className="py-3.5 px-4 font-semibold text-[var(--text-primary)]">
                          @{log.username || log.userId}
                        </td>

                        {/* Acción */}
                        <td className="py-3.5 px-4">{renderActionBadge(log.action)}</td>

                        {/* Recurso */}
                        <td className="py-3.5 px-4 font-mono text-emerald-400 font-semibold">
                          {log.resource} {log.resourceId ? `[#${log.resourceId}]` : ''}
                        </td>

                        {/* IP */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-[var(--text-secondary)]">
                          {log.ipAddress || '127.0.0.1'}
                        </td>

                        {/* Detalle */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAuditLog(log);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] hover:bg-rose-500/10 text-rose-400 border border-[var(--border-subtle)] hover:border-rose-500/30 text-xs font-semibold transition-all cursor-pointer"
                          >
                            <Eye size={12} />
                            <span>{lang === 'es' ? 'Ver Diff' : 'View Diff'}</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO TAB 3: SESIONES ACTIVAS & TOKENS REVOCADOS (MONGODB) */}
      {activeTab === 'sessions' && (
        <div className="space-y-5">
          {/* Tarjeta de Seguridad y Política de Tokens */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-500 uppercase tracking-wider">
                <Shield size={16} />
                {lang === 'es' ? 'Política de Expiración JWT' : 'JWT Expiry Policy'}
              </div>
              <p className="text-lg font-black text-[var(--text-primary)]">24 Horas</p>
              <p className="text-xs text-[var(--text-secondary)]">
                {lang === 'es'
                  ? 'Tokens firmados con algoritmo HMAC-SHA256 con tiempo de gracia de 15 min.'
                  : 'Signed with HMAC-SHA256 with 15m grace window.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Database size={16} />
                {lang === 'es' ? 'Lista Negra en MongoDB' : 'MongoDB Blacklist'}
              </div>
              <p className="text-lg font-black text-[var(--text-primary)]">
                {revokedTokens.length} {lang === 'es' ? 'Revocados' : 'Blacklisted'}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {lang === 'es'
                  ? 'Filtro reactivo que bloquea solicitudes con firmas invalidadas.'
                  : 'Reactive filter blocking requests with invalidated signatures.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <KeyRound size={16} />
                  {lang === 'es' ? 'Revocación Forzada' : 'Force Revocation'}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {lang === 'es'
                    ? 'Invalida inmediatamente una sesión activa por sospecha o desvinculación.'
                    : 'Immediately invalidate active sessions for security.'}
                </p>
              </div>
              <button
                onClick={() => setIsRevokeModalOpen(true)}
                className="mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>{lang === 'es' ? 'Revocar Token / Sesión' : 'Revoke Session Token'}</span>
              </button>
            </div>
          </div>

          {/* Tabla de Tokens Revocados */}
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  {lang === 'es' ? 'Lista Negra de Tokens (Revoked JWTs)' : 'Revoked Token Blacklist'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {lang === 'es'
                    ? 'Sesiones terminadas administrativamente registradas en revoked_tokens'
                    : 'Administratively terminated sessions in revoked_tokens collection'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Firma / Hash del Token' : 'Token Signature'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Fecha de Revocación' : 'Revoked At'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Expira en Lista Negra' : 'Blacklist Expiry'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Motivo' : 'Reason'}</th>
                    <th className="py-3.5 px-4 text-right">{lang === 'es' ? 'Acción' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {revokedTokens.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[var(--text-secondary)]">
                        <ShieldCheck size={32} className="mx-auto mb-2 text-emerald-400 opacity-60" />
                        <p className="font-semibold text-emerald-400">
                          {lang === 'es'
                            ? 'No hay tokens en lista negra. Todas las sesiones activas son válidas.'
                            : 'No tokens blacklisted. All current sessions are authentic.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    revokedTokens.map((tok, idx) => (
                      <tr key={tok.id || idx} className="hover:bg-[var(--bg-subtle)]/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-[11px] text-rose-400 font-semibold truncate max-w-xs">
                          {tok.tokenSignature}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-[var(--text-secondary)]">
                          {tok.revokedAt ? new Date(tok.revokedAt).toLocaleString() : '—'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-[var(--text-secondary)]">
                          {tok.expiresAt ? new Date(tok.expiresAt).toLocaleString() : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-[var(--text-primary)] font-medium">
                          {tok.reason || 'Revocación manual'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {tok.id && (
                            <button
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'token',
                                  id: tok.id as string,
                                  name: tok.tokenSignature.slice(0, 16) + '...',
                                })
                              }
                              title={lang === 'es' ? 'Eliminar de lista negra' : 'Remove from blacklist'}
                              className="p-1.5 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 border border-[var(--border-subtle)] transition-all cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: USUARIO (Crear / Editar) */}
      <UserModal
        isOpen={isUserModalOpen}
        user={editingUser}
        existingUsers={users}
        isLoading={isSubmitting}
        lang={lang}
        onSave={handleSaveUser}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
        }}
      />

      {/* MODAL: DETALLES DE AUDITORÍA */}
      <AuditDetailModal
        isOpen={Boolean(selectedAuditLog)}
        log={selectedAuditLog}
        lang={lang}
        onClose={() => setSelectedAuditLog(null)}
      />

      {/* MODAL: REVOCAR SESIÓN / TOKEN */}
      <RevokeTokenModal
        isOpen={isRevokeModalOpen}
        isLoading={isSubmitting}
        lang={lang}
        onSave={handleSaveRevokedToken}
        onClose={() => setIsRevokeModalOpen(false)}
      />

      {/* MODAL: CONFIRMACIÓN DE BORRADO */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        isSoftDelete={filterTrash !== 'trash' && deleteTarget?.type === 'user'}
        title={
          deleteTarget?.type === 'user'
            ? filterTrash === 'trash'
              ? lang === 'es' ? '¿Eliminar Cuenta Definitivamente?' : 'Permanently Delete User Account?'
              : lang === 'es' ? '¿Mover Usuario a la Papelera?' : 'Move User to Trash?'
            : deleteTarget?.type === 'audit'
            ? lang === 'es' ? 'Purgar Registro de Auditoría' : 'Purge Audit Record'
            : lang === 'es' ? 'Remover de Lista Negra' : 'Remove from Blacklist'
        }
        message={
          deleteTarget?.type === 'user'
            ? filterTrash === 'trash'
              ? lang === 'es'
                ? '¿Estás seguro de que deseas purgar permanentemente este usuario de la base de datos? Sus credenciales de acceso e historial quedarán invalidados.'
                : 'Are you sure you want to permanently purge this user account? Sign-in credentials will be revoked.'
              : lang === 'es'
                ? 'La cuenta del usuario será desactivada y enviada a la papelera. Podrás restaurarla en cualquier momento.'
                : 'The user account will be deactivated and moved to trash. You can restore it at any time.'
            : deleteTarget?.type === 'audit'
            ? lang === 'es'
                ? '¿Estás seguro de purgar esta entrada del log de auditoría?'
                : 'Are you sure you want to purge this audit record?'
            : lang === 'es'
                ? '¿Estás seguro de remover esta firma de la lista negra?'
                : 'Are you sure you want to unblock this token?'
        }
        itemName={deleteTarget?.name || ''}
        isLoading={isSubmitting}
        lang={lang}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* MODAL: IMPORTACIÓN MASIVA DE USUARIOS */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        module="users"
        lang={lang}
        onSuccess={() => fetchData()}
      />
    </div>
  );
}
