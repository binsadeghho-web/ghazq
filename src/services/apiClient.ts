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
  private sessionToken: string = 'demo-session';

  public setAuthContext(_userId: string, _role: string, _name: string, sessionToken?: string): void {
    if (sessionToken) {
      this.sessionToken = sessionToken;
    }
  }

  public setSessionToken(token: string): void {
    this.sessionToken = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    if (this.sessionToken) {
      headers.set('Authorization', `Bearer ${this.sessionToken}`);
    }

    // Attach Idempotency-Key for write operations (Section 6.1)
    if ((options.method === 'POST' || options.method === 'PATCH') && !headers.has('Idempotency-Key')) {
      headers.set('Idempotency-Key', generateClientUUID());
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers,
      });

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

  async reviewCourseEnrollment(enrollmentId: string, status: 'confirmed' | 'rejected', adminNote?: string) {
    return this.request<any>(`/api/courses/enrollments/${enrollmentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNote }),
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

  async getCounselingRequests() {
    return this.request<any[]>('/api/counseling/requests');
  }

  async bookCounseling(data: any) {
    return this.request<any>('/api/counseling/requests', {
      method: 'POST',
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

  // Rulings endpoints
  async getRulings() {
    return this.request<any[]>('/api/rulings');
  }

  async addRulingCritique(rulingId: string, comment: string) {
    return this.request<any>(`/api/rulings/${rulingId}/critique`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  async approveRuling(rulingId: string) {
    return this.request<any>(`/api/rulings/${rulingId}/approve`, { method: 'POST' });
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

  // Admin endpoints
  async getAdminUsers() {
    return this.request<any[]>('/api/admin/users');
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
    return this.request<{ crextio: any; mizan: any; source: string; isConnectedToMysql: boolean }>('/api/admin/dashboard-config');
  }

  async saveDashboardConfig(config: any) {
    return this.request<{ success: boolean; persistedToMysql: boolean }>('/api/admin/dashboard-config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async getMetrics() {
    return this.request<any>('/api/metrics');
  }

  /**
   * Subscribe to real-time Server-Sent Events (SSE) (Section 8)
   * with automatic exponential backoff reconnection.
   */
  public subscribeToEvents(onEvent: (event: { type: string; data: any }) => void): () => void {
    let eventSource: EventSource | null = null;
    let isClosed = false;
    let retryDelay = 1000;

    const connect = () => {
      if (isClosed) return;

      try {
        eventSource = new EventSource('/api/events');

        eventSource.onopen = () => {
          retryDelay = 1000; // Reset backoff upon successful connection
        };

        eventSource.onmessage = e => {
          try {
            const data = JSON.parse(e.data);
            onEvent({ type: 'message', data });
          } catch {
            // ignore non-json messages like heartbeats
          }
        };

        // Listen for domain-specific events
        const domainEvents = [
          'cartable.request_created',
          'cartable.message_added',
          'cartable.status_changed',
          'courses.enrolled',
          'products.purchased',
          'counseling.requested',
          'research.project_submitted',
          'rulings.critique_added',
          'rulings.approved',
          'welfare.requested',
          'welfare.order_placed',
          'synergy.post_created',
          'synergy.response_added',
        ];

        for (const evt of domainEvents) {
          eventSource.addEventListener(evt, (e: any) => {
            try {
              const data = JSON.parse(e.data);
              onEvent({ type: evt, data });
            } catch {
              // ignore parse errors
            }
          });
        }

        eventSource.onerror = () => {
          eventSource?.close();
          if (!isClosed) {
            // Exponential backoff with jitter (Section 8.6)
            const jitter = Math.random() * 500;
            setTimeout(connect, retryDelay + jitter);
            retryDelay = Math.min(retryDelay * 2, 30000);
          }
        };
      } catch {
        // Fallback retry
        setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      isClosed = true;
      eventSource?.close();
    };
  }
}

export const api = new ApiClient();
