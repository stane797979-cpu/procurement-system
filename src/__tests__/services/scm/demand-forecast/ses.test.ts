
import {
  simpleExponentialSmoothing,
  optimizeAlpha,
  getDefaultAlpha,
} from '@/server/services/scm/demand-forecast/methods/exponential-smoothing'

describe('단순지수평활 (SES)', () => {
  describe('simpleExponentialSmoothing', () => {
    it('기본 alpha(0.3)로 정확한 예측을 수행한다', () => {
      const history = [100, 110, 105, 115]
      const periods = 2
      const alpha = 0.3

      const result = simpleExponentialSmoothing(history, periods, alpha)

      expect(result.method).toBe('SES')
      expect(result.parameters.alpha).toBe(0.3)
      expect(result.forecast).toHaveLength(2)

      // 수동 계산:
      // t0: S0 = 100
      // t1: S1 = 0.3*110 + 0.7*100 = 33 + 70 = 103
      // t2: S2 = 0.3*105 + 0.7*103 = 31.5 + 72.1 = 103.6
      // t3: S3 = 0.3*115 + 0.7*103.6 = 34.5 + 72.52 = 107.02
      expect(result.forecast[0]).toBeCloseTo(107.02, 1)
      expect(result.forecast[1]).toBeCloseTo(107.02, 1)
    })

    it('빈 이력 시 0 배열을 반환한다', () => {
      const history: number[] = []
      const periods = 3

      const result = simpleExponentialSmoothing(history, periods)

      expect(result.method).toBe('SES')
      expect(result.forecast).toHaveLength(3)
      expect(result.forecast).toEqual([0, 0, 0])
    })

    it('alpha 범위를 0.1~0.9로 제한한다', () => {
      const history = [100, 110, 120]
      const periods = 1

      // alpha < 0.1 → 0.1로 클램핑
      const resultLow = simpleExponentialSmoothing(history, periods, 0.05)
      expect(resultLow.parameters.alpha).toBe(0.1)

      // alpha > 0.9 → 0.9로 클램핑
      const resultHigh = simpleExponentialSmoothing(history, periods, 0.95)
      expect(resultHigh.parameters.alpha).toBe(0.9)
    })

    it('alpha가 높을수록 최근 데이터에 더 높은 가중치를 준다', () => {
      const history = [100, 100, 100, 200] // 마지막만 급증
      const periods = 1

      const resultLowAlpha = simpleExponentialSmoothing(history, periods, 0.1)
      const resultHighAlpha = simpleExponentialSmoothing(history, periods, 0.9)

      // 높은 alpha는 최근 값(200)에 가까움
      expect(resultHighAlpha.forecast[0]).toBeGreaterThan(resultLowAlpha.forecast[0])
    })

    it('단일 데이터 포인트일 때 해당 값을 예측한다', () => {
      const history = [150]
      const periods = 2

      const result = simpleExponentialSmoothing(history, periods)

      expect(result.forecast).toEqual([150, 150])
    })

    it('모든 예측 기간에 동일한 값을 반환한다', () => {
      const history = [100, 110, 120]
      const periods = 4

      const result = simpleExponentialSmoothing(history, periods)

      // SES는 상수 예측
      expect(result.forecast[0]).toBe(result.forecast[1])
      expect(result.forecast[1]).toBe(result.forecast[2])
      expect(result.forecast[2]).toBe(result.forecast[3])
    })
  })

  describe('optimizeAlpha', () => {
    it('데이터가 충분할 때 최적 alpha를 찾는다', () => {
      const history = [100, 110, 105, 115, 120, 125, 130]

      const alpha = optimizeAlpha(history, 3)

      expect(alpha).toBeGreaterThanOrEqual(0.1)
      expect(alpha).toBeLessThanOrEqual(0.9)
    })

    it('데이터가 부족하면 기본값 0.3을 반환한다', () => {
      const history = [100, 110, 120]

      const alpha = optimizeAlpha(history, 3)

      expect(alpha).toBe(0.3)
    })

    it('안정적인 수요에는 낮은 alpha를 선택한다', () => {
      const history = [100, 101, 100, 102, 101, 100, 99, 101]

      const alpha = optimizeAlpha(history, 3)

      // 안정적 데이터 → 낮은 alpha 선호
      expect(alpha).toBeLessThanOrEqual(0.5)
    })

    it('변동이 큰 수요에는 높은 alpha를 선택한다', () => {
      const history = [100, 150, 80, 160, 90, 170, 85, 180]

      const alpha = optimizeAlpha(history, 3)

      // 변동 큰 데이터 → 높은 alpha 선호
      expect(alpha).toBeGreaterThanOrEqual(0.3)
    })
  })

  describe('getDefaultAlpha', () => {
    it('X등급(안정 수요)은 낮은 alpha(0.2)를 반환한다', () => {
      const alpha = getDefaultAlpha('X')
      expect(alpha).toBe(0.2)
    })

    it('Y등급(변동 수요)은 중간 alpha(0.4)를 반환한다', () => {
      const alpha = getDefaultAlpha('Y')
      expect(alpha).toBe(0.4)
    })

    it('Z등급(불규칙 수요)은 높은 alpha(0.6)를 반환한다', () => {
      const alpha = getDefaultAlpha('Z')
      expect(alpha).toBe(0.6)
    })

    it('등급 미지정 시 기본값(0.3)을 반환한다', () => {
      const alpha = getDefaultAlpha()
      expect(alpha).toBe(0.3)
    })
  })
})
