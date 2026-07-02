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

// ─── Auth ──────────────────────────────────────────────
// Controller: @Controller('auth')
export const authApi = {
  /** POST /auth/login — { username, password } */
  login: (username: string, password: string) =>
    apiClient.post('/auth/login', { username, password }),

  /** POST /auth/register — { username, password, fullName } */
  register: (data: { username: string; password: string; fullName: string }) =>
    apiClient.post('/auth/register', data),

  /** POST /auth/register/ekyc — multipart { username, password, fullName, front, back, selfie } */
  registerWithEkyc: (formData: FormData) =>
    apiClient.post('/auth/register/ekyc', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /** POST /auth/ekyc/verify — multipart { front, back, selfie } — requires JWT */
  ekycVerify: (formData: FormData) =>
    apiClient.post('/auth/ekyc/verify', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /** GET /auth/me — hồ sơ cá nhân + CCCD masked; requires JWT */
  me: () => apiClient.get('/auth/me'),
};

// ─── Procedures ────────────────────────────────────────
// Controller: @Controller('procedures')
export const proceduresApi = {
  /** GET /procedures */
  list: () => apiClient.get('/procedures'),

  /** GET /procedures/:code */
  get: (code: string) => apiClient.get(`/procedures/${code}`),

  /** POST /procedures/identify — { userQuery } */
  identify: (userQuery: string) => apiClient.post('/procedures/identify', { userQuery }),

  /** POST /procedures/consult — { question, procedureCode, topK? } */
  consult: (question: string, procedureCode: string, topK?: number) =>
    apiClient.post('/procedures/consult', { question, procedureCode, topK }),
};

// ─── Sessions ──────────────────────────────────────────
// Controller: @Controller('sessions')
export const sessionsApi = {
  /** GET /sessions/history — requires JWT */
  history: () => apiClient.get('/sessions/history'),

  /** POST /sessions — { procedureId } — requires JWT */
  create: (procedureId: string) => apiClient.post('/sessions', { procedureId }),

  /** GET /sessions/:id */
  get: (id: string) => apiClient.get(`/sessions/${id}`),

  /** POST /sessions/:id/confirm */
  confirm: (id: string) => apiClient.post(`/sessions/${id}/confirm`),
};

// ─── Documents ─────────────────────────────────────────
// Controller: @Controller('documents')
export const documentsApi = {
  /** POST /documents/upload — multipart { file, sessionId, documentTypeCode } */
  upload: (formData: FormData) =>
    apiClient.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /** POST /documents/:sessionId/ocr/:documentTypeCode — { checklistId? } */
  triggerOcr: (sessionId: string, documentTypeCode: string, checklistId?: string) =>
    apiClient.post(`/documents/${sessionId}/ocr/${documentTypeCode}`, { checklistId }),
};

// ─── Document Types ────────────────────────────────────
// Controller: @Controller('document-types')
export const documentTypesApi = {
  /** GET /document-types */
  list: () => apiClient.get('/document-types'),

  /** GET /document-types/:code */
  get: (code: string) => apiClient.get(`/document-types/${code}`),
};

// ─── Scoring (mounted on sessions) ─────────────────────
// Controller: @Controller('sessions')
export const scoringApi = {
  /** POST /sessions/:id/crosscheck — 202 Accepted */
  crosscheck: (sessionId: string) => apiClient.post(`/sessions/${sessionId}/crosscheck`),

  /** POST /sessions/:id/score — 202 Accepted */
  score: (sessionId: string) => apiClient.post(`/sessions/${sessionId}/score`),

  /** POST /sessions/:id/lawguard — 202 Accepted */
  lawguard: (sessionId: string) => apiClient.post(`/sessions/${sessionId}/lawguard`),
};

// ─── SmartForm (mounted on sessions) ───────────────────
// Controller: @Controller('sessions')
export const smartformApi = {
  /** POST /sessions/:id/smartform — 202 Accepted */
  generate: (sessionId: string) => apiClient.post(`/sessions/${sessionId}/smartform`),

  /** POST /sessions/:id/smartform/render — { values: Record<string,string> } */
  render: (sessionId: string, values: Record<string, string>) =>
    apiClient.post(`/sessions/${sessionId}/smartform/render`, { values }),

  /** GET /sessions/:id/smartform/:format — download docx or pdf */
  download: (sessionId: string, format: 'docx' | 'pdf') =>
    apiClient.get(`/sessions/${sessionId}/smartform/${format}`, {
      responseType: 'blob',
    }),
};

// ─── Recheck (mounted on sessions) ─────────────────────
// Controller: @Controller('sessions') — requires OFFICER/ADMIN
export const recheckApi = {
  /** POST /sessions/:id/recheck — requires JWT + OFFICER/ADMIN role */
  recheck: (sessionId: string) => apiClient.post(`/sessions/${sessionId}/recheck`),
};

// ─── Priority ──────────────────────────────────────────
// Controller: @Controller('priority') — requires OFFICER/ADMIN
export const priorityApi = {
  /** GET /priority */
  getQueue: () => apiClient.get('/priority'),
};

// ─── Insights ──────────────────────────────────────────
// Controller: @Controller('insights') — requires OFFICER/ADMIN
export const insightsApi = {
  /** GET /insights/dashboard?days= */
  dashboard: (days?: number) => apiClient.get('/insights/dashboard', { params: { days } }),

  /** GET /insights/top-errors?days= */
  topErrors: (days?: number) => apiClient.get('/insights/top-errors', { params: { days } }),

  /** GET /insights/trend?days= */
  trend: (days?: number) => apiClient.get('/insights/trend', { params: { days } }),

  /** POST /insights/reports?days= — 202 Accepted, async job */
  generateReport: (days?: number) => apiClient.post('/insights/reports', null, { params: { days } }),
};

// ─── Jobs ──────────────────────────────────────────────
// Controller: @Controller('jobs') — requires ADMIN
export const jobsApi = {
  /** POST /jobs/embeddings — { chunksDir?, collection? } */
  createEmbedding: (dto?: { chunksDir?: string; collection?: string }) =>
    apiClient.post('/jobs/embeddings', dto),

  /** GET /jobs/:id */
  get: (id: string) => apiClient.get(`/jobs/${id}`),
};
