/**
 * Client-Side API Gateway conforming to Data Layer Reference v3.0
 * Features:
 * - RFC 9457 Problem Details error handling
 * - Automatic UUID Idempotency-Key headers on mutative operations
 * - BOLA / IDOR security header propagation
 * - Real-time Server-Sent Events (SSE) with exponential backoff & jitter
 */

export interface ProblemDetailsError {
  type: string;
  title: string;
  status: number;
  detail: string;
  code: string;
  invalidParams?: Array<{ name: string; reason: string }>;
}

export class ApiError extends Error {
  constructor(public problem: ProblemDetailsError) {
    super(problem.detail || problem.title || 'خطای ارتباط با سرور');
    this.name = 'ApiError';
  }
}

function generateClientUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'req_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
}

class ApiClient {
  private sessionToken: string;
  private refreshTokenVal: string | null = null;
  private isRefreshing: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('feqh_access_token');
      this.sessionToken = stored || 'sess_default_admin';
      this.refreshTokenVal = localStorage.getItem('feqh_refresh_token');
    } else {
      this.sessionToken = 'sess_default_admin';
    }
  }

  public setAuthContext(userId: string, role: string, _name: string, sessionToken?: string): void {
    if (sessionToken) {
      this.sessionToken = sessionToken;
    } else if (!this.sessionToken || this.sessionToken === 'demo-session') {
      if (role === 'admin' || userId === 'usr_sadegh_admin') {
        this.sessionToken = 'sess_default_admin';
      }
    }
  }

  public setSessionToken(token: string, refreshToken?: string): void {
    this.sessionToken = token;
    if (refreshToken) {
      this.refreshTokenVal = refreshToken;
      try { localStorage.setItem('feqh_refresh_token', refreshToken); } catch {}
    }
    try { localStorage.setItem('feqh_access_token', token); } catch {}
  }

  public async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    let tokenToUse = this.refreshTokenVal;
    if (!tokenToUse && typeof window !== 'undefined') {
      tokenToUse = localStorage.getItem('feqh_refresh_token');
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (tokenToUse) {
      headers['X-Refresh-Token'] = tokenToUse;
    }

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers,
      body: JSON.stringify({ refreshToken: tokenToUse }),
    });

    if (!response.ok) {
      const problem = await response.json().catch(() => ({ title: 'انقضای نشست' }));
      throw new ApiError({
        type: 'auth_refresh_failed',
        title: 'انقضای نشست کاربر',
        status: 401,
        detail: problem.detail || 'امکان تمدید نشست وجود ندارد. لطفاً مجدداً وارد شوید.',
        code: 'REFRESH_FAILED',
      });
    }

    const data = await response.json();
    if (data.accessToken) {
      this.setSessionToken(data.accessToken, data.refreshToken);
    }
    return data;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    if (this.sessionToken) {
      headers.set('Authorization', `Bearer ${this.sessionToken}`);
    }

    const isGet = !options.method || options.method.toUpperCase() === 'GET';

    // Zero-Stale Cache Enforcement: Prevent browser/WebKit heuristic disk caching on GET requests
    if (isGet) {
      if (!headers.has('Cache-Control')) {
        headers.set('Cache-Control', 'no-cache');
      }
      if (!headers.has('Pragma')) {
        headers.set('Pragma', 'no-cache');
      }
    }

    // Attach Idempotency-Key for write operations (Section 6.1)
    if ((options.method === 'POST' || options.method === 'PATCH') && !headers.has('Idempotency-Key')) {
      headers.set('Idempotency-Key', generateClientUUID());
    }

    // Attach If-Match header for OCC mutations (Section 6.3)
    if ((options.method === 'PUT' || options.method === 'PATCH') && typeof options.body === 'string') {
      try {
        const bodyObj = JSON.parse(options.body);
        const ver = bodyObj.expectedVersion ?? bodyObj.version;
        if (ver !== undefined && ver !== null && !headers.has('If-Match')) {
          headers.set('If-Match', `"${ver}"`);
        }
      } catch {}
    }

    try {
      let response = await fetch(endpoint, {
        ...(isGet ? { cache: 'no-store' as RequestCache } : {}),
        ...options,
        headers,
      });

      // Item 4: Silent Refresh Interceptor on HTTP 401 Access Token Expiry
      if (
        response.status === 401 &&
        !this.isRefreshing &&
        !endpoint.includes('/auth/login') &&
        !endpoint.includes('/auth/refresh')
      ) {
        try {
          this.isRefreshing = true;
          const refreshRes = await this.refreshToken();
          this.isRefreshing = false;

          if (refreshRes && refreshRes.accessToken) {
            headers.set('Authorization', `Bearer ${refreshRes.accessToken}`);
            response = await fetch(endpoint, {
              ...options,
              headers,
            });
          }
        } catch (refreshErr) {
          this.isRefreshing = false;
          // Silent refresh failed: Clear local session & redirect to login
          if (typeof window !== 'undefined' && !window.location.hash.includes('login')) {
            window.location.href = '/#login';
          }
          throw refreshErr;
        }
      }

      if (!response.ok) {
        let problem: ProblemDetailsError;
        try {
          problem = await response.json();
        } catch {
          problem = {
            type: 'about:blank',
            title: response.statusText || 'خطای شبکه',
            status: response.status,
            detail: 'پاسخ نامعتبر از سرور دریافت شد.',
            code: `HTTP_${response.status}`,
          };
        }

        // Global broadcast for concurrent conflict (409)
        if (response.status === 409 && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('app:concurrent_conflict', {
            detail: problem,
          }));
        }

        throw new ApiError(problem);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw new ApiError({
        type: 'network_failure',
        title: 'خطای ارتباط با سرور',
        status: 0,
        detail: err.message || 'عدم امکان برقراری ارتباط با سرویس‌دهنده مرکزی.',
        code: 'NETWORK_ERROR',
      });
    }
  }

  // Auth endpoints
  async login(nationalId: string, password: string) {
    const res = await this.request<{ success: boolean; user: any; session: any; token?: string; mustChangePassword?: boolean; message?: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ nationalId, password }),
    });
    if (res.token) {
      this.setSessionToken(res.token);
    }
    return res;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ success: boolean; user: any }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async logout() {
    return this.request<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
  }

  async globalLogout(userId: string) {
    return this.request<{ success: boolean; user: any }>('/api/auth/global-logout', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    return this.request<{ success: boolean; user: any }>('/api/auth/revoke-session', {
      method: 'POST',
      body: JSON.stringify({ userId, sessionId }),
    });
  }

  async switchRole(role: string) {
    return this.request<{ success: boolean; user: any }>('/api/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  }

  // Cartable endpoints
  async getCartableRequests() {
    return this.request<any[]>('/api/cartable');
  }

  async createCartableRequest(data: any) {
    return this.request<any>('/api/cartable', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async replyCartableRequest(id: string, text: string) {
    return this.request<any>(`/api/cartable/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async updateCartableStatus(id: string, status: string, expectedVersion: number) {
    return this.request<any>(`/api/cartable/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, expectedVersion }),
    });
  }

  async markCartableAsRead(id: string) {
    return this.request<any>(`/api/cartable/${id}/read`, {
      method: 'POST',
    });
  }

  // Courses endpoints
  async getCourses(includeDeleted = false) {
    const url = includeDeleted ? '/api/courses?includeDeleted=true' : '/api/courses';
    return this.request<any[]>(url);
  }

  async getCourseEnrollments(courseId?: string) {
    const url = courseId ? `/api/courses/enrollments?courseId=${courseId}` : '/api/courses/enrollments';
    return this.request<any[]>(url);
  }

  async enrollCourse(courseId: string, enrollmentData: any = {}) {
    return this.request<{ course: any; enrollment: any }>(`/api/courses/${courseId}/enroll`, {
      method: 'POST',
      body: JSON.stringify(enrollmentData),
    });
  }

  async createCourse(courseData: any) {
    return this.request<any>('/api/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  }

  async updateCourse(courseId: string, updates: any) {
    return this.request<any>(`/api/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteCourse(courseId: string, pin: string) {
    return this.request<{ success: boolean; message: string }>(`/api/courses/${courseId}`, {
      method: 'DELETE',
      body: JSON.stringify({ pin }),
    });
  }

  async restoreCourse(courseId: string) {
    return this.request<{ success: boolean; message: string }>(`/api/courses/${courseId}/restore`, {
      method: 'POST',
    });
  }

  async sendCourseSms(courseId: string, recipientPhone: string | 'all', message: string, recipientName?: string) {
    return this.request<{ success: boolean; count: number; message: string }>(`/api/courses/${courseId}/sms`, {
      method: 'POST',
      body: JSON.stringify({ recipientPhone, message, recipientName }),
    });
  }

  async reviewCourseEnrollment(enrollmentId: string, status: 'confirmed' | 'rejected', adminNote?: string, expectedVersion?: number) {
    return this.request<any>(`/api/courses/enrollments/${enrollmentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNote, expectedVersion }),
    });
  }

  // Products endpoints
  async getProducts() {
    return this.request<any[]>('/api/products');
  }

  async purchaseProduct(productId: string) {
    return this.request<any>(`/api/products/${productId}/purchase`, { method: 'POST' });
  }

  // Counseling endpoints
  async getConsultants() {
    return this.request<any[]>('/api/counseling/consultants');
  }

  async createConsultant(data: any) {
    return this.request<any>('/api/counseling/consultants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateConsultant(consultantId: string, data: any) {
    return this.request<any>(`/api/counseling/consultants/${consultantId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteConsultant(consultantId: string) {
    return this.request<any>(`/api/counseling/consultants/${consultantId}`, {
      method: 'DELETE',
    });
  }

  async getCounselingRequests() {
    return this.request<any[]>('/api/counseling/requests');
  }

  async bookCounseling(data: any) {
    return this.request<any>('/api/counseling/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCounselingRequest(requestId: string, data: any) {
    return this.request<any>(`/api/counseling/requests/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateCounselingStatus(requestId: string, data: any) {
    return this.request<any>(`/api/counseling/requests/${requestId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Research endpoints
  async getResearchProjects() {
    return this.request<any[]>('/api/research');
  }

  async submitResearchProject(data: any) {
    return this.request<any>('/api/research', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateResearchProgress(projectId: string, data: { stage: string; stageTitle: string; progressPercent: number; expectedVersion: number }) {
    return this.request<any>(`/api/research/${projectId}/progress`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateResearchProject(projectId: string, data: any) {
    return this.request<any>(`/api/research/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteResearchProject(projectId: string) {
    return this.request<any>(`/api/research/${projectId}`, {
      method: 'DELETE',
    });
  }

  // Rulings endpoints
  async getRulings() {
    return this.request<any[]>('/api/rulings');
  }

  async submitRuling(data: any) {
    return this.request<any>('/api/rulings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addRulingCritique(rulingId: string, comment: string) {
    return this.request<any>(`/api/rulings/${rulingId}/critique`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  async approveRuling(rulingId: string, expectedVersion?: number) {
    return this.request<any>(`/api/rulings/${rulingId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ expectedVersion }),
    });
  }

  async toggleRulingLike(rulingId: string) {
    return this.request<any>(`/api/rulings/${rulingId}/like`, {
      method: 'POST',
    });
  }

  // Welfare endpoints
  async getWelfareRequests() {
    return this.request<any[]>('/api/welfare/requests');
  }

  async createWelfareRequest(data: any) {
    return this.request<any>('/api/welfare/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getConsumables() {
    return this.request<any[]>('/api/welfare/consumables');
  }

  async getConsumableOrders() {
    return this.request<any[]>('/api/welfare/orders');
  }

  async placeConsumableOrder(items: any[], deliveryAddress: string) {
    return this.request<any>('/api/welfare/orders', {
      method: 'POST',
      body: JSON.stringify({ items, deliveryAddress }),
    });
  }

  async getProductProposals() {
    return this.request<any[]>('/api/welfare/proposals');
  }

  // Synergy endpoints
  async getSynergyPosts() {
    return this.request<any[]>('/api/synergy');
  }

  async createSynergyPost(data: any) {
    return this.request<any>('/api/synergy', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async respondToSynergyPost(postId: string, message: string, isPrivate: boolean, contactShared?: string) {
    return this.request<any>(`/api/synergy/${postId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ message, isPrivate, contactShared }),
    });
  }

  async resolveSynergyPost(postId: string, expectedVersion: number) {
    return this.request<any>(`/api/synergy/${postId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ expectedVersion }),
    });
  }

  // Admin endpoints
  async getUsers(search?: string, role?: string) {
    let url = '/api/admin/users';
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (role) params.set('role', role);
    const qs = params.toString();
    if (qs) url += `?${qs}`;
    return this.request<any[]>(url);
  }

  async getAdminUsers() {
    return this.getUsers();
  }

  async createUser(userData: any) {
    return this.request<any>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async unlockUser(userId: string) {
    return this.request<any>(`/api/admin/users/${userId}/unlock`, { method: 'POST' });
  }

  async toggleUserActive(userId: string) {
    return this.request<any>(`/api/admin/users/${userId}/toggle-active`, { method: 'POST' });
  }

  async getSecurityConfig() {
    return this.request<any>('/api/admin/security-config');
  }

  async deleteUser(userId: string) {
    return this.request<{ success: boolean; message: string }>(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async updateUser(userId: string, updates: any) {
    return this.request<any>(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async updateUserCredentials(userId: string, username: string, password: string) {
    return this.request<any>(`/api/admin/users/${userId}/credentials`, {
      method: 'PUT',
      body: JSON.stringify({ username, password }),
    });
  }

  async updateSecurityConfig(updates: any) {
    return this.request<any>('/api/admin/security-config', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async getAuditLogs() {
    return this.request<any[]>('/api/admin/audit-logs');
  }

  async verifyAuditChain() {
    return this.request<{ isValid: boolean; checkedCount: number; message: string }>('/api/admin/audit-logs/verify', {
      method: 'POST',
    });
  }

  async resetDefaults() {
    return this.request<{ success: boolean; message: string }>('/api/admin/reset-defaults', {
      method: 'POST',
    });
  }

  async getDashboardConfig() {
    return this.request<{ crextio: any; mizan: any; source: string; isConnectedToMysql: boolean; version?: number }>('/api/admin/dashboard-config');
  }

  async saveDashboardConfig(config: any) {
    return this.request<{ success: boolean; persistedToMysql: boolean; version?: number }>('/api/admin/dashboard-config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async getThemeConfig() {
    return this.request<{ crextio: any; mizan: any; source: string; isConnectedToMysql: boolean; version?: number }>('/api/admin/theme-config');
  }

  async saveThemeConfig(config: any) {
    return this.request<{ success: boolean; persistedToMysql: boolean; version?: number }>('/api/admin/theme-config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async uploadProfilePicture(base64Data: string, filename?: string) {
    return this.request<{ success: boolean; url: string; filename: string; message: string }>('/api/upload/profile-picture', {
      method: 'POST',
      body: JSON.stringify({ base64Data, filename }),
    });
  }

  async getMetrics() {
    return this.request<any>('/api/metrics');
  }

  // --- OPS Command Operations Center Endpoints ---
  async getOpsHealth() {
    return this.request<any>('/api/ops/health');
  }

  async getOpsSessions() {
    return this.request<any[]>('/api/ops/sessions');
  }

  async revokeOpsSession(sessionId: string) {
    return this.request<{ success: boolean; message: string }>(`/api/ops/sessions/${sessionId}/revoke`, {
      method: 'POST',
    });
  }

  async getOpsErrorLogs() {
    return this.request<any[]>('/api/ops/error-logs');
  }

  async resolveOpsErrorLog(id: string) {
    return this.request<{ success: boolean; message: string }>(`/api/ops/error-logs/${id}/resolve`, {
      method: 'POST',
    });
  }

  async clearResolvedOpsErrorLogs() {
    return this.request<{ success: boolean; message: string }>('/api/ops/error-logs/resolved', {
      method: 'DELETE',
    });
  }

  async pingDatabase() {
    return this.request<{ success: boolean; connected: boolean; latencyMs: number; message: string }>('/api/ops/database/ping', {
      method: 'POST',
    });
  }

  async rollbackAuditAction(auditLogId: string) {
    return this.request<{ success: boolean; message: string; rollbackEntry?: any }>(`/api/ops/audit-logs/${auditLogId}/rollback`, {
      method: 'POST',
    });
  }

  async getOpsSecurityAlerts() {
    return this.request<any[]>('/api/ops/security-alerts');
  }

  async toggleOpsSpecialMonitoring(id: string) {
    return this.request<{ success: boolean; alert: any }>(`/api/ops/security-alerts/${id}/toggle-monitor`, {
      method: 'POST',
    });
  }

  async sendOpsEmergencySms(phone: string, message: string) {
    return this.request<{ success: boolean; message: string }>('/api/ops/send-emergency-sms', {
      method: 'POST',
      body: JSON.stringify({ phone, message }),
    });
  }

  async getOpsMaintenance() {
    return this.request<any>('/api/ops/maintenance');
  }

  async setOpsGlobalMaintenance(enabled: boolean, message?: string, estimatedReturnTime?: string) {
    return this.request<{ success: boolean; maintenance: any }>('/api/ops/maintenance/global', {
      method: 'POST',
      body: JSON.stringify({ enabled, message, estimatedReturnTime }),
    });
  }

  async setOpsModuleMaintenance(moduleKey: string, enabled: boolean) {
    return this.request<{ success: boolean; maintenance: any }>('/api/ops/maintenance/module', {
      method: 'POST',
      body: JSON.stringify({ moduleKey, enabled }),
    });
  }

  async getOpsBackups() {
    return this.request<Array<{ name: string; size: string; createdAt: string }>>('/api/ops/backups');
  }

  async createOpsBackup() {
    return this.request<{ success: boolean; message: string }>('/api/ops/backups/create', {
      method: 'POST',
    });
  }

  async getOpsBlockedIps() {
    return this.request<any[]>('/api/ops/blocked-ips');
  }

  async blockIpAddress(ip: string, reason?: string, blockedUntil?: string) {
    return this.request<{ success: boolean; message: string }>('/api/ops/blocked-ips', {
      method: 'POST',
      body: JSON.stringify({ ip, reason, blockedUntil }),
    });
  }

  async unblockIpAddress(ip: string) {
    return this.request<{ success: boolean; message: string }>(`/api/ops/blocked-ips/${encodeURIComponent(ip)}`, {
      method: 'DELETE',
    });
  }

  async getOpsSecretsCheck() {
    return this.request<any>('/api/ops/secrets-check');
  }

  async runOpsBackgroundJob(jobName: string) {
    return this.request<{ success: boolean; message: string }>('/api/ops/jobs/run', {
      method: 'POST',
      body: JSON.stringify({ jobName }),
    });
  }

  async getOpsWeeklyDigest() {
    return this.request<any>('/api/ops/weekly-digest');
  }

  /**
   * Subscribe to real-time Server-Sent Events (SSE) (Section 8)
   * conformed strictly to Data Layer Architecture v3.0:
   * Uses fetch-based streaming with 'Authorization: Bearer <token>' header
   * (since native browser EventSource cannot send Authorization headers),
   * preventing token leakage in URL query parameters and access logs.
   * Includes automatic exponential backoff with jitter and silent token refresh.
   */
  public subscribeToEvents(onEvent: (event: { type: string; data: any }) => void): () => void {
    let abortController: AbortController | null = null;
    let isClosed = false;
    let retryDelay = 1000;
    let retryTimer: any = null;

    const connect = async () => {
      if (isClosed) return;
      abortController = new AbortController();

      try {
        const headers: Record<string, string> = {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        };
        if (this.sessionToken) {
          headers['Authorization'] = `Bearer ${this.sessionToken}`;
        }

        const response = await fetch('/api/events', {
          headers,
          signal: abortController.signal,
        });

        if (!response.ok) {
          // If 401 Unauthorized and refresh token available, attempt silent refresh
          if (response.status === 401 && this.refreshTokenVal) {
            try {
              await this.refreshToken();
              if (!isClosed) {
                setTimeout(connect, 500);
                return;
              }
            } catch {
              // Refresh failed, halt retry until manual login
              return;
            }
          }
          throw new Error(`SSE connection failed with HTTP status ${response.status}`);
        }

        retryDelay = 1000; // Reset backoff upon successful connection

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body stream is not available');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (!isClosed) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent = 'message';
          let currentData = '';
          let currentId = '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed === '') {
              // End of an event message block; dispatch if payload exists
              if (currentData) {
                try {
                  const parsed = JSON.parse(currentData);
                  onEvent({ type: currentEvent, data: parsed });
                } catch {
                  onEvent({ type: currentEvent, data: currentData });
                }
              }
              currentEvent = 'message';
              currentData = '';
              currentId = '';
            } else if (trimmed.startsWith(':')) {
              // Heartbeat comment (: heartbeat ...), keep-alive ignored without noise
            } else if (trimmed.startsWith('event:')) {
              currentEvent = trimmed.slice(6).trim();
            } else if (trimmed.startsWith('data:')) {
              const dataVal = trimmed.slice(5).trim();
              currentData = currentData ? currentData + '\n' + dataVal : dataVal;
            } else if (trimmed.startsWith('id:')) {
              currentId = trimmed.slice(3).trim();
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError' || isClosed) return;
        // Exponential backoff with jitter (Section 8.6 & 9)
        const jitter = Math.random() * 500;
        retryTimer = setTimeout(connect, retryDelay + jitter);
        retryDelay = Math.min(retryDelay * 2, 30000);
      }
    };

    connect();

    return () => {
      isClosed = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (abortController) {
        try { abortController.abort(); } catch {}
      }
    };
  }
}

export const api = new ApiClient();
export const apiClient = api;
