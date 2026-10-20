export interface Product {
  id?: string;
  code?: string | null;
  name: string;
  scientificName?: string | null;
  categoryId?: string | null;
  variety?: string | null;
  caliber?: string | null;
  unitMeasure?: string | null;
  hsCode?: string | null;
  storageTemperature?: string | null;
  shelfLifeDays?: number | null;
  packagingType?: string | null;
  originRegion?: string | null;
  qualityGrade?: string | null;
  organicCertification?: string | null;
  isActive?: boolean | null;
  isDeleted?: boolean | null;
  createdAt?: string | null;
  createdBy?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export type ProductCategory = 
  | 'PALTAS' 
  | 'MANGOS' 
  | 'ARANDANOS' 
  | 'UVAS' 
  | 'CITRICOS' 
  | 'ESPARRAGOS' 
  | 'OTRO';

export type ProductUnitMeasure = 
  | 'CAJA_4KG' 
  | 'CAJA_10KG' 
  | 'CAJA_4.5KG' 
  | 'PALLET' 
  | 'TM' 
  | 'KG';
