/**
 * 이중지수평활 - Holt's Method (Double Exponential Smoothing)
 *
 * 공식:
 * - 수준: L(t) = α × D(t) + (1-α) × (L(t-1) + T(t-1))
 * - 추세: T(t) = β × (L(t) - L(t-1)) + (1-β) × T(t-1)
 * - 예측: F(t+h) = L(t) + h × T(t)
 *
 * 특징:
 * - 추세(트렌드) 반영 가능
 * - 수준과 추세 동시 평활
 *
 * 적합:
 * - 추세가 있는 데이터
 * - 6개월 이상 데이터
 * - Y등급 (변동 수요)
 */

import { ForecastResult, ForecastMethodType } from "../types";
import { calculateMAPE } from "../accuracy/metrics";

/**
 * Holt's 이중지수평활 계산
 *
 * @param history 판매 이력
 * @param periods 예측 기간 수
 * @param alpha 수준 평활 계수 (0 < α < 1)
 * @param beta 추세 평활 계수 (0 < β < 1)
 * @returns 예측 결과
 */
export function holtsMethod(
  history: number[],
  periods: number,
  alpha: number = 0.3,
  beta: number = 0.1
): ForecastResult {
  if (history.length < 2) {
    return {
      method: "Holts" as ForecastMethodType,
      parameters: { alpha, beta },
      forecast: Array(periods).fill(history.length > 0 ? history[0] : 0),
    };
  }

  // 파라미터 범위 검증
  const validAlpha = Math.max(0.1, Math.min(0.9, alpha));
  const validBeta = Math.max(0.01, Math.min(0.5, beta));

  // 초기값 설정
  let level = history[0]; // 수준
  let trend = history.length > 1 ? history[1] - history[0] : 0; // 초기 추세

  // 전체 이력에 대해 수준과 추세 업데이트
  for (let i = 1; i < history.length; i++) {
    const prevLevel = level;
    const prevTrend = trend;

    // 수준 업데이트
    level = validAlpha * history[i] + (1 - validAlpha) * (prevLevel + prevTrend);

    // 추세 업데이트
    trend = validBeta * (level - prevLevel) + (1 - validBeta) * prevTrend;
  }

  // 예측: 각 기간마다 추세를 반영
  const forecast: number[] = [];
  for (let h = 1; h <= periods; h++) {
    const prediction = level + h * trend;
    // 음수 방지
    forecast.push(Math.max(0, Math.round(prediction * 100) / 100));
  }

  return {
    method: "Holts" as ForecastMethodType,
    parameters: {
      alpha: validAlpha,
      beta: validBeta,
      level,
      trend,
    },
    forecast,
  };
}

/**
 * Alpha와 Beta 자동 최적화
 * Grid Search로 MAPE 최소화하는 α, β 조합 탐색
 *
 * @param history 판매 이력
 * @param testSize 테스트 셋 크기 (기본: 3)
 * @returns 최적 { alpha, beta }
 */
export function optimizeHoltsParameters(
  history: number[],
  testSize: number = 3
): { alpha: number; beta: number } {
  if (history.length < testSize + 3) {
    return { alpha: 0.3, beta: 0.1 };
  }

  const alphaRange = [0.1, 0.2, 0.3, 0.4, 0.5];
  const betaRange = [0.05, 0.1, 0.15, 0.2, 0.3];

  let bestAlpha = 0.3;
  let bestBeta = 0.1;
  let bestMAPE = Infinity;

  // 훈련/테스트 분할
  const trainData = history.slice(0, -testSize);
  const testData = history.slice(-testSize);

  for (const alpha of alphaRange) {
    for (const beta of betaRange) {
      // Holt's 방법 적용
      let level = trainData[0];
      let trend = trainData.length > 1 ? trainData[1] - trainData[0] : 0;

      for (let i = 1; i < trainData.length; i++) {
        const prevLevel = level;
        const prevTrend = trend;
        level = alpha * trainData[i] + (1 - alpha) * (prevLevel + prevTrend);
        trend = beta * (level - prevLevel) + (1 - beta) * prevTrend;
      }

      // 테스트 데이터 예측
      const predictions: number[] = [];
      for (let h = 1; h <= testSize; h++) {
        predictions.push(Math.max(0, level + h * trend));
      }

      // MAPE 계산
      const mape = calculateMAPE(testData, predictions);

      if (isFinite(mape) && mape < bestMAPE) {
        bestMAPE = mape;
        bestAlpha = alpha;
        bestBeta = beta;
      }
    }
  }

  return { alpha: bestAlpha, beta: bestBeta };
}

/**
 * 추세 존재 여부 탐지
 * 선형 회귀 기울기의 유의성 검증
 *
 * @param history 판매 이력
 * @returns 추세 존재 여부
 */
export function detectTrend(history: number[]): boolean {
  if (history.length < 6) return false;

  // 선형 회귀 기울기 계산
  const n = history.length;
  const xValues = Array.from({ length: n }, (_, i) => i);
  const xMean = (n - 1) / 2;
  const yMean = history.reduce((sum, v) => sum + v, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (history[i] - yMean);
    denominator += Math.pow(xValues[i] - xMean, 2);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;

  // 평균 대비 기울기 비율이 5% 이상이면 추세 있음으로 판단
  const trendStrength = Math.abs(slope) / (yMean || 1);
  return trendStrength > 0.05;
}

/**
 * Holt's 방법 객체 (자동 최적화)
 */
export const holtsMethod_auto = {
  name: "Holts" as ForecastMethodType,
  minDataPoints: 6, // 최소 6개 데이터 필요
  forecast: (history: number[], periods: number) => {
    // 파라미터 자동 최적화
    const { alpha, beta } = optimizeHoltsParameters(history);
    return holtsMethod(history, periods, alpha, beta);
  },
};
