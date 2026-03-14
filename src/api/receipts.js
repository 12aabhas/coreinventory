import apiClient from './client';

export const getReceipts = (params) => apiClient.get('/receipts', { params });
export const createReceipt = (data) => apiClient.post('/receipts', data);
export const validateReceipt = (id) => apiClient.patch(`/receipts/${id}/validate`);
export const cancelReceipt = (id) => apiClient.patch(`/receipts/${id}/cancel`);