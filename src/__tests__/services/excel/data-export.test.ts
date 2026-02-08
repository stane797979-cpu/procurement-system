
import * as XLSX from 'xlsx'
import { generateProductsExcel, generateSalesExcel } from '@/server/services/excel/data-export'

describe('데이터 익스포트', () => {
  describe('generateProductsExcel - 제품 목록 Excel', () => {
    it('"제품목록" 시트가 생성된다', () => {
      const products = [
        {
          sku: 'TEST-001',
          name: '테스트 제품',
          category: '전자기기',
          unit: 'EA',
          unitPrice: 10000,
          costPrice: 7000,
          safetyStock: 50,
          reorderPoint: 100,
          leadTime: 7,
          moq: 10,
          abcGrade: 'A',
          xyzGrade: 'X',
          isActive: new Date(),
        },
      ]

      const buffer = generateProductsExcel(products)
      const wb = XLSX.read(buffer, { type: 'array' })

      expect(wb.SheetNames).toContain('제품목록')
    })

    it('13개 컬럼 헤더가 포함된다', () => {
      const products = [
        {
          sku: 'TEST-001',
          name: '테스트 제품',
          category: '전자기기',
          unit: 'EA',
          unitPrice: 10000,
          costPrice: 7000,
          safetyStock: 50,
          reorderPoint: 100,
          leadTime: 7,
          moq: 10,
          abcGrade: 'A',
          xyzGrade: 'X',
          isActive: new Date(),
        },
      ]

      const buffer = generateProductsExcel(products)
      const wb = XLSX.read(buffer, { type: 'array' })
      const ws = wb.Sheets['제품목록']
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

      expect(data.length).toBe(1)

      const row = data[0]
      expect(row).toHaveProperty('SKU')
      expect(row).toHaveProperty('제품명')
      expect(row).toHaveProperty('카테고리')
      expect(row).toHaveProperty('단위')
      expect(row).toHaveProperty('판매단가')
      expect(row).toHaveProperty('원가')
      expect(row).toHaveProperty('안전재고')
      expect(row).toHaveProperty('발주점')
      expect(row).toHaveProperty('리드타임')
      expect(row).toHaveProperty('MOQ')
      expect(row).toHaveProperty('ABC등급')
      expect(row).toHaveProperty('XYZ등급')
      expect(row).toHaveProperty('상태')
    })

    it('null 필드의 기본값이 올바르게 처리된다', () => {
      const products = [
        {
          sku: 'TEST-001',
          name: '테스트 제품',
          category: null,
          unit: null,
          unitPrice: null,
          costPrice: null,
          safetyStock: null,
          reorderPoint: null,
          leadTime: null,
          moq: null,
          abcGrade: null,
          xyzGrade: null,
          isActive: null,
        },
      ]

      const buffer = generateProductsExcel(products)
      const wb = XLSX.read(buffer, { type: 'array' })
      const ws = wb.Sheets['제품목록']
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

      const row = data[0]
      expect(row['카테고리']).toBe('')
      expect(row['단위']).toBe('EA')
      expect(row['판매단가']).toBe(0)
      expect(row['원가']).toBe(0)
      expect(row['안전재고']).toBe(0)
      expect(row['발주점']).toBe(0)
      expect(row['리드타임']).toBe(7)
      expect(row['MOQ']).toBe(1)
      expect(row['ABC등급']).toBe('-')
      expect(row['XYZ등급']).toBe('-')
      expect(row['상태']).toBe('비활성')
    })

    it('isActive 필드가 "활성"/"비활성"으로 변환된다', () => {
      const productsActive = [
        {
          sku: 'TEST-001',
          name: '활성 제품',
          category: null,
          unit: null,
          unitPrice: null,
          costPrice: null,
          safetyStock: null,
          reorderPoint: null,
          leadTime: null,
          moq: null,
          abcGrade: null,
          xyzGrade: null,
          isActive: new Date(),
        },
      ]

      const productsInactive = [
        {
          sku: 'TEST-002',
          name: '비활성 제품',
          category: null,
          unit: null,
          unitPrice: null,
          costPrice: null,
          safetyStock: null,
          reorderPoint: null,
          leadTime: null,
          moq: null,
          abcGrade: null,
          xyzGrade: null,
          isActive: null,
        },
      ]

      const bufferActive = generateProductsExcel(productsActive)
      const wbActive = XLSX.read(bufferActive, { type: 'array' })
      const wsActive = wbActive.Sheets['제품목록']
      const dataActive = XLSX.utils.sheet_to_json<Record<string, unknown>>(wsActive)

      const bufferInactive = generateProductsExcel(productsInactive)
      const wbInactive = XLSX.read(bufferInactive, { type: 'array' })
      const wsInactive = wbInactive.Sheets['제품목록']
      const dataInactive = XLSX.utils.sheet_to_json<Record<string, unknown>>(wsInactive)

      expect(dataActive[0]['상태']).toBe('활성')
      expect(dataInactive[0]['상태']).toBe('비활성')
    })

    it('복수 제품 데이터를 올바르게 익스포트한다', () => {
      const products = [
        {
          sku: 'TEST-001',
          name: '제품 1',
          category: 'A',
          unit: 'EA',
          unitPrice: 1000,
          costPrice: 700,
          safetyStock: 10,
          reorderPoint: 20,
          leadTime: 5,
          moq: 5,
          abcGrade: 'A',
          xyzGrade: 'X',
          isActive: new Date(),
        },
        {
          sku: 'TEST-002',
          name: '제품 2',
          category: 'B',
          unit: 'BOX',
          unitPrice: 2000,
          costPrice: 1500,
          safetyStock: 20,
          reorderPoint: 40,
          leadTime: 10,
          moq: 10,
          abcGrade: 'B',
          xyzGrade: 'Y',
          isActive: new Date(),
        },
      ]

      const buffer = generateProductsExcel(products)
      const wb = XLSX.read(buffer, { type: 'array' })
      const ws = wb.Sheets['제품목록']
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

      expect(data.length).toBe(2)
      expect(data[0]['SKU']).toBe('TEST-001')
      expect(data[1]['SKU']).toBe('TEST-002')
    })
  })

  describe('generateSalesExcel - 판매 데이터 Excel', () => {
    it('"판매데이터" 시트가 생성된다', () => {
      const sales = [
        {
          date: '2026-01-15',
          sku: 'TEST-001',
          productName: '테스트 제품',
          quantity: 100,
          unitPrice: 10000,
          totalAmount: 1000000,
          channel: '온라인',
          notes: '테스트',
        },
      ]

      const buffer = generateSalesExcel(sales)
      const wb = XLSX.read(buffer, { type: 'array' })

      expect(wb.SheetNames).toContain('판매데이터')
    })

    it('8개 컬럼 헤더가 포함된다', () => {
      const sales = [
        {
          date: '2026-01-15',
          sku: 'TEST-001',
          productName: '테스트 제품',
          quantity: 100,
          unitPrice: 10000,
          totalAmount: 1000000,
          channel: '온라인',
          notes: '테스트',
        },
      ]

      const buffer = generateSalesExcel(sales)
      const wb = XLSX.read(buffer, { type: 'array' })
      const ws = wb.Sheets['판매데이터']
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

      expect(data.length).toBe(1)

      const row = data[0]
      expect(row).toHaveProperty('날짜')
      expect(row).toHaveProperty('SKU')
      expect(row).toHaveProperty('제품명')
      expect(row).toHaveProperty('판매수량')
      expect(row).toHaveProperty('판매단가')
      expect(row).toHaveProperty('판매금액')
      expect(row).toHaveProperty('채널')
      expect(row).toHaveProperty('비고')
    })

    it('null 필드의 기본값이 올바르게 처리된다', () => {
      const sales = [
        {
          date: '2026-01-15',
          sku: 'TEST-001',
          productName: '테스트 제품',
          quantity: 100,
          unitPrice: null,
          totalAmount: null,
          channel: null,
          notes: null,
        },
      ]

      const buffer = generateSalesExcel(sales)
      const wb = XLSX.read(buffer, { type: 'array' })
      const ws = wb.Sheets['판매데이터']
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

      const row = data[0]
      expect(row['판매단가']).toBe(0)
      expect(row['판매금액']).toBe(0)
      expect(row['채널']).toBe('')
      expect(row['비고']).toBe('')
    })

    it('복수 판매 데이터를 올바르게 익스포트한다', () => {
      const sales = [
        {
          date: '2026-01-15',
          sku: 'TEST-001',
          productName: '제품 1',
          quantity: 50,
          unitPrice: 1000,
          totalAmount: 50000,
          channel: '온라인',
          notes: 'A',
        },
        {
          date: '2026-01-16',
          sku: 'TEST-002',
          productName: '제품 2',
          quantity: 30,
          unitPrice: 2000,
          totalAmount: 60000,
          channel: '오프라인',
          notes: 'B',
        },
      ]

      const buffer = generateSalesExcel(sales)
      const wb = XLSX.read(buffer, { type: 'array' })
      const ws = wb.Sheets['판매데이터']
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

      expect(data.length).toBe(2)
      expect(data[0]['SKU']).toBe('TEST-001')
      expect(data[1]['SKU']).toBe('TEST-002')
    })
  })
})
