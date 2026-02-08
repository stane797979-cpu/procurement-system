/**
 * 재고 계산 로직
 */

export const INVENTORY_CALCULATION_CONSTANTS = {
  /** 재고일수 계산 시 기준 기간 (일) */
  DOI_CALCULATION_PERIOD_DAYS: 30,
  /** 일평균 판매량 계산 최소 데이터 일수 */
  MIN_DAYS_FOR_AVERAGE: 7,
  /** 무한대 재고일수 표시값 */
  INFINITE_DOI_DISPLAY: 999,
} as const;

export interface InventoryCalculationInput {
  /** 현재고 */
  currentStock: number;
  /** 예약재고 */
  reservedStock: number;
  /** 입고예정 */
  incomingStock: number;
  /** 일평균 판매량 */
  averageDailySales: number;
  /** 단가 (재고금액 계산용) */
  unitPrice: number;
}

export interface InventoryCalculationResult {
  /** 가용재고 = 현재고 - 예약재고 */
  availableStock: number;
  /** 유효재고 = 현재고 + 입고예정 - 예약재고 */
  effectiveStock: number;
  /** 재고일수 = 현재고 / 일평균판매량 */
  daysOfInventory: number | null;
  /** 재고금액 = 현재고 × 단가 */
  inventoryValue: number;
  /** 가용재고금액 = 가용재고 × 단가 */
  availableInventoryValue: number;
}

/**
 * 재고 수치 계산
 */
export function calculateInventoryMetrics(
  input: InventoryCalculationInput
): InventoryCalculationResult {
  const { currentStock, reservedStock, incomingStock, averageDailySales, unitPrice } = input;

  // 가용재고 = 현재고 - 예약재고
  const availableStock = Math.max(0, currentStock - reservedStock);

  // 유효재고 = 현재고 + 입고예정 - 예약재고
  const effectiveStock = Math.max(0, currentStock + incomingStock - reservedStock);

  // 재고일수 = 현재고 / 일평균판매량
  const daysOfInventory =
    averageDailySales > 0 ? Math.round((currentStock / averageDailySales) * 100) / 100 : null;

  // 재고금액 = 현재고 × 단가
  const inventoryValue = currentStock * unitPrice;

  // 가용재고금액 = 가용재고 × 단가
  const availableInventoryValue = availableStock * unitPrice;

  return {
    availableStock,
    effectiveStock,
    daysOfInventory,
    inventoryValue,
    availableInventoryValue,
  };
}

export interface AverageDailySalesInput {
  /** 판매 기록 배열 */
  salesRecords: Array<{ date: string; quantity: number }>;
  /** 계산 기간 (일, 기본 30일) */
  periodDays?: number;
}

/**
 * 일평균 판매량 계산
 */
export function calculateAverageDailySales(input: AverageDailySalesInput): number {
  const { salesRecords, periodDays = 30 } = input;

  if (salesRecords.length === 0) {
    return 0;
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - periodDays);

  const filteredSales = salesRecords.filter((record) => {
    const recordDate = new Date(record.date);
    return recordDate >= startDate && recordDate <= endDate;
  });

  const totalQuantity = filteredSales.reduce((sum, record) => sum + record.quantity, 0);

  return Math.round((totalQuantity / periodDays) * 100) / 100;
}

/**
 * 재고일수 색상 분류
 */
export function getDaysOfInventoryColor(days: number | null): string {
  if (days === null) return "slate";
  if (days <= 7) return "red";
  if (days <= 14) return "orange";
  if (days <= 30) return "yellow";
  return "green";
}
