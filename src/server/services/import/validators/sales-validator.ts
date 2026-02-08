/**
 * 판매 데이터 유효성 검증
 */

import { z } from "zod";

/**
 * 판매 데이터 행 스키마
 */
const salesRowSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)")
    .refine(
      (date) => {
        const parsed = new Date(date);
        return !isNaN(parsed.getTime());
      },
      { message: "유효하지 않은 날짜입니다" }
    ),
  sku: z.string().min(1, "SKU는 필수입니다"),
  quantity: z.coerce.number().int("수량은 정수여야 합니다").min(1, "수량은 1 이상이어야 합니다"),
  unitPrice: z.coerce.number().min(0, "단가는 0 이상이어야 합니다").optional(),
  channel: z.string().optional(),
  notes: z.string().optional(),
});

export type SalesRowData = z.infer<typeof salesRowSchema>;

export interface ValidationResult {
  valid: boolean;
  data?: SalesRowData;
  errors?: string[];
}

export interface BatchValidationResult {
  valid: SalesRowData[];
  invalid: Array<{
    row: number;
    data: Record<string, unknown>;
    errors: string[];
  }>;
}

/**
 * 단일 행 검증
 */
export function validateSalesRow(rowData: Record<string, unknown>): ValidationResult {
  try {
    const validated = salesRowSchema.parse(rowData);
    return { valid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      };
    }
    return {
      valid: false,
      errors: ["알 수 없는 검증 오류"],
    };
  }
}

/**
 * 배치 검증
 */
export function validateSalesData(
  data: Record<string, unknown>[]
): BatchValidationResult {
  const valid: SalesRowData[] = [];
  const invalid: Array<{
    row: number;
    data: Record<string, unknown>;
    errors: string[];
  }> = [];

  data.forEach((row, index) => {
    const result = validateSalesRow(row);
    if (result.valid && result.data) {
      valid.push(result.data);
    } else {
      invalid.push({
        row: index + 2, // Excel 행 번호 (헤더 제외, 1-based)
        data: row,
        errors: result.errors || [],
      });
    }
  });

  return { valid, invalid };
}

/**
 * 필수 컬럼 확인
 */
export const REQUIRED_SALES_COLUMNS = ["date", "sku", "quantity"];

/**
 * 헤더 매핑 (다양한 컬럼명 지원)
 */
export const SALES_HEADER_MAP: Record<string, string[]> = {
  date: ["날짜", "판매일", "date", "Date", "DATE", "판매날짜"],
  sku: ["SKU", "sku", "제품코드", "상품코드", "품목코드"],
  quantity: ["수량", "판매수량", "quantity", "Quantity", "QUANTITY"],
  unitPrice: ["단가", "판매단가", "unitPrice", "unit_price", "가격", "판매가격"],
  channel: ["채널", "판매채널", "channel", "Channel", "CHANNEL"],
  notes: ["비고", "메모", "notes", "Notes", "NOTES", "참고"],
};
