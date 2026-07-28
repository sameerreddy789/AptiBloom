const TOKEN_KEY = 'aptibloom_session';

export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body !== undefined && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  const response = await fetch(path, {
    ...options,
    headers,
    body: options.body !== undefined && !(options.body instanceof FormData)
      ? JSON.stringify(options.body)
      : options.body
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    const error = payload?.error || {};
    throw new ApiError(error.message || `Request failed with status ${response.status}.`, response.status, error.code, error.details);
  }
  return payload;
}

export const api = {
  health: () => request('/api/health'),
  createSession: (body) => request('/api/auth/session', { method: 'POST', body }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  bootstrap: () => request('/api/bootstrap'),
  updateProfile: (body) => request('/api/profile', { method: 'PATCH', body }),
  updateSettings: (body) => request('/api/settings', { method: 'PATCH', body }),
  createMission: (body) => request('/api/missions', { method: 'POST', body }),
  getMission: (id) => request(`/api/missions/${encodeURIComponent(id)}`),
  requestHint: (id, body) => request(`/api/missions/${encodeURIComponent(id)}/hint`, { method: 'POST', body }),
  submitAttempt: (id, body) => request(`/api/missions/${encodeURIComponent(id)}/attempt`, { method: 'POST', body }),
  completeMission: (id) => request(`/api/missions/${encodeURIComponent(id)}/complete`, { method: 'POST' }),
  createAssessment: () => request('/api/assessments', { method: 'POST' }),
  getAssessment: (id) => request(`/api/assessments/${encodeURIComponent(id)}`),
  submitAssessment: (id, body) => request(`/api/assessments/${encodeURIComponent(id)}/submit`, { method: 'POST', body }),
  toggleBookmark: (questionId) => request(`/api/questions/${encodeURIComponent(questionId)}/bookmark`, { method: 'POST' }),
  reportQuestion: (questionId, reason) => request(`/api/questions/${encodeURIComponent(questionId)}/report`, { method: 'POST', body: { reason } }),
  getContent: () => request('/api/content'),
  recordEvent: (name, properties = {}) => request('/api/events', { method: 'POST', body: { name, properties } }).catch(() => null),
  exportData: () => request('/api/export'),
  deleteAccount: (confirmation) => request('/api/account', { method: 'DELETE', body: { confirmation } })
};
