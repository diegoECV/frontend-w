// =============================================================================
// PANEL: ÓRDENES & EMBARQUES — VISONS S.A.C. ADMIN DASHBOARD
// Gestión Integral de Contratos de Exportación B2B, Embarques Marítimos Reefer,
// Cadena de Frío, Trazabilidad Internacional y Documentación Aduanera (DAM)
// =============================================================================

import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Ship,
  ShoppingCart,
  Plus,
  Search,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Download,
  Edit2,
  Trash2,
  Anchor,
  Thermometer,
  Calendar,
  Globe,
  DollarSign,
  Package,
  ArrowRight,
  Eye,
  RotateCcw,
  Archive,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

import type { Order, OrderDetail, Shipment, CustomsDeclaration } from '../../types/order';
import type { Client } from '../../types/client';
import type { Product } from '../../types/product';
import type { Batch } from '../../types/batch';

import {
  getOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrderDetails,
  getShipments,
  createShipment,
  updateShipment,
  deleteShipment,
  getCustomsDeclarations,
  exportOrdersExcel,
  exportOrdersPdf,
  exportOrdersCsv,
} from '../../api/orderApi';
import { getClients } from '../../api/clientApi';
import { getProducts } from '../../api/productApi';
import { getBatches } from '../../api/batchApi';

import { OrderModal } from '../../components/orders/OrderModal';
import { ShipmentModal } from '../../components/orders/ShipmentModal';
import { OrderDetailModal } from '../../components/orders/OrderDetailModal';
import { OrderTrackingModal } from '../../components/orders/OrderTrackingModal';
import { DeleteConfirmModal } from '../../components/products/DeleteConfirmModal';
import { StatusFilterTabs, type FilterTrashStatus } from '../../components/shared/StatusFilterTabs';
import { ImportModal } from '../../components/shared/ImportModal';
import { notifyOperationUpdate } from '../../services/notificationService';

type OutletCtx = { lang: 'es' | 'en' };
type TabType = 'orders' | 'shipments' | 'customs';

export default function EmbarquesPage() {
  const { lang } = useOutletContext<OutletCtx>();

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [filterTrash, setFilterTrash] = useState<FilterTrashStatus>('active');

  // Core Data States
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [customs, setCustoms] = useState<CustomsDeclaration[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  // Loading & Action states
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [incotermFilter, setIncotermFilter] = useState('ALL');
  const [clientFilter, setClientFilter] = useState('ALL');

  // Modals
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);

  const [selectedOrderForItems, setSelectedOrderForItems] = useState<Order | null>(null);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<Order | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Deletion Modal
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'order' | 'shipment';
    id: number;
    name: string;
  } | null>(null);

  // Load All Panel Data
  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [
        ordersRes,
        detailsRes,
        shipmentsRes,
        customsRes,
        clientsRes,
        productsRes,
        batchesRes,
      ] = await Promise.allSettled([
        getOrders(),
        getOrderDetails(),
        getShipments(),
        getCustomsDeclarations(),
        getClients(),
        getProducts(),
        getBatches(),
      ]);

      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data || []);
      if (detailsRes.status === 'fulfilled') setOrderDetails(detailsRes.value.data || []);
      if (shipmentsRes.status === 'fulfilled') setShipments(shipmentsRes.value.data || []);
      if (customsRes.status === 'fulfilled') setCustoms(customsRes.value.data || []);
      if (clientsRes.status === 'fulfilled') setClients(clientsRes.value.data || []);
      if (productsRes.status === 'fulfilled') setProducts(productsRes.value.data || []);
      if (batchesRes.status === 'fulfilled') setBatches(batchesRes.value.data || []);
    } catch (err) {
      console.error('Error loading orders data:', err);
      toast.error(lang === 'es' ? 'Error al cargar datos del servidor' : 'Error loading server data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick Client Map
  const clientMap = useMemo(() => {
    const map = new Map<string, Client>();
    clients.forEach((c) => {
      const key = c.id || '';
      if (key) map.set(key, c);
    });
    return map;
  }, [clients]);

  // Trash Counts
  const orderTrashCounts = useMemo(() => {
    const active = orders.filter((o) => !(o.isDeleted === true || o.status === 'CANCELLED' || o.isActive === false)).length;
    const trash = orders.filter((o) => o.isDeleted === true || o.status === 'CANCELLED' || o.isActive === false).length;
    return { active, trash, all: orders.length };
  }, [orders]);

  const shipmentTrashCounts = useMemo(() => {
    const active = shipments.filter((s) => !(s.isDeleted === true || s.status === 'CANCELLED' || s.isActive === false)).length;
    const trash = shipments.filter((s) => s.isDeleted === true || s.status === 'CANCELLED' || s.isActive === false).length;
    return { active, trash, all: shipments.length };
  }, [shipments]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const client = clientMap.get(o.clientId);
      const matchesSearch =
        o.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.clientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client?.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.destinationPort || '').toLowerCase().includes(searchTerm.toLowerCase());

      const isItemDeleted = o.isDeleted === true || o.status === 'CANCELLED' || o.isActive === false;
      const matchesTrash =
        filterTrash === 'all' ||
        (filterTrash === 'active' && !isItemDeleted) ||
        (filterTrash === 'trash' && isItemDeleted);

      const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
      const matchesIncoterm = incotermFilter === 'ALL' || o.incoterm === incotermFilter;
      const matchesClient = clientFilter === 'ALL' || o.clientId === clientFilter;

      return matchesSearch && matchesTrash && matchesStatus && matchesIncoterm && matchesClient;
    });
  }, [orders, clientMap, searchTerm, filterTrash, statusFilter, incotermFilter, clientFilter]);

  // Filtered Shipments
  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      const order = orders.find((o) => o.orderId === s.orderId);
      const matchesSearch =
        (s.containerNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.blNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.vesselName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.freightForwarder || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order?.orderCode || '').toLowerCase().includes(searchTerm.toLowerCase());

      const isItemDeleted = s.isDeleted === true || s.status === 'CANCELLED' || s.isActive === false;
      const matchesTrash =
        filterTrash === 'all' ||
        (filterTrash === 'active' && !isItemDeleted) ||
        (filterTrash === 'trash' && isItemDeleted);

      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

      return matchesSearch && matchesTrash && matchesStatus;
    });
  }, [shipments, orders, searchTerm, filterTrash, statusFilter]);

  // Order CRUD Handlers
  const handleSaveOrder = async (orderData: Partial<Order>): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      if (editingOrder) {
        await updateOrder(editingOrder.orderId, orderData);
        toast.success(
          lang === 'es'
            ? `Orden ${orderData.orderCode} actualizada correctamente`
            : `Order ${orderData.orderCode} updated successfully`
        );
        notifyOperationUpdate({
          module: 'EMBARQUES',
          actionType: 'ACTUALIZACIÓN',
          entityName: `Orden ${orderData.orderCode || editingOrder.orderCode}`,
          details: `Orden de exportación ${orderData.orderCode || editingOrder.orderCode} actualizada. Incoterm: ${orderData.incoterm || editingOrder.incoterm}, Puerto: ${orderData.destinationPort || editingOrder.destinationPort}.`,
          link: '/embarques',
        });
      } else {
        await createOrder(orderData);
        toast.success(
          lang === 'es'
            ? `Orden ${orderData.orderCode} registrada exitosamente`
            : `Order ${orderData.orderCode} created successfully`
        );
        notifyOperationUpdate({
          module: 'EMBARQUES',
          actionType: 'CREACIÓN',
          entityName: `Orden ${orderData.orderCode}`,
          details: `Nueva orden de exportación registrada: ${orderData.orderCode} (Incoterm: ${orderData.incoterm || 'FOB'}, Destino: ${orderData.destinationPort || 'Callao'}).`,
          link: '/embarques',
        });
      }
      setIsOrderModalOpen(false);
      setEditingOrder(null);
      await loadData(true);
      return true;
    } catch (err: unknown) {
      console.error('Save order failed:', err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        (lang === 'es' ? 'Error al guardar la orden' : 'Error saving order');
      toast.error(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Shipment CRUD Handlers
  const handleSaveShipment = async (shipmentData: Partial<Shipment>): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      if (editingShipment && editingShipment.shipmentId) {
        await updateShipment(editingShipment.shipmentId, shipmentData);
        toast.success(
          lang === 'es'
            ? `Embarque ${shipmentData.containerNumber} actualizado con éxito`
            : `Shipment ${shipmentData.containerNumber} updated successfully`
        );
        notifyOperationUpdate({
          module: 'EMBARQUES',
          actionType: 'ACTUALIZACIÓN',
          entityName: `Embarque ${shipmentData.containerNumber}`,
          details: `Contenedor ${shipmentData.containerNumber} actualizado. Agente/Naviera: ${shipmentData.freightForwarder || shipmentData.vesselName || 'N/A'}, BL: ${shipmentData.blNumber || 'N/A'}.`,
          link: '/embarques',
        });
      } else {
        await createShipment(shipmentData);
        toast.success(
          lang === 'es'
            ? `Embarque ${shipmentData.containerNumber} registrado exitosamente`
            : `Shipment ${shipmentData.containerNumber} registered successfully`
        );
        notifyOperationUpdate({
          module: 'EMBARQUES',
          actionType: 'CREACIÓN',
          entityName: `Embarque ${shipmentData.containerNumber}`,
          details: `Nuevo embarque marítimo Reefer registrado: Contenedor ${shipmentData.containerNumber} (${shipmentData.freightForwarder || shipmentData.vesselName || 'Marítimo'}).`,
          link: '/embarques',
        });
      }
      setIsShipmentModalOpen(false);
      setEditingShipment(null);
      await loadData(true);
      return true;
    } catch (err: unknown) {
      console.error('Save shipment failed:', err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        (lang === 'es' ? 'Error al guardar el embarque' : 'Error saving shipment');
      toast.error(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // RESTAURAR ORDEN
  const handleRestoreOrder = async (order: Order) => {
    try {
      await updateOrder(order.orderId, { ...order, status: 'CONFIRMED', isDeleted: false, isActive: true });
      setOrders((prev) =>
        prev.map((o) => (o.orderId === order.orderId ? { ...o, status: 'CONFIRMED', isDeleted: false, isActive: true } : o))
      );
      toast.success(
        lang === 'es'
          ? `Orden ${order.orderCode} restaurada exitosamente a operaciones`
          : `Order ${order.orderCode} restored successfully`
      );
      notifyOperationUpdate({
        module: 'EMBARQUES',
        actionType: 'RESTAURACIÓN',
        entityName: `Orden ${order.orderCode}`,
        details: `Orden de exportación ${order.orderCode} restaurada a operaciones activas.`,
        link: '/embarques',
      });
    } catch (err) {
      console.error('Error restoring order:', err);
      toast.error(lang === 'es' ? 'Error al restaurar orden' : 'Failed to restore order');
    }
  };

  // RESTAURAR EMBARQUE
  const handleRestoreShipment = async (shipment: Shipment) => {
    if (!shipment.shipmentId) return;
    try {
      await updateShipment(shipment.shipmentId, { ...shipment, status: 'BOOKED', isDeleted: false, isActive: true });
      setShipments((prev) =>
        prev.map((s) => (s.shipmentId === shipment.shipmentId ? { ...s, status: 'BOOKED', isDeleted: false, isActive: true } : s))
      );
      toast.success(
        lang === 'es'
          ? `Embarque ${shipment.containerNumber} restaurado con éxito a la logística`
          : `Shipment ${shipment.containerNumber} restored successfully`
      );
      notifyOperationUpdate({
        module: 'EMBARQUES',
        actionType: 'RESTAURACIÓN',
        entityName: `Embarque ${shipment.containerNumber}`,
        details: `Embarque marítimo ${shipment.containerNumber} restaurado a la logística activa.`,
        link: '/embarques',
      });
    } catch (err) {
      console.error('Error restoring shipment:', err);
      toast.error(lang === 'es' ? 'Error al restaurar embarque' : 'Failed to restore shipment');
    }
  };

  // Deletion Confirmation Handler
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      if (filterTrash === 'trash') {
        if (deleteTarget.type === 'order') {
          await deleteOrder(deleteTarget.id);
          setOrders((prev) => prev.filter((o) => o.orderId !== deleteTarget.id));
          toast.success(
            lang === 'es'
              ? `Orden ${deleteTarget.name} eliminada permanentemente`
              : `Order ${deleteTarget.name} deleted permanently`
          );
          notifyOperationUpdate({
            module: 'EMBARQUES',
            actionType: 'PAPELERA',
            entityName: `Orden ${deleteTarget.name}`,
            details: `Orden de exportación ${deleteTarget.name} purgada definitivamente.`,
            link: '/embarques',
          });
        } else {
          await deleteShipment(deleteTarget.id);
          setShipments((prev) => prev.filter((s) => s.shipmentId !== deleteTarget.id));
          toast.success(
            lang === 'es'
              ? `Embarque ${deleteTarget.name} eliminado definitivamente`
              : `Shipment ${deleteTarget.name} deleted permanently`
          );
          notifyOperationUpdate({
            module: 'EMBARQUES',
            actionType: 'PAPELERA',
            entityName: `Embarque ${deleteTarget.name}`,
            details: `Embarque ${deleteTarget.name} purgado definitivamente.`,
            link: '/embarques',
          });
        }
      } else {
        if (deleteTarget.type === 'order') {
          const target = orders.find((o) => o.orderId === deleteTarget.id);
          await updateOrder(deleteTarget.id, { ...target, status: 'CANCELLED', isDeleted: true, isActive: false });
          setOrders((prev) =>
            prev.map((o) => (o.orderId === deleteTarget.id ? { ...o, status: 'CANCELLED', isDeleted: true, isActive: false } : o))
          );
          toast.success(
            lang === 'es'
              ? `Orden ${deleteTarget.name} enviada a la papelera (anulada lógicamente)`
              : `Order ${deleteTarget.name} moved to trash (soft deleted)`
          );
          notifyOperationUpdate({
            module: 'EMBARQUES',
            actionType: 'PAPELERA',
            entityName: `Orden ${deleteTarget.name}`,
            details: `Orden de exportación ${deleteTarget.name} movida a la papelera (anulada).`,
            link: '/embarques',
          });
        } else {
          const target = shipments.find((s) => s.shipmentId === deleteTarget.id);
          await updateShipment(deleteTarget.id, { ...target, status: 'CANCELLED', isDeleted: true, isActive: false });
          setShipments((prev) =>
            prev.map((s) => (s.shipmentId === deleteTarget.id ? { ...s, status: 'CANCELLED', isDeleted: true, isActive: false } : s))
          );
          toast.success(
            lang === 'es'
              ? `Embarque ${deleteTarget.name} enviado a la papelera (anulado lógicamente)`
              : `Shipment ${deleteTarget.name} moved to trash (soft deleted)`
          );
          notifyOperationUpdate({
            module: 'EMBARQUES',
            actionType: 'PAPELERA',
            entityName: `Embarque ${deleteTarget.name}`,
            details: `Embarque marítimo ${deleteTarget.name} movido a la papelera (anulado).`,
            link: '/embarques',
          });
        }
      }
      setDeleteTarget(null);
    } catch (err: unknown) {
      console.error('Delete failed:', err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        (lang === 'es'
          ? 'No se pudo procesar la eliminación.'
          : 'Could not process deletion.');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export Handlers
  const handleExport = async (format: 'excel' | 'pdf' | 'csv') => {
    setIsExporting(true);
    try {
      if (format === 'excel') await exportOrdersExcel();
      else if (format === 'pdf') await exportOrdersPdf();
      else if (format === 'csv') await exportOrdersCsv();
      toast.success(
        lang === 'es'
          ? `Reporte de pedidos exportado en formato ${format.toUpperCase()}`
          : `Orders report exported as ${format.toUpperCase()}`
      );
    } catch (err) {
      console.error('Export error:', err);
      toast.error(lang === 'es' ? 'Error al generar la exportación' : 'Error generating export file');
    } finally {
      setIsExporting(false);
    }
  };

  // Helper calculations for KPIs
  const totalOrdersCount = orders.length;
  const inTransitCount = shipments.filter((s) => s.status === 'IN_TRANSIT' || s.status === 'GATE_IN').length;
  const activeContainersCount = shipments.length;
  const estimatedFobTotal = orderDetails.reduce((acc, it) => acc + (it.totalPrice || (it.quantityKg * it.unitPrice) || 0), 0);

  // Status Badge Helper
  const renderOrderStatusBadge = (status?: string) => {
    const s = (status || 'PENDING').toUpperCase();
    switch (s) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {lang === 'es' ? 'Pendiente' : 'Pending'}
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            {lang === 'es' ? 'Confirmada' : 'Confirmed'}
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            {lang === 'es' ? 'En Packing' : 'Processing'}
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            {lang === 'es' ? 'En Tránsito' : 'Shipped'}
          </span>
        );
      case 'DELIVERED':
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {lang === 'es' ? 'Entregada' : 'Delivered'}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            {lang === 'es' ? 'Cancelada' : 'Cancelled'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            {s}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shadow-lg shadow-violet-500/10">
              <Ship size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
                {lang === 'es' ? 'Órdenes & Embarques' : 'Orders & Shipments'}
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  Reefer Logistics
                </span>
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                {lang === 'es'
                  ? 'Gestión de órdenes de venta B2B, contenedores Reefer, Bill of Lading y documentación aduanera SUNAT'
                  : 'Management of B2B sales contracts, Reefer containers, Bill of Lading and SUNAT customs declarations'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons & Exports */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Refresh */}
          <button
            onClick={() => loadData()}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            title={lang === 'es' ? 'Actualizar' : 'Refresh'}
          >
            <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
          </button>

          {/* Export Dropdown buttons */}
          <div className="flex items-center border border-[var(--border-subtle)] rounded-xl overflow-hidden bg-[var(--bg-subtle)]">
            <button
              onClick={() => handleExport('excel')}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer border-r border-[var(--border-subtle)]"
              title="Exportar Excel"
            >
              <FileSpreadsheet size={15} />
              <span>XLSX</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer border-r border-[var(--border-subtle)]"
              title="Exportar PDF"
            >
              <FileText size={15} />
              <span>PDF</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
              title="Exportar CSV"
            >
              <Download size={15} />
              <span>CSV</span>
            </button>
          </div>

          {/* Import Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-card)] text-xs font-semibold text-[var(--text-primary)] transition-all cursor-pointer shadow-sm"
            title={lang === 'es' ? 'Importar órdenes comerciales desde Excel o CSV' : 'Import export orders from Excel or CSV'}
          >
            <Upload size={15} className="text-emerald-500" />
            <span>{lang === 'es' ? 'Importar' : 'Import'}</span>
          </button>

          {/* Primary Action Buttons */}
          <button
            onClick={() => {
              setEditingShipment(null);
              setIsShipmentModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
          >
            <Ship size={15} />
            {lang === 'es' ? 'Nuevo Embarque' : 'New Shipment'}
          </button>

          <button
            onClick={() => {
              setEditingOrder(null);
              setIsOrderModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/25 transition-all cursor-pointer"
          >
            <Plus size={16} />
            {lang === 'es' ? 'Nueva Orden Comercial' : 'New Commercial Order'}
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm hover:border-violet-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              {lang === 'es' ? 'Total Órdenes' : 'Total Orders'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
              <ShoppingCart size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[var(--text-primary)]">
              {totalOrdersCount}
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-medium">
              {lang === 'es' ? 'pedidos B2B' : 'B2B orders'}
            </span>
          </div>
          <div className="mt-2 text-xs text-violet-400 font-medium">
            {orders.filter((o) => o.status === 'PENDING').length} {lang === 'es' ? 'pendientes de despacho' : 'pending dispatch'}
          </div>
        </div>

        {/* In Transit */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              {lang === 'es' ? 'En Altamar / Tránsito' : 'In Transit / Sailing'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Ship size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[var(--text-primary)]">
              {inTransitCount}
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-medium">
              {lang === 'es' ? 'buques activos' : 'active vessels'}
            </span>
          </div>
          <div className="mt-2 text-xs text-cyan-400 font-medium">
            {lang === 'es' ? 'Ruta Callao/Paita ➔ Europa/USA' : 'Callao/Paita ➔ Europe/USA'}
          </div>
        </div>

        {/* Active Containers */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              {lang === 'es' ? 'Contenedores Reefer' : 'Reefer Containers'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Thermometer size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[var(--text-primary)]">
              {activeContainersCount}
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-medium">
              40ft High Cube
            </span>
          </div>
          <div className="mt-2 text-xs text-emerald-400 font-medium">
            ❄️ 0.5°C {lang === 'es' ? 'consigna frío activa' : 'active setpoint'}
          </div>
        </div>

        {/* Estimated FOB Value */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              {lang === 'es' ? 'Facturación FOB Est.' : 'Est. FOB Total'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">
              ${estimatedFobTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-medium">
              USD
            </span>
          </div>
          <div className="mt-2 text-xs text-amber-400/80 font-medium">
            {orderDetails.length} {lang === 'es' ? 'líneas valorizadas' : 'costed lines'}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
          }`}
        >
          <ShoppingCart size={15} />
          <span>{lang === 'es' ? 'Órdenes Comerciales' : 'Commercial Orders'}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20 text-white/90">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('shipments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'shipments'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/25'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
          }`}
        >
          <Ship size={15} />
          <span>{lang === 'es' ? 'Embarques & Contenedores Reefer' : 'Shipments & Reefer Containers'}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20 text-white/90">
            {shipments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('customs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'customs'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
          }`}
        >
          <Anchor size={15} />
          <span>{lang === 'es' ? 'Aduanas SUNAT (DAM) & Trazabilidad' : 'SUNAT Customs (DAM) & Tracking'}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20 text-white/90">
            {customs.length}
          </span>
        </button>
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'orders'
                ? lang === 'es' ? 'Buscar por código, cliente o puerto destino...' : 'Search by code, client or destination port...'
                : lang === 'es' ? 'Buscar por contenedor, naviera, buque o BL...' : 'Search by container, line, vessel or BL...'
            }
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs">
            <Filter size={13} className="text-[var(--text-secondary)]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-[var(--text-primary)] font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">{lang === 'es' ? 'Todos los Estados' : 'All Statuses'}</option>
              {activeTab === 'orders' ? (
                <>
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </>
              ) : (
                <>
                  <option value="BOOKED">BOOKED</option>
                  <option value="GATE_IN">GATE_IN</option>
                  <option value="IN_TRANSIT">IN_TRANSIT</option>
                  <option value="CUSTOMS_HOLD">CUSTOMS_HOLD</option>
                  <option value="DELIVERED">DELIVERED</option>
                </>
              )}
            </select>
          </div>

          {/* Incoterm filter (only for orders tab) */}
          {activeTab === 'orders' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs">
              <Globe size={13} className="text-[var(--text-secondary)]" />
              <select
                value={incotermFilter}
                onChange={(e) => setIncotermFilter(e.target.value)}
                className="bg-transparent text-[var(--text-primary)] font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL">Incoterms (Todos)</option>
                <option value="FOB">FOB</option>
                <option value="CIF">CIF</option>
                <option value="CFR">CFR</option>
                <option value="EXW">EXW</option>
                <option value="FCA">FCA</option>
              </select>
            </div>
          )}

          {/* Client Filter */}
          {activeTab === 'orders' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs">
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="bg-transparent text-[var(--text-primary)] font-medium focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                <option value="ALL">{lang === 'es' ? 'Todos los Clientes' : 'All Clients'}</option>
                {clients.map((c) => {
                  const val = c.id || '';
                  return (
                    <option key={val} value={val}>
                      {c.companyName}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Status Trash Tabs */}
          {(activeTab === 'orders' || activeTab === 'shipments') && (
            <StatusFilterTabs
              current={filterTrash}
              onChange={setFilterTrash}
              counts={activeTab === 'orders' ? orderTrashCounts : shipmentTrashCounts}
              lang={lang}
            />
          )}
        </div>
      </div>

      {/* ── Informative Banner when in Trash ── */}
      {filterTrash === 'trash' && (activeTab === 'orders' || activeTab === 'shipments') && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fadeIn">
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400 font-semibold">
            <Archive size={18} className="shrink-0" />
            <span>
              {lang === 'es'
                ? `Estás visualizando la papelera de ${activeTab === 'orders' ? 'órdenes comerciales' : 'embarques marítimos'} (anulados lógicamente). Haz clic en "Restaurar" para reactivarlos inmediatamente en la operación.`
                : `Viewing trash for ${activeTab === 'orders' ? 'orders' : 'shipments'} (soft deleted). Click "Restore" to reactivate any entry.`}
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

      {/* TAB 1: ÓRDENES COMERCIALES */}
      {activeTab === 'orders' && (
        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-semibold border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="py-3.5 px-4">{lang === 'es' ? 'Código' : 'Code'}</th>
                  <th className="py-3.5 px-4">{lang === 'es' ? 'Cliente B2B' : 'B2B Client'}</th>
                  <th className="py-3.5 px-4">{lang === 'es' ? 'Fecha' : 'Date'}</th>
                  <th className="py-3.5 px-4">Incoterm</th>
                  <th className="py-3.5 px-4">{lang === 'es' ? 'Puerto Destino' : 'Destination Port'}</th>
                  <th className="py-3.5 px-4">{lang === 'es' ? 'Items / FOB Est.' : 'Items / Est. FOB'}</th>
                  <th className="py-3.5 px-4">{lang === 'es' ? 'Estado' : 'Status'}</th>
                  <th className="py-3.5 px-4 text-center">{lang === 'es' ? 'Acciones' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[var(--text-secondary)]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw size={24} className="animate-spin text-violet-500" />
                        <span>{lang === 'es' ? 'Cargando órdenes comerciales...' : 'Loading commercial orders...'}</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[var(--text-secondary)]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ShoppingCart size={32} className="text-[var(--text-secondary)]/50" />
                        <p className="font-semibold text-sm">
                          {lang === 'es' ? 'No se encontraron órdenes comerciales' : 'No commercial orders found'}
                        </p>
                        <p className="text-xs">
                          {lang === 'es'
                            ? 'Ajusta los filtros de búsqueda o crea una nueva orden comercial.'
                            : 'Adjust search filters or create a new commercial order.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => {
                    const client = clientMap.get(ord.clientId);
                    const items = orderDetails.filter((it) => it.orderId === ord.orderId);
                    const itemsTotalFob = items.reduce(
                      (acc, it) => acc + (it.totalPrice || (it.quantityKg * it.unitPrice) || 0),
                      0
                    );

                    return (
                      <tr key={ord.orderId} className="hover:bg-[var(--bg-subtle)]/70 transition-colors">
                        {/* Order Code */}
                        <td className="py-3.5 px-4 font-mono font-bold text-violet-400">
                          {ord.orderCode}
                        </td>

                        {/* Client info */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[var(--text-primary)]">
                            {client ? client.companyName : ord.clientId}
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[10px]">
                              {client?.country || 'Internacional'}
                            </span>
                            <span>{client?.documentNumber || ord.clientId}</span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-[var(--text-secondary)] whitespace-nowrap">
                          {ord.orderDate}
                        </td>

                        {/* Incoterm */}
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                            {ord.incoterm || 'FOB'}
                          </span>
                        </td>

                        {/* Destination */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[var(--text-primary)]">
                            {ord.destinationPort || 'Rotterdam (NLRTM)'}
                          </div>
                          {ord.estimatedShippingDate && (
                            <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1 mt-0.5">
                              <Calendar size={11} /> ETD: {ord.estimatedShippingDate}
                            </div>
                          )}
                        </td>

                        {/* Items / FOB */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-emerald-400">
                            ${itemsTotalFob.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {ord.currency || 'USD'}
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)]">
                            {items.length} {lang === 'es' ? 'productos' : 'items'}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {renderOrderStatusBadge(ord.status)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {ord.isDeleted === true || ord.status === 'CANCELLED' || ord.isActive === false ? (
                              <>
                                <button
                                  onClick={() => handleRestoreOrder(ord)}
                                  title={lang === 'es' ? 'Restaurar orden comercial' : 'Restore commercial order'}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 text-violet-600 dark:text-violet-400 border border-violet-500/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
                                >
                                  <RotateCcw size={13} />
                                  <span>{lang === 'es' ? 'Restaurar' : 'Restore'}</span>
                                </button>
                                <button
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: 'order',
                                      id: ord.orderId,
                                      name: ord.orderCode,
                                    })
                                  }
                                  className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/15 transition-colors cursor-pointer"
                                  title={lang === 'es' ? 'Eliminar definitivamente' : 'Delete permanently'}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            ) : (
                              <>
                                {/* Items modal button */}
                                <button
                                  onClick={() => setSelectedOrderForItems(ord)}
                                  className="p-1.5 rounded-lg border border-[var(--border-subtle)] text-violet-400 hover:bg-violet-500/10 transition-colors cursor-pointer"
                                  title={lang === 'es' ? 'Ver / Modificar Items de la Orden' : 'View / Edit Items'}
                                >
                                  <Package size={14} />
                                </button>

                                {/* Tracking modal button */}
                                <button
                                  onClick={() => setSelectedOrderForTracking(ord)}
                                  className="p-1.5 rounded-lg border border-[var(--border-subtle)] text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                                  title={lang === 'es' ? 'Trazabilidad y Logística de Exportación' : 'Export Tracking'}
                                >
                                  <Eye size={14} />
                                </button>

                                {/* Edit button */}
                                <button
                                  onClick={() => {
                                    setEditingOrder(ord);
                                    setIsOrderModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg border border-[var(--border-subtle)] text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                                  title={lang === 'es' ? 'Editar Orden' : 'Edit Order'}
                                >
                                  <Edit2 size={14} />
                                </button>

                                {/* Delete button */}
                                <button
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: 'order',
                                      id: ord.orderId,
                                      name: ord.orderCode,
                                    })
                                  }
                                  className="p-1.5 rounded-lg border border-[var(--border-subtle)] text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title={lang === 'es' ? 'Mover a papelera' : 'Move to trash'}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: EMBARQUES & CONTENEDORES REEFER */}
      {activeTab === 'shipments' && (
        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-semibold border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="py-3.5 px-4">{lang === 'es' ? 'Contenedor Reefer' : 'Reefer Container'}</th>
                  <th className="py-3.5 px-4">{lang === 'es' ? 'Orden Comercial' : 'Order Ref'}</th>
                  <th className="py-3.5 px-4">{lang === 'es' ? 'Línea / Buque' : 'Carrier / Vessel'}</th>
                  <th className="py-3.5 px-4">Bill of Lading / Booking</th>
                  <th className="py-3.5 px-4">{lang === 'es' ? 'Ruta Marítima' : 'Ocean Route'}</th>
                  <th className="py-3.5 px-4">{lang === 'es' ? 'Temperatura' : 'Cold Chain'}</th>
                  <th className="py-3.5 px-4">{lang === 'es' ? 'Estado' : 'Status'}</th>
                  <th className="py-3.5 px-4 text-center">{lang === 'es' ? 'Acciones' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                {filteredShipments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[var(--text-secondary)]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Ship size={32} className="text-[var(--text-secondary)]/50" />
                        <p className="font-semibold text-sm">
                          {lang === 'es' ? 'No se encontraron embarques registrados' : 'No registered shipments found'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredShipments.map((s) => {
                    const order = orders.find((o) => o.orderId === s.orderId);
                    return (
                      <tr key={s.shipmentId} className="hover:bg-[var(--bg-subtle)]/70 transition-colors">
                        {/* Container */}
                        <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                          ❄️ {s.containerNumber || 'POR ASIGNAR'}
                        </td>

                        {/* Order Code */}
                        <td className="py-3.5 px-4 font-mono text-violet-400 font-semibold">
                          {order ? order.orderCode : `ID #${s.orderId}`}
                        </td>

                        {/* Forwarder / Vessel */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[var(--text-primary)]">
                            {s.freightForwarder || 'Maersk Line'}
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)]">
                            {s.vesselName || 'Ocean Vessel'}
                          </div>
                        </td>

                        {/* BL & Booking */}
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          <div>{s.blNumber || 'BL-PENDIENTE'}</div>
                          <div className="text-[var(--text-secondary)] text-[10px]">
                            {s.bookingNumber || 'BKG-PENDIENTE'}
                          </div>
                        </td>

                        {/* Route */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-xs font-medium">
                            <span>{s.departurePort || 'Callao'}</span>
                            <ArrowRight size={12} className="text-cyan-400" />
                            <span>{s.arrivalPort || 'Rotterdam'}</span>
                          </div>
                        </td>

                        {/* Setpoint Temp */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            <Thermometer size={12} />
                            {s.temperatureSetpoint ?? 0.5}°C
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {renderOrderStatusBadge(s.status)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {s.isDeleted === true || s.status === 'CANCELLED' || s.isActive === false ? (
                              <>
                                <button
                                  onClick={() => handleRestoreShipment(s)}
                                  title={lang === 'es' ? 'Restaurar embarque reefer' : 'Restore reefer shipment'}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
                                >
                                  <RotateCcw size={13} />
                                  <span>{lang === 'es' ? 'Restaurar' : 'Restore'}</span>
                                </button>
                                <button
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: 'shipment',
                                      id: s.shipmentId || 0,
                                      name: s.containerNumber,
                                    })
                                  }
                                  className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/15 transition-colors cursor-pointer"
                                  title={lang === 'es' ? 'Eliminar definitivamente' : 'Permanently delete'}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingShipment(s);
                                    setIsShipmentModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg border border-[var(--border-subtle)] text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                                  title={lang === 'es' ? 'Editar Embarque' : 'Edit Shipment'}
                                >
                                  <Edit2 size={14} />
                                </button>

                                <button
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: 'shipment',
                                      id: s.shipmentId || 0,
                                      name: s.containerNumber,
                                    })
                                  }
                                  className="p-1.5 rounded-lg border border-[var(--border-subtle)] text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title={lang === 'es' ? 'Mover a papelera' : 'Move to trash'}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ADUANAS SUNAT (DAM) */}
      {activeTab === 'customs' && (
        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xl overflow-hidden p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Anchor size={18} className="text-emerald-400" />
                {lang === 'es' ? 'Declaraciones Aduaneras de Mercancías (DAM) SUNAT' : 'SUNAT Customs Export Declarations (DAM)'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                {lang === 'es'
                  ? 'Canal de control aduanero (Verde, Naranja, Rojo), valor FOB y agencia de aduanas despachante'
                  : 'Customs control channel (Green, Orange, Red), FOB value and clearing customs agency'}
              </p>
            </div>
          </div>

          <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-semibold border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="py-3 px-4">{lang === 'es' ? 'Nº DAM SUNAT' : 'SUNAT DAM Nº'}</th>
                  <th className="py-3 px-4">{lang === 'es' ? 'Embarque / Contenedor' : 'Shipment / Container'}</th>
                  <th className="py-3 px-4">{lang === 'es' ? 'Agencia de Aduanas' : 'Customs Broker'}</th>
                  <th className="py-3 px-4 text-right">{lang === 'es' ? 'Valor FOB' : 'FOB Value'}</th>
                  <th className="py-3 px-4">{lang === 'es' ? 'Canal / Estado' : 'Channel / Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                {customs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-[var(--text-secondary)]">
                      {lang === 'es' ? 'No hay declaraciones aduaneras registradas.' : 'No customs declarations found.'}
                    </td>
                  </tr>
                ) : (
                  customs.map((c) => {
                    const shipment = shipments.find((s) => s.shipmentId === c.shipmentId);
                    const isGreen = c.status?.toUpperCase().includes('VERDE') || c.status?.toUpperCase().includes('CLEARED');
                    const isRed = c.status?.toUpperCase().includes('ROJO');

                    return (
                      <tr key={c.declarationId} className="hover:bg-[var(--bg-subtle)] transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          {c.damNumber}
                        </td>
                        <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">
                          {shipment ? `Contenedor ${shipment.containerNumber}` : `Shipment #${c.shipmentId}`}
                        </td>
                        <td className="py-3 px-4">
                          {c.customsAgency || 'Agencia Ransa / Scharff Aduanas S.A.C.'}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          ${(c.fobValue || 45200).toLocaleString()} USD
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              isGreen
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : isRed
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isGreen ? 'bg-emerald-400' : isRed ? 'bg-rose-400' : 'bg-amber-400'
                              }`}
                            />
                            {c.status || 'CANAL VERDE'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT COMMERCIAL ORDER */}
      <OrderModal
        isOpen={isOrderModalOpen}
        order={editingOrder}
        existingOrders={orders}
        clients={clients}
        isLoading={isSubmitting}
        lang={lang}
        onSave={handleSaveOrder}
        onClose={() => {
          setIsOrderModalOpen(false);
          setEditingOrder(null);
        }}
      />

      {/* MODAL: CREATE / EDIT SHIPMENT */}
      <ShipmentModal
        isOpen={isShipmentModalOpen}
        shipment={editingShipment}
        existingShipments={shipments}
        orders={orders}
        isLoading={isSubmitting}
        lang={lang}
        onSave={handleSaveShipment}
        onClose={() => {
          setIsShipmentModalOpen(false);
          setEditingShipment(null);
        }}
      />

      {/* MODAL: ORDER ITEMS & FOB PRICING */}
      <OrderDetailModal
        isOpen={Boolean(selectedOrderForItems)}
        order={selectedOrderForItems}
        items={orderDetails}
        products={products}
        batches={batches}
        lang={lang}
        onRefresh={() => loadData(true)}
        onClose={() => setSelectedOrderForItems(null)}
      />

      {/* MODAL: EXPORT TRACKING & LOGISTICS TIMELINE */}
      <OrderTrackingModal
        isOpen={Boolean(selectedOrderForTracking)}
        order={selectedOrderForTracking}
        shipment={
          selectedOrderForTracking
            ? shipments.find((s) => s.orderId === selectedOrderForTracking.orderId) || null
            : null
        }
        declaration={
          selectedOrderForTracking
            ? customs.find((c) => {
                const s = shipments.find((sh) => sh.orderId === selectedOrderForTracking.orderId);
                return s ? c.shipmentId === s.shipmentId : false;
              }) || null
            : null
        }
        lang={lang}
        onClose={() => setSelectedOrderForTracking(null)}
      />

      {/* MODAL: CONFIRM DELETION */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={
          deleteTarget?.type === 'order'
            ? lang === 'es'
              ? filterTrash === 'trash'
                ? '¿Eliminar Orden Definitivamente?'
                : '¿Mover Orden a la Papelera?'
              : filterTrash === 'trash'
              ? 'Permanently Delete Order?'
              : 'Move Order to Trash?'
            : lang === 'es'
            ? filterTrash === 'trash'
              ? '¿Eliminar Embarque Definitivamente?'
              : '¿Mover Embarque a la Papelera?'
            : filterTrash === 'trash'
            ? 'Permanently Delete Shipment?'
            : 'Move Shipment to Trash?'
        }
        message={
          deleteTarget?.type === 'order'
            ? lang === 'es'
              ? filterTrash === 'trash'
                ? 'Esta acción destruirá permanentemente la orden comercial de la base de datos SQL Server.'
                : 'La orden se marcará como anulada y se moverá a la papelera. Podrás restaurarla en cualquier momento.'
              : filterTrash === 'trash'
              ? 'This action will permanently delete the commercial order from SQL Server.'
              : 'The order will be cancelled and moved to trash. You can restore it anytime.'
            : lang === 'es'
            ? filterTrash === 'trash'
              ? 'Esta acción eliminará definitivamente el contenedor reefer de la logística marítima.'
              : 'El embarque se marcará como anulado y se moverá a la papelera. Podrás restaurarlo en cualquier momento.'
            : filterTrash === 'trash'
            ? 'This will permanently destroy the shipment and tracking telemetry.'
            : 'The shipment will be moved to trash and can be restored anytime.'
        }
        itemName={deleteTarget?.name || ''}
        isLoading={isSubmitting}
        isSoftDelete={filterTrash !== 'trash'}
        lang={lang}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* MODAL: IMPORTACIÓN MASIVA DE ÓRDENES */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        module="orders"
        lang={lang}
        onSuccess={() => loadData(true)}
      />
    </div>
  );
}
