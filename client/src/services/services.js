import api from './api.js';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const vehicleService = {
  list: (params) => api.get('/vehicles', { params }),
  get: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  archive: (id) => api.patch(`/vehicles/${id}/archive`),
};

export const serviceRecordService = {
  list: (vehicleId, params) => api.get(`/vehicles/${vehicleId}/services`, { params }),
  get: (vehicleId, id) => api.get(`/vehicles/${vehicleId}/services/${id}`),
  create: (vehicleId, data) => api.post(`/vehicles/${vehicleId}/services`, data),
  update: (vehicleId, id, data) => api.put(`/vehicles/${vehicleId}/services/${id}`, data),
  remove: (vehicleId, id) => api.delete(`/vehicles/${vehicleId}/services/${id}`),
  uploadReceipt: (vehicleId, id, formData) =>
    api.post(`/vehicles/${vehicleId}/services/${id}/receipt`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  exportPdf: (vehicleId) => api.get(`/vehicles/${vehicleId}/export/pdf`, { responseType: 'blob' }),
  exportCsv: (vehicleId) => api.get(`/vehicles/${vehicleId}/export/csv`, { responseType: 'blob' }),
};

export const dashboardService = {
  get: () => api.get('/dashboard'),
};

export const notificationService = {
  list: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const analyticsService = {
  spendByMonth: (params) => api.get('/analytics/spend-by-month', { params }),
  spendByType: (params) => api.get('/analytics/spend-by-type', { params }),
  costPerKm: () => api.get('/analytics/cost-per-km'),
};

export const adminService = {
  getServiceTypes: (params) => api.get('/admin/service-types', { params }),
  createServiceType: (data) => api.post('/admin/service-types', data),
  updateServiceType: (id, data) => api.put(`/admin/service-types/${id}`, data),
  deleteServiceType: (id) => api.delete(`/admin/service-types/${id}`),
  getUsers: (params) => api.get('/admin/users', { params }),
  activateUser: (id) => api.patch(`/admin/users/${id}/activate`),
  deactivateUser: (id) => api.patch(`/admin/users/${id}/deactivate`),
  getStats: () => api.get('/admin/stats'),
  getAuditLog: (params) => api.get('/admin/audit-log', { params }),
};
