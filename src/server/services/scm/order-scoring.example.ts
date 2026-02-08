/**
 * 발주 스코어링 서비스 사용 예시
 */

import {
  calculateOrderScore,
  calculateOrderScoreList,
  getUrgentOrders,
  type OrderScoringListItem,
} from "./order-scoring";

// ==============================================
// 예시 1: 단일 제품 발주 점수 계산
// ==============================================

export function example1_singleProduct() {
  const result = calculateOrderScore({
    currentStock: 0, // 품절
    safetyStock: 100,
    reorderPoint: 200,
    abcGrade: "A", // A등급 제품
    leadTimeDays: 14, // 2주 리드타임
    recentSales: 150, // 최근 4주 평균
    previousSales: 100, // 이전 4주 평균
  });

  console.log("=== 예시 1: 단일 제품 발주 점수 ===");
  console.log(`총점: ${result.totalScore}점`);
  console.log(`우선순위: ${result.priorityLevel}`);
  console.log(`권장 조치: ${result.recommendation}`);
  console.log("\n세부 점수:");
  console.log(`- 재고 긴급도: ${result.breakdown.inventoryUrgency}점`);
  console.log(`- ABC 등급: ${result.breakdown.abcScore}점`);
  console.log(`- 판매 추세: ${result.breakdown.salesTrend}점`);
  console.log(`- 리드타임 리스크: ${result.breakdown.leadTimeRisk}점`);
}

// ==============================================
// 예시 2: 여러 제품 발주 우선순위 계산
// ==============================================

export function example2_multipleProducts() {
  const products: OrderScoringListItem[] = [
    {
      productId: "P001",
      productName: "프리미엄 커피 원두",
      currentStock: 0,
      safetyStock: 50,
      reorderPoint: 100,
      abcGrade: "A",
      leadTimeDays: 7,
      recentSales: 120,
      previousSales: 100,
    },
    {
      productId: "P002",
      productName: "일반 커피 믹스",
      currentStock: 300,
      safetyStock: 200,
      reorderPoint: 400,
      abcGrade: "B",
      leadTimeDays: 5,
      recentSales: 80,
      previousSales: 90,
    },
    {
      productId: "P003",
      productName: "디카페인 커피",
      currentStock: 150,
      safetyStock: 100,
      reorderPoint: 150,
      abcGrade: "C",
      leadTimeDays: 14,
      recentSales: 20,
      previousSales: 25,
    },
    {
      productId: "P004",
      productName: "에스프레소 머신",
      currentStock: 5,
      safetyStock: 10,
      reorderPoint: 20,
      abcGrade: "A",
      leadTimeDays: 30,
      recentSales: 8,
      previousSales: 5,
    },
  ];

  const results = calculateOrderScoreList(products);

  console.log("\n=== 예시 2: 여러 제품 발주 우선순위 ===\n");

  results.forEach((item) => {
    console.log(`${item.rank}위. ${item.productName}`);
    console.log(`   제품 ID: ${item.productId}`);
    console.log(`   총점: ${item.scoring.totalScore}점 (${item.scoring.priorityLevel})`);
    console.log(`   현재고: ${item.currentStock}개`);
    console.log(`   발주점: ${item.reorderPoint}개`);
    console.log(`   권장 조치: ${item.scoring.recommendation}`);
    console.log("");
  });
}

// ==============================================
// 예시 3: 긴급/우선 발주 목록만 추출
// ==============================================

export function example3_urgentOrders() {
  const products: OrderScoringListItem[] = [
    {
      productId: "P001",
      productName: "프리미엄 커피 원두",
      currentStock: 0,
      safetyStock: 50,
      reorderPoint: 100,
      abcGrade: "A",
      leadTimeDays: 7,
    },
    {
      productId: "P002",
      productName: "일반 커피 믹스",
      currentStock: 300,
      safetyStock: 200,
      reorderPoint: 400,
      abcGrade: "B",
      leadTimeDays: 5,
    },
    {
      productId: "P003",
      productName: "에스프레소 머신",
      currentStock: 5,
      safetyStock: 10,
      reorderPoint: 20,
      abcGrade: "A",
      leadTimeDays: 30,
    },
  ];

  const allResults = calculateOrderScoreList(products);
  const urgentOrders = getUrgentOrders(allResults);

  console.log("\n=== 예시 3: 긴급/우선 발주 목록 ===\n");
  console.log(`전체 제품: ${allResults.length}개`);
  console.log(`긴급/우선 발주 필요: ${urgentOrders.length}개\n`);

  urgentOrders.forEach((item) => {
    console.log(`⚠️ ${item.productName}`);
    console.log(`   점수: ${item.scoring.totalScore}점 (${item.scoring.priorityLevel})`);
    console.log(`   ${item.scoring.recommendation}\n`);
  });
}

// ==============================================
// 예시 4: 판매 추세에 따른 점수 변화
// ==============================================

export function example4_salesTrendImpact() {
  const baseInput = {
    productId: "P001",
    productName: "테스트 제품",
    currentStock: 150,
    safetyStock: 100,
    reorderPoint: 200,
    abcGrade: "B" as const,
    leadTimeDays: 7,
    previousSales: 100,
  };

  console.log("\n=== 예시 4: 판매 추세 영향 ===\n");

  const scenarios = [
    { label: "50% 감소", recentSales: 50 },
    { label: "변화 없음", recentSales: 100 },
    { label: "50% 증가", recentSales: 150 },
    { label: "100% 증가", recentSales: 200 },
  ];

  scenarios.forEach(({ label, recentSales }) => {
    const result = calculateOrderScore({ ...baseInput, recentSales });
    console.log(`${label}:`);
    console.log(`  판매추세 점수: ${result.breakdown.salesTrend}점`);
    console.log(`  총점: ${result.totalScore}점`);
    console.log("");
  });
}

// ==============================================
// 예시 5: 실제 발주 추천 워크플로우
// ==============================================

export function example5_orderWorkflow() {
  // 1. DB에서 모든 제품 정보 조회 (실제로는 DB 쿼리)
  const allProducts: OrderScoringListItem[] = [
    {
      productId: "P001",
      productName: "제품 A",
      currentStock: 10,
      safetyStock: 100,
      reorderPoint: 200,
      abcGrade: "A",
      leadTimeDays: 7,
      recentSales: 120,
      previousSales: 100,
    },
    {
      productId: "P002",
      productName: "제품 B",
      currentStock: 350,
      safetyStock: 200,
      reorderPoint: 400,
      abcGrade: "B",
      leadTimeDays: 5,
      recentSales: 80,
      previousSales: 90,
    },
    {
      productId: "P003",
      productName: "제품 C",
      currentStock: 500,
      safetyStock: 100,
      reorderPoint: 150,
      abcGrade: "C",
      leadTimeDays: 3,
      recentSales: 20,
      previousSales: 25,
    },
  ];

  console.log("\n=== 예시 5: 실제 발주 추천 워크플로우 ===\n");

  // 2. 모든 제품 점수 계산 및 정렬
  const scoredProducts = calculateOrderScoreList(allProducts);

  // 3. 발주 필요 제품 필터링 (현재고 <= 발주점)
  const needsReorder = scoredProducts.filter((item) => item.currentStock <= item.reorderPoint);

  console.log(`전체 제품: ${allProducts.length}개`);
  console.log(`발주 필요 제품: ${needsReorder.length}개\n`);

  // 4. 우선순위별 그룹화
  const urgent = needsReorder.filter((item) => item.scoring.priorityLevel === "urgent");
  const high = needsReorder.filter((item) => item.scoring.priorityLevel === "high");
  const normal = needsReorder.filter((item) => item.scoring.priorityLevel === "normal");

  console.log(`📌 긴급 발주 (금일): ${urgent.length}개`);
  urgent.forEach((item) => {
    console.log(`   - ${item.productName} (${item.scoring.totalScore}점)`);
  });

  console.log(`\n⚡ 우선 발주 (1-2일 내): ${high.length}개`);
  high.forEach((item) => {
    console.log(`   - ${item.productName} (${item.scoring.totalScore}점)`);
  });

  console.log(`\n✓ 정상 발주 (다음 발주일): ${normal.length}개`);
  normal.forEach((item) => {
    console.log(`   - ${item.productName} (${item.scoring.totalScore}점)`);
  });

  // 5. 발주서 생성 (실제로는 DB INSERT)
  console.log("\n→ 발주서 생성 대상: 긴급 + 우선 발주 제품");
  console.log(`   총 ${urgent.length + high.length}개 제품`);
}

// ==============================================
// 실행
// ==============================================

if (require.main === module) {
  example1_singleProduct();
  example2_multipleProducts();
  example3_urgentOrders();
  example4_salesTrendImpact();
  example5_orderWorkflow();
}
