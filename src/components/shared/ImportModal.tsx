// =============================================================================
// MODAL: IMPORTACIÓN MASIVA DE DATOS — VISONS S.A.C.
// Carga de archivos Excel (.xlsx) y CSV (.csv) con validación, plantilla y reporte
// =============================================================================

import React, { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  Loader2,
  Trash2,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { importModuleData, type ImportableModule, type ImportResponse } from '../../api/importApi';
import { notifyOperationUpdate } from '../../services/notificationService';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: ImportableModule;
  lang: 'es' | 'en';
  onSuccess: () => void;
}

interface ModuleConfig {
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  notificationModule: 'PRODUCTOS' | 'CLIENTES' | 'LOTES' | 'EMBARQUES' | 'FINANZAS' | 'USUARIOS';
  headers: string[];
  sampleCsv: string;
}

const MODULE_CONFIGS: Record<ImportableModule, ModuleConfig> = {
  products: {
    titleEs: 'Importar Catálogo de Productos',
    titleEn: 'Import Product Catalog',
    descriptionEs: 'Carga masiva de variedades de uva, calibres, partidas arancelarias y especificaciones.',
    descriptionEn: 'Bulk import grape varieties, calibers, HS codes and export packaging units.',
    notificationModule: 'PRODUCTOS',
    headers: ['ID', 'Código', 'Nombre', 'Categoría', 'Variedad', 'Calibre', 'Unidad Medida', 'Partida Arancelaria', 'Activo'],
    sampleCsv: 'ID,Código,Nombre,Categoría,Variedad,Calibre,Unidad Medida,Partida Arancelaria,Activo\nPROD-001,PRD-RED-01,Uva Red Globe,UVAS,Red Globe,XL,CAJA_8.2KG,0806100000,SÍ\nPROD-002,PRD-AUT-02,Uva Autumn Crisp,UVAS,Autumn Crisp,JUMBO,CAJA_8.2KG,0806100000,SÍ',
  },
  providers: {
    titleEs: 'Importar Red de Proveedores Agrícolas',
    titleEn: 'Import Agricultural Supplier Network',
    descriptionEs: 'Carga masiva de productores de campo, números de RUC, contactos y certificaciones.',
    descriptionEn: 'Bulk import field grape growers, tax IDs, contact details and GlobalG.A.P. credentials.',
    notificationModule: 'PRODUCTOS',
    headers: ['ID', 'Tipo Documento', 'Documento', 'Razón Social', 'Contacto', 'País', 'Email', 'Teléfono', 'Ubigeo', 'Certificación'],
    sampleCsv: 'ID,Tipo Documento,Documento,Razón Social,Contacto,País,Email,Teléfono,Ubigeo,Certificación\nPROV-001,RUC,20601234567,Agrícola Santa María S.A.C.,Carlos Mendoza,Perú,contacto@santamaria.pe,+51956123456,110101,GLOBAL_GAP_CERTIFIED\nPROV-002,RUC,20509876543,Campos del Sur E.I.R.L.,Lucía Torres,Perú,gerencia@camposdelsur.pe,+51956789012,110102,SENASA_VIGENTE',
  },
  clients: {
    titleEs: 'Importar Directorio de Clientes B2B',
    titleEn: 'Import B2B Client Directory',
    descriptionEs: 'Carga masiva de importadores internacionales, identificaciones fiscales, incoterms y divisas.',
    descriptionEn: 'Bulk import international buyers, foreign tax IDs, preferred Incoterms and currencies.',
    notificationModule: 'CLIENTES',
    headers: ['ID', 'Tipo Documento', 'Documento', 'Razón Social', 'Contacto', 'País', 'Email', 'Teléfono', 'Incoterm', 'Moneda'],
    sampleCsv: 'ID,Tipo Documento,Documento,Razón Social,Contacto,País,Email,Teléfono,Incoterm,Moneda\nCLI-001,TAX_ID,US-987654321,Global Fresh Imports LLC,John Miller,United States,orders@globalfresh.com,+13055550199,FOB,USD\nCLI-002,VAT,NL-123456789,Rotterdam Fruit Logistics B.V.,Hans De Jong,Netherlands,sales@rotterdamfruit.nl,+31105550122,CIF,EUR',
  },
  orders: {
    titleEs: 'Importar Contratos & Órdenes de Exportación',
    titleEn: 'Import Export Orders & Contracts',
    descriptionEs: 'Carga masiva de contratos comerciales, puertos de destino y acuerdos de despacho.',
    descriptionEn: 'Bulk import export orders, destination ports, Incoterms and shipping deadlines.',
    notificationModule: 'EMBARQUES',
    headers: ['ID', 'Código Orden', 'ID Cliente', 'Fecha Orden', 'Incoterm', 'Moneda', 'Términos Pago', 'Puerto Destino', 'Fecha Estimada Embarque', 'Estado'],
    sampleCsv: 'ID,Código Orden,ID Cliente,Fecha Orden,Incoterm,Moneda,Términos Pago,Puerto Destino,Fecha Estimada Embarque,Estado\n1,ORD-2026-001,CLI-001,2026-10-15,FOB,USD,CAD_90_DAYS,Rotterdam,2026-11-01,CONFIRMED\n2,ORD-2026-002,CLI-002,2026-10-16,CIF,EUR,LC_AT_SIGHT,Philadelphia,2026-11-05,CONFIRMED',
  },
  users: {
    titleEs: 'Importar Usuarios & Operadores del Sistema',
    titleEn: 'Import System Users & Operators',
    descriptionEs: 'Carga masiva de credenciales y roles (ADMIN, OPERATOR, QUALITY_AUDITOR, WORKER).',
    descriptionEn: 'Bulk import user accounts, departments, security roles and contact profiles.',
    notificationModule: 'USUARIOS',
    headers: ['ID', 'Usuario', 'Nombre Completo', 'Email', 'Teléfono', 'Rol', 'Departamento', 'Estado', 'Último Acceso'],
    sampleCsv: 'ID,Usuario,Nombre Completo,Email,Teléfono,Rol,Departamento,Estado,Último Acceso\nU-001,jorge.supervisor,Jorge Supervisor,jorge@visons.com,+51999888111,OPERATOR,Empaque & Frío,ACTIVO,\nU-002,maria.auditora,María Calidad,maria@visons.com,+51999888222,QUALITY_AUDITOR,Control de Calidad,ACTIVO,',
  },
};

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  module,
  lang,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const config = MODULE_CONFIGS[module];

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isValid) {
      toast.error(
        lang === 'es'
          ? 'Formato no compatible. Sube un archivo Excel (.xlsx, .xls) o CSV (.csv)'
          : 'Unsupported format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file'
      );
      return;
    }

    setSelectedFile(file);
    setImportResult(null);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([config.sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `plantilla_${module}_visons.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success(
      lang === 'es' ? 'Plantilla CSV descargada' : 'CSV template downloaded'
    );
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error(
        lang === 'es' ? 'Selecciona un archivo antes de continuar' : 'Select a file before submitting'
      );
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading(
      lang === 'es'
        ? `Importando datos de ${selectedFile.name}...`
        : `Importing data from ${selectedFile.name}...`
    );

    try {
      const res = await importModuleData(module, selectedFile);
      setImportResult(res.data);

      if (res.data.success) {
        toast.success(
          lang === 'es'
            ? `¡Importación completada! ${res.data.totalImported} registros importados.`
            : `Import completed! ${res.data.totalImported} records imported.`,
          { id: toastId }
        );

        notifyOperationUpdate({
          module: config.notificationModule,
          actionType: 'CREACIÓN',
          entityName: `Importación Masiva (${selectedFile.name})`,
          details: `Se procesaron exitosamente ${res.data.totalImported} registros desde el archivo ${selectedFile.name}.`,
          link: window.location.pathname,
        });

        onSuccess();
      } else {
        toast.error(res.data.message || 'Error en la importación', { id: toastId });
      }
    } catch (err: unknown) {
      console.error('Error importing file:', err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        (lang === 'es' ? 'Error al procesar la importación' : 'Error processing import file');
      toast.error(msg, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Upload size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                {lang === 'es' ? config.titleEs : config.titleEn}
              </h2>
              <p className="text-xs text-[var(--text-hint)] mt-0.5">
                {lang === 'es' ? config.descriptionEs : config.descriptionEn}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-hint)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Plantilla y Guía de Columnas */}
          <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Info size={18} className="text-blue-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">
                  {lang === 'es' ? '¿Primera vez importando?' : 'First time importing?'}
                </p>
                <p className="text-[11px] text-[var(--text-hint)] mt-0.5">
                  {lang === 'es'
                    ? 'Descarga la plantilla oficial con encabezados y datos de ejemplo.'
                    : 'Download the sample template with expected headers and sample rows.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] text-xs font-semibold text-[var(--text-primary)] transition-all shadow-sm cursor-pointer shrink-0"
            >
              <Download size={13} className="text-emerald-500" />
              <span>{lang === 'es' ? 'Plantilla CSV' : 'CSV Template'}</span>
            </button>
          </div>

          {/* Zona de Arrastre y Soltado (Dropzone) */}
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-[var(--border-subtle)] hover:border-emerald-500/50 hover:bg-[var(--surface-subtle)]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <Upload size={26} />
              </div>

              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">
                  {lang === 'es'
                    ? 'Arrastra y suelta tu archivo aquí, o haz clic para examinar'
                    : 'Drag & drop your file here, or click to browse'}
                </p>
                <p className="text-[11px] text-[var(--text-hint)] mt-1">
                  {lang === 'es'
                    ? 'Soporta Microsoft Excel (.xlsx, .xls) y Archivos CSV (.csv) hasta 25MB'
                    : 'Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) up to 25MB'}
                </p>
              </div>
            </div>
          ) : (
            /* Archivo Seleccionado */
            <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  {selectedFile.name.endsWith('.csv') ? (
                    <FileText size={20} />
                  ) : (
                    <FileSpreadsheet size={20} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-[var(--text-hint)]">
                    {(selectedFile.size / 1024).toFixed(1)} KB •{' '}
                    {selectedFile.name.split('.').pop()?.toUpperCase()}
                  </p>
                </div>
              </div>

              {!isUploading && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1.5 rounded-lg text-[var(--text-hint)] hover:text-rose-500 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                  title={lang === 'es' ? 'Quitar archivo' : 'Remove file'}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          )}

          {/* Columnas Esperadas */}
          <div>
            <span className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1.5">
              {lang === 'es' ? 'Estructura de Columnas Requerida:' : 'Required Column Structure:'}
            </span>
            <div className="flex flex-wrap gap-1">
              {config.headers.map((h, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-secondary)]"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>

          {/* Resultado de la Importación */}
          {importResult && (
            <div
              className={`p-4 rounded-xl border ${
                importResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-rose-500/10 border-rose-500/30'
              } space-y-2.5`}
            >
              <div className="flex items-center gap-2">
                {importResult.success ? (
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle size={18} className="text-rose-500 shrink-0" />
                )}
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  {importResult.message}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-hint)] block">Total Procesados</span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {importResult.totalProcessed}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-hint)] block">Total Importados</span>
                  <span className="font-bold text-emerald-500">
                    {importResult.totalImported}
                  </span>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-2 text-[11px] text-rose-500 space-y-1">
                  <span className="font-bold block">Observaciones:</span>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {importResult.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)] transition-colors cursor-pointer"
          >
            {lang === 'es' ? 'Cerrar' : 'Close'}
          </button>

          <button
            type="button"
            disabled={!selectedFile || isUploading}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>{lang === 'es' ? 'Procesando archivo...' : 'Processing file...'}</span>
              </>
            ) : (
              <>
                <Upload size={14} />
                <span>{lang === 'es' ? 'Comenzar Importación' : 'Start Import'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
