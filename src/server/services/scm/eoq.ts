/**
 * 경제적 발주량(EOQ) 계산 서비스
 * 총 재고비용(발주비용 + 유지비용)을 최소화하는 발주량 산정
 */

export interface EOQInput {
  /** 연간 수요량 */
  annualDemand: number;
  /** 1회 발주 비용 (원) */
  orderingCost: number;
  /** 단위당 연간 유지비용 (원) 또는 단가 × 유지비율 */
  holdingCostPerUnit: number;
}

export interface EOQResult {
  /** 경제적 발주량 */
  eoq: number;
  /** 연간 발주 횟수 */
  ordersPerYear: number;
  /** 발주 주기 (일) */
  orderCycleDays: number;
  /** 연간 총 발주비용 */
  annualOrderingCost: number;
  /** 연간 총 유지비용 */
  annualHoldingCost: number;
  /** 연간 총 재고비용 */
  totalAnnualCost: number;
}

/**
 * EOQ (Economic Order Quantity) 계산
 *
 * 공식:
 * EOQ = sqrt(2 × D × S / H)
 *
 * - D: 연간 수요량
 * - S: 1회 발주 비용
 * - H: 단위당 연간 유지비용
 *
 * 가정:
 * - 수요가 일정하고 예측 가능
 * - 리드타임이 일정
 * - 발주량 전체가 한 번에 입고
 * - 할인 없음
 */
export function calculateEOQ(input: EOQInput): EOQResult {
  const { annualDemand, orderingCost, holdingCostPerUnit } = input;

  // 유효성 검사
  if (annualDemand <= 0 || orderingCost <= 0 || holdingCostPerUnit <= 0) {
    return {
      eoq: 0,
      ordersPerYear: 0,
      orderCycleDays: 0,
      annualOrderingCost: 0,
      annualHoldingCost: 0,
      totalAnnualCost: 0,
    };
  }

  // EOQ 계산
  const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCostPerUnit);
  const roundedEOQ = Math.ceil(eoq); // 올림 처리

  // 파생 지표 계산
  const ordersPerYear = annualDemand / roundedEOQ;
  const orderCycleDays = 365 / ordersPerYear;

  // 비용 계산
  const annualOrderingCost = ordersPerYear * orderingCost;
  const annualHoldingCost = (roundedEOQ / 2) * holdingCostPerUnit;
  const totalAnnualCost = annualOrderingCost + annualHoldingCost;

  return {
    eoq: roundedEOQ,
    ordersPerYear: Math.round(ordersPerYear * 100) / 100,
    orderCycleDays: Math.round(orderCycleDays),
    annualOrderingCost: Math.round(annualOrderingCost),
    annualHoldingCost: Math.round(annualHoldingCost),
    totalAnnualCost: Math.round(totalAnnualCost),
  };
}

export interface HoldingCostInput {
  /** 단가 (원) */
  unitPrice: number;
  /** 연간 유지비율 (0-1, 기본 0.25 = 25%) */
  holdingRate?: number;
  /** 창고 비용 (월, 단위당) */
  monthlyStorageCost?: number;
  /** 보험료 (연, 단위당) */
  annualInsuranceCost?: number;
  /** 기타 비용 (연, 단위당) */
  otherAnnualCost?: number;
}

/**
 * 유지비용 계산
 *
 * 유지비용 = 단가 × 유지비율 + 창고비 + 보험료 + 기타
 *
 * 일반적인 유지비율: 20~30% (자본비용, 창고, 보험, 진부화 등 포함)
 */
export function calculateHoldingCost(input: HoldingCostInput): number {
  const {
    unitPrice,
    holdingRate = 0.25,
    monthlyStorageCost = 0,
    annualInsuranceCost = 0,
    otherAnnualCost = 0,
  } = input;

  const capitalCost = unitPrice * holdingRate;
  const annualStorageCost = monthlyStorageCost * 12;

  return capitalCost + annualStorageCost + annualInsuranceCost + otherAnnualCost;
}

/**
 * 발주량 변경 시 비용 비교
 * 실제 발주량이 EOQ와 다를 때 추가 비용 계산
 */
export function compareOrderQuantityCost(
  eoqResult: EOQResult,
  actualQuantity: number,
  annualDemand: number,
  orderingCost: number,
  holdingCostPerUnit: number
): {
  actualAnnualCost: number;
  costDifference: number;
  costIncreasePercent: number;
} {
  if (actualQuantity <= 0) {
    return {
      actualAnnualCost: 0,
      costDifference: 0,
      costIncreasePercent: 0,
    };
  }

  const actualOrdersPerYear = annualDemand / actualQuantity;
  const actualOrderingCost = actualOrdersPerYear * orderingCost;
  const actualHoldingCost = (actualQuantity / 2) * holdingCostPerUnit;
  const actualAnnualCost = actualOrderingCost + actualHoldingCost;

  const costDifference = actualAnnualCost - eoqResult.totalAnnualCost;
  const costIncreasePercent =
    eoqResult.totalAnnualCost > 0 ? (costDifference / eoqResult.totalAnnualCost) * 100 : 0;

  return {
    actualAnnualCost: Math.round(actualAnnualCost),
    costDifference: Math.round(costDifference),
    costIncreasePercent: Math.round(costIncreasePercent * 100) / 100,
  };
}

/**
 * 수량 할인을 고려한 EOQ 계산
 * 발주량에 따른 할인이 있을 때 최적 발주량 결정
 */
export interface QuantityDiscountBracket {
  /** 최소 발주량 */
  minQuantity: number;
  /** 할인된 단가 */
  discountedPrice: number;
}

export function calculateEOQWithDiscount(
  annualDemand: number,
  orderingCost: number,
  holdingRate: number,
  discountBrackets: QuantityDiscountBracket[]
): {
  optimalQuantity: number;
  optimalPrice: number;
  totalAnnualCost: number;
} {
  // 가격 내림차순 정렬 (높은 가격 = 낮은 수량)
  const sortedBrackets = [...discountBrackets].sort(
    (a, b) => b.discountedPrice - a.discountedPrice
  );

  let optimalResult = {
    optimalQuantity: 0,
    optimalPrice: sortedBrackets[0]?.discountedPrice || 0,
    totalAnnualCost: Infinity,
  };

  for (const bracket of sortedBrackets) {
    const holdingCost = bracket.discountedPrice * holdingRate;
    const eoqResult = calculateEOQ({
      annualDemand,
      orderingCost,
      holdingCostPerUnit: holdingCost,
    });

    // EOQ가 해당 구간의 최소 수량보다 작으면 최소 수량 사용
    const quantity = Math.max(eoqResult.eoq, bracket.minQuantity);

    // 총 비용 계산 (구매비용 + 발주비용 + 유지비용)
    const purchaseCost = annualDemand * bracket.discountedPrice;
    const ordersPerYear = annualDemand / quantity;
    const orderCost = ordersPerYear * orderingCost;
    const holdCost = (quantity / 2) * holdingCost;
    const totalCost = purchaseCost + orderCost + holdCost;

    if (totalCost < optimalResult.totalAnnualCost) {
      optimalResult = {
        optimalQuantity: quantity,
        optimalPrice: bracket.discountedPrice,
        totalAnnualCost: Math.round(totalCost),
      };
    }
  }

  return optimalResult;
}
