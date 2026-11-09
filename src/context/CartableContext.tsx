import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CartableRequest } from '../types';
import { INITIAL_CARTABLE_REQUESTS } from '../data/mockData';
import { api, ApiError } from '../services/apiClient';

export interface CartableContextType {
  cartableRequests: CartableRequest[];
  createCartableRequest: (
    data: Omit<CartableRequest, 'id' | 'trackingNumber' | 'createdAt' | 'updatedAt' | 'messages'>,
    initialMessageText: string
  ) => Promise<void>;
  replyCartableRequest: (requestId: string, text: string) => Promise<void>;
  updateCartableStatus: (requestId: string, status: CartableRequest['status']) => Promise<void>;
  markCartableAsRead: (requestId: string) => Promise<void>;
  refreshCartable: () => Promise<void>;
}

const CartableContext = createContext<CartableContextType | undefined>(undefined);

export const CartableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartableRequests, setCartableRequests] = useState<CartableRequest[]>(INITIAL_CARTABLE_REQUESTS);

  const refreshCartable = useCallback(async () => {
    try {
      const res = await api.getCartableRequests();
      if (Array.isArray(res)) {
        setCartableRequests(res);
      }
    } catch {}
  }, []);

  useEffect(() => {
    refreshCartable();
    const unsubscribe = api.subscribeToEvents(event => {
      if (event.type.startsWith('cartable.')) {
        refreshCartable();
      }
    });
    return () => unsubscribe();
  }, [refreshCartable]);

  const createCartableRequest = useCallback(async (
    data: Omit<CartableRequest, 'id' | 'trackingNumber' | 'createdAt' | 'updatedAt' | 'messages'>,
    initialMessageText: string
  ) => {
    const prev = [...cartableRequests];
    try {
      const created = await api.createCartableRequest({
        ...data,
        initialMessageText,
      });
      setCartableRequests(current => [created, ...current]);
    } catch (err: any) {
      setCartableRequests(prev);
      alert(`خطا در ثبت درخواست کارتابل: ${err.message}`);
      throw err;
    }
  }, [cartableRequests]);

  const replyCartableRequest = useCallback(async (requestId: string, text: string) => {
    try {
      const updated = await api.replyCartableRequest(requestId, text);
      setCartableRequests(prev => prev.map(r => (r.id === requestId ? updated : r)));
    } catch (err: any) {
      alert(`خطا در ارسال پاسخ: ${err.message}`);
      throw err;
    }
  }, []);

  const updateCartableStatus = useCallback(async (requestId: string, status: CartableRequest['status']) => {
    const current = cartableRequests.find(r => r.id === requestId);
    const expectedVersion = (current as any)?.version || 1;
    try {
      const updated = await api.updateCartableStatus(requestId, status, expectedVersion);
      setCartableRequests(prev => prev.map(r => (r.id === requestId ? updated : r)));
    } catch (err: any) {
      if (err instanceof ApiError && err.problem.status === 409) {
        alert('تداخل در به‌روزرسانی: داده‌ها توسط کاربر دیگری تغییر یافته‌اند. اطلاعات تازه‌سازی شدند.');
        refreshCartable();
      } else {
        alert(`خطا: ${err.message}`);
      }
    }
  }, [cartableRequests, refreshCartable]);

  const markCartableAsRead = useCallback(async (requestId: string) => {
    try {
      const updated = await api.markCartableAsRead(requestId);
      setCartableRequests(prev => prev.map(r => (r.id === requestId ? updated : r)));
    } catch {
      // Optimistic local clearing
      setCartableRequests(prev => prev.map(r => {
        if (r.id !== requestId) return r;
        return {
          ...r,
          hasUnreadSupervisor: false,
          hasUnreadApplicant: false,
        };
      }));
    }
  }, []);

  const value = useMemo<CartableContextType>(() => ({
    cartableRequests,
    createCartableRequest,
    replyCartableRequest,
    updateCartableStatus,
    markCartableAsRead,
    refreshCartable,
  }), [
    cartableRequests,
    createCartableRequest,
    replyCartableRequest,
    updateCartableStatus,
    markCartableAsRead,
    refreshCartable,
  ]);

  return (
    <CartableContext.Provider value={value}>
      {children}
    </CartableContext.Provider>
  );
};

export const useCartable = (): CartableContextType => {
  const context = useContext(CartableContext);
  if (!context) {
    throw new Error('useCartable must be used within a CartableProvider');
  }
  return context;
};
