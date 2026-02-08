/**
 * Sentry 에러 추적
 * - DSN이 설정되지 않으면 모든 함수가 no-op
 * - DSN 설정 시 @sentry/browser를 동적 로드
 *
 * 주의: @sentry/nextjs는 사용하지 않음 (설정 파일 없이 import하면 하이드레이션 깨짐)
 * 프로덕션에서 Sentry가 필요하면 @sentry/browser를 직접 사용
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let S: any = null;
let initialized = false;

function hasDsn(): boolean {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  return !!dsn && !dsn.includes("[key]") && !dsn.includes("your-");
}

export const initSentry = async () => {
  if (typeof window === "undefined") return;
  if (initialized) return;
  initialized = true;

  if (!hasDsn()) {
    console.warn("Sentry DSN이 설정되지 않았습니다. 에러 추적이 비활성화됩니다.");
    return;
  }

  try {
    // @sentry/nextjs 대신 @sentry/browser 사용 (side effect 없음)
    S = await import("@sentry/react");
    S.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    });
  } catch (error) {
    console.error("Sentry 초기화 실패:", error);
  }
};

export const setUser = (id: string, email?: string, username?: string) => {
  if (!S) return;
  try { S.setUser({ id, email, username }); } catch { /* no-op */ }
};

export const clearUser = () => {
  if (!S) return;
  try { S.setUser(null); } catch { /* no-op */ }
};

export const captureError = (error: Error, context?: Record<string, unknown>) => {
  if (!S) return;
  try { S.captureException(error, { extra: context }); } catch { /* no-op */ }
};

export const captureMessage = (message: string, level: string = "info") => {
  if (!S) return;
  try { S.captureMessage(message, level); } catch { /* no-op */ }
};

export const addBreadcrumb = (
  category: string,
  message: string,
  level: string = "info",
  data?: Record<string, unknown>
) => {
  if (!S) return;
  try { S.addBreadcrumb({ category, message, level, data }); } catch { /* no-op */ }
};

export const setTag = (key: string, value: string) => {
  if (!S) return;
  try { S.setTag(key, value); } catch { /* no-op */ }
};

export const setContext = (name: string, context: Record<string, unknown>) => {
  if (!S) return;
  try { S.setContext(name, context); } catch { /* no-op */ }
};
