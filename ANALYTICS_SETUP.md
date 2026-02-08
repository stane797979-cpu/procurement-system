# PostHog + Sentry 분석 및 에러 추적 설정 가이드

## 개요

**Phase 7.4 & 7.5** 완료: PostHog 분석 + Sentry 에러 추적 통합

- **PostHog**: 사용자 분석, 세션 리플레이, 피처 플래그
- **Sentry**: 에러 추적, 성능 모니터링, 소스맵 업로드

---

## 1. 설치된 패키지

```bash
posthog-js@^1.160+
@sentry/nextjs@^8.0+
@sentry/react@^8.0+
```

빌드 테스트 완료: Next.js 15.5.12 ✓

---

## 2. PostHog 설정

### 2.1 PostHog 계정 생성

1. https://posthog.com 접속
2. 회원가입 (무료 플랜: 월 10만 이벤트)
3. 프로젝트 생성 (Project name: "FlowStok")

### 2.2 API 키 취득

1. **Settings** → **Project Settings**
2. **Copy API Key** (형식: `phc_...`)
3. **API Host 확인**
   - 미국: `https://us.posthog.com` (기본값)
   - 유럽: `https://eu.posthog.com`

### 2.3 환경변수 설정

`.env.local`에 추가:

```env
NEXT_PUBLIC_POSTHOG_KEY=phc_your_api_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://us.posthog.com
```

### 2.4 초기화 확인

개발 서버 실행:

```bash
npm run dev
```

브라우저 개발자 도구 콘솔:
```javascript
// window.posthog가 로드되었는지 확인
window.posthog
// 출력: PostHog SDK 객체 또는 undefined (API 키 없으면 undefined)
```

### 2.5 추적 이벤트

자동으로 추적되는 이벤트:

| 이벤트 | 조건 |
|--------|------|
| `$pageview` | 페이지 방문 |
| `user_login` | 사용자 로그인 |
| `user_logout` | 사용자 로그아웃 |
| `api_call` | API 요청 |
| `error_occurred` | 에러 발생 |

#### 커스텀 이벤트 추적

```typescript
import { trackEvent, identifyUser } from "@/lib/analytics";

// 사용자 식별
identifyUser(userId, {
  email: user.email,
  organization: org.name,
});

// 이벤트 캡처
trackEvent("product_created", {
  productId: "123",
  category: "electronics",
});
```

#### 모니터링 유틸리티

```typescript
import {
  trackNavigation,
  trackApiCall,
  trackBusinessEvent,
  trackFeatureUsage,
} from "@/lib/monitoring";

// 페이지 네비게이션
trackNavigation("/orders", "주문 목록");

// API 호출 추적
trackApiCall("/api/orders", "POST", 201, 150);

// 비즈니스 이벤트
trackBusinessEvent("order_created", {
  orderId: "PO-123",
  supplier: "ABC Corp",
});

// 기능 사용 추적
trackFeatureUsage("abc_analysis", "opened");
```

---

## 3. Sentry 설정

### 3.1 Sentry 계정 생성

1. https://sentry.io 접속
2. 회원가입 (무료 플랜: 월 5,000 이벤트)
3. 조직 생성 (Organization name: "FlowStok")

### 3.2 프로젝트 생성

1. **Projects** → **Create Project**
2. 플랫폼 선택: **Next.js**
3. **Create Project** 클릭

### 3.3 DSN 취득

1. **Settings** → **Client Keys (DSN)**
2. **Copy** (형식: `https://[key]@[domain].ingest.sentry.io/[project-id]`)

### 3.4 환경변수 설정

`.env.local`에 추가:

```env
NEXT_PUBLIC_SENTRY_DSN=https://[key]@[domain].ingest.sentry.io/[project-id]
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
NEXT_PUBLIC_APP_VERSION=0.1.0
```

**샘플링 설정:**
- 개발: `1.0` (모든 트랜잭션)
- 프로덕션: `0.1` (10% 샘플링)

### 3.5 초기화 확인

개발 서버 실행 후 에러를 의도적으로 발생시키면 Sentry 대시보드에 자동으로 전송됩니다.

```typescript
import { captureError } from "@/lib/sentry";

try {
  throw new Error("테스트 에러");
} catch (error) {
  captureError(error as Error, {
    feature: "inventory",
    action: "update",
  });
}
```

### 3.6 소스맵 업로드 (프로덕션)

프로덕션 배포 시 자동으로 소스맵이 업로드되도록 설정하려면:

```bash
npm install --save-dev @sentry/cli
```

Vercel 배포 시:

1. **Settings** → **Environment Variables**
2. `SENTRY_AUTH_TOKEN` 추가 (Sentry에서 생성)
3. `SENTRY_ORG`, `SENTRY_PROJECT` 설정

---

## 4. 모니터링 API

### PostHog

```typescript
import {
  initPostHog,
  identifyUser,
  trackEvent,
  trackPageView,
  isFeatureEnabled,
  setSuperProperties,
  resetAnalytics,
} from "@/lib/analytics";

// 사용자 식별
identifyUser("user123", {
  email: "user@example.com",
  plan: "professional",
});

// 이벤트 추적
trackEvent("inventory_updated", {
  productId: "SKU-001",
  quantity: 50,
});

// 페이지뷰 추적
trackPageView("Dashboard", {
  section: "analytics",
});

// 피처 플래그 확인
if (isFeatureEnabled("new_eoq_calculation")) {
  // 새로운 EOQ 알고리즘 사용
}

// 글로벌 프로퍼티 설정 (모든 이벤트에 포함)
setSuperProperties({
  environment: "production",
  version: "1.0.0",
});

// 로그아웃 시 리셋
resetAnalytics();
```

### Sentry

```typescript
import {
  initSentry,
  captureError,
  captureMessage,
  setUser,
  clearUser,
  setContext,
  setTag,
  addBreadcrumb,
} from "@/lib/sentry";

// 에러 캡처
try {
  dangerousOperation();
} catch (error) {
  captureError(error as Error, {
    feature: "orders",
    action: "bulk_import",
  });
}

// 메시지 캡처
captureMessage("매월 요청 한계 도달", "warning");

// 사용자 설정
setUser("user123", "user@example.com", "John Doe");

// 컨텍스트 설정
setContext("order", {
  id: "PO-123",
  supplier: "ABC Corp",
  items: 50,
});

// 태그 설정 (필터링용)
setTag("environment", "staging");
setTag("tenant", "org-001");

// 브레드크럼브 (이벤트 추적)
addBreadcrumb("user_action", "clicked export button", "info", {
  button_id: "export_excel",
});

// 로그아웃 시 사용자 제거
clearUser();
```

### 통합 모니터링

```typescript
import {
  trackNavigation,
  trackApiCall,
  trackBusinessEvent,
  trackPerformance,
  logError,
  trackUserAction,
  trackFeatureUsage,
  trackDataOperation,
  trackPerformanceIssue,
  trackSystemEvent,
} from "@/lib/monitoring";

// 페이지 네비게이션
trackNavigation("/analytics/abc-xyz", "ABC/XYZ 분석");

// API 호출
trackApiCall("/api/orders", "POST", 201, 245);

// 비즈니스 이벤트
trackBusinessEvent("order_created", {
  supplierId: "SUP-001",
  itemCount: 25,
  totalAmount: 1500000,
});

// 성능 메트릭
trackPerformance("forecast_calculation", 1250);

// 에러 로깅 (PostHog + Sentry)
logError(new Error("재고 동기화 실패"), {
  feature: "inventory",
  action: "sync",
  userId: "user123",
});

// 사용자 액션
trackUserAction("click", "sidebar_menu", {
  menu_item: "analytics",
});

// 기능 사용
trackFeatureUsage("ai_chat", "opened");

// 데이터 작업
trackDataOperation("import", "sales_data", 5000, 3200, true);

// 성능 이슈
trackPerformanceIssue("slow_api_response", {
  endpoint: "/api/analytics",
  duration: 5000,
});

// 시스템 이벤트
trackSystemEvent("deploy", {
  version: "0.2.0",
  status: "success",
});
```

---

## 5. 구현 파일 일람

| 파일 | 역할 |
|------|------|
| `src/lib/analytics.ts` | PostHog 초기화 및 API |
| `src/lib/sentry.ts` | Sentry 초기화 및 API |
| `src/lib/sentry-config.ts` | Sentry 설정 및 필터링 |
| `src/lib/monitoring.ts` | 통합 모니터링 유틸리티 |
| `src/components/analytics-provider.tsx` | 초기화 프로바이더 컴포넌트 |
| `src/app/layout.tsx` | Root layout (AnalyticsProvider 포함) |
| `.env.local.example` | 환경변수 템플릿 |

---

## 6. 프로덕션 체크리스트

배포 전 다음을 확인하세요:

- [ ] PostHog API 키 설정 (프로덕션)
- [ ] Sentry DSN 설정 (프로덕션)
- [ ] `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1` (비용 최적화)
- [ ] `productionBrowserSourceMaps: true` (next.config.ts)
- [ ] Vercel 환경변수 설정 완료
- [ ] Sentry 소스맵 업로드 설정 (선택사항)
- [ ] Rails 또는 백그라운드 잡 모니터링 추가 (필요시)

---

## 7. 문제 해결

### PostHog 이벤트가 추적되지 않음

```bash
# 1. API 키 확인
echo $NEXT_PUBLIC_POSTHOG_KEY

# 2. 콘솔 로그 확인
npm run dev
# 브라우저 콘솔에서 PostHog 초기화 메시지 확인

# 3. PostHog 대시보드에서 라이브 이벤트 확인
# https://posthog.com → Settings → Project Settings → Live events
```

### Sentry 에러가 캡처되지 않음

```bash
# 1. DSN 확인
echo $NEXT_PUBLIC_SENTRY_DSN

# 2. 로컬호스트는 기본적으로 무시됨
# (beforeSend 필터에서 localhost 제외)

# 3. 스테이징/프로덕션에서만 에러 수집
NODE_ENV=production npm run build
npm run start
```

### 민감한 데이터가 추적될까봐 걱정

PostHog와 Sentry 모두 데이터 마스킹 설정을 지원합니다:

```typescript
// PostHog: mask_all_text, mask_all_forms
// Sentry: beforeSend 필터로 특정 필드 제외
```

자세한 설정은 각 대시보드에서 "Privacy" 또는 "Data Management" 항목을 참조하세요.

---

## 8. 비용 추정 (월간)

| 도구 | 무료 플랜 | 가격 |
|------|----------|------|
| PostHog | 100만 이벤트/월 | 초과 시 $0.0005/이벤트 |
| Sentry | 5천 이벤트/월 | 초과 시 $2.5/만 이벤트 |

**팁**: 프로덕션에서 샘플링(0.1)으로 비용 90% 절감 가능

---

## 9. 다음 단계

- [ ] **7.6** 랜딩 페이지 개발
- [ ] **7.7** 런칭 체크리스트
- [ ] Upstash Redis 캐싱 추가 (Phase 6.8)
- [ ] 이메일 알림 (Resend) 추가 (Phase 6.5)
- [ ] 모바일 앱 고려

---

## 10. 참고 자료

- [PostHog 문서](https://posthog.com/docs)
- [Sentry 문서](https://docs.sentry.io)
- [Next.js Sentry 통합](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [PostHog + React 가이드](https://posthog.com/docs/libraries/react)

---

**작성일**: 2026-02-06
**완료 상태**: Phase 7.4 & 7.5 ✓
**빌드 테스트**: Next.js 15.5.12 ✓
