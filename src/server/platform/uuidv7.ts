import crypto from 'crypto';

/**
 * UUIDv7 implementation conforming to RFC 9562 & MySQL 8 BINARY(16) helpers (Item 6)
 */

export function generateUUIDv7Binary(): Buffer {
  const bytes = Buffer.alloc(16);
  const now = Date.now();

  // 1. Timestamp (48 bits / 6 bytes)
  bytes.writeUIntBE(now, 0, 6);

  // 2. Random bytes for the remaining 10 bytes (80 bits)
  const randomBytes = crypto.randomBytes(10);
  randomBytes.copy(bytes, 6);

  // 3. Set version 7 in high nibble of octet 6: (bytes[6] & 0x0f) | 0x70
  bytes[6] = (bytes[6] & 0x0f) | 0x70;

  // 4. Set variant 10xx in high 2 bits of octet 8: (bytes[8] & 0x3f) | 0x80
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  return bytes;
}

export function generateUUIDv7(): string {
  const bytes = generateUUIDv7Binary();
  return binaryToUuidString(bytes);
}

export function uuidStringToBinary(uuid: string): Buffer {
  const cleanHex = uuid.replace(/-/g, '');
  if (cleanHex.length === 32 && /^[0-9a-fA-F]{32}$/.test(cleanHex)) {
    return Buffer.from(cleanHex, 'hex');
  }
  if (uuid.length <= 16) {
    const buf = Buffer.alloc(16);
    buf.write(uuid, 'utf-8');
    return buf;
  }
  return crypto.createHash('md5').update(uuid).digest();
}

export function binaryToUuidString(buffer: Buffer): string {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length !== 16) {
    return String(buffer || '');
  }
  const hex = buffer.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * Item 6: Unified Helpers for MySQL 8 BINARY(16) UUID conversion
 */
export function toIdBuffer(id: string | Buffer): Buffer {
  if (Buffer.isBuffer(id)) return id;
  if (!id || typeof id !== 'string') return Buffer.alloc(16);
  return uuidStringToBinary(id);
}

export function fromIdBuffer(val: Buffer | string | any): string {
  if (typeof val === 'string') return val;
  if (!val) return '';
  if (Buffer.isBuffer(val)) {
    if (val.length === 16) {
      return binaryToUuidString(val);
    }
    return val.toString('hex');
  }
  return String(val);
}
