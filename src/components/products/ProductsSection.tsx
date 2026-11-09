import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { BookOpen } from 'lucide-react';

import { ProductStatsHeader } from './subcomponents/ProductStatsHeader';
import { ProductShelfBar } from './subcomponents/ProductShelfBar';
import { ProductCard } from './subcomponents/ProductCard';
import { ProductIntroModal } from './subcomponents/ProductIntroModal';
import { ProductCheckoutModal } from './subcomponents/ProductCheckoutModal';
import { ProductBuilderModal } from './subcomponents/ProductBuilderModal';
import { ProductDeleteConfirmModal } from './subcomponents/ProductDeleteConfirmModal';
import { ProductLightboxModal } from './subcomponents/ProductLightboxModal';

export const ProductsSection: React.FC = () => {
  const { currentUser, products, purchaseProduct, addProduct, updateProduct, sendPinOtpSms } = useApp();

  const isOfficial = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  // Shelves / Tabs: 'books' | 'multimedia' | 'combined' | 'my_library'
  const [activeShelf, setActiveShelf] = useState<'books' | 'multimedia' | 'combined' | 'my_library'>('books');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);
  const [purchasingProduct, setPurchasingProduct] = useState<Product | null>(null);
  const [introProduct, setIntroProduct] = useState<Product | null>(null);
  const [productBuilderOpen, setProductBuilderOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Active non-deleted products
  const activeProducts = useMemo(() => products.filter(p => !p.isDeleted), [products]);
  const booksShelf = useMemo(() => activeProducts.filter(p => p.format === 'book'), [activeProducts]);
  const multimediaShelf = useMemo(
    () => activeProducts.filter(p => p.format === 'multimedia' || p.format === 'audio_series'),
    [activeProducts]
  );
  const myOwnedProducts = useMemo(() => activeProducts.filter(p => p.isOwned), [activeProducts]);

  const currentShelfList = useMemo(() => {
    let list: Product[] = [];
    if (activeShelf === 'books') list = booksShelf;
    else if (activeShelf === 'multimedia') list = multimediaShelf;
    else if (activeShelf === 'my_library') list = myOwnedProducts;
    else list = activeProducts; // combined

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return list.filter(p => p.title.toLowerCase().includes(q) || p.authorOrPresenter.toLowerCase().includes(q));
    }
    return list;
  }, [activeShelf, booksShelf, multimediaShelf, myOwnedProducts, activeProducts, searchQuery]);

  // Handlers
  const handleOpenPurchase = (product: Product) => {
    setPurchasingProduct(product);
  };

  const handleSubmitPurchase = async (orderData: {
    fulfillmentChoice?: 'postal' | 'pickup';
    shippingFee: number;
    shippingNotice: string;
    shippingAddress?: string;
  }) => {
    if (!purchasingProduct) return;
    await purchaseProduct(purchasingProduct.id, orderData);
  };

  const handleOpenProductBuilder = (productToEdit?: Product) => {
    setEditingProduct(productToEdit || null);
    setProductBuilderOpen(true);
  };

  const handleSaveProductBuilder = (payload: any, editingProductId: string | null) => {
    if (editingProductId) {
      updateProduct(editingProductId, payload);
    } else {
      addProduct(payload);
    }
    setProductBuilderOpen(false);
  };

  const handleConfirmSoftDelete = async (productId: string) => {
    await new Promise(r => setTimeout(r, 600));
    updateProduct(productId, { isDeleted: true });
    const target = products.find(p => p.id === productId);
    if (target) {
      alert(`اثر [${target.title}] با موفقیت حذف منطقی (Safe Delete) شد. سوابق سفارشات کاربران حفظ گردید.`);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* 4 Metric Cards + Main Header */}
      <ProductStatsHeader
        activeProductsCount={activeProducts.length}
        booksCount={booksShelf.length}
        multimediaCount={multimediaShelf.length}
        myOwnedCount={myOwnedProducts.length}
        onSelectShelf={setActiveShelf}
        isOfficial={isOfficial}
        onOpenAddProduct={() => handleOpenProductBuilder()}
      />

      {/* Shelves Navigation & Search Bar */}
      <ProductShelfBar
        activeShelf={activeShelf}
        onSelectShelf={setActiveShelf}
        booksCount={booksShelf.length}
        multimediaCount={multimediaShelf.length}
        myOwnedCount={myOwnedProducts.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentShelfList.length === 0 ? (
          <div className="col-span-full p-16 text-center text-xs text-slate-400 space-y-3 glass-card rounded-3xl border border-slate-200 dark:border-white/10">
            <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-extrabold text-slate-700 dark:text-slate-300 text-sm">
              هیچ اثری در این قفسه یا با جستجوی شما یافت نشد.
            </p>
          </div>
        ) : (
          currentShelfList.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              isOfficial={isOfficial}
              onOpenLightbox={setLightboxImage}
              onOpenIntro={setIntroProduct}
              onOpenPurchase={handleOpenPurchase}
              onOpenEdit={handleOpenProductBuilder}
              onOpenDelete={setProductToDelete}
            />
          ))
        )}
      </div>

      {/* Modal 1: Product Intro */}
      <ProductIntroModal
        product={introProduct}
        onClose={() => setIntroProduct(null)}
        onOpenPurchase={handleOpenPurchase}
        onOpenLightbox={setLightboxImage}
      />

      {/* Modal 2: Multi-step Purchase Checkout */}
      <ProductCheckoutModal
        product={purchasingProduct}
        onClose={() => setPurchasingProduct(null)}
        currentUserAddress={currentUser?.residentialAddress}
        onSubmitPurchase={handleSubmitPurchase}
      />

      {/* Modal 3: Advanced Product Builder / Editor */}
      <ProductBuilderModal
        isOpen={productBuilderOpen}
        editingProduct={editingProduct}
        onClose={() => setProductBuilderOpen(false)}
        onSave={handleSaveProductBuilder}
      />

      {/* Modal 4: Soft Delete PIN Confirmation */}
      <ProductDeleteConfirmModal
        product={productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirmDelete={handleConfirmSoftDelete}
        sendPinOtpSms={sendPinOtpSms}
      />

      {/* Modal 5: Lightbox Zoom Viewer */}
      <ProductLightboxModal
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
};
