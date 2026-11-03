/**
 * Structured JSON Logger (12-Factor & RFC standard)
 * Outputs structured JSON to stdout for queryability and observability.
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface StructuredLogPayload {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  traceId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  durationMs?: number;
  actorId?: string;
  actorRole?: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

export class StructuredLogger {
  private maskPii(text: string): string {
    // Mask Iranian mobile numbers (09xxxxxxxxx -> 0912***4567)
    let masked = text.replace(/(\b09\d{2})\d{4}(\d{3}\b)/g, '$1****$2');
    // Mask 10-digit national IDs (\b\d{10}\b -> 123****789)
    masked = masked.replace(/(\b\d{3})\d{4}(\d{3}\b)/g, '$1****$2');
    return masked;
  }

  private sanitizeContext(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized: Record<string, any> = Array.isArray(obj) ? [] : {};
    for (const [key, value] of Object.entries(obj)) {
      if (/password|token|secret|pin/i.test(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string') {
        sanitized[key] = this.maskPii(value);
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeContext(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private formatLog(level: LogLevel, message: string, meta: Partial<StructuredLogPayload> = {}): string {
    const entry: StructuredLogPayload = {
      timestamp: new Date().toISOString(),
      level,
      message: this.maskPii(message),
      ...meta,
      context: meta.context ? this.sanitizeContext(meta.context) : undefined,
    };
    return JSON.stringify(entry);
  }

  info(message: string, meta?: Partial<StructuredLogPayload>): void {
    console.log(this.formatLog('info', message, meta));
  }

  warn(message: string, meta?: Partial<StructuredLogPayload>): void {
    console.warn(this.formatLog('warn', message, meta));
  }

  error(message: string, meta?: Partial<StructuredLogPayload>): void {
    console.error(this.formatLog('error', message, meta));
  }

  debug(message: string, meta?: Partial<StructuredLogPayload>): void {
    if (process.env.DEBUG === 'true') {
      console.log(this.formatLog('debug', message, meta));
    }
  }
}

export const logger = new StructuredLogger();
