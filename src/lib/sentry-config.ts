/**
 * Sentry 설정 파일
 * - 클라이언트 및 서버 공통 설정
 */

export const sentryConfig = {
  // Sentry DSN
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 환경
  environment: process.env.NODE_ENV || "development",

  // 추적 샘플링
  tracesSampleRate:
    process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE !== undefined
      ? parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE)
      : 0.1,

  // 릴리스 버전
  release: process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0",

  // 디버그 모드
  debug: process.env.NODE_ENV === "development",

  // 서버 설정
  serverIntegrations: [],

  // 클라이언트 설정
  clientIntegrations: [],
};

/**
 * Sentry 필터링 규칙
 */
export const shouldFilterError = (error: unknown): boolean => {
  // 네트워크 에러 필터링
  if (
    error instanceof Error &&
    error.message.includes("Network request failed")
  ) {
    return true;
  }

  // 취소된 요청 필터링
  if (
    error instanceof Error &&
    error.message.includes("AbortError") &&
    error.name === "AbortError"
  ) {
    return true;
  }

  // CORS 에러 필터링 (로그만 남기고 보고 안함)
  if (
    error instanceof Error &&
    (error.message.includes("CORS") ||
      error.message.includes("Cross-Origin"))
  ) {
    return true;
  }

  return false;
};
