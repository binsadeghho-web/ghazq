import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  WelfareRequest,
  ConsumableItem,
  ConsumableOrder,
  MemberProductProposal,
  WelfareSectionConfig,
  WelfareLoanTermsAndRules,
  CooperativeSectionInfo,
} from '../types';
import {
  INITIAL_WELFARE_REQUESTS,
  INITIAL_CONSUMABLES,
  INITIAL_PRODUCT_PROPOSALS,
} from '../data/mockData';
import {
  DEFAULT_WELFARE_SECTIONS,
  DEFAULT_LOAN_TERMS_AND_RULES,
  DEFAULT_COOPERATIVE_INFO,
  INITIAL_EXTENDED_ORDERS,
} from '../data/welfareData';
import { api } from '../services/apiClient';

export interface WelfareContextType {
  welfareRequests: WelfareRequest[];
  consumables: ConsumableItem[];
  consumableOrders: ConsumableOrder[];
  productProposals: MemberProductProposal[];
  welfareSectionsConfig: WelfareSectionConfig[];
  loanTermsAndRules: WelfareLoanTermsAndRules;
  cooperativeSectionInfo: CooperativeSectionInfo;

  submitWelfareRequest: (data: Omit<WelfareRequest, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  updateWelfareStatus: (requestId: string, status: WelfareRequest['status'], adminNote?: string) => void;
  placeConsumableOrder: (
    items: { itemId: string; title: string; quantity: number; unitPrice: number }[],
    deliveryAddress: string
  ) => Promise<void>;
  submitProductProposal: (data: Omit<MemberProductProposal, 'id' | 'status' | 'createdAt'>) => void;
  updateConsumableStock: (itemId: string, newStock: number) => void;
  updateConsumableItem: (id: string, updates: Partial<ConsumableItem>) => void;
  addConsumableItem: (itemData: Omit<ConsumableItem, 'id'>) => void;
  deleteConsumableItem: (id: string) => void;
  updateConsumableOrderStatus: (orderId: string, status: ConsumableOrder['status'], notes?: string) => void;
  updateWelfareSectionsConfig: (configs: WelfareSectionConfig[]) => void;
  updateLoanTermsAndRules: (updates: Partial<WelfareLoanTermsAndRules>) => void;
  updateCooperativeSectionInfo: (updates: Partial<CooperativeSectionInfo>) => void;
  refreshWelfare: () => Promise<void>;
}

const WelfareContext = createContext<WelfareContextType | undefined>(undefined);

export const WelfareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [welfareRequests, setWelfareRequests] = useState<WelfareRequest[]>(INITIAL_WELFARE_REQUESTS);
  const [consumables, setConsumables] = useState<ConsumableItem[]>(INITIAL_CONSUMABLES);
  const [consumableOrders, setConsumableOrders] = useState<ConsumableOrder[]>(INITIAL_EXTENDED_ORDERS);
  const [productProposals, setProductProposals] = useState<MemberProductProposal[]>(INITIAL_PRODUCT_PROPOSALS);
  const [welfareSectionsConfig, setWelfareSectionsConfig] = useState<WelfareSectionConfig[]>(DEFAULT_WELFARE_SECTIONS);
  const [loanTermsAndRules, setLoanTermsAndRules] = useState<WelfareLoanTermsAndRules>(DEFAULT_LOAN_TERMS_AND_RULES);
  const [cooperativeSectionInfo, setCooperativeSectionInfo] = useState<CooperativeSectionInfo>(DEFAULT_COOPERATIVE_INFO);

  const refreshWelfare = useCallback(async () => {
    try {
      const [fetchedWelfare, fetchedConsumables] = await Promise.all([
        api.getWelfareRequests(),
        api.getConsumables(),
      ]);
      if (Array.isArray(fetchedWelfare)) setWelfareRequests(fetchedWelfare);
      if (Array.isArray(fetchedConsumables)) setConsumables(fetchedConsumables);
    } catch {}
  }, []);

  useEffect(() => {
    refreshWelfare();
    const unsubscribe = api.subscribeToEvents(event => {
      if (event.type.startsWith('welfare.')) {
        const delta = event.data?.data;
        const resourceId = delta?.resourceId;
        const updates = delta?.updates;
        const version = delta?.version;

        if (resourceId && updates && typeof updates === 'object') {
          setWelfareRequests(prev => {
            const exists = prev.some(w => w.id === resourceId);
            if (exists) {
              return prev.map(w => w.id === resourceId ? { ...w, ...updates, version: version || ((w as any).version || 1) + 1 } : w);
            }
            if (updates.title) {
              return [updates as WelfareRequest, ...prev];
            }
            return prev;
          });
          setConsumableOrders(prev => {
            const exists = prev.some(o => o.id === resourceId);
            if (exists) {
              return prev.map(o => o.id === resourceId ? { ...o, ...updates, version: version || ((o as any).version || 1) + 1 } : o);
            }
            return prev;
          });
        } else {
          refreshWelfare();
        }
      }
    });
    return () => unsubscribe();
  }, [refreshWelfare]);

  const submitWelfareRequest = useCallback(async (data: Omit<WelfareRequest, 'id' | 'status' | 'createdAt'>) => {
    try {
      const created = await api.createWelfareRequest(data);
      setWelfareRequests(prev => [created, ...prev]);
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  const updateWelfareStatus = useCallback((requestId: string, status: WelfareRequest['status'], adminNote?: string) => {
    setWelfareRequests(prev => prev.map(w => (w.id === requestId ? { ...w, status, adminNote } : w)));
  }, []);

  const placeConsumableOrder = useCallback(async (
    items: { itemId: string; title: string; quantity: number; unitPrice: number }[],
    deliveryAddress: string
  ) => {
    try {
      const created = await api.placeConsumableOrder(items, deliveryAddress);
      setConsumableOrders(prev => [created, ...prev]);
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  const submitProductProposal = useCallback((data: Omit<MemberProductProposal, 'id' | 'status' | 'createdAt'>) => {
    const newProposal: MemberProductProposal = {
      ...data,
      id: `prop_${Date.now()}`,
      status: 'under_evaluation',
      createdAt: 'امروز',
    };
    setProductProposals(prev => [newProposal, ...prev]);
  }, []);

  const updateConsumableStock = useCallback((itemId: string, newStock: number) => {
    setConsumables(prev => prev.map(c => (c.id === itemId ? { ...c, stock: newStock } : c)));
  }, []);

  const updateConsumableItem = useCallback((id: string, updates: Partial<ConsumableItem>) => {
    setConsumables(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const addConsumableItem = useCallback((itemData: Omit<ConsumableItem, 'id'>) => {
    const newItem: ConsumableItem = {
      ...itemData,
      id: `cnsm_${Date.now()}`,
    };
    setConsumables(prev => [newItem, ...prev]);
  }, []);

  const deleteConsumableItem = useCallback((id: string) => {
    setConsumables(prev => prev.filter(c => c.id !== id));
  }, []);

  const updateConsumableOrderStatus = useCallback((orderId: string, status: ConsumableOrder['status'], notes?: string) => {
    setConsumableOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status, notes: notes !== undefined ? notes : (o as any).notes } : o)));
  }, []);

  const updateWelfareSectionsConfig = useCallback((configs: WelfareSectionConfig[]) => {
    setWelfareSectionsConfig(configs);
  }, []);

  const updateLoanTermsAndRules = useCallback((updates: Partial<WelfareLoanTermsAndRules>) => {
    setLoanTermsAndRules(prev => ({ ...prev, ...updates }));
  }, []);

  const updateCooperativeSectionInfo = useCallback((updates: Partial<CooperativeSectionInfo>) => {
    setCooperativeSectionInfo(prev => ({ ...prev, ...updates }));
  }, []);

  const value = useMemo<WelfareContextType>(() => ({
    welfareRequests,
    consumables,
    consumableOrders,
    productProposals,
    welfareSectionsConfig,
    loanTermsAndRules,
    cooperativeSectionInfo,
    submitWelfareRequest,
    updateWelfareStatus,
    placeConsumableOrder,
    submitProductProposal,
    updateConsumableStock,
    updateConsumableItem,
    addConsumableItem,
    deleteConsumableItem,
    updateConsumableOrderStatus,
    updateWelfareSectionsConfig,
    updateLoanTermsAndRules,
    updateCooperativeSectionInfo,
    refreshWelfare,
  }), [
    welfareRequests,
    consumables,
    consumableOrders,
    productProposals,
    welfareSectionsConfig,
    loanTermsAndRules,
    cooperativeSectionInfo,
    submitWelfareRequest,
    updateWelfareStatus,
    placeConsumableOrder,
    submitProductProposal,
    updateConsumableStock,
    updateConsumableItem,
    addConsumableItem,
    deleteConsumableItem,
    updateConsumableOrderStatus,
    updateWelfareSectionsConfig,
    updateLoanTermsAndRules,
    updateCooperativeSectionInfo,
    refreshWelfare,
  ]);

  return (
    <WelfareContext.Provider value={value}>
      {children}
    </WelfareContext.Provider>
  );
};

export const useWelfare = (): WelfareContextType => {
  const context = useContext(WelfareContext);
  if (!context) {
    throw new Error('useWelfare must be used within a WelfareProvider');
  }
  return context;
};
