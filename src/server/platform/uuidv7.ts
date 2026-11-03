import crypto from 'crypto';

/**
 * UUIDv7 implementation conforming to RFC 9562
 * - Time-ordered 48-bit timestamp (ms since UNIX epoch)
 * - 4-bit version (0b0111 = 7)
 * - 12-bit pseudo-random / sub-millisecond sequence
 * - 2-bit variant (0b10)
 * - 62-bit cryptographically secure random bits
 *
 * Stored in MySQL 8 as BINARY(16) for performance and indexed sequentially,
 * converted to string format (8-4-4-4-12) exclusively at API boundaries.
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
  if (cleanHex.length !== 32) {
    throw new Error(`Invalid UUID string length: ${uuid}`);
  }
  return Buffer.from(cleanHex, 'hex');
}

export function binaryToUuidString(buffer: Buffer): string {
  if (buffer.length !== 16) {
    throw new Error(`Invalid UUID buffer length: ${buffer.length}`);
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
