import { api } from './axiosConfig';
import type { Product } from '../types/product';

export const getProducts = (limit?: number) => {
  const url = limit && limit > 0 ? `/products?limit=${limit}` : '/products';
  return api.get<Product[]>(url);
};

export const getProductById = (id: string) => {
  return api.get<Product>(`/products/${id}`);
};

export const createProduct = (product: Omit<Product, 'id'>) => {
  return api.post<Product>('/products', product);
};

export const updateProduct = (id: string, product: Partial<Product>) => {
  return api.put<Product>(`/products/${id}`, product);
};

export const deleteProduct = (id: string) => {
  return api.delete(`/products/${id}`);
};

export const hardDeleteProduct = (id: string) => {
  return api.delete(`/products/${id}/hard`);
};

export const restoreProduct = (id: string) => {
  return api.patch<Product>(`/products/${id}/restore`);
};

export const exportProductsExcel = async () => {
  const response = await api.get('/products/export/excel', {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `productos_visons_${new Date().toISOString().slice(0, 10)}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportProductsPdf = async () => {
  const response = await api.get('/products/export/pdf', {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `catalogo_productos_${new Date().toISOString().slice(0, 10)}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportProductsCsv = async () => {
  const response = await api.get('/products/export/csv', {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `productos_visons_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
