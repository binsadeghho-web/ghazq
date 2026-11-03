/**
 * Exact Monetary Computation Engine (Item 8 & 10)
 * Completely eliminates IEEE-754 floating point inaccuracies.
 * All base monetary operations are executed in Integer Rials using BigInt.
 * Robustly parses MySQL DECIMAL string representations (e.g., '2500000.0000').
 */

export class Money {
  /**
   * Item 8: Parses DECIMAL string from MySQL (e.g. '2500000.0000', '2500000.00', '2500000').
   * Allows zero fraction decimals; throws error if fraction contains non-zero digits.
   */
  static parseDecimalRials(val: string | number | bigint): bigint {
    if (typeof val === 'bigint') return val;
    const str = String(val).replace(/,/g, '').trim();
    if (str === '') return 0n;

    const parts = str.split('.');
    const whole = parts[0] || '0';
    const fraction = parts[1];

    if (fraction !== undefined && fraction.length > 0) {
      if (!/^0+$/.test(fraction)) {
        throw new Error(`مبلغ ریال فاقد جزء اعشاری است و نمی‌تواند اعشار ناصفر داشته باشد: ${str}`);
      }
    }

    return BigInt(whole);
  }

  /**
   * Converts Tomans to Rials: 1 Toman = 10 Rials
   */
  static tomansToRials(tomans: number | string): bigint {
    const clean = String(tomans).replace(/,/g, '').trim();
    const parts = clean.split('.');
    const whole = parts[0] || '0';
    const fraction = parts[1];

    let rials = BigInt(whole) * 10n;
    if (fraction) {
      // First decimal digit of Tomans is Rials (e.g. 2.5 Tomans = 25 Rials)
      const firstDigit = BigInt(fraction.charAt(0) || '0');
      rials += firstDigit;
    }
    return rials;
  }

  /**
   * Converts Rials to Tomans for presentation
   */
  static rialsToTomans(rials: bigint | string | number): string {
    const r = this.parseDecimalRials(rials);
    const tomans = r / 10n;
    return tomans.toString();
  }

  /**
   * Adds two monetary values in integer Rials
   */
  static add(aRials: string | bigint | number, bRials: string | bigint | number): string {
    const sum = this.parseDecimalRials(aRials) + this.parseDecimalRials(bRials);
    return sum.toString();
  }

  /**
   * Multiplies unit price (in Rials) by integer quantity
   */
  static multiply(unitPriceRials: string | bigint | number, quantity: number): string {
    if (quantity < 0 || !Number.isInteger(quantity)) {
      throw new Error('تعداد اقلام باید یک عدد صحیح مثبت باشد.');
    }
    const total = this.parseDecimalRials(unitPriceRials) * BigInt(quantity);
    return total.toString();
  }

  /**
   * Computes the total sum of an order's items without float arithmetic
   */
  static calculateOrderTotal(items: Array<{ unitPriceRials: string | number | bigint; quantity: number }>): string {
    let sum = 0n;
    for (const item of items) {
      const unit = this.parseDecimalRials(item.unitPriceRials);
      sum += unit * BigInt(item.quantity);
    }
    return sum.toString();
  }

  /**
   * Formats Rials to standard Persian formatted text with thousand separators
   */
  static formatRials(rials: string | bigint | number): string {
    const str = this.parseDecimalRials(rials).toString();
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}
