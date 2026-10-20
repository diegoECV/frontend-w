// =============================================================================
// PANEL 1: CLIENTES B2B — VISONS S.A.C. ADMIN DASHBOARD
// Gestión CRUD completa, Directorio de Empresas Importadoras,
// Aprobación de Solicitudes B2B, Validación y Exportación a Excel/PDF/CSV
// =============================================================================

import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  FileSpreadsheet,
  FileText,
  FileCode,
  Globe,
  Anchor,
  Clock,
  ChevronDown,
  RotateCcw,
  Archive,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

import type { Client } from '../../types/client';
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
  hardDeleteClient,
  restoreClient,
  exportClientsExcel,
  exportClientsPdf,
  exportClientsCsv,
} from '../../api/clientApi';
import { useAuth } from '../../context/AuthContext';

import { ClientModal } from '../../components/clients/ClientModal';
import { ClientDetailModal } from '../../components/clients/ClientDetailModal';
import { RejectRequestModal } from '../../components/clients/RejectRequestModal';
import { DeleteConfirmModal } from '../../components/products/DeleteConfirmModal';
import { StatusFilterTabs, type FilterTrashStatus } from '../../components/shared/StatusFilterTabs';
import { ImportModal } from '../../components/shared/ImportModal';
import { notifyOperationUpdate } from '../../services/notificationService';

type OutletCtx = { lang: 'es' | 'en' };

export default function ClientesPage() {
  const { lang } = useOutletContext<OutletCtx>();
  const { requests, approveClientRequest, rejectClientRequest } = useAuth();

  // Active Tab: 'directorio' | 'solicitudes'
  const [activeTab, setActiveTab] = useState<'directorio' | 'solicitudes'>('directorio');

  // Clients Data from MongoDB
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTrash, setFilterTrash] = useState<FilterTrashStatus>('active');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [incotermFilter, setIncotermFilter] = useState<string>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');

  // Export Menu State
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Modals State
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [detailModalClient, setDetailModalClient] = useState<Client | null>(null);

  const [rejectModalState, setRejectModalState] = useState<{
    isOpen: boolean;
    requestId: string;
    requestName: string;
  }>({
    isOpen: false,
    requestId: '',
    requestName: '',
  });

  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    id: '',
    name: '',
    isLoading: false,
  });

  // Copied indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(lang === 'es' ? 'Copiado al portapapeles' : 'Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Fetch clients from MongoDB backend
  const fetchClients = async (showToast = false) => {
    setIsRefreshing(true);
    try {
      const res = await getClients();
      setClients(res.data || []);
      if (showToast) {
        toast.success(
          lang === 'es' ? 'Directorio de clientes sincronizado' : 'Client directory synchronized'
        );
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
      toast.error(
        lang === 'es' ? 'Error al cargar clientes desde el backend' : 'Failed to load clients from backend'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Compute KPI metrics
  const metrics = useMemo(() => {
    const totalClients = clients.length;
    const pendingRequests = requests.filter((r) => r.status === 'PENDIENTE').length;
    const totalCreditLimit = clients.reduce((acc, c) => acc + (c.creditLimit || 0), 0);
    const uniqueCountries = new Set(clients.map((c) => c.country).filter(Boolean)).size;

    return {
      totalClients,
      pendingRequests,
      totalCreditLimit,
      uniqueCountries,
    };
  }, [clients, requests]);

  // Unique country list for filter
  const countryOptions = useMemo(() => {
    const set = new Set(clients.map((c) => c.country).filter(Boolean));
    return Array.from(set);
  }, [clients]);

  // Trash Counts
  const clientTrashCounts = useMemo(() => {
    const active = clients.filter((c) => c.isActive !== false && c.isDeleted !== true).length;
    const trash = clients.filter((c) => c.isActive === false || c.isDeleted === true).length;
    return { active, trash, all: clients.length };
  }, [clients]);

  // Filtered Clients (Directorio)
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch =
        !searchTerm.trim() ||
        (c.companyName && c.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.documentNumber && c.documentNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.contactName && c.contactName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.country && c.country.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const isItemDeleted = c.isActive === false || c.isDeleted === true;
      const matchesTrash =
        filterTrash === 'all' ||
        (filterTrash === 'active' && !isItemDeleted) ||
        (filterTrash === 'trash' && isItemDeleted);

      const matchesCountry = countryFilter === 'ALL' || c.country === countryFilter;
      const matchesIncoterm = incotermFilter === 'ALL' || c.preferredIncoterm === incotermFilter;
      const matchesCurrency = currencyFilter === 'ALL' || c.preferredCurrency === currencyFilter;

      return matchesSearch && matchesTrash && matchesCountry && matchesIncoterm && matchesCurrency;
    });
  }, [clients, searchTerm, filterTrash, countryFilter, incotermFilter, currencyFilter]);

  // Filtered Requests (Solicitudes B2B)
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (!searchTerm.trim()) return true;
      return (
        r.company.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.company.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [requests, searchTerm]);

  // --- CRUD Operations ---
  const handleSaveClient = async (clientData: Partial<Client>) => {
    if (editingClient?.id) {
      const res = await updateClient(editingClient.id, clientData);
      setClients((prev) =>
        prev.map((c) => (c.id === editingClient.id ? { ...c, ...res.data } : c))
      );
      toast.success(
        lang === 'es' ? 'Cliente actualizado exitosamente' : 'Client updated successfully'
      );
      notifyOperationUpdate({
        module: 'CLIENTES',
        actionType: 'ACTUALIZACIÓN',
        entityName: editingClient.companyName || 'Cliente B2B',
        details: `Actualización de ficha B2B de "${editingClient.companyName || 'Cliente'}". País: ${clientData.country || editingClient.country || 'N/A'}, Incoterm: ${clientData.preferredIncoterm || editingClient.preferredIncoterm || 'N/A'}.`,
        link: '/clientes',
      });
    } else {
      const res = await createClient(clientData as Omit<Client, 'id'>);
      setClients((prev) => [res.data, ...prev]);
      toast.success(
        lang === 'es' ? 'Cliente B2B registrado en MongoDB' : 'B2B Client registered in MongoDB'
      );
      notifyOperationUpdate({
        module: 'CLIENTES',
        actionType: 'CREACIÓN',
        entityName: res.data.companyName || 'Nuevo Cliente B2B',
        details: `Nuevo cliente importador B2B registrado: "${res.data.companyName || 'Cliente'}" (${res.data.country || 'Global'}).`,
        link: '/clientes',
      });
    }
  };

  // RESTAURAR CLIENTE (Alta Lógica TSE)
  const handleRestoreClient = async (client: Client) => {
    if (!client.id) return;
    try {
      const res = await restoreClient(client.id);
      const restored = res.data || { ...client, isActive: true, isDeleted: false };
      setClients((prev) =>
        prev.map((c) => (c.id === client.id ? { ...c, ...restored, isActive: true, isDeleted: false } : c))
      );
      toast.success(
        lang === 'es'
          ? `Cliente "${client.companyName}" restaurado con éxito al directorio activo`
          : `Client "${client.companyName}" restored to active directory`
      );
      notifyOperationUpdate({
        module: 'CLIENTES',
        actionType: 'RESTAURACIÓN',
        entityName: client.companyName || 'Cliente B2B',
        details: `El cliente B2B "${client.companyName || 'Cliente'}" fue restaurado con éxito al directorio activo.`,
        link: '/clientes',
      });
    } catch (err) {
      console.error('Error restoring client:', err);
      toast.error(lang === 'es' ? 'Error al restaurar cliente' : 'Failed to restore client');
    }
  };

  const handleDeleteClientConfirm = async () => {
    setDeleteModalState((p) => ({ ...p, isLoading: true }));
    try {
      if (filterTrash === 'trash') {
        // Purga definitiva (Hard Delete)
        await hardDeleteClient(deleteModalState.id);
        setClients((prev) => prev.filter((c) => c.id !== deleteModalState.id));
        toast.success(
          lang === 'es'
            ? `Cliente "${deleteModalState.name}" eliminado definitivamente`
            : `Client "${deleteModalState.name}" permanently deleted`
        );
        notifyOperationUpdate({
          module: 'CLIENTES',
          actionType: 'PAPELERA',
          entityName: deleteModalState.name,
          details: `Cliente "${deleteModalState.name}" purgado permanentemente del directorio MongoDB.`,
          link: '/clientes',
        });
      } else {
        // Eliminación lógica (Baja Lógica TSE)
        const res = await deleteClient(deleteModalState.id);
        const deleted = res.data || { isActive: false, isDeleted: true };
        setClients((prev) =>
          prev.map((c) => (c.id === deleteModalState.id ? { ...c, ...deleted, isActive: false, isDeleted: true } : c))
        );
        toast.success(
          lang === 'es'
            ? `Cliente "${deleteModalState.name}" enviado a la papelera (eliminado lógicamente)`
            : `Client "${deleteModalState.name}" moved to trash (soft deleted)`
        );
        notifyOperationUpdate({
          module: 'CLIENTES',
          actionType: 'PAPELERA',
          entityName: deleteModalState.name,
          details: `Cliente "${deleteModalState.name}" trasladado a la papelera lógica.`,
          link: '/clientes',
        });
      }
      setDeleteModalState((p) => ({ ...p, isOpen: false }));
    } catch (err) {
      console.error('Error deleting client:', err);
      toast.error(
        lang === 'es' ? 'Error al eliminar cliente' : 'Failed to delete client'
      );
    } finally {
      setDeleteModalState((p) => ({ ...p, isLoading: false }));
    }
  };

  // --- Request Approval / Rejection ---
  const handleApproveRequest = async (requestId: string) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    approveClientRequest(requestId);

    // Sync approved client into backend MongoDB directory
    try {
      const exists = clients.some(
        (c) => c.documentNumber === req.company.documentNumber
      );
      if (!exists) {
        const newClientRes = await createClient({
          companyName: req.company.companyName,
          documentType: req.company.documentType,
          documentNumber: req.company.documentNumber,
          country: req.company.country,
          address: req.company.address,
          phone: req.company.phone,
          email: req.email,
          contactName: req.name,
          preferredIncoterm: req.company.preferredIncoterm,
          preferredCurrency: req.company.preferredCurrency,
          creditLimit: 50000,
        });
        setClients((prev) => [newClientRes.data, ...prev]);
      }
      toast.success(
        lang === 'es'
          ? `Solicitud de "${req.company.companyName}" aprobada y cliente registrado en el directorio`
          : `Request for "${req.company.companyName}" approved and registered in directory`
      );
      notifyOperationUpdate({
        module: 'CLIENTES',
        actionType: 'ACTUALIZACIÓN',
        entityName: req.company.companyName,
        details: `Solicitud de registro B2B para "${req.company.companyName}" (${req.company.country}) aprobada por administración.`,
        link: '/clientes',
      });
    } catch (err) {
      console.warn('Cliente aprobado localmente, error al sincronizar con MongoDB:', err);
      toast.info(
        lang === 'es'
          ? `Solicitud de "${req.company.companyName}" aprobada con éxito`
          : `Request for "${req.company.companyName}" approved successfully`
      );
    }
  };

  const handleConfirmReject = (reason: string) => {
    rejectClientRequest(rejectModalState.requestId, reason);
    toast.error(
      lang === 'es'
        ? `Solicitud rechazada: ${reason}`
        : `Request rejected: ${reason}`
    );
  };

  // --- Export Handlers ---
  const handleExport = async (format: 'excel' | 'pdf' | 'csv') => {
    setIsExportMenuOpen(false);
    const toastId = toast.loading(
      lang === 'es' ? `Generando archivo ${format.toUpperCase()}...` : `Generating ${format.toUpperCase()}...`
    );

    try {
      if (format === 'excel') await exportClientsExcel();
      if (format === 'pdf') await exportClientsPdf();
      if (format === 'csv') await exportClientsCsv();

      toast.success(
        lang === 'es' ? 'Descarga completada' : 'Download completed',
        { id: toastId }
      );
    } catch (err) {
      console.error('Export error:', err);
      toast.error(
        lang === 'es' ? 'Error al generar reporte de clientes' : 'Failed to export client report',
        { id: toastId }
      );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 text-left">
      {/* ── Top Header & Tab Switcher ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
              {lang === 'es' ? 'Clientes B2B' : 'B2B Clients'}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              {lang === 'es' ? 'Directorio Internacional' : 'International Directory'}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {lang === 'es'
              ? 'Empresas importadoras, aprobación de solicitudes de acceso y condiciones de pago'
              : 'Importer accounts, access request approvals, Incoterms and credit terms'}
          </p>
        </div>

        {/* Tab Selector & Main Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tab Switcher Pills */}
          <div className="p-1 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center shadow-sm">
            <button
              onClick={() => {
                setActiveTab('directorio');
                setSearchTerm('');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'directorio'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Building2 size={15} />
              <span>{lang === 'es' ? 'Directorio Clientes' : 'Client Directory'}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'directorio'
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                }`}
              >
                {metrics.totalClients}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('solicitudes');
                setSearchTerm('');
              }}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'solicitudes'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Clock size={15} />
              <span>{lang === 'es' ? 'Solicitudes B2B' : 'B2B Requests'}</span>
              {metrics.pendingRequests > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-red-500 text-white animate-pulse">
                  {metrics.pendingRequests}
                </span>
              )}
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchClients(true)}
            disabled={isRefreshing}
            title={lang === 'es' ? 'Recargar datos' : 'Refresh data'}
            className="w-10 h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] text-xs font-semibold hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer shadow-sm"
            >
              <Download size={15} />
              <span>{lang === 'es' ? 'Exportar' : 'Export'}</span>
              <ChevronDown size={14} className="text-[var(--text-secondary)]" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl p-1.5 z-40 animate-fadeIn text-left">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-hint)]">
                  {lang === 'es' ? 'Reportes Oficiales' : 'Official Reports'}
                </div>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-primary)] hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors text-left cursor-pointer"
                >
                  <FileSpreadsheet size={16} className="text-emerald-500" />
                  <span>Microsoft Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-primary)] hover:bg-red-500/10 hover:text-red-500 transition-colors text-left cursor-pointer"
                >
                  <FileText size={16} className="text-red-500" />
                  <span>Documento PDF (.pdf)</span>
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-primary)] hover:bg-blue-500/10 hover:text-blue-500 transition-colors text-left cursor-pointer"
                >
                  <FileCode size={16} className="text-blue-500" />
                  <span>Valores CSV (.csv)</span>
                </button>
              </div>
            )}
          </div>

          {/* Import Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] text-xs font-semibold hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer shadow-sm"
            title={lang === 'es' ? 'Importar clientes desde Excel o CSV' : 'Import clients from Excel or CSV'}
          >
            <Upload size={15} className="text-emerald-500" />
            <span>{lang === 'es' ? 'Importar' : 'Import'}</span>
          </button>

          {/* New Client CTA */}
          <button
            onClick={() => {
              setEditingClient(null);
              setIsClientModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>{lang === 'es' ? 'Nuevo Cliente B2B' : 'New B2B Client'}</span>
          </button>
        </div>
      </div>

      {/* ── KPI Metric Cards Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1: Clientes Registrados */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {lang === 'es' ? 'Importadores Registrados' : 'Registered Importers'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Building2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">
            {metrics.totalClients}
          </div>
          <span className="text-[11px] text-blue-500 font-medium">
            {lang === 'es' ? 'Cuentas comerciales verificadas' : 'Verified commercial accounts'}
          </span>
        </div>

        {/* KPI 2: Solicitudes Pendientes */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {lang === 'es' ? 'Solicitudes Pendientes' : 'Pending Requests'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">
            {metrics.pendingRequests}
          </div>
          <span className="text-[11px] text-amber-500 font-medium">
            {metrics.pendingRequests > 0
              ? lang === 'es'
                ? 'Requieren revisión del Admin'
                : 'Require Admin review'
              : lang === 'es'
              ? 'Todas las solicitudes atendidas'
              : 'All requests reviewed'}
          </span>
        </div>

        {/* KPI 3: Línea de Crédito Total */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {lang === 'es' ? 'Crédito Global Autorizado' : 'Authorized Credit Line'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <span className="font-bold text-sm">$</span>
            </div>
          </div>
          <div className="text-2xl font-mono font-black text-[var(--text-primary)]">
            ${(metrics.totalCreditLimit / 1000).toFixed(0)}k
          </div>
          <span className="text-[11px] text-emerald-500 font-medium">
            {lang === 'es' ? 'Crédito rotativo en USD' : 'Revolving credit in USD'}
          </span>
        </div>

        {/* KPI 4: Países de Destino */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {lang === 'es' ? 'Países de Exportación' : 'Export Destinations'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Globe size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">
            {metrics.uniqueCountries}
          </div>
          <span className="text-[11px] text-[var(--text-hint)]">
            {lang === 'es' ? 'EE.UU., Países Bajos, España...' : 'USA, Netherlands, Spain...'}
          </span>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'directorio'
                ? lang === 'es'
                  ? 'Buscar por empresa, Tax ID, país, contacto...'
                  : 'Search by company, Tax ID, country, contact...'
                : lang === 'es'
                ? 'Buscar solicitudes por empresa o email...'
                : 'Search requests by company or email...'
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-hint)] hover:text-[var(--text-primary)]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters for Directorio Tab */}
        {activeTab === 'directorio' && (
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Country Filter */}
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-[var(--text-secondary)]" />
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-xs focus:outline-none"
              >
                <option value="ALL">{lang === 'es' ? 'Todos los países' : 'All countries'}</option>
                {countryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Incoterm Filter */}
            <select
              value={incotermFilter}
              onChange={(e) => setIncotermFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-xs focus:outline-none"
            >
              <option value="ALL">{lang === 'es' ? 'Todos los Incoterms' : 'All Incoterms'}</option>
              <option value="CIF">CIF (Cost, Insurance, Freight)</option>
              <option value="FOB">FOB (Free on Board)</option>
              <option value="CFR">CFR (Cost & Freight)</option>
              <option value="DDP">DDP (Delivered Duty Paid)</option>
              <option value="EXW">EXW (Ex Works)</option>
            </select>

            {/* Currency Filter */}
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-xs focus:outline-none"
            >
              <option value="ALL">{lang === 'es' ? 'Todas las monedas' : 'All currencies'}</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="PEN">PEN (S/)</option>
            </select>

            {/* Status Trash Tabs */}
            <StatusFilterTabs
              current={filterTrash}
              onChange={setFilterTrash}
              counts={clientTrashCounts}
              lang={lang}
            />

            <span className="text-xs text-[var(--text-hint)] pl-2 border-l border-[var(--border-subtle)]">
              {filteredClients.length} {lang === 'es' ? 'empresas' : 'companies'}
            </span>
          </div>
        )}
      </div>

      {/* ── Informative Banner when in Trash ── */}
      {filterTrash === 'trash' && activeTab === 'directorio' && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fadeIn">
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400 font-semibold">
            <Archive size={18} className="shrink-0" />
            <span>
              {lang === 'es'
                ? 'Estás visualizando la papelera de clientes B2B (eliminados lógicamente). Puedes restaurar cualquiera de ellos con un solo clic.'
                : 'Viewing trash for B2B clients (soft deleted). You can restore any client with a single click.'}
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

      {/* ── Table Container ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw size={28} className="animate-spin mx-auto text-blue-500" />
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              {lang === 'es' ? 'Cargando directorio desde MongoDB...' : 'Loading client directory from MongoDB...'}
            </p>
          </div>
        ) : activeTab === 'directorio' ? (
          /* ============================================================ */
          /* TAB 1: CLIENT DIRECTORY TABLE                                */
          /* ============================================================ */
          filteredClients.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
                <Building2 size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  {lang === 'es' ? 'No se encontraron clientes B2B' : 'No B2B clients found'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                  {searchTerm
                    ? lang === 'es'
                      ? 'No hay empresas que coincidan con la búsqueda.'
                      : 'No companies match your search criteria.'
                    : lang === 'es'
                    ? 'Aún no has registrado empresas importadoras en el directorio.'
                    : 'No importing companies registered in the directory yet.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingClient(null);
                  setIsClientModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>{lang === 'es' ? 'Registrar Primer Cliente' : 'Register First Client'}</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 text-[var(--text-secondary)] font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Empresa & Tax ID' : 'Company & Tax ID'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'País & Puerto' : 'Country & Seaport'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Contacto Comercial' : 'Contact Person'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Incoterm & Pago' : 'Incoterm & Terms'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Límite Crédito' : 'Credit Limit'}</th>
                    <th className="py-3.5 px-4 text-right">{lang === 'es' ? 'Acciones' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-[var(--bg-subtle)]/30 transition-colors group"
                    >
                      {/* Company Name & Tax ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[var(--text-primary)] text-sm">
                          {client.companyName || 'Empresa Sin Nombre'}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 font-mono text-[10px] text-[var(--text-secondary)]">
                          <span className="px-1.5 py-0.5 rounded bg-[var(--bg-app)] border border-[var(--border-subtle)] font-bold">
                            {client.documentType || 'EIN'}
                          </span>
                          <span>{client.documentNumber || '—'}</span>
                          {client.documentNumber && (
                            <button
                              onClick={() => copyToClipboard(client.documentNumber || '', `tax-${client.id}`)}
                              title={lang === 'es' ? 'Copiar Tax ID' : 'Copy Tax ID'}
                              className="text-[var(--text-hint)] hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              {copiedId === `tax-${client.id}` ? (
                                <Check size={11} className="text-emerald-500" />
                              ) : (
                                <Copy size={11} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Country & Destination Port */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                          <Globe size={13} className="text-blue-500 shrink-0" />
                          <span>{client.country}</span>
                        </div>
                        {client.destinationPort && (
                          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 flex items-center gap-1">
                            <Anchor size={11} className="text-cyan-500 shrink-0" />
                            <span className="truncate max-w-[180px]">{client.destinationPort}</span>
                          </div>
                        )}
                      </td>

                      {/* Contact Details */}
                      <td className="py-3.5 px-4">
                        <div className="text-[var(--text-primary)] font-medium">
                          {client.contactName || (lang === 'es' ? 'No asignado' : 'Not assigned')}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                          {client.email || client.phone || '—'}
                        </div>
                      </td>

                      {/* Incoterm & Payment Terms */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/30">
                            {client.preferredIncoterm || 'FOB'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--bg-app)] border border-[var(--border-subtle)]">
                            {client.paymentTerms || 'NET_30'}
                          </span>
                        </div>
                        <span className="inline-block text-[10px] text-[var(--text-hint)] mt-1">
                          {client.preferredCurrency || 'USD'}
                        </span>
                      </td>

                      {/* Credit Limit */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[var(--text-primary)] whitespace-nowrap">
                        ${client.creditLimit ? client.creditLimit.toLocaleString('en-US') : '0.00'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {client.isActive === false || client.isDeleted === true ? (
                            <>
                              <button
                                onClick={() => handleRestoreClient(client)}
                                title={lang === 'es' ? 'Restaurar al directorio activo' : 'Restore to active directory'}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
                              >
                                <RotateCcw size={13} />
                                <span>{lang === 'es' ? 'Restaurar' : 'Restore'}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteModalState({
                                    isOpen: true,
                                    id: client.id || '',
                                    name: client.companyName || 'Cliente',
                                    isLoading: false,
                                  });
                                }}
                                title={lang === 'es' ? 'Eliminar definitivamente' : 'Permanently delete'}
                                className="w-8 h-8 rounded-lg border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/15 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setDetailModalClient(client)}
                                title={lang === 'es' ? 'Ver ficha comercial' : 'View details'}
                                className="w-8 h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-secondary)] hover:text-blue-500 hover:border-blue-500/40 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingClient(client);
                                  setIsClientModalOpen(true);
                                }}
                                title={lang === 'es' ? 'Editar cliente' : 'Edit client'}
                                className="w-8 h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-secondary)] hover:text-blue-500 hover:border-blue-500/40 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteModalState({
                                    isOpen: true,
                                    id: client.id || '',
                                    name: client.companyName || 'Cliente',
                                    isLoading: false,
                                  });
                                }}
                                title={lang === 'es' ? 'Mover a papelera' : 'Move to trash'}
                                className="w-8 h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-secondary)] hover:text-red-500 hover:border-red-500/40 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* ============================================================ */
          /* TAB 2: B2B REGISTRATION REQUESTS                             */
          /* ============================================================ */
          filteredRequests.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                <Clock size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  {lang === 'es' ? 'No hay solicitudes de registro' : 'No registration requests'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                  {lang === 'es'
                    ? 'Las empresas que se registren mediante el formulario o Google aparecerán aquí para revisión.'
                    : 'Companies registering through the onboarding form or Google will appear here.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 text-[var(--text-secondary)] font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Empresa Solicitante' : 'Applicant Company'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Contacto / Email' : 'Contact / Email'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'País & Términos' : 'Country & Terms'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Fecha de Solicitud' : 'Submission Date'}</th>
                    <th className="py-3.5 px-4 text-center">{lang === 'es' ? 'Estado' : 'Status'}</th>
                    <th className="py-3.5 px-4 text-right">{lang === 'es' ? 'Decisión Admin' : 'Admin Decision'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-[var(--bg-subtle)]/30 transition-colors"
                    >
                      {/* Company Name & Tax ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[var(--text-primary)] text-sm">
                          {req.company.companyName}
                        </div>
                        <div className="text-[10px] font-mono text-[var(--text-secondary)] mt-0.5">
                          {req.company.documentType}: {req.company.documentNumber}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="text-[var(--text-primary)] font-medium">
                          {req.name}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)]">
                          {req.email}
                        </div>
                      </td>

                      {/* Country & Terms */}
                      <td className="py-3.5 px-4">
                        <div className="text-[var(--text-primary)] font-medium">
                          {req.company.country}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                          <span className="font-bold text-blue-500">
                            {req.company.preferredIncoterm}
                          </span>
                          <span className="text-[var(--text-hint)]">•</span>
                          <span className="text-[var(--text-secondary)]">
                            {req.company.preferredCurrency}
                          </span>
                        </div>
                      </td>

                      {/* Submission Date */}
                      <td className="py-3.5 px-4 text-[11px] text-[var(--text-secondary)]">
                        {new Date(req.createdAt).toLocaleDateString(lang === 'es' ? 'es-PE' : 'en-US', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            req.status === 'APROBADO'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                              : req.status === 'PENDIENTE'
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 animate-pulse'
                              : 'bg-red-500/10 text-red-500 border-red-500/30'
                          }`}
                        >
                          {req.status === 'APROBADO' && <CheckCircle2 size={12} />}
                          {req.status === 'PENDIENTE' && <Clock size={12} />}
                          {req.status === 'RECHAZADO' && <XCircle size={12} />}
                          <span>{req.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {req.status === 'PENDIENTE' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApproveRequest(req.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                            >
                              <Check size={13} />
                              <span>{lang === 'es' ? 'Aprobar' : 'Approve'}</span>
                            </button>
                            <button
                              onClick={() =>
                                setRejectModalState({
                                  isOpen: true,
                                  requestId: req.id,
                                  requestName: req.company.companyName,
                                })
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-bold transition-all cursor-pointer"
                            >
                              <XCircle size={13} />
                              <span>{lang === 'es' ? 'Rechazar' : 'Reject'}</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[var(--text-hint)] italic">
                            {req.reviewedBy ? `${lang === 'es' ? 'Revisado por' : 'Reviewed by'} ${req.reviewedBy}` : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* ── Client Create / Edit Modal ── */}
      <ClientModal
        isOpen={isClientModalOpen}
        client={editingClient}
        existingDocumentNumbers={clients.map((c) => c.documentNumber).filter(Boolean) as string[]}
        lang={lang}
        onClose={() => setIsClientModalOpen(false)}
        onSubmit={handleSaveClient}
      />

      {/* ── Client Detail Modal ── */}
      <ClientDetailModal
        isOpen={Boolean(detailModalClient)}
        client={detailModalClient}
        lang={lang}
        onClose={() => setDetailModalClient(null)}
        onEdit={(client) => {
          setEditingClient(client);
          setIsClientModalOpen(true);
        }}
      />

      {/* ── Reject Request Modal ── */}
      <RejectRequestModal
        isOpen={rejectModalState.isOpen}
        requestName={rejectModalState.requestName}
        lang={lang}
        onClose={() => setRejectModalState((p) => ({ ...p, isOpen: false }))}
        onConfirm={handleConfirmReject}
      />

      {/* ── Delete Confirmation Modal ── */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        isSoftDelete={filterTrash !== 'trash'}
        title={
          filterTrash === 'trash'
            ? lang === 'es'
              ? '¿Eliminar Cliente Definitivamente?'
              : 'Permanently Delete Client?'
            : lang === 'es'
            ? '¿Mover Cliente a la Papelera?'
            : 'Move Client to Trash?'
        }
        message={
          filterTrash === 'trash'
            ? lang === 'es'
              ? 'Esta acción purgará al cliente de MongoDB de manera irreversible.'
              : 'This will permanently remove the client from MongoDB.'
            : lang === 'es'
            ? 'El cliente será desactivado y pasará a la papelera. Podrás restaurarlo en cualquier momento sin perder su historial.'
            : 'The client will be deactivated and moved to trash. You can restore it anytime without losing history.'
        }
        itemName={deleteModalState.name}
        isLoading={deleteModalState.isLoading}
        lang={lang}
        onConfirm={handleDeleteClientConfirm}
        onCancel={() => setDeleteModalState((p) => ({ ...p, isOpen: false }))}
      />

      {/* ── Modal de Importación Masiva (Excel / CSV) ── */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        module="clients"
        lang={lang}
        onSuccess={() => {
          getClients().then((res) => setClients(res.data)).catch(console.error);
        }}
      />
    </div>
  );
}
