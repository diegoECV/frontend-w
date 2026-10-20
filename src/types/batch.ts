export type QualityStatus = 'PASSED' | 'REJECTED' | 'CONDITIONALLY_ACCEPTED' | 'PENDING';

export interface InspectionEvent {
  inspector: string;
  inspectionTime?: string | null;
  qualityStatus: QualityStatus;
  notes?: string | null;
}

export interface Batch {
  batchId?: number;
  productId: string;
  providerId: string;
  fieldName: string;
  harvestDate?: string | null;
  packingDate?: string | null;
  productionDate?: string | null;
  expirationDate?: string | null;
  inspections?: InspectionEvent[] | null;
  isActive?: boolean | null;
  isDeleted?: boolean | null;
  status?: string | null;
}

export interface InventoryBatch {
  id?: string;
  batchId?: number | null;
  productId?: string | null;
  providerId?: string | null;
  fieldName?: string | null;
  harvestDate?: string | null;
  packingDate?: string | null;
  expirationDate?: string | null;
  quantity: number;
  isActive?: boolean | null;
  isDeleted?: boolean | null;
  status?: string | null;
}

export interface QualityInspection {
  id?: string;
  batchId?: string | null;
  inspectorId?: string | null;
  inspectionDate?: string | null;
  result?: QualityStatus | string | null;
  notes?: string | null;
  evidenceUrls?: string[] | null;
}

export interface TemperatureLog {
  id?: string;
  shipmentId?: number | null;
  containerNumber?: string | null;
  sensorId?: string | null;
  recordedAt?: string | null;
  temperatureCelsius?: number | null;
  humidityPercent?: number | null;
  status?: 'NORMAL' | 'WARNING' | 'CRITICAL' | string | null;
}
