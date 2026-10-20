// =============================================================================
// DASHBOARD DEL TRABAJADOR (PLANTA & CONTROL DE CALIDAD) — VISONS S.A.C.
// =============================================================================
// Interfaz operativa completa para operarios de planta, inspectores de calidad y
// personal de almacén frigorífico. Cumple estrictamente con el principio RBAC
// (oculta finanzas, márgenes y administración de usuarios).
// =============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Briefcase,
  ShieldCheck,
  Boxes,
  Thermometer,
  Truck,
  LayoutDashboard,
  RefreshCw,
  Search,
  Printer,
  ChevronRight,
  Snowflake,
  PackageCheck,
  Scale,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getQualityInspections,
  createQualityInspection,
  getInventoryBatches,
  createInventoryBatch,
  getTemperatureLogs,
  createTemperatureLog,
} from '../../api/batchApi';
import { getOrders, updateOrder } from '../../api/orderApi';
import type { QualityInspection, InventoryBatch, TemperatureLog } from '../../types/batch';
import type { Order } from '../../types/order';

// Tipo de Tab activo
type WorkerTab = 'overview' | 'quality' | 'batches' | 'cold-chain' | 'packing-list';

// Modelos locales enriquecidos para la UI de Planta
interface EnrichedInspection extends QualityInspection {
  cropName?: string;
  variety?: string;
  brixDegree?: number;
  firmnessLb?: number;
  defectsPercentage?: number;
  lotCode?: string;
}

interface EnrichedBatch extends InventoryBatch {
  lotCode?: string;
  cropName?: string;
  variety?: string;
  providerName?: string;
  grossWeightKg?: number;
  tareWeightKg?: number;
  netWeightKg?: number;
  boxCount?: number;
  chamberAssigned?: string;
  stage?: 'RECEPCION' | 'SELECCION' | 'EMPAQUE' | 'CAMARA_FRIO' | 'DESPACHADO';
}

interface EnrichedColdLog extends TemperatureLog {
  chamberName?: string;
  targetMin?: number;
  targetMax?: number;
}

// Datos iniciales realistas para VISONS S.A.C. (Agroexportación)
const INITIAL_INSPECTIONS: EnrichedInspection[] = [
  {
    id: 'insp-001',
    batchId: 'LOT-2026-HASS-01',
    lotCode: 'LOT-2026-HASS-01',
    cropName: 'Palta Hass',
    variety: 'Hass Orgánica',
    inspectorId: 'Carlos Ramírez',
    inspectionDate: new Date().toISOString(),
    result: 'PASSED',
    brixDegree: 21.8,
    firmnessLb: 14.5,
    defectsPercentage: 1.2,
    notes: 'Fruta con excelente materia seca y calibre uniforme. Apta para exportación UE.',
  },
  {
    id: 'insp-002',
    batchId: 'LOT-2026-BLUE-04',
    lotCode: 'LOT-2026-BLUE-04',
    cropName: 'Arándano',
    variety: 'Biloxi Premium',
    inspectorId: 'Carlos Ramírez',
    inspectionDate: new Date(Date.now() - 3600000 * 2).toISOString(),
    result: 'PASSED',
    brixDegree: 13.5,
    firmnessLb: 18.0,
    defectsPercentage: 0.8,
    notes: 'Pruina completa, sin daños mecánicos. Cumple protocolo US-FDA.',
  },
  {
    id: 'insp-003',
    batchId: 'LOT-2026-MANG-02',
    lotCode: 'LOT-2026-MANG-02',
    cropName: 'Mango',
    variety: 'Kent de Exportación',
    inspectorId: 'Carlos Ramírez',
    inspectionDate: new Date(Date.now() - 3600000 * 5).toISOString(),
    result: 'CONDITIONALLY_ACCEPTED',
    brixDegree: 14.2,
    firmnessLb: 11.0,
    defectsPercentage: 4.5,
    notes: 'Leve quema de sol en 4.5% de muestra. Requiere clasificación manual en mesa 2.',
  },
  {
    id: 'insp-004',
    batchId: 'LOT-2026-GRAP-01',
    lotCode: 'LOT-2026-GRAP-01',
    cropName: 'Uva de Mesa',
    variety: 'Red Globe',
    inspectorId: 'Carlos Ramírez',
    inspectionDate: new Date(Date.now() - 3600000 * 8).toISOString(),
    result: 'REJECTED',
    brixDegree: 11.0,
    firmnessLb: 8.5,
    defectsPercentage: 9.8,
    notes: 'Brix inferior al límite de contrato (mínimo 14°). Destino mercado nacional.',
  },
];

const INITIAL_BATCHES: EnrichedBatch[] = [
  {
    id: 'batch-001',
    lotCode: 'LOT-2026-HASS-01',
    cropName: 'Palta',
    variety: 'Hass Calibre 14-16',
    providerName: 'Fundo Santa Rosa (Cañete)',
    grossWeightKg: 12450,
    tareWeightKg: 650,
    netWeightKg: 11800,
    quantity: 11800,
    boxCount: 2950,
    chamberAssigned: 'Cámara 02 - Frío Palta (5°C)',
    stage: 'CAMARA_FRIO',
    status: 'EN_PROCESAMIENTO',
    harvestDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
  },
  {
    id: 'batch-002',
    lotCode: 'LOT-2026-BLUE-04',
    cropName: 'Arándano',
    variety: 'Biloxi Jumbo',
    providerName: 'Agropecuaria Valle Sur',
    grossWeightKg: 5200,
    tareWeightKg: 400,
    netWeightKg: 4800,
    quantity: 4800,
    boxCount: 3200,
    chamberAssigned: 'Cámara 03 - Frío Arándanos (2°C)',
    stage: 'EMPAQUE',
    status: 'EN_PROCESAMIENTO',
    harvestDate: new Date(Date.now() - 43200000).toISOString().split('T')[0],
  },
  {
    id: 'batch-003',
    lotCode: 'LOT-2026-MANG-02',
    cropName: 'Mango',
    variety: 'Kent Aéreo',
    providerName: 'Fundo Los Olivos (Piura)',
    grossWeightKg: 8900,
    tareWeightKg: 500,
    netWeightKg: 8400,
    quantity: 8400,
    boxCount: 1400,
    chamberAssigned: 'Cámara 01 - Pre-frío',
    stage: 'SELECCION',
    status: 'EN_PROCESAMIENTO',
    harvestDate: new Date().toISOString().split('T')[0],
  },
  {
    id: 'batch-004',
    lotCode: 'LOT-2026-ASPA-09',
    cropName: 'Espárrago',
    variety: 'Verde Fresco Calibre L',
    providerName: 'Cooperativa Agraria Virú',
    grossWeightKg: 6100,
    tareWeightKg: 350,
    netWeightKg: 5750,
    quantity: 5750,
    boxCount: 1150,
    chamberAssigned: 'Cámara 01 - Pre-frío',
    stage: 'RECEPCION',
    status: 'EN_RECEPCION',
    harvestDate: new Date().toISOString().split('T')[0],
  },
];

const INITIAL_COLD_LOGS: EnrichedColdLog[] = [
  {
    id: 'temp-001',
    chamberName: 'Cámara 02 - Conservación Palta',
    sensorId: 'SNS-CAM-02',
    temperatureCelsius: 4.8,
    humidityPercent: 88,
    status: 'NORMAL',
    targetMin: 4.0,
    targetMax: 6.0,
    recordedAt: new Date().toISOString(),
  },
  {
    id: 'temp-002',
    chamberName: 'Cámara 03 - Túnel Arándano',
    sensorId: 'SNS-CAM-03',
    temperatureCelsius: 2.1,
    humidityPercent: 92,
    status: 'NORMAL',
    targetMin: 1.5,
    targetMax: 3.0,
    recordedAt: new Date().toISOString(),
  },
  {
    id: 'temp-003',
    chamberName: 'Cámara 01 - Pre-frío General',
    sensorId: 'SNS-CAM-01',
    temperatureCelsius: 5.9,
    humidityPercent: 82,
    status: 'WARNING',
    targetMin: 3.0,
    targetMax: 5.5,
    recordedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'temp-004',
    chamberName: 'Contenedor Reefer 40ft (HMMU-9281)',
    sensorId: 'SNS-REEFER-01',
    temperatureCelsius: 4.2,
    humidityPercent: 85,
    status: 'NORMAL',
    targetMin: 3.5,
    targetMax: 5.5,
    recordedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const INITIAL_ORDERS: (Order & { clientName?: string; totalBoxes?: number; totalKg?: number })[] = [
  {
    orderId: 101,
    orderCode: 'ORD-2026-EXP-088',
    clientId: 'CLI-ROT-01',
    clientName: 'Green Import B.V. (Países Bajos 🇳🇱)',
    orderDate: new Date().toISOString().split('T')[0],
    incoterm: 'FOB Callao',
    destinationPort: 'Puerto de Róterdam (Holanda)',
    status: 'PROCESSING',
    totalBoxes: 1450,
    totalKg: 5800,
    statusDescription: 'En paletizado y etiquetado SENASA en mesa 1',
  },
  {
    orderId: 102,
    orderCode: 'ORD-2026-EXP-089',
    clientId: 'CLI-USA-02',
    clientName: 'Fresh Harvest LLC (Estados Unidos 🇺🇸)',
    orderDate: new Date().toISOString().split('T')[0],
    incoterm: 'CIF Filadelfia',
    destinationPort: 'Puerto de Filadelfia (USA)',
    status: 'PENDING',
    totalBoxes: 2100,
    totalKg: 8400,
    statusDescription: 'Esperando finalización de inspección de lote HASS-01',
  },
  {
    orderId: 103,
    orderCode: 'ORD-2026-EXP-090',
    clientId: 'CLI-CHN-03',
    clientName: 'Golden Dragon Fruit Co. (China 🇨🇳)',
    orderDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    incoterm: 'CFR Shanghái',
    destinationPort: 'Puerto de Shanghái (China)',
    status: 'COMPLETED',
    totalBoxes: 3200,
    totalKg: 12800,
    statusDescription: 'Pallets completos y precintados en contenedor reefer',
  },
];

interface WorkerOutletContext {
  lang?: 'es' | 'en';
  activeTab?: WorkerTab;
  onSelectTab?: (tab: WorkerTab) => void;
}

export default function WorkerDashboard() {
  const { user } = useAuth();
  const outletCtx = useOutletContext<WorkerOutletContext | undefined>();
  const [localActiveTab, setLocalActiveTab] = useState<WorkerTab>('overview');

  const activeTab = outletCtx?.activeTab || localActiveTab;
  const setActiveTab = (tab: WorkerTab) => {
    setLocalActiveTab(tab);
    if (outletCtx?.onSelectTab) {
      outletCtx.onSelectTab(tab);
    }
  };

  const [isLoading, setIsLoading] = useState(false);

  // Estados de datos
  const [inspections, setInspections] = useState<EnrichedInspection[]>(INITIAL_INSPECTIONS);
  const [batches, setBatches] = useState<EnrichedBatch[]>(INITIAL_BATCHES);
  const [coldLogs, setColdLogs] = useState<EnrichedColdLog[]>(INITIAL_COLD_LOGS);
  const [orders, setOrders] = useState<typeof INITIAL_ORDERS>(INITIAL_ORDERS);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [qualityFilter, setQualityFilter] = useState<'ALL' | 'PASSED' | 'CONDITIONALLY_ACCEPTED' | 'REJECTED'>('ALL');
  const [batchStageFilter, setBatchStageFilter] = useState<string>('ALL');

  // Modales
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showTempModal, setShowTempModal] = useState(false);
  const [selectedLabelOrder, setSelectedLabelOrder] = useState<typeof INITIAL_ORDERS[0] | null>(null);

  // Formularios
  const [newInspection, setNewInspection] = useState({
    batchId: 'LOT-2026-HASS-01',
    cropName: 'Palta Hass',
    brixDegree: 21.0,
    firmnessLb: 14.0,
    defectsPercentage: 1.0,
    result: 'PASSED' as 'PASSED' | 'CONDITIONALLY_ACCEPTED' | 'REJECTED',
    notes: '',
  });

  const [newBatch, setNewBatch] = useState({
    lotCode: `LOT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    cropName: 'Palta Hass',
    providerName: '',
    grossWeightKg: 5000,
    tareWeightKg: 300,
    boxCount: 1200,
    chamberAssigned: 'Cámara 02 - Frío Palta (5°C)',
  });

  const [newTempLog, setNewTempLog] = useState({
    chamberName: 'Cámara 02 - Conservación Palta',
    sensorId: 'SNS-MANUAL-01',
    temperatureCelsius: 4.8,
    humidityPercent: 88,
    notes: '',
  });

  // Cargar datos reales si están disponibles en backend
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [inspRes, batchRes, tempRes, orderRes] = await Promise.allSettled([
        getQualityInspections(20),
        getInventoryBatches(20),
        getTemperatureLogs(),
        getOrders(20),
      ]);

      if (inspRes.status === 'fulfilled' && inspRes.value.data?.length > 0) {
        const enriched = inspRes.value.data.map((item, idx) => ({
          ...INITIAL_INSPECTIONS[idx % INITIAL_INSPECTIONS.length],
          ...item,
          lotCode: item.batchId || `LOT-REC-${idx + 1}`,
        }));
        setInspections(enriched);
      }

      if (batchRes.status === 'fulfilled' && batchRes.value.data?.length > 0) {
        const enriched = batchRes.value.data.map((item, idx) => ({
          ...INITIAL_BATCHES[idx % INITIAL_BATCHES.length],
          ...item,
          lotCode: item.id || `LOT-INV-${idx + 1}`,
        }));
        setBatches(enriched);
      }

      if (tempRes.status === 'fulfilled' && tempRes.value.data?.length > 0) {
        const enriched = tempRes.value.data.map((item, idx) => ({
          ...INITIAL_COLD_LOGS[idx % INITIAL_COLD_LOGS.length],
          ...item,
        }));
        setColdLogs(enriched);
      }

      if (orderRes.status === 'fulfilled' && orderRes.value.data?.length > 0) {
        const enriched = orderRes.value.data.map((item, idx) => ({
          ...INITIAL_ORDERS[idx % INITIAL_ORDERS.length],
          ...item,
        }));
        setOrders(enriched);
      }
    } catch (err) {
      console.warn('Usando datos de respaldo de planta:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // KPIs Calculados del turno
  const stats = useMemo(() => {
    const totalKgReceived = batches.reduce((acc, b) => acc + (b.netWeightKg || b.quantity || 0), 0);
    const approvedInsp = inspections.filter((i) => i.result === 'PASSED').length;
    const approvalRate = inspections.length > 0 ? ((approvedInsp / inspections.length) * 100).toFixed(1) : '100';
    const activePackingOrders = orders.filter((o) => o.status === 'PROCESSING' || o.status === 'PENDING').length;
    const avgTemp = (
      coldLogs.reduce((acc, l) => acc + (l.temperatureCelsius || 4.5), 0) / (coldLogs.length || 1)
    ).toFixed(1);
    const tempAlerts = coldLogs.filter((l) => l.status === 'WARNING' || l.status === 'CRITICAL').length;

    return {
      totalKgReceived,
      approvalRate,
      approvedInsp,
      totalInsp: inspections.length,
      activePackingOrders,
      avgTemp,
      tempAlerts,
    };
  }, [batches, inspections, orders, coldLogs]);

  // Manejador: Registrar Inspección
  const handleCreateInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: EnrichedInspection = {
        id: `insp-${Date.now()}`,
        batchId: newInspection.batchId,
        lotCode: newInspection.batchId,
        cropName: newInspection.cropName,
        inspectorId: user?.name || 'Operario de Planta',
        inspectionDate: new Date().toISOString(),
        result: newInspection.result,
        brixDegree: Number(newInspection.brixDegree),
        firmnessLb: Number(newInspection.firmnessLb),
        defectsPercentage: Number(newInspection.defectsPercentage),
        notes: newInspection.notes || 'Inspección técnica registrada en turno.',
      };

      setInspections([payload, ...inspections]);
      setShowInspectionModal(false);
      toast.success('Inspección de Calidad Registrada', {
        description: `Lote ${payload.lotCode}: Dictamen ${payload.result === 'PASSED' ? 'Aprobado ✅' : 'Observado ⚠️'} (${payload.brixDegree}° Brix).`,
      });

      // Llamada opcional al backend
      createQualityInspection(payload).catch((e) => console.log('API sync skipped:', e));
    } catch {
      toast.error('Error al registrar inspección');
    }
  };

  // Manejador: Registrar Lote
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const netWeight = Number(newBatch.grossWeightKg) - Number(newBatch.tareWeightKg);

    const payload: EnrichedBatch = {
      id: `batch-${Date.now()}`,
      lotCode: newBatch.lotCode,
      cropName: newBatch.cropName,
      variety: `${newBatch.cropName} Selección`,
      providerName: newBatch.providerName || 'Fundo de Producción Local',
      grossWeightKg: Number(newBatch.grossWeightKg),
      tareWeightKg: Number(newBatch.tareWeightKg),
      netWeightKg: netWeight,
      quantity: netWeight,
      boxCount: Number(newBatch.boxCount),
      chamberAssigned: newBatch.chamberAssigned,
      stage: 'RECEPCION',
      status: 'EN_RECEPCION',
      harvestDate: new Date().toISOString().split('T')[0],
    };

    setBatches([payload, ...batches]);
    setShowBatchModal(false);
    toast.success('Lote de Fruta Registrado con Éxito', {
      description: `${payload.lotCode}: ${netWeight.toLocaleString()} Kg netos asignados a ${payload.chamberAssigned}.`,
    });

    createInventoryBatch(payload).catch((e) => console.log('API sync skipped:', e));
  };

  // Manejador: Registrar Temperatura
  const handleCreateTempLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const temp = Number(newTempLog.temperatureCelsius);
    let status: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';
    if (temp > 6.0) status = 'WARNING';
    if (temp > 8.0 || temp < 1.0) status = 'CRITICAL';

    const payload: EnrichedColdLog = {
      id: `temp-${Date.now()}`,
      chamberName: newTempLog.chamberName,
      sensorId: newTempLog.sensorId,
      temperatureCelsius: temp,
      humidityPercent: Number(newTempLog.humidityPercent),
      status,
      targetMin: 3.5,
      targetMax: 5.5,
      recordedAt: new Date().toISOString(),
    };

    setColdLogs([payload, ...coldLogs]);
    setShowTempModal(false);
    toast.success('Lectura de Frío Registrada', {
      description: `${payload.chamberName}: ${temp}°C (${status === 'NORMAL' ? 'Óptimo ❄️' : 'Alerta ⚠️'}).`,
    });

    createTemperatureLog(payload).catch((e) => console.log('API sync skipped:', e));
  };

  // Manejador: Avanzar estado de pedido en Packing List
  const handleUpdateOrderStatus = async (orderId: number, nextStatus: 'PROCESSING' | 'COMPLETED') => {
    const statusText = nextStatus === 'PROCESSING' ? 'En Paletizado 📦' : 'Listo para Despacho 🚢';
    const statusDesc =
      nextStatus === 'PROCESSING'
        ? 'Personal de cuadrilla armando pallets y zunchado'
        : 'Pallets completos en cámara de despacho con precinto';

    setOrders((prev) =>
      prev.map((o) => (o.orderId === orderId ? { ...o, status: nextStatus, statusDescription: statusDesc } : o))
    );

    toast.success(`Pedido Actualizado: ${statusText}`, {
      description: `Orden #${orderId} actualizada en la línea de empaque.`,
    });

    updateOrder(orderId, { status: nextStatus, statusDescription: statusDesc }).catch((e) =>
      console.log('Sync skipped:', e)
    );
  };

  // Filtros aplicados
  const filteredInspections = useMemo(() => {
    return inspections.filter((i) => {
      const matchSearch =
        (i.lotCode?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (i.cropName?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const matchResult = qualityFilter === 'ALL' || i.result === qualityFilter;
      return matchSearch && matchResult;
    });
  }, [inspections, searchQuery, qualityFilter]);

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const matchSearch =
        (b.lotCode?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (b.providerName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (b.cropName?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const matchStage = batchStageFilter === 'ALL' || b.stage === batchStageFilter;
      return matchSearch && matchStage;
    });
  }, [batches, searchQuery, batchStageFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER OPERATIVO & ACCIONES RÁPIDAS
         ───────────────────────────────────────────────────────────── */}
      <section className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-sm relative overflow-hidden transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
                <Briefcase size={13} className="shrink-0" />
                Planta de Packing & Control de Calidad
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Turno Mañana (07:00 - 15:30)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Hola, {user?.name || 'Carlos Ramírez'} 👷‍♂️
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Centro de Operaciones de Fruta Fresca: pesaje, muestreo °Brix, trazabilidad térmica y paletizado.
            </p>
          </div>

          {/* Botones de Acción Rápida (Touch Friendly) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowInspectionModal(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <ShieldCheck size={16} />
              + Nueva Inspección QA
            </button>
            <button
              onClick={() => setShowBatchModal(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Boxes size={16} />
              + Registrar Lote
            </button>
            <button
              onClick={() => setShowTempModal(true)}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Thermometer size={16} />
              + Lectura de Frío
            </button>
            <button
              onClick={fetchData}
              title="Refrescar datos"
              className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. NAVEGACIÓN MODULAR DE PANELES (5 PESTAÑAS)
         ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--border-subtle)] scrollbar-none">
        {[
          { id: 'overview', label: 'Resumen de Turno', icon: LayoutDashboard, count: undefined },
          { id: 'quality', label: 'Control de Calidad (QA)', icon: ShieldCheck, count: inspections.length },
          { id: 'batches', label: 'Recepción & Lotes', icon: Boxes, count: batches.length },
          { id: 'cold-chain', label: 'Cadena de Frío', icon: Snowflake, count: stats.tempAlerts ? `${stats.tempAlerts} ⚠️` : undefined },
          { id: 'packing-list', label: 'Pedidos & Packing List', icon: Truck, count: stats.activePackingOrders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as WorkerTab);
                setSearchQuery('');
              }}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer
                ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-[var(--surface-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)]'
                }
              `}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[var(--surface-hover)] text-[var(--text-primary)]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PANEL 1: RESUMEN DE TURNO (OVERVIEW)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Métricas Principales de Planta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Fruta Recibida Hoy</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Scale size={18} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-[var(--text-primary)]">
                  {(stats.totalKgReceived / 1000).toFixed(1)} <span className="text-sm font-semibold">TN</span>
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {stats.totalKgReceived.toLocaleString()} Kg netos en {batches.length} lotes
                </p>
              </div>
              <div className="w-full bg-[var(--surface-hover)] h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '75%' }} />
              </div>
            </div>

            <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Aprobación Calidad</span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-[var(--text-primary)]">{stats.approvalRate}%</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {stats.approvedInsp} de {stats.totalInsp} inspecciones aprobadas
                </p>
              </div>
              <div className="w-full bg-[var(--surface-hover)] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, Number(stats.approvalRate))}%` }}
                />
              </div>
            </div>

            <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Pedidos en Preparación</span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <PackageCheck size={18} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-[var(--text-primary)]">{stats.activePackingOrders}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Órdenes activas en línea de paletizado</p>
              </div>
              <div className="w-full bg-[var(--surface-hover)] h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: '60%' }} />
              </div>
            </div>

            <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Semáforo de Frío</span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    stats.tempAlerts > 0
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                  }`}
                >
                  <Thermometer size={18} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-[var(--text-primary)]">{stats.avgTemp} °C</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {stats.tempAlerts > 0 ? `${stats.tempAlerts} cámara(s) en advertencia` : '4 de 4 cámaras en rango óptimo'}
                </p>
              </div>
              <div className="w-full bg-[var(--surface-hover)] h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${stats.tempAlerts > 0 ? 'bg-amber-500' : 'bg-cyan-500'}`}
                  style={{ width: '90%' }}
                />
              </div>
            </div>
          </div>

          {/* Sección de 2 Columnas: Lotes en Planta y Cámaras en Tiempo Real */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lotes Prioritarios en Línea de Empaque */}
            <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Boxes size={18} className="text-blue-500" />
                  Lotes en Planta & Selección
                </h3>
                <button
                  onClick={() => setActiveTab('batches')}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Ver todos <ChevronRight size={14} />
                </button>
              </div>

              <div className="space-y-3">
                {batches.slice(0, 3).map((batch) => (
                  <div
                    key={batch.id}
                    className="p-3.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-hover)] flex items-center justify-between gap-3 hover:border-blue-500/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[var(--text-primary)]">{batch.lotCode}</span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                          {batch.cropName}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {batch.providerName} • {batch.netWeightKg?.toLocaleString()} Kg ({batch.boxCount} cajas)
                      </p>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                      {batch.chamberAssigned?.split(' - ')[0] || 'Cámara'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cámaras de Frío en Tiempo Real */}
            <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Snowflake size={18} className="text-cyan-500" />
                  Estado de Cámaras Frigoríficas
                </h3>
                <button
                  onClick={() => setActiveTab('cold-chain')}
                  className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Telemetría completa <ChevronRight size={14} />
                </button>
              </div>

              <div className="space-y-3">
                {coldLogs.slice(0, 3).map((log) => {
                  const isNormal = log.status === 'NORMAL';
                  return (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-hover)] flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-bold text-sm text-[var(--text-primary)]">{log.chamberName}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          Sensor: {log.sensorId} • Humedad: {log.humidityPercent}%
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-base font-black ${
                            isNormal ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {log.temperatureCelsius} °C
                        </span>
                        <p className="text-[10px] text-[var(--text-secondary)] font-medium">
                          {isNormal ? 'Rango Óptimo ✅' : 'Advertencia ⚠️'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PANEL 2: CONTROL DE CALIDAD (QA / QC)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'quality' && (
        <div className="space-y-5">
          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Buscar por código de lote o producto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'ALL', label: 'Todos' },
                { id: 'PASSED', label: 'Aprobados' },
                { id: 'CONDITIONALLY_ACCEPTED', label: 'Observados' },
                { id: 'REJECTED', label: 'Rechazados' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setQualityFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    qualityFilter === f.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tarjetas / Tabla de Inspecciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInspections.map((insp) => {
              const isPassed = insp.result === 'PASSED';
              const isCond = insp.result === 'CONDITIONALLY_ACCEPTED';
              return (
                <div
                  key={insp.id}
                  className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl p-5 space-y-4 hover:border-blue-500/40 transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-[var(--text-primary)]">{insp.lotCode}</span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                          {insp.cropName}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        Inspector: <strong className="text-[var(--text-primary)]">{insp.inspectorId}</strong> •{' '}
                        {new Date(insp.inspectionDate || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        isPassed
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : isCond
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {isPassed ? 'APROBADO ✅' : isCond ? 'OBSERVADO ⚠️' : 'RECHAZADO ❌'}
                    </span>
                  </div>

                  {/* Métricas Técnicas (°Brix, Firmeza, Defectos) */}
                  <div className="grid grid-cols-3 gap-2 bg-[var(--surface-hover)] p-3 rounded-xl text-center">
                    <div>
                      <span className="text-[10px] text-[var(--text-secondary)] font-semibold block">Azúcar (°Brix)</span>
                      <span className="text-sm font-black text-amber-600 dark:text-amber-400">{insp.brixDegree}°</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-secondary)] font-semibold block">Firmeza</span>
                      <span className="text-sm font-black text-blue-600 dark:text-blue-400">{insp.firmnessLb} lb/in²</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-secondary)] font-semibold block">Defectos</span>
                      <span
                        className={`text-sm font-black ${
                          (insp.defectsPercentage || 0) > 3 ? 'text-rose-500' : 'text-emerald-500'
                        }`}
                      >
                        {insp.defectsPercentage}%
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] italic bg-[var(--surface-card)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
                    "{insp.notes}"
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PANEL 3: RECEPCIÓN & LOTES DE PLANTA
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'batches' && (
        <div className="space-y-5">
          <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Buscar por lote, proveedor o cultivo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'ALL', label: 'Todas las Fases' },
                { id: 'RECEPCION', label: 'En Recepción' },
                { id: 'SELECCION', label: 'En Selección' },
                { id: 'EMPAQUE', label: 'En Empaque' },
                { id: 'CAMARA_FRIO', label: 'En Cámara' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setBatchStageFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    batchStageFilter === f.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla de Lotes */}
          <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface-hover)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="p-4">Código Lote</th>
                    <th className="p-4">Cultivo & Variedad</th>
                    <th className="p-4">Fundo / Proveedor</th>
                    <th className="p-4 text-right">Peso Neto</th>
                    <th className="p-4 text-center">Cajas</th>
                    <th className="p-4">Cámara Asignada</th>
                    <th className="p-4 text-center">Fase de Planta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredBatches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="p-4 font-extrabold text-[var(--text-primary)]">{batch.lotCode}</td>
                      <td className="p-4">
                        <span className="font-semibold text-[var(--text-primary)]">{batch.cropName}</span>
                        <span className="text-[11px] text-[var(--text-secondary)] block">{batch.variety}</span>
                      </td>
                      <td className="p-4 text-[var(--text-secondary)] font-medium">{batch.providerName}</td>
                      <td className="p-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                        {batch.netWeightKg?.toLocaleString()} Kg
                      </td>
                      <td className="p-4 text-center font-bold text-[var(--text-primary)]">{batch.boxCount}</td>
                      <td className="p-4 text-[var(--text-secondary)] font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <Snowflake size={13} className="text-cyan-500" />
                          {batch.chamberAssigned}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {batch.stage}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PANEL 4: CADENA DE FRÍO & MONITOREO TÉRMICO
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'cold-chain' && (
        <div className="space-y-6">
          {/* Banner de Estado SENASA */}
          <div className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-transparent border border-cyan-500/30 rounded-3xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                <Snowflake size={24} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  Protocolo Fitosanitario de Cadena de Frío SENASA & USDA
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Rango óptimo para palta: 4.0°C a 6.0°C | Arándano: 1.5°C a 3.0°C. Alerta activa ante desvíos mayores a 1.0°C.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowTempModal(true)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs whitespace-nowrap cursor-pointer shadow-sm shadow-cyan-500/20 transition-all"
            >
              + Lectura Manual
            </button>
          </div>

          {/* Tarjetas de Cámaras Frigoríficas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coldLogs.map((log) => {
              const isNormal = log.status === 'NORMAL';
              const temp = log.temperatureCelsius || 4.5;
              return (
                <div
                  key={log.id}
                  className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 space-y-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-base text-[var(--text-primary)]">{log.chamberName}</h4>
                      <p className="text-xs text-[var(--text-secondary)]">Sensor ID: {log.sensorId}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        isNormal
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {isNormal ? 'ESTABLE ❄️' : 'ALERTA ⚠️'}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-2">
                    <div>
                      <span className="text-4xl font-black text-[var(--text-primary)] tracking-tight">{temp}</span>
                      <span className="text-xl font-bold text-cyan-600 dark:text-cyan-400 ml-1">°C</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[var(--text-secondary)] block">Humedad Relativa</span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{log.humidityPercent}%</span>
                    </div>
                  </div>

                  {/* Barra Visual de Rango */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-[11px] text-[var(--text-secondary)] font-medium">
                      <span>Mín: {log.targetMin}°C</span>
                      <span className="font-bold text-[var(--text-primary)]">Actual: {temp}°C</span>
                      <span>Máx: {log.targetMax}°C</span>
                    </div>
                    <div className="w-full bg-[var(--surface-hover)] h-2 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all ${isNormal ? 'bg-cyan-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(100, Math.max(10, ((temp - 1) / 7) * 100))}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-[var(--text-secondary)] text-right pt-1">
                    Última transmisión:{' '}
                    {new Date(log.recordedAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PANEL 5: PEDIDOS & PACKING LIST (SIN DATOS FINANCIEROS)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'packing-list' && (
        <div className="space-y-5">
          {/* Mensaje de Política RBAC */}
          <div className="bg-[var(--surface-card)] border border-l-4 border-l-purple-500 border-[var(--border-subtle)] rounded-2xl p-4 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <Truck size={15} className="text-purple-500" />
                Hoja Operativa de Despacho & Paletizado
              </h4>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Muestra exclusivamente información de embalaje, cantidades físicas y puerto destino. Los datos financieros y
                precios se encuentran protegidos.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-purple-500/10 text-purple-700 dark:text-purple-400 rounded-md border border-purple-500/20 whitespace-nowrap">
              Acceso Seguro RBAC
            </span>
          </div>

          {/* Listado de Pedidos para Paletizar */}
          <div className="space-y-4">
            {orders.map((order) => {
              const isPending = order.status === 'PENDING';
              const isProcessing = order.status === 'PROCESSING';
              const isCompleted = order.status === 'COMPLETED';

              return (
                <div
                  key={order.orderId}
                  className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 space-y-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-lg text-[var(--text-primary)]">{order.orderCode}</span>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full border ${
                            isCompleted
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : isProcessing
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {isCompleted
                            ? 'LISTO PARA DESPACHO ✅'
                            : isProcessing
                            ? 'EN PALETIZADO 📦'
                            : 'EN ESPERA ⏳'}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        Destino: <strong className="text-[var(--text-primary)]">{order.clientName}</strong> • Puerto:{' '}
                        {order.destinationPort}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedLabelOrder(order)}
                        className="px-3.5 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-hover)] hover:bg-[var(--surface-card)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Printer size={15} />
                        Rótulo Pallet
                      </button>

                      {isPending && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.orderId, 'PROCESSING')}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
                        >
                          ▶️ Iniciar Paletizado
                        </button>
                      )}

                      {isProcessing && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.orderId, 'COMPLETED')}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 transition-all cursor-pointer"
                        >
                          <Check size={16} />
                          Confirmar Listo
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Resumen de Cajas y Kilogramos */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[var(--surface-hover)] p-3.5 rounded-2xl text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--text-secondary)] font-semibold block">Total Cajas</span>
                      <span className="font-extrabold text-sm text-[var(--text-primary)]">{order.totalBoxes} Cajas</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-secondary)] font-semibold block">Peso Total Neto</span>
                      <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                        {order.totalKg?.toLocaleString()} Kg
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-secondary)] font-semibold block">Incoterm</span>
                      <span className="font-extrabold text-sm text-purple-600 dark:text-purple-400">{order.incoterm}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-secondary)] font-semibold block">Estado de Cuadrilla</span>
                      <span className="font-semibold text-xs text-[var(--text-secondary)]">
                        {order.statusDescription || 'En proceso regular'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: REGISTRAR INSPECCIÓN DE CALIDAD
         ───────────────────────────────────────────────────────────── */}
      {showInspectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <h3 className="font-extrabold text-lg text-[var(--text-primary)] flex items-center gap-2">
                <ShieldCheck size={20} className="text-blue-500" />
                Nueva Inspección de Calidad (QC)
              </h3>
              <button
                onClick={() => setShowInspectionModal(false)}
                className="p-1.5 rounded-xl hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInspection} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-1.5">Lote a Inspeccionar</label>
                <select
                  value={newInspection.batchId}
                  onChange={(e) => setNewInspection({ ...newInspection, batchId: e.target.value })}
                  className="w-full p-2.5 bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.lotCode}>
                      {b.lotCode} — {b.cropName} ({b.providerName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1.5">°Brix (Azúcar)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newInspection.brixDegree}
                    onChange={(e) => setNewInspection({ ...newInspection, brixDegree: parseFloat(e.target.value) })}
                    className="w-full p-2.5 bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1.5">Firmeza (lb/in²)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newInspection.firmnessLb}
                    onChange={(e) => setNewInspection({ ...newInspection, firmnessLb: parseFloat(e.target.value) })}
                    className="w-full p-2.5 bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1.5">% Defectos</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newInspection.defectsPercentage}
                    onChange={(e) => setNewInspection({ ...newInspection, defectsPercentage: parseFloat(e.target.value) })}
                    className="w-full p-2.5 bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-1.5">Dictamen Oficial</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'PASSED', label: 'Aprobado ✅' },
                    { id: 'CONDITIONALLY_ACCEPTED', label: 'Observado ⚠️' },
                    { id: 'REJECTED', label: 'Rechazado ❌' },
                  ].map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => setNewInspection({ ...newInspection, result: res.id as any })}
                      className={`p-2 rounded-xl font-bold text-center border transition-all cursor-pointer ${
                        newInspection.result === res.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                      }`}
                    >
                      {res.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-1.5">Observaciones Técnicas</label>
                <textarea
                  rows={2}
                  placeholder="Detalles de calibre, empaque o fitosanitarios..."
                  value={newInspection.notes}
                  onChange={(e) => setNewInspection({ ...newInspection, notes: e.target.value })}
                  className="w-full p-2.5 bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowInspectionModal(false)}
                  className="px-4 py-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-md shadow-blue-500/20"
                >
                  Guardar Inspección
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: REGISTRAR LOTE DE FRUTA FRESCA
         ───────────────────────────────────────────────────────────── */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <h3 className="font-extrabold text-lg text-[var(--text-primary)] flex items-center gap-2">
                <Boxes size={20} className="text-emerald-500" />
                Registrar Lote de Fruta de Campo
              </h3>
              <button
                onClick={() => setShowBatchModal(false)}
                className="p-1.5 rounded-xl hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1.5">Código de Lote</label>
                  <input
                    type="text"
                    required
                    value={newBatch.lotCode}
                    onChange={(e) => setNewBatch({ ...newBatch, lotCode: e.target.value })}
                    className="w-full p-2.5 bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1.5">Cultivo</label>
                  <select
                    value={newBatch.cropName}
                    onChange={(e) => setNewBatch({ ...newBatch, cropName: e.target.value })}
                    className="w-full p-2.5 bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)]"
                  >
                    <option value="Palta Hass">Palta Hass</option>
                    <option value="Arándano Biloxi">Arándano Biloxi</option>
                    <option value="Mango Kent">Mango Kent</option>
                    <option value="Uva Red Globe">Uva Red Globe</option>
                    <option value="Espárrago Verde">Espárrago Verde</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-1.5">Fundo / Proveedor de Origen</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Fundo Santa Rosa, Parcela 4..."
                  value={newBatch.providerName}
                  onChange={(e) => setNewBatch({ ...newBatch, providerName: e.target.value })}
                  className="w-full p-2.5 bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 bg-[var(--surface-hover)] p-3 rounded-2xl">
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">Peso Bruto (Kg)</label>
                  <input
                    type="number"
                    required
                    value={newBatch.grossWeightKg}
                    onChange={(e) => setNewBatch({ ...newBatch, grossWeightKg: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] font-bold text-center"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">Tara Cajas (Kg)</label>
                  <input
                    type="number"
                    required
                    value={newBatch.tareWeightKg}
                    onChange={(e) => setNewBatch({ ...newBatch, tareWeightKg: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] font-bold text-center"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">Peso Neto</label>
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-600 dark:text-emerald-400 font-black text-center text-sm">
                    {(newBatch.grossWeightKg - newBatch.tareWeightKg).toLocaleString()} Kg
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1.5">Cantidad de Cajas / Jabas</label>
                  <input
                    type="number"
                    required
                    value={newBatch.boxCount}
                    onChange={(e) => setNewBatch({ ...newBatch, boxCount: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1.5">Cámara de Destino</label>
                  <select
                    value={newBatch.chamberAssigned}
                    onChange={(e) => setNewBatch({ ...newBatch, chamberAssigned: e.target.value })}
                    className="w-full p-2.5 bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] font-semibold"
                  >
                    <option value="Cámara 01 - Pre-frío">Cámara 01 - Pre-frío</option>
                    <option value="Cámara 02 - Frío Palta (5°C)">Cámara 02 - Frío Palta (5°C)</option>
                    <option value="Cámara 03 - Frío Arándanos (2°C)">Cámara 03 - Frío Arándanos (2°C)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  Guardar Lote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: REGISTRAR LECTURA DE TEMPERATURA
         ───────────────────────────────────────────────────────────── */}
      {showTempModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <h3 className="font-extrabold text-lg text-[var(--text-primary)] flex items-center gap-2">
                <Thermometer size={20} className="text-cyan-500" />
                Lectura Térmica Manual
              </h3>
              <button
                onClick={() => setShowTempModal(false)}
                className="p-1.5 rounded-xl hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTempLog} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-1.5">Cámara o Contenedor</label>
                <select
                  value={newTempLog.chamberName}
                  onChange={(e) => setNewTempLog({ ...newTempLog, chamberName: e.target.value })}
                  className="w-full p-2.5 bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)]"
                >
                  <option value="Cámara 01 - Pre-frío General">Cámara 01 - Pre-frío General</option>
                  <option value="Cámara 02 - Conservación Palta">Cámara 02 - Conservación Palta</option>
                  <option value="Cámara 03 - Túnel Arándano">Cámara 03 - Túnel Arándano</option>
                  <option value="Contenedor Reefer 40ft (HMMU-9281)">Contenedor Reefer 40ft</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1.5">Temperatura (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newTempLog.temperatureCelsius}
                    onChange={(e) => setNewTempLog({ ...newTempLog, temperatureCelsius: parseFloat(e.target.value) })}
                    className="w-full p-2.5 bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] font-black text-center text-base"
                  />
                </div>
                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1.5">Humedad (%)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={newTempLog.humidityPercent}
                    onChange={(e) => setNewTempLog({ ...newTempLog, humidityPercent: parseInt(e.target.value) || 80 })}
                    className="w-full p-2.5 bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] font-bold text-center text-base"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-1.5">ID de Sensor / Termómetro</label>
                <input
                  type="text"
                  value={newTempLog.sensorId}
                  onChange={(e) => setNewTempLog({ ...newTempLog, sensorId: e.target.value })}
                  className="w-full p-2.5 bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowTempModal(false)}
                  className="px-4 py-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold cursor-pointer shadow-md shadow-cyan-500/20"
                >
                  Guardar Lectura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 4: RÓTULO DE PALLET & HOJA DE EMPAQUE (IMPRIMIBLE)
         ───────────────────────────────────────────────────────────── */}
      {selectedLabelOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <h3 className="font-extrabold text-lg text-[var(--text-primary)] flex items-center gap-2">
                <Printer size={20} className="text-purple-500" />
                Rótulo Oficial de Pallet — SENASA Export
              </h3>
              <button
                onClick={() => setSelectedLabelOrder(null)}
                className="p-1.5 rounded-xl hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Hoja de Rótulo con Código de Barras Simulado */}
            <div className="border-2 border-dashed border-[var(--border-subtle)] p-5 rounded-2xl bg-white text-slate-900 space-y-4 font-mono text-xs">
              <div className="text-center border-b pb-3">
                <h2 className="text-base font-black tracking-widest uppercase">VISONS S.A.C.</h2>
                <p className="text-[10px] text-slate-500">PACKING & EXPORTACIÓN AGROINDUSTRIAL — RUC 20601234567</p>
                <span className="inline-block mt-1 px-3 py-0.5 bg-slate-900 text-white font-bold text-[10px] rounded">
                  ETIQUETA DE PALLETIZADO
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div>
                  <span className="text-[9px] text-slate-500 block">ORDEN DE EXPORTACIÓN</span>
                  <span className="font-bold text-sm">{selectedLabelOrder.orderCode}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block">DESTINO FINAL</span>
                  <span className="font-bold text-sm">{selectedLabelOrder.destinationPort}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block">CANTIDAD PALLET</span>
                  <span className="font-bold text-sm">{selectedLabelOrder.totalBoxes} Cajas</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block">PESO NETO</span>
                  <span className="font-bold text-sm">{selectedLabelOrder.totalKg} Kg</span>
                </div>
              </div>

              {/* Código de barras visual */}
              <div className="text-center pt-2 border-t">
                <div className="inline-block bg-slate-900 text-white font-mono px-4 py-2 tracking-[0.3em] font-black text-sm">
                  ||| | |||| | ||| || ||||
                </div>
                <p className="text-[9px] text-slate-500 mt-1">*{selectedLabelOrder.orderCode}-PALLET-01*</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setSelectedLabelOrder(null)}
                className="px-4 py-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] font-semibold cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  toast.success('Rótulo enviado a la impresora de planta');
                }}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer shadow-md shadow-purple-500/20 flex items-center gap-1.5"
              >
                <Printer size={15} />
                Imprimir Etiqueta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
