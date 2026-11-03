/**
 * Exact Monetary Computation Engine (Item 10)
 * Completely eliminates IEEE-754 floating point inaccuracies.
 * All base monetary operations are executed in Integer Rials using BigInt.
 */

export class Money {
  /**
   * Converts Tomans to Rials: 1 Toman = 10 Rials
   */
  static tomansToRials(tomans: number | string): bigint {
    const clean = String(tomans).replace(/,/g, '').trim();
    const [whole, decimal] = clean.split('.');
    let rials = BigInt(whole || '0') * 10n;
    if (decimal) {
      const firstDecimalDigit = BigInt(decimal.charAt(0) || '0');
      rials += firstDecimalDigit;
    }
    return rials;
  }

  /**
   * Converts Rials to Tomans for presentation
   */
  static rialsToTomans(rials: bigint | string): string {
    const r = BigInt(rials);
    const tomans = r / 10n;
    return tomans.toString();
  }

  /**
   * Adds two monetary values in integer Rials
   */
  static add(aRials: string | bigint, bRials: string | bigint): string {
    const sum = BigInt(aRials) + BigInt(bRials);
    return sum.toString();
  }

  /**
   * Multiplies unit price (in Rials) by integer quantity
   */
  static multiply(unitPriceRials: string | bigint, quantity: number): string {
    if (quantity < 0 || !Number.isInteger(quantity)) {
      throw new Error('تعداد اقلام باید یک عدد صحیح مثبت باشد.');
    }
    const total = BigInt(unitPriceRials) * BigInt(quantity);
    return total.toString();
  }

  /**
   * Computes the total sum of an order's items without float arithmetic
   */
  static calculateOrderTotal(items: Array<{ unitPriceRials: string | number; quantity: number }>): string {
    let sum = 0n;
    for (const item of items) {
      const unit = BigInt(String(item.unitPriceRials).replace(/,/g, ''));
      sum += unit * BigInt(item.quantity);
    }
    return sum.toString();
  }

  /**
   * Formats Rials to standard Persian formatted text with thousand separators
   */
  static formatRials(rials: string | bigint): string {
    const str = BigInt(rials).toString();
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}
