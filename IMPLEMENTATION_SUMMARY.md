# Phase 7.4 & 7.5: PostHog + Sentry 통합 구현 요약

**작업 일자**: 2026-02-06
**상태**: 완료 ✓
**빌드 테스트**: 성공 (Next.js 15.5.12)

---

## 개요

FlowStok의 분석 및 에러 추적 시스템을 구현했습니다.

- **PostHog**: 사용자 행동 분석, 세션 리플레이, 피처 플래그
- **Sentry**: 에러 추적, 성능 모니터링, 소스맵 업로드

---

## 구현된 파일 (5개)

### 1. `src/lib/analytics.ts` — PostHog 통합

**역할**: PostHog 초기화 및 API 제공

**주요 함수**:
- initPostHog() - SDK 초기화
- identifyUser() - 사용자 식별
- trackEvent() - 이벤트 추적
- trackPageView() - 페이지뷰 추적
- isFeatureEnabled() - 피처 플래그 확인
- setSuperProperties() - 글로벌 프로퍼티
- resetAnalytics() - 분석 리셋 (로그아웃)

### 2. `src/lib/sentry.ts` — Sentry 통합

**역할**: Sentry 초기화 및 API 제공

**주요 함수**:
- initSentry() - SDK 초기화
- setUser() - 사용자 설정
- clearUser() - 사용자 제거 (로그아웃)
- captureError() - 에러 캡처
- captureMessage() - 메시지 캡처 (경고/정보)
- startTransaction() - 트랜잭션 시작
- addBreadcrumb() - 이벤트 추적
- setTag(), setContext() - 메타데이터

### 3. `src/lib/sentry-config.ts` — Sentry 설정

**역할**: Sentry 환경 설정 및 필터링 규칙

### 4. `src/lib/monitoring.ts` — 통합 모니터링 유틸리티

**10가지 함수**:
- trackNavigation() - 페이지 전환 추적
- trackApiCall() - API 요청 추적
- trackBusinessEvent() - 비즈니스 이벤트
- trackPerformance() - 성능 메트릭
- logError() - 통합 에러 로깅
- trackUserAction() - 사용자 인터랙션
- trackFeatureUsage() - 기능 사용 추적
- trackDataOperation() - 데이터 임포트/엑스포트
- trackPerformanceIssue() - 성능 이슈 감지
- trackSystemEvent() - 시스템 이벤트

### 5. `src/components/analytics-provider.tsx` — 초기화 프로바이더

**역할**: PostHog + Sentry 자동 초기화 및 사용자 추적

---

## 구성 파일 변경사항

- src/app/layout.tsx - AnalyticsProvider 동적 로드
- next.config.ts - productionBrowserSourceMaps 추가
- .env.local.example - 환경변수 템플릿 추가
- package.json - 의존성 추가 (posthog-js, @sentry/nextjs, @sentry/react)
- TODO.md - Phase 7.4, 7.5 완료 표시

---

## 패키지 설치

npm install posthog-js @sentry/nextjs @sentry/react

---

## 환경변수 설정

### PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_your_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.posthog.com

### Sentry
NEXT_PUBLIC_SENTRY_DSN=https://[key]@[domain].ingest.sentry.io/[project-id]
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
NEXT_PUBLIC_APP_VERSION=0.1.0

---

## 빌드 테스트 결과

✓ Compiled successfully in 18.4s
✓ Generating static pages (17/17)

---

## 프로덕션 체크리스트

- [ ] PostHog API 키 생성 및 설정
- [ ] Sentry DSN 생성 및 설정
- [ ] NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
- [ ] Vercel/Railway 환경변수 설정
- [ ] 소스맵 업로드 설정 (선택사항)
- [ ] 데이터 마스킹 설정 (민감 정보 보호)

---

## 다음 단계

1. 환경변수 설정 (.env.local)
2. 로컬 테스트 (npm run dev)
3. PostHog/Sentry 대시보드 확인
4. 프로덕션 배포 (Vercel/Railway)
5. Phase 7.6 - 랜딩 페이지

---

**완료일**: 2026-02-06
**상세 가이드**: ANALYTICS_SETUP.md 참고
