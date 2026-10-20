// =============================================================================
// CLIENT B2B DASHBOARD — VISONS S.A.C.
// =============================================================================
// Portal y Dashboard exclusivo para el Cliente B2B Internacional (Importador).
// Aislamiento total de datos (RBAC), multi-moneda (USD/EUR), bilingüe (ES/EN)
// y 5 módulos operativos: Live Tracking, Catálogo & RFQ, Cadena de Frío IoT,
// Centro de Documentación Aduanera (Doc Hub) y Facturación SWIFT.
// =============================================================================

import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ship,
  Package,
  Snowflake,
  FileText,
  DollarSign,
  Download,
  RefreshCw,
  Plus,
  Send,
  UploadCloud,
  Check,
  Copy,
  Building2,
  Anchor,
  Compass,
  FileCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import type { ClientTabId } from '../../components/layout/ClientSidebar';

interface ClientOutletContext {
  lang: 'es' | 'en';
  currency: 'USD' | 'EUR';
  setCurrency: (c: 'USD' | 'EUR') => void;
  activeTab: ClientTabId;
  onSelectTab: (tab: ClientTabId) => void;
}

// ── MODELOS DE DATOS B2B DEL CLIENTE ──────────────────────────────────────────

interface OceanShipment {
  id: string;
  bookingNumber: string;
  blNumber: string;
  vesselName: string;
  voyage: string;
  shippingLine: string;
  containerNumber: string;
  containerType: string;
  originPort: string;
  destinationPort: string;
  departureDate: string;
  estimatedArrival: string;
  currentLocation: string;
  coordinates: string;
  speedKnots: number;
  journeyProgressPercent: number;
  cropName: string;
  variety: string;
  palletsCount: number;
  boxesCount: number;
  netWeightKg: number;
  currentTempC: number;
  targetTempRange: string;
  currentHumidity: number;
  status: 'CONFIRMED' | 'PACKING' | 'PORT_CALLAO' | 'IN_TRANSIT' | 'ARRIVED';
  stageIndex: number; // 0 a 4
}

interface ExportCatalogItem {
  id: string;
  name: string;
  nameEn: string;
  variety: string;
  varietyEn: string;
  category: 'PALTAS' | 'ARANDANOS' | 'MANGOS' | 'UVAS' | 'ESPARRAGOS';
  categoryLabel: string;
  fobPriceUsdPerKg: number;
  cifPriceUsdPerKg: number;
  calibers: string;
  dryMatterOrBrix: string;
  packaging: string;
  packagingEn: string;
  certifications: string[];
  season: string;
  seasonEn: string;
  imageEmoji: string;
  bgGradient: string;
  shelfLife: string;
}

interface ColdChainLogPoint {
  time: string;
  temp: number;
  humidity: number;
  oxygen: number;
  co2: number;
  status: 'NORMAL' | 'ALERT';
}

interface ClientDocument {
  id: string;
  title: string;
  titleEn: string;
  type: 'BL' | 'SENASA' | 'INVOICE' | 'PACKING_LIST' | 'ORIGIN' | 'LAB_TEST';
  code: string;
  containerNumber: string;
  issueDate: string;
  fileFormat: string;
  fileSizeBytes: string;
  status: 'VALIDATED' | 'PENDING' | 'EXPEDITION';
  authority: string;
}

interface ClientInvoice {
  id: string;
  invoiceNumber: string;
  orderCode: string;
  containerNumber: string;
  issueDate: string;
  dueDate: string;
  amountUsd: number;
  amountEur: number;
  paidUsd: number;
  terms: string;
  termsEn: string;
  status: 'PAGADA' | 'PENDIENTE' | 'PARCIAL' | 'EN_VERIFICACION';
}

// ── DATOS INICIALES REALISTAS (VISONS S.A.C. ➔ CLIENTE B2B) ────────────────────

const INITIAL_SHIPMENTS: OceanShipment[] = [
  {
    id: 'SHP-2026-081',
    bookingNumber: 'HLCU-LIM-89420',
    blNumber: 'HLCUPE202688192',
    vesselName: 'CMA CGM JACQUES SAADE',
    voyage: '402N',
    shippingLine: 'Hapag-Lloyd / CMA CGM',
    containerNumber: 'MSKU-982142-3',
    containerType: "40' High Cube Reefer (Atmósfera Controlada)",
    originPort: 'Callao, Perú (PECLO)',
    destinationPort: 'Rotterdam, Países Bajos (NLRTM)',
    departureDate: '2026-10-12',
    estimatedArrival: '2026-10-28',
    currentLocation: 'Océano Atlántico Central (Rumbo a Canal de la Mancha)',
    coordinates: "14°28'32\"N, 48°12'09\"W",
    speedKnots: 19.4,
    journeyProgressPercent: 68,
    cropName: 'Palta Hass Orgánica',
    variety: 'Hass Exportación Grado 1',
    palletsCount: 20,
    boxesCount: 5280,
    netWeightKg: 21120,
    currentTempC: 4.8,
    targetTempRange: '4.5°C - 5.5°C',
    currentHumidity: 88.5,
    status: 'IN_TRANSIT',
    stageIndex: 3,
  },
  {
    id: 'SHP-2026-085',
    bookingNumber: 'MSK-CALL-49120',
    blNumber: 'MSKPE202690412',
    vesselName: 'MAERSK MC-KINNEY MOLLER',
    voyage: '261S',
    shippingLine: 'Maersk Line',
    containerNumber: 'HLCU-482019-1',
    containerType: "40' High Cube Reefer (Daikin Active Cold)",
    originPort: 'Callao, Perú (PECLO)',
    destinationPort: 'Long Beach, CA, EE.UU. (USLGB)',
    departureDate: '2026-10-18',
    estimatedArrival: '2026-11-04',
    currentLocation: 'Océano Pacífico (Costas de América Central)',
    coordinates: "11°14'50\"N, 89°32'15\"W",
    speedKnots: 18.2,
    journeyProgressPercent: 32,
    cropName: 'Arándano Biloxi Fresco',
    variety: 'Biloxi Jumbo Superb',
    palletsCount: 20,
    boxesCount: 9600,
    netWeightKg: 14400,
    currentTempC: 1.2,
    targetTempRange: '0.8°C - 1.5°C',
    currentHumidity: 91.0,
    status: 'IN_TRANSIT',
    stageIndex: 3,
  },
];

const CATALOG_ITEMS: ExportCatalogItem[] = [
  {
    id: 'CAT-HASS-01',
    name: 'Palta Hass de Exportación',
    nameEn: 'Peruvian Fresh Hass Avocado',
    variety: 'Hass Orgánica & Convencional',
    varietyEn: 'Organic & Conventional Hass',
    category: 'PALTAS',
    categoryLabel: 'Paltas / Avocados',
    fobPriceUsdPerKg: 3.20,
    cifPriceUsdPerKg: 3.85,
    calibers: '12, 14, 16, 18, 20, 22, 24',
    dryMatterOrBrix: 'Materia Seca: 23% – 26%',
    packaging: 'Caja cartón corrugado 4.0 Kg y 10.0 Kg (264 cajas/pallet)',
    packagingEn: '4.0 Kg & 10.0 Kg corrugated box (264 boxes/pallet)',
    certifications: ['GlobalG.A.P.', 'SMETA 4-Pillar', 'USDA Organic', 'BRCGS'],
    season: 'Marzo – Octubre (Campaña Activa)',
    seasonEn: 'March – October (Peak Season)',
    imageEmoji: '🥑',
    bgGradient: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    shelfLife: '30 días en atmósfera controlada',
  },
  {
    id: 'CAT-BLUE-02',
    name: 'Arándano Fresco Premium',
    nameEn: 'Peruvian Fresh Blueberries',
    variety: 'Biloxi, Ventura & Sekoya Pop',
    varietyEn: 'Biloxi, Ventura & Sekoya Pop',
    category: 'ARANDANOS',
    categoryLabel: 'Arándanos / Berries',
    fobPriceUsdPerKg: 6.40,
    cifPriceUsdPerKg: 7.20,
    calibers: 'Jumbo (>18mm) y Super Jumbo (>20mm)',
    dryMatterOrBrix: 'Brix: 12.5° – 14.5° (Alta firmeza)',
    packaging: 'Clamshells 125g x 12 u. o Punnets 500g (1,200 kg/pallet)',
    packagingEn: 'Clamshells 125g x 12 or 500g punnets (1,200 kg/pallet)',
    certifications: ['GlobalG.A.P.', 'SPRING Water', 'BRCGS Food Safety', 'FDA Compliant'],
    season: 'Julio – Marzo (Alta Disponibilidad)',
    seasonEn: 'July – March (Peak Harvest)',
    imageEmoji: '🫐',
    bgGradient: 'from-blue-500/15 via-blue-500/5 to-transparent',
    shelfLife: '35 días con control de etileno',
  },
  {
    id: 'CAT-MANG-03',
    name: 'Mango Kent de Exportación',
    nameEn: 'Peruvian Kent Fresh Mango',
    variety: 'Kent Premium (Sin Fibra)',
    varietyEn: 'Kent Premium (Fiberless)',
    category: 'MANGOS',
    categoryLabel: 'Mangos',
    fobPriceUsdPerKg: 2.80,
    cifPriceUsdPerKg: 3.45,
    calibers: '6, 7, 8, 9, 10, 12',
    dryMatterOrBrix: 'Brix: 14.0° – 17.0° (Dulzor superior)',
    packaging: 'Caja telescópica 4.0 Kg (240 cajas/pallet - Tratamiento hidrotérmico)',
    packagingEn: '4.0 Kg carton (240 boxes/pallet - Hydrothermal hot water treated)',
    certifications: ['GlobalG.A.P.', 'USDA-APHIS Certified', 'SMETA', 'HACCP'],
    season: 'Noviembre – Marzo',
    seasonEn: 'November – March',
    imageEmoji: '🥭',
    bgGradient: 'from-amber-500/15 via-amber-500/5 to-transparent',
    shelfLife: '24 días en frío 10°C - 12°C',
  },
  {
    id: 'CAT-GRAP-04',
    name: 'Uva de Mesa Red Globe & Sweet Globe',
    nameEn: 'Table Grapes (Red & Sweet Globe)',
    variety: 'Red Globe & Sweet Globe (Sin semilla)',
    varietyEn: 'Red Globe & Sweet Globe (Seedless)',
    category: 'UVAS',
    categoryLabel: 'Uvas / Grapes',
    fobPriceUsdPerKg: 2.90,
    cifPriceUsdPerKg: 3.60,
    calibers: '24mm – 28mm (Bayas crocantes)',
    dryMatterOrBrix: 'Brix: 16.5° – 19.0°',
    packaging: 'Caja plástica/cartón 8.2 Kg con generador de SO2 (114 cajas/pallet)',
    packagingEn: '8.2 Kg box with SO2 pad generator (114 boxes/pallet)',
    certifications: ['GlobalG.A.P.', 'Tesco Nurture', 'BRCGS'],
    season: 'Octubre – Febrero',
    seasonEn: 'October – February',
    imageEmoji: '🍇',
    bgGradient: 'from-purple-500/15 via-purple-500/5 to-transparent',
    shelfLife: '45 días a -0.5°C a 0°C',
  },
  {
    id: 'CAT-ASPA-05',
    name: 'Espárrago Verde Fresco',
    nameEn: 'Fresh Green Asparagus',
    variety: 'UC-157 / Mary Washington',
    varietyEn: 'UC-157 / Mary Washington',
    category: 'ESPARRAGOS',
    categoryLabel: 'Espárragos / Asparagus',
    fobPriceUsdPerKg: 4.10,
    cifPriceUsdPerKg: 4.85,
    calibers: 'Standard, Large y Jumbo (Longitud 22 cm)',
    dryMatterOrBrix: 'Puntas cerradas, firmeza óptima',
    packaging: 'Caja piramidal de 5.0 Kg con pad absorbente (140 cajas/pallet)',
    packagingEn: '5.0 Kg pyramid crate with moisture pad (140 crates/pallet)',
    certifications: ['GlobalG.A.P.', 'Fair Trade', 'FDA Compliant'],
    season: 'Todo el Año (All Year Round)',
    seasonEn: 'All Year Round',
    imageEmoji: '🌱',
    bgGradient: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    shelfLife: '21 días a 2°C - 4°C',
  },
];

const INITIAL_COLD_LOGS: ColdChainLogPoint[] = [
  { time: '10/20 08:00', temp: 4.8, humidity: 88.5, oxygen: 4.9, co2: 4.1, status: 'NORMAL' },
  { time: '10/20 04:00', temp: 4.9, humidity: 88.2, oxygen: 5.0, co2: 4.0, status: 'NORMAL' },
  { time: '10/20 00:00', temp: 4.7, humidity: 88.7, oxygen: 4.9, co2: 4.2, status: 'NORMAL' },
  { time: '10/19 20:00', temp: 4.8, humidity: 88.6, oxygen: 5.1, co2: 4.0, status: 'NORMAL' },
  { time: '10/19 16:00', temp: 5.0, humidity: 88.0, oxygen: 5.0, co2: 4.1, status: 'NORMAL' },
  { time: '10/19 12:00', temp: 4.8, humidity: 88.4, oxygen: 4.8, co2: 4.3, status: 'NORMAL' },
  { time: '10/19 08:00', temp: 4.7, humidity: 88.9, oxygen: 4.9, co2: 4.2, status: 'NORMAL' },
  { time: '10/19 04:00', temp: 4.9, humidity: 88.3, oxygen: 5.0, co2: 4.1, status: 'NORMAL' },
];

const INITIAL_DOCUMENTS: ClientDocument[] = [
  {
    id: 'DOC-001',
    title: 'Bill of Lading Original (Telex Release)',
    titleEn: 'Original Bill of Lading (Telex Released)',
    type: 'BL',
    code: 'BL-HLCUPE202688192',
    containerNumber: 'MSKU-982142-3',
    issueDate: '2026-10-12',
    fileFormat: 'PDF Oficial',
    fileSizeBytes: '1.4 MB',
    status: 'VALIDATED',
    authority: 'Hapag-Lloyd Maritime AG',
  },
  {
    id: 'DOC-002',
    title: 'Certificado Fitosanitario Oficial de Exportación',
    titleEn: 'SENASA Official Phytosanitary Certificate',
    type: 'SENASA',
    code: 'SENASA-PE-2026-90412',
    containerNumber: 'MSKU-982142-3',
    issueDate: '2026-10-11',
    fileFormat: 'PDF Certificado Digital',
    fileSizeBytes: '980 KB',
    status: 'VALIDATED',
    authority: 'SENASA Perú (Ministerio de Agricultura)',
  },
  {
    id: 'DOC-003',
    title: 'Factura Comercial de Exportación (Commercial Invoice)',
    titleEn: 'Export Commercial Invoice',
    type: 'INVOICE',
    code: 'EXP-2026-0089',
    containerNumber: 'MSKU-982142-3',
    issueDate: '2026-10-12',
    fileFormat: 'PDF / XML SUNAT',
    fileSizeBytes: '640 KB',
    status: 'VALIDATED',
    authority: 'VISONS S.A.C. / SUNAT Aduanas',
  },
  {
    id: 'DOC-004',
    title: 'Packing List Certificado por Pallets',
    titleEn: 'Certified Pallet-by-Pallet Packing List',
    type: 'PACKING_LIST',
    code: 'PKL-2026-0089',
    containerNumber: 'MSKU-982142-3',
    issueDate: '2026-10-11',
    fileFormat: 'PDF / Excel',
    fileSizeBytes: '420 KB',
    status: 'VALIDATED',
    authority: 'Planta de Empaque Visons Chao',
  },
  {
    id: 'DOC-005',
    title: 'Certificado de Origen (Tratado TLC / EUR.1)',
    titleEn: 'Certificate of Origin (FTA / EUR.1)',
    type: 'ORIGIN',
    code: 'COO-PE-UE-2026-4412',
    containerNumber: 'MSKU-982142-3',
    issueDate: '2026-10-12',
    fileFormat: 'PDF Sellado',
    fileSizeBytes: '820 KB',
    status: 'VALIDATED',
    authority: 'Cámara de Comercio de Lima / Mincetur',
  },
  {
    id: 'DOC-006',
    title: 'Análisis de Residuos de Plaguicidas (MRL Eurofins)',
    titleEn: 'Pesticide Residue Analysis Report (Eurofins)',
    type: 'LAB_TEST',
    code: 'LAB-EUR-PE-90214',
    containerNumber: 'MSKU-982142-3',
    issueDate: '2026-10-10',
    fileFormat: 'PDF Certificado',
    fileSizeBytes: '1.8 MB',
    status: 'VALIDATED',
    authority: 'Eurofins Agroscience Services',
  },
];

const INITIAL_INVOICES: ClientInvoice[] = [
  {
    id: 'INV-001',
    invoiceNumber: 'EXP-2026-0089',
    orderCode: 'PO-GF-2026-101',
    containerNumber: 'MSKU-982142-3',
    issueDate: '2026-10-12',
    dueDate: '2026-10-27',
    amountUsd: 81312.00,
    amountEur: 74807.04,
    paidUsd: 40656.00,
    terms: '50% anticipo confirmado, 50% contra copia BL',
    termsEn: '50% advance confirmed, 50% against BL copy',
    status: 'PARCIAL',
  },
  {
    id: 'INV-002',
    invoiceNumber: 'EXP-2026-0085',
    orderCode: 'PO-GF-2026-098',
    containerNumber: 'HLCU-482019-1',
    issueDate: '2026-10-17',
    dueDate: '2026-11-01',
    amountUsd: 103680.00,
    amountEur: 95385.60,
    paidUsd: 0,
    terms: 'Carta de Crédito irrevocable / Transferencia 15 días',
    termsEn: 'Irrevocable LC / 15-day Wire Transfer',
    status: 'PENDIENTE',
  },
  {
    id: 'INV-003',
    invoiceNumber: 'EXP-2026-0072',
    orderCode: 'PO-GF-2026-084',
    containerNumber: 'CMAU-209148-7',
    issueDate: '2026-09-20',
    dueDate: '2026-10-05',
    amountUsd: 67200.00,
    amountEur: 61824.00,
    paidUsd: 67200.00,
    terms: '100% Pagada a la entrega',
    termsEn: '100% Paid upon port clearance',
    status: 'PAGADA',
  },
];

export default function ClientDashboard() {
  const { user } = useAuth();
  const { lang, currency, activeTab, onSelectTab } = useOutletContext<ClientOutletContext>();

  // Estados locales reactivos
  const [shipments] = useState<OceanShipment[]>(INITIAL_SHIPMENTS);
  const [selectedShipment, setSelectedShipment] = useState<OceanShipment>(INITIAL_SHIPMENTS[0]);
  const [selectedIncoterm, setSelectedIncoterm] = useState<'FOB' | 'CIF'>('CIF');
  const [catalogFilter, setCatalogFilter] = useState<string>('ALL');
  const [invoices, setInvoices] = useState<ClientInvoice[]>(INITIAL_INVOICES);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modales
  const [rfqModalOpen, setRfqModalOpen] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<ExportCatalogItem | null>(null);
  const [rfqQuantityPallets, setRfqQuantityPallets] = useState<number>(20);
  const [rfqDestinationPort, setRfqDestinationPort] = useState<string>('Port of Rotterdam, Netherlands');
  const [rfqTargetDate, setRfqTargetDate] = useState<string>('2026-11-20');
  const [rfqNotes, setRfqNotes] = useState<string>('');

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<ClientInvoice | null>(null);
  const [swiftReference, setSwiftReference] = useState<string>('');
  const [swiftAmount, setSwiftAmount] = useState<string>('');
  const [paymentProofAttached, setPaymentProofAttached] = useState<boolean>(false);

  // Ratio de conversión de moneda USD a EUR (referencia de mercado internacional)
  const EUR_RATE = 0.92;

  // Formateador de moneda dinámico
  const formatMoney = (amountUsd: number) => {
    if (currency === 'EUR') {
      const eur = amountUsd * EUR_RATE;
      return new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-US', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
      }).format(eur);
    }
    return new Intl.NumberFormat(lang === 'es' ? 'es-PE' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amountUsd);
  };

  // Manejador de refresco simulado
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success(
        lang === 'es' ? 'Datos B2B actualizados' : 'B2B Portal Refreshed',
        {
          description:
            lang === 'es'
              ? 'Telemetría satelital y tracking de contenedores sincronizados.'
              : 'Satellite telemetry and shipment data successfully synchronized.',
        }
      );
    }, 600);
  };

  // Copiar al portapapeles con feedback
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.info(lang === 'es' ? 'Copiado al portapapeles' : 'Copied to clipboard', {
      description: `${label}: ${text}`,
    });
  };

  // Descarga limpia simulada de documentos
  const handleDownloadDoc = (doc: ClientDocument) => {
    const filename = `${doc.code}_${doc.type}.pdf`;
    const content = `VISONS S.A.C. - OFFICIAL EXPORT DOCUMENTATION\n=========================================\nDocument: ${doc.title}\nReference: ${doc.code}\nClient: ${user?.company?.companyName || 'Global Fresh Imports Inc.'}\nContainer: ${doc.containerNumber}\nAuthority: ${doc.authority}\nDate of Issue: ${doc.issueDate}\nValidation: SENASA / SUNAT / MARITIME CARRIER CERTIFIED\n=========================================\nThis electronic certificate is authentic and verifiable.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(
      lang === 'es' ? 'Documento descargado' : 'Document Downloaded',
      {
        description: `${doc.title} (${doc.code})`,
      }
    );
  };

  // Descarga de paquete completo (Doc Pack)
  const handleDownloadAllDocs = () => {
    const zipName = `DOCPACK_${selectedShipment.containerNumber}_VISONS.zip`;
    toast.success(
      lang === 'es' ? 'Generando Paquete Completo' : 'Generating Complete Doc Pack',
      {
        description: `${zipName} (Bill of Lading, SENASA, Packing List, Invoice, Cert. Origen).`,
      }
    );
  };

  // Enviar solicitud de cotización (RFQ)
  const handleSendRfq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatalogItem) return;

    toast.success(
      lang === 'es' ? 'Solicitud de Cotización Enviada' : 'RFQ Successfully Sent',
      {
        description:
          lang === 'es'
            ? `Tu orden por ${rfqQuantityPallets} pallets de ${selectedCatalogItem.name} (${selectedIncoterm} ${rfqDestinationPort}) ha sido enviada al equipo comercial de Visons.`
            : `Your request for ${rfqQuantityPallets} pallets of ${selectedCatalogItem.nameEn} (${selectedIncoterm} ${rfqDestinationPort}) has been forwarded to Visons commercial desk.`,
      }
    );

    setRfqModalOpen(false);
  };

  // Enviar comprobante de transferencia SWIFT
  const handleSendPaymentProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice || !swiftReference) {
      toast.error(
        lang === 'es' ? 'Datos incompletos' : 'Incomplete form',
        {
          description:
            lang === 'es'
              ? 'Por favor ingresa el número de referencia bancaria o SWIFT.'
              : 'Please provide the wire transfer confirmation / SWIFT reference.',
        }
      );
      return;
    }

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === paymentInvoice.id
          ? { ...inv, status: 'EN_VERIFICACION' }
          : inv
      )
    );

    toast.success(
      lang === 'es' ? 'Comprobante SWIFT Notificado' : 'Wire Transfer Receipt Logged',
      {
        description:
          lang === 'es'
            ? `Referencia ${swiftReference} vinculada a la factura ${paymentInvoice.invoiceNumber}. El departamento financiero de Visons validará los fondos en 24h.`
            : `Reference ${swiftReference} attached to invoice ${paymentInvoice.invoiceNumber}. Treasury desk will verify receipt in 24 hours.`,
      }
    );

    setPaymentModalOpen(false);
    setSwiftReference('');
    setSwiftAmount('');
    setPaymentProofAttached(false);
  };

  // Cálculo de balance financiero
  const totalInvoicedUsd = invoices.reduce((acc, curr) => acc + curr.amountUsd, 0);
  const totalPaidUsd = invoices.reduce((acc, curr) => acc + curr.paidUsd, 0);
  const totalPendingUsd = totalInvoicedUsd - totalPaidUsd;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── BANNER SUPERIOR DE BIENVENIDA B2B ── */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 border border-emerald-500/20 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide">
              <Sparkles size={14} />
              <span>
                {lang === 'es'
                  ? 'Portal B2B de Comercio Exterior • Visons S.A.C.'
                  : 'International B2B Foreign Trade Portal • Visons S.A.C.'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {user?.company?.companyName || 'Global Fresh Imports Inc.'}
            </h1>
            <p className="text-sm text-emerald-100/80 max-w-2xl font-normal leading-relaxed">
              {lang === 'es'
                ? 'Monitorea en tiempo real tus contenedores en altamar, descarga documentos aduaneros SENASA/BL y solicita fruta fresca con trazabilidad certificada.'
                : 'Monitor in real time your ocean reefer containers, download SENASA & BL shipping documents, and request premium Peruvian fresh fruit.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Botón de recarga */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition-all backdrop-blur-md cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{lang === 'es' ? 'Actualizar Datos' : 'Sync Portal'}</span>
            </button>

            {/* Nueva Orden / RFQ Rápido */}
            <button
              onClick={() => {
                setSelectedCatalogItem(CATALOG_ITEMS[0]);
                setRfqModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Plus size={16} />
              <span>{lang === 'es' ? 'Nueva Solicitud RFQ' : 'Request Fruit Quote'}</span>
            </button>
          </div>
        </div>

        {/* Mini barra de estado de cuenta B2B */}
        <div className="relative z-10 mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-[11px] font-semibold text-emerald-200/70 block uppercase tracking-wider">
              {lang === 'es' ? 'Contenedores en Tránsito' : 'Reefers in Ocean Transit'}
            </span>
            <span className="text-lg font-black text-white">
              2 {lang === 'es' ? 'Buques' : 'Vessels'}
            </span>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-emerald-200/70 block uppercase tracking-wider">
              {lang === 'es' ? 'Volumen en Altamar' : 'Total Cargo Volume'}
            </span>
            <span className="text-lg font-black text-white">
              35.5 TM (14,880 {lang === 'es' ? 'Cajas' : 'Boxes'})
            </span>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-emerald-200/70 block uppercase tracking-wider">
              {lang === 'es' ? 'Próximo Arribo (ETA)' : 'Next Port ETA'}
            </span>
            <span className="text-lg font-black text-emerald-300">
              28 Oct 2026 (Rotterdam)
            </span>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-emerald-200/70 block uppercase tracking-wider">
              {lang === 'es' ? 'Doc. Aduanera' : 'Customs Clearance'}
            </span>
            <span className="text-lg font-black text-emerald-400">
              100% {lang === 'es' ? 'Liberada' : 'Released'}
            </span>
          </div>
        </div>
      </div>

      {/* ── SELECTOR DE TABS EN CABECERA ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[var(--border-subtle)]">
        {[
          { id: 'tracking', label: '1. Live Tracking & Altamar', labelEn: '1. Ocean Tracking', icon: <Ship size={16} /> },
          { id: 'catalog', label: '2. Catálogo & Cotizador RFQ', labelEn: '2. Fruit Catalog & RFQ', icon: <Package size={16} /> },
          { id: 'cold-chain', label: '3. Cadena de Frío IoT', labelEn: '3. Cold Chain Telemetry', icon: <Snowflake size={16} /> },
          { id: 'documents', label: '4. Documentos Aduaneros (Doc Hub)', labelEn: '4. Customs & BL Docs', icon: <FileText size={16} /> },
          { id: 'invoices', label: '5. Facturación & SWIFT', labelEn: '5. Invoicing & Statement', icon: <DollarSign size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id as ClientTabId)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
            }`}
          >
            {tab.icon}
            <span>{lang === 'es' ? tab.label : tab.labelEn}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          PANEL 1: LIVE TRACKING & ALTAMAR (OCEAN SHIPMENT TRACKING)
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'tracking' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Selector de Contenedor en Seguimiento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shipments.map((shp) => (
              <div
                key={shp.id}
                onClick={() => setSelectedShipment(shp)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                  selectedShipment.id === shp.id
                    ? 'border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/10'
                    : 'border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="p-3 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                      <Anchor size={20} />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-[var(--text-primary)]">
                          {shp.containerNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                          {shp.shippingLine}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[var(--text-secondary)] mt-0.5">
                        {shp.vesselName} • V.{shp.voyage}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {shp.journeyProgressPercent}% {lang === 'es' ? 'Completado' : 'Traveled'}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--text-hint)] block uppercase">
                      {lang === 'es' ? 'Carga' : 'Cargo'}
                    </span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {shp.cropName} ({shp.palletsCount} Pallets)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-hint)] block uppercase">
                      {lang === 'es' ? 'Destino' : 'Destination'}
                    </span>
                    <span className="font-bold text-[var(--text-primary)] truncate block">
                      {shp.destinationPort}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tarjeta de Travesía Interactiva Detallada */}
          <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {lang === 'es' ? 'Rastreo Satelital Activo' : 'Live Satellite Telemetry'}
                </span>
                <h2 className="text-xl font-black text-[var(--text-primary)] mt-1">
                  {selectedShipment.vesselName} (Voyage {selectedShipment.voyage})
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-2">
                  <Compass size={14} className="text-sky-500" />
                  <span>
                    {lang === 'es' ? 'Posición Actual:' : 'Current Position:'}{' '}
                    <strong>{selectedShipment.currentLocation}</strong> ({selectedShipment.coordinates})
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectTab('cold-chain')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Snowflake size={14} />
                  <span>{lang === 'es' ? 'Ver Sensores de Frío' : 'Cold Chain Data'}</span>
                </button>
                <button
                  onClick={() => onSelectTab('documents')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <FileCheck size={14} />
                  <span>{lang === 'es' ? 'Descargar BL & SENASA' : 'Download B/L'}</span>
                </button>
              </div>
            </div>

            {/* Stepper Visual de 5 Etapas del Embarque Marítimo */}
            <div className="pt-4 pb-2">
              <div className="relative">
                {/* Línea de fondo */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-[var(--surface-hover)] -translate-y-1/2 z-0" />
                {/* Línea de progreso coloreada */}
                <div
                  className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 -translate-y-1/2 z-0 transition-all duration-700"
                  style={{ width: `${selectedShipment.journeyProgressPercent}%` }}
                />

                <div className="relative z-10 grid grid-cols-5 gap-2 text-center">
                  {[
                    { title: lang === 'es' ? '1. Reserva & Booking' : '1. Booking Confirmed', subtitle: 'Hapag-Lloyd Callao' },
                    { title: lang === 'es' ? '2. Packing en Planta' : '2. Chao Packing', subtitle: 'Consolidado Reefer' },
                    { title: lang === 'es' ? '3. SENASA & Callao' : '3. Port of Callao', subtitle: 'Zarpe PECLO' },
                    { title: lang === 'es' ? '4. En Altamar (Tránsito)' : '4. Ocean Transit', subtitle: `${selectedShipment.speedKnots} Nudos` },
                    { title: lang === 'es' ? '5. Arribo a Puerto' : '5. Port Clearance', subtitle: selectedShipment.destinationPort.split(',')[0] },
                  ].map((step, idx) => {
                    const isDone = idx < selectedShipment.stageIndex;
                    const isCurrent = idx === selectedShipment.stageIndex;

                    return (
                      <div key={idx} className="flex flex-col items-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-md ${
                            isDone
                              ? 'bg-emerald-600 text-white'
                              : isCurrent
                              ? 'bg-sky-600 text-white ring-4 ring-sky-500/20 animate-pulse'
                              : 'bg-[var(--surface-card)] text-[var(--text-hint)] border border-[var(--border-subtle)]'
                          }`}
                        >
                          {isDone ? <Check size={16} /> : isCurrent ? <Ship size={16} /> : idx + 1}
                        </div>
                        <span className={`text-xs font-bold mt-2 ${isCurrent ? 'text-sky-600 dark:text-sky-400' : 'text-[var(--text-primary)]'}`}>
                          {step.title}
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)] hidden sm:block">
                          {step.subtitle}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Datos Técnicos de la Navegación */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
              <div>
                <span className="text-[10px] font-bold text-[var(--text-hint)] uppercase">
                  {lang === 'es' ? 'Puerto de Zarpe' : 'Departure Port'}
                </span>
                <p className="text-xs font-extrabold text-[var(--text-primary)] mt-0.5">
                  {selectedShipment.originPort}
                </p>
                <span className="text-[10px] text-[var(--text-secondary)]">{selectedShipment.departureDate}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[var(--text-hint)] uppercase">
                  {lang === 'es' ? 'Puerto de Destino (ETA)' : 'Destination (ETA)'}
                </span>
                <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {selectedShipment.destinationPort}
                </p>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{selectedShipment.estimatedArrival}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[var(--text-hint)] uppercase">
                  {lang === 'es' ? 'Bill of Lading' : 'Master B/L'}
                </span>
                <p className="text-xs font-mono font-bold text-[var(--text-primary)] mt-0.5">
                  {selectedShipment.blNumber}
                </p>
                <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold">Telex Released</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[var(--text-hint)] uppercase">
                  {lang === 'es' ? 'Temp. en Travesía' : 'Transit Temperature'}
                </span>
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {selectedShipment.currentTempC} °C
                </p>
                <span className="text-[10px] text-[var(--text-secondary)]">Set Point: {selectedShipment.targetTempRange}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          PANEL 2: CATÁLOGO DE FRUTAS FRESCAS & COTIZADOR B2B (RFQ STORE)
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'catalog' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Barra de Filtros & Switch Incoterm FOB / CIF */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)]">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-bold text-[var(--text-hint)] uppercase mr-1">
                {lang === 'es' ? 'Fruta:' : 'Crop:'}
              </span>
              {['ALL', 'PALTAS', 'ARANDANOS', 'MANGOS', 'UVAS', 'ESPARRAGOS'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCatalogFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    catalogFilter === cat
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]'
                  }`}
                >
                  {cat === 'ALL' ? (lang === 'es' ? 'Todas' : 'All Crops') : cat}
                </button>
              ))}
            </div>

            {/* Alternador de Incoterm FOB / CIF */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-[var(--text-secondary)]">Incoterm:</span>
              <div className="flex items-center p-0.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
                <button
                  onClick={() => setSelectedIncoterm('CIF')}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    selectedIncoterm === 'CIF'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  CIF {lang === 'es' ? 'Destino' : 'Destination'}
                </button>
                <button
                  onClick={() => setSelectedIncoterm('FOB')}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    selectedIncoterm === 'FOB'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  FOB Callao
                </button>
              </div>
            </div>
          </div>

          {/* Grilla de Productos de Exportación */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATALOG_ITEMS.filter(
              (item) => catalogFilter === 'ALL' || item.category === catalogFilter
            ).map((item) => {
              const unitPriceUsd =
                selectedIncoterm === 'CIF' ? item.cifPriceUsdPerKg : item.fobPriceUsdPerKg;

              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-emerald-500/40 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden"
                >
                  {/* Cabecera de la Tarjeta con Gradiente y Emoji */}
                  <div className={`p-6 bg-gradient-to-br ${item.bgGradient} border-b border-[var(--border-subtle)] flex items-start justify-between gap-4`}>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                        {item.categoryLabel}
                      </span>
                      <h3 className="text-lg font-black text-[var(--text-primary)]">
                        {lang === 'es' ? item.name : item.nameEn}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {lang === 'es' ? item.variety : item.varietyEn}
                      </p>
                    </div>
                    <span className="text-4xl p-2 rounded-2xl bg-white/40 dark:bg-black/20 backdrop-blur-md shadow-sm">
                      {item.imageEmoji}
                    </span>
                  </div>

                  {/* Cuerpo con Ficha Técnica Comercial */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]">
                        <span className="text-[var(--text-hint)]">{lang === 'es' ? 'Calibres:' : 'Calibers:'}</span>
                        <span className="font-bold text-[var(--text-primary)]">{item.calibers}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]">
                        <span className="text-[var(--text-hint)]">{lang === 'es' ? 'Calidad:' : 'Quality Index:'}</span>
                        <span className="font-bold text-[var(--text-primary)]">{item.dryMatterOrBrix}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]">
                        <span className="text-[var(--text-hint)]">{lang === 'es' ? 'Presentación:' : 'Packaging:'}</span>
                        <span className="font-bold text-[var(--text-primary)] text-right max-w-[180px] truncate">
                          {lang === 'es' ? item.packaging : item.packagingEn}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]">
                        <span className="text-[var(--text-hint)]">{lang === 'es' ? 'Temporada:' : 'Season:'}</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {lang === 'es' ? item.season : item.seasonEn}
                        </span>
                      </div>

                      {/* Sellos de Certificación */}
                      <div className="pt-1">
                        <span className="text-[10px] text-[var(--text-hint)] block uppercase mb-1">
                          {lang === 'es' ? 'Certificaciones Oficiales:' : 'Certifications:'}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {item.certifications.map((cert) => (
                            <span
                              key={cert}
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                            >
                              {cert}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Precio y Acción de Pedido (RFQ) */}
                    <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-[var(--text-hint)] uppercase">
                          {selectedIncoterm} {currency} / KG
                        </span>
                        <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                          {formatMoney(unitPriceUsd)}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedCatalogItem(item);
                          setRfqModalOpen(true);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus size={15} />
                        <span>{lang === 'es' ? 'Cotizar (RFQ)' : 'Request PO'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          PANEL 3: CADENA DE FRÍO EN ALTAMAR (SENSOR REEFER IOT)
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'cold-chain' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Header del Monitoreo Satelital */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Snowflake size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-[var(--text-primary)]">
                    {lang === 'es' ? 'Telemetría Satelital Reefer IoT' : 'Reefer Satellite Telemetry'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    ONLINE
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {lang === 'es'
                    ? 'Monitoreo en vivo de temperatura, humedad y gases de atmósfera controlada en altamar.'
                    : 'Real-time monitoring of pulp temperature, humidity, and controlled atmosphere at sea.'}
                </p>
              </div>
            </div>

            {/* Selector de Contenedor */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--text-secondary)]">
                {lang === 'es' ? 'Contenedor:' : 'Container:'}
              </span>
              <select
                value={selectedShipment.id}
                onChange={(e) => {
                  const found = shipments.find((s) => s.id === e.target.value);
                  if (found) setSelectedShipment(found);
                }}
                className="px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {shipments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.containerNumber} ({s.cropName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4 Indicadores Clave en Tiempo Real */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Temperatura */}
            <div className="p-5 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-2">
              <div className="flex items-center justify-between text-xs text-[var(--text-hint)]">
                <span className="font-bold uppercase">{lang === 'es' ? 'Temperatura Pulpa' : 'Pulp Temperature'}</span>
                <span className="text-emerald-500 font-bold">● {lang === 'es' ? 'ÓPTIMO' : 'STABLE'}</span>
              </div>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {selectedShipment.currentTempC} °C
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                {lang === 'es' ? 'Rango programado:' : 'Target range:'} {selectedShipment.targetTempRange}
              </p>
            </div>

            {/* Humedad Relativa */}
            <div className="p-5 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-2">
              <div className="flex items-center justify-between text-xs text-[var(--text-hint)]">
                <span className="font-bold uppercase">{lang === 'es' ? 'Humedad Relativa' : 'Relative Humidity'}</span>
                <span className="text-sky-500 font-bold">● {lang === 'es' ? 'CONTROLADA' : 'OPTIMAL'}</span>
              </div>
              <div className="text-3xl font-black text-sky-600 dark:text-sky-400">
                {selectedShipment.currentHumidity} %
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                {lang === 'es' ? 'Evita deshidratación y pérdida de peso' : 'Prevents fruit weight loss & shriveling'}
              </p>
            </div>

            {/* Atmósfera Controlada (O2 & CO2) */}
            <div className="p-5 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-2">
              <div className="flex items-center justify-between text-xs text-[var(--text-hint)]">
                <span className="font-bold uppercase">{lang === 'es' ? 'Atmósfera (O₂ / CO₂)' : 'Atmosphere (O₂ / CO₂)'}</span>
                <span className="text-teal-500 font-bold">● CA ACTIVE</span>
              </div>
              <div className="text-3xl font-black text-teal-600 dark:text-teal-400">
                4.9% / 4.1%
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                {lang === 'es' ? 'Frena maduración y producción de etileno' : 'Slows ethylene production & ripening'}
              </p>
            </div>

            {/* Enlace Satelital & Genset */}
            <div className="p-5 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-2">
              <div className="flex items-center justify-between text-xs text-[var(--text-hint)]">
                <span className="font-bold uppercase">{lang === 'es' ? 'Enlace Satelital' : 'Satellite Link'}</span>
                <span className="text-emerald-500 font-bold">Iridium Edge</span>
              </div>
              <div className="text-2xl font-black text-[var(--text-primary)]">
                440V / 60Hz
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                {lang === 'es' ? 'Última sincro hace 12 min vía satélite' : 'Last synchronized 12 min ago via Iridium'}
              </p>
            </div>
          </div>

          {/* Gráfico Visual del Perfil Térmico (Curva Histórica de Temperatura) */}
          <div className="p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-black text-[var(--text-primary)]">
                  {lang === 'es' ? 'Curva Histórica de Temperatura (Últimas 48 Horas)' : '48-Hour Thermal Journey Curve'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {lang === 'es'
                    ? 'Lecturas cada 4 horas transmitidas por sensor Iridium en altamar. Banda segura: 4.0°C a 6.0°C.'
                    : '4-hour periodic logger transmissions. Safe export band: 4.0°C to 6.0°C.'}
                </p>
              </div>

              <button
                onClick={() => {
                  const logContent = `VISONS S.A.C. - OFFICIAL THERMAL JOURNEY LOG\nContainer: ${selectedShipment.containerNumber}\nVessel: ${selectedShipment.vesselName}\n\nTime,Temperature,Humidity,O2,CO2\n` +
                    INITIAL_COLD_LOGS.map(l => `${l.time},${l.temp}C,${l.humidity}%,${l.oxygen}%,${l.co2}%`).join('\n');
                  const blob = new Blob([logContent], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `COLD_CHAIN_REPORT_${selectedShipment.containerNumber}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success(
                    lang === 'es' ? 'Reporte Térmico Descargado' : 'Thermal Logger Report Downloaded'
                  );
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)] transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Download size={14} />
                <span>{lang === 'es' ? 'Descargar Histórico CSV' : 'Export Data Logger'}</span>
              </button>
            </div>

            {/* Representación Gráfica SVG de la Curva */}
            <div className="relative pt-6 pb-2">
              <div className="h-44 w-full flex items-end justify-between gap-2 sm:gap-4 px-2">
                {INITIAL_COLD_LOGS.map((point, i) => {
                  // Mapeo de altura de barra (base 4.5°C a 5.5°C)
                  const heightPercent = Math.min(100, Math.max(20, ((point.temp - 3.5) / 3) * 100));

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                        {point.temp}°C
                      </div>
                      <div className="w-full max-w-[28px] h-32 bg-[var(--surface-subtle)] rounded-xl relative overflow-hidden flex items-end">
                        <div
                          className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-lg transition-all duration-500"
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-[var(--text-hint)] font-medium rotate-[-45px] sm:rotate-0 origin-top">
                        {point.time.split(' ')[1]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Leyenda de Límites Seguro */}
              <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    {lang === 'es' ? 'Rango Seguro (4.0°C – 6.0°C)' : 'Safe Range (4.0°C – 6.0°C)'}
                  </span>
                  <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    {lang === 'es' ? 'Humedad Óptima (88%)' : 'Optimal Humidity (88%)'}
                  </span>
                </div>
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  {lang === 'es' ? '0 Excursiones térmicas registradas' : '0 Thermal deviations detected'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          PANEL 4: CENTRO DE DOCUMENTACIÓN ADUANERA (DOC HUB)
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'documents' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Banner del Doc Hub */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-[var(--text-primary)]">
                  {lang === 'es' ? 'Expediente Aduanero Digital (Doc Hub)' : 'Customs Documentation Hub'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {lang === 'es' ? 'Válido para Desaduanaje' : 'Ready for Port Clearance'}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                {lang === 'es'
                  ? 'Descarga los certificados sanitarios SENASA, Bill of Lading original y facturas oficiales para tu agente de aduanas.'
                  : 'Download official SENASA phytosanitary certificates, Master B/L, and Commercial Invoices for your customs broker.'}
              </p>
            </div>

            <button
              onClick={handleDownloadAllDocs}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              <Download size={15} />
              <span>{lang === 'es' ? 'Descargar Doc Pack (ZIP)' : 'Download All (ZIP)'}</span>
            </button>
          </div>

          {/* Grilla de Documentos Disponibles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INITIAL_DOCUMENTS.map((doc) => (
              <div
                key={doc.id}
                className="p-5 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-emerald-500/40 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <FileText size={20} />
                    </span>
                    <div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] uppercase">
                        {doc.type}
                      </span>
                      <h3 className="text-sm font-black text-[var(--text-primary)] mt-1">
                        {lang === 'es' ? doc.title : doc.titleEn}
                      </h3>
                      <p className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {doc.code}
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-1 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                    {lang === 'es' ? 'OFICIAL' : 'CERTIFIED'}
                  </span>
                </div>

                <div className="pt-3 border-t border-[var(--border-subtle)] grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--text-hint)] block uppercase">
                      {lang === 'es' ? 'Emisor / Autoridad' : 'Issuing Authority'}
                    </span>
                    <span className="font-semibold text-[var(--text-primary)] truncate block">
                      {doc.authority}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-hint)] block uppercase">
                      {lang === 'es' ? 'Fecha de Emisión' : 'Date of Issue'}
                    </span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {doc.issueDate}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-[var(--text-secondary)] font-medium">
                    {doc.fileFormat} • {doc.fileSizeBytes}
                  </span>

                  <button
                    onClick={() => handleDownloadDoc(doc)}
                    className="px-3.5 py-1.5 rounded-xl bg-[var(--surface-subtle)] hover:bg-emerald-600 hover:text-white border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Download size={14} />
                    <span>{lang === 'es' ? 'Descargar' : 'Download'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          PANEL 5: FACTURACIÓN & ESTADO DE CUENTA COMERCIAL (INVOICES & SWIFT)
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'invoices' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Tarjetas de Resumen Financiero con Moneda Activa */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-1">
              <span className="text-xs font-bold text-[var(--text-hint)] uppercase">
                {lang === 'es' ? 'Total Facturado' : 'Total Invoiced'}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">
                {formatMoney(totalInvoicedUsd)}
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                3 {lang === 'es' ? 'Facturas de exportación' : 'Export commercial invoices'}
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-1">
              <span className="text-xs font-bold text-[var(--text-hint)] uppercase">
                {lang === 'es' ? 'Total Pagado / Confirmado' : 'Total Paid / Cleared'}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {formatMoney(totalPaidUsd)}
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                {lang === 'es' ? 'Transferencias bancarias conciliadas' : 'Reconciled wire transfers'}
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-1">
              <span className="text-xs font-bold text-[var(--text-hint)] uppercase">
                {lang === 'es' ? 'Saldo Pendiente por Pagar' : 'Outstanding Balance'}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                {formatMoney(totalPendingUsd)}
              </div>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                {lang === 'es' ? 'Vence contra copia de Bill of Lading' : 'Due upon BL copy presentation'}
              </p>
            </div>
          </div>

          {/* Tabla de Facturas Comerciales */}
          <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[var(--text-primary)]">
                  {lang === 'es' ? 'Facturas Comerciales de Exportación' : 'Commercial Export Invoices'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {lang === 'es'
                    ? 'Consulta tus facturas emitidas y notifica tus comprobantes de transferencia bancaria.'
                    : 'Track issued invoices and submit wire transfer payment confirmations.'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-[var(--text-hint)] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">{lang === 'es' ? 'Factura #' : 'Invoice #'}</th>
                    <th className="py-3 px-4">{lang === 'es' ? 'Orden / PO' : 'Purchase Order'}</th>
                    <th className="py-3 px-4">{lang === 'es' ? 'Emisión' : 'Issue Date'}</th>
                    <th className="py-3 px-4">{lang === 'es' ? 'Vencimiento' : 'Due Date'}</th>
                    <th className="py-3 px-4">{lang === 'es' ? 'Términos' : 'Terms'}</th>
                    <th className="py-3 px-4 text-right">{lang === 'es' ? 'Monto Total' : 'Total Amount'}</th>
                    <th className="py-3 px-4 text-center">{lang === 'es' ? 'Estado' : 'Status'}</th>
                    <th className="py-3 px-4 text-right">{lang === 'es' ? 'Acción' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[var(--text-primary)]">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[var(--text-secondary)]">
                        {inv.orderCode}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-secondary)]">
                        {inv.issueDate}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-secondary)]">
                        {inv.dueDate}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-secondary)] max-w-[200px] truncate">
                        {lang === 'es' ? inv.terms : inv.termsEn}
                      </td>
                      <td className="py-3.5 px-4 font-black text-right text-[var(--text-primary)]">
                        {formatMoney(inv.amountUsd)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            inv.status === 'PAGADA'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : inv.status === 'PARCIAL'
                              ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                              : inv.status === 'EN_VERIFICACION'
                              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {inv.status !== 'PAGADA' && (
                          <button
                            onClick={() => {
                              setPaymentInvoice(inv);
                              setPaymentModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all cursor-pointer shadow-sm"
                          >
                            {lang === 'es' ? 'Enviar Swift' : 'Submit Wire'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tarjeta de Instrucciones Bancarias Oficiales (SWIFT Wire Instructions) */}
          <div className="p-6 sm:p-8 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-[var(--surface-card)] to-[var(--surface-card)] shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <span className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Building2 size={22} />
              </span>
              <div>
                <h3 className="text-base font-black text-[var(--text-primary)]">
                  {lang === 'es' ? 'Instrucciones Bancarias Oficiales para Transferencias Internacionales' : 'Official Wire Transfer (SWIFT) Banking Details'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {lang === 'es'
                    ? 'Utiliza estas coordenadas bancarias para transferencias en Dólares Americanos ($ USD) o Euros (€ EUR).'
                    : 'Use these verified banking coordinates for wire transfers in USD or EUR.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] text-[var(--text-hint)] uppercase font-bold">
                  {lang === 'es' ? 'Beneficiario Oficial' : 'Beneficiary'}
                </span>
                <p className="font-bold text-[var(--text-primary)]">VISONS S.A.C.</p>
                <p className="text-[11px] text-[var(--text-secondary)]">RUC: 20601894231 • Lima, Perú</p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--text-hint)] uppercase font-bold">
                    Código SWIFT / BIC
                  </span>
                  <button
                    onClick={() => copyToClipboard('BCPLPEPLXXX', 'SWIFT Code')}
                    className="text-emerald-600 hover:text-emerald-700 cursor-pointer p-0.5"
                    title="Copiar SWIFT"
                  >
                    <Copy size={13} />
                  </button>
                </div>
                <p className="font-mono font-bold text-[var(--text-primary)] text-sm">BCPLPEPLXXX</p>
                <p className="text-[11px] text-[var(--text-secondary)]">Banco de Crédito del Perú (BCP)</p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--text-hint)] uppercase font-bold">
                    Banco Corresponsal (EE.UU.)
                  </span>
                  <button
                    onClick={() => copyToClipboard('CHASUS33', 'Intermediary SWIFT')}
                    className="text-emerald-600 hover:text-emerald-700 cursor-pointer p-0.5"
                    title="Copiar SWIFT Intermediario"
                  >
                    <Copy size={13} />
                  </button>
                </div>
                <p className="font-mono font-bold text-[var(--text-primary)] text-sm">CHASUS33</p>
                <p className="text-[11px] text-[var(--text-secondary)]">JPMorgan Chase Bank N.A. (New York)</p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--text-hint)] uppercase font-bold">
                    Cuenta USD (Dólares)
                  </span>
                  <button
                    onClick={() => copyToClipboard('191-2849102-1-49', 'Cuenta USD')}
                    className="text-emerald-600 hover:text-emerald-700 cursor-pointer p-0.5"
                    title="Copiar Cuenta USD"
                  >
                    <Copy size={13} />
                  </button>
                </div>
                <p className="font-mono font-bold text-[var(--text-primary)]">191-2849102-1-49</p>
                <p className="text-[11px] text-[var(--text-secondary)]">CCI: 002-191002849102149-52</p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--text-hint)] uppercase font-bold">
                    Cuenta EUR (Euros)
                  </span>
                  <button
                    onClick={() => copyToClipboard('191-9481029-2-90', 'Cuenta EUR')}
                    className="text-emerald-600 hover:text-emerald-700 cursor-pointer p-0.5"
                    title="Copiar Cuenta EUR"
                  >
                    <Copy size={13} />
                  </button>
                </div>
                <p className="font-mono font-bold text-[var(--text-primary)]">191-9481029-2-90</p>
                <p className="text-[11px] text-[var(--text-secondary)]">CCI: 002-191009481029290-88</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1 flex flex-col justify-center">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold">
                  Soporte de Tesorería B2B
                </span>
                <p className="font-bold text-[var(--text-primary)]">finanzas@visons.com</p>
                <p className="text-[11px] text-[var(--text-secondary)]">+51 (1) 710-8200</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: SOLICITUD DE COTIZACIÓN DE FRUTA (RFQ STORE)
          ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {rfqModalOpen && selectedCatalogItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header Modal */}
              <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-2 rounded-xl bg-[var(--surface-subtle)]">
                    {selectedCatalogItem.imageEmoji}
                  </span>
                  <div>
                    <h3 className="text-base font-black text-[var(--text-primary)]">
                      {lang === 'es' ? 'Solicitud de Cotización (RFQ)' : 'Request Fruit Quote (PO)'}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {lang === 'es' ? selectedCatalogItem.name : selectedCatalogItem.nameEn}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRfqModalOpen(false)}
                  className="p-2 rounded-xl text-[var(--text-hint)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Formulario RFQ */}
              <form onSubmit={handleSendRfq} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Cantidad de Pallets */}
                  <div>
                    <label className="text-xs font-bold text-[var(--text-primary)] block mb-1">
                      {lang === 'es' ? 'Volumen (Pallets de 40\' HR)' : 'Volume (Reefer Pallets)'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={rfqQuantityPallets}
                      onChange={(e) => setRfqQuantityPallets(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                    <span className="text-[10px] text-[var(--text-hint)] mt-1 block">
                      {rfqQuantityPallets * 264} {lang === 'es' ? 'cajas aproximadas' : 'approx boxes'}
                    </span>
                  </div>

                  {/* Incoterm Preferido */}
                  <div>
                    <label className="text-xs font-bold text-[var(--text-primary)] block mb-1">
                      Incoterm 2026
                    </label>
                    <select
                      value={selectedIncoterm}
                      onChange={(e) => setSelectedIncoterm(e.target.value as 'FOB' | 'CIF')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                      <option value="FOB">FOB Callao (Free on Board)</option>
                    </select>
                  </div>
                </div>

                {/* Puerto de Destino */}
                <div>
                  <label className="text-xs font-bold text-[var(--text-primary)] block mb-1">
                    {lang === 'es' ? 'Puerto de Destino Solicitado' : 'Destination Port'}
                  </label>
                  <input
                    type="text"
                    value={rfqDestinationPort}
                    onChange={(e) => setRfqDestinationPort(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="ej: Port of Rotterdam, Netherlands"
                    required
                  />
                </div>

                {/* Fecha Estimada de Llegada Requerida */}
                <div>
                  <label className="text-xs font-bold text-[var(--text-primary)] block mb-1">
                    {lang === 'es' ? 'Fecha Requerida de Arribo (Target ETA)' : 'Target Delivery Date (ETA)'}
                  </label>
                  <input
                    type="date"
                    value={rfqTargetDate}
                    onChange={(e) => setRfqTargetDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                {/* Notas Especiales o Requerimientos de Calibre */}
                <div>
                  <label className="text-xs font-bold text-[var(--text-primary)] block mb-1">
                    {lang === 'es' ? 'Especificaciones Especiales / Límite LMR' : 'Special Specifications / MRL Limits'}
                  </label>
                  <textarea
                    rows={3}
                    value={rfqNotes}
                    onChange={(e) => setRfqNotes(e.target.value)}
                    placeholder={
                      lang === 'es'
                        ? 'Indica calibres preferidos (ej: 14 y 16), etiqueta privada o requisitos especiales de embalaje.'
                        : 'Specify preferred calibers, private brand labeling or packaging requirements.'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Footer Modal Acciones */}
                <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setRfqModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] cursor-pointer"
                  >
                    {lang === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Send size={15} />
                    <span>{lang === 'es' ? 'Enviar Solicitud a Visons' : 'Submit PO to Visons'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: NOTIFICACIÓN DE TRANSFERENCIA SWIFT (WIRE PROOF)
          ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {paymentModalOpen && paymentInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header Modal */}
              <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-[var(--text-primary)]">
                    {lang === 'es' ? 'Adjuntar Comprobante SWIFT / Wire' : 'Upload Wire Confirmation'}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {lang === 'es' ? 'Factura:' : 'Invoice:'} {paymentInvoice.invoiceNumber} • {formatMoney(paymentInvoice.amountUsd - paymentInvoice.paidUsd)}
                  </p>
                </div>
                <button
                  onClick={() => setPaymentModalOpen(false)}
                  className="p-2 rounded-xl text-[var(--text-hint)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Formulario Comprobante */}
              <form onSubmit={handleSendPaymentProof} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[var(--text-primary)] block mb-1">
                    {lang === 'es' ? 'Referencia SWIFT / Número de Transferencia (UETR)' : 'SWIFT Reference / UETR Number'}
                  </label>
                  <input
                    type="text"
                    value={swiftReference}
                    onChange={(e) => setSwiftReference(e.target.value)}
                    placeholder="ej: FEDWIRE-9081294 o SWIFT-BCP-88219"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-sm font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--text-primary)] block mb-1">
                    {lang === 'es' ? 'Monto Transferido' : 'Transferred Amount'} ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={swiftAmount}
                    onChange={(e) => setSwiftAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                {/* Adjunto de Comprobante (Simulación de Archivo) */}
                <div>
                  <label className="text-xs font-bold text-[var(--text-primary)] block mb-1">
                    {lang === 'es' ? 'Recibo Bancario (PDF / Imagen)' : 'Bank Wire Receipt (PDF / Image)'}
                  </label>
                  <div
                    onClick={() => setPaymentProofAttached(!paymentProofAttached)}
                    className={`p-6 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${
                      paymentProofAttached
                        ? 'border-emerald-500 bg-emerald-500/5'
                        : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)] bg-[var(--surface-subtle)]'
                    }`}
                  >
                    <UploadCloud
                      size={26}
                      className={`mx-auto mb-2 ${paymentProofAttached ? 'text-emerald-500' : 'text-[var(--text-hint)]'}`}
                    />
                    <p className="text-xs font-bold text-[var(--text-primary)]">
                      {paymentProofAttached
                        ? (lang === 'es' ? '✓ SWIFT_RECEIPT_2026.pdf adjuntado' : '✓ SWIFT_RECEIPT_2026.pdf attached')
                        : (lang === 'es' ? 'Clic para adjuntar archivo bancario' : 'Click to select receipt file')}
                    </p>
                    <span className="text-[10px] text-[var(--text-secondary)]">
                      {lang === 'es' ? 'Formatos permitidos: PDF, JPG, PNG hasta 10 MB' : 'Allowed formats: PDF, JPG, PNG up to 10 MB'}
                    </span>
                  </div>
                </div>

                {/* Footer Modal Acciones */}
                <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] cursor-pointer"
                  >
                    {lang === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Send size={15} />
                    <span>{lang === 'es' ? 'Notificar a Finanzas' : 'Submit for Verification'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
