import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Product, ProductOrder, User } from '../types';
import { INITIAL_PRODUCTS, INITIAL_PRODUCT_ORDERS } from '../data/mockData';
import { api } from '../services/apiClient';

export interface ProductsContextType {
  products: Product[];
  productOrders: ProductOrder[];
  purchaseProduct: (productId: string, orderDetails?: Partial<ProductOrder>) => Promise<void>;
  reviewProductOrder: (orderId: string, status: 'confirmed' | 'rejected', adminNote?: string) => Promise<void>;
  addProduct: (productData: Omit<Product, 'id' | 'isOwned'>) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
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
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [productOrders, setProductOrders] = useState<ProductOrder[]>(INITIAL_PRODUCT_ORDERS);

  const refreshProducts = useCallback(async () => {
    try {
      const fetched = await api.getProducts();
      if (Array.isArray(fetched)) setProducts(fetched);
    } catch {}
  }, []);

  useEffect(() => {
    refreshProducts();
    const unsubscribe = api.subscribeToEvents(event => {
      if (event.type.startsWith('products.')) {
        const delta = event.data?.data;
        const resourceId = delta?.resourceId;
        const updates = delta?.updates;
        const version = delta?.version;

        if (resourceId && updates && typeof updates === 'object') {
          setProducts(prev => {
            const exists = prev.some(p => p.id === resourceId);
            if (exists) {
              return prev.map(p => p.id === resourceId ? { ...p, ...updates, version: version || ((p as any).version || 1) + 1 } : p);
            }
            if (updates.title) {
              return [updates as Product, ...prev];
            }
            return prev;
          });
        } else {
          refreshProducts();
        }
      }
    });
    return () => unsubscribe();
  }, [refreshProducts]);

  const purchaseProduct = useCallback(async (productId: string, orderDetails?: Partial<ProductOrder>) => {
    const targetProduct = products.find(p => p.id === productId);
    const isGateway = orderDetails?.paymentMethod === 'online_gateway' || !orderDetails?.paymentMethod;
    const status = isGateway ? 'confirmed' : 'pending_review';

    try {
      const updated = await api.purchaseProduct(productId);
      setProducts(prev => prev.map(p => (p.id === productId ? { ...updated, isOwned: true } : p)));
    } catch {
      setProducts(prev => prev.map(p => (p.id === productId ? { ...p, isOwned: true } : p)));
    }

    const newOrder: ProductOrder = {
      id: `prd_ord_${Date.now()}`,
      productId,
      productTitle: targetProduct?.title || 'محصول تخصصی',
      productFormat: targetProduct?.format || 'book',
      userId: currentUser?.id || 'usr_alumni_01',
      userName: currentUser?.fullName || 'دکتر علیرضا میرزایی',
      userPhone: currentUser?.phone || '09127778899',
      userNationalId: currentUser?.nationalId || '0019988776',
      userRoleTitle: currentUser?.roleTitle || 'دانش‌آموخته',
      orderedAt: new Date().toLocaleDateString('fa-IR'),
      amountPaid: orderDetails?.amountPaid ?? targetProduct?.price ?? 0,
      paymentMethod: orderDetails?.paymentMethod || 'online_gateway',
      paymentStatus: status,
      trackingCode: orderDetails?.trackingCode || (isGateway ? `SHP-ORD-${Date.now().toString().slice(-6)}` : `TRX-PRD-${Date.now().toString().slice(-6)}`),
      receiptBankName: orderDetails?.receiptBankName || (isGateway ? 'درگاه شتاب' : 'بانک ملی ایران'),
      receiptDate: orderDetails?.receiptDate || new Date().toLocaleDateString('fa-IR'),
      shippingAddress: orderDetails?.shippingAddress,
    };

    setProductOrders(prev => [newOrder, ...prev]);
  }, [products, currentUser]);

  const reviewProductOrder = useCallback(async (orderId: string, status: 'confirmed' | 'rejected', adminNote?: string) => {
    setProductOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        paymentStatus: status,
        adminNote: adminNote || (status === 'confirmed' ? 'سفارش تایید شد.' : 'فیش واریزی مورد تایید قرار نگرفت.'),
        reviewedBy: currentUser?.fullName || 'مدیر سیستم',
        reviewedAt: new Date().toISOString(),
      };
    }));
  }, [currentUser]);

  const addProduct = useCallback((productData: Omit<Product, 'id' | 'isOwned'>) => {
    const newProduct: Product = {
      ...productData,
      id: `prd_${Date.now()}`,
      isOwned: false,
    };
    setProducts(prev => [newProduct, ...prev]);
  }, []);

  const updateProduct = useCallback((productId: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => (p.id === productId ? { ...p, ...updates } : p)));
  }, []);

  const value = useMemo<ProductsContextType>(() => ({
    products,
    productOrders,
    purchaseProduct,
    reviewProductOrder,
    addProduct,
    updateProduct,
    refreshProducts,
  }), [
    products,
    productOrders,
    purchaseProduct,
    reviewProductOrder,
    addProduct,
    updateProduct,
    refreshProducts,
  ]);

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = (): ProductsContextType => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};
