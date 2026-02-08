/**
 * 재고 최적화 추천 서비스
 * 과잉재고 감소, 발주주기 최적화, EOQ 기반 비용 절감 추천 제공
 */

import { type ABCGrade, type XYZGrade } from "./abc-xyz-analysis";
import { calculateEOQ, compareOrderQuantityCost, type EOQResult } from "./eoq";
import { classifyInventoryStatus } from "./inventory-status";

// ============================================================================
// 타입 정의
// ============================================================================

export interface InventoryOptimizationInput {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  safetyStock: number;
  reorderPoint: number;
  abcGrade?: ABCGrade | null;
  xyzGrade?: XYZGrade | null;
  unitPrice: number;
  averageDailyDemand: number;
  leadTimeDays: number;
  currentOrderQuantity?: number; // 현재 사용 중인 발주량
  orderingCost?: number; // 1회 발주비용
  holdingRate?: number; // 연간 유지비율 (기본 0.25)
}

export type OptimizationType = "excess_reduction" | "order_frequency" | "eoq_cost_saving";

export interface OptimizationRecommendation {
  type: OptimizationType;
  productId: string;
  productName: string;
  sku: string;
  priority: "high" | "medium" | "low"; // 우선순위
  title: string; // 추천 제목
  description: string; // 상세 설명
  expectedImpact: string; // 예상 효과
  actionItems: string[]; // 실행 항목
  metrics: {
    current?: number | string;
    recommended?: number | string;
    improvement?: number | string;
    savingsKRW?: number; // 예상 절감액 (원)
  };
}

// ============================================================================
// 과잉재고 감소 추천
// ============================================================================

/**
 * 과잉재고 감소 추천 생성
 * 재고상태가 "과다" 또는 "과잉"인 경우 재고 감소 전략 제안
 */
export function generateExcessInventoryReduction(
  input: InventoryOptimizationInput
): OptimizationRecommendation | null {
  const { currentStock, safetyStock, reorderPoint, productName, sku, productId, unitPrice } = input;

  const status = classifyInventoryStatus({ currentStock, safetyStock, reorderPoint });

  // 과다/과잉 재고만 추천
  if (!["excess", "overstock"].includes(status.key)) {
    return null;
  }

  const excessStock = currentStock - safetyStock * 3.0; // 적정 상한선 초과분
  const excessValue = Math.round(excessStock * unitPrice);
  const stockDaysExcess = Math.round((excessStock / Math.max(input.averageDailyDemand, 1)) * 10) / 10;

  const isOverstock = status.key === "overstock";
  const priority = isOverstock ? "high" : "medium";

  return {
    type: "excess_reduction",
    productId,
    productName,
    sku,
    priority,
    title: isOverstock ? "과잉재고 긴급 처분 필요" : "과다재고 감소 권장",
    description: `현재 재고가 안전재고의 ${isOverstock ? "5배 이상" : "3~5배"}으로, 과도한 재고 보유 중입니다. 재고 유지비용 증가 및 진부화 리스크가 있습니다.`,
    expectedImpact: `재고 ${Math.round(excessStock)}개 감소 시 약 ${excessValue.toLocaleString()}원의 유동자금 확보 및 연간 유지비용 절감 (재고가치의 20~25%)`,
    actionItems: isOverstock
      ? [
          "즉시 할인 프로모션 검토 (10~20% 할인)",
          "타 사업장/창고 재배치 검토",
          "공급자 반품 협의 (가능 시)",
          "폐기 또는 기부 검토 (회전 불가 시)",
          "향후 발주량 축소 (EOQ 재계산)",
        ]
      : [
          "프로모션 또는 번들 상품 기획",
          "타 사업장 재고 이관 검토",
          "발주 주기 연장 또는 발주량 축소",
          "재고 처분 계획 수립 (6개월 이내)",
        ],
    metrics: {
      current: `${currentStock}개 (${Math.round(currentStock / safetyStock)}배)`,
      recommended: `${Math.round(safetyStock * 3.0)}개 이하`,
      improvement: `${Math.round(excessStock)}개 감소 (약 ${stockDaysExcess}일분)`,
      savingsKRW: Math.round(excessValue * 0.25), // 연간 유지비용 25% 가정
    },
  };
}

// ============================================================================
// 발주주기 최적화 추천
// ============================================================================

/**
 * ABC-XYZ 등급별 권장 발주 주기 (일)
 */
const RECOMMENDED_ORDER_CYCLE_DAYS: Record<string, number> = {
  AX: 7, // 주간 (안정 고가치 → JIT)
  AY: 14, // 격주 (변동 고가치 → 정기 짧은 주기)
  AZ: 7, // 주간 (불규칙 고가치 → 자주 검토)
  BX: 14, // 격주
  BY: 21, // 3주
  BZ: 14, // 격주
  CX: 30, // 월간 (안정 저가치 → 대량 발주)
  CY: 30, // 월간
  CZ: 30, // 월간 (또는 주문생산)
};

/**
 * ABC-XYZ 등급별 권장 발주 전략
 */
const ORDER_STRATEGY_BY_GRADE: Record<string, string> = {
  AX: "JIT(Just-In-Time) 공급, 자동 발주 시스템 활용",
  AY: "정기 발주 (격주), 수요예측 정교화 필수",
  AZ: "혼합 발주 (정기+긴급), 높은 안전재고 유지",
  BX: "정기 발주, 적정 재고 유지",
  BY: "주기적 검토, 표준 안전재고",
  BZ: "수요패턴 분석 후 발주 주기 조정",
  CX: "대량 발주, 낮은 발주빈도 (연 4~12회)",
  CY: "간헐적 검토, 최소 재고 유지",
  CZ: "주문생산 검토, 재고 최소화 또는 단종 검토",
};

/**
 * 발주주기 최적화 추천 생성
 * ABC-XYZ 등급 기반 최적 발주주기 및 전략 제안
 */
export function generateOrderFrequencyOptimization(
  input: InventoryOptimizationInput
): OptimizationRecommendation | null {
  const { abcGrade, xyzGrade, productName, sku, productId, averageDailyDemand, currentOrderQuantity } =
    input;

  if (!abcGrade || !xyzGrade) {
    return null; // ABC/XYZ 등급 미할당 시 추천 불가
  }

  const combinedGrade = `${abcGrade}${xyzGrade}`;
  const recommendedCycleDays = RECOMMENDED_ORDER_CYCLE_DAYS[combinedGrade] || 30;
  const strategy = ORDER_STRATEGY_BY_GRADE[combinedGrade] || "재고 검토 후 발주";

  // 현재 발주주기 추정 (현재 발주량 기반)
  const currentCycleDays =
    currentOrderQuantity && averageDailyDemand > 0
      ? Math.round(currentOrderQuantity / averageDailyDemand)
      : null;

  // 현재 주기와 권장 주기 차이
  const cycleDiff = currentCycleDays ? Math.abs(currentCycleDays - recommendedCycleDays) : null;

  // 차이가 크면 (7일 이상) 우선순위 상향
  const priority =
    cycleDiff && cycleDiff >= 7 ? (abcGrade === "A" ? "high" : "medium") : "low";

  // 변화가 작으면 추천하지 않음
  if (cycleDiff !== null && cycleDiff < 7) {
    return null;
  }

  return {
    type: "order_frequency",
    productId,
    productName,
    sku,
    priority,
    title: `발주주기 최적화 (${combinedGrade} 등급)`,
    description: `현재 ${abcGrade}등급 (매출 기여도), ${xyzGrade}등급 (수요 안정성) 제품으로 분류됩니다. 이 등급에 맞는 최적 발주 전략을 적용하면 재고효율을 높일 수 있습니다.`,
    expectedImpact:
      abcGrade === "A"
        ? "품절 리스크 감소, 고객 서비스 수준 향상"
        : abcGrade === "B"
          ? "재고 회전율 개선, 적정 재고 유지"
          : "재고 유지비용 절감, 재고 과잉 방지",
    actionItems: [
      `발주 주기를 ${recommendedCycleDays}일로 조정`,
      strategy,
      "발주 주기 변경 후 2~4주간 재고 수준 모니터링",
      xyzGrade === "Z" ? "수요 변동성 높음 → 안전재고 상향 검토" : "현재 안전재고 유지",
    ],
    metrics: {
      current: currentCycleDays ? `${currentCycleDays}일` : "미설정",
      recommended: `${recommendedCycleDays}일`,
      improvement:
        cycleDiff && currentCycleDays
          ? currentCycleDays > recommendedCycleDays
            ? `발주 주기 단축 (${cycleDiff}일 감소)`
            : `발주 주기 연장 (${cycleDiff}일 증가)`
          : "최적 주기 적용",
    },
  };
}

// ============================================================================
// EOQ 기반 비용 절감 추천
// ============================================================================

/**
 * EOQ 기반 비용 절감 추천 생성
 * 현재 발주량과 EOQ 비교, 비용 절감 가능성이 높으면 추천
 */
export function generateEOQCostSavingRecommendation(
  input: InventoryOptimizationInput
): OptimizationRecommendation | null {
  const {
    productId,
    productName,
    sku,
    averageDailyDemand,
    unitPrice,
    currentOrderQuantity,
    orderingCost = 50000, // 기본 발주비용 5만원
    holdingRate = 0.25, // 기본 유지비율 25%
  } = input;

  // 연간 수요량 계산
  const annualDemand = Math.round(averageDailyDemand * 365);

  if (annualDemand === 0 || !currentOrderQuantity || currentOrderQuantity === 0) {
    return null; // 수요 없거나 현재 발주량 미설정 시 추천 불가
  }

  const holdingCostPerUnit = unitPrice * holdingRate;

  // EOQ 계산
  const eoqResult: EOQResult = calculateEOQ({
    annualDemand,
    orderingCost,
    holdingCostPerUnit,
  });

  // EOQ와 현재 발주량 비교
  const costComparison = compareOrderQuantityCost(
    eoqResult,
    currentOrderQuantity,
    annualDemand,
    orderingCost,
    holdingCostPerUnit
  );

  // 비용 절감이 미미하면 (5% 미만) 추천하지 않음
  const savingsPercent = Math.abs(costComparison.costIncreasePercent);
  if (savingsPercent < 5 || costComparison.costDifference <= 0) {
    return null;
  }

  // 절감액이 클수록 우선순위 상향
  const priority = savingsPercent >= 20 ? "high" : savingsPercent >= 10 ? "medium" : "low";

  const quantityDiff = eoqResult.eoq - currentOrderQuantity;
  const direction = quantityDiff > 0 ? "증가" : "감소";
  const diffPercent = Math.round((Math.abs(quantityDiff) / currentOrderQuantity) * 100);

  return {
    type: "eoq_cost_saving",
    productId,
    productName,
    sku,
    priority,
    title: `EOQ 적용으로 연간 ${Math.round(savingsPercent)}% 비용 절감 가능`,
    description: `현재 발주량(${currentOrderQuantity}개)을 경제적 발주량(EOQ)인 ${eoqResult.eoq}개로 조정하면, 발주비용과 재고유지비용의 균형을 맞춰 총 재고비용을 최소화할 수 있습니다.`,
    expectedImpact: `연간 재고 관련 비용 약 ${costComparison.costDifference.toLocaleString()}원 절감 (${Math.round(savingsPercent)}% 감소)`,
    actionItems: [
      `발주량을 현재 ${currentOrderQuantity}개에서 ${eoqResult.eoq}개로 ${direction} (${diffPercent}% ${direction})`,
      `연간 발주 횟수: ${eoqResult.ordersPerYear}회 (약 ${eoqResult.orderCycleDays}일 주기)`,
      "공급자와 MOQ 협의 (EOQ가 MOQ보다 작을 경우)",
      "1~2회 시범 적용 후 재고 수준 및 비용 검증",
      "EOQ는 수요 변화 시 재계산 필요 (분기별 검토 권장)",
    ],
    metrics: {
      current: `${currentOrderQuantity}개 (연간 비용 ${costComparison.actualAnnualCost.toLocaleString()}원)`,
      recommended: `${eoqResult.eoq}개 (연간 비용 ${eoqResult.totalAnnualCost.toLocaleString()}원)`,
      improvement: `${Math.round(savingsPercent)}% 비용 절감`,
      savingsKRW: costComparison.costDifference,
    },
  };
}

// ============================================================================
// 통합 재고 최적화 추천 생성
// ============================================================================

/**
 * 제품별 모든 최적화 추천 생성
 * 우선순위 순으로 정렬하여 반환
 */
export function generateInventoryOptimizationRecommendations(
  input: InventoryOptimizationInput
): OptimizationRecommendation[] {
  const recommendations: OptimizationRecommendation[] = [];

  // 1. 과잉재고 감소 추천
  const excessReduction = generateExcessInventoryReduction(input);
  if (excessReduction) {
    recommendations.push(excessReduction);
  }

  // 2. 발주주기 최적화 추천
  const orderFrequency = generateOrderFrequencyOptimization(input);
  if (orderFrequency) {
    recommendations.push(orderFrequency);
  }

  // 3. EOQ 기반 비용 절감 추천
  const eoqSaving = generateEOQCostSavingRecommendation(input);
  if (eoqSaving) {
    recommendations.push(eoqSaving);
  }

  // 우선순위 정렬: high > medium > low
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

// ============================================================================
// 조직 전체 최적화 요약
// ============================================================================

export interface OrganizationOptimizationSummary {
  totalProducts: number;
  productsWithRecommendations: number;
  totalRecommendations: number;
  byType: {
    excess_reduction: number;
    order_frequency: number;
    eoq_cost_saving: number;
  };
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
  totalPotentialSavings: number; // 전체 예상 절감액 (원)
  topRecommendations: OptimizationRecommendation[]; // 상위 5개 추천
}

/**
 * 조직 전체 최적화 요약 생성
 * 모든 제품의 추천을 집계하여 요약 제공
 */
export function summarizeOrganizationOptimization(
  allRecommendations: OptimizationRecommendation[]
): OrganizationOptimizationSummary {
  const byType = {
    excess_reduction: 0,
    order_frequency: 0,
    eoq_cost_saving: 0,
  };

  const byPriority = {
    high: 0,
    medium: 0,
    low: 0,
  };

  let totalPotentialSavings = 0;
  const productIds = new Set<string>();

  allRecommendations.forEach((rec) => {
    byType[rec.type]++;
    byPriority[rec.priority]++;
    productIds.add(rec.productId);

    if (rec.metrics.savingsKRW) {
      totalPotentialSavings += rec.metrics.savingsKRW;
    }
  });

  // 우선순위 + 절감액 기준 상위 5개 추출
  const topRecommendations = [...allRecommendations]
    .sort((a, b) => {
      // 우선순위 먼저
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // 우선순위 같으면 절감액 기준
      return (b.metrics.savingsKRW || 0) - (a.metrics.savingsKRW || 0);
    })
    .slice(0, 5);

  return {
    totalProducts: productIds.size,
    productsWithRecommendations: productIds.size,
    totalRecommendations: allRecommendations.length,
    byType,
    byPriority,
    totalPotentialSavings: Math.round(totalPotentialSavings),
    topRecommendations,
  };
}
