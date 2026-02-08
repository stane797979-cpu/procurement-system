# Supabase Auth 설정 가이드

## 1. 환경변수 설정

`.env.local.example`을 복사하여 `.env.local` 파일을 생성하고 다음 값을 설정합니다.

```bash
# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Database
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

## 2. Supabase 프로젝트 설정

### 2.1 이메일 인증 설정

1. Supabase Dashboard → Authentication → Settings
2. **Enable Email Confirmations** 활성화 (권장)
3. **Email Templates** 설정 (선택)

### 2.2 OAuth 제공자 설정

#### 카카오 (Kakao)

1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
2. 애플리케이션 추가
3. **REST API 키** 복사
4. **플랫폼 설정** → Web 플랫폼 추가
   - Redirect URI: `https://your-project.supabase.co/auth/v1/callback`
5. **동의 항목 설정**
   - 이메일: 필수
   - 프로필 정보(닉네임/프로필 사진): 선택
6. Supabase Dashboard → Authentication → Providers → Kakao
   - **Enable Kakao** 활성화
   - **Client ID**: REST API 키 입력
   - **Redirect URL**: `https://your-project.supabase.co/auth/v1/callback`

#### 구글 (Google)

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. **APIs & Services** → **Credentials**
4. **CREATE CREDENTIALS** → **OAuth 2.0 Client ID**
   - Application type: Web application
   - Authorized redirect URIs: `https://your-project.supabase.co/auth/v1/callback`
5. **Client ID**와 **Client Secret** 복사
6. Supabase Dashboard → Authentication → Providers → Google
   - **Enable Google** 활성화
   - **Client ID**: Google Client ID 입력
   - **Client Secret**: Google Client Secret 입력
   - **Redirect URL**: `https://your-project.supabase.co/auth/v1/callback`

### 2.3 Redirect URLs 설정

Supabase Dashboard → Authentication → URL Configuration

```
Site URL: https://yourdomain.com (프로덕션) 또는 http://localhost:3000 (개발)

Redirect URLs:
- https://yourdomain.com/auth/callback
- http://localhost:3000/auth/callback
```

## 3. 사용 방법

### 3.1 클라이언트 컴포넌트에서 사용

```typescript
'use client'

import { signInWithEmail, signInWithKakao, signInWithGoogle } from '@/lib/supabase/auth'

// 이메일 로그인
const handleEmailLogin = async () => {
  try {
    await signInWithEmail('user@example.com', 'password123')
    // 성공
  } catch (error) {
    console.error(error)
  }
}

// 카카오 로그인
const handleKakaoLogin = async () => {
  try {
    await signInWithKakao()
    // 자동으로 카카오 로그인 페이지로 리다이렉트
  } catch (error) {
    console.error(error)
  }
}

// 구글 로그인
const handleGoogleLogin = async () => {
  try {
    await signInWithGoogle()
    // 자동으로 구글 로그인 페이지로 리다이렉트
  } catch (error) {
    console.error(error)
  }
}
```

### 3.2 Server Actions 사용

```typescript
'use client'

import { signInAction } from '@/server/actions/auth'
import { useActionState } from 'react'

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signInAction, null)

  return (
    <form action={formAction}>
      <input type="email" name="email" required />
      <input type="password" name="password" required />
      <button type="submit" disabled={isPending}>
        로그인
      </button>
      {state?.error && <p>{state.error}</p>}
    </form>
  )
}
```

### 3.3 서버 컴포넌트에서 사용

```typescript
import { getCurrentUserServer } from '@/lib/supabase/auth'

export default async function DashboardPage() {
  const user = await getCurrentUserServer()

  if (!user) {
    redirect('/auth/signin')
  }

  return <div>환영합니다, {user.email}님</div>
}
```

## 4. 보호된 라우트

미들웨어가 다음 라우트를 자동으로 보호합니다.

- `/dashboard`
- `/procurement`
- `/orders`
- `/analysis`
- `/kpi`
- `/simulation`
- `/auto-orders`
- `/ai`
- `/settings`

인증되지 않은 사용자는 자동으로 `/login`으로 리다이렉트됩니다.

## 5. RLS (Row Level Security) 정책

사용자 인증 후 RLS 정책을 설정해야 합니다.

```sql
-- 예시: 사용자는 자신의 조직 데이터만 볼 수 있음
CREATE POLICY "Users can view own organization data"
ON products FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE auth.uid() = id
  )
);
```

## 6. 문제 해결

### 6.1 OAuth 리다이렉트 실패

- Callback URL이 정확한지 확인
- Site URL이 올바른지 확인
- OAuth 제공자 설정에서 Redirect URI 확인

### 6.2 이메일 인증 이메일이 오지 않음

- Supabase Dashboard → Settings → Auth → SMTP Settings 확인
- 스팸 폴더 확인
- 개발 환경에서는 Supabase의 기본 이메일 서비스 사용 (제한적)

### 6.3 세션 만료 문제

- `src/middleware.ts`에서 자동으로 세션 갱신
- 기본 세션 만료 시간: 1시간
- Refresh Token 만료 시간: 30일

## 7. 프로덕션 체크리스트

- [ ] `.env.local`을 `.env.production`으로 복사하고 프로덕션 값 설정
- [ ] Supabase Dashboard에서 프로덕션 Site URL 설정
- [ ] OAuth 제공자에서 프로덕션 Redirect URI 추가
- [ ] 이메일 템플릿 커스터마이징
- [ ] SMTP 설정 (SendGrid, AWS SES 등)
- [ ] RLS 정책 검토 및 테스트
- [ ] Rate Limiting 설정 (Upstash Redis)
