
import {
  simpleMovingAverage,
  selectOptimalWindowSize,
} from '@/server/services/scm/demand-forecast/methods/simple-moving-average'

describe('단순이동평균 (SMA)', () => {
  describe('simpleMovingAverage', () => {
    it('기본 윈도우(3)로 정확한 예측값을 계산한다', () => {
      const history = [100, 120, 110, 130, 140, 150]
      const periods = 2

      const result = simpleMovingAverage(history, periods, 3)

      // 최근 3개 평균: (130 + 140 + 150) / 3 = 140
      expect(result.method).toBe('SMA')
      expect(result.parameters.windowSize).toBe(3)
      expect(result.forecast).toHaveLength(2)
      expect(result.forecast[0]).toBe(140)
      expect(result.forecast[1]).toBe(140)
      expect(result.parameters.average).toBe(140)
    })

    it('빈 이력 시 0 배열을 반환한다', () => {
      const history: number[] = []
      const periods = 3

      const result = simpleMovingAverage(history, periods)

      expect(result.method).toBe('SMA')
      expect(result.forecast).toHaveLength(3)
      expect(result.forecast).toEqual([0, 0, 0])
    })

    it('윈도우가 데이터보다 크면 자동으로 조정한다', () => {
      const history = [100, 120]
      const periods = 2
      const windowSize = 5

      const result = simpleMovingAverage(history, periods, windowSize)

      // 윈도우가 2로 자동 조정됨
      expect(result.parameters.windowSize).toBe(2)
      // 평균: (100 + 120) / 2 = 110
      expect(result.forecast[0]).toBe(110)
    })

    it('예측 기간만큼 동일 값을 반복한다', () => {
      const history = [100, 110, 120]
      const periods = 5

      const result = simpleMovingAverage(history, periods)

      // 평균: (100 + 110 + 120) / 3 = 110
      expect(result.forecast).toHaveLength(5)
      expect(result.forecast).toEqual([110, 110, 110, 110, 110])
    })

    it('소수점 둘째 자리까지 반올림한다', () => {
      const history = [100, 101, 102]
      const periods = 1

      const result = simpleMovingAverage(history, periods)

      // 평균: (100 + 101 + 102) / 3 = 101
      expect(result.forecast[0]).toBe(101)
    })

    it('윈도우 크기 1일 때 마지막 값만 사용한다', () => {
      const history = [100, 110, 120, 130]
      const periods = 2

      const result = simpleMovingAverage(history, periods, 1)

      expect(result.parameters.windowSize).toBe(1)
      expect(result.forecast).toEqual([130, 130])
    })
  })

  describe('selectOptimalWindowSize', () => {
    it('3개월 미만 데이터는 전체 데이터를 사용한다', () => {
      expect(selectOptimalWindowSize(1)).toBe(1)
      expect(selectOptimalWindowSize(2)).toBe(2)
    })

    it('3~6개월 데이터는 3개월 윈도우를 사용한다', () => {
      expect(selectOptimalWindowSize(3)).toBe(3)
      expect(selectOptimalWindowSize(4)).toBe(3)
      expect(selectOptimalWindowSize(5)).toBe(3)
    })

    it('6~12개월 데이터는 6개월 윈도우를 사용한다', () => {
      expect(selectOptimalWindowSize(6)).toBe(6)
      expect(selectOptimalWindowSize(9)).toBe(6)
      expect(selectOptimalWindowSize(11)).toBe(6)
    })

    it('12개월 이상 데이터는 12개월 윈도우를 사용한다', () => {
      expect(selectOptimalWindowSize(12)).toBe(12)
      expect(selectOptimalWindowSize(18)).toBe(12)
      expect(selectOptimalWindowSize(24)).toBe(12)
    })
  })
})
