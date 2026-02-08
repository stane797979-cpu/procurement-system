/**
 * 모니터링 유틸리티
 * - PostHog + Sentry 통합
 * - 성능 추적, 에러 로깅, 이벤트 캡처
 */

import { trackEvent, trackPageView } from "./analytics";
import { captureError, captureMessage, setContext } from "./sentry";

/**
 * 페이지 전환 추적
 */
export const trackNavigation = (pagePath: string, pageName: string) => {
  // PostHog 분석
  trackPageView(pageName, {
    path: pagePath,
    timestamp: new Date().toISOString(),
  });

  // Sentry 트레이싱 (성능 모니터링)
  trackEvent("page_navigation", {
    page_path: pagePath,
    page_name: pageName,
    timestamp: new Date().toISOString(),
  });
};

/**
 * API 요청 추적
 */
export const trackApiCall = (
  endpoint: string,
  method: string,
  statusCode: number,
  duration: number
) => {
  // PostHog 분석
  trackEvent("api_call", {
    endpoint,
    method,
    statusCode,
    duration,
    success: statusCode >= 200 && statusCode < 300,
  });

  // Sentry 성능 모니터링
  if (statusCode >= 400) {
    captureMessage(`API Error: ${method} ${endpoint} (${statusCode})`, "error");
    setContext("api_error", {
      endpoint,
      method,
      statusCode,
      duration,
    });
  }
};

/**
 * 비즈니스 이벤트 추적
 */
export const trackBusinessEvent = (
  eventType:
    | "product_created"
    | "supplier_created"
    | "order_created"
    | "inventory_updated"
    | "forecast_generated"
    | "recommendation_accepted",
  details?: Record<string, unknown>
) => {
  trackEvent(`business_${eventType}`, {
    timestamp: new Date().toISOString(),
    ...details,
  });
};

/**
 * 성능 메트릭 추적
 */
export const trackPerformance = (
  metricName: string,
  value: number,
  unit: string = "ms"
) => {
  trackEvent("performance_metric", {
    metric: metricName,
    value,
    unit,
    timestamp: new Date().toISOString(),
  });
};

/**
 * 에러 추적 (통합)
 */
export const logError = (
  error: unknown,
  context?: {
    feature?: string;
    action?: string;
    userId?: string;
    [key: string]: unknown;
  }
) => {
  if (error instanceof Error) {
    // Sentry에 상세 정보 전송
    captureError(error, context);

    // PostHog에도 로깅
    trackEvent("error_occurred", {
      errorMessage: error.message,
      errorStack: error.stack,
      ...context,
    });
  } else {
    const errorString = String(error);
    captureMessage(errorString, "error");
    if (context) {
      setContext("error_details", context);
    }
    trackEvent("error_occurred", {
      errorMessage: errorString,
      ...(context || {}),
    });
  }
};

/**
 * 사용자 액션 추적
 */
export const trackUserAction = (
  actionType:
    | "click"
    | "submit"
    | "input"
    | "hover"
    | "scroll"
    | "focus"
    | "blur",
  elementName: string,
  metadata?: Record<string, unknown>
) => {
  trackEvent(`user_action_${actionType}`, {
    element: elementName,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
};

/**
 * 기능 사용 추적
 */
export const trackFeatureUsage = (featureName: string, action?: string) => {
  trackEvent("feature_usage", {
    feature: featureName,
    action: action || "accessed",
    timestamp: new Date().toISOString(),
  });
};

/**
 * 데이터 임포트/엑스포트 추적
 */
export const trackDataOperation = (
  operation: "import" | "export",
  dataType: string,
  recordCount: number,
  duration: number,
  success: boolean
) => {
  trackEvent(`data_${operation}`, {
    dataType,
    recordCount,
    duration,
    success,
    timestamp: new Date().toISOString(),
  });

  if (!success) {
    captureMessage(
      `Data ${operation} failed: ${dataType} (${recordCount} records)`,
      "warning"
    );
    setContext("data_operation", {
      operation,
      dataType,
      recordCount,
      duration,
    });
  }
};

/**
 * 성능 이슈 추적
 */
export const trackPerformanceIssue = (
  issueType: "slow_page_load" | "slow_api_response" | "memory_leak",
  metrics: Record<string, unknown>
) => {
  captureMessage(`Performance issue detected: ${issueType}`, "warning");
  setContext("performance_issue", {
    issueType,
    ...metrics,
  });

  trackEvent("performance_issue", {
    issueType,
    ...metrics,
  });
};

/**
 * 롤백/복구 추적
 */
export const trackSystemEvent = (
  eventType: "deploy" | "rollback" | "maintenance" | "incident",
  details: Record<string, unknown>
) => {
  captureMessage(`System event: ${eventType}`, "info");
  setContext("system_event", { eventType, ...details });
  trackEvent(`system_${eventType}`, details);
};
