
import {
  holtsMethod,
  detectTrend,
  optimizeHoltsParameters,
} from '@/server/services/scm/demand-forecast/methods/holts-method'

describe('Holt\'s 이중지수평활', () => {
  describe('holtsMethod', () => {
    it('데이터 2개 미만 시 폴백 처리한다', () => {
      const history = [100]
      const periods = 2

      const result = holtsMethod(history, periods)

      expect(result.method).toBe('Holts')
      expect(result.forecast).toEqual([100, 100])
    })

    it('증가 추세를 반영한 예측을 수행한다', () => {
      const history = [100, 110, 120, 130, 140]
      const periods = 3

      const result = holtsMethod(history, periods)

      expect(result.method).toBe('Holts')
      expect(result.forecast).toHaveLength(3)

      // 증가 추세 반영: 각 기간마다 증가
      expect(result.forecast[1]).toBeGreaterThan(result.forecast[0])
      expect(result.forecast[2]).toBeGreaterThan(result.forecast[1])
    })

    it('감소 추세를 반영한 예측을 수행한다', () => {
      const history = [150, 140, 130, 120, 110]
      const periods = 3

      const result = holtsMethod(history, periods)

      // 감소 추세 반영: trend 값이 음수
      expect(result.parameters.trend).toBeLessThan(0)
    })

    it('예측값이 음수가 되지 않도록 방지한다', () => {
      const history = [100, 50, 0, -50, -100] // 급격한 감소
      const periods = 5

      const result = holtsMethod(history, periods)

      // 모든 예측값 >= 0
      result.forecast.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0)
      })
    })

    it('alpha와 beta 범위를 검증한다', () => {
      const history = [100, 110, 120]
      const periods = 2

      // alpha 범위 초과
      const resultAlpha = holtsMethod(history, periods, 1.5, 0.1)
      expect(resultAlpha.parameters.alpha).toBe(0.9)

      // beta 범위 초과
      const resultBeta = holtsMethod(history, periods, 0.3, 0.8)
      expect(resultBeta.parameters.beta).toBe(0.5)
    })

    it('안정적인 데이터에서는 추세가 작다', () => {
      const history = [100, 101, 100, 102, 101]
      const periods = 2

      const result = holtsMethod(history, periods)

      expect(Math.abs(result.parameters.trend || 0)).toBeLessThan(5)
    })

    it('각 예측 기간마다 추세를 누적 반영한다', () => {
      const history = [100, 110, 120, 130]
      const periods = 3

      const result = holtsMethod(history, periods)

      // F(t+h) = L + h*T 구조
      // 추세가 양수면 선형 증가
      if (result.parameters.trend && result.parameters.trend > 0) {
        const diff1 = result.forecast[1] - result.forecast[0]
        const diff2 = result.forecast[2] - result.forecast[1]

        // 차이가 일정해야 함 (선형 추세)
        expect(Math.abs(diff1 - diff2)).toBeLessThan(1)
      }
    })
  })

  describe('detectTrend', () => {
    it('6개월 미만 데이터는 추세 없음으로 판단한다', () => {
      const history = [100, 110, 120, 130, 140]

      const hasTrend = detectTrend(history)

      expect(hasTrend).toBe(false)
    })

    it('증가 추세를 감지한다', () => {
      const history = [100, 110, 120, 130, 140, 150, 160]

      const hasTrend = detectTrend(history)

      expect(hasTrend).toBe(true)
    })

    it('감소 추세를 감지한다', () => {
      const history = [160, 150, 140, 130, 120, 110, 100]

      const hasTrend = detectTrend(history)

      expect(hasTrend).toBe(true)
    })

    it('안정적인 데이터는 추세 없음으로 판단한다', () => {
      const history = [100, 101, 99, 100, 102, 100, 99]

      const hasTrend = detectTrend(history)

      expect(hasTrend).toBe(false)
    })

    it('약한 추세는 감지하지 않는다', () => {
      const history = [100, 101, 102, 103, 104, 105, 106]

      const hasTrend = detectTrend(history)

      // 기울기가 평균 대비 5% 미만
      expect(hasTrend).toBe(false)
    })
  })

  describe('optimizeHoltsParameters', () => {
    it('데이터가 충분할 때 최적 파라미터를 반환한다', () => {
      const history = [100, 110, 120, 130, 140, 150, 160]

      const params = optimizeHoltsParameters(history, 3)

      expect(params.alpha).toBeGreaterThanOrEqual(0.1)
      expect(params.alpha).toBeLessThanOrEqual(0.5)
      expect(params.beta).toBeGreaterThanOrEqual(0.05)
      expect(params.beta).toBeLessThanOrEqual(0.3)
    })

    it('데이터가 부족하면 기본값을 반환한다', () => {
      const history = [100, 110, 120]

      const params = optimizeHoltsParameters(history, 3)

      expect(params.alpha).toBe(0.3)
      expect(params.beta).toBe(0.1)
    })

    it('추세가 강한 데이터는 beta를 반환한다', () => {
      const history = [100, 120, 140, 160, 180, 200, 220, 240]

      const params = optimizeHoltsParameters(history, 3)

      // beta는 0 이상의 유효한 값이어야 한다
      expect(params.beta).toBeGreaterThanOrEqual(0)
      expect(params.beta).toBeLessThanOrEqual(1)
    })
  })
})
