import axios, { AxiosRequestConfig } from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  // Không ép Content-Type ở instance: Axios tự chọn JSON cho object và
  // multipart/form-data kèm boundary cho FormData. Ép JSON ở đây sẽ biến
  // File thành `{}` trước khi request tới backend.
});

apiClient.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('govtrust_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  r => r.data,
  err => {
    const message = err.response?.data?.message ?? err.message;
    return Promise.reject(new Error(message));
  },
);

// Typed generic wrappers
const get = <T>(url: string, config?: AxiosRequestConfig): Promise<T> => apiClient.get(url, config);
const post = <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => apiClient.post(url, data, config);

// --- API helpers ---

export const proceduresApi = {
  list: <T = any>() => get<T>('/procedures'),
  get: <T = any>(code: string) => get<T>(`/procedures/${code}`),
  identify: <T = any>(userQuery: string) => post<T>('/procedures/identify', { userQuery }),
  consult: <T = any>(question: string, procedureCode: string, topK?: number) =>
    post<T>('/procedures/consult', { question, procedureCode, topK }),
};

export const sessionsApi = {
  create: <T = any>(procedureId: string) => post<T>('/sessions', { procedureId }),
  get: <T = any>(id: string) => get<T>(`/sessions/${id}`),
  confirm: <T = any>(id: string) => post<T>(`/sessions/${id}/confirm`),
};

export const documentsApi = {
  upload: <T = any>(formData: FormData) =>
    post<T>('/documents/upload', formData),
  triggerOcr: <T = any>(sessionId: string, documentTypeCode: string, checklistId: string) =>
    post<T>(`/documents/${sessionId}/ocr/${documentTypeCode}`, { checklistId }),
};

export const scoringApi = {
  crosscheck: <T = any>(sessionId: string) => post<T>(`/sessions/${sessionId}/crosscheck`),
  score: <T = any>(sessionId: string) => post<T>(`/sessions/${sessionId}/score`),
  lawguard: <T = any>(sessionId: string) => post<T>(`/sessions/${sessionId}/lawguard`),
};

export const smartformApi = {
  generate: <T = any>(sessionId: string) => post<T>(`/sessions/${sessionId}/smartform`),
  render: <T = any>(sessionId: string, values: Record<string, string>) =>
    post<T>(`/sessions/${sessionId}/smartform/render`, { values }),
  download: (sessionId: string, format: 'docx' | 'pdf') =>
    get<Blob>(`/sessions/${sessionId}/smartform/${format}`, { responseType: 'blob' }),
};

export const insightsApi = {
  dashboard: <T = any>(days?: number) => get<T>('/insights/dashboard', { params: { days } }),
  topErrors: <T = any>(days?: number) => get<T>('/insights/top-errors', { params: { days } }),
  trend: <T = any>(days?: number) => get<T>('/insights/trend', { params: { days } }),
};

export const authApi = {
  login: <T = any>(username: string, password: string) => post<T>('/auth/login', { username, password }),
  register: <T = any>(data: { username: string; password: string; fullName: string }) =>
    post<T>('/auth/register', data),
  registerWithEkyc: <T = any>(
    data: { username: string; password: string; fullName: string },
    front: File,
    back: File,
    selfie: File,
  ) => {
    const fd = new FormData();
    fd.append('username', data.username);
    fd.append('password', data.password);
    fd.append('fullName', data.fullName);
    fd.append('front', front);
    fd.append('back', back);
    fd.append('selfie', selfie);
    return post<T>('/auth/register/ekyc', fd, { timeout: 120000 });
  },
  verifyEkyc: <T = any>(front: File, back: File, selfie: File) => {
    const fd = new FormData();
    fd.append('front', front);
    fd.append('back', back);
    fd.append('selfie', selfie);
    return post<T>('/auth/ekyc/verify', fd, { timeout: 120000 });
  },
};
