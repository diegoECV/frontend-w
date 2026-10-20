// =============================================================================
// PANEL: FINANZAS & FACTURACIÓN — VISONS S.A.C. ADMIN DASHBOARD
// Facturación Electrónica UBL 2.1 con Estado CDR SUNAT, Conciliación Bancaria,
// Cobranzas en Divisas (USD/EUR) y Tarifarios Estacionales de Exportación
// =============================================================================

import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  DollarSign,
  FileText,
  CreditCard,
  Tag,
  Plus,
  Search,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Calendar,
  TrendingUp,
  RotateCcw,
  Archive,
} from 'lucide-react';
import { toast } from 'sonner';

import type { Invoice, Payment, PriceList } from '../../types/finance';
import type { Order } from '../../types/order';
import type { Product } from '../../types/product';

import {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
  getPriceLists,
  createPriceList,
  updatePriceList,
  deletePriceList,
  exportInvoicesCsv,
} from '../../api/financeApi';
import { getOrders } from '../../api/orderApi';
import { getProducts } from '../../api/productApi';

import { InvoiceModal } from '../../components/finance/InvoiceModal';
import { PaymentModal } from '../../components/finance/PaymentModal';
import { PriceListModal } from '../../components/finance/PriceListModal';
import { SunatCdrModal } from '../../components/finance/SunatCdrModal';
import { DeleteConfirmModal } from '../../components/products/DeleteConfirmModal';
import { StatusFilterTabs, type FilterTrashStatus } from '../../components/shared/StatusFilterTabs';
import { notifyOperationUpdate } from '../../services/notificationService';

type OutletCtx = { lang: 'es' | 'en' };
type TabType = 'invoices' | 'payments' | 'pricelists';

export default function FinanzasPage() {
  const { lang } = useOutletContext<OutletCtx>();

  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>('invoices');
  const [filterTrash, setFilterTrash] = useState<FilterTrashStatus>('active');

  // Core Data States
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cdrFilter, setCdrFilter] = useState('ALL');

  // Modals
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  const [isPriceListModalOpen, setIsPriceListModalOpen] = useState(false);
  const [editingPriceList, setEditingPriceList] = useState<PriceList | null>(null);

  const [selectedInvoiceForCdr, setSelectedInvoiceForCdr] = useState<Invoice | null>(null);

  // Deletion Target Modal
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'invoice' | 'payment' | 'pricelist';
    id: string | number;
    name: string;
  } | null>(null);

  // Load Data
  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [invRes, payRes, pricesRes, ordersRes, prodsRes] = await Promise.allSettled([
        getInvoices(),
        getPayments(),
        getPriceLists(),
        getOrders(),
        getProducts(),
      ]);

      if (invRes.status === 'fulfilled') setInvoices(invRes.value.data || []);
      if (payRes.status === 'fulfilled') setPayments(payRes.value.data || []);
      if (pricesRes.status === 'fulfilled') setPriceLists(pricesRes.value.data || []);
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data || []);
      if (prodsRes.status === 'fulfilled') setProducts(prodsRes.value.data || []);
    } catch (err) {
      console.error('Error loading finance data:', err);
      toast.error(lang === 'es' ? 'Error al cargar datos financieros' : 'Error loading finance data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick Order Map
  const orderMap = useMemo(() => {
    const map = new Map<number, Order>();
    orders.forEach((o) => {
      map.set(o.orderId, o);
    });
    return map;
  }, [orders]);

  // Trash Counts
  const invoiceTrashCounts = useMemo(() => {
    const active = invoices.filter((i) => !(i.isDeleted === true || i.status === 'CANCELLED' || i.status === 'ANULADA' || i.isActive === false)).length;
    const trash = invoices.filter((i) => i.isDeleted === true || i.status === 'CANCELLED' || i.status === 'ANULADA' || i.isActive === false).length;
    return { active, trash, all: invoices.length };
  }, [invoices]);

  const paymentTrashCounts = useMemo(() => {
    const active = payments.filter((p) => !(p.isDeleted === true || p.isActive === false)).length;
    const trash = payments.filter((p) => p.isDeleted === true || p.isActive === false).length;
    return { active, trash, all: payments.length };
  }, [payments]);

  const priceListTrashCounts = useMemo(() => {
    const active = priceLists.filter((pl) => !(pl.isDeleted === true || pl.isActive === false)).length;
    const trash = priceLists.filter((pl) => pl.isDeleted === true || pl.isActive === false).length;
    return { active, trash, all: priceLists.length };
  }, [priceLists]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const order = orderMap.get(inv.orderId);
      const matchesSearch =
        (inv.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order?.orderCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order?.clientId || '').toLowerCase().includes(searchTerm.toLowerCase());

      const isItemDeleted = inv.isDeleted === true || inv.status === 'CANCELLED' || inv.status === 'ANULADA' || inv.isActive === false;
      const matchesTrash =
        filterTrash === 'all' ||
        (filterTrash === 'active' && !isItemDeleted) ||
        (filterTrash === 'trash' && isItemDeleted);

      const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      const matchesCdr = cdrFilter === 'ALL' || (inv.sunatCdrStatus || 'ACEPTADO') === cdrFilter;

      return matchesSearch && matchesTrash && matchesStatus && matchesCdr;
    });
  }, [invoices, orderMap, searchTerm, filterTrash, statusFilter, cdrFilter]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const order = orderMap.get(p.orderId);
      const matchesSearch =
        (p.referenceCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.paymentMethod || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order?.orderCode || '').toLowerCase().includes(searchTerm.toLowerCase());

      const isItemDeleted = p.isDeleted === true || p.isActive === false;
      const matchesTrash =
        filterTrash === 'all' ||
        (filterTrash === 'active' && !isItemDeleted) ||
        (filterTrash === 'trash' && isItemDeleted);

      const matchesMethod = statusFilter === 'ALL' || p.paymentMethod === statusFilter;

      return matchesSearch && matchesTrash && matchesMethod;
    });
  }, [payments, orderMap, searchTerm, filterTrash, statusFilter]);

  // Filtered Price Lists
  const filteredPriceLists = useMemo(() => {
    return priceLists.filter((pl) => {
      const matchesSearch =
        !searchTerm.trim() ||
        (pl.name || '').toLowerCase().includes(searchTerm.toLowerCase());

      const isItemDeleted = pl.isDeleted === true || pl.isActive === false;
      const matchesTrash =
        filterTrash === 'all' ||
        (filterTrash === 'active' && !isItemDeleted) ||
        (filterTrash === 'trash' && isItemDeleted);

      return matchesSearch && matchesTrash;
    });
  }, [priceLists, searchTerm, filterTrash]);

  // Financial KPIs
  const totalInvoicedUSD = useMemo(() => {
    return invoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
  }, [invoices]);

  const totalCollectedUSD = useMemo(() => {
    return payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  }, [payments]);

  const outstandingBalanceUSD = useMemo(() => {
    return invoices
      .filter((inv) => inv.status === 'UNPAID' || inv.status === 'PARTIAL')
      .reduce((acc, inv) => acc + (inv.total || 0), 0);
  }, [invoices]);

  const sunatAcceptedCount = useMemo(() => {
    return invoices.filter((i) => (i.sunatCdrStatus || 'ACEPTADO') === 'ACEPTADO').length;
  }, [invoices]);

  // Invoice CRUD Handlers
  const handleSaveInvoice = async (data: Partial<Invoice>): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      if (editingInvoice && editingInvoice.invoiceId) {
        await updateInvoice(editingInvoice.invoiceId, data);
        toast.success(
          lang === 'es'
            ? `Factura ${data.invoiceNumber} actualizada correctamente`
            : `Invoice ${data.invoiceNumber} updated successfully`
        );
        notifyOperationUpdate({
          module: 'FINANZAS',
          actionType: 'ACTUALIZACIÓN',
          entityName: `Factura ${data.invoiceNumber || editingInvoice.invoiceNumber}`,
          details: `Factura ${data.invoiceNumber || editingInvoice.invoiceNumber} actualizada. Monto: $${data.total || editingInvoice.total} ${data.currency || editingInvoice.currency || 'USD'}.`,
          link: '/finanzas',
        });
      } else {
        await createInvoice(data);
        toast.success(
          lang === 'es'
            ? `Factura ${data.invoiceNumber} emitida con éxito`
            : `Invoice ${data.invoiceNumber} issued successfully`
        );
        notifyOperationUpdate({
          module: 'FINANZAS',
          actionType: 'CREACIÓN',
          entityName: `Factura ${data.invoiceNumber}`,
          details: `Nueva factura comercial de exportación emitida: ${data.invoiceNumber} por $${data.total || 0} ${data.currency || 'USD'}.`,
          link: '/finanzas',
        });
      }
      setIsInvoiceModalOpen(false);
      setEditingInvoice(null);
      await loadData(true);
      return true;
    } catch (err: unknown) {
      console.error('Save invoice error:', err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        (lang === 'es' ? 'Error al guardar la factura' : 'Error saving invoice');
      toast.error(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Payment CRUD Handlers
  const handleSavePayment = async (data: Partial<Payment>): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      if (editingPayment && editingPayment.paymentId) {
        await updatePayment(editingPayment.paymentId, data);
        toast.success(
          lang === 'es'
            ? `Pago ${data.referenceCode} actualizado con éxito`
            : `Payment ${data.referenceCode} updated successfully`
        );
        notifyOperationUpdate({
          module: 'FINANZAS',
          actionType: 'ACTUALIZACIÓN',
          entityName: `Abono ${data.referenceCode || editingPayment.referenceCode}`,
          details: `Abono ${data.referenceCode || editingPayment.referenceCode} actualizado. Monto: $${data.amount || editingPayment.amount} USD.`,
          link: '/finanzas',
        });
      } else {
        await createPayment(data);
        toast.success(
          lang === 'es'
            ? `Pago ${data.referenceCode} registrado con éxito`
            : `Payment ${data.referenceCode} registered successfully`
        );
        notifyOperationUpdate({
          module: 'FINANZAS',
          actionType: 'CREACIÓN',
          entityName: `Abono ${data.referenceCode}`,
          details: `Nuevo pago B2B registrado: ${data.referenceCode} por $${data.amount || 0} USD.`,
          link: '/finanzas',
        });
      }
      setIsPaymentModalOpen(false);
      setEditingPayment(null);
      await loadData(true);
      return true;
    } catch (err: unknown) {
      console.error('Save payment error:', err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        (lang === 'es' ? 'Error al registrar el pago' : 'Error saving payment');
      toast.error(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Price List CRUD Handlers
  const handleSavePriceList = async (data: Partial<PriceList>): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      if (editingPriceList && editingPriceList.id) {
        await updatePriceList(editingPriceList.id, data);
        toast.success(
          lang === 'es'
            ? `Tarifario ${data.name} actualizado`
            : `Price list ${data.name} updated`
        );
        notifyOperationUpdate({
          module: 'FINANZAS',
          actionType: 'ACTUALIZACIÓN',
          entityName: `Tarifario ${data.name || editingPriceList.name}`,
          details: `Tarifario estacional "${data.name || editingPriceList.name}" actualizado en catálogo de precios.`,
          link: '/finanzas',
        });
      } else {
        await createPriceList(data);
        toast.success(
          lang === 'es'
            ? `Tarifario ${data.name} registrado en MongoDB`
            : `Price list ${data.name} registered in MongoDB`
        );
        notifyOperationUpdate({
          module: 'FINANZAS',
          actionType: 'CREACIÓN',
          entityName: `Tarifario ${data.name}`,
          details: `Nuevo tarifario estacional de exportación registrado: "${data.name}" (${data.currency || 'USD'}).`,
          link: '/finanzas',
        });
      }
      setIsPriceListModalOpen(false);
      setEditingPriceList(null);
      await loadData(true);
      return true;
    } catch (err: unknown) {
      console.error('Save price list error:', err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        (lang === 'es' ? 'Error al guardar tarifario' : 'Error saving price list');
      toast.error(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // RESTAURAR FACTURA
  const handleRestoreInvoice = async (inv: Invoice) => {
    if (!inv.invoiceId) return;
    try {
      await updateInvoice(inv.invoiceId, { ...inv, status: 'UNPAID', isDeleted: false, isActive: true });
      setInvoices((prev) =>
        prev.map((i) => (i.invoiceId === inv.invoiceId ? { ...i, status: 'UNPAID', isDeleted: false, isActive: true } : i))
      );
      toast.success(
        lang === 'es'
          ? `Factura ${inv.invoiceNumber} restaurada exitosamente a cuentas activas`
          : `Invoice ${inv.invoiceNumber} restored successfully`
      );
      notifyOperationUpdate({
        module: 'FINANZAS',
        actionType: 'RESTAURACIÓN',
        entityName: `Factura ${inv.invoiceNumber}`,
        details: `Factura comercial ${inv.invoiceNumber} restaurada a cuentas activas.`,
        link: '/finanzas',
      });
    } catch (err) {
      console.error('Error restoring invoice:', err);
      toast.error(lang === 'es' ? 'Error al restaurar factura' : 'Failed to restore invoice');
    }
  };

  // RESTAURAR PAGO
  const handleRestorePayment = async (p: Payment) => {
    if (!p.paymentId) return;
    try {
      await updatePayment(p.paymentId, { ...p, isDeleted: false, isActive: true });
      setPayments((prev) =>
        prev.map((pay) => (pay.paymentId === p.paymentId ? { ...pay, isDeleted: false, isActive: true } : pay))
      );
      toast.success(
        lang === 'es'
          ? `Abono ${p.referenceCode} restaurado con éxito a la conciliación`
          : `Payment ${p.referenceCode} restored successfully`
      );
      notifyOperationUpdate({
        module: 'FINANZAS',
        actionType: 'RESTAURACIÓN',
        entityName: `Abono ${p.referenceCode}`,
        details: `Abono bancario ${p.referenceCode} restaurado a la conciliación.`,
        link: '/finanzas',
      });
    } catch (err) {
      console.error('Error restoring payment:', err);
      toast.error(lang === 'es' ? 'Error al restaurar pago' : 'Failed to restore payment');
    }
  };

  // RESTAURAR TARIFARIO
  const handleRestorePriceList = async (pl: PriceList) => {
    if (!pl.id) return;
    try {
      await updatePriceList(pl.id, { ...pl, isDeleted: false, isActive: true });
      setPriceLists((prev) =>
        prev.map((item) => (item.id === pl.id ? { ...item, isDeleted: false, isActive: true } : item))
      );
      toast.success(
        lang === 'es'
          ? `Tarifario ${pl.name} restaurado con éxito`
          : `Price list ${pl.name} restored successfully`
      );
      notifyOperationUpdate({
        module: 'FINANZAS',
        actionType: 'RESTAURACIÓN',
        entityName: `Tarifario ${pl.name}`,
        details: `Tarifario "${pl.name}" restaurado al catálogo activo.`,
        link: '/finanzas',
      });
    } catch (err) {
      console.error('Error restoring price list:', err);
      toast.error(lang === 'es' ? 'Error al restaurar tarifario' : 'Failed to restore price list');
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      if (filterTrash === 'trash') {
        if (deleteTarget.type === 'invoice') {
          await deleteInvoice(Number(deleteTarget.id));
          setInvoices((prev) => prev.filter((i) => i.invoiceId !== Number(deleteTarget.id)));
          toast.success(lang === 'es' ? 'Factura eliminada permanentemente' : 'Invoice deleted permanently');
          notifyOperationUpdate({
            module: 'FINANZAS',
            actionType: 'PAPELERA',
            entityName: `Factura ${deleteTarget.name}`,
            details: `Factura ${deleteTarget.name} eliminada definitivamente de SQL Server.`,
            link: '/finanzas',
          });
        } else if (deleteTarget.type === 'payment') {
          await deletePayment(Number(deleteTarget.id));
          setPayments((prev) => prev.filter((p) => p.paymentId !== Number(deleteTarget.id)));
          toast.success(lang === 'es' ? 'Registro de pago eliminado definitivamente' : 'Payment record deleted permanently');
          notifyOperationUpdate({
            module: 'FINANZAS',
            actionType: 'PAPELERA',
            entityName: `Abono ${deleteTarget.name}`,
            details: `Registro de pago ${deleteTarget.name} eliminado definitivamente.`,
            link: '/finanzas',
          });
        } else {
          await deletePriceList(String(deleteTarget.id));
          setPriceLists((prev) => prev.filter((pl) => pl.id !== String(deleteTarget.id)));
          toast.success(lang === 'es' ? 'Tarifario eliminado definitivamente' : 'Price list deleted permanently');
          notifyOperationUpdate({
            module: 'FINANZAS',
            actionType: 'PAPELERA',
            entityName: `Tarifario ${deleteTarget.name}`,
            details: `Tarifario ${deleteTarget.name} purgado definitivamente de MongoDB.`,
            link: '/finanzas',
          });
        }
      } else {
        if (deleteTarget.type === 'invoice') {
          const target = invoices.find((i) => i.invoiceId === Number(deleteTarget.id));
          await updateInvoice(Number(deleteTarget.id), { ...target, status: 'CANCELLED', isDeleted: true, isActive: false });
          setInvoices((prev) =>
            prev.map((i) => (i.invoiceId === Number(deleteTarget.id) ? { ...i, status: 'CANCELLED', isDeleted: true, isActive: false } : i))
          );
          toast.success(
            lang === 'es'
              ? `Factura ${deleteTarget.name} enviada a la papelera (anulada lógicamente)`
              : `Invoice ${deleteTarget.name} moved to trash (soft deleted)`
          );
          notifyOperationUpdate({
            module: 'FINANZAS',
            actionType: 'PAPELERA',
            entityName: `Factura ${deleteTarget.name}`,
            details: `Factura ${deleteTarget.name} enviada a la papelera (anulada).`,
            link: '/finanzas',
          });
        } else if (deleteTarget.type === 'payment') {
          const target = payments.find((p) => p.paymentId === Number(deleteTarget.id));
          await updatePayment(Number(deleteTarget.id), { ...target, isDeleted: true, isActive: false });
          setPayments((prev) =>
            prev.map((p) => (p.paymentId === Number(deleteTarget.id) ? { ...p, isDeleted: true, isActive: false } : p))
          );
          toast.success(
            lang === 'es'
              ? `Abono ${deleteTarget.name} enviado a la papelera`
              : `Payment ${deleteTarget.name} moved to trash`
          );
          notifyOperationUpdate({
            module: 'FINANZAS',
            actionType: 'PAPELERA',
            entityName: `Abono ${deleteTarget.name}`,
            details: `Registro de pago ${deleteTarget.name} movido a la papelera.`,
            link: '/finanzas',
          });
        } else {
          const target = priceLists.find((pl) => pl.id === String(deleteTarget.id));
          await updatePriceList(String(deleteTarget.id), { ...target, isDeleted: true, isActive: false });
          setPriceLists((prev) =>
            prev.map((pl) => (pl.id === String(deleteTarget.id) ? { ...pl, isDeleted: true, isActive: false } : pl))
          );
          toast.success(
            lang === 'es'
              ? `Tarifario ${deleteTarget.name} enviado a la papelera`
              : `Price list ${deleteTarget.name} moved to trash`
          );
          notifyOperationUpdate({
            module: 'FINANZAS',
            actionType: 'PAPELERA',
            entityName: `Tarifario ${deleteTarget.name}`,
            details: `Tarifario ${deleteTarget.name} trasladado a la papelera.`,
            link: '/finanzas',
          });
        }
      }
      setDeleteTarget(null);
    } catch (err: unknown) {
      console.error('Delete failed:', err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        (lang === 'es' ? 'No se pudo procesar la eliminación' : 'Could not process deletion');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Badges
  const renderInvoiceStatusBadge = (status?: string) => {
    const s = (status || 'UNPAID').toUpperCase();
    switch (s) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {lang === 'es' ? 'Pagado' : 'Paid'}
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {lang === 'es' ? 'Cobro Parcial' : 'Partial'}
          </span>
        );
      case 'UNPAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            {lang === 'es' ? 'Pendiente' : 'Unpaid'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            {s}
          </span>
        );
    }
  };

  const renderCdrBadge = (status?: string | null) => {
    const s = (status || 'ACEPTADO').toUpperCase();
    if (s.includes('ACEPTADO')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <CheckCircle2 size={12} /> CDR SUNAT
        </span>
      );
    }
    if (s.includes('RECHAZADO')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
          <AlertTriangle size={12} /> Rechazado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
        <Clock size={12} /> Pendiente OSE
      </span>
    );
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <DollarSign size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
                {lang === 'es' ? 'Finanzas & Facturación' : 'Finance & Billing'}
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  SUNAT CDR UBL 2.1
                </span>
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                {lang === 'es'
                  ? 'Facturación electrónica de exportación, estados de recepción CDR SUNAT, conciliación bancaria y tarifarios B2B'
                  : 'Export electronic invoicing, SUNAT CDR receipt states, bank payment reconciliation and B2B seasonal pricing'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons & Exports */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadData()}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            title={lang === 'es' ? 'Actualizar' : 'Refresh'}
          >
            <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
          </button>

          {/* Export button */}
          <button
            onClick={() => exportInvoicesCsv(invoices)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-xs font-semibold text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
            title="Exportar Facturación CSV"
          >
            <FileSpreadsheet size={15} />
            <span>CSV / Excel</span>
          </button>

          {/* New Payment Button */}
          <button
            onClick={() => {
              setEditingPayment(null);
              setIsPaymentModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <CreditCard size={15} />
            {lang === 'es' ? 'Registrar Pago' : 'Register Payment'}
          </button>

          {/* New Invoice Button */}
          <button
            onClick={() => {
              setEditingInvoice(null);
              setIsInvoiceModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <Plus size={16} />
            {lang === 'es' ? 'Emitir Factura Electrónica' : 'Issue Electronic Invoice'}
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              {lang === 'es' ? 'Total Facturado' : 'Total Invoiced'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[var(--text-primary)]">
              ${totalInvoicedUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-medium">USD</span>
          </div>
          <div className="mt-2 text-xs text-emerald-500 font-medium">
            {invoices.length} {lang === 'es' ? 'comprobantes emitidos' : 'issued invoices'}
          </div>
        </div>

        {/* Total Collected */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              {lang === 'es' ? 'Cobranzas Percibidas' : 'Total Collected'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-500">
              ${totalCollectedUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-medium">USD</span>
          </div>
          <div className="mt-2 text-xs text-blue-500/80 font-medium">
            {payments.length} {lang === 'es' ? 'abonos bancarios conciliados' : 'reconciled payments'}
          </div>
        </div>

        {/* Outstanding AR */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              {lang === 'es' ? 'Cuentas por Cobrar' : 'Accounts Receivable'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-500">
              ${outstandingBalanceUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-medium">USD</span>
          </div>
          <div className="mt-2 text-xs text-rose-400 font-medium">
            {invoices.filter((i) => i.status === 'UNPAID').length} {lang === 'es' ? 'facturas pendientes' : 'pending invoices'}
          </div>
        </div>

        {/* SUNAT CDR Compliance */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              {lang === 'es' ? 'Conformidad SUNAT' : 'SUNAT CDR Status'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-500">
              {sunatAcceptedCount} / {invoices.length}
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-medium">100% OK</span>
          </div>
          <div className="mt-2 text-xs text-emerald-500 font-medium">
            {lang === 'es' ? 'Constancias CDR Validadas OSE' : 'All CDRs Validated with OSE'}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'invoices'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
          }`}
        >
          <FileText size={15} />
          <span>{lang === 'es' ? 'Facturación & Comprobantes SUNAT' : 'Invoices & SUNAT CDR'}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20 text-white/90">
            {invoices.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'payments'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
          }`}
        >
          <CreditCard size={15} />
          <span>{lang === 'es' ? 'Cobranzas & Abonos Bancarios' : 'Payments & Collections'}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20 text-white/90">
            {payments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pricelists')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'pricelists'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
          }`}
        >
          <Tag size={15} />
          <span>{lang === 'es' ? 'Tarifarios & Precios por Temporada' : 'Agreed Seasonal Prices'}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20 text-white/90">
            {priceLists.length}
          </span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'invoices'
                ? lang === 'es' ? 'Buscar por factura, orden comercial o cliente...' : 'Search by invoice, order or client...'
                : activeTab === 'payments'
                ? lang === 'es' ? 'Buscar por código de operación o medio de pago...' : 'Search by transaction ref or method...'
                : lang === 'es' ? 'Buscar tarifarios por nombre...' : 'Search price lists...'
            }
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'invoices' && (
            <>
              {/* Payment Status Filter */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs">
                <Filter size={13} className="text-[var(--text-secondary)]" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-[var(--text-primary)] font-medium focus:outline-none cursor-pointer"
                >
                  <option value="ALL">{lang === 'es' ? 'Todos los Estados' : 'All Statuses'}</option>
                  <option value="PAID">PAID (Pagado)</option>
                  <option value="UNPAID">UNPAID (Pendiente)</option>
                  <option value="PARTIAL">PARTIAL (Cobro Parcial)</option>
                </select>
              </div>

              {/* CDR Filter */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs">
                <select
                  value={cdrFilter}
                  onChange={(e) => setCdrFilter(e.target.value)}
                  className="bg-transparent text-[var(--text-primary)] font-medium focus:outline-none cursor-pointer"
                >
                  <option value="ALL">{lang === 'es' ? 'Todos CDR SUNAT' : 'All SUNAT CDR'}</option>
                  <option value="ACEPTADO">ACEPTADO</option>
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="RECHAZADO">RECHAZADO</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'pricelists' && (
            <button
              onClick={() => {
                setEditingPriceList(null);
                setIsPriceListModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              <Plus size={14} />
              {lang === 'es' ? 'Nuevo Tarifario' : 'New Price Agreement'}
            </button>
          )}

          {/* Status Trash Tabs */}
          <StatusFilterTabs
            current={filterTrash}
            onChange={setFilterTrash}
            counts={
              activeTab === 'invoices'
                ? invoiceTrashCounts
                : activeTab === 'payments'
                ? paymentTrashCounts
                : priceListTrashCounts
            }
            lang={lang}
          />
        </div>
      </div>

      {/* ── Informative Banner when in Trash ── */}
      {filterTrash === 'trash' && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fadeIn">
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400 font-semibold">
            <Archive size={18} className="shrink-0" />
            <span>
              {lang === 'es'
                ? `Estás visualizando la papelera de ${
                    activeTab === 'invoices'
                      ? 'facturación y comprobantes SUNAT'
                      : activeTab === 'payments'
                      ? 'cobranzas y abonos'
                      : 'tarifarios estacionales'
                  } (anulados lógicamente). Haz clic en "Restaurar" para reactivarlos inmediatamente en la operación financiera.`
                : `Viewing trash for ${
                    activeTab === 'invoices' ? 'invoices' : activeTab === 'payments' ? 'payments' : 'price lists'
                  } (soft deleted). Click "Restore" to reactivate any entry.`}
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

      {/* TAB 1: FACTURAS & COMPROBANTES */}
      {activeTab === 'invoices' && (
        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-semibold border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="py-3.5 px-4">{lang === 'es' ? 'Nº Comprobante' : 'Invoice Nº'}</th>
                  <th className="py-3.5 px-4">{lang === 'es' ? 'Orden Ref / Cliente' : 'Order Ref / Client'}</th>
                  <th className="py-3.5 px-4">{lang === 'es' ? 'Tipo Documento' : 'Type'}</th>
                  <th className="py-3.5 px-4">{lang === 'es' ? 'Fecha Emisión' : 'Issue Date'}</th>
                  <th className="py-3.5 px-4 text-right">{lang === 'es' ? 'Total Facturado' : 'Total Amount'}</th>
                  <th className="py-3.5 px-4">{lang === 'es' ? 'CDR SUNAT' : 'SUNAT CDR'}</th>
                  <th className="py-3.5 px-4">{lang === 'es' ? 'Estado' : 'Status'}</th>
                  <th className="py-3.5 px-4 text-center">{lang === 'es' ? 'Acciones' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[var(--text-secondary)]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw size={24} className="animate-spin text-emerald-500" />
                        <span>{lang === 'es' ? 'Cargando facturas electrónicas...' : 'Loading invoices...'}</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[var(--text-secondary)]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText size={32} className="text-[var(--text-secondary)]/50" />
                        <p className="font-semibold text-sm">
                          {lang === 'es' ? 'No se encontraron facturas registradas' : 'No invoices found'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const order = orderMap.get(inv.orderId);
                    return (
                      <tr key={inv.invoiceId} className="hover:bg-[var(--bg-subtle)]/70 transition-colors">
                        {/* Invoice Number */}
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-500">
                          {inv.invoiceNumber}
                        </td>

                        {/* Order & Client */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[var(--text-primary)]">
                            {order ? order.orderCode : `Orden #${inv.orderId}`}
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)]">
                            {order?.clientId || 'Cliente B2B'}
                          </div>
                        </td>

                        {/* Document Type */}
                        <td className="py-3.5 px-4">
                          <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                            {inv.documentType || 'FACTURA_EXPORTACION'}
                          </span>
                        </td>

                        {/* Issue Date */}
                        <td className="py-3.5 px-4 text-[var(--text-secondary)] whitespace-nowrap">
                          {inv.issueDate ? inv.issueDate.slice(0, 10) : '-'}
                        </td>

                        {/* Total */}
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-500">
                          ${inv.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} {inv.currency || 'USD'}
                        </td>

                        {/* SUNAT CDR */}
                        <td className="py-3.5 px-4">
                          {renderCdrBadge(inv.sunatCdrStatus)}
                        </td>

                        {/* Payment Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {renderInvoiceStatusBadge(inv.status)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {inv.isDeleted === true || inv.status === 'CANCELLED' || inv.status === 'ANULADA' || inv.isActive === false ? (
                              <>
                                <button
                                  onClick={() => handleRestoreInvoice(inv)}
                                  title={lang === 'es' ? 'Restaurar factura a emitidas' : 'Restore invoice'}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
                                >
                                  <RotateCcw size={13} />
                                  <span>{lang === 'es' ? 'Restaurar' : 'Restore'}</span>
                                </button>
                                <button
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: 'invoice',
                                      id: inv.invoiceId || 0,
                                      name: inv.invoiceNumber,
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
                                {/* View CDR Modal */}
                                <button
                                  onClick={() => setSelectedInvoiceForCdr(inv)}
                                  className="p-1.5 rounded-lg border border-[var(--border-subtle)] text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                                  title={lang === 'es' ? 'Ver Constancia CDR SUNAT' : 'View SUNAT CDR'}
                                >
                                  <ShieldCheck size={14} />
                                </button>

                                {/* Edit Invoice */}
                                <button
                                  onClick={() => {
                                    setEditingInvoice(inv);
                                    setIsInvoiceModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg border border-[var(--border-subtle)] text-blue-500 hover:bg-blue-500/10 transition-colors cursor-pointer"
                                  title={lang === 'es' ? 'Editar Factura' : 'Edit Invoice'}
                                >
                                  <Edit2 size={14} />
                                </button>

                                {/* Delete Invoice */}
                                <button
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: 'invoice',
                                      id: inv.invoiceId || 0,
                                      name: inv.invoiceNumber,
                                    })
                                  }
                                  className="p-1.5 rounded-lg border border-[var(--border-subtle)] text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
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

      {/* TAB 2: COBRANZAS & PAGOS BANCARIOS */}
      {activeTab === 'payments' && (
        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-semibold border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="py-3.5 px-4">{lang === 'es' ? 'Nº Operación / Ref' : 'Ref Code'}</th>
                  <th className="py-3.5 px-4">{lang === 'es' ? 'Orden Comercial' : 'Order Ref'}</th>
                  <th className="py-3.5 px-4">{lang === 'es' ? 'Medio de Pago' : 'Payment Method'}</th>
                  <th className="py-3.5 px-4">{lang === 'es' ? 'Fecha Abono' : 'Payment Date'}</th>
                  <th className="py-3.5 px-4 text-right">{lang === 'es' ? 'Monto Percibido' : 'Amount'}</th>
                  <th className="py-3.5 px-4">{lang === 'es' ? 'Observaciones / Banco' : 'Bank Notes'}</th>
                  <th className="py-3.5 px-4 text-center">{lang === 'es' ? 'Acciones' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[var(--text-secondary)]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CreditCard size={32} className="text-[var(--text-secondary)]/50" />
                        <p className="font-semibold text-sm">
                          {lang === 'es' ? 'No se encontraron pagos registrados' : 'No payments found'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    const order = orderMap.get(p.orderId);
                    return (
                      <tr key={p.paymentId} className="hover:bg-[var(--bg-subtle)]/70 transition-colors">
                        {/* Reference code */}
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-500">
                          {p.referenceCode || `TXN-${p.paymentId}`}
                        </td>

                        {/* Order Code */}
                        <td className="py-3.5 px-4 font-mono text-violet-400 font-semibold">
                          {order ? order.orderCode : `ID #${p.orderId}`}
                        </td>

                        {/* Method */}
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            {p.paymentMethod || 'WIRE_TRANSFER'}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-[var(--text-secondary)] whitespace-nowrap">
                          {p.paymentDate ? p.paymentDate.slice(0, 10) : '-'}
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 text-right font-black text-emerald-500">
                          ${p.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                        </td>

                        {/* Notes */}
                        <td className="py-3.5 px-4 text-[var(--text-secondary)] max-w-xs truncate">
                          {p.notes || 'Abono directo en cuenta'}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {p.isDeleted === true || p.isActive === false ? (
                              <>
                                <button
                                  onClick={() => handleRestorePayment(p)}
                                  title={lang === 'es' ? 'Restaurar comprobante de abono' : 'Restore payment'}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
                                >
                                  <RotateCcw size={13} />
                                  <span>{lang === 'es' ? 'Restaurar' : 'Restore'}</span>
                                </button>
                                <button
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: 'payment',
                                      id: p.paymentId || 0,
                                      name: p.referenceCode || `TXN-${p.paymentId}`,
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
                                    setEditingPayment(p);
                                    setIsPaymentModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg border border-[var(--border-subtle)] text-blue-500 hover:bg-blue-500/10 transition-colors cursor-pointer"
                                  title={lang === 'es' ? 'Editar Cobranza' : 'Edit Payment'}
                                >
                                  <Edit2 size={14} />
                                </button>

                                <button
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: 'payment',
                                      id: p.paymentId || 0,
                                      name: p.referenceCode || `TXN-${p.paymentId}`,
                                    })
                                  }
                                  className="p-1.5 rounded-lg border border-[var(--border-subtle)] text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
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

      {/* TAB 3: TARIFARIOS & PRECIOS POR TEMPORADA (MONGODB) */}
      {activeTab === 'pricelists' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPriceLists.length === 0 ? (
              <div className="col-span-full p-12 text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                <Tag size={36} className="mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-sm">
                  {lang === 'es' ? 'No hay tarifarios estacionales registrados' : 'No seasonal price lists found'}
                </p>
                <p className="text-xs mt-1">
                  {lang === 'es'
                    ? 'Crea un nuevo tarifario para fijar precios FOB por producto.'
                    : 'Create a new price list to define FOB product prices.'}
                </p>
              </div>
            ) : (
              filteredPriceLists.map((pl) => (
                <div
                  key={pl.id}
                  className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm hover:border-purple-500/30 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center">
                          <Tag size={16} />
                        </div>
                        <h3 className="font-bold text-sm text-[var(--text-primary)]">
                          {pl.name || 'Tarifario General'}
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-purple-500 font-mono">
                        {pl.currency || 'USD'}
                      </span>
                    </div>

                    <div className="text-xs text-[var(--text-secondary)] space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        <span>
                          {pl.validFrom ? pl.validFrom.slice(0, 10) : '2026-01-01'} ➔{' '}
                          {pl.validUntil ? pl.validUntil.slice(0, 10) : '2026-12-31'}
                        </span>
                      </div>
                    </div>

                    {/* Products preview */}
                    <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5">
                      <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase">
                        {lang === 'es' ? 'Precios de Referencia FOB' : 'Baseline FOB Prices'}
                      </p>
                      {pl.items && pl.items.length > 0 ? (
                        pl.items.map((it, idx) => {
                          const prod = products.find((p) => (p.id || p.code) === it.productId);
                          return (
                            <div key={idx} className="flex justify-between text-xs py-0.5">
                              <span className="text-[var(--text-primary)] font-medium">
                                {prod ? prod.name : it.productId}
                              </span>
                              <span className="font-bold text-emerald-500">
                                ${it.price?.toFixed(2)} / kg
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-[var(--text-secondary)] italic">
                          {lang === 'es' ? 'Sin productos configurados' : 'No configured items'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border-subtle)] mt-4">
                    {pl.isDeleted === true || pl.isActive === false ? (
                      <>
                        <button
                          onClick={() => handleRestorePriceList(pl)}
                          title={lang === 'es' ? 'Restaurar tarifario' : 'Restore price list'}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          <RotateCcw size={13} />
                          <span>{lang === 'es' ? 'Restaurar' : 'Restore'}</span>
                        </button>
                        <button
                          onClick={() =>
                            setDeleteTarget({
                              type: 'pricelist',
                              id: pl.id || '',
                              name: pl.name || 'Tarifario',
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
                            setEditingPriceList(pl);
                            setIsPriceListModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg border border-[var(--border-subtle)] text-blue-500 hover:bg-blue-500/10 transition-colors cursor-pointer"
                          title={lang === 'es' ? 'Editar Tarifario' : 'Edit Price List'}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteTarget({
                              type: 'pricelist',
                              id: pl.id || '',
                              name: pl.name || 'Tarifario',
                            })
                          }
                          className="p-1.5 rounded-lg border border-[var(--border-subtle)] text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title={lang === 'es' ? 'Mover a papelera' : 'Move to trash'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: INVOICE */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        invoice={editingInvoice}
        existingInvoices={invoices}
        orders={orders}
        isLoading={isSubmitting}
        lang={lang}
        onSave={handleSaveInvoice}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setEditingInvoice(null);
        }}
      />

      {/* MODAL: PAYMENT */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        payment={editingPayment}
        existingPayments={payments}
        orders={orders}
        isLoading={isSubmitting}
        lang={lang}
        onSave={handleSavePayment}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setEditingPayment(null);
        }}
      />

      {/* MODAL: PRICE LIST */}
      <PriceListModal
        isOpen={isPriceListModalOpen}
        priceList={editingPriceList}
        products={products}
        isLoading={isSubmitting}
        lang={lang}
        onSave={handleSavePriceList}
        onClose={() => {
          setIsPriceListModalOpen(false);
          setEditingPriceList(null);
        }}
      />

      {/* MODAL: SUNAT CDR */}
      <SunatCdrModal
        isOpen={Boolean(selectedInvoiceForCdr)}
        invoice={selectedInvoiceForCdr}
        order={selectedInvoiceForCdr ? orderMap.get(selectedInvoiceForCdr.orderId) || null : null}
        lang={lang}
        onClose={() => setSelectedInvoiceForCdr(null)}
      />

      {/* MODAL: DELETE CONFIRMATION */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={
          deleteTarget?.type === 'invoice'
            ? lang === 'es'
              ? filterTrash === 'trash'
                ? '¿Eliminar Factura Definitivamente?'
                : '¿Mover Factura a la Papelera?'
              : filterTrash === 'trash'
              ? 'Permanently Delete Invoice?'
              : 'Move Invoice to Trash?'
            : deleteTarget?.type === 'payment'
            ? lang === 'es'
              ? filterTrash === 'trash'
                ? '¿Eliminar Abono Definitivamente?'
                : '¿Mover Pago a la Papelera?'
              : filterTrash === 'trash'
              ? 'Permanently Delete Payment?'
              : 'Move Payment to Trash?'
            : lang === 'es'
            ? filterTrash === 'trash'
              ? '¿Eliminar Tarifario Definitivamente?'
              : '¿Mover Tarifario a la Papelera?'
            : filterTrash === 'trash'
            ? 'Permanently Delete Price Agreement?'
            : 'Move Price Agreement to Trash?'
        }
        message={
          deleteTarget?.type === 'invoice'
            ? lang === 'es'
              ? filterTrash === 'trash'
                ? 'Esta acción destruirá permanentemente este comprobante tributario en la base de datos SQL Server.'
                : 'La factura se marcará como anulada y se moverá a la papelera. Podrás restaurarla en cualquier momento.'
              : filterTrash === 'trash'
              ? 'This will permanently destroy the invoice from SQL Server.'
              : 'The invoice will be cancelled and moved to trash. You can restore it anytime.'
            : deleteTarget?.type === 'payment'
            ? lang === 'es'
              ? filterTrash === 'trash'
                ? 'Esta acción eliminará definitivamente el comprobante bancario de SQL Server.'
                : 'El registro de pago se moverá a la papelera. Podrás restaurarlo en cualquier momento.'
              : filterTrash === 'trash'
              ? 'This will permanently remove the payment record from SQL Server.'
              : 'The payment will be moved to trash and can be restored anytime.'
            : lang === 'es'
            ? filterTrash === 'trash'
              ? 'Esta acción eliminará definitivamente el tarifario estacional de MongoDB.'
              : 'El tarifario se moverá a la papelera y podrá ser restaurado.'
            : filterTrash === 'trash'
            ? 'This will permanently delete the price agreement from MongoDB.'
            : 'The price agreement will be moved to trash and can be restored anytime.'
        }
        itemName={deleteTarget?.name || ''}
        isLoading={isSubmitting}
        isSoftDelete={filterTrash !== 'trash'}
        lang={lang}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
