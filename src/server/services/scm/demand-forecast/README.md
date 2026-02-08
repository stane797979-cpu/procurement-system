# 수요예측 모듈

AI 기반 재고 관리 시스템의 핵심 수요예측 엔진.

## 개요

이 모듈은 제품의 과거 판매 데이터를 분석하여 미래 수요를 예측합니다.
XYZ 등급, 데이터 기간, 추세 등을 자동으로 분석하여 최적의 예측 방법을 선택합니다.

## 지원하는 예측 방법

### 1. SMA (Simple Moving Average) - 단순이동평균
- **공식**: 최근 N개 데이터의 평균
- **적합**: 안정 수요, 데이터 부족 시
- **최소 데이터**: 1개월

### 2. SES (Simple Exponential Smoothing) - 단순지수평활
- **공식**: F(t+1) = α × D(t) + (1-α) × F(t)
- **특징**: α 자동 최적화 (Grid Search)
- **적합**: X, Y 등급 (안정~중간 변동)
- **최소 데이터**: 3개월

### 3. Holt's Method - 이중지수평활
- **공식**: 수준 + 추세 동시 평활
- **특징**: α, β 자동 최적화
- **적합**: 추세가 있는 데이터
- **최소 데이터**: 6개월

## 사용 예시

### 기본 사용법 (자동 방법 선택)

```typescript
import { forecastDemand } from "@/server/services/scm/demand-forecast";

// 과거 12개월 판매 데이터
const salesHistory = [
  { date: new Date(2024, 0, 1), value: 100 },
  { date: new Date(2024, 1, 1), value: 110 },
  { date: new Date(2024, 2, 1), value: 105 },
  // ... 12개월 데이터
];

// 향후 3개월 예측
const result = forecastDemand({
  history: salesHistory,
  periods: 3,
  xyzGrade: "X", // 선택 사항
});

console.log(result);
// {
//   method: "SES",
//   parameters: { alpha: 0.3, lastSmoothed: 108.5 },
//   forecast: [108, 108, 108],
//   mape: 12.5,
//   confidence: "high"
// }
```

### 간편 API (숫자 배열)

```typescript
import { simpleForecast } from "@/server/services/scm/demand-forecast";

const history = [100, 110, 105, 115, 120, 118, 125, 130, 128, 135, 140, 138];
const forecast = simpleForecast(history, 3);

console.log(forecast); // [138, 138, 138]
```

### 수동 방법 지정

```typescript
import { forecastDemandWithMethod } from "@/server/services/scm/demand-forecast";

// SES 방법 직접 지정
const result = forecastDemandWithMethod(
  [100, 110, 105, 115, 120],
  3, // 예측 기간
  "SES", // 방법
  { alpha: 0.5 } // 파라미터
);
```

### 백테스팅 (정확도 측정)

```typescript
import { backtestForecast } from "@/server/services/scm/demand-forecast";

const history = [100, 110, 105, 115, 120, 118, 125, 130, 128, 135, 140, 138];

// 마지막 3개월을 테스트 셋으로 사용
const accuracy = backtestForecast(history, 3);

console.log(accuracy);
// {
//   mape: 8.5,  // 8.5% 오차
//   mae: 10.2,
//   rmse: 12.3,
//   confidence: "high"
// }
```

## XYZ 등급별 권장 방법

| XYZ 등급 | 변동계수 (CV) | 권장 방법 | Alpha 값 |
|---------|--------------|----------|---------|
| X (안정) | < 0.5 | SES | 0.2 (낮음) |
| Y (변동) | 0.5 ~ 1.0 | SES / Holt's | 0.4 (중간) |
| Z (불규칙) | ≥ 1.0 | SMA + 높은 안전재고 | 0.6 (높음) |

## 데이터 요구사항

| 데이터 기간 | 사용 가능 방법 | 권장 사항 |
|-----------|--------------|----------|
| 0~3개월 | SMA | 유사 제품 참조 |
| 3~6개월 | SMA, SES | 기초 분석 가능 |
| 6~12개월 | 전체 | 충분한 분석 |
| 12개월+ | 전체 + 계절성 | 정교한 예측 |

## 정확도 해석 (MAPE)

| MAPE 범위 | 평가 | 조치 |
|----------|------|------|
| < 10% | 매우 우수 | 자동 발주 높은 신뢰 |
| 10~20% | 양호 | 표준 운영 |
| 20~30% | 보통 | 안전재고 상향 |
| 30~50% | 부정확 | 방법 재검토 필요 |
| > 50% | 부적합 | 전문가 판단 우선 |

## 자동 방법 선택 로직

```
1. 데이터 개월 수 확인
   ├─ < 3개월 → SMA
   ├─ 3~6개월 → SES
   └─ 6개월+ → 교차 검증

2. 추세 검출 (선형 회귀)
   └─ 추세 있으면 → Holt's 고려

3. XYZ 등급 고려
   ├─ X (안정) → SES (α=0.2)
   ├─ Y (변동) → SES (α=0.4) or Holt's
   └─ Z (불규칙) → SMA + 높은 안전재고

4. 교차 검증 (데이터 충분 시)
   └─ 복수 방법 비교 → MAPE 최소 선택
```

## API 레퍼런스

### forecastDemand(input)

자동 방법 선택으로 수요 예측 실행.

**Parameters:**
- `input.history`: 판매 이력 (TimeSeriesDataPoint[])
- `input.periods`: 예측 기간 수
- `input.xyzGrade`: XYZ 등급 (선택)

**Returns:** ForecastResult

### simpleForecast(history, periods, xyzGrade?)

간편 예측 API (숫자 배열 입력).

**Parameters:**
- `history`: 판매 수량 배열
- `periods`: 예측 기간 (기본: 3)
- `xyzGrade`: XYZ 등급 (선택)

**Returns:** number[]

### backtestForecast(history, forecastPeriods, method?)

과거 데이터로 예측 정확도 평가.

**Returns:** AccuracyMetrics

## 디렉토리 구조

```
demand-forecast/
├── index.ts                  # 메인 진입점
├── types.ts                  # 타입 정의
├── selector.ts               # 자동 방법 선택
├── methods/
│   ├── simple-moving-average.ts
│   ├── exponential-smoothing.ts
│   └── holts-method.ts
└── accuracy/
    └── metrics.ts            # MAPE, MAE, RMSE
```

## 향후 확장 계획

- [ ] Holt-Winters (삼중지수평활, 계절성)
- [ ] SARIMA (계절성 ARIMA)
- [ ] 신뢰구간 계산
- [ ] 앙상블 예측
- [ ] 머신러닝 기반 예측 (XGBoost, LSTM)

## 참고

- 설계 문서: `.claude/design/DEMAND_FORECAST_DESIGN.md`
- SCM 도메인: `.claude/agents/scm-expert.md`
