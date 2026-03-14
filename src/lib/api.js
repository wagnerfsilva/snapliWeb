import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Only redirect to login if user is on an admin page
            const isAdminPage = window.location.pathname.startsWith('/admin');
            if (isAdminPage) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/admin/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    logout: () => api.post('/auth/logout'),
    me: () => api.get('/auth/me'),
    changePassword: (currentPassword, newPassword) =>
        api.post('/auth/change-password', { currentPassword, newPassword }),
};

// Events API
export const eventsAPI = {
    getAll: (params) => api.get('/events', { params }),
    getById: (id) => api.get(`/events/${id}`),
    create: (data) => api.post('/events', data),
    update: (id, data) => api.put(`/events/${id}`, data),
    delete: (id) => api.delete(`/events/${id}`),
    getStatistics: (id) => api.get(`/events/${id}/statistics`),
};

// Photos API
export const photosAPI = {
    upload: (formData, onUploadProgress) =>
        api.post('/photos/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress,
        }),
    getByEvent: (eventId, params) => api.get(`/photos/event/${eventId}`, { params }),
    getGallery: (eventId, params) => api.get(`/photos/event/${eventId}/gallery`, { params }),
    getById: (id) => api.get(`/photos/${id}`),
    delete: (id) => api.delete(`/photos/${id}`),
    getDownloadUrl: (id) => api.get(`/photos/${id}/download`),
    retryProcessing: (id) => api.post(`/photos/${id}/retry`),
};

// Search API
export const searchAPI = {
    searchByFace: (formData) =>
        api.post('/search/face', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    searchByEvent: (eventId, params) => api.get(`/search/event/${eventId}`, { params }),
    getStatistics: () => api.get('/search/statistics'),
    getSalesStatistics: (params) => api.get('/search/sales-statistics', { params }),
};

export default api;
