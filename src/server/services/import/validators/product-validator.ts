/**
 * 제품 마스터 데이터 유효성 검증
 */

import { z } from "zod";

/**
 * 제품 데이터 행 스키마
 */
const productRowSchema = z.object({
  sku: z.string().min(1, "SKU는 필수입니다"),
  name: z.string().min(1, "제품명은 필수입니다"),
  category: z.string().optional(),
  description: z.string().optional(),
  unit: z.string().default("EA"),
  unitPrice: z.coerce.number().min(0, "단가는 0 이상이어야 합니다").default(0),
  costPrice: z.coerce.number().min(0, "원가는 0 이상이어야 합니다").default(0),
  abcGrade: z.enum(["A", "B", "C"]).optional(),
  xyzGrade: z.enum(["X", "Y", "Z"]).optional(),
  moq: z.coerce.number().int("최소발주수량은 정수여야 합니다").min(1).default(1),
  leadTime: z.coerce.number().int("리드타임은 정수여야 합니다").min(0).default(7),
  safetyStock: z.coerce.number().int("안전재고는 정수여야 합니다").min(0).default(0),
  reorderPoint: z.coerce.number().int("발주점은 정수여야 합니다").min(0).default(0),
  targetStock: z.coerce.number().int("목표재고는 정수여야 합니다").min(0).optional(),
  barcode: z.string().optional(),
  imageUrl: z.string().url("유효한 URL이 아닙니다").optional(),
});

export type ProductRowData = z.infer<typeof productRowSchema>;

export interface ValidationResult {
  valid: boolean;
  data?: ProductRowData;
  errors?: string[];
}

export interface BatchValidationResult {
  valid: ProductRowData[];
  invalid: Array<{
    row: number;
    data: Record<string, unknown>;
    errors: string[];
  }>;
}

/**
 * 단일 행 검증
 */
export function validateProductRow(rowData: Record<string, unknown>): ValidationResult {
  try {
    const validated = productRowSchema.parse(rowData);
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
export function validateProductData(
  data: Record<string, unknown>[]
): BatchValidationResult {
  const valid: ProductRowData[] = [];
  const invalid: Array<{
    row: number;
    data: Record<string, unknown>;
    errors: string[];
  }> = [];

  data.forEach((row, index) => {
    const result = validateProductRow(row);
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
export const REQUIRED_PRODUCT_COLUMNS = ["sku", "name"];

/**
 * 헤더 매핑 (다양한 컬럼명 지원)
 */
export const PRODUCT_HEADER_MAP: Record<string, string[]> = {
  sku: ["SKU", "sku", "제품코드", "상품코드", "품목코드"],
  name: ["제품명", "상품명", "품목명", "name", "Name", "NAME"],
  category: ["카테고리", "분류", "category", "Category", "CATEGORY"],
  description: ["설명", "상세설명", "description", "Description"],
  unit: ["단위", "unit", "Unit", "UNIT"],
  unitPrice: ["단가", "판매단가", "판매가", "unitPrice", "unit_price"],
  costPrice: ["원가", "매입가", "costPrice", "cost_price"],
  abcGrade: ["ABC등급", "ABC", "abc_grade", "abcGrade"],
  xyzGrade: ["XYZ등급", "XYZ", "xyz_grade", "xyzGrade"],
  moq: ["MOQ", "moq", "최소발주수량", "최소주문수량"],
  leadTime: ["리드타임", "leadTime", "lead_time", "조달기간"],
  safetyStock: ["안전재고", "safetyStock", "safety_stock"],
  reorderPoint: ["발주점", "reorderPoint", "reorder_point"],
  targetStock: ["목표재고", "targetStock", "target_stock"],
  barcode: ["바코드", "barcode", "Barcode"],
  imageUrl: ["이미지URL", "imageUrl", "image_url"],
};
