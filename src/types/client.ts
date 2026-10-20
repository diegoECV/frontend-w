export type ClientDocumentType = 'EIN' | 'VAT' | 'TAX_ID' | 'RUC' | 'RFC' | 'OTRO';

export type Incoterm = 'FOB' | 'CIF' | 'CFR' | 'DDP' | 'EXW' | 'FAS' | 'FCA';

export type PaymentTerm = 
  | 'NET_30' 
  | 'NET_60' 
  | 'ANTICIPO_30_70' 
  | 'CARTA_CREDITO_LC' 
  | 'CONTADO';

export type Currency = 'USD' | 'EUR' | 'PEN';

export interface Client {
  id?: string;
  documentType?: ClientDocumentType | string | null;
  documentNumber?: string | null;
  companyName?: string | null;
  contactName?: string | null;
  country: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  preferredIncoterm?: Incoterm | string | null;
  destinationPort?: string | null;
  paymentTerms?: PaymentTerm | string | null;
  preferredCurrency?: Currency | string | null;
  creditLimit?: number | null;
  language?: string | null;
  isActive?: boolean | null;
  isDeleted?: boolean | null;
  createdAt?: string | null;
  createdBy?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
  deletedAt?: string | null;
  deletedBy?: string | null;
}
