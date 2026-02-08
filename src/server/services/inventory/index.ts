/**
 * 재고 서비스 모듈
 */

// 타입 정의
export * from "./types";

// 재고 계산
export {
  calculateInventoryMetrics,
  calculateAverageDailySales,
  getDaysOfInventoryColor,
  INVENTORY_CALCULATION_CONSTANTS,
  type InventoryCalculationInput,
  type InventoryCalculationResult,
  type AverageDailySalesInput,
} from "./inventory-calculation";
