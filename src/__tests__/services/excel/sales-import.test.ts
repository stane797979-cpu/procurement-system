/**
 * 판매(출고) 데이터 Excel 임포트 서비스 테스트
 */

import { vi } from 'vitest'
import * as XLSX from 'xlsx'
import type { SalesRecordExcelRow } from '@/server/services/excel/types'

// Mock the database module
vi.mock('@/server/db', () => {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 'mock-sales-id' }]),
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
    unitPrice: 'unitPrice',
  },
  salesRecords: {
    id: 'id',
    organizationId: 'organizationId',
    productId: 'productId',
    date: 'date',
    quantity: 'quantity',
    unitPrice: 'unitPrice',
    totalAmount: 'totalAmount',
    channel: 'channel',
    notes: 'notes',
  },
}))

// Import after mocking
import { importSalesData } from '@/server/services/excel/sales-import'
import { db } from '@/server/db'

/**
 * 테스트용 Excel 파일 생성 헬퍼
 */
function createTestSalesExcel(rows: Record<string, unknown>[]): ArrayBuffer {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
}

describe('importSalesData', () => {
  const TEST_ORG_ID = 'test-org-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('정상 데이터 임포트 성공', async () => {
    // Mock: 제품 존재
    const productsSelectMock = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          { id: 'product-1', sku: 'SALES-001', unitPrice: 10000 },
          { id: 'product-2', sku: 'SALES-002', unitPrice: 20000 },
        ]),
      }),
    }

    // Mock: 중복 판매 데이터 없음
    const salesSelectMock = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]), // 중복 없음
        }),
      }),
    }

    let selectCallCount = 0
    ;(db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      selectCallCount++
      // 첫 번째 호출: products select
      if (selectCallCount === 1) {
        return productsSelectMock
      }
      // 두 번째 호출 이후: salesRecords select
      return salesSelectMock
    })

    const testData = [
      { SKU: 'SALES-001', 날짜: '2026-01-15', 수량: 10, 단가: 10000 },
      { SKU: 'SALES-002', 날짜: '2026-01-16', 수량: 5, 단가: 20000 },
    ]

    const buffer = createTestSalesExcel(testData)

    const result = await importSalesData({
      organizationId: TEST_ORG_ID,
      buffer,
    })

    expect(result.success).toBe(true)
    expect(result.successCount).toBe(2)
    expect(result.errorCount).toBe(0)
    expect(result.data).toHaveLength(2)
    expect(result.data[0].sku).toBe('SALES-001')
    expect(result.data[0].date).toBe('2026-01-15')
    expect(result.data[0].quantity).toBe(10)
    expect(db.insert).toHaveBeenCalled()
  })

  it('SKU 누락 시 오류', async () => {
    // Mock: products select는 실행되지만 결과는 빈 배열
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    })

    const testData = [
      { 날짜: '2026-01-15', 수량: 10 },
    ]

    const buffer = createTestSalesExcel(testData)

    const result = await importSalesData({
      organizationId: TEST_ORG_ID,
      buffer,
    })

    expect(result.success).toBe(false)
    expect(result.successCount).toBe(0)
    expect(result.errorCount).toBe(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].row).toBe(2)
    expect(result.errors[0].column).toBe('SKU')
    expect(result.errors[0].message).toContain('SKU가 비어있습니다')
  })

  it('날짜 형식 오류 시 에러 메시지', async () => {
    // Mock: products select
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    })

    const testData = [
      { SKU: 'SALES-001', 날짜: 'invalid-date', 수량: 10 },
    ]

    const buffer = createTestSalesExcel(testData)

    const result = await importSalesData({
      organizationId: TEST_ORG_ID,
      buffer,
    })

    expect(result.success).toBe(false)
    expect(result.successCount).toBe(0)
    expect(result.errorCount).toBe(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].column).toBe('날짜')
    expect(result.errors[0].message).toContain('날짜 형식이 올바르지 않습니다')
  })

  it('수량 음수 시 오류', async () => {
    // Mock: products select
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    })

    const testData = [
      { SKU: 'SALES-001', 날짜: '2026-01-15', 수량: -5 },
    ]

    const buffer = createTestSalesExcel(testData)

    const result = await importSalesData({
      organizationId: TEST_ORG_ID,
      buffer,
    })

    expect(result.success).toBe(false)
    expect(result.successCount).toBe(0)
    expect(result.errorCount).toBe(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].column).toBe('수량')
    expect(result.errors[0].message).toContain('수량은 0 이상의 숫자여야 합니다')
  })

  it('존재하지 않는 SKU 시 "존재하지 않는 SKU입니다" 오류', async () => {
    // Mock: 제품 없음
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    })

    const testData = [
      { SKU: 'NONEXIST-001', 날짜: '2026-01-15', 수량: 10 },
    ]

    const buffer = createTestSalesExcel(testData)

    const result = await importSalesData({
      organizationId: TEST_ORG_ID,
      buffer,
    })

    expect(result.success).toBe(false)
    expect(result.successCount).toBe(0)
    expect(result.errorCount).toBe(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].column).toBe('SKU')
    expect(result.errors[0].value).toBe('NONEXIST-001')
    expect(result.errors[0].message).toContain('존재하지 않는 SKU입니다')
  })

  it('한국어 컬럼명 인식 ("품목코드", "날짜", "수량")', async () => {
    // Mock: 제품 존재
    const productsSelectMock = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          { id: 'product-1', sku: 'KOR-001', unitPrice: 15000 },
        ]),
      }),
    }

    // Mock: 중복 판매 데이터 없음
    const salesSelectMock = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }

    let selectCallCount = 0
    ;(db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      selectCallCount++
      if (selectCallCount === 1) {
        return productsSelectMock
      }
      return salesSelectMock
    })

    const testData = [
      { 품목코드: 'KOR-001', 날짜: '2026-01-15', 수량: 20 },
    ]

    const buffer = createTestSalesExcel(testData)

    const result = await importSalesData({
      organizationId: TEST_ORG_ID,
      buffer,
    })

    expect(result.success).toBe(true)
    expect(result.successCount).toBe(1)
    expect(result.data[0].sku).toBe('KOR-001')
    expect(result.data[0].date).toBe('2026-01-15')
    expect(result.data[0].quantity).toBe(20)
  })

  it('중복 판매 데이터 - skip 모드', async () => {
    // Mock: 제품 존재
    const productsSelectMock = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          { id: 'product-1', sku: 'DUP-001', unitPrice: 10000 },
        ]),
      }),
    }

    // Mock: 중복 판매 데이터 존재
    const salesSelectMock = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'existing-sales-id' }]),
        }),
      }),
    }

    let selectCallCount = 0
    ;(db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      selectCallCount++
      // 첫 번째 호출: products select
      if (selectCallCount === 1) {
        return productsSelectMock
      }
      // 두 번째 호출 이후: salesRecords select
      return salesSelectMock
    })

    const testData = [
      { SKU: 'DUP-001', 날짜: '2026-01-15', 수량: 10 },
    ]

    const buffer = createTestSalesExcel(testData)

    const result = await importSalesData({
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

  it('중복 판매 데이터 - update 모드', async () => {
    // Mock: 제품 존재
    const productsSelectMock = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          { id: 'product-1', sku: 'DUP-001', unitPrice: 10000 },
        ]),
      }),
    }

    // Mock: 중복 판매 데이터 존재
    const salesSelectMock = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'existing-sales-id' }]),
        }),
      }),
    }

    let selectCallCount = 0
    ;(db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      selectCallCount++
      if (selectCallCount === 1) {
        return productsSelectMock
      }
      return salesSelectMock
    })

    const testData = [
      { SKU: 'DUP-001', 날짜: '2026-01-15', 수량: 20 },
    ]

    const buffer = createTestSalesExcel(testData)

    const result = await importSalesData({
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

  it('중복 판매 데이터 - error 모드', async () => {
    // Mock: 제품 존재
    const productsSelectMock = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          { id: 'product-1', sku: 'DUP-001', unitPrice: 10000 },
        ]),
      }),
    }

    // Mock: 중복 판매 데이터 존재
    const salesSelectMock = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'existing-sales-id' }]),
        }),
      }),
    }

    let selectCallCount = 0
    ;(db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      selectCallCount++
      if (selectCallCount === 1) {
        return productsSelectMock
      }
      return salesSelectMock
    })

    const testData = [
      { SKU: 'DUP-001', 날짜: '2026-01-15', 수량: 10 },
    ]

    const buffer = createTestSalesExcel(testData)

    const result = await importSalesData({
      organizationId: TEST_ORG_ID,
      buffer,
      duplicateHandling: 'error',
    })

    expect(result.success).toBe(false)
    expect(result.successCount).toBe(0)
    expect(result.errorCount).toBe(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain('중복 데이터')
  })

  it('단가 미지정 시 제품 기본 단가 적용', async () => {
    // Mock: 제품 존재 (기본 단가 15000)
    const productsSelectMock = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          { id: 'product-1', sku: 'PRICE-001', unitPrice: 15000 },
        ]),
      }),
    }

    // Mock: 중복 판매 데이터 없음
    const salesSelectMock = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }

    let selectCallCount = 0
    ;(db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      selectCallCount++
      if (selectCallCount === 1) {
        return productsSelectMock
      }
      return salesSelectMock
    })

    const testData = [
      { SKU: 'PRICE-001', 날짜: '2026-01-15', 수량: 10 }, // 단가 없음
    ]

    const buffer = createTestSalesExcel(testData)

    const result = await importSalesData({
      organizationId: TEST_ORG_ID,
      buffer,
    })

    expect(result.success).toBe(true)
    expect(result.successCount).toBe(1)
    expect(result.data[0].unitPrice).toBeUndefined() // Excel에는 없음

    // DB insert 호출 시 제품 단가(15000)가 적용되어야 함
    expect(db.insert).toHaveBeenCalled()
    const insertCall = (db.insert as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(insertCall).toBeDefined()
  })

  it('빈 Excel 파일 시 "데이터가 없습니다" 오류', async () => {
    const testData: Record<string, unknown>[] = []

    const buffer = createTestSalesExcel(testData)

    const result = await importSalesData({
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
})
