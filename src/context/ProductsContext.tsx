import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Product,
  ProductCategoryConfig,
  ProductOrder,
  ProductsStoreConfig,
  User,
} from '../types';
import { api } from '../services/apiClient';

export const DEFAULT_BUILT_IN_CATEGORIES: ProductCategoryConfig[] = [
  {
    id: 'book',
    label: 'کتب و منشورات علمی',
    shortLabel: 'کتب',
    kind: 'book',
    isEnabled: true,
    isBuiltIn: true,
  },
  {
    id: 'multimedia',
    label: 'نشست‌های علمی (صوتی و تصویری)',
    shortLabel: 'نشست‌ها',
    kind: 'session',
    isEnabled: true,
    isBuiltIn: true,
  },
  {
    id: 'audio_series',
    label: 'درس‌گفتارها و سلسله مباحث',
    shortLabel: 'درس‌گفتارها',
    kind: 'lecture',
    isEnabled: true,
    isBuiltIn: true,
  },
];

export const DEFAULT_CLIENT_STORE_CONFIG: ProductsStoreConfig = {
  isStoreEnabled: true,
  disabledNotice: 'بخش کتاب و محصولات چند رسانه‌ای موقتاً توسط مدیریت سامانه در حال به‌روزرسانی است.',
  enabledCategories: {
    book: true,
    multimedia: true,
    audio_series: true,
  },
  customCategories: DEFAULT_BUILT_IN_CATEGORIES,
  storeTitle: 'کتاب و محصولات چند رسانه‌ای',
  storeSubtitle:
    'عرضه تخصصی کتب مرجع، نشست‌های علمی صوتی و تصویری و درس‌گفتارهای مرکز فقه و حقوق اسلامی با امکان دسترسی دیجیتال پس از ثبت‌نام یا ارسال نسخه فیزیکی',
  gateways: [
    {
      id: 'gw_zarinpal',
      name: 'درگاه امن زرین‌پال (شتاب)',
      providerCode: 'zarinpal',
      description: 'پرداخت آنی با کلیه کارت‌های عضو شبکه شتاب و تایید لحظه‌ای سفارش',
      badge: 'پیشنهادی',
      isActive: true,
    },
    {
      id: 'gw_behpardakht',
      name: 'درگاه شاپرک (به‌پرداخت ملت)',
      providerCode: 'behpardakht',
      description: 'درگاه رسمی بانک ملت ویژه تراکنش‌های انتشارات و مؤسسات علمی',
      badge: 'رسمی',
      isActive: true,
    },
  ],
  bankCardNumber: '۶۰۳۷-۹۹۷۵-۹۵۰۰-۱۴۰۳',
  bankAccountHolder: 'مرکز نخبگان فقه و قضا (بخش انتشارات)',
  bankSheba: 'IR450170000000112233445566',
  bankName: 'بانک ملی ایران',
  defaultDeliveryOptions: {
    complexPickup: {
      enabled: true,
      fee: 0,
      label: 'تحویل حضوری در مجتمع',
      notice: 'قم، خیابان معلم، مجتمع نخبگان فقه و قضا، طبقه دوم، دبیرخانه انتشارات',
    },
    postal: {
      enabled: true,
      fee: 65000,
      label: 'ارسال با پست پیشتاز',
      notice: 'ارسال سراسری با بسته‌بندی ایمن و صدور کد رهگیری مرسوله پستی',
    },
    courier: {
      enabled: true,
      fee: 95000,
      label: 'ارسال با پیک اختصاصی',
      notice: 'تحویل سریع درب منزل یا محل کار توسط پیک (قم و تهران)',
    },
  },
  version: 1,
};

function mergeStoreConfig(incoming?: Partial<ProductsStoreConfig> | null): ProductsStoreConfig {
  if (!incoming || typeof incoming !== 'object') return DEFAULT_CLIENT_STORE_CONFIG;
  const mergedEnabled: Record<string, boolean> = {
    ...DEFAULT_CLIENT_STORE_CONFIG.enabledCategories,
    ...(incoming.enabledCategories || {}),
  };
  const customCategories = Array.isArray(incoming.customCategories) && incoming.customCategories.length > 0
    ? incoming.customCategories
    : DEFAULT_BUILT_IN_CATEGORIES.map(c => ({
        ...c,
        isEnabled: mergedEnabled[c.id] !== undefined ? mergedEnabled[c.id] : c.isEnabled,
      }));
  return {
    ...DEFAULT_CLIENT_STORE_CONFIG,
    ...incoming,
    enabledCategories: mergedEnabled,
    customCategories,
  };
}

export interface ProductsContextType {
  products: Product[];
  productOrders: ProductOrder[];
  productsStoreConfig: ProductsStoreConfig;
  updateProductsStoreConfig: (updates: Partial<ProductsStoreConfig>) => Promise<ProductsStoreConfig>;
  purchaseProduct: (productId: string, orderDetails?: any) => Promise<{ product: Product; order: ProductOrder }>;
  reviewProductOrder: (
    orderId: string,
    status: 'confirmed' | 'rejected',
    adminNote?: string,
    postalTrackingCode?: string,
    shippingStatus?: string
  ) => Promise<void>;
  addProduct: (productData: Omit<Product, 'id' | 'isOwned'>) => Promise<Product>;
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<Product | void>;
  toggleProductShowcase: (productId: string, showInShowcase: boolean) => Promise<Product | void>;
  softDeleteProduct: (productId: string) => Promise<void>;
  reorderProducts: (orderedIds: string[]) => Promise<void>;
  refreshProducts: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

interface ProductsProviderProps {
  children: React.ReactNode;
  currentUser?: User | null;
}

export const ProductsProvider: React.FC<ProductsProviderProps> = ({
  children,
  currentUser,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productOrders, setProductOrders] = useState<ProductOrder[]>([]);
  const [productsStoreConfig, setProductsStoreConfig] = useState<ProductsStoreConfig>(
    DEFAULT_CLIENT_STORE_CONFIG
  );
  const lastSyncRef = useRef<number>(0);

  const refreshProducts = useCallback(async () => {
    if (!currentUser) return;
    lastSyncRef.current = Date.now();
    try {
      const [fetchedProducts, fetchedConfig, fetchedOrders] = await Promise.all([
        api.getProducts(),
        api.getProductsStoreConfig().catch(() => null),
        api.getProductOrders().catch(() => []),
      ]);
      if (Array.isArray(fetchedProducts)) setProducts(fetchedProducts);
      if (fetchedConfig && typeof fetchedConfig === 'object') {
        setProductsStoreConfig(mergeStoreConfig(fetchedConfig));
      }
      if (Array.isArray(fetchedOrders)) setProductOrders(fetchedOrders);
    } catch {}
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setProducts([]);
      setProductOrders([]);
      return;
    }

    refreshProducts();

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastSyncRef.current > 4000) {
        refreshProducts();
      }
    };
    const handleForceSync = () => {
      refreshProducts();
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('app:auth_changed', handleForceSync);
    window.addEventListener('app:role_switched', handleForceSync);

    const pollInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshProducts();
      }
    }, 20000);

    const unsubscribe = api.subscribeToEvents(event => {
      if (!event.type.startsWith('products.')) return;
      const delta = event.data?.data || event.data || {};
      const resourceId = delta?.resourceId;
      const updates = delta?.updates;
      const version = delta?.version;

      if (event.type === 'products.store_config_updated' && delta?.config) {
        setProductsStoreConfig(mergeStoreConfig(delta.config));
        refreshProducts();
        return;
      }

      if (event.type === 'products.deleted' && resourceId) {
        setProducts(prev => prev.filter(p => p.id !== resourceId));
        return;
      }

      if (event.type === 'products.reordered' && Array.isArray(delta?.orderedIds)) {
        const orderIndex = new Map<string, number>(
          (delta.orderedIds as string[]).map((id, idx) => [id, idx + 1])
        );
        setProducts(prev =>
          [...prev]
            .map(p => ({ ...p, displayOrder: orderIndex.get(p.id) ?? p.displayOrder ?? 999 }))
            .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
        );
        return;
      }

      if (event.type === 'products.order_updated' && delta?.order) {
        const updatedOrder = delta.order as ProductOrder;
        setProductOrders(prev => {
          const exists = prev.some(o => o.id === updatedOrder.id);
          return exists
            ? prev.map(o => (o.id === updatedOrder.id ? updatedOrder : o))
            : [updatedOrder, ...prev];
        });
        refreshProducts();
        return;
      }

      if (event.type === 'products.purchased') {
        if (delta?.order) {
          const newOrder = delta.order as ProductOrder;
          const isOfficial =
            currentUser.role === 'admin' ||
            currentUser.role === 'super_admin' ||
            currentUser.role === 'alumni_manager' ||
            currentUser.role === 'supervisor';
          if (isOfficial || newOrder.userId === currentUser.id) {
            setProductOrders(prev =>
              prev.some(o => o.id === newOrder.id) ? prev : [newOrder, ...prev]
            );
          }
        }
        refreshProducts();
        return;
      }

      if (resourceId && updates && typeof updates === 'object') {
        setProducts(prev => {
          const exists = prev.some(p => p.id === resourceId);
          if (exists) {
            return prev.map(p =>
              p.id === resourceId
                ? { ...p, ...updates, version: version || ((p as any).version || 1) + 1 }
                : p
            );
          }
          if (updates.title) {
            return [updates as Product, ...prev];
          }
          return prev;
        });
      } else {
        refreshProducts();
      }
    });

    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('app:auth_changed', handleForceSync);
      window.removeEventListener('app:role_switched', handleForceSync);
      window.clearInterval(pollInterval);
      unsubscribe();
    };
  }, [currentUser, refreshProducts]);

  const updateProductsStoreConfig = useCallback(
    async (updates: Partial<ProductsStoreConfig>): Promise<ProductsStoreConfig> => {
      const merged = mergeStoreConfig({ ...productsStoreConfig, ...updates });
      try {
        const res = await api.updateProductsStoreConfig(merged, productsStoreConfig.version);
        const fresh = mergeStoreConfig(res?.config || merged);
        setProductsStoreConfig(fresh);
        await refreshProducts();
        return fresh;
      } catch (err: any) {
        if (err?.status === 409 || String(err?.code || '').includes('CONFLICT')) {
          const latest = await api.getProductsStoreConfig();
          const retriedMerged = mergeStoreConfig({
            ...latest,
            ...updates,
            enabledCategories: {
              ...(latest?.enabledCategories || {}),
              ...(updates?.enabledCategories || {}),
            },
          });
          const retryRes = await api.updateProductsStoreConfig(retriedMerged, latest?.version);
          const fresh = mergeStoreConfig(retryRes?.config || retriedMerged);
          setProductsStoreConfig(fresh);
          await refreshProducts();
          return fresh;
        }
        throw err;
      }
    },
    [productsStoreConfig, refreshProducts]
  );

  const purchaseProduct = useCallback(
    async (productId: string, orderDetails?: any) => {
      const res = await api.purchaseProduct(productId, orderDetails);
      const updatedProduct: Product = res.product;
      const createdOrder: ProductOrder = res.order;

      setProducts(prev =>
        prev.map(p =>
          p.id === productId
            ? {
                ...p,
                ...updatedProduct,
              }
            : p
        )
      );
      setProductOrders(prev => [createdOrder, ...prev.filter(o => o.id !== createdOrder.id)]);
      return { product: updatedProduct, order: createdOrder };
    },
    []
  );

  const reviewProductOrder = useCallback(
    async (
      orderId: string,
      status: 'confirmed' | 'rejected',
      adminNote?: string,
      postalTrackingCode?: string,
      shippingStatus?: string
    ) => {
      const target = productOrders.find(o => o.id === orderId);
      const res = await api.reviewProductOrder(
        orderId,
        status,
        target?.version ?? 1,
        adminNote,
        postalTrackingCode,
        shippingStatus
      );
      const updatedOrder = res.order as ProductOrder;
      setProductOrders(prev => prev.map(o => (o.id === orderId ? updatedOrder : o)));
      await refreshProducts();
    },
    [productOrders, refreshProducts]
  );

  const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'isOwned'>): Promise<Product> => {
    const created = await api.createProduct(productData);
    setProducts(prev => [created, ...prev.filter(p => p.id !== created.id)]);
    return created;
  }, []);

  const updateProduct = useCallback(
    async (productId: string, updates: Partial<Product>): Promise<Product | void> => {
      if (updates.isDeleted) {
        const target = products.find(p => p.id === productId);
        await api.deleteProduct(productId, target?.version ?? 1);
        setProducts(prev => prev.filter(p => p.id !== productId));
        return;
      }
      const target = products.find(p => p.id === productId);
      const updated = await api.updateProduct(productId, updates, updates.version ?? target?.version ?? 1);
      setProducts(prev => prev.map(p => (p.id === productId ? updated : p)));
      return updated;
    },
    [products]
  );

  const toggleProductShowcase = useCallback(
    async (productId: string, showInShowcase: boolean): Promise<Product | void> => {
      const target = products.find(p => p.id === productId);
      const updated = await api.toggleProductShowcase(productId, showInShowcase, target?.version);
      setProducts(prev => prev.map(p => (p.id === productId ? updated : p)));
      return updated;
    },
    [products]
  );

  const softDeleteProduct = useCallback(
    async (productId: string) => {
      const target = products.find(p => p.id === productId);
      await api.deleteProduct(productId, target?.version ?? 1);
      setProducts(prev => prev.filter(p => p.id !== productId));
    },
    [products]
  );

  const reorderProducts = useCallback(async (orderedIds: string[]) => {
    await api.reorderProducts(orderedIds);
    const orderMap = new Map(orderedIds.map((id, idx) => [id, idx + 1]));
    setProducts(prev =>
      [...prev]
        .map(p => ({ ...p, displayOrder: orderMap.get(p.id) ?? p.displayOrder ?? 999 }))
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    );
  }, []);

  const value = useMemo<ProductsContextType>(
    () => ({
      products,
      productOrders,
      productsStoreConfig,
      updateProductsStoreConfig,
      purchaseProduct,
      reviewProductOrder,
      addProduct,
      updateProduct,
      toggleProductShowcase,
      softDeleteProduct,
      reorderProducts,
      refreshProducts,
    }),
    [
      products,
      productOrders,
      productsStoreConfig,
      updateProductsStoreConfig,
      purchaseProduct,
      reviewProductOrder,
      addProduct,
      updateProduct,
      toggleProductShowcase,
      softDeleteProduct,
      reorderProducts,
      refreshProducts,
    ]
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
};

export const useProducts = (): ProductsContextType => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};
