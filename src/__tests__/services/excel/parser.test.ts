
import * as XLSX from 'xlsx'
import {
  parseExcelBuffer,
  sheetToJson,
  parseExcelDate,
  formatDateToString,
  parseNumber,
  validateRequired,
  transformRow,
  getSheetNames,
  getHeaders,
} from '@/server/services/excel/parser'
import type { ExcelColumnMapping } from '@/server/services/excel/types'

describe('Excel Parser 유틸리티', () => {
  describe('parseExcelDate - Excel 날짜 파싱', () => {
    it('Date 객체 입력 시 그대로 반환한다', () => {
      const testDate = new Date(2026, 0, 15) // 2026-01-15
      const result = parseExcelDate(testDate)

      expect(result).toBeInstanceOf(Date)
      expect(result?.getFullYear()).toBe(2026)
      expect(result?.getMonth()).toBe(0) // 0 = January
      expect(result?.getDate()).toBe(15)
    })

    it('Excel 시리얼 넘버(44927)를 실제 날짜로 변환한다', () => {
      // Excel 시리얼 44927 = 2023-01-01 (Excel 1900 시스템 기준)
      const result = parseExcelDate(44927)

      expect(result).toBeInstanceOf(Date)
      expect(result?.getFullYear()).toBe(2023)
    })

    it('Excel 시리얼 넘버(45658)를 실제 날짜로 변환한다', () => {
      // Excel 시리얼 45658 = 2025-01-01
      const result = parseExcelDate(45658)

      expect(result).toBeInstanceOf(Date)
      expect(result?.getFullYear()).toBe(2025)
      expect(result?.getMonth()).toBe(0)
      expect(result?.getDate()).toBe(1)
    })

    it('YYYY-MM-DD 형식 문자열을 파싱한다', () => {
      const result = parseExcelDate('2026-01-15')

      expect(result).toBeInstanceOf(Date)
      expect(result?.getFullYear()).toBe(2026)
      expect(result?.getMonth()).toBe(0)
      expect(result?.getDate()).toBe(15)
    })

    it('YYYY/MM/DD 형식 문자열을 파싱한다', () => {
      const result = parseExcelDate('2026/01/15')

      expect(result).toBeInstanceOf(Date)
      expect(result?.getFullYear()).toBe(2026)
      expect(result?.getMonth()).toBe(0)
      expect(result?.getDate()).toBe(15)
    })

    it('DD-MM-YYYY 형식 문자열을 파싱한다', () => {
      const result = parseExcelDate('15-01-2026')

      expect(result).toBeInstanceOf(Date)
      expect(result?.getFullYear()).toBe(2026)
      expect(result?.getMonth()).toBe(0)
      expect(result?.getDate()).toBe(15)
    })

    it('DD/MM/YYYY 형식 문자열을 파싱한다', () => {
      const result = parseExcelDate('15/01/2026')

      expect(result).toBeInstanceOf(Date)
      expect(result?.getFullYear()).toBe(2026)
      expect(result?.getMonth()).toBe(0)
      expect(result?.getDate()).toBe(15)
    })

    it('일반 문자열 형식(Jan 15, 2026)을 파싱한다', () => {
      const result = parseExcelDate('Jan 15, 2026')

      expect(result).toBeInstanceOf(Date)
      expect(result?.getFullYear()).toBe(2026)
      expect(result?.getMonth()).toBe(0) // January
      expect(result?.getDate()).toBe(15)
    })

    it('null 입력 시 null을 반환한다', () => {
      const result = parseExcelDate(null)

      expect(result).toBeNull()
    })

    it('undefined 입력 시 null을 반환한다', () => {
      const result = parseExcelDate(undefined)

      expect(result).toBeNull()
    })

    it('빈 문자열 입력 시 null을 반환한다', () => {
      const result = parseExcelDate('')

      expect(result).toBeNull()
    })

    it('유효하지 않은 문자열 입력 시 null을 반환한다', () => {
      const result = parseExcelDate('invalid date string')

      expect(result).toBeNull()
    })
  })

  describe('formatDateToString - 날짜 문자열 변환', () => {
    it('정상 Date 객체를 YYYY-MM-DD 형식으로 변환한다', () => {
      const testDate = new Date(2026, 0, 15) // 2026-01-15
      const result = formatDateToString(testDate)

      expect(result).toBe('2026-01-15')
    })

    it('한 자리 월을 0으로 패딩한다', () => {
      const testDate = new Date(2026, 0, 15) // 1월 = 0
      const result = formatDateToString(testDate)

      expect(result).toBe('2026-01-15')
    })

    it('한 자리 일을 0으로 패딩한다', () => {
      const testDate = new Date(2026, 11, 5) // 12월 5일
      const result = formatDateToString(testDate)

      expect(result).toBe('2026-12-05')
    })
  })

  describe('parseNumber - 숫자 파싱', () => {
    it('숫자 입력을 그대로 반환한다', () => {
      const result = parseNumber(42)

      expect(result).toBe(42)
    })

    it('쉼표 포함 문자열을 숫자로 변환한다', () => {
      const result = parseNumber('1,000')

      expect(result).toBe(1000)
    })

    it('쉼표가 여러 개 있는 문자열을 숫자로 변환한다', () => {
      const result = parseNumber('1,234,567')

      expect(result).toBe(1234567)
    })

    it('공백 포함 문자열을 숫자로 변환한다', () => {
      const result = parseNumber(' 42 ')

      expect(result).toBe(42)
    })

    it('null 입력 시 null을 반환한다', () => {
      const result = parseNumber(null)

      expect(result).toBeNull()
    })

    it('undefined 입력 시 null을 반환한다', () => {
      const result = parseNumber(undefined)

      expect(result).toBeNull()
    })

    it('빈 문자열 입력 시 null을 반환한다', () => {
      const result = parseNumber('')

      expect(result).toBeNull()
    })

    it('NaN 입력 시 null을 반환한다', () => {
      const result = parseNumber(NaN)

      expect(result).toBeNull()
    })

    it('숫자로 변환 불가능한 문자열 입력 시 null을 반환한다', () => {
      const result = parseNumber('abc')

      expect(result).toBeNull()
    })
  })

  describe('validateRequired - 필수 필드 검증', () => {
    it('필수 필드가 모두 있으면 빈 배열을 반환한다', () => {
      const row = {
        '제품명': '테스트 제품',
        '재고수량': 100,
      }

      const mappings: ExcelColumnMapping[] = [
        { excelColumn: '제품명', dbField: 'name', required: true },
        { excelColumn: '재고수량', dbField: 'quantity', required: true },
      ]

      const errors = validateRequired(row, 0, mappings)

      expect(errors).toHaveLength(0)
    })

    it('필수 필드가 비어있으면 오류 배열을 반환한다', () => {
      const row = {
        '제품명': '',
        '재고수량': 100,
      }

      const mappings: ExcelColumnMapping[] = [
        { excelColumn: '제품명', dbField: 'name', required: true },
        { excelColumn: '재고수량', dbField: 'quantity', required: true },
      ]

      const errors = validateRequired(row, 0, mappings)

      expect(errors).toHaveLength(1)
      expect(errors[0].column).toBe('제품명')
      expect(errors[0].message).toContain('필수 필드가 비어있습니다')
    })

    it('비필수 필드가 비어있어도 오류가 없다', () => {
      const row = {
        '제품명': '테스트 제품',
        '설명': '', // 비필수 필드
      }

      const mappings: ExcelColumnMapping[] = [
        { excelColumn: '제품명', dbField: 'name', required: true },
        { excelColumn: '설명', dbField: 'description', required: false },
      ]

      const errors = validateRequired(row, 0, mappings)

      expect(errors).toHaveLength(0)
    })

    it('row 번호가 rowIndex + 2로 보정된다', () => {
      const row = {
        '제품명': '',
      }

      const mappings: ExcelColumnMapping[] = [
        { excelColumn: '제품명', dbField: 'name', required: true },
      ]

      const errors = validateRequired(row, 5, mappings)

      expect(errors[0].row).toBe(7) // 5 + 2 = 7 (헤더 + 0-인덱스 보정)
    })
  })

  describe('transformRow - 행 데이터 변환', () => {
    it('매핑에 따라 정상적으로 변환한다', () => {
      const row = {
        '제품명': '테스트 제품',
        '재고수량': 100,
        '가격': 5000,
      }

      const mappings: ExcelColumnMapping[] = [
        { excelColumn: '제품명', dbField: 'name', required: true },
        { excelColumn: '재고수량', dbField: 'quantity', required: true },
        { excelColumn: '가격', dbField: 'price', required: false },
      ]

      const result = transformRow(row, mappings)

      expect(result).toEqual({
        name: '테스트 제품',
        quantity: 100,
        price: 5000,
      })
    })

    it('값이 없을 때 defaultValue를 적용한다', () => {
      const row = {
        '제품명': '테스트 제품',
        '재고수량': '', // 빈 값
      }

      const mappings: ExcelColumnMapping[] = [
        { excelColumn: '제품명', dbField: 'name', required: true },
        {
          excelColumn: '재고수량',
          dbField: 'quantity',
          required: false,
          defaultValue: 0,
        },
      ]

      const result = transformRow(row, mappings)

      expect(result).toEqual({
        name: '테스트 제품',
        quantity: 0, // defaultValue 적용
      })
    })

    it('transform 함수를 적용한다', () => {
      const row = {
        '제품명': 'test',
        '재고수량': '1,000',
      }

      const mappings: ExcelColumnMapping[] = [
        {
          excelColumn: '제품명',
          dbField: 'name',
          required: true,
          transform: (v) => String(v).toUpperCase(),
        },
        {
          excelColumn: '재고수량',
          dbField: 'quantity',
          required: true,
          transform: parseNumber,
        },
      ]

      const result = transformRow(row, mappings)

      expect(result).toEqual({
        name: 'TEST',
        quantity: 1000,
      })
    })
  })

  describe('parseExcelBuffer - 버퍼 파싱', () => {
    it('유효한 Excel 버퍼를 워크북으로 파싱한다', () => {
      // 간단한 워크북 생성
      const ws = XLSX.utils.aoa_to_sheet([
        ['제품명', '재고수량'],
        ['제품A', 100],
        ['제품B', 200],
      ])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

      // 버퍼로 변환
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })

      // 파싱
      const result = parseExcelBuffer(buffer)

      expect(result).toBeDefined()
      expect(result.SheetNames).toContain('Sheet1')
    })
  })

  describe('sheetToJson - 시트를 JSON으로 변환', () => {
    it('시트 데이터를 JSON 배열로 변환한다', () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ['제품명', '재고수량'],
        ['제품A', 100],
        ['제품B', 200],
      ])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

      const result = sheetToJson<{ 제품명: string; 재고수량: number }>(wb, 'Sheet1')

      expect(result).toHaveLength(2)
      expect(result[0].제품명).toBe('제품A')
      expect(result[0].재고수량).toBe('100') // raw: false이므로 문자열
    })

    it('시트 이름을 지정하지 않으면 첫 번째 시트를 사용한다', () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ['제품명', '재고수량'],
        ['제품A', 100],
      ])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'FirstSheet')

      const result = sheetToJson(wb) // sheetName 미지정

      expect(result).toHaveLength(1)
    })

    it('존재하지 않는 시트 이름을 지정하면 에러를 발생시킨다', () => {
      const ws = XLSX.utils.aoa_to_sheet([['A', 'B']])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

      expect(() => sheetToJson(wb, 'NonExistentSheet')).toThrow('시트를 찾을 수 없습니다')
    })
  })

  describe('getSheetNames - 시트 이름 목록', () => {
    it('워크북의 시트 이름 목록을 반환한다', () => {
      const wb = XLSX.utils.book_new()
      const ws1 = XLSX.utils.aoa_to_sheet([['A']])
      const ws2 = XLSX.utils.aoa_to_sheet([['B']])

      XLSX.utils.book_append_sheet(wb, ws1, 'Sheet1')
      XLSX.utils.book_append_sheet(wb, ws2, 'Sheet2')

      const result = getSheetNames(wb)

      expect(result).toEqual(['Sheet1', 'Sheet2'])
    })

    it('빈 워크북은 빈 배열을 반환한다', () => {
      const wb = XLSX.utils.book_new()

      const result = getSheetNames(wb)

      expect(result).toEqual([])
    })
  })

  describe('getHeaders - 헤더 추출', () => {
    it('첫 번째 행의 헤더를 추출한다', () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ['제품명', '재고수량', '가격'],
        ['제품A', 100, 5000],
      ])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

      const result = getHeaders(wb, 'Sheet1')

      expect(result).toEqual(['제품명', '재고수량', '가격'])
    })

    it('시트 이름을 지정하지 않으면 첫 번째 시트의 헤더를 추출한다', () => {
      const ws = XLSX.utils.aoa_to_sheet([['A', 'B', 'C']])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'FirstSheet')

      const result = getHeaders(wb) // sheetName 미지정

      expect(result).toEqual(['A', 'B', 'C'])
    })

    it('존재하지 않는 시트는 빈 배열을 반환한다', () => {
      const wb = XLSX.utils.book_new()

      const result = getHeaders(wb, 'NonExistentSheet')

      expect(result).toEqual([])
    })

    it('헤더가 없는 셀은 Column{N}으로 표시한다', () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ['A', null, 'C'], // 두 번째 열이 비어있음
      ])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

      const result = getHeaders(wb, 'Sheet1')

      expect(result[1]).toBe('Column2') // 인덱스 0부터 시작하므로 Column2
    })
  })
})
