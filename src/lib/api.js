/**
 * e-Milap API Client
 * Sends cookies with credentials: 'include' and proxies through Vite (/api/v1).
 * Never stores authentication tokens in localStorage.
 */

const API_BASE = '/api/v1';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    ...options.headers,
  };

  // Only set application/json if body is not FormData or binary
  if (options.body && !(options.body instanceof FormData) && !(options.body instanceof Blob)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Ensures session cookie (foundnear.sid) is sent & received
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.code = data?.error?.code || 'ERROR';
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Authentication & Session
  auth: {
    me: () => request('/auth/me'),
    login: (email, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (displayName, email, password, communitySlug) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ displayName, email, password, communitySlug }),
      }),
    logout: () =>
      request('/auth/logout', {
        method: 'POST',
      }),
  },

  // Communities
  communities: {
    list: () => request('/communities'),
    get: (id) => request(`/communities/${id}`),
    create: (data) =>
      request('/communities', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    join: (id) =>
      request(`/communities/${id}/join`, {
        method: 'POST',
      }),
  },

  // Lost & Found Reports
  reports: {
    list: (params = {}) => {
      const q = new URLSearchParams();
      if (params.type) q.append('type', params.type);
      if (params.status) q.append('status', params.status);
      if (params.communityId) q.append('communityId', params.communityId);
      if (params.search) q.append('search', params.search);
      if (params.category) q.append('category', params.category);
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      return request(`/reports${queryStr}`);
    },
    get: (id) => request(`/reports/${id}`),
    create: (reportData) =>
      request('/reports', {
        method: 'POST',
        body: JSON.stringify(reportData),
      }),
    update: (id, updateData) =>
      request(`/reports/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      }),
    close: (id) =>
      request(`/reports/${id}/close`, {
        method: 'POST',
      }),
  },

  // Uploads
  uploads: {
    uploadReportImage: async (file) => {
      // Read file as base64 for reliable transmission
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      return request('/uploads/report-image', {
        method: 'POST',
        body: JSON.stringify({
          mimeType: file.type || 'image/jpeg',
          byteSize: file.size,
          base64,
        }),
      });
    },
    uploadClaimEvidence: async (file) => {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      return request('/uploads/claim-evidence', {
        method: 'POST',
        body: JSON.stringify({
          mimeType: file.type || 'image/jpeg',
          byteSize: file.size,
          base64,
        }),
      });
    },
  },

  // Matches
  matches: {
    list: (communityId) => {
      const qs = communityId ? `?communityId=${communityId}` : '';
      return request(`/matches${qs}`);
    },
    get: (id) => request(`/matches/${id}`),
    dismiss: (id, status = 'DISMISSED') =>
      request(`/matches/${id}/dismiss`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      }),
  },

  // Ownership Claims
  claims: {
    list: () => request('/claims'),
    get: (id) => request(`/claims/${id}`),
    create: (claimData) =>
      request('/claims', {
        method: 'POST',
        body: JSON.stringify(claimData),
      }),
    getEvidenceUrl: (id) => request(`/claims/${id}/evidence-url`),
    decision: (id, decision, reason) =>
      request(`/claims/${id}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision, reason }),
      }),
  },

  // Notifications
  notifications: {
    list: () => request('/notifications'),
    unreadCount: () => request('/notifications/unread-count'),
    markRead: (id) =>
      request(`/notifications/${id}/read`, {
        method: 'POST',
      }),
    markAllRead: () =>
      request('/notifications/read-all', {
        method: 'POST',
      }),
  },

  // Assistant / Chatbot
  chat: {
    send: (message, communityId) =>
      request('/chat', {
        method: 'POST',
        body: JSON.stringify({ message, communityId }),
      }),
  },

  // Moderation / Admin
  admin: {
    getStats: (communityId) => {
      const qs = communityId ? `?communityId=${communityId}` : '';
      return request(`/admin/stats${qs}`);
    },
    getReports: (communityId) => {
      const qs = communityId ? `?communityId=${communityId}` : '';
      return request(`/admin/reports${qs}`);
    },
    reportAction: (id, action, reason) =>
      request(`/admin/reports/${id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action, reason }),
      }),
    getClaims: () => request('/admin/claims'),
    getAuditLogs: () => request('/admin/audit-logs'),
  },
};
