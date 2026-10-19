import { api } from './axiosConfig';
import type { Invoice, Payment, PriceList } from '../types/finance';

// ===== FACTURAS & DOCUMENTOS TRIBUTARIOS =====
export const getInvoices = (limit?: number) => {
  const url = limit && limit > 0 ? `/invoices?limit=${limit}` : '/invoices';
  return api.get<Invoice[]>(url);
};

export const getInvoiceById = (id: number) => {
  return api.get<Invoice>(`/invoices/${id}`);
};

export const createInvoice = (invoice: Partial<Invoice>) => {
  return api.post<Invoice>('/invoices', invoice);
};

export const updateInvoice = (id: number, invoice: Partial<Invoice>) => {
  return api.put<Invoice>(`/invoices/${id}`, invoice);
};

export const deleteInvoice = (id: number) => {
  return api.delete(`/invoices/${id}`);
};

// ===== PAGOS & COBRANZAS BANCARIAS =====
export const getPayments = (limit?: number) => {
  const url = limit && limit > 0 ? `/payments?limit=${limit}` : '/payments';
  return api.get<Payment[]>(url);
};

export const getPaymentById = (id: number) => {
  return api.get<Payment>(`/payments/${id}`);
};

export const createPayment = (payment: Partial<Payment>) => {
  return api.post<Payment>('/payments', payment);
};

export const updatePayment = (id: number, payment: Partial<Payment>) => {
  return api.put<Payment>(`/payments/${id}`, payment);
};

export const deletePayment = (id: number) => {
  return api.delete(`/payments/${id}`);
};

// ===== LISTAS DE PRECIOS POR TEMPORADA (MONGODB) =====
export const getPriceLists = (limit?: number) => {
  const url = limit && limit > 0 ? `/price-lists?limit=${limit}` : '/price-lists';
  return api.get<PriceList[]>(url);
};

export const getPriceListById = (id: string) => {
  return api.get<PriceList>(`/price-lists/${id}`);
};

export const createPriceList = (priceList: Partial<PriceList>) => {
  return api.post<PriceList>('/price-lists', priceList);
};

export const updatePriceList = (id: string, priceList: Partial<PriceList>) => {
  return api.put<PriceList>(`/price-lists/${id}`, priceList);
};

export const deletePriceList = (id: string) => {
  return api.delete(`/price-lists/${id}`);
};

// ===== EXPORTACIÓN (CSV / EXCEL / PDF) =====
export const exportInvoicesCsv = (invoices: Invoice[]) => {
  const headers = ['ID,Nº Factura,Orden ID,Tipo Documento,Fecha Emision,Fecha Vencimiento,Moneda,Subtotal,Impuestos,Total,Estado,CDR SUNAT'];
  const rows = invoices.map((inv) =>
    [
      inv.invoiceId || '',
      `"${inv.invoiceNumber || ''}"`,
      inv.orderId || '',
      `"${inv.documentType || 'FACTURA_ELECTRONICA'}"`,
      inv.issueDate ? inv.issueDate.slice(0, 10) : '',
      inv.dueDate ? inv.dueDate.slice(0, 10) : '',
      inv.currency || 'USD',
      inv.subtotal || 0,
      inv.taxes || 0,
      inv.total || 0,
      inv.status || 'UNPAID',
      `"${inv.sunatCdrStatus || 'ACEPTADO'}"`,
    ].join(',')
  );

  const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `facturacion-visons-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
