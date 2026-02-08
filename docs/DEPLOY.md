# Vercel 배포 가이드

FlowStok을 Vercel에 배포하기 위한 완벽한 체크리스트 및 설정 가이드입니다.

## 1. 배포 전 필수 확인사항

### 1.1 환경변수 준비

배포 전 다음 환경변수를 준비해야 합니다. `.env.local.example` 참고.

| 환경변수 | 필수 | 설명 | 예시 |
|---------|------|------|------|
| `NEXT_PUBLIC_SITE_URL` | ✅ | 프로덕션 도메인 | `https://yourdomain.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase 프로젝트 URL | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase 공개 키 | `eyJhbGc...` |
| `DATABASE_URL` | ✅ | PostgreSQL 연결 문자열 | `postgresql://user:pass@...` |
| `ANTHROPIC_API_KEY` | ❌ | Claude API 키 (선택) | `sk-ant-...` |

**중요**: 비밀 환경변수(`DATABASE_URL`, `ANTHROPIC_API_KEY`)는 절대 코드에 커밋하지 마세요.

### 1.2 Supabase 프로덕션 설정

#### 1.2.1 데이터베이스 연결

```bash
# 로컬에서 프로덕션 마이그레이션 실행
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
npm run db:push
```

#### 1.2.2 인증 설정 (Supabase Dashboard)

1. **Authentication → Settings**
   - Site URL: `https://yourdomain.com`
   - Redirect URLs:
     - `https://yourdomain.com/auth/callback`
     - `https://yourdomain.com` (홈으로 리다이렉트)

2. **OAuth 제공자 설정** (선택)
   - **카카오**: [카카오 개발자](https://developers.kakao.com/)에서 프로덕션 앱 생성
     - Client ID: Supabase → Providers → Kakao에 입력
     - Redirect URI: `https://yourdomain.supabase.co/auth/v1/callback`
   - **구글**: [Google Cloud Console](https://console.cloud.google.com/)에서 OAuth 2.0 설정
     - Client ID, Secret: Supabase → Providers → Google에 입력

#### 1.2.3 Row Level Security (RLS) 정책 검증

```sql
-- Supabase Dashboard → SQL Editor에서 실행하여 RLS 정책 확인
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 각 테이블의 RLS 정책 확인
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

**주의**: 프로덕션 배포 전 모든 테이블에 RLS 정책이 설정되어 있는지 확인합니다.

### 1.3 로컬 빌드 테스트

```bash
# 프로덕션 빌드 생성
npm run build

# 빌드 결과 확인 (.next 폴더 생성 확인)
ls -la .next

# 스태틱 페이지 확인
ls -la .next/static/pages
```

### 1.4 타입 체크 및 린트

```bash
# TypeScript 타입 검사
npm run type-check

# ESLint 린트 검사
npm run lint

# 포맷 검사
npm run format:check
```

## 2. Vercel 배포 프로세스

### 2.1 GitHub 저장소 연결

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. **New Project** 클릭
3. **Import Git Repository**에서 GitHub 저장소 선택
4. **Configure Project** 단계:
   - Framework Preset: `Next.js`
   - Root Directory: `./` (기본)
   - Build Command: 기본값 유지
   - Output Directory: 기본값 유지 (`.next`)
   - Install Command: 기본값 유지

### 2.2 환경변수 설정

**Vercel Dashboard → Project Settings → Environment Variables**

다음 환경변수를 추가합니다:

```
# 프로덕션 환경
NEXT_PUBLIC_SITE_URL = https://yourdomain.com
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc...
DATABASE_URL = postgresql://...
ANTHROPIC_API_KEY = sk-ant-... (선택)

# Preview 환경 (선택)
NEXT_PUBLIC_SITE_URL = https://[DEPLOYMENT_URL]
```

**선택 항목**: Preview와 Development는 기본적으로 프로덕션과 동일하게 설정되므로, 테스트용 Supabase 프로젝트를 사용하려면 별도 설정이 필요합니다.

### 2.3 배포 실행

```bash
# GitHub에 푸시하면 자동 배포 시작
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

또는 Vercel CLI를 사용하여 수동 배포:

```bash
# Vercel CLI 설치 (필요시)
npm install -g vercel

# 배포
vercel --prod
```

## 3. 배포 후 확인사항

### 3.1 기본 기능 테스트

배포 URL: `https://yourdomain.com` (또는 Vercel 자동 URL)

```
[ ] 로그인/회원가입 페이지 접근 가능
[ ] OAuth 로그인 (카카오/구글) 작동
[ ] 대시보드 로드 (인증 필요)
[ ] 제품 조회/등록
[ ] 재고 조회
[ ] 발주 기능
```

### 3.2 성능 메트릭 확인

**Vercel Dashboard → Analytics**
- First Contentful Paint (FCP): < 1.5초
- Largest Contentful Paint (LCP): < 2.5초
- Cumulative Layout Shift (CLS): < 0.1
- Time to First Byte (TTFB): < 200ms

### 3.3 로그 확인

```bash
# Vercel CLI로 프로덕션 로그 확인
vercel logs --prod

# 실시간 로그 모니터링
vercel logs --prod --follow
```

## 4. 문제 해결

### 4.1 빌드 실패

**증상**: Vercel Dashboard에서 "Build failed" 표시

**해결**:
```bash
# 1. 로컬에서 빌드 테스트
npm run build

# 2. 빌드 에러 메시지 확인
# → Vercel Dashboard → Deployments → [Failed Deployment] → Logs

# 3. 일반적인 원인
# - 환경변수 미설정 → Vercel 설정 확인
# - TypeScript 타입 에러 → npm run type-check
# - ESLint 에러 → npm run lint --fix
# - 의존성 누락 → npm install
```

### 4.2 데이터베이스 연결 실패

**증상**: `ECONNREFUSED` 또는 `authentication failed`

**해결**:
```bash
# 1. DATABASE_URL 확인
# Vercel → Settings → Environment Variables → DATABASE_URL 값 확인

# 2. Supabase IP 허용 설정
# Supabase Dashboard → Project Settings → Database → Network
# → Vercel IP 주소 범위 허용

# 3. 로컬에서 테스트
DATABASE_URL="postgresql://..." npm run db:push
```

### 4.3 인증 리다이렉트 실패

**증상**: OAuth 로그인 시 `redirect_uri_mismatch` 에러

**해결**:
```
1. Supabase Dashboard → Authentication → URL Configuration
   - Site URL: https://yourdomain.com (정확히 일치)
   - Redirect URLs 추가:
     - https://yourdomain.com/auth/callback
     - https://yourdomain.com

2. OAuth 제공자 설정 확인 (카카오/구글)
   - Redirect URI: https://yourdomain.supabase.co/auth/v1/callback (정확히 일치)
```

### 4.4 정적 파일(이미지/CSS) 로드 실패

**증상**: 스타일이 적용되지 않거나 이미지가 안 보임

**해결**:
```bash
# 1. 빌드 시 정적 파일 확인
npm run build
ls -la .next/static

# 2. public 폴더 확인
ls -la public/

# 3. Vercel 캐시 초기화 → Dashboard → Settings → Caching → Clear Cache
```

## 5. 배포 최적화

### 5.1 빌드 시간 최소화

**조치**:
```javascript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 불필요한 polyfill 제거
  swcMinify: true,

  // 이미지 최적화
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
  },

  // 경고 무시 (사용하지 않는 경고)
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
};

export default nextConfig;
```

### 5.2 번들 크기 최적화

```bash
# 번들 분석
npm install --save-dev @next/bundle-analyzer

# package.json에 스크립트 추가
"analyze": "ANALYZE=true next build"

# 분석 실행
npm run analyze
```

**최적화 팁**:
- 큰 라이브러리는 동적 import 사용 (`next/dynamic`)
- CSS는 Tailwind CSS 사용 (트리쉐이킹 지원)
- 사용하지 않는 의존성 제거

### 5.3 데이터베이스 쿼리 최적화

```typescript
// ❌ 나쁜 예: N+1 쿼리
const products = await db.select().from(products);
for (const product of products) {
  const inventory = await db.select().from(inventory)
    .where(eq(inventory.product_id, product.id));
}

// ✅ 좋은 예: JOIN 사용
const data = await db.select().from(products)
  .leftJoin(inventory, eq(products.id, inventory.product_id));
```

## 6. CI/CD 파이프라인

### 6.1 GitHub Actions (프리뷰 배포)

프리뷰 배포는 Vercel이 자동으로 관리합니다.

- **PR 생성 시**: 프리뷰 URL 자동 생성 (댓글 추가)
- **자동 테스트**: Vercel에서 타입 체크 및 린트 자동 실행
- **병합 시**: 프로덕션 배포 (main 브랜치)

### 6.2 메인 브랜치 보호

GitHub → Repository Settings → Branches → Branch Protection

```
✅ Require pull request reviews before merging
✅ Require status checks to pass before merging
   - vercel/flowstok
   - build (GitHub Actions, 필요시)
✅ Require branches to be up to date before merging
```

## 7. 모니터링 & 알림

### 7.1 Vercel Analytics

**Vercel Dashboard → Analytics**

모니터링 항목:
- Page Load Time
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
- Core Web Vitals

### 7.2 에러 추적 (향후: Sentry)

```bash
# Sentry 추가 (선택, Phase 7에서 구현)
npm install @sentry/nextjs
```

### 7.3 커스텀 모니터링

```typescript
// src/lib/monitoring.ts
export async function logDeploymentInfo() {
  console.log(`
    Deployment: ${process.env.NEXT_PUBLIC_SITE_URL}
    Build: ${process.env.VERCEL_GIT_COMMIT_SHA}
    Branch: ${process.env.VERCEL_GIT_COMMIT_REF}
    Environment: ${process.env.VERCEL_ENV}
  `);
}
```

## 8. 롤백 계획

### 8.1 배포 롤백

문제 발생 시 이전 배포로 복구:

```bash
# 방법 1: Vercel Dashboard에서 롤백
# Dashboard → Deployments → [Previous Deployment] → Promote to Production

# 방법 2: GitHub에서 이전 커밋으로 되돌리기
git revert <commit-hash>
git push origin main
```

### 8.2 데이터베이스 롤백

```bash
# 마이그레이션 실패 시 이전 버전으로 복구
# 1. 로컬에서 마이그레이션 테스트 (반드시!)
# 2. 문제 발생 시 Supabase Dashboard에서 수동 복구
```

## 9. 프로덕션 체크리스트

배포 전 다음 항목을 확인합니다:

```
[ ] 환경변수 모두 설정 (Vercel)
[ ] DATABASE_URL이 비밀로 마크됨
[ ] Supabase RLS 정책 활성화됨
[ ] Supabase Auth URL Configuration 설정됨
[ ] 로컬 빌드 성공 (npm run build)
[ ] 타입 체크 통과 (npm run type-check)
[ ] 린트 통과 (npm run lint)
[ ] 기본 기능 테스트 완료
    [ ] 로그인
    [ ] OAuth (카카오/구글)
    [ ] 대시보드 조회
    [ ] 데이터 CRUD
[ ] 성능 메트릭 확인
[ ] 에러 로그 확인
[ ] 도메인 SSL 인증서 설정됨 (Vercel 자동)
```

## 10. 추가 자료

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/app/building-your-application/deploying)
- [Supabase 프로덕션 체크리스트](https://supabase.com/docs/guides/production-readiness)
- [Web Vitals 최적화](https://web.dev/vitals/)

---

**최종 업데이트**: 2026-02-06
