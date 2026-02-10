/**
 * Structured logging with requestId per logging-observability skill.
 * Fields: timestamp, level, message, requestId, and optional context.
 */

type LogLevel = "info" | "warn" | "error" | "debug";

type LogContext = Record<string, unknown> & { requestId?: string };

function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    requestId: context?.requestId,
    ...context,
  };
  return JSON.stringify(entry);
}

export function createLogger(requestId?: string) {
  const ctx = (extra?: LogContext) => ({ requestId, ...extra });

  return {
    info: (message: string, context?: LogContext) => {
      // eslint-disable-next-line no-console
      console.log(formatLog("info", message, ctx(context)));
    },
    warn: (message: string, context?: LogContext) => {
      // eslint-disable-next-line no-console
      console.warn(formatLog("warn", message, ctx(context)));
    },
    error: (message: string, context?: LogContext) => {
      // eslint-disable-next-line no-console
      console.error(formatLog("error", message, ctx(context)));
    },
    debug: (message: string, context?: LogContext) => {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.debug(formatLog("debug", message, ctx(context)));
      }
    },
  };
}

export function getOrCreateRequestId(request: Request): string {
  const header = request.headers.get("x-request-id");
  if (header) return header;
  return crypto.randomUUID();
}
