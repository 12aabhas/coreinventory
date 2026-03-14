import apiClient from './client';
export const getDashboard = () => apiClient.get('/dashboard');
