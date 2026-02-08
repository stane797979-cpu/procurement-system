# 성능 최적화 가이드

## 개요

FlowStok의 성능 최적화 전략 및 설정을 문서화합니다.

## Next.js 설정 최적화

### 1. 번들 최적화 (next.config.ts)

```typescript
experimental: {
  // 패키지 임포트 최적화 (트리 셰이킹)
  optimizePackageImports: [
    "lucide-react",
    "@radix-ui/react-dialog",
    "@radix-ui/react-dropdown-menu",
    "@radix-ui/react-select",
    "@radix-ui/react-tabs",
    "@radix-ui/react-toast",
  ],
}
```

**효과**: 사용하지 않는 Radix UI 컴포넌트 제거, 번들 크기 감소

### 2. 코드 스플리팅 (Webpack)

```typescript
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.optimization.splitChunks = {
      chunks: "all",
      cacheGroups: {
        framework: {
          // React, React-DOM 분리
          name: "framework",
          priority: 40,
        },
        radix: {
          // Radix UI 분리
          name: "radix",
          priority: 30,
        },
        commons: {
          // 공통 모듈 분리
          name: "commons",
          minChunks: 2,
          priority: 20,
        },
      },
    };
  }
  return config;
}
```

**효과**: 초기 로딩 시간 개선, 캐시 활용도 증가

### 3. 이미지 최적화

```typescript
images: {
  formats: ["image/avif", "image/webp"],
  unoptimized: false,
}
```

**효과**: AVIF/WebP 포맷 자동 변환, 이미지 용량 50% 이상 감소

### 4. 프로덕션 Console 제거

```typescript
compiler: {
  removeConsole: process.env.NODE_ENV === "production",
}
```

**효과**: 번들 크기 감소, 민감 정보 노출 방지

## React 최적화

### 1. 동적 임포트 (코드 스플리팅)

```typescript
import dynamic from "next/dynamic";

// 대용량 컴포넌트 지연 로딩
const HeavyChart = dynamic(() => import("@/components/charts/heavy-chart"), {
  loading: () => <Skeleton />,
  ssr: false, // 클라이언트 전용
});
```

**적용 대상**:
- 차트 라이브러리
- 에디터 컴포넌트
- 모달/다이얼로그 (초기에 보이지 않는 것)

### 2. 메모이제이션

```typescript
import { memo, useMemo, useCallback } from "react";

// 컴포넌트 메모이제이션
const ProductCard = memo(({ product }) => {
  // ...
});

// 계산 결과 메모이제이션
const filteredProducts = useMemo(() => {
  return products.filter((p) => p.status === "active");
}, [products]);

// 콜백 메모이제이션
const handleClick = useCallback(() => {
  // ...
}, [dependencies]);
```

**적용 기준**:
- 비싼 계산 (필터링, 정렬, 집계)
- 자식에게 전달되는 함수
- 리스트 아이템 컴포넌트

### 3. 가상화 (React Virtual)

```typescript
import { useVirtualizer } from "@tanstack/react-virtual";

// 대용량 리스트 가상화
const rowVirtualizer = useVirtualizer({
  count: products.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
  overscan: 5,
});
```

**적용 대상**:
- 100개 이상 아이템 리스트
- 재고 목록, 발주 이력

## 데이터 최적화

### 1. Server Actions 캐싱

```typescript
import { unstable_cache } from "next/cache";

// 1시간 캐싱
export const getProducts = unstable_cache(
  async (orgId: string) => {
    return await db.select().from(products).where(eq(products.orgId, orgId));
  },
  ["products"],
  { revalidate: 3600 },
);
```

### 2. Redis 캐싱 (추후 6.8에서 구현)

```typescript
import { redis } from "@/lib/upstash";

// KPI 계산 결과 캐싱
const cachedKpi = await redis.get(`kpi:${orgId}`);
if (cachedKpi) return cachedKpi;

const kpi = await calculateKpi(orgId);
await redis.set(`kpi:${orgId}`, kpi, { ex: 300 }); // 5분
```

### 3. DB 쿼리 최적화

#### ❌ 나쁜 예 (N+1 쿼리)

```typescript
// 제품마다 공급자 조회 (N번 쿼리)
const products = await db.select().from(products);
for (const p of products) {
  p.supplier = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.id, p.supplierId));
}
```

#### ✅ 좋은 예 (JOIN)

```typescript
// 한 번에 조회 (1번 쿼리)
const products = await db
  .select()
  .from(products)
  .leftJoin(suppliers, eq(products.supplierId, suppliers.id));
```

## 성능 측정

### 1. Web Vitals 모니터링

```typescript
// src/lib/performance.ts 사용
import { reportWebVitals } from "@/lib/performance";

useEffect(() => {
  reportWebVitals((metric) => {
    // PostHog으로 전송
    posthog.capture("web_vitals", {
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
    });
  });
}, []);
```

**목표 지표**:

| 메트릭 | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP    | ≤ 2.5s | 2.5s ~ 4.0s | > 4.0s |
| FID    | ≤ 100ms | 100ms ~ 300ms | > 300ms |
| CLS    | ≤ 0.1 | 0.1 ~ 0.25 | > 0.25 |
| FCP    | ≤ 1.8s | 1.8s ~ 3.0s | > 3.0s |
| TTFB   | ≤ 800ms | 800ms ~ 1.8s | > 1.8s |

### 2. 함수 실행 시간 측정

```typescript
import { measureAsync } from "@/lib/performance";

const data = await measureAsync("제품 목록 조회", async () => {
  return await getProducts(orgId);
});
```

### 3. Lighthouse 점수 목표

- **Performance**: 90+ (프로덕션)
- **Accessibility**: 95+
- **Best Practices**: 95+
- **SEO**: 90+

## 배포 최적화

### 1. Vercel 설정

```json
// vercel.json
{
  "regions": ["icn1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 10
    }
  }
}
```

### 2. 환경변수 최소화

```bash
# 빌드 시간 단축
NEXT_TELEMETRY_DISABLED=1
```

### 3. 빌드 캐싱

```yaml
# .github/workflows/deploy.yml
- uses: actions/cache@v3
  with:
    path: |
      ~/.npm
      ${{ github.workspace }}/.next/cache
    key: ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}
```

## 체크리스트

빌드 전 성능 체크리스트:

- [ ] 동적 임포트 적용 (대용량 컴포넌트)
- [ ] 이미지 최적화 (AVIF/WebP)
- [ ] 메모이제이션 (비싼 계산)
- [ ] DB 쿼리 최적화 (N+1 제거)
- [ ] 번들 크기 확인 (`npm run build` 출력)
- [ ] Lighthouse 점수 확인
- [ ] Web Vitals 측정

## 문제 해결

### 번들 크기가 큰 경우

```bash
# 번들 분석
npm install -D @next/bundle-analyzer

# next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)

# 실행
ANALYZE=true npm run build
```

### 느린 API 응답

```typescript
// Drizzle 쿼리 로깅
const db = drizzle(sql, { logger: true });

// 느린 쿼리 찾기
SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
```

### 메모리 누수

```typescript
// React DevTools Profiler 사용
// Heap Snapshot 비교 (Chrome DevTools)
```

## 참고 자료

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [React Performance](https://react.dev/learn/render-and-commit)
