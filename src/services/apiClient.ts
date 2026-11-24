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
      this.sessionToken = stored || '';
      this.refreshTokenVal = localStorage.getItem('feqh_refresh_token');
    } else {
      this.sessionToken = '';
    }
  }

  public setAuthContext(_userId: string, _role: string, _name: string, sessionToken?: string, refreshToken?: string): void {
    if (sessionToken) {
      this.setSessionToken(sessionToken, refreshToken);
    }
  }

  public clearSession(): void {
    this.sessionToken = '';
    this.refreshTokenVal = null;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('feqh_access_token');
        localStorage.removeItem('feqh_refresh_token');
        localStorage.removeItem('feqh_current_user');
      } catch {}
    }
  }

  public setSessionToken(token: string, refreshToken?: string): void {
    this.sessionToken = token;
    if (refreshToken) {
      this.refreshTokenVal = refreshToken;
      try { localStorage.setItem('feqh_refresh_token', refreshToken); } catch {}
    }
    try {
      if (token) {
        localStorage.setItem('feqh_access_token', token);
      } else {
        localStorage.removeItem('feqh_access_token');
      }
    } catch {}
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
        !endpoint.includes('/auth/refresh') &&
        (this.refreshTokenVal || (typeof window !== 'undefined' && !!localStorage.getItem('feqh_refresh_token')))
      ) {
        try {
          this.isRefreshing = true;
          const refreshRes = await this.refreshToken();
          this.isRefreshing = false;

          if (refreshRes && refreshRes.accessToken) {
            headers.set('Authorization', `Bearer ${refreshRes.accessToken}`);
            response = await fetch(endpoint, {
              ...(isGet ? { cache: 'no-store' as RequestCache } : {}),
              ...options,
              headers,
            });
          }
        } catch (refreshErr) {
          this.isRefreshing = false;
          this.clearSession();
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
    const res = await this.request<{
      success: boolean;
      user: any;
      session: any;
      token?: string;
      accessToken?: string;
      refreshToken?: string;
      mustChangePassword?: boolean;
      message?: string;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ nationalId, password }),
    });
    const accessTok = res.accessToken || res.token;
    if (accessTok) {
      this.setSessionToken(accessTok, res.refreshToken);
    }
    return res;
  }

  async getMe() {
    return this.request<{ success: boolean; user: any; mustChangePassword?: boolean }>('/api/auth/me');
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ success: boolean; user: any }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async logout() {
    try {
      return await this.request<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
    } finally {
      this.clearSession();
    }
  }

  // Self-service Alumni Identity Card & Global Completion Settings (Reform 56)
  async getAlumniProfileSettings() {
    return this.request<{
      allowAlumniProfileCompletion: boolean;
      noticeText?: string;
      updatedBy?: string;
      updatedAt?: string;
      version: number;
    }>('/api/users/alumni-profile-settings');
  }

  async updateAlumniProfileSettings(data: {
    allowAlumniProfileCompletion: boolean;
    noticeText?: string;
    expectedVersion: number;
  }) {
    return this.request<any>('/api/users/alumni-profile-settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getMyIdentity() {
    return this.request<{ user: any; settings: any }>('/api/users/me/identity');
  }

  async updateMyIdentity(updates: Record<string, any>, expectedVersion: number) {
    return this.request<{ user: any; settings: any }>('/api/users/me/identity', {
      method: 'PUT',
      body: JSON.stringify({ ...updates, expectedVersion }),
    });
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

  async replyCartableRequest(id: string, text: string, attachments?: string[]) {
    return this.request<any>(`/api/cartable/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ text, attachments }),
    });
  }

  async referCartableRequest(id: string, data: { referredDepartment: string; internalReferralNote?: string; status?: string; expectedVersion: number }) {
    return this.request<any>(`/api/cartable/${id}/referral`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateCartableReferral(id: string, data: { referredDepartment: string; internalReferralNote?: string; status?: string; expectedVersion: number }) {
    return this.referCartableRequest(id, data);
  }

  async uploadCartableAttachment(id: string, fileUrl: string, expectedVersion?: number) {
    return this.request<any>(`/api/cartable/${id}/attachments`, {
      method: 'POST',
      body: JSON.stringify({ fileUrl, expectedVersion }),
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

  async getCartableConfig() {
    return this.request<{
      categories: any[];
      categoriesDisabled?: boolean;
      guide: any;
      followableTopics?: any;
      officials: any[];
    }>('/api/cartable/config');
  }

  async updateCartableGuide(guide: any) {
    return this.request<{ success: boolean; guide: any }>('/api/cartable/config/guide', {
      method: 'PUT',
      body: JSON.stringify({ guide }),
    });
  }

  async updateCartableCategories(categories: any[], categoriesDisabled?: boolean) {
    return this.request<{ success: boolean; categories: any[]; categoriesDisabled?: boolean }>('/api/cartable/config/categories', {
      method: 'PUT',
      body: JSON.stringify({ categories, categoriesDisabled }),
    });
  }

  async updateCartableFollowableTopics(followableTopics: {
    enabled?: boolean;
    buttonLabel?: string;
    title: string;
    subtitle?: string;
    items: any[];
  }) {
    return this.request<{ success: boolean; followableTopics: any }>('/api/cartable/config/followable-topics', {
      method: 'PUT',
      body: JSON.stringify({ followableTopics }),
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

  async removeCourseEnrollmentFromClass(
    courseId: string,
    enrollmentId: string,
    reason?: string,
    expectedVersion?: number
  ) {
    return this.request<{ enrollment: any; course: any }>(
      `/api/courses/${courseId}/enrollments/${enrollmentId}/remove-from-class`,
      {
        method: 'POST',
        body: JSON.stringify({ reason, expectedVersion }),
      }
    );
  }

  async restoreCourseEnrollmentToClass(
    courseId: string,
    enrollmentId: string,
    expectedVersion?: number
  ) {
    return this.request<{ enrollment: any; course: any }>(
      `/api/courses/${courseId}/enrollments/${enrollmentId}/restore-to-class`,
      {
        method: 'POST',
        body: JSON.stringify({ expectedVersion }),
      }
    );
  }

  // Products endpoints (Books, Multimedia & Audio Store - Reforms 23-30)
  async getProducts() {
    return this.request<any[]>('/api/products');
  }

  async getProductsStoreConfig() {
    return this.request<any>('/api/products/store-config');
  }

  async updateProductsStoreConfig(config: any, expectedVersion?: number) {
    return this.request<{ success: boolean; config: any }>('/api/products/store-config', {
      method: 'PUT',
      body: JSON.stringify({ config, expectedVersion: expectedVersion ?? config?.version }),
    });
  }

  async createProduct(productData: any) {
    return this.request<any>('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(productId: string, updates: any, expectedVersion?: number) {
    return this.request<any>(`/api/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...updates,
        expectedVersion: expectedVersion ?? updates?.expectedVersion ?? updates?.version,
      }),
    });
  }

  async deleteProduct(productId: string, expectedVersion?: number) {
    return this.request<{ success: boolean; id: string }>(`/api/products/${productId}`, {
      method: 'DELETE',
      body: JSON.stringify({ expectedVersion }),
    });
  }

  async toggleProductShowcase(productId: string, showInShowcase: boolean, expectedVersion?: number) {
    return this.request<any>(`/api/products/${productId}/showcase`, {
      method: 'PATCH',
      body: JSON.stringify({ showInShowcase, expectedVersion }),
    });
  }

  async reorderProducts(orderedIds: string[]) {
    return this.request<{ success: boolean; orderedIds: string[] }>('/api/products/reorder', {
      method: 'PUT',
      body: JSON.stringify({ orderedIds }),
    });
  }

  async getProductOrders() {
    return this.request<any[]>('/api/products/orders');
  }

  async purchaseProduct(productId: string, payload?: any) {
    return this.request<{ product: any; order: any }>(`/api/products/${productId}/purchase`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  }

  async reviewProductOrder(
    orderId: string,
    status: 'confirmed' | 'rejected',
    expectedVersion?: number,
    adminNote?: string,
    postalTrackingCode?: string,
    shippingStatus?: string
  ) {
    return this.request<{ success: boolean; order: any }>(`/api/products/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, expectedVersion, adminNote, postalTrackingCode, shippingStatus }),
    });
  }

  // Counseling endpoints
  async getConsultants(type?: string) {
    const qs = type ? `?type=${encodeURIComponent(type)}` : '';
    return this.request<any[]>(`/api/counseling/consultants${qs}`);
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

  async getCounselingRequests(type?: string) {
    const qs = type ? `?type=${encodeURIComponent(type)}` : '';
    return this.request<any[]>(`/api/counseling/requests${qs}`);
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

  async deleteCounselingRequest(requestId: string) {
    return this.request<{ success: boolean; id: string }>(`/api/counseling/requests/${requestId}`, {
      method: 'DELETE',
    });
  }

  // Counseling Portal Config, Fields (زمینه‌های مشاوره), Tariffs & Psychological Tests
  async getCounselingPortalConfig(type: 'general' | 'specialized_career') {
    return this.request<any>(`/api/counseling/config/${type}`);
  }

  async updateCounselingPortalConfig(type: 'general' | 'specialized_career', config: any, expectedVersion?: number) {
    return this.request<any>(`/api/counseling/config/${type}`, {
      method: 'PUT',
      body: JSON.stringify({ ...config, expectedVersion: expectedVersion ?? config?.version }),
    });
  }

  async getCounselingFields(type?: 'general' | 'specialized_career', includeInactive = false) {
    const qs = new URLSearchParams();
    if (type) qs.set('type', type);
    if (includeInactive) qs.set('includeInactive', 'true');
    const q = qs.toString();
    return this.request<any[]>(`/api/counseling/fields${q ? `?${q}` : ''}`);
  }

  async createCounselingField(data: any) {
    return this.request<any>('/api/counseling/fields', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCounselingField(id: string, data: any, expectedVersion: number) {
    return this.request<any>(`/api/counseling/fields/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, expectedVersion }),
    });
  }

  async deleteCounselingField(id: string) {
    return this.request<{ success: boolean; id: string }>(`/api/counseling/fields/${id}`, {
      method: 'DELETE',
    });
  }

  async getCounselingTariffs(includeInactive = false) {
    const qs = includeInactive ? '?includeInactive=true' : '';
    return this.request<any[]>(`/api/counseling/tariffs${qs}`);
  }

  async createCounselingTariff(data: any) {
    return this.request<any>('/api/counseling/tariffs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCounselingTariff(id: string, data: any, expectedVersion: number) {
    return this.request<any>(`/api/counseling/tariffs/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, expectedVersion }),
    });
  }

  async deleteCounselingTariff(id: string) {
    return this.request<{ success: boolean; id: string }>(`/api/counseling/tariffs/${id}`, {
      method: 'DELETE',
    });
  }

  async getPsychologicalTests() {
    return this.request<any[]>('/api/counseling/tests');
  }

  async createPsychologicalTest(data: any) {
    return this.request<any>('/api/counseling/tests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePsychologicalTest(id: string, data: any, expectedVersion: number) {
    return this.request<any>(`/api/counseling/tests/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, expectedVersion }),
    });
  }

  async deletePsychologicalTest(id: string) {
    return this.request<{ success: boolean; id: string }>(`/api/counseling/tests/${id}`, {
      method: 'DELETE',
    });
  }

  async getPsychologicalTestAssignments(userId?: string) {
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return this.request<any[]>(`/api/counseling/test-assignments${qs}`);
  }

  async assignPsychologicalTest(data: {
    testId?: string;
    externalTestUrl?: string;
    externalTestTitle?: string;
    isVisibleToUser?: boolean;
    userId: string;
    userName: string;
    userNationalId?: string;
    requestId?: string;
    adminNote?: string;
  }) {
    return this.request<any>('/api/counseling/test-assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async toggleTestAssignmentVisibility(
    id: string,
    data: {
      isVisibleToUser?: boolean;
      externalTestUrl?: string;
      externalTestTitle?: string;
      adminNote?: string;
    }
  ) {
    return this.request<any>(`/api/counseling/test-assignments/${id}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTestAssignment(id: string) {
    return this.request<{ success: boolean; id: string }>(`/api/counseling/test-assignments/${id}`, {
      method: 'DELETE',
    });
  }

  async getCounselingClientsBasic(search?: string) {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<Array<{ id: string; fullName: string; phone: string }>>(
      `/api/counseling/clients-basic${qs}`
    );
  }

  async getCounselingGeneralShowcase() {
    return this.request<any>('/api/counseling/general-showcase');
  }

  async updateCounselingGeneralShowcase(config: any, expectedVersion?: number) {
    return this.request<any>('/api/counseling/general-showcase', {
      method: 'PUT',
      body: JSON.stringify({ ...config, expectedVersion: expectedVersion ?? config?.version }),
    });
  }

  async registerCounselingWorkshop(workshopId: string, notes?: string) {
    return this.request<any>(`/api/counseling/workshops/${encodeURIComponent(workshopId)}/register`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async getWorkshopRegistrations(workshopId: string) {
    return this.request<Array<{ id: string; workshopId: string; userId: string; fullName: string; phone: string; notes: string; createdAt: string }>>(
      `/api/counseling/workshops/${encodeURIComponent(workshopId)}/registrations`
    );
  }

  async submitPsychologicalTest(assignmentId: string, answers: any[], scoreSummary?: string) {
    return this.request<any>(`/api/counseling/test-assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers, scoreSummary }),
    });
  }

  async getPsychologicalTestResults(filters?: { userId?: string; testId?: string }) {
    const qs = new URLSearchParams();
    if (filters?.userId) qs.set('userId', filters.userId);
    if (filters?.testId) qs.set('testId', filters.testId);
    const q = qs.toString();
    return this.request<any[]>(`/api/counseling/test-results${q ? `?${q}` : ''}`);
  }

  async reviewPsychologicalTestResult(
    resultId: string,
    data: { psychologistNotes?: string; scoreSummary?: string; expectedVersion: number }
  ) {
    return this.request<any>(`/api/counseling/test-results/${resultId}/review`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Research endpoints
  async getResearchPortalConfig() {
    return this.request<any>('/api/research/config');
  }

  async updateResearchPortalConfig(config: any) {
    return this.request<{ success: boolean; config: any }>('/api/research/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

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

  async updateResearchStatus(
    projectId: string,
    data: {
      status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed';
      expectedVersion: number;
      adminNote?: string;
      assignedSupervisor?: string;
      stageTitle?: string;
      replyMessage?: string;
    }
  ) {
    return this.request<{ success: boolean; mentorship: any }>(`/api/research/${projectId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async addResearchMessage(projectId: string, message: string) {
    return this.request<{ success: boolean; mentorship: any }>(`/api/research/${projectId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async updateResearchProject(projectId: string, data: any) {
    return this.request<any>(`/api/research/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteResearchProject(projectId: string, expectedVersion = 1) {
    return this.request<any>(`/api/research/${projectId}`, {
      method: 'DELETE',
      headers: {
        'If-Match': String(expectedVersion),
      },
      body: JSON.stringify({ expectedVersion }),
    });
  }

  // Rulings endpoints
  async getRulings() {
    return this.request<any[]>('/api/rulings');
  }

  async getRulingsPortalConfig() {
    return this.request<any>('/api/rulings/portal-config');
  }

  async updateRulingsPortalConfig(config: any) {
    return this.request<{ success: boolean; config: any }>('/api/rulings/portal-config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async submitRuling(data: any) {
    return this.request<any>('/api/rulings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRuling(rulingId: string, data: any) {
    return this.request<any>(`/api/rulings/${rulingId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async reorderRulings(orderedIds: string[]) {
    return this.request<{ success: boolean; orderedIds: string[] }>('/api/rulings/reorder', {
      method: 'PUT',
      body: JSON.stringify({ orderedIds }),
    });
  }

  async addRulingCritique(rulingId: string, comment: string) {
    return this.request<any>(`/api/rulings/${rulingId}/critique`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  async editRulingDiscussion(rulingId: string, discussionId: string, comment: string) {
    return this.request<any>(`/api/rulings/${rulingId}/discussions/${discussionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ comment }),
    });
  }

  async deleteRulingDiscussion(rulingId: string, discussionId: string) {
    return this.request<any>(`/api/rulings/${rulingId}/discussions/${discussionId}`, {
      method: 'DELETE',
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

  async toggleRulingDislike(rulingId: string) {
    return this.request<any>(`/api/rulings/${rulingId}/dislike`, {
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

  async updateWelfareRequest(id: string, updates: any) {
    return this.request<any>(`/api/welfare/requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getWelfarePortalConfig() {
    return this.request<any>('/api/welfare/portal-config');
  }

  async updateWelfarePortalConfig(config: any) {
    return this.request<any>('/api/welfare/portal-config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async submitAccommodationRequest(data: {
    city: string;
    checkInIso: string;
    nights: number;
    description?: string;
    phone?: string;
  }) {
    return this.request<{ message: string; request: any }>('/api/welfare/accommodation-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyFundMembership() {
    return this.request<{ membership: any | null; payments: any[] }>('/api/welfare/fund/my');
  }

  async applyFundMembership(monthlyFeeAmount: number) {
    return this.request<any>('/api/welfare/fund/membership', {
      method: 'POST',
      body: JSON.stringify({ monthlyFeeAmount }),
    });
  }

  async editPendingFundMembership(id: string, monthlyFeeAmount: number) {
    return this.request<any>(`/api/welfare/fund/membership/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ monthlyFeeAmount }),
    });
  }

  async deletePendingFundMembership(id: string) {
    return this.request<{ success: boolean; id: string }>(`/api/welfare/fund/membership/${id}`, {
      method: 'DELETE',
    });
  }

  async getAdminFundMemberships() {
    return this.request<any[]>('/api/welfare/fund/admin/memberships');
  }

  async reviewFundMembership(id: string, status: 'approved' | 'rejected' | 'pending', adminNote?: string) {
    return this.request<any>(`/api/welfare/fund/admin/memberships/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNote }),
    });
  }

  async payFundFee(data: { amount: number; periodLabel: string; paymentMethod: string; receiptUrl?: string }) {
    return this.request<any>('/api/welfare/fund/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAdminFundPayments() {
    return this.request<any[]>('/api/welfare/fund/admin/payments');
  }

  async reviewFundPayment(id: string, status: 'verified' | 'rejected' | 'pending', adminNote?: string) {
    return this.request<any>(`/api/welfare/fund/admin/payments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNote }),
    });
  }

  async getInstallmentPartners() {
    return this.request<any[]>('/api/welfare/installments/partners');
  }

  async createInstallmentPartner(data: any) {
    return this.request<any>('/api/welfare/installments/partners', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInstallmentPartner(id: string, data: any) {
    return this.request<any>(`/api/welfare/installments/partners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInstallmentPartner(id: string) {
    return this.request<{ success: boolean }>(`/api/welfare/installments/partners/${id}`, {
      method: 'DELETE',
    });
  }

  async getInstallmentRequests() {
    return this.request<any[]>('/api/welfare/installments/requests');
  }

  async submitInstallmentRequest(data: {
    partnerId: string;
    requestedAmount: number;
    months: number;
    description?: string;
    phone?: string;
  }) {
    return this.request<any>('/api/welfare/installments/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async reviewInstallmentRequest(
    id: string,
    status: 'pending' | 'approved' | 'rejected' | 'completed',
    adminNote?: string
  ) {
    return this.request<any>(`/api/welfare/installments/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNote }),
    });
  }

  async getConsumables() {
    return this.request<any[]>('/api/welfare/consumables');
  }

  async createConsumableItem(data: any) {
    return this.request<any>('/api/welfare/consumables', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateConsumableItem(id: string, updates: any) {
    return this.request<any>(`/api/welfare/consumables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteConsumableItem(id: string) {
    return this.request<{ success: boolean }>(`/api/welfare/consumables/${id}`, {
      method: 'DELETE',
    });
  }

  async updateConsumableInventory(
    id: string,
    stockOrPayload: number | { stock: number; lowStockThreshold?: number; expectedVersion: number },
    expectedVersion?: number,
    lowStockThreshold?: number
  ) {
    const body =
      typeof stockOrPayload === 'object'
        ? stockOrPayload
        : { stock: stockOrPayload, expectedVersion: expectedVersion ?? 1, lowStockThreshold };
    return this.request<any>(`/api/welfare/consumables/${id}/inventory`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async getConsumableOrders() {
    return this.request<any[]>('/api/welfare/orders');
  }

  async placeConsumableOrder(
    items: any[],
    deliveryAddress: string,
    deliveryMethod: 'in_person' | 'post' | 'courier' = 'post'
  ) {
    return this.request<any>('/api/welfare/orders', {
      method: 'POST',
      body: JSON.stringify({ items, deliveryAddress, deliveryMethod }),
    });
  }

  async updateConsumableOrderStatus(
    orderId: string,
    status: string,
    notes?: string,
    expectedVersion?: number
  ) {
    return this.request<any>(`/api/welfare/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes, expectedVersion }),
    });
  }

  async updateConsumableOrderPostalTracking(
    orderId: string,
    data: { postalTrackingCode?: string; shippingStatus?: string; status?: string; expectedVersion: number }
  ) {
    return this.request<any>(`/api/welfare/orders/${orderId}/postal-tracking`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getProductProposals() {
    return this.request<any[]>('/api/welfare/proposals');
  }

  async submitProductProposal(data: any) {
    return this.request<any>('/api/welfare/proposals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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

  // Dashboard Widgets, Banners & Calendar Events
  async getDashboardWidgetsData() {
    return this.request<{ banners: any[]; events: any[]; widgetConfig: { showStatusSummaryWidget: boolean; showEventsCalendarWidget: boolean; version: number } }>('/api/dashboard/widgets-data');
  }

  async updateDashboardWidgetToggles(data: { showStatusSummaryWidget: boolean; showEventsCalendarWidget: boolean; expectedVersion: number }) {
    return this.request<any>('/api/dashboard/widget-toggles', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async createDashboardBanner(data: any) {
    return this.request<any>('/api/dashboard/banners', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDashboardBanner(id: string, data: any) {
    return this.request<any>(`/api/dashboard/banners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDashboardBanner(id: string) {
    return this.request<any>(`/api/dashboard/banners/${id}`, {
      method: 'DELETE',
    });
  }

  async createDashboardEvent(data: any) {
    return this.request<any>('/api/dashboard/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDashboardEvent(id: string, data: any) {
    return this.request<any>(`/api/dashboard/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDashboardEvent(id: string) {
    return this.request<any>(`/api/dashboard/events/${id}`, {
      method: 'DELETE',
    });
  }

  // Fast Raw Binary File Upload (bypasses Base64 33% bloat & JSON parsing latency)
  async uploadFile(
    file: File,
    category = 'misc',
    extraBody?: Record<string, any>
  ): Promise<{ url: string; filename?: string; originalName?: string; sizeBytes?: number }> {
    const buildHeaders = (token?: string): Record<string, string> => {
      const h: Record<string, string> = {
        'Content-Type': 'application/octet-stream',
        'Idempotency-Key': generateClientUUID(),
        'x-upload-filename': encodeURIComponent(file.name || 'upload.bin'),
        'x-upload-mime': file.type || 'application/octet-stream',
      };
      if (token) h['Authorization'] = `Bearer ${token}`;
      if (extraBody?.courseId) h['x-course-id'] = String(extraBody.courseId);
      if (extraBody?.draftFolderKey) h['x-draft-key'] = String(extraBody.draftFolderKey);
      if (extraBody?.previousUrl) h['x-previous-url'] = String(extraBody.previousUrl);
      return h;
    };

    try {
      let response = await fetch(`/api/upload-raw/${encodeURIComponent(category)}`, {
        method: 'POST',
        headers: buildHeaders(this.sessionToken),
        body: file,
      });

      if (
        response.status === 401 &&
        !this.isRefreshing &&
        (this.refreshTokenVal || (typeof window !== 'undefined' && !!localStorage.getItem('feqh_refresh_token')))
      ) {
        try {
          this.isRefreshing = true;
          const refreshRes = await this.refreshToken();
          this.isRefreshing = false;
          if (refreshRes?.accessToken) {
            response = await fetch(`/api/upload-raw/${encodeURIComponent(category)}`, {
              method: 'POST',
              headers: buildHeaders(refreshRes.accessToken),
              body: file,
            });
          }
        } catch (refreshErr) {
          this.isRefreshing = false;
          this.clearSession();
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
            title: response.statusText || 'خطای آپلود فایل',
            status: response.status,
            detail: 'آپلود فایل با خطا مواجه شد.',
            code: `HTTP_${response.status}`,
          };
        }
        throw new ApiError(problem);
      }

      const res = await response.json();
      return {
        url: res.url,
        filename: res.filename,
        originalName: res.originalName,
        sizeBytes: res.sizeBytes,
      };
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw new ApiError({
        type: 'upload_failure',
        title: 'خطا در آپلود فایل',
        status: 0,
        detail: err?.message || 'عدم امکان ارسال فایل به سرور.',
        code: 'UPLOAD_ERROR',
      });
    }
  }

  async fetchPrivateFileBlob(fileUrl: string): Promise<{ blob: Blob; contentType: string; filename: string }> {
    const headers: Record<string, string> = {};
    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }
    const response = await fetch(fileUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
    if (!response.ok) {
      let detail = 'عدم امکان دریافت فایل از سرور.';
      try {
        const errBody = await response.json();
        detail = errBody.detail || errBody.error || detail;
      } catch {}
      throw new ApiError({
        type: 'download_failed',
        title: 'خطا در دریافت فایل',
        status: response.status,
        detail,
        code: `HTTP_${response.status}`,
      });
    }
    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || blob.type || 'application/octet-stream';
    const rawName = decodeURIComponent(fileUrl.split('/').pop() || 'attachment');
    return { blob, contentType, filename: rawName };
  }

  async downloadPrivateFile(fileUrl: string, suggestedName?: string): Promise<void> {
    const { blob, filename } = await this.fetchPrivateFileBlob(fileUrl);
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = suggestedName || filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
  }

  // Course Disk Files, Attendance, Waitlist & Certificates
  async getCourseDiskFiles(courseIdOrDraftFolder: string) {
    return this.request<{
      courseId: string;
      folderName: string;
      relativeDiskPath: string;
      files: Array<{
        filename: string;
        sizeBytes: number;
        sizeLabel: string;
        format: string;
        url: string;
        modifiedAt: string;
      }>;
    }>(`/api/courses/${encodeURIComponent(courseIdOrDraftFolder)}/disk-files`);
  }

  async deleteCourseDiskFile(courseIdOrDraftFolder: string, filename: string) {
    return this.request<{ success: boolean; filename: string }>(
      `/api/courses/${encodeURIComponent(courseIdOrDraftFolder)}/disk-files/${encodeURIComponent(filename)}`,
      { method: 'DELETE' }
    );
  }

  async getCourseOperations(courseId: string) {
    return this.request<{
      courseId: string;
      sessionsCount: number;
      sessions?: any[];
      waitlistEnabled: boolean;
      version: number;
      attendance: any[];
      waitlist: any[];
      certificates: any[];
    }>(`/api/courses/${courseId}/operations`);
  }

  async getCourseAttendance(courseId: string) {
    const ops = await this.getCourseOperations(courseId);
    return ops?.attendance || [];
  }

  async getCourseWaitlist(courseId: string) {
    const ops = await this.getCourseOperations(courseId);
    return ops?.waitlist || [];
  }

  async getCourseCertificates(courseId: string) {
    const ops = await this.getCourseOperations(courseId);
    return ops?.certificates || [];
  }

  async updateCourseOperationsSettings(courseId: string, data: { sessionsCount?: number; waitlistEnabled?: boolean; expectedVersion: number }) {
    return this.request<any>(`/api/courses/${courseId}/operations-settings`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateCourseOpsConfig(courseId: string, data: { sessionsCount?: number; waitlistEnabled?: boolean; expectedVersion: number }) {
    return this.updateCourseOperationsSettings(courseId, data);
  }

  async recordCourseAttendance(
    courseId: string,
    data: {
      userId: string;
      userName: string;
      sessionNumber: number;
      sessionTitle?: string;
      sessionId?: string;
      status: 'present' | 'absent' | 'excused' | 'late';
      note?: string;
    }
  ) {
    return this.request<any>(`/api/courses/${courseId}/attendance`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async recordCourseAttendanceBulk(
    courseId: string,
    records: Array<{
      userId: string;
      userName: string;
      sessionNumber: number;
      sessionTitle?: string;
      sessionId?: string;
      status: 'present' | 'absent' | 'excused' | 'late';
      note?: string;
    }>
  ) {
    return this.request<{ success: boolean; count: number }>(`/api/courses/${courseId}/attendance/bulk`, {
      method: 'POST',
      body: JSON.stringify({ records }),
    });
  }

  async joinCourseWaitlist(courseId: string) {
    return this.request<any>(`/api/courses/${courseId}/waitlist`, {
      method: 'POST',
    });
  }

  async updateCourseWaitlistStatus(courseId: string, waitlistId: string, status: string, expectedVersion = 1) {
    return this.request<any>(`/api/courses/${courseId}/waitlist/${waitlistId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, expectedVersion }),
    });
  }

  async issueCourseCertificate(
    courseId: string,
    data?: {
      userId?: string;
      userName?: string;
      userNationalId?: string;
      courseTitle?: string;
      instructorName?: string;
      hours?: number;
      gradeText?: string;
      certificateFileUrl?: string;
      certificateFileName?: string;
    }
  ) {
    return this.request<any>(`/api/courses/${courseId}/certificates`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async deleteCourseCertificate(courseId: string, certId: string) {
    return this.request<{ success: boolean; id: string }>(`/api/courses/${courseId}/certificates/${certId}`, {
      method: 'DELETE',
    });
  }

  // Course Installments Endpoints
  async getMyCourseInstallments() {
    return this.request<{ items: any[]; dueNow: any[] }>('/api/courses/installments/my');
  }

  async getAdminCourseInstallments(filters?: {
    courseId?: string;
    status?: string;
    search?: string;
    scope?: 'specialized' | 'counseling_workshop';
  }) {
    const qs = new URLSearchParams();
    if (filters?.courseId) qs.set('courseId', filters.courseId);
    if (filters?.status) qs.set('status', filters.status);
    if (filters?.search) qs.set('search', filters.search);
    if (filters?.scope) qs.set('scope', filters.scope);
    const queryStr = qs.toString() ? `?${qs.toString()}` : '';
    return this.request<{ items: any[]; summary: any }>(`/api/courses/installments/admin${queryStr}`);
  }

  async payCourseInstallment(
    installmentId: string,
    data: {
      paymentMethod: 'online_gateway' | 'bank_receipt';
      trackingCode?: string;
      receiptFileUrl?: string;
      receiptBankName?: string;
      receiptDate?: string;
      expectedVersion: number;
    }
  ) {
    return this.request<any>(`/api/courses/installments/${installmentId}/pay`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async reviewCourseInstallment(
    installmentId: string,
    data: {
      status?: 'pending' | 'awaiting_verification' | 'paid' | 'rejected' | 'overdue';
      adminNote?: string;
      dueDateIso?: string;
      dueDateJalali?: string;
      amount?: number;
      expectedVersion: number;
    }
  ) {
    return this.request<any>(`/api/courses/installments/${installmentId}/review`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Course Discount Codes Endpoints (Multi-Type + Usage Analytics)
  async getCourseDiscountCodes(includeUsages = false, scope?: 'specialized' | 'counseling_workshop') {
    const qs = new URLSearchParams();
    if (includeUsages) qs.set('includeUsages', 'true');
    if (scope) qs.set('scope', scope);
    const queryStr = qs.toString() ? `?${qs.toString()}` : '';
    return this.request<any[]>(`/api/courses/discounts${queryStr}`);
  }

  async getCourseDiscountDetails(discountId: string) {
    return this.request<any>(`/api/courses/discounts/${discountId}/details`);
  }

  async createCourseDiscountCode(data: any) {
    return this.request<any>('/api/courses/discounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCourseDiscountCode(discountId: string, data: any, expectedVersion: number) {
    return this.request<any>(`/api/courses/discounts/${discountId}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, expectedVersion }),
    });
  }

  async deleteCourseDiscountCode(discountId: string, expectedVersion: number) {
    return this.request<{ success: boolean; id: string }>(`/api/courses/discounts/${discountId}`, {
      method: 'DELETE',
      body: JSON.stringify({ expectedVersion }),
    });
  }

  async validateCourseDiscountCode(courseId: string, code: string) {
    return this.request<{
      valid: boolean;
      discountCode: any;
      originalAmount: number;
      discountAmount: number;
      finalAmount: number;
    }>('/api/courses/discounts/validate', {
      method: 'POST',
      body: JSON.stringify({ courseId, code }),
    });
  }

  // Rulings Highlights & Featured Critique Pinning
  async updateRulingHighlights(rulingId: string, highlights: any[], expectedVersion: number) {
    return this.request<any>(`/api/rulings/${rulingId}/highlights`, {
      method: 'PUT',
      body: JSON.stringify({ highlights, expectedVersion }),
    });
  }

  async toggleFeaturedCritique(rulingId: string, discussionId: string, isFeatured: boolean) {
    return this.request<any>(`/api/rulings/${rulingId}/discussions/${discussionId}/feature`, {
      method: 'PATCH',
      body: JSON.stringify({ isFeatured }),
    });
  }

  async togglePinRulingDiscussion(rulingId: string, discussionId: string, isFeatured: boolean) {
    return this.toggleFeaturedCritique(rulingId, discussionId, isFeatured);
  }

  // Counseling Dossiers, Consultant Schedules & Identity Visibility
  async getCounselingDossiers(requestId?: string) {
    const url = requestId ? `/api/counseling/dossiers?requestId=${requestId}` : '/api/counseling/dossiers';
    return this.request<any[]>(url);
  }

  async createCounselingDossier(data: any) {
    return this.request<any>('/api/counseling/dossiers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async saveCounselingDossier(data: any) {
    return this.createCounselingDossier(data);
  }

  async toggleCounselingIdentityVisibility(requestId: string, hideIdentity: boolean, expectedVersion: number) {
    return this.request<any>(`/api/counseling/requests/${requestId}/identity-visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ hideIdentity, expectedVersion }),
    });
  }

  async updateConsultantSchedule(consultantId: string, scheduleSlots: any[], availabilityOrVersion?: string | number, expectedVersion = 1) {
    const availability = typeof availabilityOrVersion === 'string' ? availabilityOrVersion : undefined;
    const version = typeof availabilityOrVersion === 'number' ? availabilityOrVersion : expectedVersion;
    return this.request<any>(`/api/counseling/consultants/${consultantId}/schedule`, {
      method: 'PUT',
      body: JSON.stringify({ scheduleSlots, availability, expectedVersion: version }),
    });
  }

  // Welfare Postal Tracking & Inventory Stock Control
  async updateOrderPostalTracking(orderId: string, data: { postalTrackingCode?: string; shippingStatus?: string; status?: string; expectedVersion: number }) {
    return this.request<any>(`/api/welfare/orders/${orderId}/postal-tracking`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Alumni Privacy Settings, Bulk User Import & Financial Balance Report
  async getAlumniPrivacySettings() {
    return this.request<Array<{ sectionId: string; sectionTitle: string; revealNameOnly: boolean; version: number }>>('/api/admin/privacy-settings');
  }

  async updateAlumniPrivacySetting(sectionId: string, revealNameOnly: boolean, expectedVersion: number) {
    return this.request<any>(`/api/admin/privacy-settings/${sectionId}`, {
      method: 'PUT',
      body: JSON.stringify({ revealNameOnly, expectedVersion }),
    });
  }

  async bulkImportUsers(rows: any[]) {
    return this.request<any>('/api/admin/users/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    });
  }

  async getFinancialBalanceReport() {
    return this.request<any>('/api/admin/financial-balance');
  }

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

  // ---------------------------------------------------------------------------
  // 9-Role RBAC + ABAC + Customer Item Visibility & Registration Endpoints
  // ---------------------------------------------------------------------------
  async getRbacPolicies() {
    return this.request<{
      success: boolean;
      policies: Record<string, any>;
      customerVisibility: {
        courses: Array<{ id: string; title: string; instructor: string; price: number; visibleToCustomer: boolean }>;
        products: Array<{ id: string; title: string; formatTitle: string; price: number; visibleToCustomer: boolean }>;
        consumables: Array<{ id: string; title: string; category: string; cooperativePrice: number; visibleToCustomer: boolean }>;
      };
    }>('/api/rbac/policies');
  }

  async updateRbacRolePolicy(
    roleId: string,
    payload: {
      sectionPermissions?: Record<string, string>;
      subSectionPermissions?: Record<string, boolean>;
      expectedVersion?: number;
    }
  ) {
    return this.request<{ success: boolean; policy: any; policies: Record<string, any>; message: string }>(
      `/api/rbac/policies/${encodeURIComponent(roleId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
  }

  async toggleCustomerItemVisibility(payload: {
    entityType: 'course' | 'product' | 'consumable';
    itemId: string;
    visibleToCustomer: boolean;
  }) {
    return this.request<{ success: boolean; entityType: string; itemId: string; visibleToCustomer: boolean; message: string }>(
      '/api/rbac/customer-item-visibility',
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
  }

  async bulkAssignUsersRole(payload: {
    userIds: string[];
    role: string;
    roleTitle?: string;
    applyRoleDefaultPermissions?: boolean;
  }) {
    return this.request<{ success: boolean; updatedCount: number; message: string }>(
      '/api/rbac/bulk-assign-role',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  }

  async registerCustomerAccount(payload: {
    fullName: string;
    nationalId: string;
    phone: string;
    password: string;
    organization?: string;
  }) {
    return this.request<{
      success: boolean;
      user: any;
      token?: string;
      accessToken?: string;
      refreshToken?: string;
      message?: string;
    }>('/api/rbac/register-customer', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const api = new ApiClient();
export const apiClient = api;

