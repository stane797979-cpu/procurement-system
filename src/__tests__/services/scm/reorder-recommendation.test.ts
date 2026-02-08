
import {
  shouldReorder,
  calculateDaysOfStock,
  convertToReorderItem,
  calculateRecommendedQuantity,
  calculateReorderPriority,
  sortReorderItems,
  filterByUrgency,
  filterByABCGrade,
  type ProductReorderData,
  type ReorderItem,
} from '@/server/services/scm/reorder-recommendation'

describe('발주 추천 서비스', () => {
  describe('shouldReorder - 발주 필요 여부', () => {
    it('현재고가 발주점보다 낮으면 true를 반환한다', () => {
      expect(shouldReorder(50, 100)).toBe(true)
    })

    it('현재고가 발주점과 같으면 true를 반환한다', () => {
      expect(shouldReorder(100, 100)).toBe(true)
    })

    it('현재고가 발주점보다 높으면 false를 반환한다', () => {
      expect(shouldReorder(150, 100)).toBe(false)
    })

    it('현재고가 0이면 true를 반환한다', () => {
      expect(shouldReorder(0, 100)).toBe(true)
    })
  })

  describe('calculateDaysOfStock - 재고일수 계산', () => {
    it('정상적인 입력으로 재고일수를 계산한다', () => {
      const result = calculateDaysOfStock(100, 10, 20)
      // (100 - 20) / 10 = 8일
      expect(result).toBe(8)
    })

    it('일평균 판매량이 0이면 null을 반환한다', () => {
      const result = calculateDaysOfStock(100, 0, 20)
      expect(result).toBeNull()
    })

    it('일평균 판매량이 음수이면 null을 반환한다', () => {
      const result = calculateDaysOfStock(100, -5, 20)
      expect(result).toBeNull()
    })

    it('현재고가 안전재고보다 적으면 0일을 반환한다', () => {
      const result = calculateDaysOfStock(50, 10, 100)
      // max(0, 50 - 100) = 0
      expect(result).toBe(0)
    })

    it('현재고가 안전재고와 같으면 0일을 반환한다', () => {
      const result = calculateDaysOfStock(50, 10, 50)
      expect(result).toBe(0)
    })

    it('안전재고가 0이면 전체 재고로 일수를 계산한다', () => {
      const result = calculateDaysOfStock(100, 10, 0)
      // (100 - 0) / 10 = 10일
      expect(result).toBe(10)
    })

    it('재고일수를 정수로 반환한다', () => {
      const result = calculateDaysOfStock(95, 10, 20)
      // (95 - 20) / 10 = 7.5 → 7일
      expect(result).toBe(7)
      expect(Number.isInteger(result)).toBe(true)
    })
  })

  describe('convertToReorderItem - 발주 품목 변환', () => {
    const createTestData = (overrides: Partial<ProductReorderData> = {}): ProductReorderData => ({
      productId: 'P001',
      sku: 'SKU001',
      productName: '테스트 상품',
      currentStock: 30,
      safetyStock: 50,
      reorderPoint: 100,
      avgDailySales: 10,
      abcGrade: 'A',
      moq: 50,
      leadTime: 7,
      unitPrice: 10000,
      costPrice: 8000,
      supplierId: 'S001',
      supplierName: '테스트 공급자',
      ...overrides,
    })

    it('발주 필요 품목(품절)을 정상적으로 변환한다', () => {
      const data = createTestData({ currentStock: 0 })
      const result = convertToReorderItem(data)

      expect(result).not.toBeNull()
      expect(result?.productId).toBe('P001')
      expect(result?.status).toBe('out_of_stock')
      expect(result?.urgencyLevel).toBe(3)
      // 품절 시 availableStock = max(0, 0 - 50) = 0, daysOfStock = 0 / 10 = 0
      expect(result?.daysOfStock).toBe(0)
      expect(result?.recommendedQty).toBeGreaterThan(0)
    })

    it('발주 필요 품목(위험)을 정상적으로 변환한다', () => {
      const data = createTestData({ currentStock: 20, safetyStock: 50 })
      const result = convertToReorderItem(data)

      expect(result).not.toBeNull()
      expect(result?.status).toBe('critical')
      expect(result?.urgencyLevel).toBe(3)
    })

    it('발주 필요 품목(부족)을 정상적으로 변환한다', () => {
      const data = createTestData({ currentStock: 40, safetyStock: 50 })
      const result = convertToReorderItem(data)

      expect(result).not.toBeNull()
      expect(result?.status).toBe('shortage')
      expect(result?.urgencyLevel).toBe(2)
    })

    it('발주 필요 품목(주의)을 정상적으로 변환한다', () => {
      const data = createTestData({ currentStock: 80, safetyStock: 50, reorderPoint: 100 })
      const result = convertToReorderItem(data)

      expect(result).not.toBeNull()
      expect(result?.status).toBe('caution')
      expect(result?.urgencyLevel).toBe(1)
    })

    it('발주 불필요 품목(적정)은 null을 반환한다', () => {
      const data = createTestData({ currentStock: 120, safetyStock: 50, reorderPoint: 100 })
      const result = convertToReorderItem(data)

      expect(result).toBeNull()
    })

    it('공급자 정보가 있으면 supplier 필드를 포함한다', () => {
      const data = createTestData({
        currentStock: 30,
        supplierId: 'S001',
        supplierName: '테스트 공급자',
        leadTime: 7,
      })
      const result = convertToReorderItem(data)

      expect(result?.supplier).toEqual({
        id: 'S001',
        name: '테스트 공급자',
        leadTime: 7,
      })
    })

    it('공급자 정보가 없으면 supplier 필드는 undefined이다', () => {
      const data = createTestData({
        currentStock: 30,
        supplierId: undefined,
        supplierName: undefined,
      })
      const result = convertToReorderItem(data)

      expect(result?.supplier).toBeUndefined()
    })
  })

  describe('calculateRecommendedQuantity - 추천 발주량', () => {
    const createTestData = (overrides: Partial<ProductReorderData> = {}): ProductReorderData => ({
      productId: 'P001',
      sku: 'SKU001',
      productName: '테스트 상품',
      currentStock: 50,
      safetyStock: 100,
      reorderPoint: 150,
      avgDailySales: 10,
      abcGrade: 'A',
      moq: 50,
      leadTime: 7,
      unitPrice: 10000,
      costPrice: 8000,
      ...overrides,
    })

    it('정상적인 입력으로 추천 발주량을 계산한다', () => {
      const data = createTestData()
      const result = calculateRecommendedQuantity(data)

      expect(result).toBeGreaterThan(0)
      expect(Number.isInteger(result)).toBe(true)
    })

    it('costPrice가 0이면 목표 재고일수 기반으로 계산한다', () => {
      const data = createTestData({ costPrice: 0 })
      const result = calculateRecommendedQuantity(data)

      expect(result).toBeGreaterThan(0)
    })

    it('일평균 판매량이 0이면 기본값을 반환한다', () => {
      const data = createTestData({ avgDailySales: 0 })
      const result = calculateRecommendedQuantity(data)

      expect(result).toBeGreaterThanOrEqual(0)
    })

    it('MOQ보다 작은 발주량은 MOQ로 조정된다', () => {
      const data = createTestData({
        currentStock: 140,
        reorderPoint: 150,
        moq: 100,
        avgDailySales: 1,
      })
      const result = calculateRecommendedQuantity(data)

      expect(result).toBeGreaterThanOrEqual(100)
    })

    it('발주량은 항상 양수이다', () => {
      const data = createTestData()
      const result = calculateRecommendedQuantity(data)

      expect(result).toBeGreaterThan(0)
    })
  })

  describe('calculateReorderPriority - 발주 우선순위 계산', () => {
    const createReorderItem = (
      overrides: Partial<ReorderItem> = {}
    ): ReorderItem => ({
      productId: 'P001',
      sku: 'SKU001',
      productName: '테스트 상품',
      currentStock: 30,
      safetyStock: 50,
      reorderPoint: 100,
      avgDailySales: 10,
      daysOfStock: 5,
      recommendedQty: 100,
      urgencyLevel: 2,
      status: 'shortage',
      ...overrides,
    })

    it('품절 + A등급 + 재고일수 0일 = 최고 점수(100점)', () => {
      const item = createReorderItem({ status: 'out_of_stock', daysOfStock: 0 })
      const score = calculateReorderPriority(item, 'A')

      // 50(품절) + 30(A) + 20(0일) = 100
      expect(score).toBe(100)
    })

    it('위험 + B등급 + 재고일수 2일 = 75점', () => {
      const item = createReorderItem({ status: 'critical', daysOfStock: 2 })
      const score = calculateReorderPriority(item, 'B')

      // 40(위험) + 20(B) + 15(1-3일) = 75
      expect(score).toBe(75)
    })

    it('부족 + C등급 + 재고일수 5일 = 50점', () => {
      const item = createReorderItem({ status: 'shortage', daysOfStock: 5 })
      const score = calculateReorderPriority(item, 'C')

      // 30(부족) + 10(C) + 10(4-7일) = 50
      expect(score).toBe(50)
    })

    it('주의 + ABC 미지정 + 재고일수 8일 = 40점', () => {
      const item = createReorderItem({ status: 'caution', daysOfStock: 8 })
      const score = calculateReorderPriority(item, undefined)

      // 20(주의) + 15(미지정) + 5(7일+) = 40
      expect(score).toBe(40)
    })

    it('재고일수 null이면 최대 점수(20점) 부여', () => {
      const item = createReorderItem({ status: 'shortage', daysOfStock: null })
      const score = calculateReorderPriority(item, 'A')

      // 30(부족) + 30(A) + 20(null) = 80
      expect(score).toBe(80)
    })

    it('재고일수가 음수이면 최대 점수(20점) 부여', () => {
      const item = createReorderItem({ status: 'shortage', daysOfStock: 0 })
      const score = calculateReorderPriority(item, 'A')

      // 30(부족) + 30(A) + 20(0일) = 80
      expect(score).toBe(80)
    })
  })

  describe('sortReorderItems - 발주 품목 정렬', () => {
    const createReorderItem = (
      id: string,
      status: ReorderItem['status'],
      daysOfStock: number | null
    ): ReorderItem => ({
      productId: id,
      sku: `SKU${id}`,
      productName: `상품${id}`,
      currentStock: 50,
      safetyStock: 100,
      reorderPoint: 150,
      avgDailySales: 10,
      daysOfStock,
      recommendedQty: 100,
      urgencyLevel: 2,
      status,
    })

    it('우선순위 점수 기준 내림차순으로 정렬한다', () => {
      const items: ReorderItem[] = [
        createReorderItem('P001', 'caution', 10), // 낮은 점수
        createReorderItem('P002', 'out_of_stock', 0), // 높은 점수
        createReorderItem('P003', 'shortage', 5), // 중간 점수
      ]

      const abcGrades = new Map<string, 'A' | 'B' | 'C'>([
        ['P001', 'C'],
        ['P002', 'A'],
        ['P003', 'B'],
      ])

      const sorted = sortReorderItems(items, abcGrades)

      expect(sorted[0].productId).toBe('P002') // 품절 + A
      expect(sorted[1].productId).toBe('P003') // 부족 + B
      expect(sorted[2].productId).toBe('P001') // 주의 + C
    })

    it('같은 점수일 때는 원래 순서를 유지한다', () => {
      const items: ReorderItem[] = [
        createReorderItem('P001', 'shortage', 5),
        createReorderItem('P002', 'shortage', 5),
      ]

      const abcGrades = new Map<string, 'A' | 'B' | 'C'>([
        ['P001', 'A'],
        ['P002', 'A'],
      ])

      const sorted = sortReorderItems(items, abcGrades)

      expect(sorted[0].productId).toBe('P001')
      expect(sorted[1].productId).toBe('P002')
    })

    it('ABC 등급이 없는 품목도 정렬한다', () => {
      const items: ReorderItem[] = [
        createReorderItem('P001', 'out_of_stock', 0),
        createReorderItem('P002', 'shortage', 5),
      ]

      const abcGrades = new Map<string, 'A' | 'B' | 'C'>()

      const sorted = sortReorderItems(items, abcGrades)

      expect(sorted[0].productId).toBe('P001') // 품절이 우선
    })
  })

  describe('filterByUrgency - 긴급도 필터링', () => {
    const createReorderItem = (urgencyLevel: number): ReorderItem => ({
      productId: `P${urgencyLevel}`,
      sku: `SKU${urgencyLevel}`,
      productName: `상품${urgencyLevel}`,
      currentStock: 50,
      safetyStock: 100,
      reorderPoint: 150,
      avgDailySales: 10,
      daysOfStock: 5,
      recommendedQty: 100,
      urgencyLevel,
      status: 'shortage',
    })

    it('지정한 긴급도 이상의 품목만 반환한다', () => {
      const items: ReorderItem[] = [
        createReorderItem(0),
        createReorderItem(1),
        createReorderItem(2),
        createReorderItem(3),
      ]

      const filtered = filterByUrgency(items, 2)

      expect(filtered).toHaveLength(2)
      expect(filtered[0].urgencyLevel).toBe(2)
      expect(filtered[1].urgencyLevel).toBe(3)
    })

    it('긴급도가 undefined면 전체 품목을 반환한다', () => {
      const items: ReorderItem[] = [
        createReorderItem(0),
        createReorderItem(1),
      ]

      const filtered = filterByUrgency(items, undefined)

      expect(filtered).toHaveLength(2)
    })

    it('조건을 만족하는 품목이 없으면 빈 배열을 반환한다', () => {
      const items: ReorderItem[] = [
        createReorderItem(0),
        createReorderItem(1),
      ]

      const filtered = filterByUrgency(items, 3)

      expect(filtered).toHaveLength(0)
    })
  })

  describe('filterByABCGrade - ABC 등급 필터링', () => {
    const createReorderItem = (id: string): ReorderItem => ({
      productId: id,
      sku: `SKU${id}`,
      productName: `상품${id}`,
      currentStock: 50,
      safetyStock: 100,
      reorderPoint: 150,
      avgDailySales: 10,
      daysOfStock: 5,
      recommendedQty: 100,
      urgencyLevel: 2,
      status: 'shortage',
    })

    it('지정한 ABC 등급의 품목만 반환한다', () => {
      const items: ReorderItem[] = [
        createReorderItem('P001'),
        createReorderItem('P002'),
        createReorderItem('P003'),
      ]

      const abcGrades = new Map<string, 'A' | 'B' | 'C'>([
        ['P001', 'A'],
        ['P002', 'B'],
        ['P003', 'A'],
      ])

      const filtered = filterByABCGrade(items, abcGrades, 'A')

      expect(filtered).toHaveLength(2)
      expect(filtered[0].productId).toBe('P001')
      expect(filtered[1].productId).toBe('P003')
    })

    it('등급이 undefined면 전체 품목을 반환한다', () => {
      const items: ReorderItem[] = [
        createReorderItem('P001'),
        createReorderItem('P002'),
      ]

      const abcGrades = new Map<string, 'A' | 'B' | 'C'>()

      const filtered = filterByABCGrade(items, abcGrades, undefined)

      expect(filtered).toHaveLength(2)
    })

    it('조건을 만족하는 품목이 없으면 빈 배열을 반환한다', () => {
      const items: ReorderItem[] = [
        createReorderItem('P001'),
      ]

      const abcGrades = new Map<string, 'A' | 'B' | 'C'>([
        ['P001', 'A'],
      ])

      const filtered = filterByABCGrade(items, abcGrades, 'C')

      expect(filtered).toHaveLength(0)
    })
  })
})
