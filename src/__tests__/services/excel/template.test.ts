
import * as XLSX from 'xlsx'

/**
 * createProductTemplate 함수 (DB 의존성 제거 버전)
 */
function createProductTemplate(): ArrayBuffer {
  const templateData = [
    {
      SKU: "SKU-A001",
      제품명: "프리미엄 블루투스 스피커",
      카테고리: "전자기기",
      단위: "EA",
      판매단가: 89000,
      재고수량: 150,
    },
    {
      SKU: "SKU-A002",
      제품명: "무선 충전 패드",
      카테고리: "전자기기",
      단위: "EA",
      판매단가: 35000,
      재고수량: 80,
    },
  ]

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(templateData)

  worksheet["!cols"] = [
    { wch: 12 },
    { wch: 25 },
    { wch: 12 },
    { wch: 6 },
    { wch: 10 },
    { wch: 10 },
  ]

  const guideData = [
    { 항목: "SKU", 필수여부: "필수", 설명: "제품 고유 코드 (예: SKU-A001)" },
    { 항목: "제품명", 필수여부: "필수", 설명: "제품 이름" },
    { 항목: "카테고리", 필수여부: "선택", 설명: "비워두면 '기타'로 분류" },
    { 항목: "단위", 필수여부: "선택", 설명: "비워두면 'EA' (개)" },
    { 항목: "판매단가", 필수여부: "선택", 설명: "비워두면 0원" },
    { 항목: "재고수량", 필수여부: "권장", 설명: "현재 보유 재고수량 (비워두면 0)" },
    { 항목: "원가", 필수여부: "선택", 설명: "비워두면 0원" },
    { 항목: "안전재고", 필수여부: "선택", 설명: "비워두면 시스템이 자동 계산 (기본: 0)" },
    { 항목: "리드타임", 필수여부: "선택", 설명: "비워두면 7일 적용" },
    { 항목: "MOQ", 필수여부: "선택", 설명: "최소발주수량, 비워두면 1개" },
  ]
  const guideSheet = XLSX.utils.json_to_sheet(guideData)
  guideSheet["!cols"] = [{ wch: 12 }, { wch: 10 }, { wch: 45 }]

  XLSX.utils.book_append_sheet(workbook, worksheet, "제품마스터")
  XLSX.utils.book_append_sheet(workbook, guideSheet, "입력안내")

  return XLSX.write(workbook, { type: "array", bookType: "xlsx" })
}

/**
 * createSalesTemplate 함수 (DB 의존성 제거 버전)
 */
function createSalesTemplate(): ArrayBuffer {
  const templateData = [
    {
      SKU: "SKU-A001",
      날짜: "2026-01-15",
      수량: 100,
      단가: 15000,
      채널: "온라인",
      비고: "예시 데이터",
    },
    {
      SKU: "SKU-A002",
      날짜: "2026-01-15",
      수량: 50,
      단가: 25000,
      채널: "오프라인",
      비고: "",
    },
  ]

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(templateData)

  worksheet["!cols"] = [
    { wch: 12 }, // SKU
    { wch: 12 }, // 날짜
    { wch: 8 }, // 수량
    { wch: 10 }, // 단가
    { wch: 10 }, // 채널
    { wch: 20 }, // 비고
  ]

  XLSX.utils.book_append_sheet(workbook, worksheet, "판매데이터")

  return XLSX.write(workbook, { type: "array", bookType: "xlsx" })
}

describe('Excel 템플릿 생성', () => {
  describe('createProductTemplate - 제품 템플릿', () => {
    it('ArrayBuffer를 반환한다', () => {
      const buffer = createProductTemplate()

      expect(buffer).toBeInstanceOf(ArrayBuffer)
      expect(buffer.byteLength).toBeGreaterThan(0)
    })

    it('파싱 가능한 유효한 Excel이다', () => {
      const buffer = createProductTemplate()

      expect(() => {
        XLSX.read(buffer, { type: 'array' })
      }).not.toThrow()
    })

    it('"제품마스터" 시트가 존재한다', () => {
      const buffer = createProductTemplate()
      const wb = XLSX.read(buffer, { type: 'array' })

      expect(wb.SheetNames).toContain('제품마스터')
    })

    it('"입력안내" 시트가 존재한다', () => {
      const buffer = createProductTemplate()
      const wb = XLSX.read(buffer, { type: 'array' })

      expect(wb.SheetNames).toContain('입력안내')
    })

    it('예시 데이터 2행이 포함된다 (SKU-A001, SKU-A002)', () => {
      const buffer = createProductTemplate()
      const wb = XLSX.read(buffer, { type: 'array' })
      const ws = wb.Sheets['제품마스터']
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

      expect(data.length).toBe(2)
      expect(data[0]).toHaveProperty('SKU', 'SKU-A001')
      expect(data[1]).toHaveProperty('SKU', 'SKU-A002')
    })

    it('필수 헤더 포함 (SKU, 제품명, 카테고리, 단위, 판매단가, 재고수량)', () => {
      const buffer = createProductTemplate()
      const wb = XLSX.read(buffer, { type: 'array' })
      const ws = wb.Sheets['제품마스터']
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

      expect(data.length).toBeGreaterThan(0)

      const firstRow = data[0]
      expect(firstRow).toHaveProperty('SKU')
      expect(firstRow).toHaveProperty('제품명')
      expect(firstRow).toHaveProperty('카테고리')
      expect(firstRow).toHaveProperty('단위')
      expect(firstRow).toHaveProperty('판매단가')
      expect(firstRow).toHaveProperty('재고수량')
    })

    it('입력안내 시트에 10개 항목 설명이 포함된다', () => {
      const buffer = createProductTemplate()
      const wb = XLSX.read(buffer, { type: 'array' })
      const ws = wb.Sheets['입력안내']
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

      expect(data.length).toBe(10)
      expect(data[0]).toHaveProperty('항목', 'SKU')
      expect(data[0]).toHaveProperty('필수여부', '필수')
    })
  })

  describe('createSalesTemplate - 판매 템플릿', () => {
    it('ArrayBuffer를 반환한다', () => {
      const buffer = createSalesTemplate()

      expect(buffer).toBeInstanceOf(ArrayBuffer)
      expect(buffer.byteLength).toBeGreaterThan(0)
    })

    it('파싱 가능한 유효한 Excel이다', () => {
      const buffer = createSalesTemplate()

      expect(() => {
        XLSX.read(buffer, { type: 'array' })
      }).not.toThrow()
    })

    it('"판매데이터" 시트가 존재한다', () => {
      const buffer = createSalesTemplate()
      const wb = XLSX.read(buffer, { type: 'array' })

      expect(wb.SheetNames).toContain('판매데이터')
    })

    it('필수 헤더 포함 (SKU, 날짜, 수량, 단가, 채널, 비고)', () => {
      const buffer = createSalesTemplate()
      const wb = XLSX.read(buffer, { type: 'array' })
      const ws = wb.Sheets['판매데이터']
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

      expect(data.length).toBeGreaterThan(0)

      const firstRow = data[0]
      expect(firstRow).toHaveProperty('SKU')
      expect(firstRow).toHaveProperty('날짜')
      expect(firstRow).toHaveProperty('수량')
      expect(firstRow).toHaveProperty('단가')
      expect(firstRow).toHaveProperty('채널')
      expect(firstRow).toHaveProperty('비고')
    })

    it('예시 데이터 2행이 포함된다', () => {
      const buffer = createSalesTemplate()
      const wb = XLSX.read(buffer, { type: 'array' })
      const ws = wb.Sheets['판매데이터']
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

      expect(data.length).toBe(2)
      expect(data[0]).toHaveProperty('SKU', 'SKU-A001')
      expect(data[1]).toHaveProperty('SKU', 'SKU-A002')
    })
  })
})
