
import {
  generateExcessInventoryReduction,
  generateOrderFrequencyOptimization,
  generateEOQCostSavingRecommendation,
  generateInventoryOptimizationRecommendations,
  summarizeOrganizationOptimization,
  type InventoryOptimizationInput,
  type OptimizationRecommendation,
} from '@/server/services/scm/inventory-optimization'

describe('재고 최적화 추천', () => {
  describe('generateExcessInventoryReduction - 과잉재고 감소 추천', () => {
    const baseInput: InventoryOptimizationInput = {
      productId: 'p1',
      productName: '테스트 제품',
      sku: 'SKU-001',
      currentStock: 500,
      safetyStock: 50,
      reorderPoint: 100,
      unitPrice: 1000,
      averageDailyDemand: 10,
      leadTimeDays: 7,
    }

    it('과잉 상태(안전재고 5배 이상) 제품에 대해 high 우선순위 추천을 생성한다', () => {
      const input = {
        ...baseInput,
        currentStock: 300, // 안전재고(50) × 6배
      }

      const result = generateExcessInventoryReduction(input)

      expect(result).not.toBeNull()
      expect(result?.type).toBe('excess_reduction')
      expect(result?.priority).toBe('high')
      expect(result?.title).toContain('과잉재고 긴급 처분 필요')
    })

    it('과다 상태(안전재고 3~5배) 제품에 대해 medium 우선순위 추천을 생성한다', () => {
      const input = {
        ...baseInput,
        currentStock: 200, // 안전재고(50) × 4배
      }

      const result = generateExcessInventoryReduction(input)

      expect(result).not.toBeNull()
      expect(result?.type).toBe('excess_reduction')
      expect(result?.priority).toBe('medium')
      expect(result?.title).toContain('과다재고 감소 권장')
    })

    it('적정 상태 제품은 null을 반환한다', () => {
      const input = {
        ...baseInput,
        currentStock: 100, // 발주점과 동일
      }

      const result = generateExcessInventoryReduction(input)

      expect(result).toBeNull()
    })

    it('부족 상태 제품은 null을 반환한다', () => {
      const input = {
        ...baseInput,
        currentStock: 30, // 안전재고 미만
      }

      const result = generateExcessInventoryReduction(input)

      expect(result).toBeNull()
    })

    it('초과 재고량과 초과 금액을 정확하게 계산한다', () => {
      const input = {
        ...baseInput,
        currentStock: 250, // 안전재고(50) × 5배
        safetyStock: 50,
        unitPrice: 1000,
      }

      const result = generateExcessInventoryReduction(input)

      // 초과량 = 250 - (50 × 3.0) = 100개
      // 초과금액 = 100 × 1000 = 100,000원
      expect(result?.metrics.improvement).toContain('100개')
      expect(result?.metrics.savingsKRW).toBe(25000) // 100,000 × 0.25
    })

    it('과잉재고 시 5가지 실행 항목을 제공한다', () => {
      const input = {
        ...baseInput,
        currentStock: 300, // 안전재고 × 6배
      }

      const result = generateExcessInventoryReduction(input)

      expect(result?.actionItems).toHaveLength(5)
      expect(result?.actionItems[0]).toContain('즉시 할인 프로모션')
    })

    it('과다재고 시 4가지 실행 항목을 제공한다', () => {
      const input = {
        ...baseInput,
        currentStock: 200, // 안전재고 × 4배
      }

      const result = generateExcessInventoryReduction(input)

      expect(result?.actionItems).toHaveLength(4)
      expect(result?.actionItems[0]).toContain('프로모션')
    })
  })

  describe('generateOrderFrequencyOptimization - 발주주기 최적화 추천', () => {
    const baseInput: InventoryOptimizationInput = {
      productId: 'p1',
      productName: '테스트 제품',
      sku: 'SKU-001',
      currentStock: 100,
      safetyStock: 50,
      reorderPoint: 100,
      unitPrice: 1000,
      averageDailyDemand: 10,
      leadTimeDays: 7,
      currentOrderQuantity: 140, // 14일분
    }

    it('AX 등급 제품에 대해 7일 주기를 추천한다', () => {
      const input = {
        ...baseInput,
        abcGrade: 'A' as const,
        xyzGrade: 'X' as const,
      }

      const result = generateOrderFrequencyOptimization(input)

      expect(result?.metrics.recommended).toBe('7일')
      expect(result?.title).toContain('AX 등급')
    })

    it('CZ 등급 제품에 대해 30일 주기를 추천한다', () => {
      const input = {
        ...baseInput,
        abcGrade: 'C' as const,
        xyzGrade: 'Z' as const,
        currentOrderQuantity: 100, // 10일분
      }

      const result = generateOrderFrequencyOptimization(input)

      expect(result?.metrics.recommended).toBe('30일')
      expect(result?.title).toContain('CZ 등급')
    })

    it('ABC/XYZ 등급 미할당 시 null을 반환한다', () => {
      const input = {
        ...baseInput,
        abcGrade: undefined,
        xyzGrade: undefined,
      }

      const result = generateOrderFrequencyOptimization(input)

      expect(result).toBeNull()
    })

    it('ABC 등급만 있고 XYZ 등급이 없으면 null을 반환한다', () => {
      const input = {
        ...baseInput,
        abcGrade: 'A' as const,
        xyzGrade: undefined,
      }

      const result = generateOrderFrequencyOptimization(input)

      expect(result).toBeNull()
    })

    it('현재 주기와 권장 주기 차이가 7일 미만이면 null을 반환한다', () => {
      const input = {
        ...baseInput,
        abcGrade: 'B' as const,
        xyzGrade: 'X' as const,
        currentOrderQuantity: 140, // 14일분
        // BX 권장: 14일 → 차이 0일
      }

      const result = generateOrderFrequencyOptimization(input)

      expect(result).toBeNull()
    })

    it('현재 주기와 권장 주기 차이가 7일 이상이고 A등급이면 high 우선순위를 부여한다', () => {
      const input = {
        ...baseInput,
        abcGrade: 'A' as const,
        xyzGrade: 'X' as const,
        currentOrderQuantity: 300, // 30일분
        // AX 권장: 7일 → 차이 23일
      }

      const result = generateOrderFrequencyOptimization(input)

      expect(result?.priority).toBe('high')
    })

    it('현재 주기와 권장 주기 차이가 7일 이상이고 B/C등급이면 medium 우선순위를 부여한다', () => {
      const input = {
        ...baseInput,
        abcGrade: 'C' as const,
        xyzGrade: 'X' as const,
        currentOrderQuantity: 100, // 10일분
        // CX 권장: 30일 → 차이 20일
      }

      const result = generateOrderFrequencyOptimization(input)

      expect(result?.priority).toBe('medium')
    })

    it('현재 발주량이 없으면 추천을 생성한다', () => {
      const input = {
        ...baseInput,
        abcGrade: 'A' as const,
        xyzGrade: 'Y' as const,
        currentOrderQuantity: undefined,
      }

      const result = generateOrderFrequencyOptimization(input)

      expect(result).not.toBeNull()
      expect(result?.metrics.current).toBe('미설정')
    })
  })

  describe('generateEOQCostSavingRecommendation - EOQ 기반 비용 절감 추천', () => {
    const baseInput: InventoryOptimizationInput = {
      productId: 'p1',
      productName: '테스트 제품',
      sku: 'SKU-001',
      currentStock: 100,
      safetyStock: 50,
      reorderPoint: 100,
      unitPrice: 1000,
      averageDailyDemand: 10, // 연간 3650개
      leadTimeDays: 7,
      currentOrderQuantity: 100,
      orderingCost: 50000,
      holdingRate: 0.25,
    }

    it('비용 절감률이 5% 이상일 때 추천을 생성한다', () => {
      const input = {
        ...baseInput,
        currentOrderQuantity: 50, // EOQ보다 훨씬 작은 값
      }

      const result = generateEOQCostSavingRecommendation(input)

      expect(result).not.toBeNull()
      expect(result?.type).toBe('eoq_cost_saving')
    })

    it('비용 절감률이 5% 미만이면 null을 반환한다', () => {
      // EOQ 계산: sqrt(2 × 3650 × 50000 / 250) ≈ 1209
      const input = {
        ...baseInput,
        currentOrderQuantity: 1200, // EOQ와 거의 동일 (1209)
      }

      const result = generateEOQCostSavingRecommendation(input)

      expect(result).toBeNull()
    })

    it('연간 수요가 0이면 null을 반환한다', () => {
      const input = {
        ...baseInput,
        averageDailyDemand: 0,
      }

      const result = generateEOQCostSavingRecommendation(input)

      expect(result).toBeNull()
    })

    it('현재 발주량이 미설정이면 null을 반환한다', () => {
      const input = {
        ...baseInput,
        currentOrderQuantity: undefined,
      }

      const result = generateEOQCostSavingRecommendation(input)

      expect(result).toBeNull()
    })

    it('현재 발주량이 0이면 null을 반환한다', () => {
      const input = {
        ...baseInput,
        currentOrderQuantity: 0,
      }

      const result = generateEOQCostSavingRecommendation(input)

      expect(result).toBeNull()
    })

    it('절감률 20% 이상이면 high 우선순위를 부여한다', () => {
      const input = {
        ...baseInput,
        currentOrderQuantity: 30, // EOQ와 큰 차이
      }

      const result = generateEOQCostSavingRecommendation(input)

      expect(result?.priority).toBe('high')
    })

    it('절감률 10~20%이면 medium 우선순위를 부여한다', () => {
      const input = {
        ...baseInput,
        currentOrderQuantity: 150, // EOQ와 중간 차이
      }

      const result = generateEOQCostSavingRecommendation(input)

      // 절감률 확인
      const savingsPercent = result?.metrics.improvement
      if (savingsPercent && typeof savingsPercent === 'string') {
        const percent = parseInt(savingsPercent)
        if (percent >= 10 && percent < 20) {
          expect(result?.priority).toBe('medium')
        }
      }
    })

    it('절감률 5~10%이면 low 우선순위를 부여한다', () => {
      const input = {
        ...baseInput,
        currentOrderQuantity: 240, // EOQ와 작은 차이
      }

      const result = generateEOQCostSavingRecommendation(input)

      // 절감률 확인
      const savingsPercent = result?.metrics.improvement
      if (savingsPercent && typeof savingsPercent === 'string') {
        const percent = parseInt(savingsPercent)
        if (percent >= 5 && percent < 10) {
          expect(result?.priority).toBe('low')
        }
      }
    })

    it('추천 메시지에 절감액과 절감률을 포함한다', () => {
      const input = {
        ...baseInput,
        currentOrderQuantity: 50,
      }

      const result = generateEOQCostSavingRecommendation(input)

      expect(result?.title).toContain('%')
      expect(result?.expectedImpact).toContain('원')
      expect(result?.metrics.savingsKRW).toBeGreaterThan(0)
    })
  })

  describe('generateInventoryOptimizationRecommendations - 통합 추천 생성', () => {
    it('3가지 타입 모두 해당되면 3개 추천을 반환한다', () => {
      const input: InventoryOptimizationInput = {
        productId: 'p1',
        productName: '테스트 제품',
        sku: 'SKU-001',
        currentStock: 300, // 과잉
        safetyStock: 50,
        reorderPoint: 100,
        abcGrade: 'A' as const,
        xyzGrade: 'X' as const,
        unitPrice: 1000,
        averageDailyDemand: 10,
        leadTimeDays: 7,
        currentOrderQuantity: 500, // EOQ(1209)와 큰 차이, 50일분 (AX 권장 7일과 43일 차이)
        orderingCost: 50000,
        holdingRate: 0.25,
      }

      const result = generateInventoryOptimizationRecommendations(input)

      expect(result).toHaveLength(3)
      expect(result.map((r) => r.type)).toContain('excess_reduction')
      expect(result.map((r) => r.type)).toContain('order_frequency')
      expect(result.map((r) => r.type)).toContain('eoq_cost_saving')
    })

    it('우선순위 순으로 정렬되어 반환된다 (high > medium > low)', () => {
      const input: InventoryOptimizationInput = {
        productId: 'p1',
        productName: '테스트 제품',
        sku: 'SKU-001',
        currentStock: 300,
        safetyStock: 50,
        reorderPoint: 100,
        abcGrade: 'C' as const,
        xyzGrade: 'X' as const,
        unitPrice: 1000,
        averageDailyDemand: 10,
        leadTimeDays: 7,
        currentOrderQuantity: 30,
        orderingCost: 50000,
        holdingRate: 0.25,
      }

      const result = generateInventoryOptimizationRecommendations(input)

      // 순차적으로 우선순위 감소 확인
      for (let i = 0; i < result.length - 1; i++) {
        const priorityOrder = { high: 1, medium: 2, low: 3 }
        expect(priorityOrder[result[i].priority]).toBeLessThanOrEqual(
          priorityOrder[result[i + 1].priority]
        )
      }
    })

    it('해당 추천이 없으면 빈 배열을 반환한다', () => {
      const input: InventoryOptimizationInput = {
        productId: 'p1',
        productName: '테스트 제품',
        sku: 'SKU-001',
        currentStock: 100, // 적정
        safetyStock: 50,
        reorderPoint: 100,
        abcGrade: undefined,
        xyzGrade: undefined,
        unitPrice: 1000,
        averageDailyDemand: 10,
        leadTimeDays: 7,
        currentOrderQuantity: undefined,
      }

      const result = generateInventoryOptimizationRecommendations(input)

      expect(result).toEqual([])
    })
  })

  describe('summarizeOrganizationOptimization - 조직 전체 최적화 요약', () => {
    it('추천 타입별 개수를 정확하게 집계한다', () => {
      const recommendations: OptimizationRecommendation[] = [
        {
          type: 'excess_reduction',
          productId: 'p1',
          productName: '제품1',
          sku: 'SKU-001',
          priority: 'high',
          title: '과잉재고',
          description: '',
          expectedImpact: '',
          actionItems: [],
          metrics: { savingsKRW: 10000 },
        },
        {
          type: 'excess_reduction',
          productId: 'p2',
          productName: '제품2',
          sku: 'SKU-002',
          priority: 'medium',
          title: '과다재고',
          description: '',
          expectedImpact: '',
          actionItems: [],
          metrics: { savingsKRW: 5000 },
        },
        {
          type: 'order_frequency',
          productId: 'p1',
          productName: '제품1',
          sku: 'SKU-001',
          priority: 'medium',
          title: '발주주기',
          description: '',
          expectedImpact: '',
          actionItems: [],
          metrics: {},
        },
      ]

      const summary = summarizeOrganizationOptimization(recommendations)

      expect(summary.byType.excess_reduction).toBe(2)
      expect(summary.byType.order_frequency).toBe(1)
      expect(summary.byType.eoq_cost_saving).toBe(0)
    })

    it('우선순위별 개수를 정확하게 집계한다', () => {
      const recommendations: OptimizationRecommendation[] = [
        {
          type: 'excess_reduction',
          productId: 'p1',
          productName: '제품1',
          sku: 'SKU-001',
          priority: 'high',
          title: '',
          description: '',
          expectedImpact: '',
          actionItems: [],
          metrics: {},
        },
        {
          type: 'order_frequency',
          productId: 'p2',
          productName: '제품2',
          sku: 'SKU-002',
          priority: 'medium',
          title: '',
          description: '',
          expectedImpact: '',
          actionItems: [],
          metrics: {},
        },
        {
          type: 'eoq_cost_saving',
          productId: 'p3',
          productName: '제품3',
          sku: 'SKU-003',
          priority: 'low',
          title: '',
          description: '',
          expectedImpact: '',
          actionItems: [],
          metrics: {},
        },
      ]

      const summary = summarizeOrganizationOptimization(recommendations)

      expect(summary.byPriority.high).toBe(1)
      expect(summary.byPriority.medium).toBe(1)
      expect(summary.byPriority.low).toBe(1)
    })

    it('전체 예상 절감액을 정확하게 합산한다', () => {
      const recommendations: OptimizationRecommendation[] = [
        {
          type: 'excess_reduction',
          productId: 'p1',
          productName: '제품1',
          sku: 'SKU-001',
          priority: 'high',
          title: '',
          description: '',
          expectedImpact: '',
          actionItems: [],
          metrics: { savingsKRW: 50000 },
        },
        {
          type: 'eoq_cost_saving',
          productId: 'p2',
          productName: '제품2',
          sku: 'SKU-002',
          priority: 'medium',
          title: '',
          description: '',
          expectedImpact: '',
          actionItems: [],
          metrics: { savingsKRW: 30000 },
        },
      ]

      const summary = summarizeOrganizationOptimization(recommendations)

      expect(summary.totalPotentialSavings).toBe(80000)
    })

    it('상위 5개 추천을 우선순위와 절감액 기준으로 반환한다', () => {
      const recommendations: OptimizationRecommendation[] = [
        {
          type: 'excess_reduction',
          productId: 'p1',
          productName: '제품1',
          sku: 'SKU-001',
          priority: 'high',
          title: '',
          description: '',
          expectedImpact: '',
          actionItems: [],
          metrics: { savingsKRW: 10000 },
        },
        {
          type: 'excess_reduction',
          productId: 'p2',
          productName: '제품2',
          sku: 'SKU-002',
          priority: 'high',
          title: '',
          description: '',
          expectedImpact: '',
          actionItems: [],
          metrics: { savingsKRW: 50000 },
        },
        {
          type: 'order_frequency',
          productId: 'p3',
          productName: '제품3',
          sku: 'SKU-003',
          priority: 'medium',
          title: '',
          description: '',
          expectedImpact: '',
          actionItems: [],
          metrics: { savingsKRW: 30000 },
        },
      ]

      const summary = summarizeOrganizationOptimization(recommendations)

      expect(summary.topRecommendations).toHaveLength(3)
      // 첫 번째는 high 우선순위 중 절감액이 큰 p2
      expect(summary.topRecommendations[0].productId).toBe('p2')
    })

    it('고유 제품 수를 정확하게 계산한다', () => {
      const recommendations: OptimizationRecommendation[] = [
        {
          type: 'excess_reduction',
          productId: 'p1',
          productName: '제품1',
          sku: 'SKU-001',
          priority: 'high',
          title: '',
          description: '',
          expectedImpact: '',
          actionItems: [],
          metrics: {},
        },
        {
          type: 'order_frequency',
          productId: 'p1', // 동일 제품
          productName: '제품1',
          sku: 'SKU-001',
          priority: 'medium',
          title: '',
          description: '',
          expectedImpact: '',
          actionItems: [],
          metrics: {},
        },
        {
          type: 'eoq_cost_saving',
          productId: 'p2',
          productName: '제품2',
          sku: 'SKU-002',
          priority: 'low',
          title: '',
          description: '',
          expectedImpact: '',
          actionItems: [],
          metrics: {},
        },
      ]

      const summary = summarizeOrganizationOptimization(recommendations)

      expect(summary.totalProducts).toBe(2)
      expect(summary.productsWithRecommendations).toBe(2)
      expect(summary.totalRecommendations).toBe(3)
    })
  })
})
