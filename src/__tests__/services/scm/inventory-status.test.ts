
import {
  classifyInventoryStatus,
  needsReorder,
  isOverstocked,
  type InventoryStatusInput,
} from '@/server/services/scm/inventory-status'
import { INVENTORY_STATUS } from '@/lib/constants/inventory-status'

describe('재고상태 분류', () => {
  describe('classifyInventoryStatus - 7단계 분류', () => {
    it('품절: 현재고 = 0', () => {
      const input: InventoryStatusInput = {
        currentStock: 0,
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = classifyInventoryStatus(input)

      expect(result.status).toEqual(INVENTORY_STATUS.OUT_OF_STOCK)
      expect(result.key).toBe('out_of_stock')
      expect(result.needsAction).toBe(true)
      expect(result.urgencyLevel).toBe(3)
      expect(result.recommendation).toContain('즉시')
    })

    it('위험: 0 < 현재고 < 안전재고 × 0.5', () => {
      const input: InventoryStatusInput = {
        currentStock: 40, // 100 × 0.5 = 50보다 작음
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = classifyInventoryStatus(input)

      expect(result.status).toEqual(INVENTORY_STATUS.CRITICAL)
      expect(result.key).toBe('critical')
      expect(result.needsAction).toBe(true)
      expect(result.urgencyLevel).toBe(3)
      expect(result.recommendation).toContain('긴급')
    })

    it('위험: 경계값 테스트 (정확히 0.5 바로 아래)', () => {
      const input: InventoryStatusInput = {
        currentStock: 49, // 100 × 0.5 = 50보다 작음
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = classifyInventoryStatus(input)

      expect(result.key).toBe('critical')
    })

    it('부족: 안전재고 × 0.5 ≤ 현재고 < 안전재고', () => {
      const input: InventoryStatusInput = {
        currentStock: 70, // 50 이상, 100 미만
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = classifyInventoryStatus(input)

      expect(result.status).toEqual(INVENTORY_STATUS.SHORTAGE)
      expect(result.key).toBe('shortage')
      expect(result.needsAction).toBe(true)
      expect(result.urgencyLevel).toBe(2)
      expect(result.recommendation).toContain('발주 진행')
    })

    it('부족: 경계값 테스트 (정확히 0.5)', () => {
      const input: InventoryStatusInput = {
        currentStock: 50, // 100 × 0.5
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = classifyInventoryStatus(input)

      expect(result.key).toBe('shortage')
    })

    it('부족: 경계값 테스트 (안전재고 바로 아래)', () => {
      const input: InventoryStatusInput = {
        currentStock: 99,
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = classifyInventoryStatus(input)

      expect(result.key).toBe('shortage')
    })

    it('주의: 안전재고 ≤ 현재고 < 발주점', () => {
      const input: InventoryStatusInput = {
        currentStock: 150, // 100 이상, 200 미만
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = classifyInventoryStatus(input)

      expect(result.status).toEqual(INVENTORY_STATUS.CAUTION)
      expect(result.key).toBe('caution')
      expect(result.needsAction).toBe(true)
      expect(result.urgencyLevel).toBe(1)
      expect(result.recommendation).toContain('검토')
    })

    it('주의: 경계값 테스트 (정확히 안전재고)', () => {
      const input: InventoryStatusInput = {
        currentStock: 100,
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = classifyInventoryStatus(input)

      expect(result.key).toBe('caution')
    })

    it('주의: 경계값 테스트 (발주점 바로 아래)', () => {
      const input: InventoryStatusInput = {
        currentStock: 199,
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = classifyInventoryStatus(input)

      expect(result.key).toBe('caution')
    })

    it('적정: 발주점 ≤ 현재고 < 안전재고 × 3.0', () => {
      const input: InventoryStatusInput = {
        currentStock: 250, // 200 이상, 300 미만
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = classifyInventoryStatus(input)

      expect(result.status).toEqual(INVENTORY_STATUS.OPTIMAL)
      expect(result.key).toBe('optimal')
      expect(result.needsAction).toBe(false)
      expect(result.urgencyLevel).toBe(0)
      expect(result.recommendation).toContain('적정')
    })

    it('적정: 경계값 테스트 (정확히 발주점)', () => {
      const input: InventoryStatusInput = {
        currentStock: 200,
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = classifyInventoryStatus(input)

      expect(result.key).toBe('optimal')
    })

    it('적정: 경계값 테스트 (3.0 바로 아래)', () => {
      const input: InventoryStatusInput = {
        currentStock: 299,
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = classifyInventoryStatus(input)

      expect(result.key).toBe('optimal')
    })

    it('과다: 안전재고 × 3.0 ≤ 현재고 < 안전재고 × 5', () => {
      const input: InventoryStatusInput = {
        currentStock: 400, // 300 이상, 500 미만
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = classifyInventoryStatus(input)

      expect(result.status).toEqual(INVENTORY_STATUS.EXCESS)
      expect(result.key).toBe('excess')
      expect(result.needsAction).toBe(true)
      expect(result.urgencyLevel).toBe(1)
      expect(result.recommendation).toContain('재고 소진')
    })

    it('과다: 경계값 테스트 (정확히 3.0)', () => {
      const input: InventoryStatusInput = {
        currentStock: 300,
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = classifyInventoryStatus(input)

      expect(result.key).toBe('excess')
    })

    it('과다: 경계값 테스트 (5.0 바로 아래)', () => {
      const input: InventoryStatusInput = {
        currentStock: 499,
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = classifyInventoryStatus(input)

      expect(result.key).toBe('excess')
    })

    it('과잉: 현재고 ≥ 안전재고 × 5.0', () => {
      const input: InventoryStatusInput = {
        currentStock: 600, // 500 이상
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = classifyInventoryStatus(input)

      expect(result.status).toEqual(INVENTORY_STATUS.OVERSTOCK)
      expect(result.key).toBe('overstock')
      expect(result.needsAction).toBe(true)
      expect(result.urgencyLevel).toBe(2)
      expect(result.recommendation).toContain('처분')
    })

    it('과잉: 경계값 테스트 (정확히 5.0)', () => {
      const input: InventoryStatusInput = {
        currentStock: 500,
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = classifyInventoryStatus(input)

      expect(result.key).toBe('overstock')
    })

    it('안전재고가 0일 때도 정상 작동한다', () => {
      const input: InventoryStatusInput = {
        currentStock: 100,
        safetyStock: 0,
        reorderPoint: 50,
      }

      const result = classifyInventoryStatus(input)

      // 안전재고 0이면 대부분 과잉으로 분류될 것
      expect(result.key).toBeDefined()
      expect(['optimal', 'excess', 'overstock']).toContain(result.key)
    })
  })

  describe('needsReorder - 발주 필요 여부', () => {
    it('품절 상태는 발주가 필요하다', () => {
      const input: InventoryStatusInput = {
        currentStock: 0,
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = needsReorder(input)

      expect(result).toBe(true)
    })

    it('위험 상태는 발주가 필요하다', () => {
      const input: InventoryStatusInput = {
        currentStock: 40,
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = needsReorder(input)

      expect(result).toBe(true)
    })

    it('부족 상태는 발주가 필요하다', () => {
      const input: InventoryStatusInput = {
        currentStock: 70,
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = needsReorder(input)

      expect(result).toBe(true)
    })

    it('주의 상태는 발주가 필요하다', () => {
      const input: InventoryStatusInput = {
        currentStock: 150,
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = needsReorder(input)

      expect(result).toBe(true)
    })

    it('적정 상태는 발주가 불필요하다', () => {
      const input: InventoryStatusInput = {
        currentStock: 250,
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = needsReorder(input)

      expect(result).toBe(false)
    })

    it('과다 상태는 발주가 불필요하다', () => {
      const input: InventoryStatusInput = {
        currentStock: 400,
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = needsReorder(input)

      expect(result).toBe(false)
    })

    it('과잉 상태는 발주가 불필요하다', () => {
      const input: InventoryStatusInput = {
        currentStock: 600,
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = needsReorder(input)

      expect(result).toBe(false)
    })
  })

  describe('isOverstocked - 재고 과다 여부', () => {
    it('과다 상태는 과다 재고로 판정된다', () => {
      const input: InventoryStatusInput = {
        currentStock: 400,
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = isOverstocked(input)

      expect(result).toBe(true)
    })

    it('과잉 상태는 과다 재고로 판정된다', () => {
      const input: InventoryStatusInput = {
        currentStock: 600,
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = isOverstocked(input)

      expect(result).toBe(true)
    })

    it('적정 상태는 과다 재고가 아니다', () => {
      const input: InventoryStatusInput = {
        currentStock: 250,
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = isOverstocked(input)

      expect(result).toBe(false)
    })

    it('주의 상태는 과다 재고가 아니다', () => {
      const input: InventoryStatusInput = {
        currentStock: 150,
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = isOverstocked(input)

      expect(result).toBe(false)
    })

    it('부족 상태는 과다 재고가 아니다', () => {
      const input: InventoryStatusInput = {
        currentStock: 70,
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = isOverstocked(input)

      expect(result).toBe(false)
    })

    it('위험 상태는 과다 재고가 아니다', () => {
      const input: InventoryStatusInput = {
        currentStock: 40,
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = isOverstocked(input)

      expect(result).toBe(false)
    })

    it('품절 상태는 과다 재고가 아니다', () => {
      const input: InventoryStatusInput = {
        currentStock: 0,
        safetyStock: 100,
        reorderPoint: 200,
      }

      const result = isOverstocked(input)

      expect(result).toBe(false)
    })
  })
})
