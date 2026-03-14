import apiClient from './client';

export const getWarehouses = () => apiClient.get('/warehouses');
export const createWarehouse = (data) => apiClient.post('/warehouses', data);
export const getLocations = (warehouseId) => apiClient.get(`/warehouses/${warehouseId}/locations`);
export const createLocation = (warehouseId, data) => apiClient.post(`/warehouses/${warehouseId}/locations`, data);