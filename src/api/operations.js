import apiClient from './client';

export const getTransfers = (params) => apiClient.get('/transfers', { params });
export const createTransfer = (data) => apiClient.post('/transfers', data);
export const validateTransfer = (id) => apiClient.patch(`/transfers/${id}/validate`);

export const getAdjustments = () => apiClient.get('/adjustments');
export const createAdjustment = (data) => apiClient.post('/adjustments', data);

export const getMoveHistory = (params) => apiClient.get('/move-history', { params });

export const getLowStockAlerts = () => apiClient.get('/alerts/low-stock');