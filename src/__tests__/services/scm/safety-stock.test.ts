
import {
  calculateSafetyStock,
  calculateSimpleSafetyStock,
  getZScore,
  type SafetyStockInput,
} from '@/server/services/scm/safety-stock'

describe('안전재고 계산', () => {
  describe('calculateSafetyStock - 전체 공식', () => {
    it('기본 입력값으로 올바른 안전재고를 계산한다', () => {
      const input: SafetyStockInput = {
        averageDailyDemand: 100,
        demandStdDev: 20,
        leadTimeDays: 5,
        serviceLevel: 0.95,
      }

      const result = calculateSafetyStock(input)

      expect(result.safetyStock).toBeGreaterThan(0)
      expect(result.serviceLevel).toBe(0.95)
      expect(result.method).toBe('simplified')
      expect(Number.isInteger(result.safetyStock)).toBe(true)
    })

    it('리드타임 변동을 포함한 전체 공식을 사용한다', () => {
      const input: SafetyStockInput = {
        averageDailyDemand: 100,
        demandStdDev: 20,
        leadTimeDays: 5,
        leadTimeStdDev: 1, // 리드타임 변동 포함
        serviceLevel: 0.95,
      }

      const result = calculateSafetyStock(input)

      expect(result.method).toBe('full')
      expect(result.safetyStock).toBeGreaterThan(0)
    })

    it('서비스 레벨 95%일 때 Z값 1.65를 사용한다', () => {
      const input: SafetyStockInput = {
        averageDailyDemand: 100,
        demandStdDev: 10,
        leadTimeDays: 5,
        serviceLevel: 0.95,
      }

      const result = calculateSafetyStock(input)

      expect(result.zScore).toBe(1.65)
    })

    it('높은 서비스 레벨일수록 더 높은 안전재고를 산정한다', () => {
      const baseInput: SafetyStockInput = {
        averageDailyDemand: 100,
        demandStdDev: 20,
        leadTimeDays: 5,
      }

      const result95 = calculateSafetyStock({ ...baseInput, serviceLevel: 0.95 })
      const result99 = calculateSafetyStock({ ...baseInput, serviceLevel: 0.99 })

      expect(result99.safetyStock).toBeGreaterThan(result95.safetyStock)
    })

    it('0 이상의 안전재고를 반환한다', () => {
      const input: SafetyStockInput = {
        averageDailyDemand: 100,
        demandStdDev: 0, // 표준편차 0
        leadTimeDays: 5,
        serviceLevel: 0.95,
      }

      const result = calculateSafetyStock(input)

      expect(result.safetyStock).toBeGreaterThanOrEqual(0)
    })

    it('수요 표준편차가 클수록 안전재고가 증가한다', () => {
      const baseInput: SafetyStockInput = {
        averageDailyDemand: 100,
        leadTimeDays: 5,
        serviceLevel: 0.95,
      }

      const resultLowVariation = calculateSafetyStock({ ...baseInput, demandStdDev: 10 })
      const resultHighVariation = calculateSafetyStock({ ...baseInput, demandStdDev: 30 })

      expect(resultHighVariation.safetyStock).toBeGreaterThan(resultLowVariation.safetyStock)
    })

    it('리드타임이 길수록 안전재고가 증가한다', () => {
      const baseInput: SafetyStockInput = {
        averageDailyDemand: 100,
        demandStdDev: 20,
        serviceLevel: 0.95,
      }

      const resultShortLT = calculateSafetyStock({ ...baseInput, leadTimeDays: 3 })
      const resultLongLT = calculateSafetyStock({ ...baseInput, leadTimeDays: 10 })

      expect(resultLongLT.safetyStock).toBeGreaterThan(resultShortLT.safetyStock)
    })

    it('기본 서비스 레벨은 0.95이다', () => {
      const input: SafetyStockInput = {
        averageDailyDemand: 100,
        demandStdDev: 20,
        leadTimeDays: 5,
        // serviceLevel 미지정
      }

      const result = calculateSafetyStock(input)

      expect(result.serviceLevel).toBe(0.95)
    })
  })

  describe('calculateSimpleSafetyStock - 간단 공식', () => {
    it('간단한 공식으로 안전재고를 계산한다', () => {
      const result = calculateSimpleSafetyStock(100, 5, 0.5)

      // SS = 100 × 5 × 0.5 = 250
      expect(result).toBe(250)
    })

    it('기본 안전 계수는 0.5이다', () => {
      const result1 = calculateSimpleSafetyStock(100, 5)
      const result2 = calculateSimpleSafetyStock(100, 5, 0.5)

      expect(result1).toBe(result2)
      expect(result1).toBe(250)
    })

    it('안전 계수가 높을수록 안전재고가 증가한다', () => {
      const result05 = calculateSimpleSafetyStock(100, 5, 0.5)
      const result10 = calculateSimpleSafetyStock(100, 5, 1.0)

      expect(result10).toBeGreaterThan(result05)
    })

    it('일평균 판매량이 많을수록 안전재고가 증가한다', () => {
      const result50 = calculateSimpleSafetyStock(50, 5, 0.5)
      const result100 = calculateSimpleSafetyStock(100, 5, 0.5)

      expect(result100).toBeGreaterThan(result50)
    })

    it('리드타임이 길수록 안전재고가 증가한다', () => {
      const result3days = calculateSimpleSafetyStock(100, 3, 0.5)
      const result10days = calculateSimpleSafetyStock(100, 10, 0.5)

      expect(result10days).toBeGreaterThan(result3days)
    })

    it('정수로 올림 처리된 안전재고를 반환한다', () => {
      const result = calculateSimpleSafetyStock(100, 5, 0.5)

      expect(Number.isInteger(result)).toBe(true)
    })
  })

  describe('getZScore - Z값 조회', () => {
    it('기본 서비스 레벨(0.95)에 해당하는 Z값을 반환한다', () => {
      const zScore = getZScore(0.95)

      expect(zScore).toBe(1.65)
    })

    it('서비스 레벨 0.99에 해당하는 Z값을 반환한다', () => {
      const zScore = getZScore(0.99)

      expect(zScore).toBe(2.33)
    })

    it('서비스 레벨 0.9에 해당하는 Z값을 반환한다', () => {
      const zScore = getZScore(0.9)

      expect(zScore).toBe(1.28)
    })

    it('범위를 벗어난 낮은 값은 최소값을 반환한다', () => {
      const zScore = getZScore(0.8)

      expect(zScore).toBe(1.28)
    })

    it('범위를 벗어난 높은 값은 최대값을 반환한다', () => {
      const zScore = getZScore(0.9999)

      expect(zScore).toBe(3.09)
    })

    it('정확히 일치하지 않는 값은 선형 보간으로 계산한다', () => {
      const zScore = getZScore(0.96)

      expect(zScore).toBe(1.75)
    })

    it('보간된 Z값은 두 인접 값 사이의 범위에 있다', () => {
      const zScore = getZScore(0.945) // 0.94와 0.95 사이

      const z94 = getZScore(0.94)
      const z95 = getZScore(0.95)

      expect(zScore).toBeGreaterThanOrEqual(Math.min(z94, z95))
      expect(zScore).toBeLessThanOrEqual(Math.max(z94, z95))
    })
  })
})
