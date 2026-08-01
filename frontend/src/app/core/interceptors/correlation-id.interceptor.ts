import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { tap } from 'rxjs';

/**
 * Correlation ID HTTP Interceptor (Angular 18 Functional Style).
 *
 * Injects a unique `X-Correlation-ID` header into every outgoing HTTP request.
 * The backend's CorrelationIdFilter reads this header and populates it into
 * the SLF4J MDC context, making every log line traceable back to the exact
 * frontend request that triggered it.
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  TRACE FLOW                                             │
 * │                                                         │
 * │  Angular Request                                        │
 * │    → X-Correlation-ID: "abc123" ──────────────┐        │
 * │                                               ↓        │
 * │  Spring CorrelationIdFilter                             │
 * │    → MDC.put("correlationId", "abc123") ──────┐        │
 * │                                               ↓        │
 * │  Every log line:                                        │
 * │    [abc123] INFO EnrollmentService - Student enrolled   │
 * │                                                         │
 * │  Backend Response                                       │
 * │    ← X-Correlation-ID: "abc123"                         │
 * └─────────────────────────────────────────────────────────┘
 *
 * This is the standard distributed tracing pattern at:
 * - Google (internal gRPC calls carry a trace header)
 * - Amazon (AWS X-Ray propagation header)
 * - Microsoft (Application Insights correlation header)
 */
export const correlationIdInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const correlationId = generateCorrelationId();

  const tracedReq = req.clone({
    setHeaders: {
      'X-Correlation-ID': correlationId,
      'X-Request-Time': new Date().toISOString(),
    }
  });

  return next(tracedReq);
};

/**
 * Generates a lightweight correlation ID.
 * Format: <timestamp-base36>-<random-hex-6> (e.g. "lnz4k8-a3f2b9")
 * Short enough to be readable in logs, unique enough for request tracing.
 */
function generateCorrelationId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(16).substring(2, 8);
  return `${timestamp}-${randomPart}`;
}
