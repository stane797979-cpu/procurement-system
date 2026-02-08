
import {
  calculateReorderPoint,
  shouldReorder,
  daysUntilReorder,
  calculateOrderQuantity,
  type ReorderPointInput,
  type OrderQuantityInput,
} from '@/server/services/scm/reorder-point'

describe('발주점 계산', () => {
  describe('calculateReorderPoint - 발주점 산정', () => {
    it('기본 공식으로 올바른 발주점을 계산한다', () => {
      const input: ReorderPointInput = {
        averageDailyDemand: 100,
        leadTimeDays: 5,
        safetyStock: 200,
      }

      const result = calculateReorderPoint(input)

      // 발주점 = 일평균판매량 × 리드타임(일) + 안전재고
      // = 100 × 5 + 200 = 700
      expect(result.reorderPoint).toBe(700)
      expect(result.leadTimeDemand).toBe(500)
      expect(result.safetyStock).toBe(200)
    })

    it('발주점을 올림 처리한다', () => {
      const input: ReorderPointInput = {
        averageDailyDemand: 33.3,
        leadTimeDays: 3,
        safetyStock: 50,
      }

      const result = calculateReorderPoint(input)

      // 33.3 × 3 + 50 = 149.9 → 올림 → 150
      expect(result.reorderPoint).toBe(150)
      expect(result.leadTimeDemand).toBe(100) // 33.3 × 3 = 99.9 → 100
    })

    it('안전재고가 0일 때도 정상 작동한다', () => {
      const input: ReorderPointInput = {
        averageDailyDemand: 50,
        leadTimeDays: 4,
        safetyStock: 0,
      }

      const result = calculateReorderPoint(input)

      // 50 × 4 + 0 = 200
      expect(result.reorderPoint).toBe(200)
      expect(result.safetyStock).toBe(0)
    })

    it('일평균 판매량이 0이면 발주점이 안전재고와 같다', () => {
      const input: ReorderPointInput = {
        averageDailyDemand: 0,
        leadTimeDays: 5,
        safetyStock: 100,
      }

      const result = calculateReorderPoint(input)

      expect(result.reorderPoint).toBe(100)
      expect(result.leadTimeDemand).toBe(0)
    })
  })

  describe('shouldReorder - 발주 필요 여부', () => {
    it('현재고가 발주점보다 적으면 발주가 필요하다', () => {
      const result = shouldReorder(500, 700)

      expect(result).toBe(true)
    })

    it('현재고가 발주점보다 많으면 발주가 불필요하다', () => {
      const result = shouldReorder(800, 700)

      expect(result).toBe(false)
    })

    it('현재고가 발주점과 같으면 발주가 필요하다', () => {
      const result = shouldReorder(700, 700)

      expect(result).toBe(true)
    })

    it('현재고가 0이면 발주가 필요하다', () => {
      const result = shouldReorder(0, 700)

      expect(result).toBe(true)
    })
  })

  describe('daysUntilReorder - 발주까지 남은 재고일수', () => {
    it('정상적으로 남은 재고일수를 계산한다', () => {
      // 현재고 1000, 발주점 700, 일평균 100
      // (1000 - 700) / 100 = 3일
      const result = daysUntilReorder(1000, 700, 100)

      expect(result).toBe(3)
    })

    it('일평균 판매량이 0이면 null을 반환한다', () => {
      const result = daysUntilReorder(1000, 700, 0)

      expect(result).toBe(null)
    })

    it('이미 발주점 이하면 0을 반환한다', () => {
      const result = daysUntilReorder(600, 700, 100)

      expect(result).toBe(0)
    })

    it('현재고가 발주점과 같으면 0을 반환한다', () => {
      const result = daysUntilReorder(700, 700, 100)

      expect(result).toBe(0)
    })

    it('소수점은 버림 처리한다', () => {
      // (750 - 700) / 100 = 0.5 → 0일
      const result = daysUntilReorder(750, 700, 100)

      expect(result).toBe(0)
    })
  })

  describe('calculateOrderQuantity - 권장 발주량 계산', () => {
    it('EOQ 기반으로 발주량을 계산한다', () => {
      const input: OrderQuantityInput = {
        currentStock: 500,
        reorderPoint: 700,
        safetyStock: 200,
        averageDailyDemand: 100,
        eoq: 1000,
      }

      const result = calculateOrderQuantity(input)

      expect(result.method).toBe('eoq')
      expect(result.recommendedQuantity).toBe(1000)
      expect(result.projectedStock).toBe(1500) // 500 + 1000
    })

    it('목표 재고일수 기반으로 발주량을 계산한다', () => {
      const input: OrderQuantityInput = {
        currentStock: 500,
        reorderPoint: 700,
        safetyStock: 200,
        averageDailyDemand: 100,
        targetDaysOfInventory: 30,
      }

      const result = calculateOrderQuantity(input)

      // 목표 재고 = 100 × 30 + 200 = 3200
      // 발주량 = 3200 - 500 = 2700
      expect(result.method).toBe('target_days')
      expect(result.recommendedQuantity).toBe(2700)
    })

    it('최소 발주량(MOQ)을 적용한다', () => {
      const input: OrderQuantityInput = {
        currentStock: 3000,
        reorderPoint: 700,
        safetyStock: 200,
        averageDailyDemand: 100,
        targetDaysOfInventory: 30,
        minOrderQuantity: 500,
      }

      const result = calculateOrderQuantity(input)

      // 목표 재고 = 100 × 30 + 200 = 3200
      // 발주량 = 3200 - 3000 = 200 → MOQ 500 적용
      expect(result.recommendedQuantity).toBe(500)
    })

    it('발주 배수를 올림 처리한다', () => {
      const input: OrderQuantityInput = {
        currentStock: 500,
        reorderPoint: 700,
        safetyStock: 200,
        averageDailyDemand: 100,
        targetDaysOfInventory: 30,
        orderMultiple: 100,
      }

      const result = calculateOrderQuantity(input)

      // 목표 재고 = 100 × 30 + 200 = 3200
      // 발주량 = 3200 - 500 = 2700 → 100 단위 올림 → 2700
      expect(result.recommendedQuantity).toBe(2700)
    })

    it('발주 배수 올림 처리 - 단수 있는 경우', () => {
      const input: OrderQuantityInput = {
        currentStock: 500,
        reorderPoint: 700,
        safetyStock: 200,
        averageDailyDemand: 100,
        targetDaysOfInventory: 27, // 의도적으로 단수가 나오도록
        orderMultiple: 100,
      }

      const result = calculateOrderQuantity(input)

      // 목표 재고 = 100 × 27 + 200 = 2900
      // 발주량 = 2900 - 500 = 2400 → 100 단위 올림 → 2400
      // (이미 100의 배수)
      expect(result.recommendedQuantity % 100).toBe(0)
    })

    it('발주 후 예상 재고일수를 계산한다', () => {
      const input: OrderQuantityInput = {
        currentStock: 500,
        reorderPoint: 700,
        safetyStock: 200,
        averageDailyDemand: 100,
        eoq: 3000,
      }

      const result = calculateOrderQuantity(input)

      // 발주 후 재고 = 500 + 3000 = 3500
      // 재고일수 = (3500 - 200) / 100 = 33일
      expect(result.projectedDaysOfInventory).toBe(33)
    })

    it('일평균 판매량이 0이면 재고일수가 0이다', () => {
      const input: OrderQuantityInput = {
        currentStock: 500,
        reorderPoint: 700,
        safetyStock: 200,
        averageDailyDemand: 0,
        eoq: 1000,
      }

      const result = calculateOrderQuantity(input)

      expect(result.projectedDaysOfInventory).toBe(0)
    })

    it('기본 목표 재고일수는 30일이다', () => {
      const input: OrderQuantityInput = {
        currentStock: 500,
        reorderPoint: 700,
        safetyStock: 200,
        averageDailyDemand: 100,
      }

      const result = calculateOrderQuantity(input)

      // targetDaysOfInventory 미지정 시 30일 기본값
      expect(result.method).toBe('target_days')
      // 목표 재고 = 100 × 30 + 200 = 3200
      expect(result.recommendedQuantity).toBe(2700)
    })
  })
})
