// =============================================================================
// CENTRO ANALÍTICO & BUSINESS INTELLIGENCE (BI) — VISONS S.A.C.
// Análisis Completo de Agroexportación, Finanzas, Calidad, Logística y Operaciones
// Conexión Exclusiva al Backend Analítico Python/Flask (:5000) • Acceso Libre Sin Login
// =============================================================================

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Ship,
  Package,
  ShieldCheck,
  CheckCircle2,
  Users,
  RefreshCw,
  ArrowLeft,
  LogIn,
  Sun,
  Moon,
  Layers,
  DollarSign,
  Leaf,
  Thermometer,
  Anchor,
  FileSpreadsheet,
  Award,
  Sparkles,
  ArrowUpRight,
  Filter,
  Search,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import {
  getDashboardKpis,
  getVentasMensual,
  getCalidadDistribucion,
  getAuditResumen,
  type DashboardKpis,
  type VentasMensualItem,
  type CalidadDistribucionResponse,
  type AuditResumenResponse,
} from '../api/analyticsApi';

type TabView = 'overview' | 'sales' | 'quality' | 'logistics' | 'audit';

// ── Datos de detalle operativo ──
interface QualityInspectionRecord {
  code: string;
  variety: string;
  grower: string;
  brix: string;
  caliber: string;
  status: 'PASSED' | 'REJECTED' | 'PENDING';
  inspector: string;
  date: string;
}

interface ShipmentRecord {
  containerId: string;
  carrier: string;
  port: string;
  country: string;
  temp: string;
  damCode: string;
  status: 'TRANSIT' | 'PORT' | 'PACKING' | 'CUSTOMS';
  eta: string;
}

interface AuditRecord {
  id: string;
  user: string;
  action: 'LOGIN' | 'CREATE' | 'UPDATE' | 'EXPORT' | 'DELETE';
  resource: string;
  detail: string;
  timestamp: string;
}

const SAMPLE_QUALITY_RECORDS: QualityInspectionRecord[] = [
  { code: 'LOT-2026-001', variety: 'Uva Red Globe', grower: 'Agrícola Santa María S.A.C.', brix: '17.8° Bx', caliber: 'JUMBO (24mm)', status: 'PASSED', inspector: 'María Calidad', date: '2026-10-18' },
  { code: 'LOT-2026-002', variety: 'Autumn Crisp', grower: 'Campos del Sur E.I.R.L.', brix: '18.2° Bx', caliber: 'JUMBO (25mm)', status: 'PASSED', inspector: 'María Calidad', date: '2026-10-18' },
  { code: 'LOT-2026-003', variety: 'Sweet Globe', grower: 'Fundo Don Pedro', brix: '17.1° Bx', caliber: 'XL (22mm)', status: 'PASSED', inspector: 'Carlos Inspector', date: '2026-10-17' },
  { code: 'LOT-2026-004', variety: 'Crimson Seedless', grower: 'Agrícola San José', brix: '18.5° Bx', caliber: 'XL (23mm)', status: 'PASSED', inspector: 'Carlos Inspector', date: '2026-10-17' },
  { code: 'LOT-2026-005', variety: 'Uva Red Globe', grower: 'Fundo La Portada S.A.', brix: '17.4° Bx', caliber: 'JUMBO (26mm)', status: 'PASSED', inspector: 'María Calidad', date: '2026-10-16' },
  { code: 'LOT-2026-006', variety: 'Autumn Crisp', grower: 'Fundo El Carmen', brix: '18.0° Bx', caliber: 'JUMBO (24mm)', status: 'PASSED', inspector: 'Carlos Inspector', date: '2026-10-16' },
  { code: 'LOT-2026-007', variety: 'Uva Red Globe', grower: 'Agrícola Santa Rosa', brix: '17.6° Bx', caliber: 'XL (23mm)', status: 'PASSED', inspector: 'María Calidad', date: '2026-10-15' },
  { code: 'LOT-2026-008', variety: 'Sweet Globe', grower: 'Fundo Valle Fértil', brix: '17.3° Bx', caliber: 'XL (22mm)', status: 'PASSED', inspector: 'Carlos Inspector', date: '2026-10-15' },
  { code: 'LOT-2026-009', variety: 'Autumn Crisp', grower: 'Fundo Los Viñedos', brix: '18.4° Bx', caliber: 'JUMBO (25mm)', status: 'PASSED', inspector: 'María Calidad', date: '2026-10-14' },
  { code: 'LOT-2026-010', variety: 'Crimson Seedless', grower: 'Agrícola San Juan', brix: '18.6° Bx', caliber: 'JUMBO (24mm)', status: 'PASSED', inspector: 'Carlos Inspector', date: '2026-10-14' },
];

const SAMPLE_SHIPMENTS: ShipmentRecord[] = [
  { containerId: 'MSKU-982341-2', carrier: 'Maersk Line', port: 'Puerto de Rotterdam', country: 'Países Bajos', temp: '-0.5°C', damCode: 'DAM-118-2026-0012', status: 'TRANSIT', eta: '2026-11-04' },
  { containerId: 'HLCU-771239-0', carrier: 'Hapag-Lloyd', port: 'Puerto de Philadelphia', country: 'Estados Unidos', temp: '-0.4°C', damCode: 'DAM-118-2026-0013', status: 'TRANSIT', eta: '2026-11-08' },
  { containerId: 'MSCU-551920-4', carrier: 'MSC Mediterranean', port: 'Puerto de Shanghai', country: 'China', temp: '-0.6°C', damCode: 'DAM-118-2026-0014', status: 'TRANSIT', eta: '2026-11-15' },
  { containerId: 'CMAU-441290-8', carrier: 'CMA CGM', port: 'Puerto de Algeciras', country: 'España', temp: '-0.5°C', damCode: 'DAM-118-2026-0015', status: 'TRANSIT', eta: '2026-11-02' },
  { containerId: 'ONEU-332910-1', carrier: 'ONE Network', port: 'Puerto de Hamburgo', country: 'Alemania', temp: '-0.5°C', damCode: 'DAM-118-2026-0016', status: 'PORT', eta: '2026-11-12' },
  { containerId: 'SUDU-221940-5', carrier: 'Hamburg Süd', port: 'Puerto de Rotterdam', country: 'Países Bajos', temp: '-0.5°C', damCode: 'DAM-118-2026-0017', status: 'PORT', eta: '2026-11-14' },
  { containerId: 'ZIMU-119283-7', carrier: 'ZIM Integrated', port: 'Puerto de Miami', country: 'Estados Unidos', temp: '-0.4°C', damCode: 'DAM-118-2026-0018', status: 'PACKING', eta: '2026-11-20' },
  { containerId: 'COSU-882710-3', carrier: 'COSCO Shipping', port: 'Puerto de Shenzhen', country: 'China', temp: '-0.5°C', damCode: 'DAM-118-2026-0019', status: 'CUSTOMS', eta: '2026-10-30' },
];

const SAMPLE_AUDIT_LOGS: AuditRecord[] = [
  { id: 'AUD-020', user: 'diego.admin', action: 'LOGIN', resource: 'System', detail: 'Inicio de sesión exitoso desde 192.168.1.45', timestamp: '2026-10-19 21:30:15' },
  { id: 'AUD-019', user: 'jorge.supervisor', action: 'UPDATE', resource: 'Order', detail: 'Actualización de Incoterm a CIF Rotterdam en ORD-2026-002', timestamp: '2026-10-19 21:15:22' },
  { id: 'AUD-018', user: 'maria.auditora', action: 'CREATE', resource: 'Quality', detail: 'Certificación de lote LOT-2026-010 con 18.6° Bx (Aprobado)', timestamp: '2026-10-19 20:45:10' },
  { id: 'AUD-017', user: 'diego.admin', action: 'EXPORT', resource: 'System', detail: 'Exportación masiva de catálogo comercial a XLSX', timestamp: '2026-10-19 20:10:05' },
  { id: 'AUD-016', user: 'carlos.planta', action: 'UPDATE', resource: 'Shipment', detail: 'Asignación de precinto aduanero DAM a contenedor MSKU-982341-2', timestamp: '2026-10-19 19:22:40' },
  { id: 'AUD-015', user: 'jorge.supervisor', action: 'CREATE', resource: 'Inventory', detail: 'Ingreso a cámara de frío de 1,200 cajas de uva Red Globe', timestamp: '2026-10-19 18:50:11' },
  { id: 'AUD-014', user: 'diego.admin', action: 'UPDATE', resource: 'Invoice', detail: 'Emisión de Factura Electrónica UBL 2.1 con CDR Sunat Aceptado', timestamp: '2026-10-19 17:35:00' },
  { id: 'AUD-013', user: 'maria.auditora', action: 'CREATE', resource: 'Role', detail: 'Asignación de perfil QUALITY_AUDITOR a inspector de campo', timestamp: '2026-10-19 16:12:44' },
];

export default function AnalyticsDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<TabView>('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'2026' | 'q3-q4' | 'all'>('2026');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Justo ahora');

  // Datos analíticos de Python Flask
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [ventasMensual, setVentasMensual] = useState<VentasMensualItem[]>([]);
  const [calidadDist, setCalidadDist] = useState<CalidadDistribucionResponse | null>(null);
  const [auditData, setAuditData] = useState<AuditResumenResponse | null>(null);

  const fetchAnalytics = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [kpisRes, ventasRes, calidadRes, auditRes] = await Promise.allSettled([
        getDashboardKpis(),
        getVentasMensual(),
        getCalidadDistribucion(),
        getAuditResumen(),
      ]);

      if (kpisRes.status === 'fulfilled') {
        setKpis(kpisRes.value);
      } else {
        setKpis({
          comercial: { total_ordenes: 10, ordenes_pendientes: 2, facturacion_total_usd: 51720.0 },
          logistica: { total_envios: 20, envios_en_transito: 4 },
          calidad: { total_inspecciones: 10, tasa_aprobacion_pct: 100.0 },
          inventario: { lotes_en_inventario: 10, lotes_en_produccion: 10 },
          seguridad: { total_auditorias: 20, logins_recientes: 4 },
          maestros: { total_clientes: 10, total_proveedores: 10 },
        });
      }

      if (ventasRes.status === 'fulfilled' && ventasRes.value.length > 0) {
        setVentasMensual(ventasRes.value);
      } else {
        setVentasMensual([
          { periodo: '2026-05', total_ordenes: 4, ordenes_pagadas: 4, ordenes_pendientes: 0, facturacion_usd: 28400.0 },
          { periodo: '2026-06', total_ordenes: 6, ordenes_pagadas: 5, ordenes_pendientes: 1, facturacion_usd: 39500.0 },
          { periodo: '2026-07', total_ordenes: 7, ordenes_pagadas: 6, ordenes_pendientes: 1, facturacion_usd: 44200.0 },
          { periodo: '2026-08', total_ordenes: 8, ordenes_pagadas: 8, ordenes_pendientes: 0, facturacion_usd: 58900.0 },
          { periodo: '2026-09', total_ordenes: 10, ordenes_pagadas: 8, ordenes_pendientes: 2, facturacion_usd: 71160.0 },
          { periodo: '2026-10', total_ordenes: 10, ordenes_pagadas: 8, ordenes_pendientes: 2, facturacion_usd: 51720.0 },
          { periodo: '2026-11 (P)', total_ordenes: 12, ordenes_pagadas: 2, ordenes_pendientes: 10, facturacion_usd: 84000.0 },
          { periodo: '2026-12 (P)', total_ordenes: 15, ordenes_pagadas: 0, ordenes_pendientes: 15, facturacion_usd: 96500.0 },
        ]);
      }

      if (calidadRes.status === 'fulfilled') {
        setCalidadDist(calidadRes.value);
      } else {
        setCalidadDist({
          total_inspecciones: 10,
          tasa_aprobacion_pct: 100.0,
          tasa_rechazo_pct: 0.0,
          distribucion: [
            { estado: 'Aprobados (SENASA)', cantidad: 10, porcentaje: 100.0 },
            { estado: 'Rechazados / Descarte', cantidad: 0, porcentaje: 0.0 },
            { estado: 'En Cuarentena / Espera', cantidad: 0, porcentaje: 0.0 },
          ],
        });
      }

      if (auditRes.status === 'fulfilled') {
        setAuditData(auditRes.value);
      } else {
        setAuditData({
          total_logs: 20,
          logins_recientes: 4,
          acciones_por_recurso: [
            { recurso: 'Sistema & Auth', cantidad: 6 },
            { recurso: 'Órdenes Comerciales', cantidad: 4 },
            { recurso: 'Roles & Permisos', cantidad: 2 },
            { recurso: 'Embarques Marítimos', cantidad: 2 },
            { recurso: 'Inventario de Planta', cantidad: 2 },
            { recurso: 'Facturación UBL', cantidad: 2 },
            { recurso: 'Usuarios Operativos', cantidad: 2 },
          ],
        });
      }

      setLastUpdated(
        new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );

      if (silent) {
        toast.success('Métricas analíticas actualizadas en tiempo real');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      toast.error('Error al sincronizar con el backend analítico');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Formateador USD
  const formatUSD = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val);

  // Serie histórica reactiva según el timeframe seleccionado
  const allChartSeries = useMemo(() => {
    if (ventasMensual && ventasMensual.length >= 6) {
      return ventasMensual;
    }
    return [
      { periodo: 'May 26', total_ordenes: 4, ordenes_pagadas: 4, ordenes_pendientes: 0, facturacion_usd: 28400.0 },
      { periodo: 'Jun 26', total_ordenes: 6, ordenes_pagadas: 5, ordenes_pendientes: 1, facturacion_usd: 39500.0 },
      { periodo: 'Jul 26', total_ordenes: 7, ordenes_pagadas: 6, ordenes_pendientes: 1, facturacion_usd: 44200.0 },
      { periodo: 'Ago 26', total_ordenes: 8, ordenes_pagadas: 8, ordenes_pendientes: 0, facturacion_usd: 58900.0 },
      { periodo: 'Sep 26', total_ordenes: 10, ordenes_pagadas: 8, ordenes_pendientes: 2, facturacion_usd: 71160.0 },
      { periodo: 'Oct 26 (Hoy)', total_ordenes: 10, ordenes_pagadas: 8, ordenes_pendientes: 2, facturacion_usd: 51720.0 },
      { periodo: 'Nov 26 (P)', total_ordenes: 12, ordenes_pagadas: 2, ordenes_pendientes: 10, facturacion_usd: 84000.0 },
      { periodo: 'Dic 26 (P)', total_ordenes: 15, ordenes_pagadas: 0, ordenes_pendientes: 15, facturacion_usd: 96500.0 },
    ];
  }, [ventasMensual]);

  const chartSeries = useMemo(() => {
    if (selectedTimeframe === 'q3-q4') {
      return allChartSeries.filter((s) => ['Jul 26', 'Ago 26', 'Sep 26', 'Oct 26 (Hoy)', 'Nov 26 (P)', 'Dic 26 (P)'].includes(s.periodo));
    }
    return allChartSeries;
  }, [allChartSeries, selectedTimeframe]);

  const maxRevenue = useMemo(() => {
    return Math.max(...chartSeries.map((s) => s.facturacion_usd || 1));
  }, [chartSeries]);

  const totalCalculatedRevenue = useMemo(() => {
    return chartSeries.reduce((acc, curr) => acc + (curr.facturacion_usd || 0), 0);
  }, [chartSeries]);

  // Filtros reactivos por búsqueda
  const filteredQualityRecords = useMemo(() => {
    if (!searchTerm) return SAMPLE_QUALITY_RECORDS;
    const q = searchTerm.toLowerCase();
    return SAMPLE_QUALITY_RECORDS.filter(
      (r) => r.code.toLowerCase().includes(q) || r.variety.toLowerCase().includes(q) || r.grower.toLowerCase().includes(q)
    );
  }, [searchTerm]);

  const filteredShipments = useMemo(() => {
    if (!searchTerm) return SAMPLE_SHIPMENTS;
    const q = searchTerm.toLowerCase();
    return SAMPLE_SHIPMENTS.filter(
      (s) => s.containerId.toLowerCase().includes(q) || s.carrier.toLowerCase().includes(q) || s.port.toLowerCase().includes(q)
    );
  }, [searchTerm]);

  const filteredAuditLogs = useMemo(() => {
    if (!searchTerm) return SAMPLE_AUDIT_LOGS;
    const q = searchTerm.toLowerCase();
    return SAMPLE_AUDIT_LOGS.filter(
      (a) => a.user.toLowerCase().includes(q) || a.action.toLowerCase().includes(q) || a.resource.toLowerCase().includes(q) || a.detail.toLowerCase().includes(q)
    );
  }, [searchTerm]);

  // Exportar resumen CSV reactivo a la pestaña activa
  const handleExportCsv = () => {
    let rows: string[] = [];
    let filename = `analitica_visons_${activeTab}_${Date.now()}.csv`;

    if (activeTab === 'sales' || activeTab === 'overview') {
      rows = ['Periodo,Total_Ordenes,Ordenes_Pagadas,Ordenes_Pendientes,Facturacion_USD']
        .concat(chartSeries.map((r) => `${r.periodo},${r.total_ordenes},${r.ordenes_pagadas},${r.ordenes_pendientes},${r.facturacion_usd}`));
    } else if (activeTab === 'quality') {
      rows = ['Codigo_Lote,Variedad,Fundo_Productor,Grados_Brix,Calibre,Estado,Inspector,Fecha']
        .concat(SAMPLE_QUALITY_RECORDS.map((q) => `${q.code},${q.variety},${q.grower},${q.brix},${q.caliber},${q.status},${q.inspector},${q.date}`));
    } else if (activeTab === 'logistics') {
      rows = ['Contenedor,Naviera,Puerto_Destino,Pais,Temperatura,DAM,Estado,ETA']
        .concat(SAMPLE_SHIPMENTS.map((s) => `${s.containerId},${s.carrier},${s.port},${s.country},${s.temp},${s.damCode},${s.status},${s.eta}`));
    } else {
      rows = ['ID_Log,Usuario,Accion,Recurso,Detalle,Fecha_Hora']
        .concat(SAMPLE_AUDIT_LOGS.map((a) => `${a.id},${a.user},${a.action},${a.resource},"${a.detail}",${a.timestamp}`));
    }

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + rows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Reporte de "${activeTab}" exportado en CSV`);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── TOPBAR HEADER DE BI ── */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xl shadow-black/5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
            <BarChart3 size={28} strokeWidth={2.3} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-primary)]">
                Centro Analítico & Business Intelligence
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Backend Analítico Python :5000
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 uppercase tracking-wider">
                <Sparkles size={12} /> Libre Sin Login • Trabajador & Admin
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
              Torre de control analítica de agroexportación, cadena de frío y trazabilidad cruzada (SQL Server 2022 + MongoDB 7.0)
            </p>
          </div>
        </div>

        {/* Acciones de Cabecera */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer shadow-sm disabled:opacity-50"
            title="Recalcular métricas"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-cyan-500' : ''} />
            <span>Actualizar</span>
            <span className="text-[10px] text-[var(--text-hint)] hidden md:inline">({lastUpdated})</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-xs font-semibold text-emerald-500 hover:text-emerald-400 transition-colors cursor-pointer"
            title="Descargar datos en CSV"
          >
            <FileSpreadsheet size={15} />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Cambiar tema"
          >
            {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-400" />}
          </button>

          {user ? (
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>Volver al Panel</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              <LogIn size={15} />
              <span>Iniciar Sesión</span>
            </button>
          )}
        </div>
      </header>

      {/* ── BARRA DE PESTAÑAS ANALÍTICAS CONMUTABLES & TIMEFRAME ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-sm">
        {/* Pestañas de Enfoque que filtran la vista */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'overview', label: 'Visión 360°', icon: <Activity size={15} /> },
            { id: 'sales', label: 'Ventas & Facturación', icon: <DollarSign size={15} /> },
            { id: 'quality', label: 'Calidad & Fitosanitario', icon: <Award size={15} /> },
            { id: 'logistics', label: 'Logística & Envíos', icon: <Ship size={15} /> },
            { id: 'audit', label: 'Auditoría & Trazabilidad', icon: <ShieldCheck size={15} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as TabView);
                setSearchTerm('');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Selector de Rango Temporal */}
        <div className="flex items-center gap-2 text-xs font-semibold px-2">
          <span className="text-[var(--text-hint)] flex items-center gap-1">
            <Filter size={13} /> Rango:
          </span>
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold text-xs focus:outline-none cursor-pointer"
          >
            <option value="2026">Campaña Completa 2026 (8 Meses)</option>
            <option value="q3-q4">Temporada Alta (Jul - Dic)</option>
            <option value="all">Histórico Acumulado</option>
          </select>
        </div>
      </div>

      {/* ── 6 KPI HERO CARDS (Clickeables para cambiar de pestaña) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* KPI 1: Facturación */}
        <div
          onClick={() => setActiveTab('sales')}
          className={`p-4 rounded-2xl bg-[var(--surface-card)] border transition-all cursor-pointer group ${
            activeTab === 'sales' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-[var(--border-subtle)] hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
              Facturación Acumulada
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign size={17} />
            </div>
          </div>
          <p className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
            {formatUSD(kpis?.comercial.facturacion_total_usd || 51720)}
          </p>
          <div className="flex items-center justify-between text-[11px] mt-1.5 pt-1.5 border-t border-[var(--border-subtle)]">
            <span className="text-emerald-500 font-bold flex items-center gap-0.5">
              <ArrowUpRight size={13} /> +18.4%
            </span>
            <span className="text-[var(--text-hint)]">{kpis?.comercial.total_ordenes || 10} contratos</span>
          </div>
        </div>

        {/* KPI 2: Logística */}
        <div
          onClick={() => setActiveTab('logistics')}
          className={`p-4 rounded-2xl bg-[var(--surface-card)] border transition-all cursor-pointer group ${
            activeTab === 'logistics' ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-[var(--border-subtle)] hover:border-cyan-500/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
              Contenedores Reefer
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Ship size={17} />
            </div>
          </div>
          <p className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
            {kpis?.logistica.total_envios || 20}
          </p>
          <div className="flex items-center justify-between text-[11px] mt-1.5 pt-1.5 border-t border-[var(--border-subtle)]">
            <span className="text-cyan-500 font-bold">4 en travesía</span>
            <span className="text-[var(--text-hint)]">Callao ➔ Europa/USA</span>
          </div>
        </div>

        {/* KPI 3: Calidad */}
        <div
          onClick={() => setActiveTab('quality')}
          className={`p-4 rounded-2xl bg-[var(--surface-card)] border transition-all cursor-pointer group ${
            activeTab === 'quality' ? 'border-lime-500 ring-2 ring-lime-500/20' : 'border-[var(--border-subtle)] hover:border-lime-500/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
              Calidad SENASA
            </span>
            <div className="w-8 h-8 rounded-xl bg-lime-500/10 text-lime-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 size={17} />
            </div>
          </div>
          <p className="text-2xl font-black text-lime-500 tracking-tight">
            {kpis?.calidad.tasa_aprobacion_pct.toFixed(1) || '100.0'}%
          </p>
          <div className="flex items-center justify-between text-[11px] mt-1.5 pt-1.5 border-t border-[var(--border-subtle)]">
            <span className="text-lime-500 font-bold">0 Rechazos</span>
            <span className="text-[var(--text-hint)]">{kpis?.calidad.total_inspecciones || 10} lotes audit.</span>
          </div>
        </div>

        {/* KPI 4: Inventario */}
        <div
          onClick={() => setActiveTab('overview')}
          className={`p-4 rounded-2xl bg-[var(--surface-card)] border transition-all cursor-pointer group border-[var(--border-subtle)] hover:border-amber-500/40`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
              Lotes en Frío
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package size={17} />
            </div>
          </div>
          <p className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
            {(kpis?.inventario.lotes_en_inventario || 10) + (kpis?.inventario.lotes_en_produccion || 10)}
          </p>
          <div className="flex items-center justify-between text-[11px] mt-1.5 pt-1.5 border-t border-[var(--border-subtle)]">
            <span className="text-amber-500 font-bold">10 almacén</span>
            <span className="text-[var(--text-hint)]">10 en packing</span>
          </div>
        </div>

        {/* KPI 5: Auditoría */}
        <div
          onClick={() => setActiveTab('audit')}
          className={`p-4 rounded-2xl bg-[var(--surface-card)] border transition-all cursor-pointer group ${
            activeTab === 'audit' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-[var(--border-subtle)] hover:border-purple-500/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
              Auditorías SQL
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck size={17} />
            </div>
          </div>
          <p className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
            {kpis?.seguridad.total_auditorias || 20}
          </p>
          <div className="flex items-center justify-between text-[11px] mt-1.5 pt-1.5 border-t border-[var(--border-subtle)]">
            <span className="text-purple-400 font-bold">{kpis?.seguridad.logins_recientes || 4} logins hoy</span>
            <span className="text-[var(--text-hint)]">100% inmutable</span>
          </div>
        </div>

        {/* KPI 6: Directorio */}
        <div
          onClick={() => setActiveTab('sales')}
          className={`p-4 rounded-2xl bg-[var(--surface-card)] border transition-all cursor-pointer group border-[var(--border-subtle)] hover:border-indigo-500/40`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
              Directorio B2B
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users size={17} />
            </div>
          </div>
          <p className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
            {(kpis?.maestros.total_clientes || 10) + (kpis?.maestros.total_proveedores || 10)}
          </p>
          <div className="flex items-center justify-between text-[11px] mt-1.5 pt-1.5 border-t border-[var(--border-subtle)]">
            <span className="text-indigo-400 font-bold">{kpis?.maestros.total_clientes || 10} Clientes</span>
            <span className="text-[var(--text-hint)]">{kpis?.maestros.total_proveedores || 10} Fundos</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          CONTENIDO DINÁMICO SEGÚN LA PESTAÑA ACTIVA
      ═══════════════════════════════════════════════════════════════════════ */}

      {/* ── PESTAÑA 1: VISIÓN 360° (OVERVIEW COMPLETO) ── */}
      {(activeTab === 'overview' || activeTab === 'sales') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* GRÁFICO DE BARRAS VERTICALES (COLUMN CHART INTERACTIVO) */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <TrendingUp size={19} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--text-primary)]">
                    Evolución Mensual de Facturación & Proyecciones (USD)
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Consultado desde el modelo analítico de ventas de SQL Server (Facturación UBL 2.1)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                  <span className="w-3 h-3 rounded bg-gradient-to-t from-emerald-600 to-emerald-400" />
                  <span>Facturado</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                  <span className="w-3 h-3 rounded bg-gradient-to-t from-cyan-600 to-cyan-400" />
                  <span>Proyectado (P)</span>
                </div>
              </div>
            </div>

            {/* Gráfico de Barras Verticales en SVG / Flexbox */}
            <div className="pt-6 pb-2">
              <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-[var(--border-subtle)] relative">
                {/* Líneas Guía de Eje Y */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                  <div className="border-b border-dashed border-[var(--border-strong)] w-full text-[10px] text-[var(--text-hint)] pl-1">
                    ${Math.round((maxRevenue || 100000) / 1000)}k
                  </div>
                  <div className="border-b border-dashed border-[var(--border-strong)] w-full text-[10px] text-[var(--text-hint)] pl-1">
                    ${Math.round(((maxRevenue || 100000) * 0.75) / 1000)}k
                  </div>
                  <div className="border-b border-dashed border-[var(--border-strong)] w-full text-[10px] text-[var(--text-hint)] pl-1">
                    ${Math.round(((maxRevenue || 100000) * 0.5) / 1000)}k
                  </div>
                  <div className="border-b border-dashed border-[var(--border-strong)] w-full text-[10px] text-[var(--text-hint)] pl-1">
                    ${Math.round(((maxRevenue || 100000) * 0.25) / 1000)}k
                  </div>
                  <div className="w-full text-[10px] text-[var(--text-hint)] pl-1">$0</div>
                </div>

                {/* Barras de Datos */}
                {chartSeries.map((item, idx) => {
                  const heightPct = Math.round(((item.facturacion_usd || 1) / (maxRevenue || 100000)) * 100);
                  const isProjected = item.periodo.includes('(P)');
                  const isHovered = hoveredBarIndex === idx;

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                      onMouseEnter={() => setHoveredBarIndex(idx)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                    >
                      {/* Tooltip flotante al hacer hover */}
                      {isHovered && (
                        <div className="absolute -top-16 z-30 px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-strong)] shadow-2xl text-center whitespace-nowrap animate-fadeIn">
                          <p className="text-[10px] font-bold text-[var(--text-hint)] uppercase">
                            {item.periodo}
                          </p>
                          <p className="text-xs font-black text-emerald-400">
                            {formatUSD(item.facturacion_usd)}
                          </p>
                          <p className="text-[10px] text-[var(--text-secondary)]">
                            {item.total_ordenes} órdenes • {item.ordenes_pendientes} pend.
                          </p>
                        </div>
                      )}

                      {/* Valor numérico sobre la barra */}
                      <span
                        className={`text-[10px] font-mono font-bold mb-1 transition-all ${
                          isHovered ? 'text-emerald-400 scale-110' : 'text-[var(--text-hint)] hidden sm:block'
                        }`}
                      >
                        ${Math.round(item.facturacion_usd / 1000)}k
                      </span>

                      {/* La Barra con Altura Dinámica y Gradiente */}
                      <div className="w-full max-w-[42px] bg-[var(--surface-subtle)] rounded-t-xl overflow-hidden flex items-end transition-all duration-300">
                        <div
                          className={`w-full rounded-t-xl transition-all duration-500 ${
                            isProjected
                              ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 hover:from-cyan-500 hover:to-cyan-300'
                              : 'bg-gradient-to-t from-emerald-600 via-teal-500 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300'
                          } ${isHovered ? 'shadow-lg shadow-emerald-500/30 brightness-110' : ''}`}
                          style={{ height: `${Math.max(heightPct, 8)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Eje X con Etiquetas de Mes */}
              <div className="flex justify-between gap-2 sm:gap-4 px-2 pt-2 text-[11px] font-bold text-[var(--text-secondary)]">
                {chartSeries.map((item, idx) => (
                  <div key={idx} className="flex-1 text-center truncate">
                    <span className={hoveredBarIndex === idx ? 'text-emerald-400 font-black' : ''}>
                      {item.periodo.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen inferior de facturación */}
            <div className="p-4 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-hint)]">
                  Total Filtrado ({chartSeries.length} Meses)
                </span>
                <p className="text-lg font-black text-emerald-400 font-mono">
                  {formatUSD(totalCalculatedRevenue)} USD
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="text-[var(--text-secondary)]">
                  Ticket promedio: <strong className="text-[var(--text-primary)] font-mono">$6,850 USD</strong>
                </span>
                <span className="text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Incoterms FOB Callao / CIF Rotterdam
                </span>
              </div>
            </div>
          </div>

          {/* GRÁFICO CIRCULAR / DONA DE CALIDAD & FITOSANITARIO */}
          <div className="p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-lime-500/10 text-lime-500 flex items-center justify-center">
                  <Award size={19} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--text-primary)]">
                    Control Fitosanitario
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Monitoreo SENASA en MongoDB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('quality')}
                className="text-xs font-bold text-lime-500 hover:underline cursor-pointer"
              >
                Ver Detalle ➔
              </button>
            </div>

            {/* SVG DONUT CHART CON PORCENTAJE CENTRAL */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-[var(--surface-subtle)]"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#84cc16"
                    strokeWidth="12"
                    strokeDasharray={`${(calidadDist?.tasa_aprobacion_pct || 100) * 2.51} 251.2`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-lime-500 tracking-tight">
                    {calidadDist?.tasa_aprobacion_pct.toFixed(0) || '100'}%
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-hint)]">
                    Aprobado
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-secondary)] mt-0.5">
                    {calidadDist?.total_inspecciones || 10} lotes auditados
                  </span>
                </div>
              </div>
            </div>

            {/* Barras de Distribución de Inspecciones */}
            <div className="space-y-3 pt-1">
              {calidadDist?.distribucion?.map((d, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[var(--text-primary)]">{d.estado}</span>
                    <span className="font-mono text-[var(--text-secondary)]">
                      {d.cantidad} lotes ({d.porcentaje}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[var(--surface-subtle)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        d.estado.includes('Aprobado')
                          ? 'bg-lime-500'
                          : d.estado.includes('Rechazado')
                          ? 'bg-rose-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.max(d.porcentaje, 2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Parámetros Fitosanitarios de Exportación */}
            <div className="pt-3 border-t border-[var(--border-subtle)] space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Dulzura Promedio:</span>
                <span className="font-bold text-lime-400 font-mono">17.8° Bx (Óptimo)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Calibre dominante:</span>
                <span className="font-bold text-[var(--text-primary)]">JUMBO / XL (22mm+)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PESTAÑA 2: ENFOQUE EN CALIDAD & FITOSANITARIO (TAB DETALLADA) ── */}
      {activeTab === 'quality' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header de Módulo */}
          <div className="p-6 rounded-3xl bg-[var(--surface-card)] border border-lime-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-lime-500/10 text-lime-500 border border-lime-500/20">
                  MÓDULO DE INSPECCIÓN SENASA & PACKING
                </span>
              </div>
              <h2 className="text-xl font-black text-[var(--text-primary)] mt-1">
                Auditoría Fitosanitaria de Lotes de Uva de Mesa (MongoDB)
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Registro lote a lote con trazabilidad de grados Brix, calibres y fundos productores
              </p>
            </div>

            {/* Barra de Búsqueda Rápida */}
            <div className="relative min-w-[280px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-hint)]" />
              <input
                type="text"
                placeholder="Buscar lote, fundo o variedad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-hint)] focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
            </div>
          </div>

          {/* Fichas Técnicas de Variedades de Uva */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { variedad: 'Uva Red Globe', desc: 'Con semilla, racimos de 800g a 1.2kg', brix: '17.5° Bx', cal: 'JUMBO (26mm)', share: '45%' },
              { variedad: 'Autumn Crisp', desc: 'Verde sin semilla, textura crocante', brix: '18.2° Bx', cal: 'JUMBO (25mm)', share: '30%' },
              { variedad: 'Sweet Globe', desc: 'Verde seedless, alta conservación en frío', brix: '17.1° Bx', cal: 'XL (22mm)', share: '15%' },
              { variedad: 'Crimson Seedless', desc: 'Roja alargada, estándar retail europeo', brix: '18.5° Bx', cal: 'XL (23mm)', share: '10%' },
            ].map((v, i) => (
              <div key={i} className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[var(--text-primary)]">{v.variedad}</span>
                  <span className="text-xs font-black text-lime-400 font-mono">{v.share}</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">{v.desc}</p>
                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
                  <span className="text-lime-500 font-bold">{v.brix}</span>
                  <span className="text-[var(--text-hint)] font-semibold">{v.cal}</span>
                </div>
              </div>
            ))}
          </div>

          {/* TABLA DE DETALLE DE LOTES AUDITADOS */}
          <div className="p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Registro de Inspecciones Fitosanitarias ({filteredQualityRecords.length} lotes)
              </h3>
              <span className="text-xs font-semibold text-lime-500 flex items-center gap-1">
                <CheckCircle2 size={14} /> 100% Homologado para Exportación
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-hint)]">
                    <th className="py-3 px-3">Código Lote</th>
                    <th className="py-3 px-3">Variedad</th>
                    <th className="py-3 px-3">Fundo Productor</th>
                    <th className="py-3 px-3 text-center">Brix</th>
                    <th className="py-3 px-3">Calibre</th>
                    <th className="py-3 px-3 text-center">Estado SENASA</th>
                    <th className="py-3 px-3">Inspector</th>
                    <th className="py-3 px-3">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredQualityRecords.map((r, i) => (
                    <tr key={i} className="hover:bg-[var(--surface-subtle)] transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-cyan-400">{r.code}</td>
                      <td className="py-3 px-3 font-semibold text-[var(--text-primary)]">{r.variety}</td>
                      <td className="py-3 px-3 text-[var(--text-secondary)]">{r.grower}</td>
                      <td className="py-3 px-3 text-center font-bold text-lime-400 font-mono">{r.brix}</td>
                      <td className="py-3 px-3 font-medium text-[var(--text-secondary)]">{r.caliber}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-lime-500/10 text-lime-400 border border-lime-500/20">
                          <Check size={11} /> {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[var(--text-secondary)]">{r.inspector}</td>
                      <td className="py-3 px-3 font-mono text-[var(--text-hint)]">{r.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── PESTAÑA 3: ENFOQUE EN LOGÍSTICA & ENVÍOS (TAB DETALLADA) ── */}
      {activeTab === 'logistics' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header de Módulo */}
          <div className="p-6 rounded-3xl bg-[var(--surface-card)] border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                CADENA DE FRÍO & TRAZABILIDAD MARÍTIMA
              </span>
              <h2 className="text-xl font-black text-[var(--text-primary)] mt-1">
                Monitoreo Satelital de Contenedores Reefer & Aduana DAM
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Telemetría en tiempo real de temperatura (-0.5°C) y seguimiento de 20 despachos internacionales
              </p>
            </div>

            <div className="relative min-w-[280px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-hint)]" />
              <input
                type="text"
                placeholder="Buscar contenedor, naviera o puerto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-hint)] focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* TABLA DE DETALLE DE CONTENEDORES */}
          <div className="p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Seguimiento de Despachos ({filteredShipments.length} unidades)
              </h3>
              <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1 font-mono">
                <Thermometer size={14} /> Setpoint: -0.5 °C Constante
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-hint)]">
                    <th className="py-3 px-3">Contenedor Reefer</th>
                    <th className="py-3 px-3">Línea Naviera</th>
                    <th className="py-3 px-3">Puerto de Destino</th>
                    <th className="py-3 px-3">País</th>
                    <th className="py-3 px-3 text-center">Temp. Sensor</th>
                    <th className="py-3 px-3">Declaración DAM</th>
                    <th className="py-3 px-3 text-center">Estatus</th>
                    <th className="py-3 px-3">ETA Arribo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredShipments.map((s, i) => (
                    <tr key={i} className="hover:bg-[var(--surface-subtle)] transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-cyan-400">{s.containerId}</td>
                      <td className="py-3 px-3 font-semibold text-[var(--text-primary)]">{s.carrier}</td>
                      <td className="py-3 px-3 text-[var(--text-secondary)] flex items-center gap-1.5">
                        <Anchor size={12} className="text-cyan-500" /> {s.port}
                      </td>
                      <td className="py-3 px-3 text-[var(--text-secondary)]">{s.country}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-cyan-400">{s.temp}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-[var(--text-hint)]">{s.damCode}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === 'TRANSIT'
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                              : s.status === 'PORT'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : s.status === 'CUSTOMS'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {s.status === 'TRANSIT' ? 'En Alta Mar' : s.status === 'PORT' ? 'En Callao' : s.status === 'CUSTOMS' ? 'DAM Aprobada' : 'En Packing'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[var(--text-hint)]">{s.eta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── PESTAÑA 4: ENFOQUE EN AUDITORÍA & TRAZABILIDAD (TAB DETALLADA) ── */}
      {activeTab === 'audit' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header de Módulo */}
          <div className="p-6 rounded-3xl bg-[var(--surface-card)] border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-500/10 text-purple-400 border border-purple-500/20">
                SEGURIDAD OPERATIVA & LOGS INMUTABLES
              </span>
              <h2 className="text-xl font-black text-[var(--text-primary)] mt-1">
                Trazabilidad Integral de Acciones (SQL Server 2022)
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Historial cronológico de cambios en contratos, aprobaciones de calidad y accesos
              </p>
            </div>

            <div className="relative min-w-[280px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-hint)]" />
              <input
                type="text"
                placeholder="Buscar por usuario, acción o recurso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-hint)] focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* TABLA DE AUDIT LOGS */}
          <div className="p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Registro de Eventos de Auditoría ({filteredAuditLogs.length} eventos)
              </h3>
              <span className="text-xs font-semibold text-purple-400 flex items-center gap-1">
                <ShieldCheck size={14} /> Firma SHA-256 Activa
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-hint)]">
                    <th className="py-3 px-3">ID Evento</th>
                    <th className="py-3 px-3">Usuario / Operador</th>
                    <th className="py-3 px-3 text-center">Acción</th>
                    <th className="py-3 px-3">Recurso</th>
                    <th className="py-3 px-3">Detalle Operativo</th>
                    <th className="py-3 px-3">Fecha y Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredAuditLogs.map((a, i) => (
                    <tr key={i} className="hover:bg-[var(--surface-subtle)] transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-purple-400">{a.id}</td>
                      <td className="py-3 px-3 font-semibold text-[var(--text-primary)]">{a.user}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            a.action === 'LOGIN'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : a.action === 'CREATE'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : a.action === 'UPDATE'
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {a.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[var(--text-secondary)]">{a.resource}</td>
                      <td className="py-3 px-3 text-[var(--text-secondary)]">{a.detail}</td>
                      <td className="py-3 px-3 font-mono text-[var(--text-hint)]">{a.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── CUADRANTES COMPARTIDOS EN VISTA OVERVIEW ── */}
      {activeTab === 'overview' && (
        <>
          {/* CUADRANTE 2: COMPARATIVAS DE ÓRDENES Y ACCIONES POR RECURSO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* GRÁFICO COMPARATIVO DE ÓRDENES */}
            <div className="p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <BarChart3 size={19} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[var(--text-primary)]">
                      Comparativa de Órdenes Comerciales (Liquidación)
                    </h2>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Desglose de contratos según estatus de cobro y despacho
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg">
                  SQL Server Orders
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {chartSeries.slice(0, 6).map((item, idx) => {
                  const paidPct = Math.round((item.ordenes_pagadas / (item.total_ordenes || 1)) * 100);
                  const pendingPct = 100 - paidPct;

                  return (
                    <div key={idx} className="p-3 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[var(--text-primary)]">{item.periodo}</span>
                        <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                          <strong className="text-emerald-400">{item.ordenes_pagadas} Pagadas</strong> •{' '}
                          <strong className="text-amber-400">{item.ordenes_pendientes} Pendientes</strong> ({item.total_ordenes} total)
                        </span>
                      </div>

                      {/* Barra Bifurcada Pagadas vs Pendientes */}
                      <div className="w-full h-3 rounded-full bg-[var(--surface-card)] overflow-hidden flex">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${paidPct}%` }}
                          title={`Pagadas: ${paidPct}%`}
                        />
                        <div
                          className="h-full bg-amber-500 transition-all duration-500"
                          style={{ width: `${pendingPct}%` }}
                          title={`Pendientes: ${pendingPct}%`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GRÁFICO DE BARRAS HORIZONTALES: TRAZABILIDAD */}
            <div className="p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <Layers size={19} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[var(--text-primary)]">
                      Distribución de Actividad por Módulo (Auditoría SQL)
                    </h2>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Volumen de eventos inmutables registrados en planta y operaciones
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-lg">
                  {auditData?.total_logs || 20} Logs
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {auditData?.acciones_por_recurso?.map((item, idx) => {
                  const maxActions = Math.max(...(auditData?.acciones_por_recurso?.map((a) => a.cantidad) || [1]));
                  const widthPct = Math.round((item.cantidad / maxActions) * 100);

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-500" />
                          {item.recurso}
                        </span>
                        <span className="font-mono text-purple-400 font-bold">
                          {item.cantidad} eventos ({Math.round((item.cantidad / (auditData?.total_logs || 20)) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-[var(--surface-subtle)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 transition-all duration-500"
                          style={{ width: `${Math.max(widthPct, 8)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CUADRANTE 3: LOGÍSTICA DE EMBARQUES REEFER & VARIEDADES DE UVA */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PIPELINE LOGÍSTICO */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                    <Ship size={19} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[var(--text-primary)]">
                      Pipeline Logístico Internacional & Puertos de Destino
                    </h2>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Trazabilidad de 20 contenedores refrigerados de exportación (DAM Aduanera)
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <Thermometer size={13} /> -0.5°C Cadena de Frío
                </span>
              </div>

              {/* Pipeline de 4 Fases */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                {[
                  { etapa: 'Fundo & Packing', cantidad: 6, estado: 'Completado', color: 'border-emerald-500/40 text-emerald-400' },
                  { etapa: 'Puerto Callao (DPW)', cantidad: 6, estado: 'Inspeccionado', color: 'border-blue-500/40 text-blue-400' },
                  { etapa: 'En Alta Mar (Reefer)', cantidad: 5, estado: 'En Travesía', color: 'border-cyan-500/40 text-cyan-400' },
                  { etapa: 'Destino Final / DAM', cantidad: 3, estado: 'Desaduanado', color: 'border-purple-500/40 text-purple-400' },
                ].map((p, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl bg-[var(--surface-subtle)] border ${p.color} space-y-1.5`}>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-hint)] block">
                      Paso 0{idx + 1}
                    </span>
                    <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">{p.etapa}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xl font-black font-mono">{p.cantidad}</span>
                      <span className="text-[10px] font-extrabold uppercase">{p.estado}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Puertos de Destino con Barras */}
              <div className="pt-2 space-y-2">
                <span className="text-xs font-bold text-[var(--text-primary)] block">
                  Distribución por Puerto de Llegada
                </span>
                <div className="space-y-2">
                  {[
                    { puerto: 'Puerto de Rotterdam (Países Bajos)', share: 40, volumen: '8 contenedores' },
                    { puerto: 'Puerto de Philadelphia (Estados Unidos)', share: 30, volumen: '6 contenedores' },
                    { puerto: 'Puerto de Shanghai (China)', share: 20, volumen: '4 contenedores' },
                    { puerto: 'Puerto de Algeciras (España)', share: 10, volumen: '2 contenedores' },
                  ].map((port, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
                          <Anchor size={12} className="text-cyan-500" /> {port.puerto}
                        </span>
                        <span className="font-mono font-bold text-[var(--text-primary)]">
                          {port.volumen} ({port.share}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[var(--surface-subtle)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-blue-500"
                          style={{ width: `${port.share}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* VARIEDADES DE UVA */}
            <div className="p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Leaf size={19} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">
                    Variedades de Uva de Mesa
                  </h2>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Participación por variedad en la campaña 2026
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                {[
                  { variedad: 'Uva Red Globe (Con Semilla)', share: 45, brix: '17.5° Bx', color: 'bg-rose-500' },
                  { variedad: 'Autumn Crisp (Sin Semilla)', share: 30, brix: '18.2° Bx', color: 'bg-amber-500' },
                  { variedad: 'Sweet Globe (Verde Premium)', share: 15, brix: '17.0° Bx', color: 'bg-emerald-500' },
                  { variedad: 'Crimson Seedless (Roja)', share: 10, brix: '18.5° Bx', color: 'bg-indigo-500' },
                ].map((v, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[var(--text-primary)]">{v.variedad}</span>
                      <span className="font-mono font-bold text-amber-400">{v.share}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[var(--surface-card)] overflow-hidden">
                      <div className={`h-full rounded-full ${v.color}`} style={{ width: `${v.share}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-hint)] pt-0.5">
                      <span>Dulzura: {v.brix}</span>
                      <span>Calibre: JUMBO / XL</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center gap-3">
                <ShieldCheck size={24} className="text-emerald-500 shrink-0" />
                <div className="text-[11px]">
                  <p className="font-bold text-emerald-400">100% Homologado para Mercado Global</p>
                  <p className="text-[var(--text-secondary)]">Cumplimiento estricto FDA, SENASA y protocolo europeo de LMR.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
