import apiClient from './client';

export const getProducts = (params) => apiClient.get('/products', { params });
export const createProduct = (data) => apiClient.post('/products', data);
export const updateProduct = (id, data) => apiClient.patch(`/products/${id}`, data);
export const deleteProduct = (id) => apiClient.delete(`/products/${id}`);
