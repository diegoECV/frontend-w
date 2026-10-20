export interface TrackingEvent {
  status: string;
  timestamp: string;
  description: string;
  location?: string;
}

export interface Order {
  orderId: number;
  clientId: string;
  orderCode: string;
  orderDate: string;
  incoterm: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | string;
  statusDescription?: string | null;
  currency?: string | null;
  paymentTerms?: string | null;
  destinationPort?: string | null;
  estimatedShippingDate?: string | null;
  trackingEvents?: TrackingEvent[] | null;
  isActive?: boolean | null;
  isDeleted?: boolean | null;
}

export interface OrderDetail {
  orderDetailId: number;
  orderId: number;
  productId: string;
  batchId?: string;
  quantityKg: number;
  quantityBoxes?: number;
  unitPrice: number;
  totalPrice?: number;
}

export interface Shipment {
  shipmentId?: number;
  orderId: number;
  blNumber?: string;
  bookingNumber?: string;
  freightForwarder?: string;
  vesselName?: string;
  containerNumber: string;
  departurePort: string;
  arrivalPort: string;
  departureDate?: string;
  estimatedArrival?: string;
  temperatureSetpoint?: number;
  status: 'BOOKED' | 'GATE_IN' | 'IN_TRANSIT' | 'CUSTOMS_HOLD' | 'DELIVERED' | 'CANCELLED' | string;
  isActive?: boolean | null;
  isDeleted?: boolean | null;
}

export interface ShipmentItem {
  itemId?: number;
  shipmentId: number;
  productId: string;
  quantityPallets?: number;
  quantityBoxes?: number;
  netWeightKg?: number;
  grossWeightKg?: number;
}

export interface CustomsDeclaration {
  declarationId?: number;
  shipmentId: number;
  damNumber: string;
  fobValue: number;
  customsAgency?: string;
  filingDate?: string;
  status: 'VERDE' | 'NARANJA' | 'ROJO' | 'REGULARIZADO' | 'PENDIENTE' | string;
}
