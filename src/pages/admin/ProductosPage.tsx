// =============================================================================
// PANEL 2: PRODUCTOS & PROVEEDORES — VISONS S.A.C. ADMIN DASHBOARD
// Gestión CRUD completa, Validación en formularios, Alarmas de Duplicidad,
// Exportación a Excel/PDF/CSV y sincronización en tiempo real con MongoDB
// =============================================================================

import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Package,
  Building,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Edit2,
  Trash2,
  Copy,
  Check,
  FileSpreadsheet,
  FileText,
  FileCode,
  ShieldCheck,
  Boxes,
  MapPin,
  Mail,
  Phone,
  CreditCard,
  ChevronDown,
  RotateCcw,
  Archive,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

import type { Product } from '../../types/product';
import type { Provider } from '../../types/provider';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  exportProductsExcel,
  exportProductsPdf,
  exportProductsCsv,
} from '../../api/productApi';
import {
  getProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  exportProvidersExcel,
  exportProvidersPdf,
  exportProvidersCsv,
} from '../../api/providerApi';

import { ProductModal } from '../../components/products/ProductModal';
import { ProviderModal } from '../../components/products/ProviderModal';
import { DeleteConfirmModal } from '../../components/products/DeleteConfirmModal';
import { StatusFilterTabs, type FilterTrashStatus } from '../../components/shared/StatusFilterTabs';
import { ImportModal } from '../../components/shared/ImportModal';
import { notifyOperationUpdate } from '../../services/notificationService';

type OutletCtx = { lang: 'es' | 'en' };

export default function ProductosPage() {
  const { lang } = useOutletContext<OutletCtx>();

  // Active Tab: 'products' | 'providers'
  const [activeTab, setActiveTab] = useState<'products' | 'providers'>('products');

  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTrash, setFilterTrash] = useState<FilterTrashStatus>('active');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [certificationFilter, setCertificationFilter] = useState<string>('ALL');

  // Dropdown States
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Modals State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    type: 'product' | 'provider';
    id: string;
    name: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    type: 'product',
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

  // Fetch live data from backend
  const fetchData = async (showToast = false) => {
    setIsRefreshing(true);
    try {
      const [prodRes, provRes] = await Promise.all([
        getProducts(),
        getProviders(),
      ]);
      setProducts(prodRes.data || []);
      setProviders(provRes.data || []);
      if (showToast) {
        toast.success(
          lang === 'es'
            ? 'Datos actualizados desde el backend'
            : 'Data synchronized from backend'
        );
      }
    } catch (err) {
      console.error('Error fetching products/providers:', err);
      toast.error(
        lang === 'es'
          ? 'Error al conectar con los servicios de backend'
          : 'Failed to connect to backend services'
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
    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.isActive !== false).length;
    const uniqueVarieties = new Set(products.map((p) => p.variety).filter(Boolean)).size;

    const totalProviders = providers.length;
    const certifiedProviders = providers.filter(
      (p) =>
        p.certificationStatus &&
        p.certificationStatus !== 'NO_CERTIFICADO' &&
        p.certificationStatus !== 'EN_TRAMITE'
    ).length;

    return {
      totalProducts,
      activeProducts,
      uniqueVarieties,
      totalProviders,
      certifiedProviders,
    };
  }, [products, providers]);

  // Trash Counts
  const productTrashCounts = useMemo(() => {
    const active = products.filter((p) => p.isActive !== false && p.isDeleted !== true).length;
    const trash = products.filter((p) => p.isActive === false || p.isDeleted === true).length;
    return { active, trash, all: products.length };
  }, [products]);

  const providerTrashCounts = useMemo(() => {
    const active = providers.filter((p) => p.isActive !== false && p.isDeleted !== true).length;
    const trash = providers.filter((p) => p.isActive === false || p.isDeleted === true).length;
    return { active, trash, all: providers.length };
  }, [providers]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchesSearch =
        !searchTerm.trim() ||
        (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.variety && item.variety.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.hsCode && item.hsCode.toLowerCase().includes(searchTerm.toLowerCase()));

      const isItemDeleted = item.isActive === false || item.isDeleted === true;
      const matchesTrash =
        filterTrash === 'all' ||
        (filterTrash === 'active' && !isItemDeleted) ||
        (filterTrash === 'trash' && isItemDeleted);

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && item.isActive !== false) ||
        (statusFilter === 'INACTIVE' && item.isActive === false);

      const matchesCategory =
        categoryFilter === 'ALL' || item.categoryId === categoryFilter;

      return matchesSearch && matchesTrash && matchesStatus && matchesCategory;
    });
  }, [products, searchTerm, filterTrash, statusFilter, categoryFilter]);

  // Filtered Providers
  const filteredProviders = useMemo(() => {
    return providers.filter((item) => {
      const matchesSearch =
        !searchTerm.trim() ||
        (item.companyName && item.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.documentNumber && item.documentNumber.includes(searchTerm)) ||
        (item.contactName && item.contactName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.address && item.address.toLowerCase().includes(searchTerm.toLowerCase()));

      const isItemDeleted = item.isActive === false || item.isDeleted === true;
      const matchesTrash =
        filterTrash === 'all' ||
        (filterTrash === 'active' && !isItemDeleted) ||
        (filterTrash === 'trash' && isItemDeleted);

      const matchesCert =
        certificationFilter === 'ALL' || item.certificationStatus === certificationFilter;

      return matchesSearch && matchesTrash && matchesCert;
    });
  }, [providers, searchTerm, filterTrash, certificationFilter]);

  // --- CRUD Operations: PRODUCT ---
  const handleSaveProduct = async (productData: Partial<Product>) => {
    if (editingProduct?.id) {
      const res = await updateProduct(editingProduct.id, productData);
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? { ...p, ...res.data } : p))
      );
      toast.success(
        lang === 'es' ? 'Producto actualizado exitosamente' : 'Product updated successfully'
      );
      notifyOperationUpdate({
        module: 'PRODUCTOS',
        actionType: 'ACTUALIZACIÓN',
        entityName: editingProduct.name,
        details: `Actualización de ficha técnica del producto "${editingProduct.name}". Variedad: ${productData.variety || editingProduct.variety || 'N/A'}.`,
        link: '/productos',
      });
    } else {
      const res = await createProduct(productData as Omit<Product, 'id'>);
      setProducts((prev) => [res.data, ...prev]);
      toast.success(
        lang === 'es' ? 'Producto registrado en el catálogo' : 'Product registered in catalog'
      );
      notifyOperationUpdate({
        module: 'PRODUCTOS',
        actionType: 'CREACIÓN',
        entityName: res.data.name || 'Nuevo Producto',
        details: `Nuevo producto agrícola "${res.data.name}" registrado en el catálogo maestro.`,
        link: '/productos',
      });
    }
  };

  const handleToggleProductStatus = async (product: Product) => {
    if (!product.id) return;
    const newStatus = !(product.isActive ?? true);
    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, isActive: newStatus } : p))
    );

    try {
      await updateProduct(product.id, { ...product, isActive: newStatus });
      toast.success(
        newStatus
          ? lang === 'es'
            ? `Producto "${product.name}" activado`
            : `Product "${product.name}" activated`
          : lang === 'es'
          ? `Producto "${product.name}" desactivado`
          : `Product "${product.name}" deactivated`
      );
      notifyOperationUpdate({
        module: 'PRODUCTOS',
        actionType: 'CAMBIO DE ESTADO',
        entityName: product.name,
        details: `El estado del producto "${product.name}" cambió a ${newStatus ? 'ACTIVO' : 'INACTIVO'}.`,
        link: '/productos',
      });
    } catch (err) {
      console.error('Error toggling status:', err);
      // Rollback
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: !newStatus } : p))
      );
      toast.error(lang === 'es' ? 'Error al cambiar estado' : 'Failed to toggle status');
    }
  };

  // RESTAURAR PRODUCTO
  const handleRestoreProduct = async (product: Product) => {
    if (!product.id) return;
    try {
      await updateProduct(product.id, { ...product, isActive: true, isDeleted: false });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: true, isDeleted: false } : p))
      );
      toast.success(
        lang === 'es'
          ? `Producto "${product.name}" restaurado con éxito al catálogo activo`
          : `Product "${product.name}" restored to active catalog`
      );
      notifyOperationUpdate({
        module: 'PRODUCTOS',
        actionType: 'RESTAURACIÓN',
        entityName: product.name,
        details: `El producto "${product.name}" ha sido restaurado exitosamente desde la papelera al catálogo activo.`,
        link: '/productos',
      });
    } catch (err) {
      console.error('Error restoring product:', err);
      toast.error(lang === 'es' ? 'Error al restaurar producto' : 'Failed to restore product');
    }
  };

  const handleDeleteProductConfirm = async () => {
    setDeleteModalState((p) => ({ ...p, isLoading: true }));
    try {
      if (filterTrash === 'trash') {
        // Purga definitiva
        await deleteProduct(deleteModalState.id);
        setProducts((prev) => prev.filter((p) => p.id !== deleteModalState.id));
        toast.success(
          lang === 'es'
            ? `Producto "${deleteModalState.name}" eliminado definitivamente`
            : `Product "${deleteModalState.name}" permanently deleted`
        );
        notifyOperationUpdate({
          module: 'PRODUCTOS',
          actionType: 'PAPELERA',
          entityName: deleteModalState.name,
          details: `El producto "${deleteModalState.name}" fue purgado permanentemente de la base de datos.`,
          link: '/productos',
        });
      } else {
        // Eliminación lógica (Mover a Papelera)
        const target = products.find((p) => p.id === deleteModalState.id);
        await updateProduct(deleteModalState.id, { ...target, isActive: false, isDeleted: true });
        setProducts((prev) =>
          prev.map((p) => (p.id === deleteModalState.id ? { ...p, isActive: false, isDeleted: true } : p))
        );
        toast.success(
          lang === 'es'
            ? `Producto "${deleteModalState.name}" enviado a la papelera (eliminado lógicamente)`
            : `Product "${deleteModalState.name}" moved to trash (soft deleted)`
        );
        notifyOperationUpdate({
          module: 'PRODUCTOS',
          actionType: 'PAPELERA',
          entityName: deleteModalState.name,
          details: `El producto "${deleteModalState.name}" fue movido a la papelera lógica (anulado).`,
          link: '/productos',
        });
      }
      setDeleteModalState((p) => ({ ...p, isOpen: false }));
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error(
        lang === 'es' ? 'Error al eliminar producto' : 'Failed to delete product'
      );
    } finally {
      setDeleteModalState((p) => ({ ...p, isLoading: false }));
    }
  };

  // --- CRUD Operations: PROVIDER ---
  const handleSaveProvider = async (providerData: Partial<Provider>) => {
    if (editingProvider?.id) {
      const res = await updateProvider(editingProvider.id, providerData);
      setProviders((prev) =>
        prev.map((p) => (p.id === editingProvider.id ? { ...p, ...res.data } : p))
      );
      toast.success(
        lang === 'es' ? 'Proveedor actualizado con éxito' : 'Supplier updated successfully'
      );
      notifyOperationUpdate({
        module: 'PRODUCTOS',
        actionType: 'ACTUALIZACIÓN',
        entityName: editingProvider.companyName,
        details: `Actualización de información del proveedor "${editingProvider.companyName}". Documento: ${providerData.documentNumber || editingProvider.documentNumber}.`,
        link: '/productos',
      });
    } else {
      const res = await createProvider(providerData as Omit<Provider, 'id'>);
      setProviders((prev) => [res.data, ...prev]);
      toast.success(
        lang === 'es' ? 'Proveedor registrado en la red agrícola' : 'Supplier registered successfully'
      );
      notifyOperationUpdate({
        module: 'PRODUCTOS',
        actionType: 'CREACIÓN',
        entityName: res.data.companyName,
        details: `Nuevo proveedor agrícola registrado: "${res.data.companyName}" (${res.data.documentType}: ${res.data.documentNumber}).`,
        link: '/productos',
      });
    }
  };

  // RESTAURAR PROVEEDOR
  const handleRestoreProvider = async (provider: Provider) => {
    if (!provider.id) return;
    try {
      await updateProvider(provider.id, { ...provider, isActive: true, isDeleted: false });
      setProviders((prev) =>
        prev.map((p) => (p.id === provider.id ? { ...p, isActive: true, isDeleted: false } : p))
      );
      toast.success(
        lang === 'es'
          ? `Proveedor "${provider.companyName}" restaurado con éxito a la red activa`
          : `Supplier "${provider.companyName}" restored to active network`
      );
      notifyOperationUpdate({
        module: 'PRODUCTOS',
        actionType: 'RESTAURACIÓN',
        entityName: provider.companyName,
        details: `El proveedor "${provider.companyName}" fue restaurado con éxito a la red activa.`,
        link: '/productos',
      });
    } catch (err) {
      console.error('Error restoring provider:', err);
      toast.error(lang === 'es' ? 'Error al restaurar proveedor' : 'Failed to restore supplier');
    }
  };

  const handleDeleteProviderConfirm = async () => {
    setDeleteModalState((p) => ({ ...p, isLoading: true }));
    try {
      if (filterTrash === 'trash') {
        // Purga definitiva
        await deleteProvider(deleteModalState.id);
        setProviders((prev) => prev.filter((p) => p.id !== deleteModalState.id));
        toast.success(
          lang === 'es'
            ? `Proveedor "${deleteModalState.name}" eliminado definitivamente`
            : `Supplier "${deleteModalState.name}" permanently deleted`
        );
        notifyOperationUpdate({
          module: 'PRODUCTOS',
          actionType: 'PAPELERA',
          entityName: deleteModalState.name,
          details: `Proveedor "${deleteModalState.name}" purgado permanentemente.`,
          link: '/productos',
        });
      } else {
        // Eliminación lógica (Mover a Papelera)
        const target = providers.find((p) => p.id === deleteModalState.id);
        await updateProvider(deleteModalState.id, { ...target, isActive: false, isDeleted: true });
        setProviders((prev) =>
          prev.map((p) => (p.id === deleteModalState.id ? { ...p, isActive: false, isDeleted: true } : p))
        );
        toast.success(
          lang === 'es'
            ? `Proveedor "${deleteModalState.name}" enviado a la papelera (eliminado lógicamente)`
            : `Supplier "${deleteModalState.name}" moved to trash (soft deleted)`
        );
        notifyOperationUpdate({
          module: 'PRODUCTOS',
          actionType: 'PAPELERA',
          entityName: deleteModalState.name,
          details: `Proveedor "${deleteModalState.name}" trasladado a la papelera lógica.`,
          link: '/productos',
        });
      }
      setDeleteModalState((p) => ({ ...p, isOpen: false }));
    } catch (err) {
      console.error('Error deleting provider:', err);
      toast.error(
        lang === 'es' ? 'Error al eliminar proveedor' : 'Failed to delete supplier'
      );
    } finally {
      setDeleteModalState((p) => ({ ...p, isLoading: false }));
    }
  };

  // --- Export Handlers ---
  const handleExport = async (format: 'excel' | 'pdf' | 'csv') => {
    setIsExportMenuOpen(false);
    const toastId = toast.loading(
      lang === 'es' ? `Generando archivo ${format.toUpperCase()}...` : `Generating ${format.toUpperCase()}...`
    );

    try {
      if (activeTab === 'products') {
        if (format === 'excel') await exportProductsExcel();
        if (format === 'pdf') await exportProductsPdf();
        if (format === 'csv') await exportProductsCsv();
      } else {
        if (format === 'excel') await exportProvidersExcel();
        if (format === 'pdf') await exportProvidersPdf();
        if (format === 'csv') await exportProvidersCsv();
      }
      toast.success(
        lang === 'es' ? 'Descarga completada' : 'Download completed',
        { id: toastId }
      );
    } catch (err) {
      console.error('Export error:', err);
      toast.error(
        lang === 'es' ? 'Error al generar reporte de exportación' : 'Failed to export report',
        { id: toastId }
      );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ── Top Header & Tab Switcher ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
              {lang === 'es' ? 'Productos & Proveedores' : 'Products & Suppliers'}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {lang === 'es' ? 'MongoDB En Línea' : 'MongoDB Live'}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {lang === 'es'
              ? 'Catálogo comercial de agroexportación y red homologada de fundos agrícolas'
              : 'Agroexport commercial catalog and certified agricultural grower network'}
          </p>
        </div>

        {/* Tab Selector & Main Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tab Switcher Pills */}
          <div className="p-1 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center shadow-sm">
            <button
              onClick={() => {
                setActiveTab('products');
                setSearchTerm('');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Package size={15} />
              <span>{lang === 'es' ? 'Catálogo Productos' : 'Product Catalog'}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'products'
                    ? 'bg-zinc-950/20 text-zinc-950'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                }`}
              >
                {metrics.totalProducts}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('providers');
                setSearchTerm('');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'providers'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Building size={15} />
              <span>{lang === 'es' ? 'Red de Proveedores' : 'Supplier Network'}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'providers'
                    ? 'bg-zinc-950/20 text-zinc-950'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                }`}
              >
                {metrics.totalProviders}
              </span>
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
                  {lang === 'es' ? 'Formato de Descarga' : 'Download Format'}
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
            title={lang === 'es' ? 'Importar desde Excel o CSV' : 'Import from Excel or CSV'}
          >
            <Upload size={15} className="text-emerald-500" />
            <span>{lang === 'es' ? 'Importar' : 'Import'}</span>
          </button>

          {/* New Item CTA Button */}
          {activeTab === 'products' ? (
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>{lang === 'es' ? 'Nuevo Producto' : 'New Product'}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingProvider(null);
                setIsProviderModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>{lang === 'es' ? 'Nuevo Proveedor' : 'New Supplier'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Metric Cards Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {lang === 'es' ? 'Total en Catálogo' : 'Total in Catalog'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Package size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">
            {metrics.totalProducts}
          </div>
          <span className="text-[11px] text-amber-500 font-medium">
            {metrics.activeProducts} {lang === 'es' ? 'habilitados para exportación' : 'enabled for export'}
          </span>
        </div>

        {/* KPI 2 */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {lang === 'es' ? 'Variedades de Fruta' : 'Fruit Varieties'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Boxes size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">
            {metrics.uniqueVarieties}
          </div>
          <span className="text-[11px] text-[var(--text-hint)]">
            {lang === 'es' ? 'Hass, Kent, Biloxi, Uvas' : 'Hass, Kent, Biloxi, Grapes'}
          </span>
        </div>

        {/* KPI 3 */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {lang === 'es' ? 'Proveedores / Fundos' : 'Growers / Farms'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Building size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">
            {metrics.totalProviders}
          </div>
          <span className="text-[11px] text-emerald-500 font-medium">
            {lang === 'es' ? 'Directorio activo en Perú' : 'Active Peruvian directory'}
          </span>
        </div>

        {/* KPI 4 */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {lang === 'es' ? 'Certificados GLOBAL GAP' : 'GLOBAL GAP Certified'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">
            {metrics.certifiedProviders}
          </div>
          <span className="text-[11px] text-blue-500 font-medium">
            {lang === 'es' ? 'Aprobados para EE.UU. & UE' : 'Approved for USA & EU'}
          </span>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'products'
                ? lang === 'es'
                  ? 'Buscar por código, nombre, variedad...'
                  : 'Search by code, name, variety...'
                : lang === 'es'
                ? 'Buscar por RUC, razón social, contacto...'
                : 'Search by RUC, company name, contact...'
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
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

        {/* Tab-specific Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {activeTab === 'products' ? (
            <>
              {/* Category Filter */}
              <div className="flex items-center gap-1.5">
                <Filter size={14} className="text-[var(--text-secondary)]" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-xs focus:outline-none"
                >
                  <option value="ALL">{lang === 'es' ? 'Todas las categorías' : 'All categories'}</option>
                  <option value="PALTAS">{lang === 'es' ? 'Paltas' : 'Avocados'}</option>
                  <option value="MANGOS">{lang === 'es' ? 'Mangos' : 'Mangoes'}</option>
                  <option value="ARANDANOS">{lang === 'es' ? 'Arándanos' : 'Blueberries'}</option>
                  <option value="UVAS">{lang === 'es' ? 'Uvas' : 'Grapes'}</option>
                  <option value="CITRICOS">{lang === 'es' ? 'Cítricos' : 'Citrus'}</option>
                </select>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
                className="px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-xs focus:outline-none"
              >
                <option value="ALL">{lang === 'es' ? 'Todos los estados' : 'All statuses'}</option>
                <option value="ACTIVE">{lang === 'es' ? 'Solo Activos' : 'Active only'}</option>
                <option value="INACTIVE">{lang === 'es' ? 'Solo Inactivos' : 'Inactive only'}</option>
              </select>
            </>
          ) : (
            <>
              {/* Certification Filter */}
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[var(--text-secondary)]" />
                <select
                  value={certificationFilter}
                  onChange={(e) => setCertificationFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-xs focus:outline-none"
                >
                  <option value="ALL">{lang === 'es' ? 'Todas las certificaciones' : 'All certifications'}</option>
                  <option value="GLOBAL_GAP">GLOBAL G.A.P.</option>
                  <option value="SENASA_VIGENTE">SENASA Oficial</option>
                  <option value="ORGANIC_USDA">USDA / EU Organic</option>
                  <option value="SMETA">SMETA / Sedex</option>
                  <option value="BRCGS">BRCGS Food Safety</option>
                  <option value="EN_TRAMITE">{lang === 'es' ? 'En Trámite' : 'In Process'}</option>
                </select>
              </div>
            </>
          )}

          {/* Status Trash Tabs */}
          <StatusFilterTabs
            current={filterTrash}
            onChange={setFilterTrash}
            counts={activeTab === 'products' ? productTrashCounts : providerTrashCounts}
            lang={lang}
          />

          {/* Result Count Indicator */}
          <span className="text-xs text-[var(--text-hint)] pl-2 border-l border-[var(--border-subtle)]">
            {activeTab === 'products' ? filteredProducts.length : filteredProviders.length}{' '}
            {lang === 'es' ? 'registros' : 'records'}
          </span>
        </div>
      </div>

      {/* ── Informative Banner when in Trash ── */}
      {filterTrash === 'trash' && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fadeIn">
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400 font-semibold">
            <Archive size={18} className="shrink-0" />
            <span>
              {lang === 'es'
                ? `Estás visualizando la papelera de ${activeTab === 'products' ? 'productos' : 'proveedores'} (eliminados lógicamente). Haz clic en "Restaurar" para reactivarlos inmediatamente en el catálogo.`
                : `Viewing trash for ${activeTab === 'products' ? 'products' : 'suppliers'} (soft deleted). Click "Restore" to reactivate any record immediately.`}
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
            <RefreshCw size={28} className="animate-spin mx-auto text-emerald-500" />
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              {lang === 'es'
                ? 'Cargando datos desde MongoDB...'
                : 'Loading records from MongoDB...'}
            </p>
          </div>
        ) : activeTab === 'products' ? (
          /* ============================================================ */
          /* TAB 1: PRODUCT CATALOG TABLE                                  */
          /* ============================================================ */
          filteredProducts.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                <Package size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  {lang === 'es' ? 'No se encontraron productos' : 'No products found'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                  {searchTerm
                    ? lang === 'es'
                      ? 'No hay productos que coincidan con los criterios de búsqueda.'
                      : 'No products match your search criteria.'
                    : lang === 'es'
                    ? 'Aún no has registrado productos en el catálogo de exportación.'
                    : 'No products registered in the export catalog yet.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>{lang === 'es' ? 'Registrar Primer Producto' : 'Register First Product'}</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 text-[var(--text-secondary)] font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Código' : 'Code'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Producto & Categoría' : 'Product & Category'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Variedad & Calibre' : 'Variety & Caliber'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Presentación' : 'Packing Unit'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Partida Arancelaria' : 'HS Tariff Code'}</th>
                    <th className="py-3.5 px-4 text-center">{lang === 'es' ? 'Estado' : 'Status'}</th>
                    <th className="py-3.5 px-4 text-right">{lang === 'es' ? 'Acciones' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredProducts.map((prod) => (
                    <tr
                      key={prod.id}
                      className="hover:bg-[var(--bg-subtle)]/30 transition-colors group"
                    >
                      {/* Code with copy button */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-amber-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{prod.code || 'SIN_CODIGO'}</span>
                          {prod.code && (
                            <button
                              onClick={() => copyToClipboard(prod.code || '', `code-${prod.id}`)}
                              title={lang === 'es' ? 'Copiar código' : 'Copy code'}
                              className="text-[var(--text-hint)] hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              {copiedId === `code-${prod.id}` ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Name & Category */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[var(--text-primary)] text-sm">
                          {prod.name}
                        </div>
                        {prod.categoryId && (
                          <span className="inline-block px-2 py-0.5 mt-1 rounded-md text-[10px] font-semibold bg-zinc-500/10 text-[var(--text-secondary)] border border-zinc-500/20">
                            {prod.categoryId}
                          </span>
                        )}
                      </td>

                      {/* Variety & Caliber */}
                      <td className="py-3.5 px-4">
                        <div className="text-[var(--text-primary)] font-medium">
                          {prod.variety || '—'}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)]">
                          {prod.caliber || 'Estándar'}
                        </div>
                      </td>

                      {/* Presentation */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-1 rounded-lg text-[10px] font-mono font-semibold bg-[var(--bg-app)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                          {prod.unitMeasure || 'CAJA_4KG'}
                        </span>
                      </td>

                      {/* HS Code */}
                      <td className="py-3.5 px-4 font-mono text-xs text-[var(--text-secondary)]">
                        {prod.hsCode || '—'}
                      </td>

                      {/* Status Column */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {prod.isActive === false || prod.isDeleted === true ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 border border-rose-500/25 text-rose-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>{lang === 'es' ? 'Eliminado Lógicamente' : 'Soft Deleted'}</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleProductStatus(prod)}
                            title={lang === 'es' ? 'Click para desactivar' : 'Click to deactivate'}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{lang === 'es' ? 'Activo' : 'Active'}</span>
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {prod.isActive === false || prod.isDeleted === true ? (
                            <>
                              <button
                                onClick={() => handleRestoreProduct(prod)}
                                title={lang === 'es' ? 'Restaurar al catálogo activo' : 'Restore to active catalog'}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
                              >
                                <RotateCcw size={13} />
                                <span>{lang === 'es' ? 'Restaurar' : 'Restore'}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteModalState({
                                    isOpen: true,
                                    type: 'product',
                                    id: prod.id || '',
                                    name: prod.name,
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
                                  setEditingProduct(prod);
                                  setIsProductModalOpen(true);
                                }}
                                title={lang === 'es' ? 'Editar producto' : 'Edit product'}
                                className="w-8 h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-secondary)] hover:text-amber-500 hover:border-amber-500/40 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteModalState({
                                    isOpen: true,
                                    type: 'product',
                                    id: prod.id || '',
                                    name: prod.name,
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
          /* TAB 2: AGRICULTURAL SUPPLIERS TABLE                          */
          /* ============================================================ */
          filteredProviders.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <Building size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  {lang === 'es' ? 'No se encontraron proveedores' : 'No suppliers found'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                  {searchTerm
                    ? lang === 'es'
                      ? 'No hay proveedores que coincidan con la búsqueda.'
                      : 'No suppliers match your search query.'
                    : lang === 'es'
                    ? 'Aún no se han registrado fundos o agricultores en el directorio.'
                    : 'No farms or growers registered in the directory yet.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingProvider(null);
                  setIsProviderModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>{lang === 'es' ? 'Registrar Primer Proveedor' : 'Register First Supplier'}</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 text-[var(--text-secondary)] font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Documento / RUC' : 'Document / RUC'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Razón Social / Fundo' : 'Company / Farm Name'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Ubicación & Ubigeo' : 'Location & Ubigeo'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Contacto' : 'Contact'}</th>
                    <th className="py-3.5 px-4">{lang === 'es' ? 'Cuenta CCI' : 'Bank CCI'}</th>
                    <th className="py-3.5 px-4 text-center">{lang === 'es' ? 'Certificación' : 'Certification'}</th>
                    <th className="py-3.5 px-4 text-right">{lang === 'es' ? 'Acciones' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredProviders.map((prov) => (
                    <tr
                      key={prov.id}
                      className="hover:bg-[var(--bg-subtle)]/30 transition-colors group"
                    >
                      {/* Document Type & Number with Copy */}
                      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-app)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-bold">
                            {prov.documentType || 'RUC'}
                          </span>
                          <span className="font-bold text-[var(--text-primary)]">
                            {prov.documentNumber || '—'}
                          </span>
                          {prov.documentNumber && (
                            <button
                              onClick={() => copyToClipboard(prov.documentNumber, `doc-${prov.id}`)}
                              title={lang === 'es' ? 'Copiar documento' : 'Copy document'}
                              className="text-[var(--text-hint)] hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              {copiedId === `doc-${prov.id}` ? (
                                <Check size={12} className="text-emerald-500" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Company Name & Legal Rep */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[var(--text-primary)] text-sm">
                          {prov.companyName || '—'}
                        </div>
                        {prov.contactName && (
                          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 flex items-center gap-1">
                            <span className="text-[var(--text-hint)]">{lang === 'es' ? 'Contacto:' : 'Contact:'}</span>
                            <span>{prov.contactName}</span>
                          </div>
                        )}
                      </td>

                      {/* Location & Ubigeo */}
                      <td className="py-3.5 px-4">
                        <div className="text-[var(--text-primary)] flex items-center gap-1">
                          <MapPin size={12} className="text-emerald-500 shrink-0" />
                          <span>{prov.address || prov.country || 'Perú'}</span>
                        </div>
                        {prov.ubigeo && (
                          <span className="inline-block mt-1 font-mono text-[10px] text-[var(--text-secondary)] bg-[var(--bg-app)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">
                            UBIGEO {prov.ubigeo}
                          </span>
                        )}
                      </td>

                      {/* Contact Details */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {prov.email && (
                          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                            <Mail size={11} className="text-[var(--text-hint)]" />
                            <span>{prov.email}</span>
                          </div>
                        )}
                        {prov.phone && (
                          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] mt-0.5">
                            <Phone size={11} className="text-[var(--text-hint)]" />
                            <span>{prov.phone}</span>
                          </div>
                        )}
                        {!prov.email && !prov.phone && <span className="text-[var(--text-hint)]">—</span>}
                      </td>

                      {/* Bank CCI with copy */}
                      <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                        {prov.bankAccountCci ? (
                          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                            <CreditCard size={12} className="text-emerald-500" />
                            <span>{prov.bankAccountCci}</span>
                            <button
                              onClick={() => copyToClipboard(prov.bankAccountCci || '', `cci-${prov.id}`)}
                              title="Copiar CCI"
                              className="text-[var(--text-hint)] hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              {copiedId === `cci-${prov.id}` ? (
                                <Check size={12} className="text-emerald-500" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[var(--text-hint)]">—</span>
                        )}
                      </td>

                      {/* Certification Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            prov.certificationStatus === 'GLOBAL_GAP'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                              : prov.certificationStatus === 'SENASA_VIGENTE'
                              ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                              : prov.certificationStatus === 'ORGANIC_USDA'
                              ? 'bg-green-500/10 text-green-500 border-green-500/30'
                              : prov.certificationStatus === 'EN_TRAMITE'
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                              : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                          }`}
                        >
                          <ShieldCheck size={12} />
                          <span>{prov.certificationStatus || 'NO_CERTIFICADO'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {prov.isActive === false || prov.isDeleted === true ? (
                            <>
                              <button
                                onClick={() => handleRestoreProvider(prov)}
                                title={lang === 'es' ? 'Restaurar a la red activa' : 'Restore to active network'}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
                              >
                                <RotateCcw size={13} />
                                <span>{lang === 'es' ? 'Restaurar' : 'Restore'}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteModalState({
                                    isOpen: true,
                                    type: 'provider',
                                    id: prov.id || '',
                                    name: prov.companyName,
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
                                  setEditingProvider(prov);
                                  setIsProviderModalOpen(true);
                                }}
                                title={lang === 'es' ? 'Editar proveedor' : 'Edit supplier'}
                                className="w-8 h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-secondary)] hover:text-emerald-500 hover:border-emerald-500/40 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteModalState({
                                    isOpen: true,
                                    type: 'provider',
                                    id: prov.id || '',
                                    name: prov.companyName,
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
        )}
      </div>

      {/* ── Product Create / Edit Modal ── */}
      <ProductModal
        isOpen={isProductModalOpen}
        product={editingProduct}
        existingCodes={products.map((p) => p.code).filter(Boolean) as string[]}
        lang={lang}
        onClose={() => setIsProductModalOpen(false)}
        onSubmit={handleSaveProduct}
      />

      {/* ── Provider Create / Edit Modal ── */}
      <ProviderModal
        isOpen={isProviderModalOpen}
        provider={editingProvider}
        existingDocumentNumbers={providers.map((p) => p.documentNumber).filter(Boolean)}
        lang={lang}
        onClose={() => setIsProviderModalOpen(false)}
        onSubmit={handleSaveProvider}
      />

      {/* ── Delete Confirmation Modal ── */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        isSoftDelete={filterTrash !== 'trash'}
        title={
          filterTrash === 'trash'
            ? deleteModalState.type === 'product'
              ? lang === 'es'
                ? '¿Eliminar Producto Definitivamente?'
                : 'Permanently Delete Product?'
              : lang === 'es'
              ? '¿Eliminar Proveedor Definitivamente?'
              : 'Permanently Delete Supplier?'
            : deleteModalState.type === 'product'
            ? lang === 'es'
              ? '¿Mover Producto a la Papelera?'
              : 'Move Product to Trash?'
            : lang === 'es'
            ? '¿Mover Proveedor a la Papelera?'
            : 'Move Supplier to Trash?'
        }
        message={
          filterTrash === 'trash'
            ? lang === 'es'
              ? 'Esta acción purgará el registro de la base de datos de manera irreversible.'
              : 'This action will permanently purge the record from the database.'
            : lang === 'es'
            ? 'El registro será desactivado y pasará a la papelera. Podrás restaurarlo en cualquier momento sin perder sus datos.'
            : 'The record will be deactivated and moved to trash. You can restore it anytime without data loss.'
        }
        itemName={deleteModalState.name}
        isLoading={deleteModalState.isLoading}
        lang={lang}
        onConfirm={
          deleteModalState.type === 'product'
            ? handleDeleteProductConfirm
            : handleDeleteProviderConfirm
        }
        onCancel={() => setDeleteModalState((p) => ({ ...p, isOpen: false }))}
      />

      {/* ── Modal de Importación Masiva (Excel / CSV) ── */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        module={activeTab === 'products' ? 'products' : 'providers'}
        lang={lang}
        onSuccess={() => fetchData(true)}
      />
    </div>
  );
}
