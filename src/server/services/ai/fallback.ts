/**
 * AI 규칙 기반 폴백 서비스
 * Anthropic API 실패 시 데이터 기반 응답 생성
 */

import {
  executeGetInventoryStatus,
  executeGetReorderRecommendations,
  executeGetABCXYZAnalysis,
  executeGetDemandForecast,
  executeGetPurchaseOrderStatus,
  executeCalculateSafetyStock,
} from "./tools";

/**
 * 의도 분류 결과
 */
export interface IntentClassification {
  intent: IntentType;
  confidence: number;
  entities: {
    productId?: string;
    sku?: string;
    productName?: string;
    status?: string;
    grade?: string;
    urgency?: number;
  };
}

/**
 * 의도 타입
 */
export type IntentType =
  | "inventory_status" // 재고 상태 조회
  | "reorder_needed" // 발주 필요 품목
  | "abc_analysis" // ABC-XYZ 분석
  | "demand_forecast" // 수요 예측
  | "purchase_orders" // 발주 현황
  | "safety_stock" // 안전재고 계산
  | "help" // 도움말
  | "greeting" // 인사
  | "unknown"; // 분류 불가

/**
 * 키워드 기반 의도 분류
 */
const intentKeywords: Record<IntentType, string[]> = {
  inventory_status: [
    "재고",
    "현재고",
    "재고량",
    "재고 상태",
    "재고현황",
    "품절",
    "부족",
    "과잉",
    "재고가",
    "몇 개",
    "얼마나",
    "inventory",
    "stock",
  ],
  reorder_needed: [
    "발주",
    "주문",
    "발주 필요",
    "발주해야",
    "주문해야",
    "발주 추천",
    "발주량",
    "얼마나 주문",
    "reorder",
    "order",
    "purchase",
  ],
  abc_analysis: [
    "abc",
    "xyz",
    "등급",
    "분류",
    "분석",
    "매트릭스",
    "우선순위",
    "중요도",
    "analysis",
  ],
  demand_forecast: [
    "예측",
    "수요",
    "판매 예측",
    "미래",
    "앞으로",
    "다음 달",
    "forecast",
    "predict",
    "trend",
    "추세",
  ],
  purchase_orders: [
    "발주서",
    "발주 현황",
    "주문 현황",
    "발주 상태",
    "입고",
    "납품",
    "order status",
    "delivery",
  ],
  safety_stock: [
    "안전재고",
    "안전 재고",
    "버퍼",
    "safety",
    "buffer",
    "서비스 레벨",
    "service level",
  ],
  help: ["도움", "도와", "사용법", "기능", "뭘 할 수", "어떻게", "help", "?", "알려줘"],
  greeting: ["안녕", "하이", "hello", "hi", "반가워", "처음"],
  unknown: [],
};

/**
 * 제품 식별 패턴
 */
const productPatterns = [
  /제품\s*[:\s]?\s*['""]?([A-Za-z0-9\-_가-힣]+)['""]?/i,
  /SKU\s*[:\s]?\s*['""]?([A-Za-z0-9\-_]+)['""]?/i,
  /품목\s*[:\s]?\s*['""]?([A-Za-z0-9\-_가-힣]+)['""]?/i,
  /['""]([A-Za-z0-9\-_]+)['""].*(?:재고|발주|상태|분석)/i,
  /([A-Z]{2,5}-?\d{2,6})/i, // SKU 패턴 (예: AB-123, PRD001)
];

/**
 * 의도 분류
 */
export function classifyIntent(message: string): IntentClassification {
  const lowerMessage = message.toLowerCase();
  const entities: IntentClassification["entities"] = {};

  // 제품 식별
  for (const pattern of productPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const identifier = match[1].trim();
      // UUID 형식인지 확인
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)) {
        entities.productId = identifier;
      } else {
        entities.sku = identifier;
        entities.productName = identifier;
      }
      break;
    }
  }

  // 상태 식별
  if (lowerMessage.includes("품절") || lowerMessage.includes("out of stock")) {
    entities.status = "out_of_stock";
  } else if (lowerMessage.includes("위험") || lowerMessage.includes("critical")) {
    entities.status = "critical";
  } else if (lowerMessage.includes("부족") || lowerMessage.includes("shortage")) {
    entities.status = "shortage";
  } else if (lowerMessage.includes("과잉") || lowerMessage.includes("overstock")) {
    entities.status = "overstock";
  }

  // 등급 식별
  const gradeMatch = message.match(/([ABC])[\s-]?등급/i);
  if (gradeMatch) {
    entities.grade = gradeMatch[1].toUpperCase();
  }

  // 긴급도 식별
  if (lowerMessage.includes("긴급") || lowerMessage.includes("urgent")) {
    entities.urgency = 3;
  } else if (lowerMessage.includes("위험")) {
    entities.urgency = 2;
  }

  // 의도 분류
  let bestIntent: IntentType = "unknown";
  let bestScore = 0;

  for (const [intent, keywords] of Object.entries(intentKeywords)) {
    if (intent === "unknown") continue;

    let score = 0;
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        score += keyword.length; // 긴 키워드에 더 높은 점수
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent as IntentType;
    }
  }

  // 신뢰도 계산 (0-1)
  const confidence = Math.min(bestScore / 20, 1);

  return {
    intent: bestIntent,
    confidence,
    entities,
  };
}

/**
 * 규칙 기반 폴백 응답 생성
 */
export async function generateDataBasedFallback(message: string): Promise<{
  response: string;
  intent: IntentType;
  dataUsed: boolean;
}> {
  const classification = classifyIntent(message);
  const { intent, entities } = classification;

  try {
    switch (intent) {
      case "inventory_status":
        return await handleInventoryStatusIntent(entities);

      case "reorder_needed":
        return await handleReorderIntent(entities);

      case "abc_analysis":
        return await handleABCAnalysisIntent(entities);

      case "demand_forecast":
        return await handleDemandForecastIntent(entities);

      case "purchase_orders":
        return await handlePurchaseOrderIntent(entities);

      case "safety_stock":
        return await handleSafetyStockIntent(entities);

      case "help":
        return {
          response: generateHelpResponse(),
          intent,
          dataUsed: false,
        };

      case "greeting":
        return {
          response: generateGreetingResponse(),
          intent,
          dataUsed: false,
        };

      default:
        return {
          response: generateUnknownResponse(message),
          intent,
          dataUsed: false,
        };
    }
  } catch (error) {
    console.error("폴백 응답 생성 오류:", error);
    return {
      response: generateErrorResponse(),
      intent,
      dataUsed: false,
    };
  }
}

/**
 * 재고 상태 의도 처리
 */
async function handleInventoryStatusIntent(
  entities: IntentClassification["entities"]
): Promise<{ response: string; intent: IntentType; dataUsed: boolean }> {
  const result = await executeGetInventoryStatus({
    productId: entities.productId,
    sku: entities.sku,
    status: entities.status,
    limit: 10,
  });

  if (!result.success || !result.data) {
    return {
      response: "재고 정보 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      intent: "inventory_status",
      dataUsed: false,
    };
  }

  // 특정 제품 조회
  if (result.data.product) {
    const p = result.data.product;
    return {
      response: `**${p.name} (${p.sku}) 재고 현황**

| 항목 | 값 |
|------|-----|
| 현재고 | ${p.currentStock}개 |
| 안전재고 | ${p.safetyStock}개 |
| 발주점 | ${p.reorderPoint}개 |
| 재고상태 | ${p.statusLabel} |
| 재고일수 | ${p.daysOfStock !== null ? `${p.daysOfStock}일` : "계산 불가"} |
| 재고금액 | ${p.inventoryValue.toLocaleString()}원 |

**권장 조치**: ${p.recommendation}`,
      intent: "inventory_status",
      dataUsed: true,
    };
  }

  // 전체 현황 조회
  if (result.data.summary) {
    const s = result.data.summary;
    const statusFilter = entities.status ? ` (${entities.status} 필터 적용)` : "";

    let response = `**전체 재고 현황${statusFilter}**

| 상태 | 품목 수 |
|------|---------|
| 품절 | ${s.outOfStock}개 |
| 위험 | ${s.critical}개 |
| 부족 | ${s.shortage}개 |
| 주의 | ${s.caution}개 |
| 적정 | ${s.optimal}개 |
| 과다 | ${s.excess}개 |
| 과잉 | ${s.overstock}개 |

- **총 제품 수**: ${s.totalProducts}개
- **발주 필요**: ${s.needsReorderCount}개
- **총 재고금액**: ${s.totalValue.toLocaleString()}원`;

    if (result.data.products && result.data.products.length > 0) {
      response += `\n\n**제품 목록** (상위 ${result.data.products.length}개)\n`;
      response += result.data.products
        .map((p) => `- ${p.name} (${p.sku}): ${p.currentStock}개 - ${p.statusLabel}`)
        .join("\n");
    }

    return {
      response,
      intent: "inventory_status",
      dataUsed: true,
    };
  }

  return {
    response: "재고 정보를 조회할 수 없습니다.",
    intent: "inventory_status",
    dataUsed: false,
  };
}

/**
 * 발주 추천 의도 처리
 */
async function handleReorderIntent(
  entities: IntentClassification["entities"]
): Promise<{ response: string; intent: IntentType; dataUsed: boolean }> {
  const result = await executeGetReorderRecommendations({
    urgencyLevel: entities.urgency,
    abcGrade: entities.grade as "A" | "B" | "C" | undefined,
    limit: 10,
  });

  if (!result.success || !result.data) {
    return {
      response: "발주 추천 목록 조회 중 오류가 발생했습니다.",
      intent: "reorder_needed",
      dataUsed: false,
    };
  }

  const { summary, items } = result.data;

  if (items.length === 0) {
    return {
      response: "현재 발주가 필요한 품목이 없습니다. 재고가 적정 수준으로 유지되고 있습니다.",
      intent: "reorder_needed",
      dataUsed: true,
    };
  }

  let response = `**발주 추천 목록**

- 발주 필요 품목: **${summary.totalItemsNeedingReorder}개**
- 긴급 품목 (위험/품절): **${summary.urgentCount}개**
- 예상 발주금액: **${summary.totalEstimatedValue.toLocaleString()}원**

**상위 ${items.length}개 품목**:

| 우선순위 | 제품 | 현재고 | 추천 발주량 | 상태 |
|----------|------|--------|-------------|------|`;

  items.forEach((item, index) => {
    response += `\n| ${index + 1} | ${item.productName} (${item.sku}) | ${item.currentStock}개 | **${item.recommendedQty}개** | ${item.statusLabel} |`;
  });

  if (summary.urgentCount > 0) {
    response += `\n\n**긴급 조치 필요**: ${summary.urgentCount}개 품목이 위험 또는 품절 상태입니다. 즉시 발주를 검토하세요.`;
  }

  return {
    response,
    intent: "reorder_needed",
    dataUsed: true,
  };
}

/**
 * ABC 분석 의도 처리
 */
async function handleABCAnalysisIntent(
  entities: IntentClassification["entities"]
): Promise<{ response: string; intent: IntentType; dataUsed: boolean }> {
  const result = await executeGetABCXYZAnalysis({
    abcGrade: entities.grade as "A" | "B" | "C" | undefined,
    limit: 10,
  });

  if (!result.success || !result.data) {
    return {
      response: "ABC-XYZ 분석 결과 조회 중 오류가 발생했습니다.",
      intent: "abc_analysis",
      dataUsed: false,
    };
  }

  const { summary, recommendations } = result.data;

  let response = `**ABC-XYZ 분석 결과**

**ABC 등급 분포** (매출 기여도):
- A등급 (핵심 품목): ${summary.byABC["A"] || 0}개
- B등급 (중요 품목): ${summary.byABC["B"] || 0}개
- C등급 (일반 품목): ${summary.byABC["C"] || 0}개

**XYZ 등급 분포** (수요 변동성):
- X등급 (안정): ${summary.byXYZ["X"] || 0}개
- Y등급 (변동): ${summary.byXYZ["Y"] || 0}개
- Z등급 (불안정): ${summary.byXYZ["Z"] || 0}개

**복합 등급 매트릭스**:
| 등급 | 품목 수 | 비율 | 관리 전략 |
|------|---------|------|-----------|`;

  summary.matrix.forEach((m) => {
    response += `\n| ${m.grade} | ${m.count}개 | ${m.percentage}% | ${m.strategy} |`;
  });

  if (recommendations.length > 0) {
    response += "\n\n**권장사항**:\n";
    recommendations.forEach((r) => {
      response += `- ${r}\n`;
    });
  }

  return {
    response,
    intent: "abc_analysis",
    dataUsed: true,
  };
}

/**
 * 수요 예측 의도 처리
 */
async function handleDemandForecastIntent(
  entities: IntentClassification["entities"]
): Promise<{ response: string; intent: IntentType; dataUsed: boolean }> {
  if (!entities.productId && !entities.sku) {
    return {
      response: `수요 예측을 위해 제품을 지정해주세요.

예시:
- "제품 ABC-001의 수요 예측해줘"
- "SKU PRD-123 다음 달 판매 예측"

또는 **분석 > 시뮬레이션** 페이지에서 제품을 선택하여 상세 예측을 확인하실 수 있습니다.`,
      intent: "demand_forecast",
      dataUsed: false,
    };
  }

  const result = await executeGetDemandForecast({
    productId: entities.productId,
    sku: entities.sku,
    periods: 3,
  });

  if (!result.success || !result.data) {
    return {
      response: result.error || "수요 예측 중 오류가 발생했습니다.",
      intent: "demand_forecast",
      dataUsed: false,
    };
  }

  const { forecast, accuracy, historicalData, recommendation } = result.data;

  let trendLabel = "안정적";
  if (historicalData.trend === "increasing") trendLabel = "상승 추세";
  else if (historicalData.trend === "decreasing") trendLabel = "하락 추세";

  let response = `**${result.data.productName} (${result.data.sku}) 수요 예측**

**예측 방법**: ${forecast.method} (${forecast.methodDescription})

**향후 ${forecast.periods.length}개월 예측**:
| 기간 | 예측 판매량 |
|------|-------------|`;

  forecast.periods.forEach((p) => {
    response += `\n| ${p.label} | ${p.predictedQuantity}개 |`;
  });

  response += `

**예측 정확도**:
- MAPE: ${accuracy.mape}% (${accuracy.mapeLabel})
- 신뢰도: ${accuracy.confidence === "high" ? "높음" : accuracy.confidence === "medium" ? "보통" : "낮음"}

**과거 데이터**:
- 월평균 판매량: ${historicalData.avgMonthlySales}개
- 추세: ${trendLabel}

**권장사항**: ${recommendation}`;

  return {
    response,
    intent: "demand_forecast",
    dataUsed: true,
  };
}

/**
 * 발주 현황 의도 처리
 */
async function handlePurchaseOrderIntent(
  entities: IntentClassification["entities"]
): Promise<{ response: string; intent: IntentType; dataUsed: boolean }> {
  const result = await executeGetPurchaseOrderStatus({
    status: entities.status,
    limit: 5,
  });

  if (!result.success || !result.data) {
    return {
      response: "발주 현황 조회 중 오류가 발생했습니다.",
      intent: "purchase_orders",
      dataUsed: false,
    };
  }

  const { summary, orders } = result.data;

  let response = `**발주 현황**

- 총 발주서: ${summary.totalOrders}건
- 총 금액: ${summary.totalAmount.toLocaleString()}원

**상태별 현황**:
| 상태 | 건수 | 금액 |
|------|------|------|`;

  const statusLabels: Record<string, string> = {
    draft: "초안",
    approved: "승인됨",
    ordered: "발주완료",
    partially_received: "부분입고",
    received: "입고완료",
    cancelled: "취소됨",
  };

  for (const [status, data] of Object.entries(summary.byStatus)) {
    response += `\n| ${statusLabels[status] || status} | ${data.count}건 | ${data.amount.toLocaleString()}원 |`;
  }

  if (orders.length > 0) {
    response += `\n\n**최근 발주서** (${orders.length}건):\n`;
    orders.forEach((order) => {
      response += `- ${order.orderNumber}: ${order.statusLabel} | ${order.totalAmount.toLocaleString()}원 | ${order.supplierName || "공급자 미지정"}\n`;
    });
  }

  return {
    response,
    intent: "purchase_orders",
    dataUsed: true,
  };
}

/**
 * 안전재고 의도 처리
 */
async function handleSafetyStockIntent(
  entities: IntentClassification["entities"]
): Promise<{ response: string; intent: IntentType; dataUsed: boolean }> {
  if (!entities.productId && !entities.sku) {
    return {
      response: `안전재고 계산을 위해 제품을 지정해주세요.

예시:
- "제품 ABC-001의 안전재고 계산해줘"
- "SKU PRD-123 안전재고는?"

**안전재고 계산 공식**:
\`SS = Z x sqrt(LT x sigma_d^2 + d^2 x sigma_LT^2)\`

여기서:
- Z: 서비스 레벨에 대응하는 Z값 (95% = 1.65)
- LT: 평균 리드타임 (일)
- sigma_d: 일별 수요 표준편차
- sigma_LT: 리드타임 표준편차`,
      intent: "safety_stock",
      dataUsed: false,
    };
  }

  const result = await executeCalculateSafetyStock({
    productId: entities.productId,
    sku: entities.sku,
  });

  if (!result.success || !result.data) {
    return {
      response: result.error || "안전재고 계산 중 오류가 발생했습니다.",
      intent: "safety_stock",
      dataUsed: false,
    };
  }

  const data = result.data;

  const response = `**${data.productName} (${data.sku}) 안전재고 계산 결과**

| 항목 | 값 |
|------|-----|
| 계산된 안전재고 | **${data.calculatedSafetyStock}개** |
| 현재 설정값 | ${data.currentSafetyStock}개 |
| 서비스 레벨 | ${(data.serviceLevel * 100).toFixed(0)}% |
| Z값 | ${data.zScore.toFixed(2)} |
| 계산 방식 | ${data.method} |

**입력 데이터**:
- 일평균 판매량: ${data.inputs.avgDailySales}개
- 수요 표준편차: ${data.inputs.demandStdDev}개
- 리드타임: ${data.inputs.leadTimeDays}일

**권장사항**: ${data.recommendation}`;

  return {
    response,
    intent: "safety_stock",
    dataUsed: true,
  };
}

/**
 * 도움말 응답
 */
function generateHelpResponse(): string {
  return `**FloStok AI 어시스턴트입니다.**

다음과 같은 질문을 하실 수 있습니다:

**재고 관리**
- "현재 재고 상태 알려줘"
- "품절된 제품은?"
- "제품 ABC-001 재고 상태"

**발주 관리**
- "발주가 필요한 제품은?"
- "긴급 발주 필요 품목"
- "발주 현황 보여줘"

**분석**
- "ABC-XYZ 분석 결과"
- "A등급 제품 목록"
- "제품 ABC-001 수요 예측"

**안전재고**
- "제품 ABC-001 안전재고 계산"
- "안전재고 공식 설명"

원하시는 기능을 말씀해주세요!`;
}

/**
 * 인사 응답
 */
function generateGreetingResponse(): string {
  return `안녕하세요! FloStok AI 어시스턴트입니다.

재고 관리, 발주 추천, ABC-XYZ 분석, 수요 예측 등 다양한 SCM 업무를 도와드릴 수 있습니다.

어떤 도움이 필요하신가요? "도움말"이라고 입력하시면 사용 가능한 기능을 안내해드립니다.`;
}

/**
 * 알 수 없는 의도 응답
 */
function generateUnknownResponse(_message: string): string {
  return `말씀하신 내용을 정확히 이해하지 못했습니다.

다음과 같은 질문을 시도해보세요:
- "현재 재고 상태는?"
- "발주 필요한 품목 알려줘"
- "ABC 분석 결과 보여줘"
- "제품 ABC-001 수요 예측해줘"

또는 메뉴에서 직접 원하시는 기능을 이용하실 수 있습니다:
- **대시보드**: 전체 현황 요약
- **발주**: 발주 추천 및 관리
- **분석**: ABC-XYZ, 재고회전율, KPI`;
}

/**
 * 에러 응답
 */
function generateErrorResponse(): string {
  return `죄송합니다. 요청 처리 중 오류가 발생했습니다.

잠시 후 다시 시도하시거나, 메뉴에서 직접 기능을 이용해주세요.

지속적인 문제 발생 시 관리자에게 문의해주세요.`;
}
