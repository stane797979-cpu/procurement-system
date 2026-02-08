/**
 * PostHog 분석 초기화
 * - 프로덕션: posthog.io SDK
 * - 개발: 로컬 데이터 (API 키 필요)
 */

import PostHog from "posthog-js";

// PostHog 전역 타입 선언
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    posthog?: any;
  }
}

export const initPostHog = () => {
  if (typeof window === "undefined") {
    return null;
  }

  // 이미 초기화된 경우 스킵
  if (typeof window.posthog !== "undefined") {
    return window.posthog;
  }

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  // API 키가 없으면 초기화하지 않음
  if (!apiKey) {
    console.warn("PostHog API 키가 설정되지 않았습니다. 분석 기능이 비활성화됩니다.");
    return null;
  }

  try {
    PostHog.init(apiKey, {
      api_host: apiHost || "https://us.posthog.com",
      // 개발 환경에서만 페이지 자동 추적 활성화
      autocapture: process.env.NODE_ENV === "development",
      // GDPR 준수
      respect_dnt: true,
    });

    return PostHog;
  } catch (error) {
    console.error("PostHog 초기화 실패:", error);
    return null;
  }
};

/**
 * 사용자 인증 후 호출
 */
export const identifyUser = (userId: string, traits?: Record<string, unknown>) => {
  const posthog = typeof window !== "undefined" ? window.posthog : null;

  if (!posthog) {
    return;
  }

  try {
    posthog.identify(userId, {
      userId,
      ...traits,
    });
  } catch (error) {
    console.error("PostHog 사용자 식별 실패:", error);
  }
};

/**
 * 커스텀 이벤트 추적
 */
export const trackEvent = (
  eventName: string,
  properties?: Record<string, unknown>
) => {
  const posthog = typeof window !== "undefined" ? window.posthog : null;

  if (!posthog) {
    return;
  }

  try {
    posthog.capture(eventName, properties || {});
  } catch (error) {
    console.error("PostHog 이벤트 추적 실패:", error);
  }
};

/**
 * 페이지 조회 추적
 */
export const trackPageView = (
  pageName: string,
  properties?: Record<string, unknown>
) => {
  const posthog = typeof window !== "undefined" ? window.posthog : null;

  if (!posthog) {
    return;
  }

  try {
    posthog.capture("$pageview", {
      $current_url: window.location.href,
      page_name: pageName,
      ...properties,
    });
  } catch (error) {
    console.error("PostHog 페이지뷰 추적 실패:", error);
  }
};

/**
 * 피처 플래그 조회
 */
export const isFeatureEnabled = (flagKey: string): boolean => {
  const posthog = typeof window !== "undefined" ? window.posthog : null;

  if (!posthog) {
    return false;
  }

  try {
    return posthog.isFeatureEnabled(flagKey) || false;
  } catch (error) {
    console.error("PostHog 피처 플래그 조회 실패:", error);
    return false;
  }
};

/**
 * 슈퍼 프로퍼티 설정 (모든 이벤트에 포함될 글로벌 속성)
 */
export const setSuperProperties = (properties: Record<string, unknown>) => {
  const posthog = typeof window !== "undefined" ? window.posthog : null;

  if (!posthog) {
    return;
  }

  try {
    posthog.setPersonProperties(properties);
  } catch (error) {
    console.error("PostHog 슈퍼 프로퍼티 설정 실패:", error);
  }
};

/**
 * 사용자 로그아웃 시 호출
 */
export const resetAnalytics = () => {
  const posthog = typeof window !== "undefined" ? window.posthog : null;

  if (!posthog) {
    return;
  }

  try {
    posthog.reset();
  } catch (error) {
    console.error("PostHog 리셋 실패:", error);
  }
};
