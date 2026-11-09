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
  const [consumables, setConsumables] = useState<ConsumableItem[]>(() => {
    try {
      const s = localStorage.getItem('cooperative_consumables');
      return s ? JSON.parse(s) : INITIAL_CONSUMABLES;
    } catch {
      return INITIAL_CONSUMABLES;
    }
  });
  const [consumableOrders, setConsumableOrders] = useState<ConsumableOrder[]>(() => {
    try {
      const s = localStorage.getItem('consumable_orders');
      return s ? JSON.parse(s) : INITIAL_EXTENDED_ORDERS;
    } catch {
      return INITIAL_EXTENDED_ORDERS;
    }
  });
  const [productProposals, setProductProposals] = useState<MemberProductProposal[]>(INITIAL_PRODUCT_PROPOSALS);
  const [welfareSectionsConfig, setWelfareSectionsConfig] = useState<WelfareSectionConfig[]>(() => {
    try {
      const s = localStorage.getItem('welfare_sections_config');
      return s ? JSON.parse(s) : DEFAULT_WELFARE_SECTIONS;
    } catch {
      return DEFAULT_WELFARE_SECTIONS;
    }
  });
  const [loanTermsAndRules, setLoanTermsAndRules] = useState<WelfareLoanTermsAndRules>(() => {
    try {
      const s = localStorage.getItem('welfare_loan_rules');
      return s ? JSON.parse(s) : DEFAULT_LOAN_TERMS_AND_RULES;
    } catch {
      return DEFAULT_LOAN_TERMS_AND_RULES;
    }
  });
  const [cooperativeSectionInfo, setCooperativeSectionInfo] = useState<CooperativeSectionInfo>(() => {
    try {
      const s = localStorage.getItem('welfare_cooperative_info');
      return s ? JSON.parse(s) : DEFAULT_COOPERATIVE_INFO;
    } catch {
      return DEFAULT_COOPERATIVE_INFO;
    }
  });

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
        refreshWelfare();
      }
    });
    return () => unsubscribe();
  }, [refreshWelfare]);

  const submitWelfareRequest = useCallback(async (data: Omit<WelfareRequest, 'id' | 'status' | 'createdAt'>) => {
    try {
      const created = await api.createWelfareRequest(data);
      setWelfareRequests(prev => [created, ...prev]);
      alert('درخواست تسهیلات شما با موفقیت ثبت و در صف بررسی صندوق قرار گرفت.');
    } catch (err: any) {
      alert(`خطا: ${err.message}`);
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
      alert('سفارش اقلام معیشتی با موفقیت ثبت گردید.');
    } catch (err: any) {
      alert(`خطا: ${err.message}`);
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
    setConsumables(prev => {
      const next = prev.map(c => (c.id === itemId ? { ...c, stock: newStock } : c));
      try { localStorage.setItem('cooperative_consumables', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  }, []);

  const updateConsumableItem = useCallback((id: string, updates: Partial<ConsumableItem>) => {
    setConsumables(prev => {
      const next = prev.map(c => (c.id === id ? { ...c, ...updates } : c));
      try { localStorage.setItem('cooperative_consumables', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  }, []);

  const addConsumableItem = useCallback((itemData: Omit<ConsumableItem, 'id'>) => {
    const newItem: ConsumableItem = {
      ...itemData,
      id: `cnsm_${Date.now()}`,
    };
    setConsumables(prev => {
      const next = [newItem, ...prev];
      try { localStorage.setItem('cooperative_consumables', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  }, []);

  const deleteConsumableItem = useCallback((id: string) => {
    setConsumables(prev => {
      const next = prev.filter(c => c.id !== id);
      try { localStorage.setItem('cooperative_consumables', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  }, []);

  const updateConsumableOrderStatus = useCallback((orderId: string, status: ConsumableOrder['status'], notes?: string) => {
    setConsumableOrders(prev => {
      const next = prev.map(o => (o.id === orderId ? { ...o, status, notes: notes !== undefined ? notes : (o as any).notes } : o));
      try { localStorage.setItem('consumable_orders', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  }, []);

  const updateWelfareSectionsConfig = useCallback((configs: WelfareSectionConfig[]) => {
    setWelfareSectionsConfig(configs);
    try { localStorage.setItem('welfare_sections_config', JSON.stringify(configs)); } catch (e) {}
  }, []);

  const updateLoanTermsAndRules = useCallback((updates: Partial<WelfareLoanTermsAndRules>) => {
    setLoanTermsAndRules(prev => {
      const next = { ...prev, ...updates };
      try { localStorage.setItem('welfare_loan_rules', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  }, []);

  const updateCooperativeSectionInfo = useCallback((updates: Partial<CooperativeSectionInfo>) => {
    setCooperativeSectionInfo(prev => {
      const next = { ...prev, ...updates };
      try { localStorage.setItem('welfare_cooperative_info', JSON.stringify(next)); } catch (e) {}
      return next;
    });
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
