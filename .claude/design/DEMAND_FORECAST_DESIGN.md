# 수요예측 및 공급계획 설계서

> 작성일: 2026-02-06
> 버전: 1.0
> 목적: 비즈니스 특성에 맞는 수요예측 및 공급계획 산출 체계 수립

---

## 1. 설계 철학

### 1.1 핵심 원칙

```
"비즈니스마다 상품 크기, 계절성, 제품성, 주기, 리드타임 등 다양하기 때문에
구분 후 산출되어야 한다"
```

이 원칙에 따라 수요예측 시스템은 다음을 지원해야 합니다:

| 원칙 | 설명 | 적용 방법 |
|------|------|----------|
| **자동 방법 선택** | 제품 특성에 맞는 예측 방법 자동 결정 | XYZ/계절성/데이터 기반 알고리즘 |
| **다중 방법 비교** | 여러 방법 결과를 비교하여 최적 선택 | MAPE 기반 자동 선택 |
| **계절성 반영** | 한국 특유의 계절성 패턴 반영 | 설날, 추석, 여름 시즌 등 |
| **리드타임 연동** | 리드타임에 따른 예측 기간 자동 조정 | 장리드타임 = 장기 예측 |
| **실시간 보정** | 실제 판매와 예측 차이 지속 분석 | 예측 정확도 모니터링 |

### 1.2 시스템 목표

```
┌─────────────────────────────────────────────────────────────────┐
│                         수요예측 엔진                            │
├─────────────────────────────────────────────────────────────────┤
│  입력                                                            │
│  ├── 판매 이력 (일/주/월별)                                     │
│  ├── 제품 속성 (ABC, XYZ, 카테고리, 계절성 플래그)              │
│  ├── 외부 요인 (프로모션, 가격변동, 이벤트)                     │
│  └── 공급 제약 (리드타임, MOQ, 공급 능력)                       │
├─────────────────────────────────────────────────────────────────┤
│  처리                                                            │
│  ├── 1. 데이터 정제 및 이상치 처리                              │
│  ├── 2. 계절성/트렌드 분해                                      │
│  ├── 3. 복수 방법 병렬 예측                                     │
│  ├── 4. 교차 검증 및 정확도 평가                                │
│  └── 5. 최적 방법 선택 및 앙상블                                │
├─────────────────────────────────────────────────────────────────┤
│  출력                                                            │
│  ├── 기간별 수요 예측값                                          │
│  ├── 신뢰구간 (상한/하한)                                        │
│  ├── 예측 정확도 (MAPE, MAE)                                     │
│  └── 권장 발주량 및 발주 시점                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 수요예측 방법론

### 2.1 정량적 예측 방법

#### 2.1.1 이동평균법 (Moving Average)

**단순이동평균 (Simple Moving Average, SMA)**

```
SMA(t) = (D(t-1) + D(t-2) + ... + D(t-n)) / n

- D(t-i): i기간 전 실제 수요
- n: 이동평균 기간 (3, 6, 12개월 등)
```

| 기간 | 특성 | 적합 상황 |
|------|------|----------|
| 3개월 | 민감, 최신 변화 반영 빠름 | 빠르게 변하는 시장, 신제품 |
| 6개월 | 중간 | 일반적인 제품 |
| 12개월 | 안정, 노이즈 제거 | 안정적 수요, 계절성 평활 |

**가중이동평균 (Weighted Moving Average, WMA)**

```
WMA(t) = Σ(w(i) × D(t-i)) / Σw(i)

- w(i): i기간 전 데이터의 가중치
- 최근 데이터에 높은 가중치 부여

예시 (3개월, 가중치 3:2:1):
WMA = (3×D(t-1) + 2×D(t-2) + 1×D(t-3)) / 6
```

**장점**: 구현 간단, 직관적
**단점**: 추세/계절성 미반영, 과거 데이터 동일 가중

---

#### 2.1.2 지수평활법 (Exponential Smoothing)

**단순지수평활 (Simple Exponential Smoothing, SES)**

```
F(t+1) = α × D(t) + (1-α) × F(t)

- F(t+1): 다음 기간 예측
- D(t): 현재 기간 실제 수요
- F(t): 현재 기간 예측
- α: 평활 계수 (0 < α < 1)
```

| α 값 | 특성 | 적합 상황 |
|------|------|----------|
| 0.1~0.2 | 안정적, 과거 반영 많음 | 안정 수요 (X등급) |
| 0.3~0.5 | 중간 | 일반 제품 (Y등급) |
| 0.5~0.8 | 민감, 최근 반영 많음 | 변동 수요 (Z등급) |

**α 자동 최적화**: MAPE 최소화하는 α 값을 Grid Search로 탐색

```typescript
function optimizeAlpha(history: number[]): number {
  const alphaRange = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
  let bestAlpha = 0.3;
  let bestMAPE = Infinity;

  for (const alpha of alphaRange) {
    const mape = calculateMAPE(history, alpha);
    if (mape < bestMAPE) {
      bestMAPE = mape;
      bestAlpha = alpha;
    }
  }
  return bestAlpha;
}
```

---

**이중지수평활 - Holt's 방법 (Double Exponential Smoothing)**

트렌드(추세)가 있는 데이터에 적합

```
수준: L(t) = α × D(t) + (1-α) × (L(t-1) + T(t-1))
추세: T(t) = β × (L(t) - L(t-1)) + (1-β) × T(t-1)
예측: F(t+m) = L(t) + m × T(t)

- L(t): 시점 t의 수준
- T(t): 시점 t의 추세
- α: 수준 평활 계수 (0 < α < 1)
- β: 추세 평활 계수 (0 < β < 1)
- m: 예측 기간 수
```

| 파라미터 | 일반적 범위 | 영향 |
|---------|------------|------|
| α | 0.2~0.5 | 높을수록 최근 수준 반영 |
| β | 0.1~0.3 | 높을수록 최근 추세 반영 |

---

**삼중지수평활 - Holt-Winters 방법 (Triple Exponential Smoothing)**

트렌드 + 계절성을 모두 반영

```
수준:   L(t) = α × (D(t) / S(t-s)) + (1-α) × (L(t-1) + T(t-1))
추세:   T(t) = β × (L(t) - L(t-1)) + (1-β) × T(t-1)
계절성: S(t) = γ × (D(t) / L(t)) + (1-γ) × S(t-s)
예측:   F(t+m) = (L(t) + m × T(t)) × S(t+m-s)

- S(t): 시점 t의 계절 지수
- s: 계절 주기 (12개월 = 1년)
- γ: 계절성 평활 계수 (0 < γ < 1)
```

**데이터 요구사항**: 최소 2개 시즌 (24개월) 데이터 필요

| 유형 | 모델 | 적합 상황 |
|------|------|----------|
| 승법 (Multiplicative) | S(t) × 기준값 | 계절 변동이 수준에 비례 |
| 가법 (Additive) | S(t) + 기준값 | 계절 변동이 일정 |

---

#### 2.1.3 고급 시계열 방법

**ARIMA (AutoRegressive Integrated Moving Average)**

```
ARIMA(p, d, q)

- p: 자기회귀 차수 (AR)
- d: 차분 차수 (I, 정상성 확보)
- q: 이동평균 차수 (MA)

계절성 ARIMA: SARIMA(p, d, q)(P, D, Q)s
- P, D, Q: 계절성 파라미터
- s: 계절 주기
```

**장점**: 복잡한 패턴 포착 가능
**단점**: 파라미터 튜닝 어려움, 계산 비용 높음
**권장**: 데이터 과학자가 있는 조직, 고가치 제품

---

### 2.2 정성적 예측 방법

시스템에서 지원하는 수동 조정 기능

| 방법 | 설명 | 시스템 지원 |
|------|------|------------|
| **전문가 판단** | 담당자의 시장 지식 반영 | 예측값 수동 오버라이드 |
| **시장 조사** | 고객 설문, 시장 분석 반영 | 외부 입력 필드 |
| **프로모션 효과** | 할인, 광고 효과 추정 | 이벤트 태깅 + 계수 입력 |
| **신제품 유사 분석** | 유사 제품 판매 패턴 적용 | 참조 제품 선택 기능 |

---

## 3. 제품 특성별 예측 방법 선택

### 3.1 XYZ 등급별 권장 방법

XYZ 분석의 변동계수(CV)에 따른 방법 선택

```
┌─────────────────────────────────────────────────────────────────┐
│                     XYZ 기반 방법 선택 매트릭스                   │
├─────────┬─────────────────────────────────────────────────────────┤
│ X등급   │ CV < 0.5 (안정 수요)                                    │
│ (안정)  │ ├── 1순위: 단순지수평활 (α = 0.1~0.3)                   │
│         │ ├── 2순위: 이동평균 (12개월)                            │
│         │ └── 특징: 높은 예측 정확도 기대 (MAPE < 15%)            │
├─────────┼─────────────────────────────────────────────────────────┤
│ Y등급   │ 0.5 ≤ CV < 1.0 (변동 수요)                              │
│ (변동)  │ ├── 1순위: 가중이동평균 또는 Holt's                     │
│         │ ├── 2순위: 지수평활 (α = 0.3~0.5)                       │
│         │ └── 특징: 중간 정확도 (MAPE 15~30%)                     │
├─────────┼─────────────────────────────────────────────────────────┤
│ Z등급   │ CV ≥ 1.0 (불규칙 수요)                                  │
│ (불규칙)│ ├── 1순위: 다중 방법 앙상블                             │
│         │ ├── 2순위: 최근 N기간 평균 + 높은 안전재고              │
│         │ ├── 3순위: 전문가 판단 우선                             │
│         │ └── 특징: 낮은 정확도 예상 (MAPE > 30%), 안전재고 확대  │
└─────────┴─────────────────────────────────────────────────────────┘
```

### 3.2 계절성 유무에 따른 선택

```
┌───────────────────────────────────────────────────────────────────┐
│                    계절성 기반 방법 선택                           │
├─────────────────────┬─────────────────────────────────────────────┤
│ 계절성 없음         │ ├── 단순지수평활 (SES)                      │
│ (계절지수 CV < 0.1) │ ├── 이동평균                                │
│                     │ └── Holt's (추세만 있는 경우)               │
├─────────────────────┼─────────────────────────────────────────────┤
│ 약한 계절성         │ ├── 계절 지수 조정 + SES                    │
│ (0.1 ≤ CV < 0.3)   │ └── 가중이동평균 (계절 가중치)              │
├─────────────────────┼─────────────────────────────────────────────┤
│ 강한 계절성         │ ├── Holt-Winters (2년+ 데이터 시)           │
│ (CV ≥ 0.3)         │ ├── 계절 분해 후 개별 예측                  │
│                     │ └── SARIMA (데이터 충분 시)                 │
└─────────────────────┴─────────────────────────────────────────────┘
```

### 3.3 데이터 기간에 따른 선택

```
┌───────────────────────────────────────────────────────────────────┐
│                   데이터 기간별 방법 선택                          │
├──────────────┬────────────────────────────────────────────────────┤
│ 0~3개월      │ 데이터 불충분                                       │
│              │ ├── 유사 제품 참조 (Analogous Forecasting)         │
│              │ ├── 전문가 판단                                     │
│              │ └── 단순 평균 + 높은 안전재고                       │
├──────────────┼────────────────────────────────────────────────────┤
│ 3~6개월      │ 기초 분석 가능                                      │
│              │ ├── 3개월 이동평균                                  │
│              │ ├── 지수평활 (α = 0.3~0.5)                         │
│              │ └── 트렌드 분석 시작                                │
├──────────────┼────────────────────────────────────────────────────┤
│ 6~12개월     │ 충분한 분석 가능                                    │
│              │ ├── 모든 지수평활 방법 사용 가능                    │
│              │ ├── 기초 계절성 분석 가능                           │
│              │ └── XYZ 분류 신뢰도 향상                            │
├──────────────┼────────────────────────────────────────────────────┤
│ 12~24개월    │ 계절성 분석 가능                                    │
│              │ ├── Holt-Winters 가능                               │
│              │ ├── 연간 계절 지수 계산                             │
│              │ └── 정교한 예측 가능                                │
├──────────────┼────────────────────────────────────────────────────┤
│ 24개월 이상  │ 고급 분석 가능                                      │
│              │ ├── 완전한 Holt-Winters                             │
│              │ ├── SARIMA                                          │
│              │ └── 다년간 패턴 분석                                │
└──────────────┴────────────────────────────────────────────────────┘
```

### 3.4 리드타임에 따른 예측 기간 조정

```
예측 기간 = max(리드타임 × 1.5, 발주 주기 × 2)

┌───────────────────────────────────────────────────────────────────┐
│                   리드타임별 예측 전략                             │
├──────────────────┬────────────────────────────────────────────────┤
│ 단기 (1~7일)     │ ├── 예측 기간: 2~4주                          │
│                  │ ├── 방법: 단순 방법으로 충분                   │
│                  │ └── 안전재고: 표준 수준                        │
├──────────────────┼────────────────────────────────────────────────┤
│ 중기 (1~4주)     │ ├── 예측 기간: 4~8주                          │
│                  │ ├── 방법: 지수평활 권장                        │
│                  │ └── 안전재고: 리드타임 변동 반영               │
├──────────────────┼────────────────────────────────────────────────┤
│ 장기 (1~3개월)   │ ├── 예측 기간: 3~6개월                        │
│                  │ ├── 방법: Holt's 또는 Holt-Winters             │
│                  │ ├── 계절성 필수 반영                           │
│                  │ └── 안전재고: 높은 수준 + 리드타임 변동 반영   │
├──────────────────┼────────────────────────────────────────────────┤
│ 초장기 (3개월+)  │ ├── 예측 기간: 6~12개월                       │
│                  │ ├── 방법: Holt-Winters + 전문가 판단           │
│                  │ ├── 연간 계약/사전 예약 고려                   │
│                  │ └── 공급자 협력 강화 필수                      │
└──────────────────┴────────────────────────────────────────────────┘
```

### 3.5 ABC등급별 예측 정교화 수준

```
┌───────────────────────────────────────────────────────────────────┐
│                   ABC별 예측 투자 수준                             │
├─────────┬─────────────────────────────────────────────────────────┤
│ A등급   │ 매출 기여도 높음 (80%) → 정교한 예측 투자              │
│ (핵심)  │ ├── 다중 방법 비교 후 최적 선택                        │
│         │ ├── 주간 단위 예측 갱신                                 │
│         │ ├── 외부 요인 (프로모션, 시장) 반영                     │
│         │ └── 전문가 검토 필수                                    │
├─────────┼─────────────────────────────────────────────────────────┤
│ B등급   │ 매출 기여도 중간 (15%) → 표준 예측                      │
│ (중요)  │ ├── 단일 최적 방법 자동 선택                           │
│         │ ├── 월간 단위 예측 갱신                                 │
│         │ └── 이상 발생 시 전문가 검토                            │
├─────────┼─────────────────────────────────────────────────────────┤
│ C등급   │ 매출 기여도 낮음 (5%) → 단순 예측                       │
│ (일반)  │ ├── 단순 이동평균 또는 최근 N기간 평균                 │
│         │ ├── 분기 단위 예측 갱신                                 │
│         │ └── 자동화 우선, 수동 개입 최소화                       │
└─────────┴─────────────────────────────────────────────────────────┘
```

---

## 4. 계절성 분석

### 4.1 계절성 검출 방법

**방법 1: 변동계수 기반 간이 검출**

```typescript
function detectSeasonality(monthlyData: number[]): boolean {
  if (monthlyData.length < 12) return false;

  // 월별 평균 계산
  const monthlyAverages: number[] = Array(12).fill(0);
  const monthlyCounts: number[] = Array(12).fill(0);

  monthlyData.forEach((value, index) => {
    const month = index % 12;
    monthlyAverages[month] += value;
    monthlyCounts[month]++;
  });

  for (let i = 0; i < 12; i++) {
    monthlyAverages[i] /= monthlyCounts[i] || 1;
  }

  // 전체 평균
  const overallAverage = monthlyAverages.reduce((a, b) => a + b, 0) / 12;

  // 계절 변동 CV 계산
  const seasonalStdDev = Math.sqrt(
    monthlyAverages.reduce((sum, avg) => sum + Math.pow(avg - overallAverage, 2), 0) / 12
  );
  const seasonalCV = seasonalStdDev / overallAverage;

  // CV > 0.15 이면 계절성 있음으로 판단
  return seasonalCV > 0.15;
}
```

**방법 2: 자기상관(Autocorrelation) 기반 검출**

```
ACF(lag) = Cov(Y(t), Y(t-lag)) / Var(Y)

- lag = 12 (월간 데이터)일 때 ACF가 유의하게 높으면 연간 계절성 존재
- 95% 신뢰구간: ±1.96/√n
```

### 4.2 계절 지수 계산

**비율 대 이동평균 방법 (Ratio-to-Moving-Average)**

```typescript
interface SeasonalIndex {
  month: number;      // 1-12
  index: number;      // 예: 1.2 = 평균보다 20% 높음
  stdDev: number;     // 인덱스 표준편차 (신뢰도)
}

function calculateSeasonalIndices(
  monthlyData: { month: number; value: number }[]
): SeasonalIndex[] {
  // 1. 12개월 중심 이동평균 계산
  const centeredMA: number[] = [];
  for (let i = 6; i < monthlyData.length - 5; i++) {
    const sum = monthlyData.slice(i - 6, i + 6).reduce((a, b) => a + b.value, 0);
    centeredMA.push(sum / 12);
  }

  // 2. 실제값 / 이동평균 = 비율 계산
  const ratiosByMonth: number[][] = Array(12).fill(null).map(() => []);
  for (let i = 6; i < monthlyData.length - 5; i++) {
    const month = monthlyData[i].month;
    const ratio = monthlyData[i].value / centeredMA[i - 6];
    ratiosByMonth[month - 1].push(ratio);
  }

  // 3. 월별 평균 비율 계산
  const indices: SeasonalIndex[] = ratiosByMonth.map((ratios, month) => {
    const mean = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    const variance = ratios.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratios.length;
    return {
      month: month + 1,
      index: mean,
      stdDev: Math.sqrt(variance)
    };
  });

  // 4. 정규화 (합계 = 12)
  const sum = indices.reduce((a, b) => a + b.index, 0);
  indices.forEach(idx => idx.index = idx.index * 12 / sum);

  return indices;
}
```

### 4.3 한국 특수 계절성

```typescript
// 한국 고유 시즌 이벤트
const KOREAN_SEASONAL_EVENTS = {
  설날: {
    period: '음력 1월 1일 전후 2주',
    months: [1, 2],  // 양력 기준
    typical_impact: 1.3,  // 평균 30% 증가
    categories: ['선물세트', '식품', '가전']
  },
  추석: {
    period: '음력 8월 15일 전후 2주',
    months: [9, 10],
    typical_impact: 1.4,
    categories: ['선물세트', '식품', '농산물']
  },
  여름_시즌: {
    period: '6~8월',
    months: [6, 7, 8],
    typical_impact: 1.5,  // 냉방 제품
    categories: ['에어컨', '선풍기', '냉장고', '음료']
  },
  블랙프라이데이_국내: {
    period: '11월 넷째 주',
    months: [11],
    typical_impact: 1.2,
    categories: ['전자제품', '패션']
  },
  연말_결산: {
    period: '12월',
    months: [12],
    typical_impact: 1.15,
    categories: ['사무용품', 'IT장비']  // 예산 소진
  }
};

// 음력 날짜 변환 (연도별 설날/추석 양력 날짜 테이블 필요)
const LUNAR_CALENDAR_2026 = {
  설날: '2026-02-17',
  추석: '2026-10-05'
};
```

### 4.4 계절성 분해 (Seasonal Decomposition)

```
원시 데이터 = 추세(T) × 계절성(S) × 잔차(R)  [승법 모델]
원시 데이터 = 추세(T) + 계절성(S) + 잔차(R)  [가법 모델]

분해 단계:
1. 이동평균으로 추세(T) 추출
2. 원시 데이터 / 추세 = 계절성 × 잔차
3. 월별 평균으로 계절성(S) 추출
4. 잔차(R) = 원시 데이터 / (추세 × 계절성)
```

```typescript
interface DecompositionResult {
  date: Date;
  original: number;
  trend: number;
  seasonal: number;
  residual: number;
}

function decomposeTimeSeries(
  data: { date: Date; value: number }[],
  period: number = 12,
  model: 'additive' | 'multiplicative' = 'multiplicative'
): DecompositionResult[] {
  // 1. 추세 추출 (중심 이동평균)
  const trend = calculateCenteredMA(data.map(d => d.value), period);

  // 2. 비계절 데이터
  const detrended = data.map((d, i) => {
    if (model === 'multiplicative') {
      return trend[i] ? d.value / trend[i] : 1;
    } else {
      return trend[i] ? d.value - trend[i] : 0;
    }
  });

  // 3. 계절 지수 추출
  const seasonalIndices = calculateSeasonalIndices(
    data.map((d, i) => ({ month: d.date.getMonth() + 1, value: detrended[i] }))
  );

  // 4. 잔차 계산
  return data.map((d, i) => {
    const month = d.date.getMonth() + 1;
    const S = seasonalIndices.find(s => s.month === month)?.index || 1;
    const T = trend[i] || d.value;

    let R: number;
    if (model === 'multiplicative') {
      R = d.value / (T * S);
    } else {
      R = d.value - T - S;
    }

    return {
      date: d.date,
      original: d.value,
      trend: T,
      seasonal: S,
      residual: R
    };
  });
}
```

---

## 5. 예측 정확도 측정

### 5.1 정확도 지표

**MAPE (Mean Absolute Percentage Error)**

```
MAPE = (1/n) × Σ |실제 - 예측| / |실제| × 100%

장점: 직관적, 비율 기반으로 비교 용이
단점: 실제값 = 0일 때 정의 불가, 비대칭성
```

```typescript
function calculateMAPE(actuals: number[], forecasts: number[]): number {
  let sum = 0;
  let validCount = 0;

  for (let i = 0; i < actuals.length; i++) {
    if (actuals[i] !== 0) {  // 0 나눗셈 방지
      sum += Math.abs(actuals[i] - forecasts[i]) / Math.abs(actuals[i]);
      validCount++;
    }
  }

  return validCount > 0 ? (sum / validCount) * 100 : Infinity;
}
```

**MAE (Mean Absolute Error)**

```
MAE = (1/n) × Σ |실제 - 예측|

장점: 실제값 0도 처리 가능, 동일 단위
단점: 규모에 따라 비교 어려움
```

**RMSE (Root Mean Square Error)**

```
RMSE = √((1/n) × Σ(실제 - 예측)²)

장점: 큰 오차에 페널티
단점: 이상치에 민감
```

**sMAPE (Symmetric MAPE)**

```
sMAPE = (1/n) × Σ |실제 - 예측| / ((|실제| + |예측|) / 2) × 100%

장점: 대칭적, 0 처리 개선
```

### 5.2 정확도 해석 기준

```
┌────────────────────────────────────────────────────────────────┐
│                   MAPE 해석 기준                                │
├─────────────┬──────────────────────────────────────────────────┤
│ MAPE < 10%  │ 매우 우수 (Highly Accurate)                      │
│             │ → 자동 발주에 높은 신뢰도                        │
├─────────────┼──────────────────────────────────────────────────┤
│ 10~20%      │ 양호 (Good)                                       │
│             │ → 표준 운영 가능                                  │
├─────────────┼──────────────────────────────────────────────────┤
│ 20~30%      │ 보통 (Reasonable)                                 │
│             │ → 안전재고 약간 상향 조정                        │
├─────────────┼──────────────────────────────────────────────────┤
│ 30~50%      │ 부정확 (Inaccurate)                               │
│             │ → 다른 예측 방법 검토, 안전재고 상향             │
├─────────────┼──────────────────────────────────────────────────┤
│ MAPE > 50%  │ 부적합 (Inappropriate)                            │
│             │ → 정량적 예측 부적합, 전문가 판단 우선           │
│             │ → 수요 패턴 재분석 필요                          │
└─────────────┴──────────────────────────────────────────────────┘
```

### 5.3 예측 방법 자동 선택 알고리즘

```typescript
interface ForecastMethod {
  name: string;
  minDataPoints: number;
  requiresSeasonality: boolean;
  forecast: (history: number[], periods: number) => number[];
}

interface ForecastResult {
  method: string;
  forecast: number[];
  mape: number;
  mae: number;
  confidence: 'high' | 'medium' | 'low';
}

async function selectBestForecastMethod(
  history: number[],
  metadata: {
    xyzGrade: 'X' | 'Y' | 'Z';
    hasSeasonality: boolean;
    dataMonths: number;
  }
): Promise<ForecastResult> {

  // 1. 데이터 기간에 따른 사용 가능 방법 필터
  const availableMethods: ForecastMethod[] = [];

  if (metadata.dataMonths >= 3) {
    availableMethods.push(simpleMovingAverage);
    availableMethods.push(simpleExponentialSmoothing);
  }

  if (metadata.dataMonths >= 6) {
    availableMethods.push(weightedMovingAverage);
    availableMethods.push(holtsMethod);
  }

  if (metadata.dataMonths >= 24 && metadata.hasSeasonality) {
    availableMethods.push(holtWinters);
  }

  // 2. 각 방법으로 예측 및 정확도 계산 (교차 검증)
  const results: ForecastResult[] = [];

  for (const method of availableMethods) {
    // Holdout 방식: 최근 3개월을 테스트 셋으로
    const trainData = history.slice(0, -3);
    const testData = history.slice(-3);

    const predictions = method.forecast(trainData, 3);
    const mape = calculateMAPE(testData, predictions);
    const mae = calculateMAE(testData, predictions);

    results.push({
      method: method.name,
      forecast: method.forecast(history, 3),  // 실제 예측
      mape,
      mae,
      confidence: mape < 15 ? 'high' : mape < 30 ? 'medium' : 'low'
    });
  }

  // 3. MAPE 기준 최적 방법 선택
  results.sort((a, b) => a.mape - b.mape);

  // 4. XYZ 등급에 따른 조정
  if (metadata.xyzGrade === 'Z') {
    // Z등급은 단순 방법 + 높은 안전재고 권장
    const simpleMethod = results.find(r =>
      r.method === 'SimpleMovingAverage' ||
      r.method === 'SimpleExponentialSmoothing'
    );
    if (simpleMethod && simpleMethod.mape < results[0].mape * 1.2) {
      return simpleMethod;
    }
  }

  return results[0];
}
```

### 5.4 교차 검증 (Cross-Validation)

```typescript
/**
 * 시계열 교차 검증 (Time Series Cross-Validation)
 * Rolling Window 방식
 */
function timeSeriesCrossValidation(
  history: number[],
  method: ForecastMethod,
  windowSize: number = 12,
  forecastHorizon: number = 3,
  minTrainSize: number = 6
): { avgMAPE: number; mapeByFold: number[] } {

  const mapeByFold: number[] = [];

  for (let i = minTrainSize; i <= history.length - forecastHorizon; i++) {
    const trainData = history.slice(Math.max(0, i - windowSize), i);
    const testData = history.slice(i, i + forecastHorizon);

    const predictions = method.forecast(trainData, forecastHorizon);
    const mape = calculateMAPE(testData, predictions);

    if (isFinite(mape)) {
      mapeByFold.push(mape);
    }
  }

  const avgMAPE = mapeByFold.reduce((a, b) => a + b, 0) / mapeByFold.length;

  return { avgMAPE, mapeByFold };
}
```

---

## 6. 공급계획 산출 프로세스

### 6.1 MRP (Material Requirements Planning) 기본 로직

```
┌─────────────────────────────────────────────────────────────────┐
│                      MRP 계산 프로세스                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  입력                                                            │
│  ├── 수요예측 (기간별)                                          │
│  ├── 현재고                                                      │
│  ├── 안전재고                                                    │
│  ├── 입고예정 (기발주, 미입고)                                  │
│  ├── 리드타임                                                    │
│  └── 로트 사이즈 (MOQ)                                          │
│                                                                  │
│  계산                                                            │
│  ├── 총소요량 = 예측수요 + 안전재고                             │
│  ├── 가용재고 = 현재고 + 입고예정                               │
│  ├── 순소요량 = max(0, 총소요량 - 가용재고)                    │
│  ├── 계획발주량 = ceil(순소요량 / MOQ) × MOQ                   │
│  └── 계획발주일 = 필요일 - 리드타임                             │
│                                                                  │
│  출력                                                            │
│  ├── 기간별 발주 계획                                            │
│  ├── 예상 재고 수준                                              │
│  └── 발주 알림                                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```typescript
interface MRPInput {
  productId: string;
  currentStock: number;
  safetyStock: number;
  scheduledReceipts: { date: Date; quantity: number }[];
  demandForecast: { date: Date; quantity: number }[];
  leadTimeDays: number;
  moq: number;
  lotSize?: number;  // EOQ 또는 고정 로트
}

interface MRPOutput {
  productId: string;
  periods: MRPPeriod[];
  plannedOrders: PlannedOrder[];
}

interface MRPPeriod {
  periodStart: Date;
  periodEnd: Date;
  grossRequirements: number;      // 총소요량
  scheduledReceipts: number;      // 입고예정
  projectedOnHand: number;        // 예상 가용재고
  netRequirements: number;        // 순소요량
  plannedOrderReceipts: number;   // 계획입고
  plannedOrderReleases: number;   // 계획발주
}

interface PlannedOrder {
  orderDate: Date;        // 발주일
  receiptDate: Date;      // 입고예정일
  quantity: number;       // 발주수량
  urgency: 'critical' | 'high' | 'normal';
}

function calculateMRP(input: MRPInput): MRPOutput {
  const periods: MRPPeriod[] = [];
  const plannedOrders: PlannedOrder[] = [];

  let projectedOnHand = input.currentStock;

  for (const demand of input.demandForecast) {
    // 해당 기간 입고예정
    const receipts = input.scheduledReceipts
      .filter(r => isSamePeriod(r.date, demand.date))
      .reduce((sum, r) => sum + r.quantity, 0);

    // 총소요량 = 예측수요 (안전재고는 최종 재고에서 확인)
    const grossRequirements = demand.quantity;

    // 예상 기말재고 (발주 전)
    const projectedBeforeOrder = projectedOnHand + receipts - grossRequirements;

    // 순소요량 (안전재고 미달 시)
    const netRequirements = Math.max(0, input.safetyStock - projectedBeforeOrder);

    // 계획발주량 (MOQ 반영)
    let plannedOrderQty = 0;
    if (netRequirements > 0) {
      plannedOrderQty = Math.ceil(netRequirements / input.moq) * input.moq;

      // 로트사이즈가 EOQ로 지정된 경우
      if (input.lotSize && plannedOrderQty < input.lotSize) {
        plannedOrderQty = Math.ceil(plannedOrderQty / input.lotSize) * input.lotSize;
      }
    }

    // 발주일 계산 (리드타임 역산)
    if (plannedOrderQty > 0) {
      const orderDate = subtractBusinessDays(demand.date, input.leadTimeDays);
      plannedOrders.push({
        orderDate,
        receiptDate: demand.date,
        quantity: plannedOrderQty,
        urgency: isUrgent(orderDate) ? 'critical' : 'normal'
      });
    }

    // 기말 예상재고 갱신
    projectedOnHand = projectedBeforeOrder + plannedOrderQty;

    periods.push({
      periodStart: demand.date,
      periodEnd: getEndOfPeriod(demand.date),
      grossRequirements,
      scheduledReceipts: receipts,
      projectedOnHand,
      netRequirements,
      plannedOrderReceipts: plannedOrderQty,
      plannedOrderReleases: plannedOrderQty
    });
  }

  return {
    productId: input.productId,
    periods,
    plannedOrders
  };
}
```

### 6.2 시간 버킷 (Time Bucket) 처리

```typescript
type TimeBucket = 'daily' | 'weekly' | 'monthly';

interface TimeBucketConfig {
  bucket: TimeBucket;
  aggregationMethod: 'sum' | 'average';
  leadTimeInBuckets: number;  // 리드타임을 버킷 단위로 변환
}

/**
 * 시간 버킷 결정 규칙
 */
function determineTimeBucket(
  leadTimeDays: number,
  forecastHorizonDays: number
): TimeBucket {
  // 단기 (리드타임 7일 이하) → 일별
  if (leadTimeDays <= 7 && forecastHorizonDays <= 30) {
    return 'daily';
  }

  // 중기 (리드타임 28일 이하) → 주별
  if (leadTimeDays <= 28 && forecastHorizonDays <= 90) {
    return 'weekly';
  }

  // 장기 → 월별
  return 'monthly';
}

/**
 * 일별 데이터를 버킷으로 집계
 */
function aggregateToTimeBucket(
  dailyData: { date: Date; value: number }[],
  bucket: TimeBucket
): { periodStart: Date; periodEnd: Date; value: number }[] {

  const grouped = new Map<string, number[]>();

  for (const item of dailyData) {
    const key = getBucketKey(item.date, bucket);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item.value);
  }

  return Array.from(grouped.entries()).map(([key, values]) => ({
    periodStart: parseBucketStart(key, bucket),
    periodEnd: parseBucketEnd(key, bucket),
    value: values.reduce((a, b) => a + b, 0)  // 합계
  }));
}

function getBucketKey(date: Date, bucket: TimeBucket): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  switch (bucket) {
    case 'daily':
      return `${year}-${String(month).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    case 'weekly':
      const weekNum = getWeekNumber(date);
      return `${year}-W${String(weekNum).padStart(2, '0')}`;
    case 'monthly':
      return `${year}-${String(month).padStart(2, '0')}`;
  }
}
```

### 6.3 제품별 발주 주기 결정

```typescript
interface OrderingStrategy {
  productId: string;
  abcGrade: 'A' | 'B' | 'C';
  xyzGrade: 'X' | 'Y' | 'Z';
  reviewPeriod: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  orderingMethod: 'continuous' | 'periodic' | 'mixed';
  leadTimeDays: number;
  isSeasonalPreorder: boolean;
  specialNotes: string[];
}

/**
 * ABC-XYZ 매트릭스 기반 발주 전략 결정
 */
function determineOrderingStrategy(
  product: {
    id: string;
    abcGrade: 'A' | 'B' | 'C';
    xyzGrade: 'X' | 'Y' | 'Z';
    leadTimeDays: number;
    hasSeasonality: boolean;
  }
): OrderingStrategy {

  const combined = `${product.abcGrade}${product.xyzGrade}`;

  const strategyMap: Record<string, Partial<OrderingStrategy>> = {
    // A등급: 핵심 제품, 면밀한 관리
    'AX': {
      reviewPeriod: 'daily',
      orderingMethod: 'continuous',
      specialNotes: ['JIT 공급 가능', '자동발주 적극 활용', '서비스레벨 99% 목표']
    },
    'AY': {
      reviewPeriod: 'daily',
      orderingMethod: 'periodic',
      specialNotes: ['주간 정기발주', '수요예측 정교화 필요', '안전재고 표준']
    },
    'AZ': {
      reviewPeriod: 'daily',
      orderingMethod: 'mixed',
      specialNotes: ['수요예측 어려움', '안전재고 높음', '전문가 판단 병행']
    },

    // B등급: 중요 제품
    'BX': {
      reviewPeriod: 'weekly',
      orderingMethod: 'periodic',
      specialNotes: ['정기 검토', '표준 안전재고']
    },
    'BY': {
      reviewPeriod: 'weekly',
      orderingMethod: 'periodic',
      specialNotes: ['주간/격주 발주', '수요 모니터링']
    },
    'BZ': {
      reviewPeriod: 'weekly',
      orderingMethod: 'mixed',
      specialNotes: ['수요패턴 분석', '발주 주기 조정 필요']
    },

    // C등급: 일반 제품
    'CX': {
      reviewPeriod: 'monthly',
      orderingMethod: 'periodic',
      specialNotes: ['대량 발주', '낮은 발주빈도']
    },
    'CY': {
      reviewPeriod: 'monthly',
      orderingMethod: 'periodic',
      specialNotes: ['월간 검토', '최소 재고 유지']
    },
    'CZ': {
      reviewPeriod: 'monthly',
      orderingMethod: 'mixed',
      specialNotes: ['주문생산 검토', '재고 최소화', '폐기 검토 대상']
    }
  };

  const baseStrategy = strategyMap[combined] || {
    reviewPeriod: 'weekly',
    orderingMethod: 'periodic',
    specialNotes: []
  };

  // 리드타임에 따른 조정
  if (product.leadTimeDays > 30) {
    baseStrategy.specialNotes = [
      ...(baseStrategy.specialNotes || []),
      '장리드타임 - 사전 발주 필요',
      '월간 수요예측 정교화'
    ];

    // 장리드타임은 검토 주기 단축
    if (baseStrategy.reviewPeriod === 'monthly') {
      baseStrategy.reviewPeriod = 'biweekly';
    }
  }

  // 계절성 제품 사전 발주
  if (product.hasSeasonality) {
    baseStrategy.specialNotes = [
      ...(baseStrategy.specialNotes || []),
      '계절성 제품 - 시즌 2개월 전 발주 검토'
    ];
  }

  return {
    productId: product.id,
    abcGrade: product.abcGrade,
    xyzGrade: product.xyzGrade,
    reviewPeriod: baseStrategy.reviewPeriod as OrderingStrategy['reviewPeriod'],
    orderingMethod: baseStrategy.orderingMethod as OrderingStrategy['orderingMethod'],
    leadTimeDays: product.leadTimeDays,
    isSeasonalPreorder: product.hasSeasonality,
    specialNotes: baseStrategy.specialNotes || []
  };
}
```

### 6.4 로트 사이징 (Lot Sizing)

```typescript
type LotSizingMethod = 'EOQ' | 'LFL' | 'FOQ' | 'POQ';

interface LotSizingInput {
  annualDemand: number;         // 연간 수요
  orderingCost: number;         // 1회 발주비용
  holdingCostRate: number;      // 재고유지비율 (단가의 %)
  unitCost: number;             // 단위당 원가
  moq: number;                  // 최소발주수량
}

/**
 * EOQ (Economic Order Quantity) 계산
 */
function calculateEOQ(input: LotSizingInput): number {
  const D = input.annualDemand;
  const S = input.orderingCost;
  const H = input.unitCost * input.holdingCostRate;

  if (H === 0 || D === 0) return input.moq;

  const eoq = Math.sqrt((2 * D * S) / H);

  // MOQ 반영
  return Math.max(input.moq, Math.ceil(eoq / input.moq) * input.moq);
}

/**
 * 로트 사이징 방법 선택
 */
function selectLotSizingMethod(
  abcGrade: 'A' | 'B' | 'C',
  xyzGrade: 'X' | 'Y' | 'Z'
): LotSizingMethod {
  const combined = `${abcGrade}${xyzGrade}`;

  // A등급 + 안정 수요: EOQ 최적
  if (['AX', 'AY', 'BX'].includes(combined)) {
    return 'EOQ';
  }

  // C등급: 필요량만 발주 (LFL - Lot for Lot)
  if (abcGrade === 'C') {
    return 'LFL';
  }

  // Z등급 (불규칙 수요): 고정 기간 발주 (POQ)
  if (xyzGrade === 'Z') {
    return 'POQ';
  }

  // 기본: 고정 발주량 (FOQ)
  return 'FOQ';
}
```

### 6.5 발주 일정 생성

```typescript
interface OrderSchedule {
  productId: string;
  plannedOrders: PlannedOrder[];
  summary: {
    totalOrders: number;
    totalQuantity: number;
    totalAmount: number;
    urgentOrders: number;
  };
}

/**
 * MRP 결과를 발주 일정으로 변환
 */
function generateOrderSchedule(
  mrpOutputs: MRPOutput[],
  productMaster: Map<string, { unitPrice: number; supplierId: string }>
): OrderSchedule[] {

  return mrpOutputs.map(mrp => {
    const product = productMaster.get(mrp.productId);
    const unitPrice = product?.unitPrice || 0;

    const totalQuantity = mrp.plannedOrders.reduce((sum, o) => sum + o.quantity, 0);
    const urgentOrders = mrp.plannedOrders.filter(o => o.urgency === 'critical').length;

    return {
      productId: mrp.productId,
      plannedOrders: mrp.plannedOrders,
      summary: {
        totalOrders: mrp.plannedOrders.length,
        totalQuantity,
        totalAmount: totalQuantity * unitPrice,
        urgentOrders
      }
    };
  });
}

/**
 * 공급자별 발주 그룹핑
 */
function groupOrdersBySupplier(
  schedules: OrderSchedule[],
  supplierProductMap: Map<string, string>  // productId -> supplierId
): Map<string, OrderSchedule[]> {

  const grouped = new Map<string, OrderSchedule[]>();

  for (const schedule of schedules) {
    const supplierId = supplierProductMap.get(schedule.productId) || 'UNKNOWN';

    if (!grouped.has(supplierId)) {
      grouped.set(supplierId, []);
    }
    grouped.get(supplierId)!.push(schedule);
  }

  return grouped;
}
```

---

## 7. 구현 파일 구조

```
src/server/services/scm/
├── index.ts                          # 메인 진입점 (기존)
├── inventory-status.ts               # 재고상태 (기존)
├── safety-stock.ts                   # 안전재고 (기존)
├── reorder-point.ts                  # 발주점 (기존)
├── abc-xyz-analysis.ts               # ABC-XYZ 분류 (기존)
├── eoq.ts                            # EOQ 계산 (기존)
│
├── demand-forecast/                  # [신규] 수요예측 모듈
│   ├── index.ts                      # 수요예측 메인 진입점
│   ├── types.ts                      # 타입 정의
│   │
│   ├── methods/                      # 예측 방법
│   │   ├── simple-moving-average.ts      # 단순이동평균
│   │   ├── weighted-moving-average.ts    # 가중이동평균
│   │   ├── exponential-smoothing.ts      # 단순지수평활 (SES)
│   │   ├── holts-method.ts               # 이중지수평활 (Holt's)
│   │   ├── holt-winters.ts               # 삼중지수평활 (Holt-Winters)
│   │   └── index.ts                      # 방법 모음 export
│   │
│   ├── seasonality/                  # 계절성 분석
│   │   ├── detection.ts              # 계절성 검출
│   │   ├── indices.ts                # 계절 지수 계산
│   │   ├── decomposition.ts          # 시계열 분해
│   │   ├── korean-events.ts          # 한국 고유 시즌
│   │   └── index.ts
│   │
│   ├── accuracy/                     # 정확도 측정
│   │   ├── metrics.ts                # MAPE, MAE, RMSE
│   │   ├── cross-validation.ts       # 교차 검증
│   │   └── index.ts
│   │
│   └── selector.ts                   # 자동 방법 선택 알고리즘
│
├── supply-planning/                  # [신규] 공급계획 모듈
│   ├── index.ts                      # 공급계획 메인 진입점
│   ├── types.ts                      # 타입 정의
│   │
│   ├── mrp.ts                        # MRP 핵심 로직
│   ├── lot-sizing.ts                 # 로트 사이징 (EOQ, LFL, FOQ, POQ)
│   ├── time-bucket.ts                # 시간 버킷 처리
│   ├── ordering-strategy.ts          # ABC-XYZ 기반 발주 전략
│   └── order-schedule.ts             # 발주 일정 생성
│
└── utils/                            # 공용 유틸리티
    ├── statistics.ts                 # 통계 함수 (평균, 표준편차, 변동계수)
    ├── date-utils.ts                 # 날짜 처리 (영업일 계산)
    └── index.ts
```

---

## 8. API 인터페이스

### 8.1 수요예측 API

```typescript
// src/server/services/scm/demand-forecast/index.ts

export interface DemandForecastRequest {
  productId: string;
  organizationId: string;

  // 옵션
  forecastPeriods?: number;           // 예측 기간 수 (기본: 3)
  timeBucket?: 'daily' | 'weekly' | 'monthly';  // 기본: auto
  method?: ForecastMethodType | 'auto';  // 기본: auto
  includeConfidenceInterval?: boolean;   // 기본: true
}

export interface DemandForecastResponse {
  productId: string;
  method: {
    name: string;
    parameters: Record<string, number>;
    selectedAutomatically: boolean;
  };

  forecast: {
    period: Date;
    value: number;
    lowerBound?: number;  // 95% 신뢰구간 하한
    upperBound?: number;  // 95% 신뢰구간 상한
  }[];

  accuracy: {
    mape: number;
    mae: number;
    rmse: number;
    confidence: 'high' | 'medium' | 'low';
  };

  seasonality?: {
    detected: boolean;
    strength: number;
    indices: { month: number; index: number }[];
  };

  metadata: {
    dataPoints: number;
    dataRange: { from: Date; to: Date };
    xyzGrade: 'X' | 'Y' | 'Z';
    generatedAt: Date;
  };
}

/**
 * 수요예측 실행
 */
export async function forecastDemand(
  request: DemandForecastRequest
): Promise<DemandForecastResponse>;

/**
 * 다중 제품 일괄 예측
 */
export async function forecastDemandBatch(
  productIds: string[],
  organizationId: string,
  options?: Partial<DemandForecastRequest>
): Promise<DemandForecastResponse[]>;
```

### 8.2 공급계획 API

```typescript
// src/server/services/scm/supply-planning/index.ts

export interface SupplyPlanRequest {
  organizationId: string;
  productIds?: string[];              // 미지정 시 전체
  planningHorizonDays: number;        // 계획 기간 (일)
  timeBucket?: 'daily' | 'weekly' | 'monthly';
}

export interface SupplyPlanResponse {
  generatedAt: Date;
  planningHorizon: { from: Date; to: Date };

  productPlans: ProductSupplyPlan[];

  summary: {
    totalProducts: number;
    productsNeedingOrder: number;
    totalPlannedOrders: number;
    totalPlannedAmount: number;
    criticalAlerts: number;
  };

  supplierGrouping: {
    supplierId: string;
    supplierName: string;
    orders: { productId: string; quantity: number; amount: number }[];
    totalAmount: number;
  }[];
}

export interface ProductSupplyPlan {
  productId: string;
  productName: string;

  currentStock: number;
  safetyStock: number;

  demandForecast: { period: Date; quantity: number }[];

  mrpPlan: MRPPeriod[];

  plannedOrders: PlannedOrder[];

  orderingStrategy: OrderingStrategy;

  alerts: {
    type: 'stockout_risk' | 'excess_stock' | 'long_leadtime';
    severity: 'critical' | 'warning' | 'info';
    message: string;
  }[];
}

/**
 * 공급계획 생성
 */
export async function generateSupplyPlan(
  request: SupplyPlanRequest
): Promise<SupplyPlanResponse>;

/**
 * 특정 제품 상세 MRP 조회
 */
export async function getProductMRP(
  productId: string,
  organizationId: string,
  options?: { periods?: number; timeBucket?: TimeBucket }
): Promise<ProductSupplyPlan>;
```

---

## 9. 의사결정 흐름도

```
┌─────────────────────────────────────────────────────────────────┐
│                    수요예측 → 공급계획 흐름                       │
└─────────────────────────────────────────────────────────────────┘

[1. 데이터 수집]
     │
     ├── 판매 이력 (최소 3개월, 권장 12개월+)
     ├── 제품 마스터 (ABC, XYZ 등급)
     ├── 현재 재고
     └── 공급자 정보 (리드타임, MOQ)
     │
     ▼
[2. 데이터 전처리]
     │
     ├── 이상치 탐지 및 처리
     ├── 결측치 보간
     └── 시간 버킷 집계
     │
     ▼
[3. 계절성 분석]
     │
     ├── 계절성 검출 (CV > 0.15?)
     │   ├── Yes → 계절 지수 계산, 시계열 분해
     │   └── No  → 비계절 모델 사용
     │
     ▼
[4. 예측 방법 선택]
     │
     ├── 데이터 기간 확인
     │   ├── < 3개월  → 유사제품 참조, 전문가 판단
     │   ├── 3~12개월 → SES, MA
     │   ├── 12~24개월 → Holt's, WMA
     │   └── 24개월+  → Holt-Winters, SARIMA
     │
     ├── XYZ 등급 고려
     │   ├── X → 단순 방법 + 낮은 안전재고
     │   ├── Y → 표준 방법 + 표준 안전재고
     │   └── Z → 앙상블/전문가 + 높은 안전재고
     │
     ▼
[5. 예측 실행 및 검증]
     │
     ├── 복수 방법 병렬 실행
     ├── 교차 검증 (MAPE 계산)
     ├── 최적 방법 선택
     └── 예측값 + 신뢰구간 산출
     │
     ▼
[6. MRP 계산]
     │
     ├── 총소요량 = 예측수요 + 안전재고
     ├── 순소요량 = 총소요량 - 가용재고
     ├── 계획발주량 = 로트사이징(EOQ/MOQ)
     └── 계획발주일 = 필요일 - 리드타임
     │
     ▼
[7. 발주 계획 생성]
     │
     ├── 기간별 발주 일정
     ├── 공급자별 그룹핑
     ├── 우선순위 스코어링
     └── 발주 알림 생성
     │
     ▼
[8. 출력]
     │
     ├── 대시보드 표시
     ├── 발주 추천 목록
     └── 예측 리포트
```

---

## 10. 성능 최적화 고려사항

### 10.1 계산 성능

```typescript
// 대량 제품 처리 시 병렬 처리
async function batchForecast(
  productIds: string[],
  batchSize: number = 100
): Promise<ForecastResult[]> {
  const results: ForecastResult[] = [];

  // 배치 단위로 병렬 처리
  for (let i = 0; i < productIds.length; i += batchSize) {
    const batch = productIds.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(id => forecastSingleProduct(id))
    );
    results.push(...batchResults);
  }

  return results;
}
```

### 10.2 캐싱 전략

```typescript
// 예측 결과 캐싱 (Upstash Redis)
const FORECAST_CACHE_TTL = 60 * 60 * 24;  // 24시간

async function getCachedForecast(
  productId: string,
  params: string
): Promise<ForecastResult | null> {
  const cacheKey = `forecast:${productId}:${params}`;
  return await redis.get(cacheKey);
}

async function setCachedForecast(
  productId: string,
  params: string,
  result: ForecastResult
): Promise<void> {
  const cacheKey = `forecast:${productId}:${params}`;
  await redis.set(cacheKey, result, { ex: FORECAST_CACHE_TTL });
}
```

### 10.3 점진적 갱신

```typescript
// 전체 재계산 대신 점진적 갱신
async function incrementalForecastUpdate(
  productId: string,
  newSalesData: { date: Date; quantity: number }
): Promise<ForecastResult> {
  // 기존 캐시된 예측 조회
  const cached = await getCachedForecast(productId, 'latest');

  if (cached && cached.method.name === 'SimpleExponentialSmoothing') {
    // SES는 점진적 갱신 가능
    const alpha = cached.method.parameters.alpha;
    const lastForecast = cached.forecast[0].value;
    const newForecast = alpha * newSalesData.quantity + (1 - alpha) * lastForecast;

    // 캐시 업데이트
    return updateCachedForecast(productId, newForecast);
  }

  // 그 외는 전체 재계산
  return fullForecastRecalculation(productId);
}
```

---

## 11. 확장 계획

### Phase 1: 기본 구현 (현재)
- 단순/가중 이동평균
- 단순 지수평활 (SES)
- 기본 계절성 검출
- MRP 기본 로직

### Phase 2: 고급 예측 (향후)
- Holt's (이중지수평활)
- Holt-Winters (삼중지수평활)
- 앙상블 방법
- 신뢰구간 계산

### Phase 3: AI 통합 (장기)
- 머신러닝 기반 예측 (XGBoost, LSTM)
- 외부 요인 통합 (날씨, 경제지표)
- 자동 이상치 탐지
- 예측 설명 (Explainable AI)

---

## 12. 참고 문헌

1. **SCM 도메인**: `.claude/agents/scm-expert.md`
2. **기존 ABC-XYZ 구현**: `src/server/services/scm/abc-xyz-analysis.ts`
3. **디자인 시스템**: `.claude/design/DESIGN_SYSTEM.md`
4. **프로젝트 계획**: `.claude/plans/twinkling-soaring-coral.md`

---

> **다음 단계**: 이 설계서를 기반으로 `demand-forecast/` 및 `supply-planning/` 모듈 구현
