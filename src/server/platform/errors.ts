import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

/**
 * RFC 9457 Problem Details for HTTP APIs
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  code: string;
  instance?: string;
  invalidParams?: Array<{ name: string; reason: string }>;
  timestamp: string;
  requestId?: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly title: string;
  public readonly detail: string;
  public readonly type: string;
  public readonly invalidParams?: Array<{ name: string; reason: string }>;

  constructor(params: {
    status: number;
    code: string;
    title: string;
    detail: string;
    type?: string;
    invalidParams?: Array<{ name: string; reason: string }>;
  }) {
    super(params.detail);
    this.name = 'AppError';
    this.statusCode = params.status;
    this.code = params.code;
    this.title = params.title;
    this.detail = params.detail;
    this.type = params.type || `https://api.alumni-judiciary.ir/errors/${params.code.toLowerCase()}`;
    this.invalidParams = params.invalidParams;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(detail: string, code = 'BAD_REQUEST', invalidParams?: Array<{ name: string; reason: string }>): AppError {
    return new AppError({ status: 400, code, title: 'درخواست نامعتبر', detail, invalidParams });
  }

  static unauthorized(detail = 'نام کاربری یا رمز عبور نامعتبر است.', code = 'UNAUTHORIZED'): AppError {
    return new AppError({ status: 401, code, title: 'عدم احراز هویت', detail });
  }

  static forbidden(detail = 'شما مجوز دسترسی به این منبع را ندارید.', code = 'FORBIDDEN'): AppError {
    return new AppError({ status: 403, code, title: 'عدم دسترسی مجاز', detail });
  }

  static notFound(resource = 'منبع مورد نظر', code = 'NOT_FOUND'): AppError {
    return new AppError({ status: 404, code, title: 'یافت نشد', detail: `${resource} یافت نشد.` });
  }

  static conflict(detail: string, code = 'OPTIMISTIC_LOCK_CONFLICT'): AppError {
    return new AppError({ status: 409, code, title: 'تداخل در به‌روزرسانی (نسخه داده تغییر کرده است)', detail });
  }

  static unprocessable(detail: string, code = 'UNPROCESSABLE_ENTITY'): AppError {
    return new AppError({ status: 422, code, title: 'محتوای غیرقابل پردازش', detail });
  }

  static rateLimited(retryAfterSeconds: number, code = 'RATE_LIMITED'): AppError {
    return new AppError({
      status: 429,
      code,
      title: 'محدودیت نرخ ارسال درخواست',
      detail: `تعداد درخواست‌ها بیش از سقف مجاز است. لطفاً پس از ${retryAfterSeconds} ثانیه مجدداً تلاش فرمایید.`,
    });
  }

  static serviceUnavailable(detail = 'امکان برقراری اتصال با سرور پایگاه داده وجود ندارد. لطفاً متغیرهای محیطی یا وضعیت دیتابیس MySQL را بررسی فرمایید.', code = 'DATABASE_CONNECTION_ERROR'): AppError {
    return new AppError({ status: 503, code, title: 'خطای اتصال به پایگاه داده', detail });
  }

  static internal(detail = 'خطای غیرمنتظره در سرور رخ داده است.', code = 'INTERNAL_SERVER_ERROR'): AppError {
    return new AppError({ status: 500, code, title: 'خطای داخلی سرور', detail });
  }
}

export function rfc9457ErrorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) || `req_${Date.now()}`;

  if (err instanceof AppError) {
    logger.warn(`Handled application error: [${err.code}] ${err.detail}`, {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: err.statusCode,
    });

    const responsePayload: ProblemDetails = {
      type: err.type,
      title: err.title,
      status: err.statusCode,
      detail: err.detail,
      code: err.code,
      instance: req.originalUrl,
      invalidParams: err.invalidParams,
      timestamp: new Date().toISOString(),
      requestId,
    };

    res.status(err.statusCode).json(responsePayload);
    return;
  }

  logger.error(`Unhandled system error: ${err.message}`, {
    requestId,
    method: req.method,
    url: req.originalUrl,
    statusCode: 500,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
  });

  const responsePayload: ProblemDetails = {
    type: 'https://api.alumni-judiciary.ir/errors/internal',
    title: 'خطای داخلی سرور',
    status: 500,
    detail: 'عملیات با خطای پیش‌بینی‌نشده مواجه شد. جزئیات در لاگ سیستم ثبت گردید.',
    code: 'INTERNAL_SERVER_ERROR',
    instance: req.originalUrl,
    timestamp: new Date().toISOString(),
    requestId,
  };

  res.status(500).json(responsePayload);
}
