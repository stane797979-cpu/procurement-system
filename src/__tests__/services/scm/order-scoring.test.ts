
import {
  calculateOrderScore,
  calculateOrderScoreList,
  filterByPriority,
  getUrgentOrders,
  type OrderScoringInput,
  type OrderScoringListItem,
} from '@/server/services/scm/order-scoring'

describe('발주 우선순위 스코어링', () => {
  describe('calculateOrderScore - 발주 점수 계산', () => {
    const createInput = (overrides: Partial<OrderScoringInput> = {}): OrderScoringInput => ({
      currentStock: 50,
      safetyStock: 100,
      reorderPoint: 150,
      abcGrade: 'B',
      leadTimeDays: 7,
      recentSales: 100,
      previousSales: 80,
      ...overrides,
    })

    it('품절 + A등급 + 판매 급증 + 긴 리드타임 = urgent (80점 이상)', () => {
      const input = createInput({
        currentStock: 0, // 품절 = 40점
        abcGrade: 'A', // A등급 = 30점
        recentSales: 200, // 증가율 100%
        previousSales: 100, // 판매추세 = 20점
        leadTimeDays: 30, // 리드타임 = 10점
      })

      const result = calculateOrderScore(input)

      expect(result.totalScore).toBeGreaterThanOrEqual(80)
      expect(result.priorityLevel).toBe('urgent')
      expect(result.breakdown.inventoryUrgency).toBe(40)
      expect(result.breakdown.abcScore).toBe(30)
      expect(result.breakdown.salesTrend).toBe(20)
      expect(result.breakdown.leadTimeRisk).toBe(10)
    })

    it('적정재고 + C등급 + 판매 감소 = low (0-39점)', () => {
      const input = createInput({
        currentStock: 200, // 적정 = 10점
        safetyStock: 100,
        reorderPoint: 150,
        abcGrade: 'C', // C등급 = 10점
        recentSales: 40,
        previousSales: 100, // 판매 감소 = 낮은 점수
        leadTimeDays: 3, // 짧은 리드타임 = 낮은 점수
      })

      const result = calculateOrderScore(input)

      expect(result.totalScore).toBeLessThan(40)
      expect(result.priorityLevel).toBe('low')
    })

    it('재고 긴급도 점수는 0-40점 범위이다', () => {
      const testCases = [
        { currentStock: 0, expected: 40 }, // 품절
        { currentStock: 30, safetyStock: 100, expected: 35 }, // 위험
        { currentStock: 60, safetyStock: 100, expected: 30 }, // 부족
        { currentStock: 120, safetyStock: 100, reorderPoint: 150, expected: 20 }, // 주의
        { currentStock: 200, safetyStock: 100, reorderPoint: 150, expected: 10 }, // 적정
        { currentStock: 350, safetyStock: 100, expected: 0 }, // 과다
      ]

      testCases.forEach(({ currentStock, safetyStock = 100, reorderPoint = 150, expected }) => {
        const input = createInput({ currentStock, safetyStock, reorderPoint })
        const result = calculateOrderScore(input)

        expect(result.breakdown.inventoryUrgency).toBe(expected)
        expect(result.breakdown.inventoryUrgency).toBeGreaterThanOrEqual(0)
        expect(result.breakdown.inventoryUrgency).toBeLessThanOrEqual(40)
      })
    })

    it('ABC 등급 점수는 0-30점 범위이다', () => {
      const testCases = [
        { abcGrade: 'A' as const, expected: 30 },
        { abcGrade: 'B' as const, expected: 20 },
        { abcGrade: 'C' as const, expected: 10 },
      ]

      testCases.forEach(({ abcGrade, expected }) => {
        const input = createInput({ abcGrade })
        const result = calculateOrderScore(input)

        expect(result.breakdown.abcScore).toBe(expected)
        expect(result.breakdown.abcScore).toBeGreaterThanOrEqual(0)
        expect(result.breakdown.abcScore).toBeLessThanOrEqual(30)
      })
    })

    it('판매 추세 점수는 0-20점 범위이다', () => {
      const testCases = [
        { recentSales: 200, previousSales: 100, desc: '100% 증가' }, // 20점
        { recentSales: 100, previousSales: 100, desc: '0% 변화' }, // 10점
        { recentSales: 50, previousSales: 100, desc: '50% 감소' }, // 0점
      ]

      testCases.forEach(({ recentSales, previousSales }) => {
        const input = createInput({ recentSales, previousSales })
        const result = calculateOrderScore(input)

        expect(result.breakdown.salesTrend).toBeGreaterThanOrEqual(0)
        expect(result.breakdown.salesTrend).toBeLessThanOrEqual(20)
      })
    })

    it('이전 판매가 0이면 최근 판매 여부로 점수를 결정한다', () => {
      const inputWithRecentSales = createInput({ recentSales: 100, previousSales: 0 })
      const inputNoRecentSales = createInput({ recentSales: 0, previousSales: 0 })

      const resultWith = calculateOrderScore(inputWithRecentSales)
      const resultWithout = calculateOrderScore(inputNoRecentSales)

      expect(resultWith.breakdown.salesTrend).toBe(10)
      expect(resultWithout.breakdown.salesTrend).toBe(0)
    })

    it('리드타임 점수는 0-10점 범위이다', () => {
      const testCases = [
        { leadTimeDays: 1, maxExpected: 1 },
        { leadTimeDays: 7, maxExpected: 3 },
        { leadTimeDays: 14, maxExpected: 5 },
        { leadTimeDays: 30, minExpected: 9 },
        { leadTimeDays: 45, minExpected: 9 }, // 30일 이상은 최대 10점
      ]

      testCases.forEach(({ leadTimeDays, minExpected, maxExpected }) => {
        const input = createInput({ leadTimeDays })
        const result = calculateOrderScore(input)

        expect(result.breakdown.leadTimeRisk).toBeGreaterThanOrEqual(0)
        expect(result.breakdown.leadTimeRisk).toBeLessThanOrEqual(10)

        if (minExpected !== undefined) {
          expect(result.breakdown.leadTimeRisk).toBeGreaterThanOrEqual(minExpected)
        }
        if (maxExpected !== undefined) {
          expect(result.breakdown.leadTimeRisk).toBeLessThanOrEqual(maxExpected)
        }
      })
    })

    it('리드타임 30일 이상이면 최대 10점을 부여한다', () => {
      const input30 = createInput({ leadTimeDays: 30 })
      const input60 = createInput({ leadTimeDays: 60 })

      const result30 = calculateOrderScore(input30)
      const result60 = calculateOrderScore(input60)

      expect(result30.breakdown.leadTimeRisk).toBe(10)
      expect(result60.breakdown.leadTimeRisk).toBe(10)
    })

    it('총점은 0-100점 범위이다', () => {
      const inputMin = createInput({
        currentStock: 500, // 과다재고 = 0점
        safetyStock: 100,
        abcGrade: 'C', // 10점
        recentSales: 0,
        previousSales: 100, // 감소 = 낮은 점수
        leadTimeDays: 1, // 짧은 리드타임
      })

      const inputMax = createInput({
        currentStock: 0, // 품절 = 40점
        abcGrade: 'A', // 30점
        recentSales: 200,
        previousSales: 100, // 100% 증가 = 20점
        leadTimeDays: 30, // 30일 = 10점
      })

      const resultMin = calculateOrderScore(inputMin)
      const resultMax = calculateOrderScore(inputMax)

      expect(resultMin.totalScore).toBeGreaterThanOrEqual(0)
      expect(resultMin.totalScore).toBeLessThanOrEqual(100)
      expect(resultMax.totalScore).toBeGreaterThanOrEqual(0)
      expect(resultMax.totalScore).toBeLessThanOrEqual(100)
    })

    it('우선순위 등급을 올바르게 결정한다', () => {
      const testCases = [
        { totalScore: 85, expectedLevel: 'urgent' as const },
        { totalScore: 70, expectedLevel: 'high' as const },
        { totalScore: 50, expectedLevel: 'normal' as const },
        { totalScore: 30, expectedLevel: 'low' as const },
      ]

      testCases.forEach(({ totalScore, expectedLevel }) => {
        // 총점이 특정 값이 되도록 입력 조정
        const input = createInput({
          currentStock: totalScore >= 80 ? 0 : totalScore >= 60 ? 30 : totalScore >= 40 ? 120 : 200,
          abcGrade: totalScore >= 80 ? 'A' : totalScore >= 60 ? 'B' : 'C',
          recentSales: totalScore >= 80 ? 200 : 100,
          previousSales: 100,
          leadTimeDays: totalScore >= 80 ? 30 : 7,
        })

        const result = calculateOrderScore(input)

        expect(result.priorityLevel).toBe(expectedLevel)
        expect(result.recommendation).toBeTruthy()
      })
    })
  })

  describe('calculateOrderScoreList - 여러 제품 점수 계산', () => {
    const createListItem = (
      id: string,
      overrides: Partial<OrderScoringListItem> = {}
    ): OrderScoringListItem => ({
      productId: id,
      productName: `상품${id}`,
      currentStock: 50,
      safetyStock: 100,
      reorderPoint: 150,
      abcGrade: 'B',
      leadTimeDays: 7,
      recentSales: 100,
      previousSales: 80,
      ...overrides,
    })

    it('점수순 내림차순으로 정렬한다', () => {
      const items: OrderScoringListItem[] = [
        createListItem('P001', { currentStock: 120 }), // 낮은 점수
        createListItem('P002', { currentStock: 0, abcGrade: 'A' }), // 높은 점수
        createListItem('P003', { currentStock: 30 }), // 중간 점수
      ]

      const results = calculateOrderScoreList(items)

      expect(results[0].productId).toBe('P002') // 가장 높은 점수
      expect(results[1].scoring.totalScore).toBeGreaterThanOrEqual(
        results[2].scoring.totalScore
      )
    })

    it('순위를 1부터 시작하여 부여한다', () => {
      const items: OrderScoringListItem[] = [
        createListItem('P001'),
        createListItem('P002'),
        createListItem('P003'),
      ]

      const results = calculateOrderScoreList(items)

      expect(results[0].rank).toBe(1)
      expect(results[1].rank).toBe(2)
      expect(results[2].rank).toBe(3)
    })

    it('빈 배열을 입력하면 빈 배열을 반환한다', () => {
      const results = calculateOrderScoreList([])

      expect(results).toHaveLength(0)
    })

    it('각 항목에 scoring 정보를 포함한다', () => {
      const items: OrderScoringListItem[] = [
        createListItem('P001'),
      ]

      const results = calculateOrderScoreList(items)

      expect(results[0].scoring).toBeDefined()
      expect(results[0].scoring.totalScore).toBeGreaterThanOrEqual(0)
      expect(results[0].scoring.breakdown).toBeDefined()
      expect(results[0].scoring.priorityLevel).toBeDefined()
    })
  })

  describe('filterByPriority - 우선순위 필터링', () => {
    const createScoredItem = (
      id: string,
      priorityLevel: 'urgent' | 'high' | 'normal' | 'low'
    ) => ({
      productId: id,
      productName: `상품${id}`,
      currentStock: 50,
      safetyStock: 100,
      reorderPoint: 150,
      abcGrade: 'B' as const,
      leadTimeDays: 7,
      recentSales: 100,
      previousSales: 80,
      scoring: {
        totalScore: priorityLevel === 'urgent' ? 90 : priorityLevel === 'high' ? 70 : priorityLevel === 'normal' ? 50 : 30,
        breakdown: {
          inventoryUrgency: 30,
          abcScore: 20,
          salesTrend: 10,
          leadTimeRisk: 5,
        },
        priorityLevel,
        recommendation: '테스트',
      },
      rank: 1,
    })

    it('지정한 우선순위 등급의 품목만 반환한다', () => {
      const items = [
        createScoredItem('P001', 'urgent'),
        createScoredItem('P002', 'high'),
        createScoredItem('P003', 'normal'),
        createScoredItem('P004', 'low'),
      ]

      const filtered = filterByPriority(items, ['urgent', 'high'])

      expect(filtered).toHaveLength(2)
      expect(filtered[0].productId).toBe('P001')
      expect(filtered[1].productId).toBe('P002')
    })

    it('조건을 만족하는 품목이 없으면 빈 배열을 반환한다', () => {
      const items = [
        createScoredItem('P001', 'normal'),
        createScoredItem('P002', 'low'),
      ]

      const filtered = filterByPriority(items, ['urgent'])

      expect(filtered).toHaveLength(0)
    })
  })

  describe('getUrgentOrders - 긴급/우선 발주 목록', () => {
    const createScoredItem = (
      id: string,
      priorityLevel: 'urgent' | 'high' | 'normal' | 'low'
    ) => ({
      productId: id,
      productName: `상품${id}`,
      currentStock: 50,
      safetyStock: 100,
      reorderPoint: 150,
      abcGrade: 'B' as const,
      leadTimeDays: 7,
      recentSales: 100,
      previousSales: 80,
      scoring: {
        totalScore: priorityLevel === 'urgent' ? 90 : priorityLevel === 'high' ? 70 : priorityLevel === 'normal' ? 50 : 30,
        breakdown: {
          inventoryUrgency: 30,
          abcScore: 20,
          salesTrend: 10,
          leadTimeRisk: 5,
        },
        priorityLevel,
        recommendation: '테스트',
      },
      rank: 1,
    })

    it('urgent와 high 등급만 반환한다', () => {
      const items = [
        createScoredItem('P001', 'urgent'),
        createScoredItem('P002', 'high'),
        createScoredItem('P003', 'normal'),
        createScoredItem('P004', 'low'),
      ]

      const urgent = getUrgentOrders(items)

      expect(urgent).toHaveLength(2)
      expect(urgent[0].scoring.priorityLevel).toBe('urgent')
      expect(urgent[1].scoring.priorityLevel).toBe('high')
    })

    it('urgent/high가 없으면 빈 배열을 반환한다', () => {
      const items = [
        createScoredItem('P001', 'normal'),
        createScoredItem('P002', 'low'),
      ]

      const urgent = getUrgentOrders(items)

      expect(urgent).toHaveLength(0)
    })
  })
})
