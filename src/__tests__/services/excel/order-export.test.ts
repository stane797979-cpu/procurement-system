
import * as XLSX from 'xlsx'
import {
  generatePurchaseOrderExcel,
  generateMultiplePurchaseOrdersExcel,
  type PurchaseOrderWithDetails,
} from '@/server/services/excel/order-export'

describe('발주서 Excel 익스포트', () => {
  describe('generatePurchaseOrderExcel - 단일 발주서', () => {
    it('Buffer를 반환한다', () => {
      const mockOrder: PurchaseOrderWithDetails = {
        id: '1',
        organizationId: 'org-1',
        supplierId: 'supplier-1',
        orderNumber: 'PO-2026-001',
        orderDate: '2026-01-15',
        expectedDate: '2026-01-22',
        status: 'pending',
        totalAmount: 100000,
        notes: '긴급 발주',
        createdAt: new Date(),
        updatedAt: new Date(),
        supplier: {
          id: 'supplier-1',
          name: '테스트 공급자',
          contactPhone: '010-1234-5678',
        },
        items: [
          {
            id: 'item-1',
            orderId: '1',
            productId: 'prod-1',
            quantity: 10,
            unitPrice: 5000,
            totalPrice: 50000,
            notes: '우선 배송',
            createdAt: new Date(),
            product: {
              sku: 'TEST-001',
              name: '테스트 제품',
              unit: 'EA',
            },
          },
        ],
      }

      const buffer = generatePurchaseOrderExcel(mockOrder)

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
    })

    it('헤더 정보가 포함된다 (발주번호, 발주일, 상태)', () => {
      const mockOrder: PurchaseOrderWithDetails = {
        id: '1',
        organizationId: 'org-1',
        supplierId: 'supplier-1',
        orderNumber: 'PO-2026-001',
        orderDate: '2026-01-15',
        expectedDate: '2026-01-22',
        status: 'pending',
        totalAmount: 100000,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        supplier: {
          id: 'supplier-1',
          name: '테스트 공급자',
          contactPhone: '010-1234-5678',
        },
        items: [
          {
            id: 'item-1',
            orderId: '1',
            productId: 'prod-1',
            quantity: 10,
            unitPrice: 5000,
            totalPrice: 50000,
            notes: null,
            createdAt: new Date(),
            product: {
              sku: 'TEST-001',
              name: '테스트 제품',
              unit: 'EA',
            },
          },
        ],
      }

      const buffer = generatePurchaseOrderExcel(mockOrder)
      const wb = XLSX.read(buffer, { type: 'buffer' })
      const ws = wb.Sheets['발주서']
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][]

      // 헤더 데이터 검증
      const headerRows = data.slice(0, 10)
      const headerText = headerRows.map((row) => (row as unknown[]).join(' ')).join(' ')

      expect(headerText).toContain('발주번호')
      expect(headerText).toContain('PO-2026-001')
      expect(headerText).toContain('발주일')
      expect(headerText).toContain('2026-01-15')
      expect(headerText).toContain('검토대기')
    })

    it('항목 데이터가 포함된다', () => {
      const mockOrder: PurchaseOrderWithDetails = {
        id: '1',
        organizationId: 'org-1',
        supplierId: 'supplier-1',
        orderNumber: 'PO-2026-001',
        orderDate: '2026-01-15',
        expectedDate: '2026-01-22',
        status: 'ordered',
        totalAmount: 150000,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        supplier: {
          id: 'supplier-1',
          name: '테스트 공급자',
          contactPhone: '010-1234-5678',
        },
        items: [
          {
            id: 'item-1',
            orderId: '1',
            productId: 'prod-1',
            quantity: 10,
            unitPrice: 5000,
            totalPrice: 50000,
            notes: null,
            createdAt: new Date(),
            product: {
              sku: 'TEST-001',
              name: '테스트 제품 1',
              unit: 'EA',
            },
          },
          {
            id: 'item-2',
            orderId: '1',
            productId: 'prod-2',
            quantity: 5,
            unitPrice: 20000,
            totalPrice: 100000,
            notes: null,
            createdAt: new Date(),
            product: {
              sku: 'TEST-002',
              name: '테스트 제품 2',
              unit: 'BOX',
            },
          },
        ],
      }

      const buffer = generatePurchaseOrderExcel(mockOrder)
      const wb = XLSX.read(buffer, { type: 'buffer' })
      const ws = wb.Sheets['발주서']
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][]

      // 테이블 데이터가 포함되어 있는지 확인
      const allText = data.map((row) => (row as unknown[]).join(' ')).join(' ')

      expect(allText).toContain('TEST-001')
      expect(allText).toContain('테스트 제품 1')
      expect(allText).toContain('TEST-002')
      expect(allText).toContain('테스트 제품 2')
    })

    it('비고가 포함된다 (notes가 있는 경우)', () => {
      const mockOrder: PurchaseOrderWithDetails = {
        id: '1',
        organizationId: 'org-1',
        supplierId: 'supplier-1',
        orderNumber: 'PO-2026-001',
        orderDate: '2026-01-15',
        expectedDate: '2026-01-22',
        status: 'pending',
        totalAmount: 100000,
        notes: '긴급 발주 건입니다',
        createdAt: new Date(),
        updatedAt: new Date(),
        supplier: {
          id: 'supplier-1',
          name: '테스트 공급자',
          contactPhone: null,
        },
        items: [
          {
            id: 'item-1',
            orderId: '1',
            productId: 'prod-1',
            quantity: 10,
            unitPrice: 5000,
            totalPrice: 50000,
            notes: null,
            createdAt: new Date(),
            product: {
              sku: 'TEST-001',
              name: '테스트 제품',
              unit: 'EA',
            },
          },
        ],
      }

      const buffer = generatePurchaseOrderExcel(mockOrder)
      const wb = XLSX.read(buffer, { type: 'buffer' })
      const ws = wb.Sheets['발주서']
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][]

      const allText = data.map((row) => (row as unknown[]).join(' ')).join(' ')

      expect(allText).toContain('비고')
      expect(allText).toContain('긴급 발주 건입니다')
    })

    it('공급자 정보가 없는 경우 "-"로 표시된다', () => {
      const mockOrder: PurchaseOrderWithDetails = {
        id: '1',
        organizationId: 'org-1',
        supplierId: null,
        orderNumber: 'PO-2026-001',
        orderDate: '2026-01-15',
        expectedDate: null,
        status: 'draft',
        totalAmount: 50000,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        supplier: null,
        items: [
          {
            id: 'item-1',
            orderId: '1',
            productId: 'prod-1',
            quantity: 10,
            unitPrice: 5000,
            totalPrice: 50000,
            notes: null,
            createdAt: new Date(),
            product: {
              sku: 'TEST-001',
              name: '테스트 제품',
              unit: 'EA',
            },
          },
        ],
      }

      const buffer = generatePurchaseOrderExcel(mockOrder)
      const wb = XLSX.read(buffer, { type: 'buffer' })
      const ws = wb.Sheets['발주서']
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][]

      // 공급자명 행 찾기
      const supplierRow = data.find((row) => (row as unknown[])[0] === '공급자명')
      expect(supplierRow).toBeDefined()
      expect((supplierRow as unknown[])[1]).toBe('-')
    })
  })

  describe('generateMultiplePurchaseOrdersExcel - 복수 발주서', () => {
    it('발주서 수만큼 시트가 생성된다', () => {
      const mockOrders: PurchaseOrderWithDetails[] = [
        {
          id: '1',
          organizationId: 'org-1',
          supplierId: 'supplier-1',
          orderNumber: 'PO-2026-001',
          orderDate: '2026-01-15',
          expectedDate: '2026-01-22',
          status: 'pending',
          totalAmount: 100000,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          supplier: {
            id: 'supplier-1',
            name: '공급자 A',
            contactPhone: '010-1234-5678',
          },
          items: [
            {
              id: 'item-1',
              orderId: '1',
              productId: 'prod-1',
              quantity: 10,
              unitPrice: 5000,
              totalPrice: 50000,
              notes: null,
              createdAt: new Date(),
              product: {
                sku: 'TEST-001',
                name: '제품 1',
                unit: 'EA',
              },
            },
          ],
        },
        {
          id: '2',
          organizationId: 'org-1',
          supplierId: 'supplier-2',
          orderNumber: 'PO-2026-002',
          orderDate: '2026-01-16',
          expectedDate: '2026-01-23',
          status: 'approved',
          totalAmount: 200000,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          supplier: {
            id: 'supplier-2',
            name: '공급자 B',
            contactPhone: '010-9876-5432',
          },
          items: [
            {
              id: 'item-2',
              orderId: '2',
              productId: 'prod-2',
              quantity: 20,
              unitPrice: 10000,
              totalPrice: 200000,
              notes: null,
              createdAt: new Date(),
              product: {
                sku: 'TEST-002',
                name: '제품 2',
                unit: 'BOX',
              },
            },
          ],
        },
      ]

      const buffer = generateMultiplePurchaseOrdersExcel(mockOrders)
      const wb = XLSX.read(buffer, { type: 'buffer' })

      expect(wb.SheetNames.length).toBe(2)
    })

    it('시트명이 발주번호로 설정된다', () => {
      const mockOrders: PurchaseOrderWithDetails[] = [
        {
          id: '1',
          organizationId: 'org-1',
          supplierId: 'supplier-1',
          orderNumber: 'PO-2026-001',
          orderDate: '2026-01-15',
          expectedDate: '2026-01-22',
          status: 'pending',
          totalAmount: 100000,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          supplier: {
            id: 'supplier-1',
            name: '공급자 A',
            contactPhone: '010-1234-5678',
          },
          items: [
            {
              id: 'item-1',
              orderId: '1',
              productId: 'prod-1',
              quantity: 10,
              unitPrice: 5000,
              totalPrice: 50000,
              notes: null,
              createdAt: new Date(),
              product: {
                sku: 'TEST-001',
                name: '제품 1',
                unit: 'EA',
              },
            },
          ],
        },
        {
          id: '2',
          organizationId: 'org-1',
          supplierId: 'supplier-2',
          orderNumber: 'PO-2026-002',
          orderDate: '2026-01-16',
          expectedDate: '2026-01-23',
          status: 'approved',
          totalAmount: 200000,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          supplier: {
            id: 'supplier-2',
            name: '공급자 B',
            contactPhone: '010-9876-5432',
          },
          items: [
            {
              id: 'item-2',
              orderId: '2',
              productId: 'prod-2',
              quantity: 20,
              unitPrice: 10000,
              totalPrice: 200000,
              notes: null,
              createdAt: new Date(),
              product: {
                sku: 'TEST-002',
                name: '제품 2',
                unit: 'BOX',
              },
            },
          ],
        },
      ]

      const buffer = generateMultiplePurchaseOrdersExcel(mockOrders)
      const wb = XLSX.read(buffer, { type: 'buffer' })

      expect(wb.SheetNames).toContain('PO-2026-001')
      expect(wb.SheetNames).toContain('PO-2026-002')
    })

    it('각 시트에 해당 발주서 데이터가 포함된다', () => {
      const mockOrders: PurchaseOrderWithDetails[] = [
        {
          id: '1',
          organizationId: 'org-1',
          supplierId: 'supplier-1',
          orderNumber: 'PO-2026-001',
          orderDate: '2026-01-15',
          expectedDate: '2026-01-22',
          status: 'pending',
          totalAmount: 100000,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          supplier: {
            id: 'supplier-1',
            name: '공급자 A',
            contactPhone: '010-1234-5678',
          },
          items: [
            {
              id: 'item-1',
              orderId: '1',
              productId: 'prod-1',
              quantity: 10,
              unitPrice: 5000,
              totalPrice: 50000,
              notes: null,
              createdAt: new Date(),
              product: {
                sku: 'TEST-001',
                name: '제품 1',
                unit: 'EA',
              },
            },
          ],
        },
        {
          id: '2',
          organizationId: 'org-1',
          supplierId: 'supplier-2',
          orderNumber: 'PO-2026-002',
          orderDate: '2026-01-16',
          expectedDate: '2026-01-23',
          status: 'approved',
          totalAmount: 200000,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          supplier: {
            id: 'supplier-2',
            name: '공급자 B',
            contactPhone: '010-9876-5432',
          },
          items: [
            {
              id: 'item-2',
              orderId: '2',
              productId: 'prod-2',
              quantity: 20,
              unitPrice: 10000,
              totalPrice: 200000,
              notes: null,
              createdAt: new Date(),
              product: {
                sku: 'TEST-002',
                name: '제품 2',
                unit: 'BOX',
              },
            },
          ],
        },
      ]

      const buffer = generateMultiplePurchaseOrdersExcel(mockOrders)
      const wb = XLSX.read(buffer, { type: 'buffer' })

      // 첫 번째 시트 검증
      const ws1 = wb.Sheets['PO-2026-001']
      const data1 = XLSX.utils.sheet_to_json(ws1, { header: 1 }) as unknown[][]
      const text1 = data1.map((row) => (row as unknown[]).join(' ')).join(' ')

      expect(text1).toContain('PO-2026-001')
      expect(text1).toContain('공급자 A')
      expect(text1).toContain('TEST-001')

      // 두 번째 시트 검증
      const ws2 = wb.Sheets['PO-2026-002']
      const data2 = XLSX.utils.sheet_to_json(ws2, { header: 1 }) as unknown[][]
      const text2 = data2.map((row) => (row as unknown[]).join(' ')).join(' ')

      expect(text2).toContain('PO-2026-002')
      expect(text2).toContain('공급자 B')
      expect(text2).toContain('TEST-002')
    })
  })
})
