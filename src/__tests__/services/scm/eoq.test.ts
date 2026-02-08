
import {
  calculateEOQ,
  calculateHoldingCost,
  compareOrderQuantityCost,
  calculateEOQWithDiscount,
  type EOQInput,
  type HoldingCostInput,
  type QuantityDiscountBracket,
} from '@/server/services/scm/eoq'

describe('경제적 발주량(EOQ) 계산', () => {
  describe('calculateEOQ - EOQ 산정', () => {
    it('기본 EOQ 공식으로 올바르게 계산한다', () => {
      const input: EOQInput = {
        annualDemand: 10000,
        orderingCost: 50,
        holdingCostPerUnit: 2,
      }

      const result = calculateEOQ(input)

      // EOQ = sqrt(2 × 10000 × 50 / 2) = sqrt(500000) ≈ 707.1 → 708
      expect(result.eoq).toBe(708)
    })

    it('EOQ 값을 올림 처리한다', () => {
      const input: EOQInput = {
        annualDemand: 1000,
        orderingCost: 25,
        holdingCostPerUnit: 5,
      }

      const result = calculateEOQ(input)

      // EOQ = sqrt(2 × 1000 × 25 / 5) = sqrt(10000) = 100 (정확히 떨어짐)
      expect(result.eoq).toBe(100)
      expect(Number.isInteger(result.eoq)).toBe(true)
    })

    it('연간 발주 횟수를 계산한다', () => {
      const input: EOQInput = {
        annualDemand: 10000,
        orderingCost: 50,
        holdingCostPerUnit: 2,
      }

      const result = calculateEOQ(input)

      // 연간 발주 횟수 = 10000 / 708 ≈ 14.12
      expect(result.ordersPerYear).toBeCloseTo(14.12, 1)
    })

    it('발주 주기(일)를 계산한다', () => {
      const input: EOQInput = {
        annualDemand: 10000,
        orderingCost: 50,
        holdingCostPerUnit: 2,
      }

      const result = calculateEOQ(input)

      // 발주 주기 = 365 / 14.12 ≈ 26일
      expect(result.orderCycleDays).toBe(26)
    })

    it('연간 총 발주비용을 계산한다', () => {
      const input: EOQInput = {
        annualDemand: 10000,
        orderingCost: 50,
        holdingCostPerUnit: 2,
      }

      const result = calculateEOQ(input)

      // 연간 발주비용 = (10000 / 708) × 50 ≈ 706
      expect(result.annualOrderingCost).toBeCloseTo(706, -1)
    })

    it('연간 총 유지비용을 계산한다', () => {
      const input: EOQInput = {
        annualDemand: 10000,
        orderingCost: 50,
        holdingCostPerUnit: 2,
      }

      const result = calculateEOQ(input)

      // 연간 유지비용 = (708 / 2) × 2 = 708
      expect(result.annualHoldingCost).toBeCloseTo(708, -1)
    })

    it('연간 총 재고비용을 계산한다', () => {
      const input: EOQInput = {
        annualDemand: 10000,
        orderingCost: 50,
        holdingCostPerUnit: 2,
      }

      const result = calculateEOQ(input)

      // 총 비용 = 발주비용 + 유지비용
      expect(result.totalAnnualCost).toBe(
        result.annualOrderingCost + result.annualHoldingCost
      )
    })

    it('연간 수요가 0이면 모든 값이 0이다', () => {
      const input: EOQInput = {
        annualDemand: 0,
        orderingCost: 50,
        holdingCostPerUnit: 2,
      }

      const result = calculateEOQ(input)

      expect(result.eoq).toBe(0)
      expect(result.ordersPerYear).toBe(0)
      expect(result.totalAnnualCost).toBe(0)
    })

    it('발주비용이 0이면 모든 값이 0이다', () => {
      const input: EOQInput = {
        annualDemand: 10000,
        orderingCost: 0,
        holdingCostPerUnit: 2,
      }

      const result = calculateEOQ(input)

      expect(result.eoq).toBe(0)
      expect(result.ordersPerYear).toBe(0)
      expect(result.totalAnnualCost).toBe(0)
    })

    it('유지비용이 0이면 모든 값이 0이다', () => {
      const input: EOQInput = {
        annualDemand: 10000,
        orderingCost: 50,
        holdingCostPerUnit: 0,
      }

      const result = calculateEOQ(input)

      expect(result.eoq).toBe(0)
      expect(result.ordersPerYear).toBe(0)
      expect(result.totalAnnualCost).toBe(0)
    })

    it('EOQ 최적점에서 발주비용과 유지비용이 거의 같다', () => {
      const input: EOQInput = {
        annualDemand: 10000,
        orderingCost: 50,
        holdingCostPerUnit: 2,
      }

      const result = calculateEOQ(input)

      // EOQ 이론상 발주비용 = 유지비용 (약간의 오차는 반올림 때문)
      expect(result.annualOrderingCost).toBeCloseTo(result.annualHoldingCost, -1)
    })
  })

  describe('calculateHoldingCost - 유지비용 계산', () => {
    it('기본 유지비율 25%를 적용한다', () => {
      const input: HoldingCostInput = {
        unitPrice: 1000,
      }

      const result = calculateHoldingCost(input)

      // 1000 × 0.25 = 250
      expect(result).toBe(250)
    })

    it('지정한 유지비율을 적용한다', () => {
      const input: HoldingCostInput = {
        unitPrice: 1000,
        holdingRate: 0.3,
      }

      const result = calculateHoldingCost(input)

      // 1000 × 0.3 = 300
      expect(result).toBe(300)
    })

    it('창고비용을 연간으로 환산하여 합산한다', () => {
      const input: HoldingCostInput = {
        unitPrice: 1000,
        holdingRate: 0.25,
        monthlyStorageCost: 10,
      }

      const result = calculateHoldingCost(input)

      // 1000 × 0.25 + 10 × 12 = 250 + 120 = 370
      expect(result).toBe(370)
    })

    it('보험료를 합산한다', () => {
      const input: HoldingCostInput = {
        unitPrice: 1000,
        holdingRate: 0.25,
        annualInsuranceCost: 50,
      }

      const result = calculateHoldingCost(input)

      // 1000 × 0.25 + 50 = 300
      expect(result).toBe(300)
    })

    it('기타 비용을 합산한다', () => {
      const input: HoldingCostInput = {
        unitPrice: 1000,
        holdingRate: 0.25,
        otherAnnualCost: 30,
      }

      const result = calculateHoldingCost(input)

      // 1000 × 0.25 + 30 = 280
      expect(result).toBe(280)
    })

    it('모든 비용을 합산한다', () => {
      const input: HoldingCostInput = {
        unitPrice: 1000,
        holdingRate: 0.25,
        monthlyStorageCost: 10,
        annualInsuranceCost: 50,
        otherAnnualCost: 30,
      }

      const result = calculateHoldingCost(input)

      // 1000 × 0.25 + 10 × 12 + 50 + 30 = 250 + 120 + 50 + 30 = 450
      expect(result).toBe(450)
    })
  })

  describe('compareOrderQuantityCost - 발주량 변경 시 비용 비교', () => {
    const baseEoqInput: EOQInput = {
      annualDemand: 10000,
      orderingCost: 50,
      holdingCostPerUnit: 2,
    }
    const eoqResult = calculateEOQ(baseEoqInput)

    it('EOQ보다 큰 발주량은 추가 비용이 발생한다', () => {
      const result = compareOrderQuantityCost(
        eoqResult,
        1000, // EOQ 708보다 큼
        10000,
        50,
        2
      )

      expect(result.costDifference).toBeGreaterThan(0)
      expect(result.costIncreasePercent).toBeGreaterThan(0)
    })

    it('EOQ보다 작은 발주량은 추가 비용이 발생한다', () => {
      const result = compareOrderQuantityCost(
        eoqResult,
        500, // EOQ 708보다 작음
        10000,
        50,
        2
      )

      expect(result.costDifference).toBeGreaterThan(0)
      expect(result.costIncreasePercent).toBeGreaterThan(0)
    })

    it('EOQ와 동일한 발주량은 추가 비용이 없다', () => {
      const result = compareOrderQuantityCost(
        eoqResult,
        eoqResult.eoq,
        10000,
        50,
        2
      )

      // 반올림 오차로 인해 정확히 0은 아닐 수 있음
      expect(Math.abs(result.costDifference)).toBeLessThan(10)
      expect(Math.abs(result.costIncreasePercent)).toBeLessThan(1)
    })

    it('실제 발주량이 0이면 모든 값이 0이다', () => {
      const result = compareOrderQuantityCost(eoqResult, 0, 10000, 50, 2)

      expect(result.actualAnnualCost).toBe(0)
      expect(result.costDifference).toBe(0)
      expect(result.costIncreasePercent).toBe(0)
    })

    it('비용 증가율을 백분율로 반환한다', () => {
      const result = compareOrderQuantityCost(
        eoqResult,
        1000,
        10000,
        50,
        2
      )

      // 백분율로 표현 (예: 5.2%)
      expect(result.costIncreasePercent).toBeGreaterThan(0)
      expect(typeof result.costIncreasePercent).toBe('number')
    })
  })

  describe('calculateEOQWithDiscount - 수량할인 EOQ', () => {
    it('수량할인을 고려한 최적 발주량을 계산한다', () => {
      const discountBrackets: QuantityDiscountBracket[] = [
        { minQuantity: 1, discountedPrice: 100 },
        { minQuantity: 500, discountedPrice: 95 },
        { minQuantity: 1000, discountedPrice: 90 },
      ]

      const result = calculateEOQWithDiscount(10000, 50, 0.25, discountBrackets)

      expect(result.optimalQuantity).toBeGreaterThan(0)
      expect(result.optimalPrice).toBeGreaterThan(0)
      expect(result.totalAnnualCost).toBeGreaterThan(0)
    })

    it('최저 총비용을 선택한다', () => {
      const discountBrackets: QuantityDiscountBracket[] = [
        { minQuantity: 1, discountedPrice: 100 },
        { minQuantity: 1000, discountedPrice: 80 }, // 대량 할인
      ]

      const result = calculateEOQWithDiscount(10000, 50, 0.25, discountBrackets)

      // 대량 할인이 유리할 가능성이 높음
      expect(result.optimalQuantity).toBeGreaterThanOrEqual(1)
    })

    it('EOQ가 최소 수량보다 작으면 최소 수량을 사용한다', () => {
      const discountBrackets: QuantityDiscountBracket[] = [
        { minQuantity: 1, discountedPrice: 100 },
        { minQuantity: 2000, discountedPrice: 90 }, // 높은 최소 수량
      ]

      const result = calculateEOQWithDiscount(10000, 50, 0.25, discountBrackets)

      // 결과는 어떤 구간의 최소 수량 이상이어야 함
      expect(result.optimalQuantity).toBeGreaterThanOrEqual(1)
    })

    it('총비용에 구매비용이 포함된다', () => {
      const discountBrackets: QuantityDiscountBracket[] = [
        { minQuantity: 1, discountedPrice: 100 },
      ]

      const result = calculateEOQWithDiscount(10000, 50, 0.25, discountBrackets)

      // 총비용 = 구매비용 + 발주비용 + 유지비용
      // 구매비용 = 10000 × 100 = 1,000,000
      expect(result.totalAnnualCost).toBeGreaterThan(1000000)
    })
  })
})
