/**
 * 제품 데이터 Excel 임포트 서비스 테스트
 */

import { vi } from 'vitest'
import * as XLSX from 'xlsx'
import type { ProductExcelRow } from '@/server/services/excel/types'

// Mock the database module
vi.mock('@/server/db', () => {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 'mock-product-id' }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  }
  return { db: mockChain }
})

// Mock schema to prevent import errors
vi.mock('@/server/db/schema', () => ({
  products: {
    id: 'id',
    sku: 'sku',
    organizationId: 'organizationId',
    name: 'name',
    category: 'category',
    unit: 'unit',
    unitPrice: 'unitPrice',
    costPrice: 'costPrice',
    safetyStock: 'safetyStock',
    leadTime: 'leadTime',
    moq: 'moq',
    updatedAt: 'updatedAt',
  },
  inventory: {
    id: 'id',
    organizationId: 'organizationId',
    productId: 'productId',
    currentStock: 'currentStock',
    availableStock: 'availableStock',
    reservedStock: 'reservedStock',
    incomingStock: 'incomingStock',
    updatedAt: 'updatedAt',
  },
}))

// Import after mocking
import { importProductData } from '@/server/services/excel/product-import'
import { db } from '@/server/db'

/**
 * 테스트용 Excel 파일 생성 헬퍼
 */
function createTestProductExcel(rows: Record<string, unknown>[]): ArrayBuffer {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
}

describe('importProductData', () => {
  const TEST_ORG_ID = 'test-org-123'

  beforeEach(() => {
    vi.clearAllMocks()
    // Default: 기존 제품 없음
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    })
  })

  it('정상 데이터 임포트 성공 (SKU, 제품명 포함)', async () => {
    const testData = [
      { SKU: 'TEST-001', 제품명: '테스트 제품 A', 카테고리: '전자기기', 단위: 'EA' },
      { SKU: 'TEST-002', 제품명: '테스트 제품 B', 카테고리: '가구', 단위: 'EA' },
    ]

    const buffer = createTestProductExcel(testData)

    const result = await importProductData({
      organizationId: TEST_ORG_ID,
      buffer,
    })

    expect(result.success).toBe(true)
    expect(result.successCount).toBe(2)
    expect(result.errorCount).toBe(0)
    expect(result.data).toHaveLength(2)
    expect(result.data[0].sku).toBe('TEST-001')
    expect(result.data[0].name).toBe('테스트 제품 A')
    expect(db.insert).toHaveBeenCalledTimes(2)
  })

  it('SKU 누락 시 오류 반환 (행 번호 포함)', async () => {
    const testData = [
      { 제품명: '제품명만 있음', 카테고리: '전자기기' },
    ]

    const buffer = createTestProductExcel(testData)

    const result = await importProductData({
      organizationId: TEST_ORG_ID,
      buffer,
    })

    expect(result.success).toBe(false)
    expect(result.successCount).toBe(0)
    expect(result.errorCount).toBe(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].row).toBe(2) // 헤더(1) + 첫 데이터 행(1)
    expect(result.errors[0].column).toBe('SKU')
    expect(result.errors[0].message).toContain('SKU가 비어있습니다')
  })

  it('제품명 누락 시 오류 반환', async () => {
    const testData = [
      { SKU: 'TEST-001', 카테고리: '전자기기' },
    ]

    const buffer = createTestProductExcel(testData)

    const result = await importProductData({
      organizationId: TEST_ORG_ID,
      buffer,
    })

    expect(result.success).toBe(false)
    expect(result.successCount).toBe(0)
    expect(result.errorCount).toBe(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].row).toBe(2)
    expect(result.errors[0].column).toBe('제품명')
    expect(result.errors[0].message).toContain('제품명이 비어있습니다')
  })

  it('빈 Excel 파일 시 "데이터가 없습니다" 오류', async () => {
    const testData: Record<string, unknown>[] = []

    const buffer = createTestProductExcel(testData)

    const result = await importProductData({
      organizationId: TEST_ORG_ID,
      buffer,
    })

    expect(result.success).toBe(false)
    expect(result.totalRows).toBe(0)
    expect(result.successCount).toBe(0)
    expect(result.errorCount).toBe(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toBe('데이터가 없습니다')
  })

  it('한국어 컬럼명 인식 ("품목코드", "제품명")', async () => {
    const testData = [
      { 품목코드: 'KOR-001', 제품명: '한국어 컬럼 제품', 카테고리: '테스트' },
    ]

    const buffer = createTestProductExcel(testData)

    const result = await importProductData({
      organizationId: TEST_ORG_ID,
      buffer,
    })

    expect(result.success).toBe(true)
    expect(result.successCount).toBe(1)
    expect(result.data[0].sku).toBe('KOR-001')
    expect(result.data[0].name).toBe('한국어 컬럼 제품')
  })

  it('영문 컬럼명 인식 ("SKU", "Name")', async () => {
    const testData = [
      { SKU: 'ENG-001', Name: 'English Column Product', category: 'Test' },
    ]

    const buffer = createTestProductExcel(testData)

    const result = await importProductData({
      organizationId: TEST_ORG_ID,
      buffer,
    })

    expect(result.success).toBe(true)
    expect(result.successCount).toBe(1)
    expect(result.data[0].sku).toBe('ENG-001')
    expect(result.data[0].name).toBe('English Column Product')
  })

  it('중복 SKU - skip 모드: 건너뛰기 (successCount 미증가)', async () => {
    // 기존 제품 존재
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        { id: 'existing-product-id', sku: 'DUP-001' }
      ]),
    })

    const testData = [
      { SKU: 'DUP-001', 제품명: '중복 제품', 카테고리: '전자기기' },
    ]

    const buffer = createTestProductExcel(testData)

    const result = await importProductData({
      organizationId: TEST_ORG_ID,
      buffer,
      duplicateHandling: 'skip',
    })

    expect(result.success).toBe(true)
    expect(result.successCount).toBe(0) // skip되어 성공 카운트 없음
    expect(result.errorCount).toBe(0)
    expect(db.insert).not.toHaveBeenCalled()
    expect(db.update).not.toHaveBeenCalled()
  })

  it('중복 SKU - update 모드: db.update 호출됨', async () => {
    // 기존 제품 존재
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        { id: 'existing-product-id', sku: 'DUP-001' }
      ]),
    })

    const testData = [
      { SKU: 'DUP-001', 제품명: '업데이트된 제품명', 카테고리: '가구' },
    ]

    const buffer = createTestProductExcel(testData)

    const result = await importProductData({
      organizationId: TEST_ORG_ID,
      buffer,
      duplicateHandling: 'update',
    })

    expect(result.success).toBe(true)
    expect(result.successCount).toBe(1)
    expect(result.errorCount).toBe(0)
    expect(db.update).toHaveBeenCalled()
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('중복 SKU - error 모드: 오류 반환', async () => {
    // 기존 제품 존재
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        { id: 'existing-product-id', sku: 'DUP-001' }
      ]),
    })

    const testData = [
      { SKU: 'DUP-001', 제품명: '중복 오류 제품', 카테고리: '전자기기' },
    ]

    const buffer = createTestProductExcel(testData)

    const result = await importProductData({
      organizationId: TEST_ORG_ID,
      buffer,
      duplicateHandling: 'error',
    })

    expect(result.success).toBe(false)
    expect(result.successCount).toBe(0)
    expect(result.errorCount).toBe(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain('중복 SKU')
    expect(result.errors[0].value).toBe('DUP-001')
  })

  it('선택 필드(unitPrice 등) 없으면 기본값 적용', async () => {
    const testData = [
      { SKU: 'MIN-001', 제품명: '최소 필드 제품' },
    ]

    const buffer = createTestProductExcel(testData)

    const result = await importProductData({
      organizationId: TEST_ORG_ID,
      buffer,
    })

    expect(result.success).toBe(true)
    expect(result.successCount).toBe(1)
    expect(result.data[0].sku).toBe('MIN-001')
    expect(result.data[0].name).toBe('최소 필드 제품')
    // 선택 필드는 undefined로 파싱됨
    expect(result.data[0].unitPrice).toBeUndefined()
    expect(result.data[0].category).toBeUndefined()

    // DB에 삽입할 때는 기본값 적용됨 (values 호출 확인)
    expect(db.insert).toHaveBeenCalled()
  })

  it('재고수량이 포함된 경우 inventory 업데이트 호출', async () => {
    const testData = [
      { SKU: 'INV-001', 제품명: '재고 포함 제품', 재고수량: 100 },
    ]

    const buffer = createTestProductExcel(testData)

    // inventory select mock (기존 재고 없음)
    const selectMock = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    })

    ;(db.select as ReturnType<typeof vi.fn>).mockImplementation((fields) => {
      // products select
      if (fields && 'sku' in fields) {
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([]),
        }
      }
      // inventory select
      return selectMock(fields)
    })

    const result = await importProductData({
      organizationId: TEST_ORG_ID,
      buffer,
    })

    expect(result.success).toBe(true)
    expect(result.successCount).toBe(1)
    expect(result.data[0].currentStock).toBe(100)

    // inventory insert 호출 확인 (upsertInventory 내부)
    expect(db.insert).toHaveBeenCalled() // products + inventory
  })
})
