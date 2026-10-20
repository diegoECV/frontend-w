export type DocumentType =
  | 'FACTURA_EXPORTACION'
  | 'FACTURA_ELECTRONICA'
  | 'BOLETA_VENTA'
  | 'NOTA_CREDITO'
  | string;

export type SunatCdrStatus =
  | 'ACEPTADO'
  | 'RECHAZADO'
  | 'PENDIENTE'
  | 'OBSERVADO'
  | string;

export type InvoiceStatus =
  | 'PAID'
  | 'UNPAID'
  | 'PARTIAL'
  | 'CANCELLED'
  | string;

export interface Invoice {
  invoiceId?: number;
  orderId: number;
  invoiceNumber: string;
  documentType?: DocumentType | null;
  exchangeRate?: number | null;
  sunatCdrStatus?: SunatCdrStatus | null;
  issueDate?: string | null;
  dueDate?: string | null;
  currency: string;
  subtotal: number;
  taxes?: number | null;
  total: number;
  status: InvoiceStatus;
  isActive?: boolean | null;
  isDeleted?: boolean | null;
}

export type PaymentMethod =
  | 'WIRE_TRANSFER'
  | 'LETTER_OF_CREDIT'
  | 'CREDIT_CARD'
  | 'PAYPAL'
  | 'CHECK'
  | 'DEPOSITO_BANCARIO'
  | string;

export interface Payment {
  paymentId?: number;
  orderId: number;
  amount: number;
  paymentDate?: string | null;
  paymentMethod: PaymentMethod;
  referenceCode?: string | null;
  notes?: string | null;
  isActive?: boolean | null;
  isDeleted?: boolean | null;
}

export interface PriceItem {
  productId: string;
  price: number;
  minQuantity?: number | null;
}

export interface PriceList {
  id?: string;
  name: string;
  validFrom?: string | null;
  validUntil?: string | null;
  currency: string;
  items?: PriceItem[] | null;
  isActive?: boolean | null;
  isDeleted?: boolean | null;
}

