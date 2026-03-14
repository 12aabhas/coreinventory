import apiClient from './client';

export const signup = (data) => apiClient.post('/auth/signup', data);
export const login = (data) => apiClient.post('/auth/login', data);
export const requestOtp = (email) => apiClient.post('/auth/request-otp', { email });
export const resetPassword = (data) => apiClient.post('/auth/reset-password', data);
