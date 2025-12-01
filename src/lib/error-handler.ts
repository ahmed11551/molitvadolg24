// Утилиты для обработки ошибок API

/**
 * Коды ошибок API
 */
export enum APIErrorCode {
  // Сетевые ошибки
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",
  OFFLINE = "OFFLINE",
  
  // Ошибки аутентификации
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  
  // Ошибки валидации
  VALIDATION_ERROR = "VALIDATION_ERROR",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  INVALID_FORMAT = "INVALID_FORMAT",
  
  // Ошибки данных
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  
  // Серверные ошибки
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  RATE_LIMITED = "RATE_LIMITED",
  
  // Специфичные ошибки
  PDF_GENERATION_FAILED = "PDF_GENERATION_FAILED",
  CALCULATION_FAILED = "CALCULATION_FAILED",
  SYNC_FAILED = "SYNC_FAILED",
  
  // Неизвестная ошибка
  UNKNOWN = "UNKNOWN",
}

/**
 * Сообщения ошибок на русском
 */
const ERROR_MESSAGES: Record<APIErrorCode, string> = {
  [APIErrorCode.NETWORK_ERROR]: "Ошибка сети. Проверьте подключение к интернету.",
  [APIErrorCode.TIMEOUT]: "Превышено время ожидания ответа от сервера.",
  [APIErrorCode.OFFLINE]: "Нет подключения к интернету. Данные будут синхронизированы позже.",
  
  [APIErrorCode.UNAUTHORIZED]: "Требуется авторизация. Войдите через Telegram.",
  [APIErrorCode.FORBIDDEN]: "Доступ запрещён.",
  [APIErrorCode.TOKEN_EXPIRED]: "Сессия истекла. Перезапустите приложение.",
  
  [APIErrorCode.VALIDATION_ERROR]: "Неверные данные запроса.",
  [APIErrorCode.MISSING_REQUIRED_FIELD]: "Не заполнены обязательные поля.",
  [APIErrorCode.INVALID_FORMAT]: "Неверный формат данных.",
  
  [APIErrorCode.NOT_FOUND]: "Данные не найдены.",
  [APIErrorCode.CONFLICT]: "Конфликт данных. Попробуйте обновить страницу.",
  [APIErrorCode.ALREADY_EXISTS]: "Такая запись уже существует.",
  
  [APIErrorCode.INTERNAL_ERROR]: "Внутренняя ошибка сервера. Попробуйте позже.",
  [APIErrorCode.SERVICE_UNAVAILABLE]: "Сервис временно недоступен. Попробуйте позже.",
  [APIErrorCode.RATE_LIMITED]: "Слишком много запросов. Подождите немного.",
  
  [APIErrorCode.PDF_GENERATION_FAILED]: "Не удалось сгенерировать PDF-отчёт.",
  [APIErrorCode.CALCULATION_FAILED]: "Ошибка при расчёте.",
  [APIErrorCode.SYNC_FAILED]: "Ошибка синхронизации данных.",
  
  [APIErrorCode.UNKNOWN]: "Произошла неизвестная ошибка.",
};

/**
 * Кастомный класс ошибки API
 */
export class APIError extends Error {
  constructor(
    message: string,
    public code: APIErrorCode = APIErrorCode.UNKNOWN,
    public statusCode?: number,
    public details?: Record<string, unknown>,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "APIError";
  }

  /**
   * Получить локализованное сообщение
   */
  getLocalizedMessage(): string {
    return ERROR_MESSAGES[this.code] || this.message;
  }

  /**
   * Проверить, можно ли повторить запрос
   */
  isRetryable(): boolean {
    return [
      APIErrorCode.NETWORK_ERROR,
      APIErrorCode.TIMEOUT,
      APIErrorCode.SERVICE_UNAVAILABLE,
      APIErrorCode.RATE_LIMITED,
    ].includes(this.code);
  }

  /**
   * Проверить, требуется ли переавторизация
   */
  requiresReauth(): boolean {
    return [
      APIErrorCode.UNAUTHORIZED,
      APIErrorCode.TOKEN_EXPIRED,
    ].includes(this.code);
  }

  /**
   * Проверить, является ли ошибка офлайн
   */
  isOffline(): boolean {
    return this.code === APIErrorCode.OFFLINE || this.code === APIErrorCode.NETWORK_ERROR;
  }
}

/**
 * Преобразование HTTP статуса в код ошибки
 */
function httpStatusToErrorCode(status: number): APIErrorCode {
  switch (status) {
    case 400:
      return APIErrorCode.VALIDATION_ERROR;
    case 401:
      return APIErrorCode.UNAUTHORIZED;
    case 403:
      return APIErrorCode.FORBIDDEN;
    case 404:
      return APIErrorCode.NOT_FOUND;
    case 409:
      return APIErrorCode.CONFLICT;
    case 422:
      return APIErrorCode.INVALID_FORMAT;
    case 429:
      return APIErrorCode.RATE_LIMITED;
    case 500:
      return APIErrorCode.INTERNAL_ERROR;
    case 502:
    case 503:
    case 504:
      return APIErrorCode.SERVICE_UNAVAILABLE;
    default:
      return APIErrorCode.UNKNOWN;
  }
}

/**
 * Парсинг ошибки из Response
 */
export async function parseAPIError(response: Response): Promise<APIError> {
  const statusCode = response.status;
  const code = httpStatusToErrorCode(statusCode);
  
  let message = ERROR_MESSAGES[code];
  let details: Record<string, unknown> | undefined;

  try {
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const body = await response.json();
      
      // Извлекаем сообщение из разных форматов ответа
      if (body.error) {
        message = typeof body.error === "string" ? body.error : body.error.message || message;
      } else if (body.message) {
        message = body.message;
      }
      
      // Извлекаем детали
      if (body.details) {
        details = body.details;
      } else if (body.errors) {
        details = { errors: body.errors };
      }
    } else {
      const text = await response.text();
      if (text) {
        message = text.substring(0, 200); // Ограничиваем длину
      }
    }
  } catch {
    // Если не удалось распарсить тело, используем дефолтное сообщение
  }

  return new APIError(message, code, statusCode, details);
}

/**
 * Обработка ошибок fetch
 */
export function handleFetchError(error: unknown): APIError {
  if (error instanceof APIError) {
    return error;
  }

  if (error instanceof TypeError) {
    // TypeError обычно означает сетевую ошибку
    if (!navigator.onLine) {
      return new APIError(
        ERROR_MESSAGES[APIErrorCode.OFFLINE],
        APIErrorCode.OFFLINE,
        undefined,
        undefined,
        error
      );
    }
    return new APIError(
      ERROR_MESSAGES[APIErrorCode.NETWORK_ERROR],
      APIErrorCode.NETWORK_ERROR,
      undefined,
      undefined,
      error
    );
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return new APIError(
      ERROR_MESSAGES[APIErrorCode.TIMEOUT],
      APIErrorCode.TIMEOUT,
      undefined,
      undefined,
      error
    );
  }

  if (error instanceof Error) {
    // Проверяем сообщение на известные паттерны
    const message = error.message.toLowerCase();
    
    if (message.includes("failed to fetch") || message.includes("network")) {
      return new APIError(
        ERROR_MESSAGES[APIErrorCode.NETWORK_ERROR],
        APIErrorCode.NETWORK_ERROR,
        undefined,
        undefined,
        error
      );
    }
    
    if (message.includes("timeout") || message.includes("timed out")) {
      return new APIError(
        ERROR_MESSAGES[APIErrorCode.TIMEOUT],
        APIErrorCode.TIMEOUT,
        undefined,
        undefined,
        error
      );
    }

    return new APIError(
      error.message,
      APIErrorCode.UNKNOWN,
      undefined,
      undefined,
      error
    );
  }

  return new APIError(
    ERROR_MESSAGES[APIErrorCode.UNKNOWN],
    APIErrorCode.UNKNOWN,
    undefined,
    undefined,
    error
  );
}

/**
 * Обёртка для fetch с обработкой ошибок
 */
export async function fetchWithErrorHandling(
  url: string,
  options?: RequestInit & { timeout?: number }
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options || {};
  
  // Проверяем онлайн-статус
  if (!navigator.onLine) {
    throw new APIError(
      ERROR_MESSAGES[APIErrorCode.OFFLINE],
      APIErrorCode.OFFLINE
    );
  }

  // Создаём AbortController для таймаута
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw await parseAPIError(response);
    }

    return response;
  } catch (error) {
    throw handleFetchError(error);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Retry-обёртка для запросов
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit & { timeout?: number; maxRetries?: number; retryDelay?: number }
): Promise<Response> {
  const { maxRetries = 3, retryDelay = 1000, ...fetchOptions } = options || {};
  
  let lastError: APIError | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchWithErrorHandling(url, fetchOptions);
    } catch (error) {
      lastError = error instanceof APIError ? error : handleFetchError(error);
      
      // Не повторяем, если ошибка не retryable или это последняя попытка
      if (!lastError.isRetryable() || attempt === maxRetries) {
        throw lastError;
      }
      
      // Экспоненциальная задержка
      const delay = retryDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new APIError(ERROR_MESSAGES[APIErrorCode.UNKNOWN], APIErrorCode.UNKNOWN);
}

/**
 * Получить человекочитаемое сообщение об ошибке
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.getLocalizedMessage();
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }

  return ERROR_MESSAGES[APIErrorCode.UNKNOWN];
}

/**
 * Проверка, является ли ошибка сетевой
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof APIError) {
    return error.isOffline();
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("fetch") ||
      message.includes("network") ||
      message.includes("failed to fetch") ||
      message.includes("offline")
    );
  }
  
  return false;
}

/**
 * Логирование ошибки (можно расширить для отправки в сервис мониторинга)
 */
export function logError(error: unknown, context?: string): void {
  const apiError = error instanceof APIError ? error : handleFetchError(error);
  
  console.error(`[${context || "API"}] Error:`, {
    code: apiError.code,
    message: apiError.message,
    statusCode: apiError.statusCode,
    details: apiError.details,
    isRetryable: apiError.isRetryable(),
    isOffline: apiError.isOffline(),
    originalError: apiError.originalError,
  });
  
  // TODO: Отправить в сервис мониторинга (Sentry, LogRocket и т.д.)
}

/**
 * Hook для использования с toast/notification системой
 */
export function showErrorToast(
  error: unknown,
  toastFn: (message: string, options?: { variant?: "error" | "warning" }) => void
): void {
  const apiError = error instanceof APIError ? error : handleFetchError(error);
  const message = apiError.getLocalizedMessage();
  
  const variant = apiError.isOffline() ? "warning" : "error";
  toastFn(message, { variant });
}
