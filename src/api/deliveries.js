import apiClient from './client';

export const getDeliveries = (params) => apiClient.get('/deliveries', { params });
export const createDelivery = (data) => apiClient.post('/deliveries', data);
export const validateDelivery = (id) => apiClient.patch(`/deliveries/${id}/validate`);