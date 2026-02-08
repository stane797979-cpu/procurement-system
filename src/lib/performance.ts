/**
 * 성능 모니터링 유틸리티
 * - Web Vitals 측정
 * - 타이머 헬퍼
 */

/**
 * 성능 타이머
 * 함수 실행 시간을 측정합니다.
 *
 * @example
 * const timer = startTimer("데이터 로딩");
 * await fetchData();
 * timer.end(); // 콘솔에 시간 출력
 */
export function startTimer(label: string) {
  const start = performance.now();

  return {
    end: () => {
      const duration = performance.now() - start;
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
      return duration;
    },
  };
}

/**
 * 비동기 함수의 실행 시간을 측정합니다.
 *
 * @example
 * const result = await measureAsync("API 호출", () => fetch("/api/data"));
 */
export async function measureAsync<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  const timer = startTimer(label);
  try {
    return await fn();
  } finally {
    timer.end();
  }
}

/**
 * 동기 함수의 실행 시간을 측정합니다.
 *
 * @example
 * const result = measureSync("계산", () => heavyComputation());
 */
export function measureSync<T>(label: string, fn: () => T): T {
  const timer = startTimer(label);
  try {
    return fn();
  } finally {
    timer.end();
  }
}

/**
 * Web Vitals 메트릭 타입
 */
export interface WebVitalMetric {
  name: "CLS" | "FID" | "FCP" | "LCP" | "TTFB" | "INP";
  value: number;
  rating: "good" | "needs-improvement" | "poor";
}

/**
 * Web Vitals 임계값
 * @see https://web.dev/vitals/
 */
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
} as const;

/**
 * 메트릭 값을 기준으로 등급을 계산합니다.
 */
function getRating(
  name: WebVitalMetric["name"],
  value: number,
): WebVitalMetric["rating"] {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return "good";
  if (value <= threshold.poor) return "needs-improvement";
  return "poor";
}

/**
 * Web Vitals를 PostHog으로 전송합니다.
 * (클라이언트 전용)
 *
 * @example
 * // app/layout.tsx에서 사용
 * useEffect(() => {
 *   reportWebVitals((metric) => {
 *     console.log(metric);
 *   });
 * }, []);
 */
export function reportWebVitals(
  onReport: (metric: WebVitalMetric) => void,
): void {
  if (typeof window === "undefined") return;

  // PerformanceObserver 지원 확인
  if (!("PerformanceObserver" in window)) return;

  try {
    // CLS (Cumulative Layout Shift)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value || 0;
        }
      }
    });
    clsObserver.observe({ type: "layout-shift", buffered: true });

    // FCP (First Contentful Paint)
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          const value = entry.startTime;
          onReport({
            name: "FCP",
            value,
            rating: getRating("FCP", value),
          });
          fcpObserver.disconnect();
        }
      }
    });
    fcpObserver.observe({ type: "paint", buffered: true });

    // LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      const value = lastEntry.startTime;
      onReport({
        name: "LCP",
        value,
        rating: getRating("LCP", value),
      });
    });
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

    // FID (First Input Delay)
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fidEntry = entry as PerformanceEntry & { processingStart?: number };
        const value = (fidEntry.processingStart || entry.startTime) - entry.startTime;
        onReport({
          name: "FID",
          value,
          rating: getRating("FID", value),
        });
        fidObserver.disconnect();
      }
    });
    fidObserver.observe({ type: "first-input", buffered: true });

    // TTFB (Time to First Byte)
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const value = timing.responseStart - timing.requestStart;
      onReport({
        name: "TTFB",
        value,
        rating: getRating("TTFB", value),
      });
    }

    // 페이지 언로드 시 CLS 리포트
    window.addEventListener("beforeunload", () => {
      onReport({
        name: "CLS",
        value: clsValue,
        rating: getRating("CLS", clsValue),
      });
    });
  } catch (error) {
    console.error("[Performance] Web Vitals 측정 실패:", error);
  }
}
