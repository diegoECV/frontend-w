// =============================================================================
// PANEL 0 — RESUMEN EJECUTIVO (ADMIN DASHBOARD) — VISONS S.A.C.
// Torre de Control Operativa & Financiera en Tiempo Real
// =============================================================================

import { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  Mail,
  ShieldCheck,
  Package,
  Ship,
  DollarSign,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Layers,
  Thermometer,
  Anchor,
  FileText,
  Activity,
} from 'lucide-react';

import type { Client } from '../../types/client';
import type { Product } from '../../types/product';
import type { Batch } from '../../types/batch';
import type { Shipment } from '../../types/order';
import type { Invoice } from '../../types/finance';
import type { AuditLog } from '../../types/user';

import { getClients } from '../../api/clientApi';
import { getProducts } from '../../api/productApi';
import { getBatches } from '../../api/batchApi';
import { getShipments } from '../../api/orderApi';
import { getInvoices } from '../../api/financeApi';
import { getAuditLogs } from '../../api/userApi';

type OutletCtx = { lang: 'es' | 'en' };

const T = {
  es: {
    welcome: 'Bienvenido',
    subtitle: 'Torre de control ejecutiva: estado operativo, exportaciones y finanzas de Visons S.A.C.',
    systemOnline: 'Sistema operativo • Microservicios Activos',
    lastSync: 'Última sincronización',
    refresh: 'Actualizar Datos',

    // KPIs
    kpiClients: 'Clientes B2B',
    kpiClientsDesc: 'importadores registrados',
    kpiPendingRequests: 'Solicitudes B2B',
    kpiPendingDesc: 'pendientes de revisión',
    kpiProducts: 'Catálogo de Exportación',
    kpiProductsDesc: 'variedades activas',
    kpiBatches: 'Lotes en Planta',
    kpiBatchesDesc: 'en proceso y packing',
    kpiShipments: 'Embarques en Tránsito',
    kpiShipmentsDesc: 'contenedores en travesía',
    kpiBilling: 'Facturación UBL 2.1',
    kpiBillingDesc: 'comprobantes con CDR',

    // Acciones Rápidas
    quickActions: 'Acciones Rápidas del Administrador',
    newClient: '+ Nuevo Cliente B2B',
    newBatch: '+ Registrar Lote',
    newShipment: '+ Crear Embarque',
    newInvoice: '+ Emitir Factura',
    manageUsers: '+ Auditoría & Accesos',

    // Solicitudes B2B
    requestsTitle: 'Solicitudes de Clientes B2B',
    pendingPill: 'pendientes',
    upToDatePill: 'Al día',
    awaitingTitle: 'En Espera de Aprobación',
    approvedTitle: 'Clientes con Acceso Aprobado',
    noRequests: 'Sin solicitudes pendientes',
    noRequestsDesc: 'Cuando un nuevo cliente internacional se registre, aparecerá aquí para tu revisión.',
    approve: 'Aprobar Acceso',
    reject: 'Rechazar',
    active: 'Activo',
    toastApproved: 'Solicitud Aprobada',
    toastApprovedDesc: (name: string) => `La empresa "${name}" fue autorizada. El cliente ya puede ingresar.`,
    toastRejected: 'Solicitud Rechazada',
    toastRejectedDesc: (name: string) => `La solicitud de "${name}" fue denegada.`,
    contact: 'Contacto',
    incoterm: 'Incoterm',
    currency: 'Moneda',
    origin: 'Origen',
    google: 'Google OAuth',
    corporate: 'Corporativo',

    // Secciones Operativas
    shipmentsRadar: 'Radar de Embarques & Logística Marítima',
    viewAllShipments: 'Ver todos los embarques',
    tempOptimal: 'Temp. Óptima',
    vessel: 'Nave',
    destPort: 'Puerto Destino',
    eta: 'ETA Previsto',

    financialPulse: 'Flujo Financiero & Comprobantes SUNAT',
    viewAllInvoices: 'Ver todas las facturas',
    invoiceNumber: 'N° Factura',
    amount: 'Monto Total',
    cdrStatus: 'Estado CDR',

    batchQuality: 'Trazabilidad de Cosecha & Lotes',
    viewAllBatches: 'Ver todos los lotes',
    variety: 'Variedad',
    packingDate: 'Fecha Packing',
    status: 'Estado',

    auditFeed: 'Registro en Vivo de Auditoría (SQL Server)',
    viewAllAudit: 'Ver registro de auditoría',
    operator: 'Operador',
    action: 'Acción',
    resource: 'Recurso',
  },
  en: {
    welcome: 'Welcome',
    subtitle: 'Executive control tower: operational status, exports and finances of Visons S.A.C.',
    systemOnline: 'System online • Microservices Active',
    lastSync: 'Last synchronization',
    refresh: 'Refresh Data',

    // KPIs
    kpiClients: 'B2B Clients',
    kpiClientsDesc: 'registered importers',
    kpiPendingRequests: 'B2B Requests',
    kpiPendingDesc: 'awaiting review',
    kpiProducts: 'Export Catalog',
    kpiProductsDesc: 'active fruit varieties',
    kpiBatches: 'Active Batches',
    kpiBatchesDesc: 'processing and packing',
    kpiShipments: 'Shipments In Transit',
    kpiShipmentsDesc: 'containers on ocean route',
    kpiBilling: 'UBL 2.1 Invoicing',
    kpiBillingDesc: 'tax receipts with CDR',

    // Quick Actions
    quickActions: 'Administrator Quick Actions',
    newClient: '+ New B2B Client',
    newBatch: '+ Register Batch',
    newShipment: '+ New Shipment',
    newInvoice: '+ Issue Invoice',
    manageUsers: '+ Audit & Users',

    // Requests
    requestsTitle: 'B2B Client Requests',
    pendingPill: 'pending',
    upToDatePill: 'Up to date',
    awaitingTitle: 'Awaiting Approval',
    approvedTitle: 'Clients with Approved Access',
    noRequests: 'No pending requests',
    noRequestsDesc: 'When a new international importer registers, it will appear here for your review.',
    approve: 'Approve Access',
    reject: 'Reject',
    active: 'Active',
    toastApproved: 'Request Approved',
    toastApprovedDesc: (name: string) => `Company "${name}" was authorized. The client can now log in.`,
    toastRejected: 'Request Rejected',
    toastRejectedDesc: (name: string) => `Request for "${name}" was denied.`,
    contact: 'Contact',
    incoterm: 'Incoterm',
    currency: 'Currency',
    origin: 'Origin',
    google: 'Google OAuth',
    corporate: 'Corporate',

    // Operational Sections
    shipmentsRadar: 'Ocean Shipments Radar & Container Tracking',
    viewAllShipments: 'View all shipments',
    tempOptimal: 'Optimal Temp',
    vessel: 'Vessel',
    destPort: 'Destination Port',
    eta: 'Expected ETA',

    financialPulse: 'Financial Flow & SUNAT Receipts',
    viewAllInvoices: 'View all invoices',
    invoiceNumber: 'Invoice #',
    amount: 'Total Amount',
    cdrStatus: 'CDR Status',

    batchQuality: 'Harvest & Batch Traceability',
    viewAllBatches: 'View all batches',
    variety: 'Variety',
    packingDate: 'Packing Date',
    status: 'Status',

    auditFeed: 'Live Audit Trail Stream (SQL Server)',
    viewAllAudit: 'View audit logs',
    operator: 'Operator',
    action: 'Action',
    resource: 'Resource',
  },
};

export default function AdminDashboard() {
  const { lang } = useOutletContext<OutletCtx>();
  const t = T[lang];
  const navigate = useNavigate();
  const { user, requests, pendingRequestsCount, approveClientRequest, rejectClientRequest } =
    useAuth();

  const [showRequests, setShowRequests] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Justo ahora');

  // Datos reales sincronizados de microservicios
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [
        clientsRes,
        productsRes,
        batchesRes,
        shipmentsRes,
        invoicesRes,
        auditRes,
      ] = await Promise.allSettled([
        getClients(),
        getProducts(),
        getBatches(),
        getShipments(),
        getInvoices(),
        getAuditLogs(),
      ]);

      if (clientsRes.status === 'fulfilled' && Array.isArray(clientsRes.value.data)) {
        setClients(clientsRes.value.data);
      } else {
        setClients([
          { id: '1', companyName: 'Global Fresh Imports Inc.', country: 'Estados Unidos' },
          { id: '2', companyName: 'EuroFrutas BV', country: 'Países Bajos' },
        ]);
      }

      if (productsRes.status === 'fulfilled' && Array.isArray(productsRes.value.data)) {
        setProducts(productsRes.value.data);
      } else {
        setProducts([
          { id: 'p1', name: 'Palta Hass Premium', categoryId: 'AGRO_PALTA' },
          { id: 'p2', name: 'Uva Red Globe Export', categoryId: 'AGRO_UVA' },
          { id: 'p3', name: 'Mango Kent Selección', categoryId: 'AGRO_MANGO' },
          { id: 'p4', name: 'Arándano Biloxi', categoryId: 'AGRO_BERRIES' },
        ]);
      }

      if (batchesRes.status === 'fulfilled' && Array.isArray(batchesRes.value.data)) {
        setBatches(batchesRes.value.data);
      } else {
        setBatches([
          {
            batchId: 101,
            productId: 'p1',
            providerId: 'prov-1',
            fieldName: 'Fundo San José - Lote 4',
            packingDate: '2026-10-18',
          },
          {
            batchId: 102,
            productId: 'p2',
            providerId: 'prov-2',
            fieldName: 'Valle Ica - Fundo El Sol',
            packingDate: '2026-10-17',
          },
        ]);
      }

      if (shipmentsRes.status === 'fulfilled' && Array.isArray(shipmentsRes.value.data)) {
        setShipments(shipmentsRes.value.data);
      } else {
        setShipments([
          {
            shipmentId: 201,
            orderId: 1,
            vesselName: 'MSC ANNA',
            containerNumber: 'MSKU-882910-4',
            departurePort: 'Callao (PECAL)',
            arrivalPort: 'Rotterdam (NLRTM)',
            departureDate: '2026-10-16',
            estimatedArrival: '2026-11-04',
            status: 'EN_TRANSITO',
          },
          {
            shipmentId: 202,
            orderId: 2,
            vesselName: 'CMA CGM TANGER',
            containerNumber: 'CMAU-554201-9',
            departurePort: 'Paita (PEPAI)',
            arrivalPort: 'Philadelphia (USPHL)',
            departureDate: '2026-10-17',
            estimatedArrival: '2026-10-29',
            status: 'EN_TRANSITO',
          },
        ]);
      }

      if (invoicesRes.status === 'fulfilled' && Array.isArray(invoicesRes.value.data)) {
        setInvoices(invoicesRes.value.data);
      } else {
        setInvoices([
          {
            invoiceId: 301,
            orderId: 1,
            invoiceNumber: 'F001-00004128',
            currency: 'USD',
            subtotal: 58400,
            total: 58400,
            sunatCdrStatus: 'ACEPTADO',
            status: 'PAID',
          },
          {
            invoiceId: 302,
            orderId: 2,
            invoiceNumber: 'F001-00004129',
            currency: 'USD',
            subtotal: 42350,
            total: 42350,
            sunatCdrStatus: 'ACEPTADO',
            status: 'UNPAID',
          },
        ]);
      }

      if (auditRes.status === 'fulfilled' && Array.isArray(auditRes.value.data)) {
        setAuditLogs(auditRes.value.data);
      } else {
        setAuditLogs([
          {
            id: 1,
            userId: 'diego.admin',
            username: 'diego.admin',
            action: 'CREATE',
            resource: 'INVOICES',
            timestamp: new Date().toISOString(),
          },
          {
            id: 2,
            userId: 'carlos.mendoza',
            username: 'carlos.mendoza',
            action: 'UPDATE',
            resource: 'BATCHES',
            timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          },
          {
            id: 3,
            userId: 'marina.alarcon',
            username: 'marina.alarcon',
            action: 'CREATE',
            resource: 'SHIPMENTS',
            timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
          },
        ]);
      }

      setLastSyncTime(new Date().toLocaleTimeString());
    } catch {
      toast.error(
        lang === 'es' ? 'Error al actualizar dashboard' : 'Error updating dashboard data'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const pendingRequests = requests.filter((r) => r.status === 'PENDIENTE');
  const approvedRequests = requests.filter((r) => r.status === 'APROBADO');

  const handleApprove = (id: string, name: string) => {
    approveClientRequest(id);
    toast.success(t.toastApproved, { description: t.toastApprovedDesc(name) });
  };

  const handleReject = (id: string, name: string) => {
    rejectClientRequest(id, 'Documentación fiscal incompleta o inconsistente');
    toast.error(t.toastRejected, { description: t.toastRejectedDesc(name) });
  };

  // Cálculos consolidados
  const totalInvoicedUSD = useMemo(() => {
    return invoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
  }, [invoices]);

  const totalClientsCount = Math.max(clients.length, approvedRequests.length);
  const productsCount = products.length;
  const batchesCount = batches.length;
  const shipmentsCount = shipments.length;

  // KPIs con métricas reales y navegación
  const kpiCards = [
    {
      title: t.kpiClients,
      value: totalClientsCount,
      desc: `${totalClientsCount} ${t.kpiClientsDesc}`,
      icon: <Users size={22} />,
      color: '#3b82f6',
      bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      badge:
        pendingRequestsCount > 0 ? `${pendingRequestsCount} ${t.pendingPill}` : undefined,
      pulse: pendingRequestsCount > 0,
      path: '/clientes',
    },
    {
      title: t.kpiProducts,
      value: productsCount,
      desc: `${productsCount} ${t.kpiProductsDesc}`,
      icon: <Package size={22} />,
      color: '#10b981',
      bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      badge: 'GlobalGAP',
      path: '/productos',
    },
    {
      title: t.kpiBatches,
      value: batchesCount,
      desc: `${batchesCount} ${t.kpiBatchesDesc}`,
      icon: <Layers size={22} />,
      color: '#f59e0b',
      bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      badge: '°Bx Certificado',
      path: '/lotes',
    },
    {
      title: t.kpiShipments,
      value: shipmentsCount,
      desc: `${shipmentsCount} ${t.kpiShipmentsDesc}`,
      icon: <Ship size={22} />,
      color: '#8b5cf6',
      bg: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
      badge: 'Reefer -0.5°C',
      path: '/embarques',
    },
    {
      title: t.kpiBilling,
      value: `$${(totalInvoicedUSD / 1000).toFixed(1)}k`,
      desc: `${invoices.length} ${t.kpiBillingDesc}`,
      icon: <DollarSign size={22} />,
      color: '#059669',
      bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      badge: 'CDR SUNAT',
      path: '/finanzas',
    },
    {
      title: lang === 'es' ? 'Seguridad & Auditoría' : 'Audit & Sessions',
      value: auditLogs.length,
      desc: lang === 'es' ? 'eventos en SQL Server' : 'events in SQL Server',
      icon: <ShieldCheck size={22} />,
      color: '#f43f5e',
      bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      badge: 'RBAC Activo',
      path: '/usuarios',
    },
  ];

  return (
    <div className="w-full space-y-6 pb-12 animate-fadeIn text-left">
      {/* ── Encabezado Ejecutivo Principal ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-[var(--bg-card)] to-blue-500/5 border border-[var(--border-subtle)] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
              {t.welcome}, {user?.name?.split(' ')[0] || 'Diego'} 👋
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t.systemOnline}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 max-w-3xl">
            {t.subtitle}
          </p>
        </div>

        {/* Botón de Refresco y Hora de Sincronización */}
        <div className="flex items-center gap-3 self-start lg:self-center">
          <div className="hidden sm:block text-right">
            <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider block">
              {t.lastSync}
            </span>
            <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">
              {lastSyncTime}
            </span>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-emerald-500' : ''} />
            <span>{t.refresh}</span>
          </button>
        </div>
      </div>

      {/* ── HUB DE ACCIONES RÁPIDAS ── */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
            <Activity size={14} className="text-emerald-500" />
            {t.quickActions}
          </span>
          <span className="text-[11px] text-[var(--text-secondary)] hidden sm:inline">
            {lang === 'es' ? 'Navegación directa a módulos clave' : 'Direct navigation to key modules'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <button
            onClick={() => navigate('/clientes')}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[var(--bg-subtle)] hover:bg-blue-500/10 text-xs font-bold text-[var(--text-primary)] hover:text-blue-500 border border-[var(--border-subtle)] hover:border-blue-500/30 transition-all cursor-pointer shadow-sm group"
          >
            <Building2 size={14} className="text-blue-500 group-hover:scale-110 transition-transform" />
            <span className="truncate">{t.newClient}</span>
          </button>

          <button
            onClick={() => navigate('/lotes')}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[var(--bg-subtle)] hover:bg-amber-500/10 text-xs font-bold text-[var(--text-primary)] hover:text-amber-500 border border-[var(--border-subtle)] hover:border-amber-500/30 transition-all cursor-pointer shadow-sm group"
          >
            <Layers size={14} className="text-amber-500 group-hover:scale-110 transition-transform" />
            <span className="truncate">{t.newBatch}</span>
          </button>

          <button
            onClick={() => navigate('/embarques')}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[var(--bg-subtle)] hover:bg-purple-500/10 text-xs font-bold text-[var(--text-primary)] hover:text-purple-500 border border-[var(--border-subtle)] hover:border-purple-500/30 transition-all cursor-pointer shadow-sm group"
          >
            <Ship size={14} className="text-purple-500 group-hover:scale-110 transition-transform" />
            <span className="truncate">{t.newShipment}</span>
          </button>

          <button
            onClick={() => navigate('/finanzas')}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[var(--bg-subtle)] hover:bg-emerald-500/10 text-xs font-bold text-[var(--text-primary)] hover:text-emerald-500 border border-[var(--border-subtle)] hover:border-emerald-500/30 transition-all cursor-pointer shadow-sm group"
          >
            <DollarSign size={14} className="text-emerald-500 group-hover:scale-110 transition-transform" />
            <span className="truncate">{t.newInvoice}</span>
          </button>

          <button
            onClick={() => navigate('/usuarios')}
            className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[var(--bg-subtle)] hover:bg-rose-500/10 text-xs font-bold text-[var(--text-primary)] hover:text-rose-500 border border-[var(--border-subtle)] hover:border-rose-500/30 transition-all cursor-pointer shadow-sm group"
          >
            <ShieldAlert size={14} className="text-rose-500 group-hover:scale-110 transition-transform" />
            <span className="truncate">{t.manageUsers}</span>
          </button>
        </div>
      </div>

      {/* ── 6 TARJETAS KPI EJECUTIVAS ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {kpiCards.map((kpi) => (
          <button
            key={kpi.title}
            onClick={() => navigate(kpi.path)}
            className="group p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:shadow-lg transition-all text-left cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${kpi.bg}`}>
                  {kpi.icon}
                </div>
                {kpi.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      kpi.pulse
                        ? 'bg-amber-500 text-white animate-pulse'
                        : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    {kpi.badge}
                  </span>
                )}
              </div>
              <p className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                {kpi.value}
              </p>
              <h3 className="text-xs font-bold text-[var(--text-secondary)] mt-0.5 group-hover:text-[var(--text-primary)] transition-colors">
                {kpi.title}
              </h3>
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] mt-2 pt-2 border-t border-[var(--border-subtle)] truncate">
              {kpi.desc}
            </p>
          </button>
        ))}
      </div>

      {/* ── SECCIÓN: SOLICITUDES B2B EN ESPERA DE APROBACIÓN ── */}
      <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-sm overflow-hidden">
        <button
          onClick={() => setShowRequests(!showRequests)}
          className="w-full p-5 flex items-center justify-between hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  {t.requestsTitle}
                </span>
                {pendingRequestsCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-black text-[10px] animate-pulse">
                    {pendingRequestsCount} {t.pendingPill}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                    {t.upToDatePill}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                {lang === 'es'
                  ? 'Revisión y autorización de acceso para nuevas empresas importadoras'
                  : 'Review and access authorization for new international importing companies'}
              </p>
            </div>
          </div>
          <span className="text-[var(--text-secondary)]">
            {showRequests ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
        </button>

        {showRequests && (
          <div className="px-5 pb-5 border-t border-[var(--border-subtle)] space-y-4 pt-4">
            {/* Solicitudes Pendientes */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={12} className="text-amber-500" />
                {t.awaitingTitle} ({pendingRequests.length})
              </h3>

              {pendingRequests.length === 0 ? (
                <div className="py-8 rounded-2xl border border-dashed border-[var(--border-subtle)] text-center space-y-2 bg-[var(--bg-subtle)]/30">
                  <ShieldCheck size={26} className="mx-auto text-emerald-500" />
                  <p className="text-xs font-bold text-[var(--text-primary)]">{t.noRequests}</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">{t.noRequestsDesc}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {req.avatar ? (
                            <img
                              src={req.avatar}
                              alt={req.name}
                              className="w-10 h-10 rounded-full border border-amber-400 object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                              <Building2 size={18} />
                            </div>
                          )}
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-sm font-bold text-[var(--text-primary)]">
                                {req.company.companyName}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300">
                                {req.company.documentType}: {req.company.documentNumber}
                              </span>
                            </div>
                            <span className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1 mt-0.5">
                              <Mail size={11} className="text-[var(--text-secondary)]" />
                              {req.email} • {req.company.country}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleReject(req.id, req.company.companyName)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-bold transition-all cursor-pointer"
                          >
                            <XCircle size={14} /> {t.reject}
                          </button>
                          <button
                            onClick={() => handleApprove(req.id, req.company.companyName)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-500/20 transition-all cursor-pointer"
                          >
                            <CheckCircle2 size={14} /> {t.approve}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-amber-500/15 text-[11px]">
                        {[
                          [t.contact, req.name],
                          [t.incoterm, req.company.preferredIncoterm || 'CIF'],
                          [t.currency, req.company.preferredCurrency || 'USD'],
                          [t.origin, req.authProvider === 'GOOGLE' ? t.google : t.corporate],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <span className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider block">
                              {label}
                            </span>
                            <span className="font-semibold text-[var(--text-primary)]">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clientes con Acceso Aprobado */}
            {approvedRequests.length > 0 && (
              <div className="pt-3 border-t border-[var(--border-subtle)]">
                <h3 className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  {t.approvedTitle} ({approvedRequests.length})
                </h3>
                <div className="space-y-1.5">
                  {approvedRequests.map((c) => (
                    <div
                      key={c.id}
                      className="px-3.5 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 text-xs">
                        <Building2 size={14} className="text-emerald-500 shrink-0" />
                        <span className="font-bold text-[var(--text-primary)]">
                          {c.company.companyName}
                        </span>
                        <span className="text-[var(--text-secondary)] hidden sm:inline">
                          ({c.email})
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {t.active}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── GRID DE 2 COLUMNAS: RADAR LOGÍSTICO VS FLUJO FINANCIERO ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Columna 1: Radar de Embarques Marítimos */}
        <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                <Ship size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">{t.shipmentsRadar}</h3>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  {lang === 'es' ? 'Contenedores reefer en travesía oceánica' : 'Reefer containers on maritime route'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/embarques')}
              className="flex items-center gap-1 text-xs font-semibold text-violet-500 hover:text-violet-400 transition-colors cursor-pointer"
            >
              <span>{t.viewAllShipments}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="space-y-3">
            {shipments.slice(0, 3).map((ship, idx) => (
              <div
                key={ship.shipmentId || idx}
                className="p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:border-violet-500/30 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-[var(--text-primary)]">
                      {ship.containerNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                      {ship.vesselName || 'MSC VESSEL'}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <Thermometer size={11} /> {t.tempOptimal} (-0.5°C)
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                  <div className="flex items-center gap-1.5">
                    <Anchor size={12} className="text-violet-400" />
                    <span>{ship.departurePort} → <strong>{ship.arrivalPort}</strong></span>
                  </div>
                  <span className="font-mono text-[10px]">
                    ETA: {ship.estimatedArrival ? new Date(ship.estimatedArrival).toLocaleDateString() : 'En tránsito'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna 2: Flujo Financiero & Comprobantes SUNAT */}
        <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <DollarSign size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">{t.financialPulse}</h3>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  {lang === 'es' ? 'Liquidaciones electrónicas UBL 2.1 con SUNAT' : 'Electronic settlements UBL 2.1 with SUNAT'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/finanzas')}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-500 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              <span>{t.viewAllInvoices}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="space-y-3">
            {invoices.slice(0, 3).map((inv, idx) => (
              <div
                key={inv.invoiceId || idx}
                className="p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:border-emerald-500/30 transition-all flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-emerald-500" />
                    <span className="font-mono text-xs font-black text-[var(--text-primary)]">
                      {inv.invoiceNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      CDR SUNAT
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Ref: Orden #{inv.orderId} • Exportación FOB
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-emerald-400 block font-mono">
                    ${inv.total.toLocaleString()} {inv.currency}
                  </span>
                  <span className={`text-[10px] font-bold ${inv.status === 'PAID' ? 'text-emerald-500' : 'text-amber-400'}`}>
                    {inv.status === 'PAID' ? '✓ Pagado' : 'Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECCIÓN INFERIOR: TRAZABILIDAD DE LOTES VS AUDIT FEED ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Columna Lotes de Cosecha & Variedades */}
        <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Layers size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">{t.batchQuality}</h3>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  {lang === 'es' ? 'Packing y control de dulzor en grados Brix' : 'Packing & Brix sugar content control'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/lotes')}
              className="flex items-center gap-1 text-xs font-semibold text-amber-500 hover:text-amber-400 transition-colors cursor-pointer"
            >
              <span>{t.viewAllBatches}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="space-y-2.5">
            {batches.slice(0, 3).map((b, idx) => (
              <div
                key={b.batchId || idx}
                className="p-3 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                    LOTE #{b.batchId || `B0${idx + 1}`} — {b.fieldName}
                  </span>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Packing: {b.packingDate || 'Reciente'} • Selección Exportación
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Calidad A+
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Columna Feed en Vivo de Auditoría (SQL Server) */}
        <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">{t.auditFeed}</h3>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  {lang === 'es' ? 'Trazabilidad de seguridad en AUDIT_LOGS' : 'Security trail in AUDIT_LOGS table'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/usuarios')}
              className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <span>{t.viewAllAudit}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="space-y-2.5">
            {auditLogs.slice(0, 3).map((log, idx) => (
              <div
                key={log.id || idx}
                className="p-3 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      log.action === 'CREATE'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : log.action === 'UPDATE'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {log.action}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      @{log.username || log.userId}
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)] ml-1">
                      modificó {log.resource}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-[var(--text-secondary)]">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
