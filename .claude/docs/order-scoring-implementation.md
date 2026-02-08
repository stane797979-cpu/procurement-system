# 발주 스코어링 서비스 구현 문서

> 작성일: 2026-02-06
> 파일: `src/server/services/scm/order-scoring.ts`

---

## 1. 개요

발주 우선순위를 자동으로 계산하여 긴급/우선/정상/보류 등급으로 분류하는 서비스입니다.
재고 긴급도, ABC 등급, 판매 추세, 리드타임 리스크를 종합하여 0-100점 점수를 산출합니다.

---

## 2. 점수 체계 (100점 만점)

| 요소              | 배점  | 설명                                    |
|-------------------|-------|-----------------------------------------|
| 재고 긴급도       | 40점  | 품절/위험/부족/주의 상태에 따라 차등    |
| ABC 등급          | 30점  | A:30, B:20, C:10                       |
| 판매 추세         | 20점  | 최근 4주 vs 이전 4주 증가율             |
| 리드타임 리스크   | 10점  | 리드타임이 길수록 높은 점수             |

---

## 3. 우선순위 등급 기준

| 등급      | 점수 범위 | 권장 조치                    |
|-----------|-----------|------------------------------|
| urgent    | 80-100점  | 즉시 발주 (금일 처리)        |
| high      | 60-79점   | 우선 발주 (1-2일 내 처리)    |
| normal    | 40-59점   | 정상 발주 (다음 발주일)      |
| low       | 0-39점    | 발주 보류 가능 (재고 충분)   |

---

## 4. 세부 점수 계산 로직

### 4.1 재고 긴급도 (0-40점)

재고상태 7단계 분류 기준:

| 재고상태 | 조건                           | 점수  |
|----------|--------------------------------|-------|
| 품절     | 현재고 = 0                     | 40점  |
| 위험     | 0 < 현재고 < 안전재고 × 0.5    | 35점  |
| 부족     | 안전재고 × 0.5 ≤ 현재고 < 안전재고 | 30점  |
| 주의     | 안전재고 ≤ 현재고 < 발주점      | 20점  |
| 적정     | 발주점 ≤ 현재고 < 안전재고 × 3.0 | 10점  |
| 과다     | 안전재고 × 3.0 ≤ 현재고 < 안전재고 × 5 | 0점   |
| 과잉     | 현재고 ≥ 안전재고 × 5.0         | 0점   |

→ `inventory-status.ts`의 `classifyInventoryStatus()` 활용

### 4.2 ABC 등급 (0-30점)

| ABC 등급 | 점수  | 의미                        |
|----------|-------|-----------------------------|
| A        | 30점  | 핵심 품목 (매출 기여도 80%) |
| B        | 20점  | 중요 품목 (매출 기여도 15%) |
| C        | 10점  | 일반 품목 (매출 기여도 5%)  |

### 4.3 판매 추세 (0-20점)

```
증가율 = (최근 4주 평균 - 이전 4주 평균) / 이전 4주 평균

점수 계산:
- +100% 증가 → 20점
- 0% 변화 없음 → 10점
- -50% 이하 감소 → 0점
- 정규화: 10 + (증가율 × 20 / 1.5)
```

**특수 케이스:**
- 이전 판매 없고 최근 판매 있음 → 10점
- 이전 판매 없고 최근 판매도 없음 → 0점

### 4.4 리드타임 리스크 (0-10점)

```
최대 리드타임 = 30일 (기준)
점수 = (리드타임(일) / 30) × 10

예시:
- 1일 → 0.3점
- 7일 → 2.3점
- 14일 → 4.7점
- 30일 → 10점
```

---

## 5. 주요 함수

### 5.1 `calculateOrderScore()`

단일 제품의 발주 점수 계산.

**입력:**
```typescript
interface OrderScoringInput {
  currentStock: number;
  safetyStock: number;
  reorderPoint: number;
  abcGrade: ABCGrade;
  leadTimeDays: number;
  recentSales?: number;
  previousSales?: number;
}
```

**출력:**
```typescript
interface OrderScoringResult {
  totalScore: number;
  breakdown: {
    inventoryUrgency: number;
    abcScore: number;
    salesTrend: number;
    leadTimeRisk: number;
  };
  priorityLevel: "urgent" | "high" | "normal" | "low";
  recommendation: string;
}
```

### 5.2 `calculateOrderScoreList()`

여러 제품의 발주 점수를 일괄 계산하고 우선순위순으로 정렬.

**입력:**
```typescript
interface OrderScoringListItem extends OrderScoringInput {
  productId: string;
  productName: string;
}
```

**출력:**
```typescript
interface OrderScoringListResult extends OrderScoringListItem {
  scoring: OrderScoringResult;
  rank: number; // 1부터 시작
}
```

### 5.3 `filterByPriority()`

특정 우선순위 등급만 필터링.

```typescript
filterByPriority(items, ["urgent", "high"]); // 긴급+우선만
```

### 5.4 `getUrgentOrders()`

긴급/우선 발주 목록만 추출하는 헬퍼 함수.

```typescript
const urgentOrders = getUrgentOrders(scoredList);
```

---

## 6. 사용 예시

### 6.1 단일 제품 점수 계산

```typescript
import { calculateOrderScore } from "@/server/services/scm/order-scoring";

const result = calculateOrderScore({
  currentStock: 0,
  safetyStock: 100,
  reorderPoint: 200,
  abcGrade: "A",
  leadTimeDays: 14,
  recentSales: 150,
  previousSales: 100,
});

console.log(result.totalScore); // 92점
console.log(result.priorityLevel); // "urgent"
console.log(result.recommendation); // "즉시 발주 필요 (금일 처리)"
```

### 6.2 여러 제품 우선순위 정렬

```typescript
import { calculateOrderScoreList } from "@/server/services/scm/order-scoring";

const products: OrderScoringListItem[] = [
  {
    productId: "P001",
    productName: "제품 A",
    currentStock: 0,
    safetyStock: 100,
    reorderPoint: 200,
    abcGrade: "A",
    leadTimeDays: 7,
  },
  {
    productId: "P002",
    productName: "제품 B",
    currentStock: 350,
    safetyStock: 200,
    reorderPoint: 400,
    abcGrade: "B",
    leadTimeDays: 5,
  },
];

const results = calculateOrderScoreList(products);

results.forEach((item) => {
  console.log(`${item.rank}위. ${item.productName} (${item.scoring.totalScore}점)`);
});
```

### 6.3 긴급 발주 목록만 추출

```typescript
import { calculateOrderScoreList, getUrgentOrders } from "@/server/services/scm/order-scoring";

const allProducts = [...]; // 전체 제품 목록
const scored = calculateOrderScoreList(allProducts);
const urgentOrders = getUrgentOrders(scored);

console.log(`긴급/우선 발주 필요: ${urgentOrders.length}개`);
```

### 6.4 실제 발주 추천 워크플로우

```typescript
// 1. DB에서 모든 제품 조회
const allProducts = await db.query...;

// 2. 발주 점수 계산 및 정렬
const scored = calculateOrderScoreList(allProducts);

// 3. 발주 필요 제품 필터링 (현재고 <= 발주점)
const needsReorder = scored.filter(item => item.currentStock <= item.reorderPoint);

// 4. 우선순위별 그룹화
const urgent = needsReorder.filter(item => item.scoring.priorityLevel === "urgent");
const high = needsReorder.filter(item => item.scoring.priorityLevel === "high");

// 5. 긴급+우선 제품 발주서 생성
const ordersToCreate = [...urgent, ...high];
```

---

## 7. 테스트 결과

### 7.1 예시 1: 품절 + A등급 + 증가추세

**입력:**
- 현재고: 0 (품절)
- 안전재고: 100
- 발주점: 200
- ABC등급: A
- 리드타임: 14일
- 최근 판매: 150
- 이전 판매: 100

**결과:**
- 총점: **92점**
- 재고 긴급도: 40점
- ABC 등급: 30점
- 판매 추세: 17점 (50% 증가)
- 리드타임 리스크: 4.7점
- 우선순위: **urgent** (즉시 발주)

### 7.2 예시 2: 적정 재고 + C등급

**입력:**
- 현재고: 250 (적정)
- 안전재고: 100
- 발주점: 200
- ABC등급: C
- 리드타임: 2일

**결과:**
- 총점: **21점**
- 재고 긴급도: 10점
- ABC 등급: 10점
- 판매 추세: 0점
- 리드타임 리스크: 0.7점
- 우선순위: **low** (발주 보류 가능)

### 7.3 예시 3: 판매 추세 영향

| 시나리오      | 이전 판매 | 최근 판매 | 증가율   | 판매추세 점수 |
|---------------|-----------|-----------|----------|---------------|
| 50% 감소      | 100       | 50        | -50%     | 3점           |
| 변화 없음     | 100       | 100       | 0%       | 10점          |
| 50% 증가      | 100       | 150       | +50%     | 17점          |
| 100% 증가     | 100       | 200       | +100%    | 20점          |

---

## 8. 통합 계획

### 8.1 Orders 페이지 (자동 발주 추천)

```typescript
// app/(dashboard)/orders/_components/auto-reorder-recommendations-table.tsx

import { calculateOrderScoreList, getUrgentOrders } from "@/server/services/scm/order-scoring";

// 1. 발주 필요 제품 조회
const reorderNeededProducts = await getReorderNeededProducts();

// 2. 점수 계산 및 정렬
const scoredProducts = calculateOrderScoreList(reorderNeededProducts);

// 3. 테이블에 표시 (rank, productName, totalScore, priorityLevel, recommendation)
<Table>
  {scoredProducts.map(item => (
    <TableRow key={item.productId}>
      <TableCell>{item.rank}</TableCell>
      <TableCell>{item.productName}</TableCell>
      <TableCell>{item.scoring.totalScore}점</TableCell>
      <TableCell>
        <Badge variant={getPriorityVariant(item.scoring.priorityLevel)}>
          {item.scoring.priorityLevel}
        </Badge>
      </TableCell>
      <TableCell>{item.scoring.recommendation}</TableCell>
    </TableRow>
  ))}
</Table>
```

### 8.2 Dashboard (긴급 발주 알림)

```typescript
// app/(dashboard)/dashboard/page.tsx

const scoredProducts = calculateOrderScoreList(allProducts);
const urgentOrders = getUrgentOrders(scoredProducts);

if (urgentOrders.length > 0) {
  return <Alert variant="destructive">
    ⚠️ 긴급/우선 발주 필요 제품 {urgentOrders.length}개
  </Alert>
}
```

---

## 9. 향후 개선 방향

### 9.1 가중치 조정 (Phase 6: 설정)

현재 고정 배점을 사용자 설정으로 변경:

```typescript
interface OrderScoringWeights {
  inventoryUrgency: number; // 기본 40
  abcScore: number;         // 기본 30
  salesTrend: number;       // 기본 20
  leadTimeRisk: number;     // 기본 10
}
```

### 9.2 추가 요소 고려

- **XYZ 등급**: 변동성 높은 Z등급 제품 우선순위 상향
- **공급자 신뢰도**: 납기 준수율 낮은 공급자 → 높은 점수
- **계절성**: 시즌 품목 → 시즌 전 높은 점수
- **재고금액**: 고가 제품 → 낮은 점수 (재고비용 최소화)

### 9.3 머신러닝 기반 점수 예측 (Phase 5: AI)

과거 발주 데이터 기반으로 최적 점수 학습.

---

## 10. 관련 파일

| 파일 경로 | 설명 |
|----------|------|
| `src/server/services/scm/order-scoring.ts` | 발주 스코어링 서비스 (본체) |
| `src/server/services/scm/order-scoring.example.ts` | 사용 예시 (5가지 시나리오) |
| `src/server/services/scm/inventory-status.ts` | 재고상태 분류 (재고 긴급도 계산에 사용) |
| `src/server/services/scm/abc-xyz-analysis.ts` | ABC 등급 분석 |
| `src/server/services/scm/reorder-point.ts` | 발주점 계산 |

---

## 11. SCM 도메인 규칙 준수 사항

✅ **발주점 공식 통일** (CLAUDE.md, scm-expert.md 준수)
```
발주점 = 일평균판매량 × 리드타임(일) + 안전재고
```

✅ **재고상태 7단계 분류** (단일 기준)
- 품절/위험/부족/주의/적정/과다/과잉

✅ **ABC 등급 배점**
- A:30, B:20, C:10 (매출 기여도 반영)

✅ **한국어 용어 사용**
- priorityLevel: "urgent" (긴급), "high" (우선), "normal" (정상), "low" (낮음)
- recommendation: 모두 한국어

✅ **0 나눗셈 방지**
- `previousSales <= 0` 체크

✅ **소수점 처리**
- 총점: 정수 (Math.round)
- 리드타임 리스크: 소수점 1자리

---

## 12. 빌드 테스트 결과

✅ TypeScript 타입 체크 통과
✅ ESLint 통과 (기존 경고만 존재)
✅ 예시 실행 성공 (order-scoring.example.ts)

---

**문서 종료**
