/**
 * 단순이동평균 (Simple Moving Average, SMA)
 *
 * 공식: SMA(t) = (D(t-1) + D(t-2) + ... + D(t-n)) / n
 *
 * 특징:
 * - 구현 간단, 직관적
 * - 최근 N개 데이터의 평균
 * - 추세/계절성 미반영
 *
 * 적합:
 * - 안정적 수요 (X등급)
 * - 데이터 부족 시 (< 6개월)
 * - 빠르게 변하는 시장
 */

import { ForecastResult, ForecastMethodType } from "../types";

/**
 * 단순이동평균 계산
 *
 * @param history 판매 이력 (수치 배열)
 * @param periods 예측 기간 수
 * @param windowSize 이동평균 윈도우 크기 (기본: 3)
 * @returns 예측 결과
 */
export function simpleMovingAverage(
  history: number[],
  periods: number,
  windowSize: number = 3
): ForecastResult {
  if (history.length === 0) {
    return {
      method: "SMA" as ForecastMethodType,
      parameters: { windowSize },
      forecast: Array(periods).fill(0),
    };
  }

  // 윈도우 크기 조정 (데이터보다 클 수 없음)
  const adjustedWindowSize = Math.min(windowSize, history.length);

  // 최근 N개 데이터의 평균 계산
  const recentData = history.slice(-adjustedWindowSize);
  const average = recentData.reduce((sum, value) => sum + value, 0) / recentData.length;

  // 모든 기간에 동일한 값 예측 (단순이동평균은 상수 예측)
  const forecast = Array(periods).fill(Math.round(average * 100) / 100);

  return {
    method: "SMA" as ForecastMethodType,
    parameters: {
      windowSize: adjustedWindowSize,
      average,
    },
    forecast,
  };
}

/**
 * 데이터 기간에 따른 최적 윈도우 크기 자동 선택
 *
 * @param dataMonths 데이터 개월 수
 * @returns 권장 윈도우 크기
 */
export function selectOptimalWindowSize(dataMonths: number): number {
  // 3개월 미만: 전체 데이터 사용
  if (dataMonths < 3) return dataMonths;

  // 3~6개월: 3개월 윈도우
  if (dataMonths < 6) return 3;

  // 6~12개월: 6개월 윈도우
  if (dataMonths < 12) return 6;

  // 12개월 이상: 12개월 윈도우 (1년)
  return 12;
}

/**
 * SMA 방법 객체 (통일된 인터페이스)
 */
export const smaMethod = {
  name: "SMA" as ForecastMethodType,
  minDataPoints: 1, // 최소 1개 데이터만 있어도 계산 가능
  forecast: (history: number[], periods: number) => {
    // 데이터 개월 수 기반 자동 윈도우 크기 선택
    const windowSize = selectOptimalWindowSize(history.length);
    return simpleMovingAverage(history, periods, windowSize);
  },
};
