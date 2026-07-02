import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT token
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('govtrust_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // Add request ID for tracing
    config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  return config;
});

// Response interceptor — extract data, handle auth errors
apiClient.interceptors.response.use(
  (r) => r.data,
  (err) => {
    const status = err.response?.status;
    const message = err.response?.data?.message ?? err.message;

    // Auto-redirect on 401 Unauthorized
    if (status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('govtrust_token');
      localStorage.removeItem('govtrust_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(new Error(message));
  },
);

// --- API helpers ---

export const proceduresApi = {
  list: () => apiClient.get('/procedures'),
  get: (code: string) => apiClient.get(`/procedures/${code}`),
  identify: (userQuery: string) => apiClient.post('/procedures/identify', { userQuery }),
};

export const sessionsApi = {
  create: (procedureId: string) => apiClient.post('/sessions', { procedureId }),
  get: (id: string) => apiClient.get(`/sessions/${id}`),
  confirm: (id: string) => apiClient.post(`/sessions/${id}/confirm`),
};

export const documentsApi = {
  upload: (formData: FormData) =>
    apiClient.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  triggerOcr: (sessionId: string, documentTypeCode: string) =>
    apiClient.post(`/documents/${sessionId}/ocr/${documentTypeCode}`),
};

export const scoringApi = {
  crosscheck: (sessionId: string) => apiClient.post(`/sessions/${sessionId}/crosscheck`),
  score: (sessionId: string) => apiClient.post(`/sessions/${sessionId}/score`),
  lawguard: (sessionId: string) => apiClient.post(`/sessions/${sessionId}/lawguard`),
};

export const smartformApi = {
  generate: (sessionId: string) => apiClient.post(`/sessions/${sessionId}/smartform`),
};

export const recheckApi = {
  recheck: (sessionId: string) => apiClient.post(`/sessions/${sessionId}/recheck`),
};

export const priorityApi = {
  getQueue: () => apiClient.get('/priority'),
};

export const insightsApi = {
  dashboard: (days?: number) => apiClient.get('/insights/dashboard', { params: { days } }),
  topErrors: (days?: number) => apiClient.get('/insights/top-errors', { params: { days } }),
  trend: (days?: number) => apiClient.get('/insights/trend', { params: { days } }),
};

export const authApi = {
  login: (username: string, password: string) =>
    apiClient.post('/auth/login', { username, password }),
  register: (data: { username: string; password: string; fullName: string }) =>
    apiClient.post('/auth/register', data),
};
