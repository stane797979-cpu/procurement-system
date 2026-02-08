/**
 * 예측 정확도 측정 메트릭
 */

/**
 * MAPE (Mean Absolute Percentage Error)
 * 평균 절대 백분율 오차
 *
 * 공식: (1/n) × Σ |실제 - 예측| / |실제| × 100%
 *
 * 해석:
 * - MAPE < 10%: 매우 우수
 * - 10~20%: 양호
 * - 20~30%: 보통
 * - 30~50%: 부정확
 * - > 50%: 부적합
 *
 * @param actuals 실제값 배열
 * @param forecasts 예측값 배열
 * @returns MAPE 값 (퍼센트)
 */
export function calculateMAPE(actuals: number[], forecasts: number[]): number {
  if (actuals.length === 0 || actuals.length !== forecasts.length) {
    return Infinity;
  }

  let sum = 0;
  let validCount = 0;

  for (let i = 0; i < actuals.length; i++) {
    // 실제값이 0인 경우는 계산에서 제외 (0 나눗셈 방지)
    if (actuals[i] !== 0) {
      sum += Math.abs(actuals[i] - forecasts[i]) / Math.abs(actuals[i]);
      validCount++;
    }
  }

  if (validCount === 0) return Infinity;

  return (sum / validCount) * 100;
}

/**
 * MAE (Mean Absolute Error)
 * 평균 절대 오차
 *
 * 공식: (1/n) × Σ |실제 - 예측|
 *
 * 장점: 실제값 0도 처리 가능, 동일 단위로 해석
 * 단점: 규모에 따라 비교 어려움
 *
 * @param actuals 실제값 배열
 * @param forecasts 예측값 배열
 * @returns MAE 값
 */
export function calculateMAE(actuals: number[], forecasts: number[]): number {
  if (actuals.length === 0 || actuals.length !== forecasts.length) {
    return Infinity;
  }

  let sum = 0;

  for (let i = 0; i < actuals.length; i++) {
    sum += Math.abs(actuals[i] - forecasts[i]);
  }

  return sum / actuals.length;
}

/**
 * RMSE (Root Mean Square Error)
 * 평균 제곱근 오차
 *
 * 공식: √((1/n) × Σ(실제 - 예측)²)
 *
 * 특징: 큰 오차에 페널티 부여
 *
 * @param actuals 실제값 배열
 * @param forecasts 예측값 배열
 * @returns RMSE 값
 */
export function calculateRMSE(actuals: number[], forecasts: number[]): number {
  if (actuals.length === 0 || actuals.length !== forecasts.length) {
    return Infinity;
  }

  let sum = 0;

  for (let i = 0; i < actuals.length; i++) {
    sum += Math.pow(actuals[i] - forecasts[i], 2);
  }

  return Math.sqrt(sum / actuals.length);
}

/**
 * MAPE 값을 신뢰도 등급으로 변환
 *
 * @param mape MAPE 값 (퍼센트)
 * @returns 신뢰도 등급
 */
export function mapeToConfidence(mape: number): "high" | "medium" | "low" {
  if (mape < 15) return "high";
  if (mape < 30) return "medium";
  return "low";
}

/**
 * 예측 정확도 종합 평가
 */
export interface AccuracyMetrics {
  mape: number;
  mae: number;
  rmse: number;
  confidence: "high" | "medium" | "low";
}

/**
 * 모든 정확도 메트릭 계산
 *
 * @param actuals 실제값 배열
 * @param forecasts 예측값 배열
 * @returns 종합 정확도 메트릭
 */
export function calculateAllMetrics(actuals: number[], forecasts: number[]): AccuracyMetrics {
  const mape = calculateMAPE(actuals, forecasts);
  const mae = calculateMAE(actuals, forecasts);
  const rmse = calculateRMSE(actuals, forecasts);
  const confidence = mapeToConfidence(mape);

  return {
    mape: isFinite(mape) ? Math.round(mape * 100) / 100 : 999,
    mae: isFinite(mae) ? Math.round(mae * 100) / 100 : 999,
    rmse: isFinite(rmse) ? Math.round(rmse * 100) / 100 : 999,
    confidence,
  };
}
