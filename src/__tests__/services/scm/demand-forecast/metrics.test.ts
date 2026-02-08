
import {
  calculateMAPE,
  calculateMAE,
  calculateRMSE,
  mapeToConfidence,
  calculateAllMetrics,
} from '@/server/services/scm/demand-forecast/accuracy/metrics'

describe('예측 정확도 메트릭', () => {
  describe('calculateMAPE', () => {
    it('정확한 예측 시 0%를 반환한다', () => {
      const actuals = [100, 120, 110]
      const forecasts = [100, 120, 110]

      const mape = calculateMAPE(actuals, forecasts)

      expect(mape).toBe(0)
    })

    it('기본 MAPE 계산이 정확하다', () => {
      const actuals = [100, 200, 100]
      const forecasts = [110, 180, 90]

      const mape = calculateMAPE(actuals, forecasts)

      // |100-110|/100 = 0.1
      // |200-180|/200 = 0.1
      // |100-90|/100 = 0.1
      // 평균 = 0.1 * 100 = 10%
      expect(mape).toBeCloseTo(10, 1)
    })

    it('빈 배열 시 Infinity를 반환한다', () => {
      const actuals: number[] = []
      const forecasts: number[] = []

      const mape = calculateMAPE(actuals, forecasts)

      expect(mape).toBe(Infinity)
    })

    it('배열 길이가 다르면 Infinity를 반환한다', () => {
      const actuals = [100, 120]
      const forecasts = [100]

      const mape = calculateMAPE(actuals, forecasts)

      expect(mape).toBe(Infinity)
    })

    it('실제값이 0인 항목은 계산에서 제외한다', () => {
      const actuals = [100, 0, 120]
      const forecasts = [110, 50, 110]

      const mape = calculateMAPE(actuals, forecasts)

      // 0인 항목 제외: (|100-110|/100 + |120-110|/120) / 2 * 100
      // = (0.1 + 0.0833) / 2 * 100 = 9.17%
      expect(mape).toBeCloseTo(9.17, 1)
    })

    it('모든 실제값이 0이면 Infinity를 반환한다', () => {
      const actuals = [0, 0, 0]
      const forecasts = [10, 20, 30]

      const mape = calculateMAPE(actuals, forecasts)

      expect(mape).toBe(Infinity)
    })
  })

  describe('calculateMAE', () => {
    it('정확한 예측 시 0을 반환한다', () => {
      const actuals = [100, 120, 110]
      const forecasts = [100, 120, 110]

      const mae = calculateMAE(actuals, forecasts)

      expect(mae).toBe(0)
    })

    it('기본 MAE 계산이 정확하다', () => {
      const actuals = [100, 200, 150]
      const forecasts = [110, 180, 160]

      const mae = calculateMAE(actuals, forecasts)

      // (|100-110| + |200-180| + |150-160|) / 3
      // = (10 + 20 + 10) / 3 = 13.33
      expect(mae).toBeCloseTo(13.33, 1)
    })

    it('빈 배열 시 Infinity를 반환한다', () => {
      const actuals: number[] = []
      const forecasts: number[] = []

      const mae = calculateMAE(actuals, forecasts)

      expect(mae).toBe(Infinity)
    })

    it('실제값 0도 정상 처리한다', () => {
      const actuals = [0, 100, 200]
      const forecasts = [10, 110, 190]

      const mae = calculateMAE(actuals, forecasts)

      // (10 + 10 + 10) / 3 = 10
      expect(mae).toBe(10)
    })
  })

  describe('calculateRMSE', () => {
    it('정확한 예측 시 0을 반환한다', () => {
      const actuals = [100, 120, 110]
      const forecasts = [100, 120, 110]

      const rmse = calculateRMSE(actuals, forecasts)

      expect(rmse).toBe(0)
    })

    it('기본 RMSE 계산이 정확하다', () => {
      const actuals = [100, 200, 150]
      const forecasts = [110, 180, 160]

      const rmse = calculateRMSE(actuals, forecasts)

      // √((10² + 20² + 10²) / 3)
      // = √((100 + 400 + 100) / 3)
      // = √(600 / 3) = √200 ≈ 14.14
      expect(rmse).toBeCloseTo(14.14, 1)
    })

    it('큰 오차에 페널티를 부여한다 (MAE보다 크다)', () => {
      const actuals = [100, 100, 100]
      const forecasts = [100, 100, 200] // 한 곳에 큰 오차

      const mae = calculateMAE(actuals, forecasts)
      const rmse = calculateRMSE(actuals, forecasts)

      // MAE = (0 + 0 + 100) / 3 = 33.33
      // RMSE = √((0 + 0 + 10000) / 3) = √3333.33 = 57.73
      expect(rmse).toBeGreaterThan(mae)
    })

    it('빈 배열 시 Infinity를 반환한다', () => {
      const actuals: number[] = []
      const forecasts: number[] = []

      const rmse = calculateRMSE(actuals, forecasts)

      expect(rmse).toBe(Infinity)
    })

    it('오차가 균등하면 MAE와 유사하다', () => {
      const actuals = [100, 100, 100]
      const forecasts = [110, 110, 110]

      const mae = calculateMAE(actuals, forecasts)
      const rmse = calculateRMSE(actuals, forecasts)

      // 모두 동일한 오차 10 → MAE = RMSE = 10
      expect(rmse).toBeCloseTo(mae, 0)
    })
  })

  describe('mapeToConfidence', () => {
    it('MAPE < 15일 때 high를 반환한다', () => {
      expect(mapeToConfidence(0)).toBe('high')
      expect(mapeToConfidence(10)).toBe('high')
      expect(mapeToConfidence(14.9)).toBe('high')
    })

    it('MAPE 15~30일 때 medium을 반환한다', () => {
      expect(mapeToConfidence(15)).toBe('medium')
      expect(mapeToConfidence(22)).toBe('medium')
      expect(mapeToConfidence(29.9)).toBe('medium')
    })

    it('MAPE >= 30일 때 low를 반환한다', () => {
      expect(mapeToConfidence(30)).toBe('low')
      expect(mapeToConfidence(50)).toBe('low')
      expect(mapeToConfidence(100)).toBe('low')
    })
  })

  describe('calculateAllMetrics', () => {
    it('모든 메트릭을 종합 계산한다', () => {
      const actuals = [100, 200, 150]
      const forecasts = [110, 180, 160]

      const metrics = calculateAllMetrics(actuals, forecasts)

      expect(metrics.mape).toBeGreaterThan(0)
      expect(metrics.mae).toBeGreaterThan(0)
      expect(metrics.rmse).toBeGreaterThan(0)
      expect(metrics.confidence).toBeDefined()
    })

    it('정확한 예측 시 high confidence를 반환한다', () => {
      const actuals = [100, 120, 110]
      const forecasts = [100, 120, 110]

      const metrics = calculateAllMetrics(actuals, forecasts)

      expect(metrics.mape).toBe(0)
      expect(metrics.confidence).toBe('high')
    })

    it('메트릭이 Infinity면 999로 대체한다', () => {
      const actuals: number[] = []
      const forecasts: number[] = []

      const metrics = calculateAllMetrics(actuals, forecasts)

      expect(metrics.mape).toBe(999)
      expect(metrics.mae).toBe(999)
      expect(metrics.rmse).toBe(999)
    })

    it('소수점 둘째 자리로 반올림한다', () => {
      const actuals = [100, 200, 150]
      const forecasts = [110, 180, 160]

      const metrics = calculateAllMetrics(actuals, forecasts)

      expect(metrics.mape).toBe(Math.round(metrics.mape * 100) / 100)
      expect(metrics.mae).toBe(Math.round(metrics.mae * 100) / 100)
      expect(metrics.rmse).toBe(Math.round(metrics.rmse * 100) / 100)
    })
  })
})
