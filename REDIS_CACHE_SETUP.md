# Upstash Redis 캐싱 설정 가이드

## 개요

Upstash Redis는 서버리스 환경에 최적화된 관리형 Redis입니다.
이 프로젝트에서는 다음 용도로 사용됩니다:

- **데이터 캐싱**: 재고, KPI, 분석 데이터 (응답 속도 개선)
- **Rate Limiting**: API 요청 한도 관리
- **세션 캐싱**: 사용자 세션 데이터 (선택)
- **작업 큐**: 백그라운드 작업 관리 (향후)

---

## 셋업 가이드

### 1단계: Upstash 계정 생성 및 Redis 데이터베이스 생성

1. [Upstash Console](https://console.upstash.com/)에 접속
2. 계정 생성 (Google/GitHub 로그인 가능)
3. **Redis** → **Create Database** 클릭
4. 이름: `flowstok` (또는 프로젝트명)
5. 지역: `Singapore` (또는 가장 가까운 지역)
6. 생성 완료 후 **Connect** 탭으로 이동

### 2단계: REST API 자격증명 복사

**Details** 탭에서:
- **REST API** 섹션 찾기
- `UPSTASH_REDIS_REST_URL` 복사 (https://[endpoint].upstash.io 형식)
- `UPSTASH_REDIS_REST_TOKEN` 복사

### 3단계: 환경변수 설정

`.env.local` 파일에 추가:

```env
UPSTASH_REDIS_REST_URL=https://[endpoint].upstash.io
UPSTASH_REDIS_REST_TOKEN=your-rest-token
```

프로덕션 배포 시:
- Vercel: Settings → Environment Variables 에서 추가
- Railway: Variables 섹션에서 추가

### 4단계: 연결 테스트

```bash
npm run dev
```

콘솔에서 다음 메시지 확인:
- "Redis 연결 성공" (성공 시)
- "UPSTASH_REDIS_REST_URL 환경변수가 설정되지 않았습니다" (실패 시)

---

## 사용 가능한 함수

### 기본 캐시 함수 (`src/lib/redis.ts`)

```typescript
import { getCached, setCached, delCached } from '@/lib/redis'

// 값 조회
const cached = await getCached<MyType>('key')

// 값 저장 (기본 TTL: 1시간)
await setCached('key', { data: 'value' }, 3600)

// 값 삭제
await delCached('key')
await delCached(['key1', 'key2']) // 배열도 가능
```

### 패턴 삭제

```typescript
import { delCachedByPattern } from '@/lib/redis'

// "inventory:*" 패턴의 모든 키 삭제
await delCachedByPattern('inventory:*')
```

### Rate Limiting

```typescript
import { redis } from '@/lib/redis'

const result = await redis.checkRateLimit(
  'rate-limit:user:123',
  100, // 최대 요청 수
  3600 // 시간 윈도우(초)
)

if (!result.allowed) {
  // 한도 초과
  console.log(`${result.remaining}개 요청 남음, ${result.resetAt}초 후 리셋`)
}
```

### 서비스 레벨 함수 (`src/server/services/cache.ts`)

도메인별로 사전 정의된 캐시 함수:

```typescript
import {
  getCachedInventory,
  cacheInventory,
  invalidateInventoryCache,
  getCachedKPIs,
  cacheKPIs,
  checkUserRateLimit,
} from '@/server/services/cache'

// 재고 조회
const inventory = await getCachedInventory(orgId)

// 재고 캐싱 (5분)
await cacheInventory(orgId, { items: [...] }, 300)

// 재고 캐시 무효화
await invalidateInventoryCache(orgId)

// 사용자 Rate Limit 체크 (100 req/hour)
const { allowed, remaining, resetAt } = await checkUserRateLimit(userId)
```

### API Rate Limiting 미들웨어 (`src/lib/redis-middleware.ts`)

```typescript
import { withRateLimit } from '@/lib/redis-middleware'

export async function POST(request: NextRequest) {
  // IP 기반 Rate Limiting (100 req/hour)
  const rateLimitResponse = await withRateLimit(request, {
    maxRequests: 100,
    windowSeconds: 3600,
  })

  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // 계속 처리...
}
```

---

## 통합 예제

### 예제 1: 재고 조회 API (캐싱)

```typescript
// src/app/api/inventory/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'
import { getCachedInventory, cacheInventory } from '@/server/services/cache'
import { withRateLimit } from '@/lib/redis-middleware'
import { inventory } from '@/server/db/schema'

export async function GET(request: NextRequest) {
  // Rate Limiting
  const rateLimitResponse = await withRateLimit(request, {
    maxRequests: 100,
    windowSeconds: 3600,
  })

  if (rateLimitResponse) return rateLimitResponse

  const orgId = request.nextUrl.searchParams.get('orgId')

  try {
    // 캐시 확인
    let cached = await getCachedInventory(orgId)
    if (cached) {
      return NextResponse.json({ data: cached, cached: true })
    }

    // DB에서 조회
    const items = await db.select().from(inventory).where(...)

    // 캐싱 (5분)
    await cacheInventory(orgId, items, 300)

    return NextResponse.json({ data: items, cached: false })
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
```

### 예제 2: 제품 수정 후 캐시 무효화

```typescript
// src/server/actions/update-product.ts
'use server'

import { db } from '@/server/db'
import { invalidateForecastCache } from '@/server/services/cache'

export async function updateProduct(orgId: string, productId: string) {
  // 제품 업데이트
  await db
    .update(products)
    .set({ updatedAt: new Date() })
    .where(...)

  // 관련 캐시 무효화
  await invalidateForecastCache(orgId)
}
```

### 예제 3: Rate Limiting 커스텀

```typescript
// src/server/services/custom-rate-limit.ts
import { withOrgRateLimit } from '@/lib/redis-middleware'

export async function checkOrgRateLimit(orgId: string) {
  const { allowed, remaining, resetAt } = await withOrgRateLimit(orgId, {
    maxRequests: 1000, // 조직당 1000 req/hour
    windowSeconds: 3600,
  })

  return { allowed, remaining, resetAt }
}
```

---

## 캐시 키 네이밍 컨벤션

일관된 키 관리를 위해 다음 패턴 사용:

```
{domain}:{orgId}:{resource}:{identifier}

예:
- inventory:org-123:*              (조직의 모든 재고)
- inventory:org-123:product-456    (특정 제품 재고)
- kpi:org-123:revenue              (조직의 매출 KPI)
- forecast:org-123:product-456     (특정 제품 예측)
- purchase-orders:org-123:*        (조직의 모든 발주)
```

캐시 키 생성 헬퍼:

```typescript
import { cacheKeys } from '@/server/services/cache'

const key = cacheKeys.inventory('org-123')
// → "inventory:org-123"

const itemKey = cacheKeys.inventoryItem('org-123', 'product-456')
// → "inventory:org-123:product-456"
```

---

## TTL(Time To Live) 권장사항

| 데이터 | TTL | 사유 |
|--------|-----|------|
| 재고 데이터 | 5분 (300초) | 자주 변경, 실시간성 중요 |
| KPI 대시보드 | 1시간 (3600초) | 일일 기준으로 계산 |
| ABC/XYZ 분석 | 24시간 (86400초) | 월간 기준으로 계산 |
| 발주 추천 | 15분 (900초) | 수시로 재계산 |
| 수요 예측 | 1시간 (3600초) | 일일 기준으로 예측 |
| Rate Limit | 1시간 (3600초) | 표준 API 시간 윈도우 |

---

## 캐시 무효화 전략

### 1. 시간 기반 만료 (TTL)
자동으로 만료. 위의 TTL 권장사항 참고.

### 2. 이벤트 기반 무효화
데이터 변경 시 즉시 캐시 삭제:

```typescript
// 제품 생성 후
await invalidateInventoryCache(orgId)
await invalidateAbcAnalysisCache(orgId)

// 판매 기록 추가 후
await invalidateKPICache(orgId)
await invalidateForecastCache(orgId)
```

### 3. 패턴 기반 무효화
특정 패턴의 모든 키 삭제:

```typescript
import { delCachedByPattern } from '@/lib/redis'

// 조직의 모든 KPI 캐시 삭제
await delCachedByPattern('kpi:org-123:*')
```

---

## 모니터링

### Redis 데이터베이스 크기 확인

```typescript
import { getCacheStats } from '@/lib/redis'

const stats = await getCacheStats()
console.log(`Redis DB 크기: ${stats?.dbSize} 바이트`)
```

### Upstash 콘솔에서 모니터링

1. [Upstash Console](https://console.upstash.com/) 접속
2. 데이터베이스 선택 → **Analytics** 탭
3. 실시간 통계 확인:
   - 명령 수
   - 대역폭 사용량
   - 연결 수

---

## 프로덕션 체크리스트

- [ ] Upstash Redis 데이터베이스 생성
- [ ] REST API 자격증명 복사
- [ ] 환경변수 설정 (`.env.local`)
- [ ] Vercel/Railway 환경변수 추가
- [ ] 연결 테스트 (npm run dev)
- [ ] 캐시 함수 적용 (최소 3개 API)
- [ ] Rate Limiting 적용 (모든 공개 API)
- [ ] 캐시 무효화 로직 검증
- [ ] 성능 개선 측정 (응답 시간 비교)
- [ ] Redis 모니터링 설정

---

## 비용 계산

**Upstash Redis 프리 티어:**
- 최대 100MB 스토리지
- 10,000 요청/일
- 무료

**유료 플랜:**
- Pay-as-you-go: $0.2/GB + 명령당 요금
- 예상: 월 $5~50 (중소 SaaS)

---

## 문제 해결

### "UPSTASH_REDIS_REST_TOKEN 환경변수가 설정되지 않았습니다" 경고

- `.env.local` 파일에 환경변수 추가 확인
- 서버 재시작 (npm run dev)

### Redis 연결 실패

```
Error: connect ECONNREFUSED
```

- REST URL과 TOKEN 정확성 확인
- Upstash 콘솔에서 데이터베이스 활성 상태 확인
- 네트워크 방화벽 설정 확인

### Rate Limiting이 작동하지 않음

- `UPSTASH_REDIS_REST_TOKEN`이 유효한지 확인
- 콘솔 로그에서 `[Redis]` 에러 메시지 확인
- 프로덕션 환경변수 설정 재확인

---

## 참고 자료

- [Upstash 공식 문서](https://upstash.com/docs/redis/overall/getstarted)
- [Upstash Node.js SDK](https://github.com/upstash/upstash-redis)
- [Redis 명령어 레퍼런스](https://redis.io/commands)

---

마지막 업데이트: 2026-02-06
