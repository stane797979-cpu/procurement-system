# SCM Expert Agent Memory

## 수요예측 및 공급계획 설계 (2026-02-06)

### 설계 문서 위치
- `c:\Claude_Project\.claude\design\DEMAND_FORECAST_DESIGN.md` (완료)

### 핵심 의사결정 사항

#### 1. 예측 방법 선택 규칙
- **XYZ 등급 기반**: X(안정)=SES, Y(변동)=Holt's, Z(불규칙)=앙상블+전문가
- **데이터 기간 기반**: <3개월=유사제품, 3-12개월=SES/MA, 24개월+=Holt-Winters
- **계절성 여부**: CV > 0.15이면 계절성 있음으로 판단

#### 2. 공급계획 핵심 공식
```
총소요량 = 예측수요 + 안전재고
순소요량 = max(0, 총소요량 - 가용재고 - 입고예정)
계획발주량 = ceil(순소요량 / MOQ) * MOQ
계획발주일 = 필요일 - 리드타임(영업일)
```

#### 3. ABC-XYZ 기반 발주 전략
| 등급 | 검토 주기 | 발주 방식 |
|------|----------|----------|
| AX | 일간 | 연속(JIT) |
| AY | 일간 | 정기 |
| AZ | 일간 | 혼합 |
| BX | 주간 | 정기 |
| BY | 주간 | 정기 |
| BZ | 주간 | 혼합 |
| CX | 월간 | 정기(대량) |
| CY | 월간 | 정기 |
| CZ | 월간 | 혼합(최소재고) |

### 구현 파일 구조 (계획)
```
src/server/services/scm/
├── demand-forecast/
│   ├── methods/ (SMA, WMA, SES, Holt's, Holt-Winters)
│   ├── seasonality/ (detection, indices, korean-events)
│   ├── accuracy/ (MAPE, MAE, cross-validation)
│   └── selector.ts
└── supply-planning/
    ├── mrp.ts
    ├── lot-sizing.ts
    ├── time-bucket.ts
    └── ordering-strategy.ts
```

### 한국 특수 계절성
- 설날: 1-2월 (음력 1/1)
- 추석: 9-10월 (음력 8/15)
- 여름 시즌: 6-8월 (냉방)
- 연말 결산: 12월 (예산 소진)

### MAPE 해석 기준
- < 10%: 매우 우수 (자동발주 신뢰)
- 10-20%: 양호
- 20-30%: 보통 (안전재고 상향)
- 30-50%: 부정확 (방법 재검토)
- > 50%: 부적합 (전문가 판단)

## 관련 링크
- SCM 도메인 규칙: `.claude\agents\scm-expert.md`
- 기존 ABC-XYZ 구현: `src\server\services\scm\abc-xyz-analysis.ts`
