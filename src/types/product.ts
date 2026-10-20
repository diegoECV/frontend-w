export interface Product {
  id?: string;
  code?: string | null;
  name: string;
  categoryId?: string | null;
  isActive?: boolean | null;
  isDeleted?: boolean | null;
  variety?: string | null;
  caliber?: string | null;
  unitMeasure?: string | null;
  hsCode?: string | null;
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
