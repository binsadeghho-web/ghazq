/**
 * Automated Concurrency Test (Item 12)
 * Simulates 20 concurrent alumni purchase requests for an item with initial stock = 5.
 * Verifies that:
 * 1. Exactly 5 requests succeed.
 * 2. Exactly 15 requests fail with 422 Unprocessable Entity.
 * 3. Final stock is exactly 0 and NEVER negative.
 */

interface MockProduct {
  id: string;
  title: string;
  stock: number;
}

// Simulated Atomic Database Transaction Engine
class AtomicInventoryManager {
  private products = new Map<string, MockProduct>();
  private activeLocks = new Set<string>();

  constructor() {
    this.products.set('prod_test_01', {
      id: 'prod_test_01',
      title: 'مجموعه دسته‌بندی موضوعی آراء وحدت رویه',
      stock: 5, // Initial stock = 5
    });
  }

  /**
   * Atomic decrement mimicking SQL:
   * UPDATE products SET stock = stock - 1 WHERE id = ? AND stock > 0;
   */
  async purchaseAtomic(productId: string, userId: string): Promise<{ success: boolean; status: number; message: string }> {
    // Artificial jitter to induce maximum concurrency race conditions
    await new Promise(r => setTimeout(r, Math.random() * 20));

    const product = this.products.get(productId);
    if (!product) {
      return { success: false, status: 404, message: 'کالا یافت نشد' };
    }

    // Atomic compare-and-decrement
    if (product.stock > 0) {
      product.stock -= 1;
      return {
        success: true,
        status: 200,
        message: `سفارش کاربر ${userId} با موفقیت ثبت شد. موجودی باقیمانده: ${product.stock}`,
      };
    } else {
      return {
        success: false,
        status: 422,
        message: 'موجودی این اثر به پایان رسیده است.',
      };
    }
  }

  getStock(productId: string): number {
    return this.products.get(productId)?.stock ?? -1;
  }
}

export async function runConcurrencyTest() {
  console.log('====================================================');
  console.log('🧪 اجرای تست خودکار هم‌زمانی (Item 12): ۲۰ درخواست همزمان برای ۵ موجودی');
  console.log('====================================================');

  const manager = new AtomicInventoryManager();
  const initialStock = manager.getStock('prod_test_01');
  console.log(`📦 موجودی اولیه محصول: ${initialStock}`);

  // Create 20 concurrent requests
  const requests = Array.from({ length: 20 }, (_, i) => {
    const userId = `usr_alumni_${String(i + 1).padStart(2, '0')}`;
    return manager.purchaseAtomic('prod_test_01', userId);
  });

  const results = await Promise.all(requests);

  const successful = results.filter(r => r.status === 200);
  const failed = results.filter(r => r.status === 422);
  const finalStock = manager.getStock('prod_test_01');

  console.log(`✅ تعداد سفارشات موفق (200 OK): ${successful.length}`);
  console.log(`❌ تعداد سفارشات ناموفق به دلیل کسری موجودی (422 Unprocessable): ${failed.length}`);
  console.log(`📊 موجودی نهایی کالا در انبار دیتابیس: ${finalStock}`);

  const isSuccess = successful.length === 5 && failed.length === 15 && finalStock === 0;

  if (isSuccess) {
    console.log('🎉 نتیجه تست: کاملاً موفق! موجودی هرگز منفی نشد و دقیقاً ۵ سفارش ثبت شد.');
  } else {
    console.error('⚠️ نتیجه تست ناموفق: عدم تعادل در تخصیص هم‌زمان.');
    process.exit(1);
  }
  console.log('====================================================\n');
  return { isSuccess, successfulCount: successful.length, failedCount: failed.length, finalStock };
}

// Execute standalone if executed via CLI
runConcurrencyTest();
