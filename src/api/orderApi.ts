import { api } from './axiosConfig';
import type { Order, OrderDetail, Shipment, CustomsDeclaration } from '../types/order';

// ===== ÓRDENES COMERCIALES =====
export const getOrders = (limit?: number) => {
  const url = limit && limit > 0 ? `/orders?limit=${limit}` : '/orders';
  return api.get<Order[]>(url);
};

export const getOrderById = (id: number) => {
  return api.get<Order>(`/orders/${id}`);
};

export const createOrder = (order: Partial<Order>) => {
  return api.post<Order>('/orders', order);
};

export const updateOrder = (id: number, order: Partial<Order>) => {
  return api.put<Order>(`/orders/${id}`, order);
};

export const deleteOrder = (id: number) => {
  return api.delete(`/orders/${id}`);
};

// ===== DETALLES DE ÓRDENES (ITEMS) =====
export const getOrderDetails = (limit?: number) => {
  const url = limit && limit > 0 ? `/order-details?limit=${limit}` : '/order-details';
  return api.get<OrderDetail[]>(url);
};

export const createOrderDetail = (detail: Partial<OrderDetail>) => {
  return api.post<OrderDetail>('/order-details', detail);
};

export const updateOrderDetail = (id: number, detail: Partial<OrderDetail>) => {
  return api.put<OrderDetail>(`/order-details/${id}`, detail);
};

export const deleteOrderDetail = (id: number) => {
  return api.delete(`/order-details/${id}`);
};

// ===== EMBARQUES REEFER & LOGÍSTICA =====
export const getShipments = (limit?: number) => {
  const url = limit && limit > 0 ? `/shipments?limit=${limit}` : '/shipments';
  return api.get<Shipment[]>(url);
};

export const getShipmentById = (id: number) => {
  return api.get<Shipment>(`/shipments/${id}`);
};

export const createShipment = (shipment: Partial<Shipment>) => {
  return api.post<Shipment>('/shipments', shipment);
};

export const updateShipment = (id: number, shipment: Partial<Shipment>) => {
  return api.put<Shipment>(`/shipments/${id}`, shipment);
};

export const deleteShipment = (id: number) => {
  return api.delete(`/shipments/${id}`);
};

// ===== DECLARACIONES ADUANERAS (DAM) =====
export const getCustomsDeclarations = (limit?: number) => {
  const url = limit && limit > 0 ? `/customs-declarations?limit=${limit}` : '/customs-declarations';
  return api.get<CustomsDeclaration[]>(url);
};

export const createCustomsDeclaration = (decl: Partial<CustomsDeclaration>) => {
  return api.post<CustomsDeclaration>('/customs-declarations', decl);
};

export const updateCustomsDeclaration = (id: number, decl: Partial<CustomsDeclaration>) => {
  return api.put<CustomsDeclaration>(`/customs-declarations/${id}`, decl);
};

export const deleteCustomsDeclaration = (id: number) => {
  return api.delete(`/customs-declarations/${id}`);
};

// ===== EXPORTACIÓN (EXCEL / PDF / CSV) =====
export const exportOrdersExcel = async () => {
  const response = await api.get('/orders/export/excel', { responseType: 'blob' });
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = `pedidos-visons-${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(link.href);
};

export const exportOrdersPdf = async () => {
  const response = await api.get('/orders/export/pdf', { responseType: 'blob' });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = `pedidos-visons-${new Date().toISOString().slice(0, 10)}.pdf`;
  link.click();
  window.URL.revokeObjectURL(link.href);
};

export const exportOrdersCsv = async () => {
  const response = await api.get('/orders/export/csv', { responseType: 'blob' });
  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = `pedidos-visons-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  window.URL.revokeObjectURL(link.href);
};
