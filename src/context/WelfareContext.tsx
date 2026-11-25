import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  User,
  WelfareRequest,
  ConsumableItem,
  ConsumableOrder,
  MemberProductProposal,
  WelfareSectionConfig,
  WelfareLoanTermsAndRules,
  CooperativeSectionInfo,
  WelfarePortalConfig,
  WelfareFundMembership,
  WelfareFundPayment,
  WelfareInstallmentPartner,
  WelfareInstallmentRequest,
  DeliveryMethodType,
} from '../types';
import {
  DEFAULT_WELFARE_SECTIONS,
  DEFAULT_LOAN_TERMS_AND_RULES,
  DEFAULT_COOPERATIVE_INFO,
  DEFAULT_WELFARE_PORTAL_CONFIG,
} from '../data/welfareData';
import { api } from '../services/apiClient';

const ORGANIZATIONAL_ROLES = new Set([
  'admin',
  'super_admin',
  'general_observer',
  'alumni_manager',
  'admin_finance_officer',
  'education_deputy',
  'cultural_educational_officer',
  'research_deputy',
  'psychologist_counselor',
  'supervisor',
]);

export interface WelfareContextType {
  welfareRequests: WelfareRequest[];
  consumables: ConsumableItem[];
  consumableOrders: ConsumableOrder[];
  productProposals: MemberProductProposal[];
  welfareSectionsConfig: WelfareSectionConfig[];
  loanTermsAndRules: WelfareLoanTermsAndRules;
  cooperativeSectionInfo: CooperativeSectionInfo;

  // 5-Module Portal State
  welfarePortalConfig: WelfarePortalConfig;
  myFundMembership: WelfareFundMembership | null;
  myFundPayments: WelfareFundPayment[];
  allFundMemberships: WelfareFundMembership[];
  allFundPayments: WelfareFundPayment[];
  installmentPartners: WelfareInstallmentPartner[];
  installmentRequests: WelfareInstallmentRequest[];

  // Actions
  submitWelfareRequest: (data: Omit<WelfareRequest, 'id' | 'status' | 'createdAt'>) => Promise<WelfareRequest>;
  updateWelfareStatus: (requestId: string, status: WelfareRequest['status'], adminNote?: string) => Promise<void>;
  submitAccommodationRequest: (data: {
    city: string;
    checkInIso: string;
    nights: number;
    description?: string;
    phone?: string;
  }) => Promise<{ message: string; request: WelfareRequest }>;

  updateWelfarePortalConfig: (updates: Partial<WelfarePortalConfig>) => Promise<WelfarePortalConfig>;

  // Qarzolhasaneh Fund Actions
  applyFundMembership: (monthlyFeeAmount: number) => Promise<WelfareFundMembership>;
  editPendingFundMembership: (id: string, monthlyFeeAmount: number) => Promise<WelfareFundMembership>;
  deletePendingFundMembership: (id: string) => Promise<void>;
  reviewFundMembership: (id: string, status: 'approved' | 'rejected' | 'pending', adminNote?: string) => Promise<void>;
  payFundFee: (data: { amount: number; periodLabel: string; paymentMethod: string; receiptUrl?: string }) => Promise<WelfareFundPayment>;
  reviewFundPayment: (id: string, status: 'verified' | 'rejected' | 'pending', adminNote?: string) => Promise<void>;

  // Consumables & Orders Actions
  placeConsumableOrder: (
    items: { itemId: string; title: string; quantity: number; unitPrice: number }[],
    deliveryAddress: string,
    deliveryMethod?: DeliveryMethodType
  ) => Promise<ConsumableOrder>;
  submitProductProposal: (data: Omit<MemberProductProposal, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  updateConsumableStock: (itemId: string, newStock: number) => Promise<void>;
  updateConsumableItem: (id: string, updates: Partial<ConsumableItem>) => Promise<void>;
  addConsumableItem: (itemData: Omit<ConsumableItem, 'id'>) => Promise<void>;
  deleteConsumableItem: (id: string) => Promise<void>;
  updateConsumableOrderStatus: (orderId: string, status: ConsumableOrder['status'], notes?: string) => Promise<void>;
  updateConsumablePostalTracking: (
    orderId: string,
    data: { postalTrackingCode?: string; shippingStatus?: string; status?: string; expectedVersion: number }
  ) => Promise<void>;

  // Installment Sales Actions
  createInstallmentPartner: (data: Omit<WelfareInstallmentPartner, 'id' | 'version' | 'createdAt'>) => Promise<WelfareInstallmentPartner>;
  updateInstallmentPartner: (id: string, updates: Partial<WelfareInstallmentPartner>) => Promise<WelfareInstallmentPartner>;
  deleteInstallmentPartner: (id: string) => Promise<void>;
  submitInstallmentRequest: (data: {
    partnerId: string;
    requestedAmount: number;
    months: number;
    description?: string;
    phone?: string;
    attachments?: Array<{ url: string; name: string; size?: number }>;
  }) => Promise<WelfareInstallmentRequest>;
  reviewInstallmentRequest: (
    id: string,
    status: WelfareInstallmentRequest['status'],
    adminNote?: string
  ) => Promise<void>;

  updateWelfareSectionsConfig: (configs: WelfareSectionConfig[]) => void;
  updateLoanTermsAndRules: (updates: Partial<WelfareLoanTermsAndRules>) => void;
  updateCooperativeSectionInfo: (updates: Partial<CooperativeSectionInfo>) => void;
  refreshWelfare: () => Promise<void>;
}

const WelfareContext = createContext<WelfareContextType | undefined>(undefined);

export const WelfareProvider: React.FC<{ children: React.ReactNode; currentUser?: User | null }> = ({
  children,
  currentUser,
}) => {
  const [welfareRequests, setWelfareRequests] = useState<WelfareRequest[]>([]);
  const [consumables, setConsumables] = useState<ConsumableItem[]>([]);
  const [consumableOrders, setConsumableOrders] = useState<ConsumableOrder[]>([]);
  const [productProposals, setProductProposals] = useState<MemberProductProposal[]>([]);
  const [welfareSectionsConfig, setWelfareSectionsConfig] = useState<WelfareSectionConfig[]>(DEFAULT_WELFARE_SECTIONS);
  const [loanTermsAndRules, setLoanTermsAndRules] = useState<WelfareLoanTermsAndRules>(DEFAULT_LOAN_TERMS_AND_RULES);
  const [cooperativeSectionInfo, setCooperativeSectionInfo] = useState<CooperativeSectionInfo>(DEFAULT_COOPERATIVE_INFO);

  const [welfarePortalConfig, setWelfarePortalConfig] = useState<WelfarePortalConfig>(DEFAULT_WELFARE_PORTAL_CONFIG);
  const [myFundMembership, setMyFundMembership] = useState<WelfareFundMembership | null>(null);
  const [myFundPayments, setMyFundPayments] = useState<WelfareFundPayment[]>([]);
  const [allFundMemberships, setAllFundMemberships] = useState<WelfareFundMembership[]>([]);
  const [allFundPayments, setAllFundPayments] = useState<WelfareFundPayment[]>([]);
  const [installmentPartners, setInstallmentPartners] = useState<WelfareInstallmentPartner[]>([]);
  const [installmentRequests, setInstallmentRequests] = useState<WelfareInstallmentRequest[]>([]);

  const isOrgRole = Boolean(currentUser && ORGANIZATIONAL_ROLES.has(currentUser.role));

  const refreshWelfare = useCallback(async () => {
    if (!currentUser) {
      setWelfareRequests([]);
      setConsumables([]);
      setConsumableOrders([]);
      setMyFundMembership(null);
      setMyFundPayments([]);
      setAllFundMemberships([]);
      setAllFundPayments([]);
      setInstallmentPartners([]);
      setInstallmentRequests([]);
      return;
    }

    try {
      const [
        fetchedConfig,
        fetchedWelfare,
        fetchedConsumables,
        fetchedOrders,
        fetchedProposals,
        fetchedMyFund,
        fetchedPartners,
        fetchedInstReqs,
      ] = await Promise.all([
        api.getWelfarePortalConfig().catch(() => null),
        api.getWelfareRequests().catch(() => null),
        api.getConsumables().catch(() => null),
        api.getConsumableOrders().catch(() => null),
        api.getProductProposals().catch(() => null),
        api.getMyFundMembership().catch(() => null),
        api.getInstallmentPartners().catch(() => null),
        api.getInstallmentRequests().catch(() => null),
      ]);

      if (fetchedConfig && fetchedConfig.modulesConfig) setWelfarePortalConfig(fetchedConfig);
      if (Array.isArray(fetchedWelfare)) setWelfareRequests(fetchedWelfare);
      if (Array.isArray(fetchedConsumables)) setConsumables(fetchedConsumables);
      if (Array.isArray(fetchedOrders)) setConsumableOrders(fetchedOrders);
      if (Array.isArray(fetchedProposals)) setProductProposals(fetchedProposals);
      if (fetchedMyFund) {
        setMyFundMembership(fetchedMyFund.membership || null);
        setMyFundPayments(Array.isArray(fetchedMyFund.payments) ? fetchedMyFund.payments : []);
      }
      if (Array.isArray(fetchedPartners)) setInstallmentPartners(fetchedPartners);
      if (Array.isArray(fetchedInstReqs)) setInstallmentRequests(fetchedInstReqs);

      if (isOrgRole) {
        const [adminMem, adminPay] = await Promise.all([
          api.getAdminFundMemberships().catch(() => null),
          api.getAdminFundPayments().catch(() => null),
        ]);
        if (Array.isArray(adminMem)) setAllFundMemberships(adminMem);
        if (Array.isArray(adminPay)) setAllFundPayments(adminPay);
      } else {
        setAllFundMemberships([]);
        setAllFundPayments([]);
      }
    } catch {}
  }, [currentUser, isOrgRole]);

  useEffect(() => {
    refreshWelfare();
    if (!currentUser) return;
    const unsubscribe = api.subscribeToEvents((event) => {
      if (!event.type.startsWith('welfare.')) return;
      const delta = event.data?.data;
      if (event.type === 'welfare.config_updated' && delta?.config) {
        setWelfarePortalConfig(delta.config);
        return;
      }
      const resourceId = delta?.resourceId;
      const updates = delta?.updates;
      const version = delta?.version;

      if (resourceId && updates && typeof updates === 'object' && event.type === 'welfare.updated') {
        setWelfareRequests((prev) =>
          prev.some((w) => w.id === resourceId)
            ? prev.map((w) => (w.id === resourceId ? { ...w, ...updates, version: version || ((w as any).version || 1) + 1 } : w))
            : [updates as WelfareRequest, ...prev]
        );
      } else {
        refreshWelfare();
      }
    });
    return () => unsubscribe();
  }, [refreshWelfare, currentUser]);

  const submitWelfareRequest = useCallback(async (data: Omit<WelfareRequest, 'id' | 'status' | 'createdAt'>) => {
    const created = await api.createWelfareRequest(data);
    setWelfareRequests((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateWelfareStatus = useCallback(
    async (requestId: string, status: WelfareRequest['status'], adminNote?: string) => {
      const target = welfareRequests.find((w) => w.id === requestId);
      const updated = await api.updateWelfareRequest(requestId, {
        status,
        adminNote,
        expectedVersion: target?.version || 1,
      });
      setWelfareRequests((prev) => prev.map((w) => (w.id === requestId ? { ...w, ...updated } : w)));
    },
    [welfareRequests]
  );

  const submitAccommodationRequest = useCallback(
    async (data: { city: string; checkInIso: string; nights: number; description?: string; phone?: string }) => {
      const res = await api.submitAccommodationRequest(data);
      if (res?.request) {
        setWelfareRequests((prev) => [res.request, ...prev]);
      }
      return res;
    },
    []
  );

  const updateWelfarePortalConfig = useCallback(async (updates: Partial<WelfarePortalConfig>) => {
    const merged: WelfarePortalConfig = {
      ...welfarePortalConfig,
      ...updates,
      modulesConfig: {
        ...welfarePortalConfig.modulesConfig,
        ...(updates.modulesConfig || {}),
      },
      contactsConfig: {
        ...welfarePortalConfig.contactsConfig,
        ...(updates.contactsConfig || {}),
      },
      fundConfig: {
        ...welfarePortalConfig.fundConfig,
        ...(updates.fundConfig || {}),
      },
    };
    const saved = await api.updateWelfarePortalConfig(merged);
    setWelfarePortalConfig(saved);
    return saved;
  }, [welfarePortalConfig]);

  // Fund methods
  const applyFundMembership = useCallback(async (monthlyFeeAmount: number) => {
    const created = await api.applyFundMembership(monthlyFeeAmount);
    setMyFundMembership(created);
    if (isOrgRole) {
      setAllFundMemberships((prev) => {
        const exists = prev.some((m) => m.id === created.id);
        return exists ? prev.map((m) => (m.id === created.id ? created : m)) : [created, ...prev];
      });
    }
    return created;
  }, [isOrgRole]);

  const editPendingFundMembership = useCallback(async (id: string, monthlyFeeAmount: number) => {
    const updated = await api.editPendingFundMembership(id, monthlyFeeAmount);
    setMyFundMembership(updated);
    setAllFundMemberships((prev) => prev.map((m) => (m.id === id ? updated : m)));
    return updated;
  }, []);

  const deletePendingFundMembership = useCallback(async (id: string) => {
    await api.deletePendingFundMembership(id);
    setMyFundMembership(null);
    setAllFundMemberships((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const reviewFundMembership = useCallback(
    async (id: string, status: 'approved' | 'rejected' | 'pending', adminNote?: string) => {
      const updated = await api.reviewFundMembership(id, status, adminNote);
      setAllFundMemberships((prev) => prev.map((m) => (m.id === id ? updated : m)));
      if (myFundMembership?.id === id) setMyFundMembership(updated);
    },
    [myFundMembership]
  );

  const payFundFee = useCallback(
    async (data: { amount: number; periodLabel: string; paymentMethod: string; receiptUrl?: string }) => {
      const created = await api.payFundFee(data);
      setMyFundPayments((prev) => [created, ...prev]);
      if (isOrgRole) setAllFundPayments((prev) => [created, ...prev]);
      return created;
    },
    [isOrgRole]
  );

  const reviewFundPayment = useCallback(
    async (id: string, status: 'verified' | 'rejected' | 'pending', adminNote?: string) => {
      const updated = await api.reviewFundPayment(id, status, adminNote);
      setAllFundPayments((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setMyFundPayments((prev) => prev.map((p) => (p.id === id ? updated : p)));
    },
    []
  );

  // Consumables & Orders methods
  const placeConsumableOrder = useCallback(
    async (
      items: { itemId: string; title: string; quantity: number; unitPrice: number }[],
      deliveryAddress: string,
      deliveryMethod: DeliveryMethodType = 'post'
    ) => {
      const created = await api.placeConsumableOrder(items, deliveryAddress, deliveryMethod);
      setConsumableOrders((prev) => [created, ...prev]);
      // Refresh consumables to get updated stock from MySQL
      api.getConsumables().then((list) => Array.isArray(list) && setConsumables(list)).catch(() => {});
      return created;
    },
    []
  );

  const submitProductProposal = useCallback(async (data: Omit<MemberProductProposal, 'id' | 'status' | 'createdAt'>) => {
    const created = await api.submitProductProposal(data);
    setProductProposals((prev) => [created, ...prev]);
  }, []);

  const updateConsumableStock = useCallback(
    async (itemId: string, newStock: number) => {
      const target = consumables.find((c) => c.id === itemId);
      const updated = await api.updateConsumableInventory(
        itemId,
        newStock,
        target?.version || 1,
        target?.lowStockThreshold
      );
      setConsumables((prev) => prev.map((c) => (c.id === itemId ? { ...c, ...updated } : c)));
    },
    [consumables]
  );

  const updateConsumableItem = useCallback(
    async (id: string, updates: Partial<ConsumableItem>) => {
      const target = consumables.find((c) => c.id === id);
      const updated = await api.updateConsumableItem(id, {
        ...target,
        ...updates,
        expectedVersion: target?.version || 1,
      });
      setConsumables((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    },
    [consumables]
  );

  const addConsumableItem = useCallback(async (itemData: Omit<ConsumableItem, 'id'>) => {
    const created = await api.createConsumableItem(itemData);
    setConsumables((prev) => [created, ...prev]);
  }, []);

  const deleteConsumableItem = useCallback(async (id: string) => {
    await api.deleteConsumableItem(id);
    setConsumables((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateConsumableOrderStatus = useCallback(
    async (orderId: string, status: ConsumableOrder['status'], notes?: string) => {
      const target = consumableOrders.find((o) => o.id === orderId);
      const updated = await api.updateConsumableOrderStatus(orderId, status, notes, target?.version || 1);
      setConsumableOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o)));
    },
    [consumableOrders]
  );

  const updateConsumablePostalTracking = useCallback(
    async (
      orderId: string,
      data: { postalTrackingCode?: string; shippingStatus?: string; status?: string; expectedVersion: number }
    ) => {
      const res = await api.updateConsumableOrderPostalTracking(orderId, data);
      setConsumableOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                postalTrackingCode: res.postalTrackingCode,
                shippingStatus: res.shippingStatus,
                status: (res.status as any) || o.status,
                version: res.version,
              }
            : o
        )
      );
    },
    []
  );

  // Installment sales methods
  const createInstallmentPartner = useCallback(
    async (data: Omit<WelfareInstallmentPartner, 'id' | 'version' | 'createdAt'>) => {
      const created = await api.createInstallmentPartner(data);
      setInstallmentPartners((prev) => [...prev, created]);
      return created;
    },
    []
  );

  const updateInstallmentPartner = useCallback(
    async (id: string, updates: Partial<WelfareInstallmentPartner>) => {
      const updated = await api.updateInstallmentPartner(id, updates);
      setInstallmentPartners((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    },
    []
  );

  const deleteInstallmentPartner = useCallback(async (id: string) => {
    await api.deleteInstallmentPartner(id);
    setInstallmentPartners((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const submitInstallmentRequest = useCallback(
    async (data: {
      partnerId: string;
      requestedAmount: number;
      months: number;
      description?: string;
      phone?: string;
      attachments?: Array<{ url: string; name: string; size?: number }>;
    }) => {
      const created = await api.submitInstallmentRequest(data);
      setInstallmentRequests((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const reviewInstallmentRequest = useCallback(
    async (id: string, status: WelfareInstallmentRequest['status'], adminNote?: string) => {
      const updated = await api.reviewInstallmentRequest(id, status, adminNote);
      setInstallmentRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
    },
    []
  );

  const updateWelfareSectionsConfig = useCallback((configs: WelfareSectionConfig[]) => {
    setWelfareSectionsConfig(configs);
  }, []);

  const updateLoanTermsAndRules = useCallback((updates: Partial<WelfareLoanTermsAndRules>) => {
    setLoanTermsAndRules((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateCooperativeSectionInfo = useCallback((updates: Partial<CooperativeSectionInfo>) => {
    setCooperativeSectionInfo((prev) => ({ ...prev, ...updates }));
  }, []);

  const value = useMemo<WelfareContextType>(
    () => ({
      welfareRequests,
      consumables,
      consumableOrders,
      productProposals,
      welfareSectionsConfig,
      loanTermsAndRules,
      cooperativeSectionInfo,
      welfarePortalConfig,
      myFundMembership,
      myFundPayments,
      allFundMemberships,
      allFundPayments,
      installmentPartners,
      installmentRequests,
      submitWelfareRequest,
      updateWelfareStatus,
      submitAccommodationRequest,
      updateWelfarePortalConfig,
      applyFundMembership,
      editPendingFundMembership,
      deletePendingFundMembership,
      reviewFundMembership,
      payFundFee,
      reviewFundPayment,
      placeConsumableOrder,
      submitProductProposal,
      updateConsumableStock,
      updateConsumableItem,
      addConsumableItem,
      deleteConsumableItem,
      updateConsumableOrderStatus,
      updateConsumablePostalTracking,
      createInstallmentPartner,
      updateInstallmentPartner,
      deleteInstallmentPartner,
      submitInstallmentRequest,
      reviewInstallmentRequest,
      updateWelfareSectionsConfig,
      updateLoanTermsAndRules,
      updateCooperativeSectionInfo,
      refreshWelfare,
    }),
    [
      welfareRequests,
      consumables,
      consumableOrders,
      productProposals,
      welfareSectionsConfig,
      loanTermsAndRules,
      cooperativeSectionInfo,
      welfarePortalConfig,
      myFundMembership,
      myFundPayments,
      allFundMemberships,
      allFundPayments,
      installmentPartners,
      installmentRequests,
      submitWelfareRequest,
      updateWelfareStatus,
      submitAccommodationRequest,
      updateWelfarePortalConfig,
      applyFundMembership,
      editPendingFundMembership,
      deletePendingFundMembership,
      reviewFundMembership,
      payFundFee,
      reviewFundPayment,
      placeConsumableOrder,
      submitProductProposal,
      updateConsumableStock,
      updateConsumableItem,
      addConsumableItem,
      deleteConsumableItem,
      updateConsumableOrderStatus,
      updateConsumablePostalTracking,
      createInstallmentPartner,
      updateInstallmentPartner,
      deleteInstallmentPartner,
      submitInstallmentRequest,
      reviewInstallmentRequest,
      updateWelfareSectionsConfig,
      updateLoanTermsAndRules,
      updateCooperativeSectionInfo,
      refreshWelfare,
    ]
  );

  return <WelfareContext.Provider value={value}>{children}</WelfareContext.Provider>;
};

export const useWelfare = (): WelfareContextType => {
  const context = useContext(WelfareContext);
  if (!context) {
    throw new Error('useWelfare must be used within a WelfareProvider');
  }
  return context;
};
