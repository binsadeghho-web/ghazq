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
  private formatLog(level: LogLevel, message: string, meta: Partial<StructuredLogPayload> = {}): string {
    const entry: StructuredLogPayload = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
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
