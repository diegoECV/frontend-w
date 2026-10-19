export type ProviderDocumentType = 'RUC' | 'DNI' | 'CE' | 'PASAPORTE';

export type ProviderCertification = 
  | 'GLOBAL_GAP' 
  | 'SENASA_VIGENTE' 
  | 'ORGANIC_USDA' 
  | 'SMETA' 
  | 'BRCGS' 
  | 'EN_TRAMITE' 
  | 'NO_CERTIFICADO';

export interface Provider {
  id?: string;
  documentType: ProviderDocumentType | string;
  documentNumber: string;
  companyName: string;
  contactName?: string | null;
  country?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  ubigeo?: string | null;
  bankAccountCci?: string | null;
  certificationStatus?: ProviderCertification | string | null;
}
