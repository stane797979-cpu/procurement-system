/**
 * 시나리오 시뮬레이션 서비스
 * 수요 변동, 리드타임 변동 시나리오 분석
 */

import { calculateSafetyStock } from "./safety-stock";
import { calculateReorderPoint } from "./reorder-point";

export interface SimulationInput {
  /** 제품 정보 */
  productId: string;
  productName: string;
  /** 현재 재고 */
  currentStock: number;
  /** 일평균 판매량 (기준) */
  averageDailyDemand: number;
  /** 판매량 표준편차 */
  demandStdDev: number;
  /** 리드타임 (일) (기준) */
  leadTimeDays: number;
  /** 리드타임 표준편차 */
  leadTimeStdDev?: number;
  /** 안전재고 (기준) */
  safetyStock: number;
  /** 발주점 (기준) */
  reorderPoint: number;
  /** 서비스 레벨 */
  serviceLevel?: number;
}

export interface ScenarioResult {
  /** 시나리오 이름 */
  scenarioName: string;
  /** 수요 변동률 (%) */
  demandChangePercent: number;
  /** 리드타임 변동 (일) */
  leadTimeChangeDays: number;
  /** 변경된 일평균 판매량 */
  adjustedDemand: number;
  /** 변경된 리드타임 */
  adjustedLeadTime: number;
  /** 새로운 안전재고 */
  newSafetyStock: number;
  /** 새로운 발주점 */
  newReorderPoint: number;
  /** 현재 재고 상태 */
  stockStatus: "충분" | "발주필요" | "긴급";
  /** 필요 발주량 (발주 필요시) */
  requiredOrderQuantity: number;
  /** 안전재고 대비 비율 */
  safetyStockRatio: number;
}

export interface SimulationResult {
  /** 기준 시나리오 */
  baseline: ScenarioResult;
  /** 시뮬레이션 시나리오들 */
  scenarios: ScenarioResult[];
  /** 요약 */
  summary: {
    /** 최악의 시나리오 */
    worstCase: ScenarioResult;
    /** 최선의 시나리오 */
    bestCase: ScenarioResult;
    /** 평균 안전재고 */
    averageSafetyStock: number;
    /** 평균 발주점 */
    averageReorderPoint: number;
  };
}

/**
 * 시나리오별 재고 지표 계산
 */
function calculateScenario(
  input: SimulationInput,
  scenarioName: string,
  demandChangePercent: number,
  leadTimeChangeDays: number
): ScenarioResult {
  const adjustedDemand = input.averageDailyDemand * (1 + demandChangePercent / 100);
  const adjustedLeadTime = Math.max(1, input.leadTimeDays + leadTimeChangeDays);

  // 수요 변동에 따라 표준편차도 비례 조정
  const adjustedDemandStdDev = input.demandStdDev * (1 + demandChangePercent / 100);

  // 새로운 안전재고 계산
  const safetyStockResult = calculateSafetyStock({
    averageDailyDemand: adjustedDemand,
    demandStdDev: adjustedDemandStdDev,
    leadTimeDays: adjustedLeadTime,
    leadTimeStdDev: input.leadTimeStdDev,
    serviceLevel: input.serviceLevel || 0.95,
  });

  // 새로운 발주점 계산
  const reorderPointResult = calculateReorderPoint({
    averageDailyDemand: adjustedDemand,
    leadTimeDays: adjustedLeadTime,
    safetyStock: safetyStockResult.safetyStock,
  });

  // 재고 상태 판단
  let stockStatus: "충분" | "발주필요" | "긴급";
  if (input.currentStock < safetyStockResult.safetyStock * 0.5) {
    stockStatus = "긴급";
  } else if (input.currentStock <= reorderPointResult.reorderPoint) {
    stockStatus = "발주필요";
  } else {
    stockStatus = "충분";
  }

  // 필요 발주량 계산 (발주점 기준)
  const requiredOrderQuantity =
    stockStatus !== "충분"
      ? Math.max(
          0,
          reorderPointResult.reorderPoint +
            adjustedDemand * 30 - // 30일분 재고 목표
            input.currentStock
        )
      : 0;

  // 안전재고 대비 현재고 비율
  const safetyStockRatio =
    safetyStockResult.safetyStock > 0
      ? (input.currentStock / safetyStockResult.safetyStock) * 100
      : 0;

  return {
    scenarioName,
    demandChangePercent,
    leadTimeChangeDays,
    adjustedDemand: Math.round(adjustedDemand * 10) / 10,
    adjustedLeadTime,
    newSafetyStock: safetyStockResult.safetyStock,
    newReorderPoint: reorderPointResult.reorderPoint,
    stockStatus,
    requiredOrderQuantity: Math.ceil(requiredOrderQuantity),
    safetyStockRatio: Math.round(safetyStockRatio),
  };
}

/**
 * 시나리오 시뮬레이션 실행
 */
export function runScenarioSimulation(input: SimulationInput): SimulationResult {
  // 기준 시나리오 (현재 상태)
  const baseline = calculateScenario(input, "기준 (현재)", 0, 0);

  // 시뮬레이션 시나리오들
  const scenarios: ScenarioResult[] = [
    // 수요 증가 시나리오
    calculateScenario(input, "수요 +10%", 10, 0),
    calculateScenario(input, "수요 +20%", 20, 0),
    calculateScenario(input, "수요 +30%", 30, 0),

    // 수요 감소 시나리오
    calculateScenario(input, "수요 -10%", -10, 0),
    calculateScenario(input, "수요 -20%", -20, 0),

    // 리드타임 변동 시나리오
    calculateScenario(input, "리드타임 +2일", 0, 2),
    calculateScenario(input, "리드타임 +5일", 0, 5),
    calculateScenario(input, "리드타임 -2일", 0, -2),

    // 복합 시나리오 (최악/최선)
    calculateScenario(input, "최악: 수요↑20% + 리드타임↑5일", 20, 5),
    calculateScenario(input, "최선: 수요↓20% + 리드타임↓2일", -20, -2),
  ];

  // 최악/최선 시나리오 찾기 (발주점 기준)
  const worstCase = scenarios.reduce((prev, curr) =>
    curr.newReorderPoint > prev.newReorderPoint ? curr : prev
  );
  const bestCase = scenarios.reduce((prev, curr) =>
    curr.newReorderPoint < prev.newReorderPoint ? curr : prev
  );

  // 평균 계산
  const allScenarios = [baseline, ...scenarios];
  const averageSafetyStock =
    allScenarios.reduce((sum, s) => sum + s.newSafetyStock, 0) / allScenarios.length;
  const averageReorderPoint =
    allScenarios.reduce((sum, s) => sum + s.newReorderPoint, 0) / allScenarios.length;

  return {
    baseline,
    scenarios,
    summary: {
      worstCase,
      bestCase,
      averageSafetyStock: Math.ceil(averageSafetyStock),
      averageReorderPoint: Math.ceil(averageReorderPoint),
    },
  };
}

/**
 * 여러 제품에 대한 시뮬레이션 일괄 실행
 */
export function runBulkSimulation(inputs: SimulationInput[]): SimulationResult[] {
  return inputs.map((input) => runScenarioSimulation(input));
}
