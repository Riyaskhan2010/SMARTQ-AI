import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE_URL, withCredentials: false });

// Attach JWT
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('smartq_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Handle 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('smartq_token');
      localStorage.removeItem('smartq_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────
export const authAPI = {
  register: (d) => api.post('/auth/register', d),
  login:    (d) => api.post('/auth/login', d),
  me:       ()  => api.get('/auth/me'),
  setLanguage: (lang) => api.patch('/auth/language', { language: lang }),
};

// ── Sectors & Orgs ───────────────────────────────────────────────
export const sectorsAPI = {
  list: ()     => api.get('/sectors'),
  get:  (slug) => api.get(`/sectors/${slug}`),
};
export const orgsAPI = {
  list:        (params) => api.get('/organizations', { params }),
  get:         (id)     => api.get(`/organizations/${id}`),
  queueStatus: (id)     => api.get(`/organizations/${id}/queue-status`),
};

// ── Services ──────────────────────────────────────────────────────
export const servicesAPI = {
  get:       (id) => api.get(`/services/${id}`),
  queueInfo: (id) => api.get(`/services/${id}/queue-info`),
};

// ── Tokens ────────────────────────────────────────────────────────
export const tokensAPI = {
  book:   (d)  => api.post('/tokens', d),
  get:    (id) => api.get(`/tokens/${id}`),
  list:   (p)  => api.get('/tokens', { params: p }),
  cancel: (id) => api.post(`/tokens/${id}/cancel`),
};

// ── Queues ────────────────────────────────────────────────────────
export const queuesAPI = {
  get:        (id)   => api.get(`/queues/${id}`),
  byDept:     (dId)  => api.get(`/queues/department/${dId}`),
  publicView: (dId)  => api.get(`/queues/public/${dId}`),
};

// ── Counters ──────────────────────────────────────────────────────
export const countersAPI = {
  open:   (id) => api.post(`/counters/${id}/open`),
  close:  (id) => api.post(`/counters/${id}/close`),
  pause:  (id) => api.post(`/counters/${id}/pause`),
  resume: (id) => api.post(`/counters/${id}/resume`),
};

// ── Staff ─────────────────────────────────────────────────────────
export const staffAPI = {
  counter:         ()                   => api.get('/staff/counter'),
  next:            ()                   => api.post('/staff/next'),
  complete:        (id)                 => api.post(`/staff/tokens/${id}/complete`),
  noShow:          (id)                 => api.post(`/staff/tokens/${id}/no-show`),
  start:           (id)                 => api.post(`/staff/tokens/${id}/start`),
  // Setup flow
  assignCounter:   (d)                  => api.patch('/staff/assign-counter', d),
  unassignCounter: ()                   => api.patch('/staff/unassign-counter'),
  deptCounters:    (departmentId)       => api.get(`/staff/org-counters/${departmentId}`),
};

// ── Admin ─────────────────────────────────────────────────────────
export const adminAPI = {
  dashboard:         ()    => api.get('/admin/dashboard'),
  analytics:         (rng) => api.get('/admin/analytics', { params: { range: rng } }),
  acceptRecommendation:(id)=> api.post(`/admin/recommendations/${id}/accept`),
};

// ── AI ────────────────────────────────────────────────────────────
export const aiAPI = {
  predict:   (d) => api.post('/ai/predict', d),
  recommend: (d) => api.post('/ai/recommend', d),
};

// ── Simulation ────────────────────────────────────────────────────
export const simulationAPI = {
  run: (d) => api.post('/simulation', d),
};

// ── Notifications ─────────────────────────────────────────────────
export const notificationsAPI = {
  list:    ()   => api.get('/notifications'),
  read:    (id) => api.patch(`/notifications/${id}/read`),
  readAll: ()   => api.patch('/notifications/read-all'),
};

// ── Appointments ──────────────────────────────────────────────────
export const appointmentsAPI = {
  list:   ()  => api.get('/appointments'),
  book:   (d) => api.post('/appointments', d),
  cancel: (id)=> api.delete(`/appointments/${id}`),
};

// ── History ───────────────────────────────────────────────────────
export const historyAPI = {
  list: () => api.get('/history'),
};

// ── Demo ─────────────────────────────────────────────────────────
export const demoAPI = {
  credentials:  ()  => api.get('/demo/credentials'),
  loadScenario: ()  => api.post('/demo/load-scenario'),
};

export default api;

// ── Canteen ───────────────────────────────────────────────────────
export const canteenAPI = {
  // Discovery
  getByOrg:      (orgId)                      => api.get(`/canteen/org/${orgId}`),
  getMenu:       (canteenOrgId, period)       => api.get(`/canteen/${canteenOrgId}/menu`, { params: { period } }),
  getCounters:   (canteenOrgId)               => api.get(`/canteen/${canteenOrgId}/counters`),
  // User orders
  placeOrder:    (d)                          => api.post('/canteen/order', d),
  getOrder:      (orderId)                    => api.get(`/canteen/order/${orderId}`),
  myOrders:      ()                           => api.get('/canteen/my-orders'),
  // Staff
  staffQueue:    (canteenOrgId, counterId)    => api.get(`/canteen/staff/${canteenOrgId}/${counterId}`),
  updateStatus:  (orderId, status)            => api.patch(`/canteen/order/${orderId}/status`, { status }),
  // Admin
  adminDashboard: (canteenOrgId)             => api.get(`/canteen/admin/${canteenOrgId}/dashboard`),
  adminAnalytics: (canteenOrgId)             => api.get(`/canteen/admin/${canteenOrgId}/analytics`),
  toggleItem:    (itemId, availability)       => api.patch(`/canteen/menu/${itemId}`, { availability }),
  toggleCounter: (counterId, status)          => api.patch(`/canteen/counter/${counterId}/status`, { status }),
};

// ── Smart Visit Plan (frontend-side, reuses tokensAPI) ────────────
export const visitPlanAPI = {
  // Book multiple tokens in parallel and return them as a plan
  bookPlan: async (services) => {
    // services: [{ serviceId, isFollowUp?, notes? }]
    const results = await Promise.allSettled(
      services.map(s => api.post('/tokens', s))
    );
    return results.map((r, i) => ({
      serviceId: services[i].serviceId,
      success:   r.status === 'fulfilled',
      data:      r.status === 'fulfilled' ? r.value.data : null,
      error:     r.status === 'rejected'  ? r.reason?.response?.data?.error : null,
    }));
  },
  // Get queue info for multiple services in parallel
  getMultiQueueInfo: async (serviceIds) => {
    const results = await Promise.allSettled(
      serviceIds.map(id => api.get(`/services/${id}/queue-info`))
    );
    const out = {};
    results.forEach((r, i) => {
      out[serviceIds[i]] = r.status === 'fulfilled' ? r.value.data : null;
    });
    return out;
  },
};
