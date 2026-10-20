// =============================================================================
// PANEL 3: LOTES & CALIDAD — VISONS S.A.C. ADMIN DASHBOARD
// Gestión de Lotes de Cosecha, Certificación Fitosanitaria SENASA,
// Inventario de Planta en Cámara Frigorífica y Telemetría de Temperatura
// =============================================================================

import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Layers,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  ShieldCheck,
  Package,
  Thermometer,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  RotateCcw,
  Archive,
} from 'lucide-react';
import { toast } from 'sonner';

import type { Batch, InventoryBatch, TemperatureLog, QualityStatus } from '../../types/batch';
import type { Product } from '../../types/product';
import type { Provider } from '../../types/provider';
import {
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  getInventoryBatches,
  createInventoryBatch,
  updateInventoryBatch,
  deleteInventoryBatch,
  getTemperatureLogs,
} from '../../api/batchApi';
import { getProducts } from '../../api/productApi';
import { getProviders } from '../../api/providerApi';

import { BatchModal } from '../../components/batches/BatchModal';
import { InventoryModal } from '../../components/batches/InventoryModal';
import { DeleteConfirmModal } from '../../components/products/DeleteConfirmModal';
import { StatusFilterTabs, type FilterTrashStatus } from '../../components/shared/StatusFilterTabs';
import { notifyOperationUpdate } from '../../services/notificationService';

type OutletCtx = { lang: 'es' | 'en' };

export default function LotesPage() {
  const { lang } = useOutletContext<OutletCtx>();

  // Active Tab: 'lotes' | 'inventario' | 'telemetria'
  const [activeTab, setActiveTab] = useState<'lotes' | 'inventario' | 'telemetria'>('lotes');

  // Data States
  const [batches, setBatches] = useState<Batch[]>([]);
  const [inventory, setInventory] = useState<InventoryBatch[]>([]);
  const [tempLogs, setTempLogs] = useState<TemperatureLog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTrash, setFilterTrash] = useState<FilterTrashStatus>('active');
  const [statusFilter, setStatusFilter] = useState<'ALL' | QualityStatus>('ALL');
  const [productFilter, setProductFilter] = useState<string>('ALL');

  // Modals
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState<InventoryBatch | null>(null);

  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    type: 'batch' | 'inventory';
    id: string | number;
    name: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    type: 'batch',
    id: '',
    name: '',
    isLoading: false,
  });

  // Fetch all related entities
  const fetchData = async (showToast = false) => {
    setIsRefreshing(true);
    try {
      const [batchRes, invRes, tempRes, prodRes, provRes] = await Promise.allSettled([
        getBatches(),
        getInventoryBatches(),
        getTemperatureLogs(),
        getProducts(),
        getProviders(),
      ]);

      if (batchRes.status === 'fulfilled') setBatches(batchRes.value.data || []);
      if (invRes.status === 'fulfilled') setInventory(invRes.value.data || []);
      if (tempRes.status === 'fulfilled') setTempLogs(tempRes.value.data || []);
      if (prodRes.status === 'fulfilled') setProducts(prodRes.value.data || []);
      if (provRes.status === 'fulfilled') setProviders(provRes.value.data || []);

      if (showToast) {
        toast.success(
          lang === 'es' ? 'Datos de lotes e inventario sincronizados' : 'Batch and inventory data synced'
        );
      }
    } catch (err) {
      console.error('Error fetching batch data:', err);
      toast.error(
        lang === 'es' ? 'Error al conectar con servicios de lotes' : 'Failed to connect to batch services'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute KPI metrics
  const metrics = useMemo(() => {
    const totalBatches = batches.length;
    const passedBatches = batches.filter(
      (b) => b.inspections?.[0]?.qualityStatus === 'PASSED'
    ).length;
    const totalStock = inventory.reduce((acc, item) => acc + (item.quantity || 0), 0);
    const activeSensors = tempLogs.length;

    return {
      totalBatches,
      passedBatches,
      totalStock,
      activeSensors,
    };
  }, [batches, inventory, tempLogs]);

  // Lookup helpers
  const getProductName = (codeOrId: string) => {
    const found = products.find((p) => p.code === codeOrId || p.id === codeOrId);
    return found ? found.name : codeOrId;
  };

  const getProviderName = (docOrId: string) => {
    const found = providers.find((p) => p.documentNumber === docOrId || p.id === docOrId);
    return found ? (found.companyName || found.documentNumber) : docOrId;
  };

  // Trash Counts
  const batchTrashCounts = useMemo(() => {
    const active = batches.filter((b) => b.isActive !== false && b.isDeleted !== true).length;
    const trash = batches.filter((b) => b.isActive === false || b.isDeleted === true).length;
    return { active, trash, all: batches.length };
  }, [batches]);

  const inventoryTrashCounts = useMemo(() => {
    const active = inventory.filter((i) => i.isActive !== false && i.isDeleted !== true).length;
    const trash = inventory.filter((i) => i.isActive === false || i.isDeleted === true).length;
    return { active, trash, all: inventory.length };
  }, [inventory]);

  // Filtered Batches
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const matchesSearch =
        !searchTerm.trim() ||
        String(b.batchId).includes(searchTerm) ||
        b.fieldName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getProductName(b.productId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getProviderName(b.providerId).toLowerCase().includes(searchTerm.toLowerCase());

      const isItemDeleted = b.isActive === false || b.isDeleted === true;
      const matchesTrash =
        filterTrash === 'all' ||
        (filterTrash === 'active' && !isItemDeleted) ||
        (filterTrash === 'trash' && isItemDeleted);

      const status = b.inspections?.[0]?.qualityStatus || 'PENDING';
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter;
      const matchesProduct = productFilter === 'ALL' || b.productId === productFilter;

      return matchesSearch && matchesTrash && matchesStatus && matchesProduct;
    });
  }, [batches, searchTerm, filterTrash, statusFilter, productFilter, products, providers]);

  // Filtered Inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const isItemDeleted = item.isActive === false || item.isDeleted === true;
      const matchesTrash =
        filterTrash === 'all' ||
        (filterTrash === 'active' && !isItemDeleted) ||
        (filterTrash === 'trash' && isItemDeleted);

      if (!searchTerm.trim()) return matchesTrash;
      const matchesSearch =
        (item.fieldName && item.fieldName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.productId && item.productId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.id && item.id.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch && matchesTrash;
    });
  }, [inventory, searchTerm, filterTrash]);

  // --- CRUD: BATCH ---
  const handleSaveBatch = async (batchData: Partial<Batch>) => {
    if (editingBatch?.batchId) {
      const res = await updateBatch(editingBatch.batchId, batchData);
      setBatches((prev) =>
        prev.map((b) => (b.batchId === editingBatch.batchId ? res.data : b))
      );
      toast.success(
        lang === 'es' ? 'Lote actualizado exitosamente' : 'Batch updated successfully'
      );
      notifyOperationUpdate({
        module: 'LOTES',
        actionType: 'ACTUALIZACIÓN',
        entityName: `Lote #${editingBatch.batchId}`,
        details: `Lote #${editingBatch.batchId} actualizado. Fundo: ${batchData.fieldName || editingBatch.fieldName}, Estado: ${batchData.status || editingBatch.status || 'Activo'}.`,
        link: '/lotes',
      });
    } else {
      const res = await createBatch(batchData as Omit<Batch, 'batchId'>);
      setBatches((prev) => [res.data, ...prev]);
      toast.success(
        lang === 'es' ? 'Lote registrado en SQL Server & MongoDB' : 'Batch registered in SQL Server & MongoDB'
      );
      notifyOperationUpdate({
        module: 'LOTES',
        actionType: 'CREACIÓN',
        entityName: `Lote #${res.data.batchId}`,
        details: `Nuevo lote de cosecha #${res.data.batchId} registrado (Fundo: ${res.data.fieldName || 'Campo Visons'}).`,
        link: '/lotes',
      });
    }
  };

  // RESTAURAR LOTE
  const handleRestoreBatch = async (batch: Batch) => {
    if (!batch.batchId) return;
    try {
      await updateBatch(batch.batchId, { ...batch, isActive: true, isDeleted: false });
      setBatches((prev) =>
        prev.map((b) => (b.batchId === batch.batchId ? { ...b, isActive: true, isDeleted: false } : b))
      );
      toast.success(
        lang === 'es'
          ? `Lote #${batch.batchId} restaurado con éxito a la planta`
          : `Batch #${batch.batchId} restored successfully`
      );
      notifyOperationUpdate({
        module: 'LOTES',
        actionType: 'RESTAURACIÓN',
        entityName: `Lote #${batch.batchId}`,
        details: `Lote #${batch.batchId} restaurado desde la papelera a operaciones activas en planta.`,
        link: '/lotes',
      });
    } catch (err) {
      console.error('Error restoring batch:', err);
      toast.error(lang === 'es' ? 'Error al restaurar lote' : 'Failed to restore batch');
    }
  };

  const handleDeleteBatchConfirm = async () => {
    setDeleteModalState((p) => ({ ...p, isLoading: true }));
    try {
      if (filterTrash === 'trash') {
        await deleteBatch(Number(deleteModalState.id));
        setBatches((prev) => prev.filter((b) => b.batchId !== Number(deleteModalState.id)));
        toast.success(
          lang === 'es'
            ? `Lote #${deleteModalState.id} eliminado definitivamente`
            : `Batch #${deleteModalState.id} permanently deleted`
        );
        notifyOperationUpdate({
          module: 'LOTES',
          actionType: 'PAPELERA',
          entityName: `Lote #${deleteModalState.id}`,
          details: `Lote #${deleteModalState.id} purgado definitivamente de la base de datos.`,
          link: '/lotes',
        });
      } else {
        const target = batches.find((b) => b.batchId === Number(deleteModalState.id));
        await updateBatch(Number(deleteModalState.id), { ...target, isActive: false, isDeleted: true });
        setBatches((prev) =>
          prev.map((b) => (b.batchId === Number(deleteModalState.id) ? { ...b, isActive: false, isDeleted: true } : b))
        );
        toast.success(
          lang === 'es'
            ? `Lote #${deleteModalState.id} enviado a la papelera (anulado lógicamente)`
            : `Batch #${deleteModalState.id} moved to trash (soft deleted)`
        );
        notifyOperationUpdate({
          module: 'LOTES',
          actionType: 'PAPELERA',
          entityName: `Lote #${deleteModalState.id}`,
          details: `Lote #${deleteModalState.id} enviado a la papelera lógica (anulado).`,
          link: '/lotes',
        });
      }
      setDeleteModalState((p) => ({ ...p, isOpen: false }));
    } catch (err) {
      console.error('Error deleting batch:', err);
      toast.error(lang === 'es' ? 'Error al eliminar lote' : 'Failed to delete batch');
    } finally {
      setDeleteModalState((p) => ({ ...p, isLoading: false }));
    }
  };

  // --- CRUD: INVENTORY ---
  const handleSaveInventory = async (invData: Partial<InventoryBatch>) => {
    if (editingInventory?.id) {
      const res = await updateInventoryBatch(editingInventory.id, invData);
      setInventory((prev) =>
        prev.map((i) => (i.id === editingInventory.id ? { ...i, ...res.data } : i))
      );
      toast.success(
        lang === 'es' ? 'Stock de planta actualizado' : 'Plant inventory updated'
      );
      notifyOperationUpdate({
        module: 'LOTES',
        actionType: 'ACTUALIZACIÓN',
        entityName: `Inventario #${editingInventory.id}`,
        details: `Stock de cámara actualizado: ${invData.quantity ?? editingInventory.quantity} cajas disponibles.`,
        link: '/lotes',
      });
    } else {
      const res = await createInventoryBatch(invData as Omit<InventoryBatch, 'id'>);
      setInventory((prev) => [res.data, ...prev]);
      toast.success(
        lang === 'es' ? 'Entrada de inventario registrada' : 'Inventory entry registered'
      );
      notifyOperationUpdate({
        module: 'LOTES',
        actionType: 'CREACIÓN',
        entityName: `Inventario #${res.data.id}`,
        details: `Nueva entrada de uva en cámara de frío registrada (${res.data.quantity || 0} cajas).`,
        link: '/lotes',
      });
    }
  };

  // RESTAURAR INVENTARIO
  const handleRestoreInventory = async (inv: InventoryBatch) => {
    if (!inv.id) return;
    try {
      await updateInventoryBatch(inv.id, { ...inv, isActive: true, isDeleted: false });
      setInventory((prev) =>
        prev.map((i) => (i.id === inv.id ? { ...i, isActive: true, isDeleted: false } : i))
      );
      toast.success(
        lang === 'es'
          ? `Stock de planta restaurado con éxito`
          : `Plant inventory entry restored`
      );
      notifyOperationUpdate({
        module: 'LOTES',
        actionType: 'RESTAURACIÓN',
        entityName: `Inventario #${inv.id}`,
        details: `Registro de inventario #${inv.id} restaurado con éxito a la cámara de frío.`,
        link: '/lotes',
      });
    } catch (err) {
      console.error('Error restoring inventory:', err);
      toast.error(lang === 'es' ? 'Error al restaurar inventario' : 'Failed to restore inventory');
    }
  };

  const handleDeleteInventoryConfirm = async () => {
    setDeleteModalState((p) => ({ ...p, isLoading: true }));
    try {
      if (filterTrash === 'trash') {
        await deleteInventoryBatch(String(deleteModalState.id));
        setInventory((prev) => prev.filter((i) => i.id !== String(deleteModalState.id)));
        toast.success(
          lang === 'es' ? 'Registro de inventario eliminado definitivamente' : 'Inventory entry permanently removed'
        );
        notifyOperationUpdate({
          module: 'LOTES',
          actionType: 'PAPELERA',
          entityName: `Inventario #${deleteModalState.id}`,
          details: `Registro de inventario #${deleteModalState.id} eliminado permanentemente.`,
          link: '/lotes',
        });
      } else {
        const target = inventory.find((i) => i.id === String(deleteModalState.id));
        await updateInventoryBatch(String(deleteModalState.id), { ...target, isActive: false, isDeleted: true });
        setInventory((prev) =>
          prev.map((i) => (i.id === String(deleteModalState.id) ? { ...i, isActive: false, isDeleted: true } : i))
        );
        toast.success(
          lang === 'es' ? 'Stock de inventario enviado a la papelera' : 'Inventory entry moved to trash'
        );
        notifyOperationUpdate({
          module: 'LOTES',
          actionType: 'PAPELERA',
          entityName: `Inventario #${deleteModalState.id}`,
          details: `Registro de inventario #${deleteModalState.id} enviado a la papelera lógica.`,
          link: '/lotes',
        });
      }
      setDeleteModalState((p) => ({ ...p, isOpen: false }));
    } catch (err) {
      console.error('Error deleting inventory:', err);
      toast.error(lang === 'es' ? 'Error al eliminar inventario' : 'Failed to delete inventory');
    } finally {
      setDeleteModalState((p) => ({ ...p, isLoading: false }));
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 text-left">
      {/* ── Top Header & Tab Switcher ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
              {lang === 'es' ? 'Lotes & Calidad' : 'Lots & Quality'}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-lime-500/10 text-lime-500 border border-lime-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse" />
              {lang === 'es' ? 'SQL Server + MongoDB' : 'SQL Server + MongoDB'}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {lang === 'es'
              ? 'Trazabilidad de cosecha, inspecciones fitosanitarias SENASA, inventario y cadena de frío'
              : 'Harvest traceability, SENASA inspections, plant inventory and cold chain telemetry'}
          </p>
        </div>

        {/* Tab Selector & Main Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tab Switcher Pills */}
          <div className="p-1 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center shadow-sm">
            <button
              onClick={() => {
                setActiveTab('lotes');
                setSearchTerm('');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'lotes'
                  ? 'bg-lime-500 text-zinc-950 shadow-md shadow-lime-500/20'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Layers size={14} />
              <span>{lang === 'es' ? 'Lotes de Cosecha' : 'Harvest Batches'}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'lotes'
                    ? 'bg-zinc-950/20 text-zinc-950'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                }`}
              >
                {metrics.totalBatches}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('inventario');
                setSearchTerm('');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'inventario'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Package size={14} />
              <span>{lang === 'es' ? 'Inventario Planta' : 'Plant Inventory'}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'inventario'
                    ? 'bg-zinc-950/20 text-zinc-950'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                }`}
              >
                {inventory.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('telemetria');
                setSearchTerm('');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'telemetria'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Thermometer size={14} />
              <span>{lang === 'es' ? 'Cadena de Frío' : 'Cold Chain'}</span>
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            title={lang === 'es' ? 'Recargar datos' : 'Refresh data'}
            className="w-10 h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          {/* New CTA Button */}
          {activeTab === 'lotes' ? (
            <button
              onClick={() => {
                setEditingBatch(null);
                setIsBatchModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-600 text-zinc-950 text-xs font-bold shadow-lg shadow-lime-500/20 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>{lang === 'es' ? 'Nuevo Lote' : 'New Batch'}</span>
            </button>
          ) : activeTab === 'inventario' ? (
            <button
              onClick={() => {
                setEditingInventory(null);
                setIsInventoryModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>{lang === 'es' ? 'Entrada Stock' : 'Stock Entry'}</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* ── KPI Metric Cards Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {lang === 'es' ? 'Lotes Cosechados' : 'Harvested Batches'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-lime-500/10 text-lime-500 flex items-center justify-center">
              <Layers size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">
            {metrics.totalBatches}
          </div>
          <span className="text-[11px] text-lime-500 font-medium">
            {metrics.passedBatches} {lang === 'es' ? 'aptos para exportación' : 'certified for export'}
          </span>
        </div>

        {/* KPI 2 */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {lang === 'es' ? 'Certificación SENASA' : 'SENASA Certified'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">
            {metrics.totalBatches > 0
              ? `${Math.round((metrics.passedBatches / metrics.totalBatches) * 100)}%`
              : '100%'}
          </div>
          <span className="text-[11px] text-blue-500 font-medium">
            {lang === 'es' ? 'Conformidad fitosanitaria' : 'Phytosanitary compliance'}
          </span>
        </div>

        {/* KPI 3 */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {lang === 'es' ? 'Stock en Cámara Fría' : 'Cold Chamber Stock'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Package size={16} />
            </div>
          </div>
          <div className="text-2xl font-mono font-black text-[var(--text-primary)]">
            {(metrics.totalStock / 1000).toFixed(1)}k
          </div>
          <span className="text-[11px] text-emerald-500 font-medium">
            {lang === 'es' ? 'Kilogramos disponibles' : 'Kilograms available'}
          </span>
        </div>

        {/* KPI 4 */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {lang === 'es' ? 'Cadena de Frío' : 'Cold Chain Status'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <Thermometer size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-cyan-500">
            5.2 °C
          </div>
          <span className="text-[11px] text-emerald-500 font-medium">
            {lang === 'es' ? 'Rango óptimo para Palta & Mango' : 'Optimal range for Avocado & Mango'}
          </span>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'lotes'
                ? lang === 'es'
                  ? 'Buscar por ID lote, fundo, producto, inspector...'
                  : 'Search by batch ID, farm, product, inspector...'
                : lang === 'es'
                ? 'Buscar por fundo o producto...'
                : 'Search by farm or product...'
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 transition-all"
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

        {activeTab === 'lotes' && (
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-[var(--text-secondary)]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | QualityStatus)}
                className="px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-xs focus:outline-none"
              >
                <option value="ALL">{lang === 'es' ? 'Todos los dictámenes' : 'All verdicts'}</option>
                <option value="PASSED">{lang === 'es' ? 'Aprobados SENASA' : 'Passed SENASA'}</option>
                <option value="CONDITIONALLY_ACCEPTED">{lang === 'es' ? 'Condicionales' : 'Conditional'}</option>
                <option value="PENDING">{lang === 'es' ? 'Pendientes' : 'Pending'}</option>
                <option value="REJECTED">{lang === 'es' ? 'Rechazados' : 'Rejected'}</option>
              </select>
            </div>

            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-xs focus:outline-none"
            >
              <option value="ALL">{lang === 'es' ? 'Todos los productos' : 'All products'}</option>
              {products.map((p) => (
                <option key={p.id || p.code} value={p.code || p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status Trash Tabs */}
        {(activeTab === 'lotes' || activeTab === 'inventario') && (
          <StatusFilterTabs
            current={filterTrash}
            onChange={setFilterTrash}
            counts={activeTab === 'lotes' ? batchTrashCounts : inventoryTrashCounts}
            lang={lang}
          />
        )}

        <span className="text-xs text-[var(--text-hint)] pl-2 border-l border-[var(--border-subtle)]">
          {activeTab === 'lotes'
            ? `${filteredBatches.length} ${lang === 'es' ? 'lotes' : 'batches'}`
            : activeTab === 'inventario'
            ? `${filteredInventory.length} ${lang === 'es' ? 'registros' : 'items'}`
            : ''}
        </span>
      </div>

      {/* ── Informative Banner when in Trash ── */}
      {filterTrash === 'trash' && (activeTab === 'lotes' || activeTab === 'inventario') && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fadeIn">
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400 font-semibold">
            <Archive size={18} className="shrink-0" />
            <span>
              {lang === 'es'
                ? `Estás visualizando la papelera de ${activeTab === 'lotes' ? 'lotes de cosecha' : 'inventario de planta'} (anulados lógicamente). Haz clic en "Restaurar" para reactivarlos inmediatamente en la operación.`
                : `Viewing trash for ${activeTab === 'lotes' ? 'harvest batches' : 'plant inventory'} (soft deleted). Click "Restore" to reactivate any entry.`}
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
            <RefreshCw size={28} className="animate-spin mx-auto text-lime-500" />
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              {lang === 'es' ? 'Cargando trazabilidad desde SQL Server & MongoDB...' : 'Loading traceability data...'}
            </p>
          </div>
        ) : activeTab === 'lotes' ? (
          /* ============================================================ */
          /* TAB 1: HARVEST & PACKING BATCHES                             */
          /* ============================================================ */
          filteredBatches.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-lime-500/10 text-lime-500 flex items-center justify-center mx-auto">
                <Layers size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  {lang === 'es' ? 'No se encontraron lotes' : 'No batches found'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                  {searchTerm
                    ? lang === 'es'
                      ? 'No hay lotes que coincidan con los filtros aplicados.'
                      : 'No batches match your filter criteria.'
                    : lang === 'es'
                    ? 'Aún no se han registrado lotes de cosecha en el sistema.'
                    : 'No harvest batches recorded in the system yet.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingBatch(null);
                  setIsBatchModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-lime-500 hover:bg-lime-600 text-zinc-950 text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>{lang === 'es' ? 'Registrar Primer Lote' : 'Register First Batch'}</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 text-[var(--text-secondary)] font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Lote ID' : 'Batch ID'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Producto & Origen Fundo' : 'Product & Farm Origin'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Cosecha & Empaque' : 'Harvest & Packing'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Vida Útil / Vence' : 'Expiry Date'}</th>
                    <th className="py-3.5 px-4 text-center">{lang === 'es' ? 'Inspección SENASA' : 'SENASA Quality'}</th>
                    <th className="py-3.5 px-4 text-right">{lang === 'es' ? 'Acciones' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredBatches.map((batch) => {
                    const firstInsp = batch.inspections?.[0];
                    const qualityStatus = firstInsp?.qualityStatus || 'PENDING';

                    return (
                      <tr
                        key={batch.batchId}
                        className="hover:bg-[var(--bg-subtle)]/30 transition-colors group"
                      >
                        {/* Batch ID */}
                        <td className="py-3.5 px-4 font-mono font-bold text-lime-500 whitespace-nowrap">
                          <span className="px-2 py-1 rounded-lg bg-lime-500/10 border border-lime-500/20">
                            LOT-{String(batch.batchId).padStart(4, '0')}
                          </span>
                        </td>

                        {/* Product & Origin */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[var(--text-primary)] text-sm">
                            {getProductName(batch.productId)}
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 flex items-center gap-1">
                            <MapPin size={11} className="text-lime-500 shrink-0" />
                            <span>{batch.fieldName}</span>
                            <span className="text-[var(--text-hint)]">•</span>
                            <span className="text-[var(--text-hint)] truncate max-w-[150px]">
                              {getProviderName(batch.providerId)}
                            </span>
                          </div>
                        </td>

                        {/* Dates: Harvest & Packing */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-[var(--text-primary)] font-medium">
                            <Calendar size={12} className="text-lime-500 shrink-0" />
                            <span>
                              {lang === 'es' ? 'Cosecha:' : 'Harvest:'}{' '}
                              {batch.harvestDate || '—'}
                            </span>
                          </div>
                          {batch.packingDate && (
                            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 flex items-center gap-1.5">
                              <Clock size={11} className="text-[var(--text-hint)]" />
                              <span>
                                {lang === 'es' ? 'Empaque:' : 'Packed:'} {batch.packingDate}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Expiry */}
                        <td className="py-3.5 px-4 font-mono text-xs text-[var(--text-secondary)] whitespace-nowrap">
                          {batch.expirationDate || '—'}
                        </td>

                        {/* SENASA Quality Badge */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              qualityStatus === 'PASSED'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                : qualityStatus === 'CONDITIONALLY_ACCEPTED'
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                : qualityStatus === 'REJECTED'
                                ? 'bg-red-500/10 text-red-500 border-red-500/30'
                                : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                            }`}
                          >
                            <ShieldCheck size={12} />
                            <span>{qualityStatus}</span>
                          </span>
                          {firstInsp?.inspector && (
                            <div className="text-[10px] text-[var(--text-hint)] mt-0.5 truncate max-w-[140px] mx-auto">
                              {firstInsp.inspector}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {batch.isActive === false || batch.isDeleted === true ? (
                              <>
                                <button
                                  onClick={() => handleRestoreBatch(batch)}
                                  title={lang === 'es' ? 'Restaurar lote a planta' : 'Restore batch'}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lime-500/15 hover:bg-lime-500/25 text-lime-600 dark:text-lime-400 border border-lime-500/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
                                >
                                  <RotateCcw size={13} />
                                  <span>{lang === 'es' ? 'Restaurar' : 'Restore'}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteModalState({
                                      isOpen: true,
                                      type: 'batch',
                                      id: batch.batchId || 0,
                                      name: `Lote LOT-${String(batch.batchId).padStart(4, '0')} (${batch.fieldName})`,
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
                                  onClick={() => {
                                    setEditingBatch(batch);
                                    setIsBatchModalOpen(true);
                                  }}
                                  title={lang === 'es' ? 'Editar lote' : 'Edit batch'}
                                  className="w-8 h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-secondary)] hover:text-lime-500 hover:border-lime-500/40 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteModalState({
                                      isOpen: true,
                                      type: 'batch',
                                      id: batch.batchId || 0,
                                      name: `Lote LOT-${String(batch.batchId).padStart(4, '0')} (${batch.fieldName})`,
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : activeTab === 'inventario' ? (
          /* ============================================================ */
          /* TAB 2: PLANT INVENTORY (INVENTORY BATCHES)                   */
          /* ============================================================ */
          filteredInventory.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <Package size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  {lang === 'es' ? 'No hay existencias en planta' : 'No inventory balance'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {lang === 'es' ? 'Registra entradas de cajas a cámara de frío.' : 'Register storage box entries.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 text-[var(--text-secondary)] font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">{lang === 'es' ? 'ID Inventario' : 'Inventory ID'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Producto' : 'Product'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Ubicación / Fundo' : 'Location / Storage'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Stock Disponible' : 'Stock Quantity'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Vencimiento' : 'Expiry'}</th>
                    <th className="py-3.5 px-4 text-right">{lang === 'es' ? 'Acciones' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--bg-subtle)]/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-500">
                        {item.id}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[var(--text-primary)]">
                        {getProductName(item.productId || '')}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-secondary)]">
                        {item.fieldName || 'Cámara Principal'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-emerald-500 text-sm">
                        {item.quantity.toLocaleString('en-US')} {lang === 'es' ? 'Kg' : 'Kg'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[var(--text-secondary)]">
                        {item.expirationDate || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.isActive === false || item.isDeleted === true ? (
                            <>
                              <button
                                onClick={() => handleRestoreInventory(item)}
                                title={lang === 'es' ? 'Restaurar existencias' : 'Restore inventory balance'}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
                              >
                                <RotateCcw size={13} />
                                <span>{lang === 'es' ? 'Restaurar' : 'Restore'}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteModalState({
                                    isOpen: true,
                                    type: 'inventory',
                                    id: item.id || '',
                                    name: `Item ${item.id}`,
                                    isLoading: false,
                                  });
                                }}
                                title={lang === 'es' ? 'Eliminar definitivamente' : 'Permanently delete'}
                                className="w-8 h-8 rounded-lg border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/15 flex items-center justify-center cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingInventory(item);
                                  setIsInventoryModalOpen(true);
                                }}
                                className="w-8 h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-secondary)] hover:text-emerald-500 flex items-center justify-center cursor-pointer"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteModalState({
                                    isOpen: true,
                                    type: 'inventory',
                                    id: item.id || '',
                                    name: `Item ${item.id}`,
                                    isLoading: false,
                                  });
                                }}
                                title={lang === 'es' ? 'Mover a papelera' : 'Move to trash'}
                                className="w-8 h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-secondary)] hover:text-red-500 flex items-center justify-center cursor-pointer"
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
          /* TAB 3: COLD CHAIN & TEMPERATURE TELEMETRY                   */
          /* ============================================================ */
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-500 block mb-1">
                  {lang === 'es' ? 'Cámara #1 (Palta Hass)' : 'Chamber #1 (Hass Avocado)'}
                </span>
                <div className="text-3xl font-mono font-black text-[var(--text-primary)]">
                  5.4 °C
                </div>
                <div className="text-xs text-emerald-500 mt-1 font-semibold">
                  ✓ {lang === 'es' ? 'Humedad 88% — Estable' : 'Humidity 88% — Stable'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 block mb-1">
                  {lang === 'es' ? 'Cámara #2 (Mango Kent)' : 'Chamber #2 (Kent Mango)'}
                </span>
                <div className="text-3xl font-mono font-black text-[var(--text-primary)]">
                  11.8 °C
                </div>
                <div className="text-xs text-emerald-500 mt-1 font-semibold">
                  ✓ {lang === 'es' ? 'Tratamiento hidrotérmico' : 'Hydrothermal treatment complete'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500 block mb-1">
                  {lang === 'es' ? 'Contenedor Reefer #MSCU-884' : 'Reefer Container #MSCU-884'}
                </span>
                <div className="text-3xl font-mono font-black text-[var(--text-primary)]">
                  4.8 °C
                </div>
                <div className="text-xs text-emerald-500 mt-1 font-semibold">
                  ✓ {lang === 'es' ? 'Tránsito a Callao — Normal' : 'In transit to Callao — Normal'}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">
                    {lang === 'es' ? 'Telemetría IoT en Tiempo Real' : 'Real-time IoT Telemetry'}
                  </h4>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {lang === 'es'
                      ? 'Sensores conectados con registro automático cada 15 minutos en MongoDB.'
                      : 'IoT sensors logging temperature every 15 minutes into MongoDB.'}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                {lang === 'es' ? 'Conexión Activa' : 'Live Sync'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Batch Modal ── */}
      <BatchModal
        isOpen={isBatchModalOpen}
        batch={editingBatch}
        products={products}
        providers={providers}
        existingBatches={batches}
        lang={lang}
        onClose={() => setIsBatchModalOpen(false)}
        onSubmit={handleSaveBatch}
      />

      {/* ── Inventory Modal ── */}
      <InventoryModal
        isOpen={isInventoryModalOpen}
        inventoryItem={editingInventory}
        products={products}
        providers={providers}
        lang={lang}
        onClose={() => setIsInventoryModalOpen(false)}
        onSubmit={handleSaveInventory}
      />

      {/* ── Delete Confirmation Modal ── */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        title={
          deleteModalState.type === 'batch'
            ? lang === 'es'
              ? filterTrash === 'trash'
                ? '¿Eliminar Lote Definitivamente?'
                : '¿Mover Lote a la Papelera?'
              : filterTrash === 'trash'
              ? 'Permanently Delete Batch?'
              : 'Move Batch to Trash?'
            : lang === 'es'
            ? filterTrash === 'trash'
              ? '¿Eliminar Registro Definitivamente?'
              : '¿Mover Stock a la Papelera?'
            : filterTrash === 'trash'
            ? 'Permanently Delete Inventory?'
            : 'Move Inventory to Trash?'
        }
        message={
          deleteModalState.type === 'batch'
            ? lang === 'es'
              ? filterTrash === 'trash'
                ? 'Esta acción eliminará permanentemente el lote de SQL Server y MongoDB. No se podrá recuperar.'
                : 'El lote se marcará como anulado y se moverá a la papelera. Podrás restaurarlo en cualquier momento.'
              : filterTrash === 'trash'
              ? 'This will permanently destroy the batch and inspections. It cannot be recovered.'
              : 'The batch will be marked inactive and moved to trash. You can restore it anytime.'
            : lang === 'es'
            ? filterTrash === 'trash'
              ? 'Se eliminará permanentemente el saldo en cámara frigorífica.'
              : 'El stock se moverá a la papelera. Podrás restaurarlo en cualquier momento.'
            : filterTrash === 'trash'
            ? 'This inventory balance will be permanently deleted.'
            : 'The balance will be moved to trash and can be restored.'
        }
        itemName={deleteModalState.name}
        isLoading={deleteModalState.isLoading}
        isSoftDelete={filterTrash !== 'trash'}
        lang={lang}
        onConfirm={
          deleteModalState.type === 'batch'
            ? handleDeleteBatchConfirm
            : handleDeleteInventoryConfirm
        }
        onCancel={() => setDeleteModalState((p) => ({ ...p, isOpen: false }))}
      />
    </div>
  );
}
