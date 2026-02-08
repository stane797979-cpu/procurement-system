/**
 * 발주점(ROP) 계산 서비스
 * 재고 보충 시점을 결정하는 핵심 지표
 */

export interface ReorderPointInput {
  /** 일평균 판매량 */
  averageDailyDemand: number;
  /** 리드타임 (일) */
  leadTimeDays: number;
  /** 안전재고 수량 */
  safetyStock: number;
}

export interface ReorderPointResult {
  /** 발주점 수량 */
  reorderPoint: number;
  /** 리드타임 중 예상 수요 */
  leadTimeDemand: number;
  /** 안전재고 */
  safetyStock: number;
}

/**
 * 발주점 계산
 *
 * 공식 (CLAUDE.md 통일 공식):
 * 발주점 = 일평균판매량 × 리드타임(일) + 안전재고
 *
 * 의미:
 * - 리드타임 동안 예상되는 수요량 + 불확실성 대비 버퍼
 * - 현재고가 발주점에 도달하면 발주 시작
 */
export function calculateReorderPoint(input: ReorderPointInput): ReorderPointResult {
  const { averageDailyDemand, leadTimeDays, safetyStock } = input;

  const leadTimeDemand = averageDailyDemand * leadTimeDays;
  const reorderPoint = leadTimeDemand + safetyStock;

  return {
    reorderPoint: Math.ceil(reorderPoint),
    leadTimeDemand: Math.ceil(leadTimeDemand),
    safetyStock,
  };
}

/**
 * 현재고 기준 발주 필요 여부 확인
 */
export function shouldReorder(currentStock: number, reorderPoint: number): boolean {
  return currentStock <= reorderPoint;
}

/**
 * 발주까지 남은 재고일수 계산
 */
export function daysUntilReorder(
  currentStock: number,
  reorderPoint: number,
  averageDailyDemand: number
): number | null {
  if (averageDailyDemand <= 0) return null;
  if (currentStock <= reorderPoint) return 0;

  return Math.floor((currentStock - reorderPoint) / averageDailyDemand);
}

/**
 * 권장 발주량 계산 (발주점 도달 시)
 * EOQ 또는 목표 재고일수 기반
 */
export interface OrderQuantityInput {
  currentStock: number;
  reorderPoint: number;
  safetyStock: number;
  averageDailyDemand: number;
  /** 목표 재고일수 (기본 30일) */
  targetDaysOfInventory?: number;
  /** EOQ (경제적 발주량, 제공 시 우선 사용) */
  eoq?: number;
  /** 최소 발주량 */
  minOrderQuantity?: number;
  /** 발주 배수 (예: 박스 단위 100개) */
  orderMultiple?: number;
}

export interface OrderQuantityResult {
  /** 권장 발주량 */
  recommendedQuantity: number;
  /** 발주 후 예상 재고 */
  projectedStock: number;
  /** 발주 후 예상 재고일수 */
  projectedDaysOfInventory: number;
  /** 계산 방식 */
  method: "eoq" | "target_days";
}

/**
 * 권장 발주량 계산
 */
export function calculateOrderQuantity(input: OrderQuantityInput): OrderQuantityResult {
  const {
    currentStock,
    safetyStock,
    averageDailyDemand,
    targetDaysOfInventory = 30,
    eoq,
    minOrderQuantity = 1,
    orderMultiple = 1,
  } = input;

  let baseQuantity: number;
  let method: "eoq" | "target_days";

  if (eoq && eoq > 0) {
    // EOQ 기반
    baseQuantity = eoq;
    method = "eoq";
  } else {
    // 목표 재고일수 기반
    const targetStock = averageDailyDemand * targetDaysOfInventory + safetyStock;
    baseQuantity = Math.max(0, targetStock - currentStock);
    method = "target_days";
  }

  // 최소 발주량 적용
  let quantity = Math.max(baseQuantity, minOrderQuantity);

  // 발주 배수 맞춤 (올림)
  if (orderMultiple > 1) {
    quantity = Math.ceil(quantity / orderMultiple) * orderMultiple;
  }

  const projectedStock = currentStock + quantity;
  const projectedDaysOfInventory =
    averageDailyDemand > 0 ? Math.floor((projectedStock - safetyStock) / averageDailyDemand) : 0;

  return {
    recommendedQuantity: quantity,
    projectedStock,
    projectedDaysOfInventory,
    method,
  };
}
