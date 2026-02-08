/**
 * 수요예측 모듈 사용 예시
 *
 * 이 파일은 실제 프로덕션 코드가 아니며,
 * 개발/테스트 중 참고용으로 사용됩니다.
 */

import {
  forecastDemand,
  simpleForecast,
  backtestForecast,
  forecastDemandWithMethod,
} from "./index";

// ============================================================
// 예시 1: 안정적 수요 제품 (X등급)
// ============================================================
console.log("=== 예시 1: 안정 수요 (X등급) ===");

const stableDemand = [100, 105, 102, 108, 110, 107, 112, 115, 113, 118, 120, 117];

const result1 = forecastDemand({
  history: stableDemand.map((value, i) => ({
    date: new Date(2024, i, 1),
    value,
  })),
  periods: 3,
  xyzGrade: "X",
});

console.log("방법:", result1.method);
console.log("파라미터:", result1.parameters);
console.log("예측값:", result1.forecast);
console.log("MAPE:", result1.mape);
console.log("신뢰도:", result1.confidence);
console.log("");

// ============================================================
// 예시 2: 변동 수요 제품 (Y등급)
// ============================================================
console.log("=== 예시 2: 변동 수요 (Y등급) ===");

const variableDemand = [80, 120, 90, 150, 100, 140, 95, 160, 110, 155, 105, 165];

const result2 = simpleForecast(variableDemand, 3, "Y");
console.log("예측값 (간편 API):", result2);
console.log("");

// ============================================================
// 예시 3: 추세가 있는 데이터
// ============================================================
console.log("=== 예시 3: 추세 있는 데이터 ===");

const trendingDemand = [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160];

const result3 = forecastDemand({
  history: trendingDemand.map((value, i) => ({
    date: new Date(2024, i, 1),
    value,
  })),
  periods: 3,
});

console.log("방법:", result3.method);
console.log("예측값:", result3.forecast);
console.log("(추세 반영 시 증가 추세가 예측값에 반영됨)");
console.log("");

// ============================================================
// 예시 4: 데이터 부족 (3개월 미만)
// ============================================================
console.log("=== 예시 4: 데이터 부족 ===");

const limitedData = [100, 110];

const result4 = simpleForecast(limitedData, 3);
console.log("예측값:", result4);
console.log("(데이터 부족 시 SMA 사용, 평균값 반복)");
console.log("");

// ============================================================
// 예시 5: 백테스팅 (정확도 측정)
// ============================================================
console.log("=== 예시 5: 백테스팅 ===");

const fullHistory = [100, 105, 102, 108, 110, 107, 112, 115, 113, 118, 120, 117];

const accuracy = backtestForecast(fullHistory, 3);
console.log("MAPE:", accuracy.mape, "%");
console.log("MAE:", accuracy.mae);
console.log("RMSE:", accuracy.rmse);
console.log("신뢰도:", accuracy.confidence);
console.log("");

// ============================================================
// 예시 6: 수동 방법 지정
// ============================================================
console.log("=== 예시 6: 수동 방법 지정 ===");

const history = [100, 110, 105, 115, 120, 118];

// SMA (3개월 윈도우)
const smaResult = forecastDemandWithMethod(history, 3, "SMA", { windowSize: 3 });
console.log("SMA 예측:", smaResult.forecast);

// SES (alpha=0.5)
const sesResult = forecastDemandWithMethod(history, 3, "SES", { alpha: 0.5 });
console.log("SES 예측:", sesResult.forecast);

// Holt's (추세 반영)
const holtsResult = forecastDemandWithMethod(history, 3, "Holts", { alpha: 0.3, beta: 0.1 });
console.log("Holt's 예측:", holtsResult.forecast);
console.log("");

// ============================================================
// 예시 7: 실무 시나리오 - 제품별 최적 예측
// ============================================================
console.log("=== 예시 7: 실무 시나리오 ===");

interface Product {
  id: string;
  name: string;
  salesHistory: number[];
  xyzGrade: "X" | "Y" | "Z";
}

const products: Product[] = [
  {
    id: "P001",
    name: "안정 수요 제품",
    salesHistory: [100, 102, 101, 103, 105, 104, 106, 108, 107, 109, 110, 109],
    xyzGrade: "X",
  },
  {
    id: "P002",
    name: "변동 수요 제품",
    salesHistory: [80, 120, 90, 150, 100, 140, 95, 160, 110, 155, 105, 165],
    xyzGrade: "Y",
  },
  {
    id: "P003",
    name: "불규칙 수요 제품",
    salesHistory: [10, 200, 5, 180, 15, 220, 8, 190, 12, 210, 6, 200],
    xyzGrade: "Z",
  },
];

console.log("제품별 예측 결과:");
products.forEach((product) => {
  const forecast = simpleForecast(product.salesHistory, 3, product.xyzGrade);
  console.log(`${product.name} (${product.xyzGrade}):`, forecast);
});

console.log("\n수요예측 예시 완료!");
