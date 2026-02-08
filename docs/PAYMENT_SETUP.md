# PortOne + 토스페이먼츠 결제 설정 가이드

FlowStok SaaS의 구독 결제 시스템 설정 및 사용 가이드입니다.

## 목차

1. [개요](#개요)
2. [구독 플랜](#구독-플랜)
3. [환경 설정](#환경-설정)
4. [PortOne 설정](#portone-설정)
5. [Mock 모드](#mock-모드)
6. [API 엔드포인트](#api-엔드포인트)
7. [플랜 제한 체크](#플랜-제한-체크)
8. [결제 플로우](#결제-플로우)
9. [웹훅 처리](#웹훅-처리)
10. [문제 해결](#문제-해결)

---

## 개요

### 기술 스택

- **결제 게이트웨이**: PortOne V2
- **PG사**: 토스페이먼츠
- **결제 수단**: 카드, 토스페이, 카카오페이, 네이버페이
- **SDK**: `@portone/browser-sdk` (브라우저 클라이언트)

### 주요 기능

- 월간/연간 구독 결제
- 플랜 업그레이드/다운그레이드
- 구독 취소 및 환불
- 플랜별 기능 제한
- Mock 모드 (개발/테스트)

---

## 구독 플랜

### 플랜 비교

| 플랜 | 가격 (월/연) | 제품 수 | 사용자 수 | 발주 건수 | AI 채팅 | 주요 기능 |
|------|------------|---------|---------|---------|---------|---------|
| **무료** | ₩0 | 10개 | 1명 | 10건/월 | 10회/월 | 기본 재고 관리 |
| **스타터** | ₩49,000 / ₩490,000 | 100개 | 3명 | 무제한 | 100회/월 | ABC/XYZ 분석, 수요 예측 |
| **프로** | ₩149,000 / ₩1,490,000 | 무제한 | 10명 | 무제한 | 500회/월 | 시뮬레이션, API, 고급 분석 |
| **엔터프라이즈** | 별도 문의 | 무제한 | 무제한 | 무제한 | 무제한 | 전담 매니저, 온프레미스, SLA |

### 플랜별 제한 사항

```typescript
// src/types/subscription.ts
export interface PlanLimits {
  maxProducts: number;        // 최대 제품 수
  maxUsers: number;           // 최대 사용자 수
  maxOrders: number;          // 월 최대 발주 건수
  aiChatLimit: number;        // 월 AI 채팅 메시지 수
  aiToolCallLimit: number;    // 월 AI 도구 호출 수
  dataRetentionDays: number;  // 데이터 보관 기간 (일)
  hasABCXYZ: boolean;         // ABC/XYZ 분석
  hasDemandForecast: boolean; // 수요 예측
  hasSimulation: boolean;     // 시나리오 시뮬레이션
  hasAPIAccess: boolean;      // API 접근
  hasAdvancedAnalytics: boolean; // 고급 분석
  hasEmailSupport: boolean;   // 이메일 지원
  hasPrioritySupport: boolean; // 우선 지원
}
```

---

## 환경 설정

### 1. 환경변수 추가

`.env.local` 파일에 다음 변수를 추가하세요:

```env
# PortOne V2 설정
NEXT_PUBLIC_PORTONE_STORE_ID=store-your-store-id
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=channel-key-your-channel-key
PORTONE_API_SECRET=your-api-secret

# 결제 Mock 모드 (개발/테스트 환경)
# true: 실제 결제 없이 시뮬레이션, false: 실제 결제
NEXT_PUBLIC_PAYMENT_MOCK=true
```

### 2. 패키지 설치

```bash
npm install @portone/browser-sdk
```

### 3. DB 마이그레이션

```bash
npm run db:generate  # 마이그레이션 파일 생성
npm run db:migrate   # 마이그레이션 적용
```

**추가된 테이블:**
- `subscriptions`: 구독 정보
- `payment_history`: 결제 내역

---

## PortOne 설정

### 1. PortOne 계정 생성

1. [PortOne 콘솔](https://portone.io/)에 접속
2. 회원가입 및 로그인
3. 새 스토어 생성

### 2. 스토어 ID 및 API Secret 확인

1. 콘솔 → **설정** → **API/Webhook**
2. **Store ID** 복사 → `NEXT_PUBLIC_PORTONE_STORE_ID`
3. **API 키 관리** → API Secret 생성 → `PORTONE_API_SECRET`

### 3. 토스페이먼츠 연동

1. 콘솔 → **결제** → **PG 연동**
2. **토스페이먼츠** 선택
3. 가맹점 정보 입력 (테스트 모드는 별도 입력 불필요)
4. 채널 키 복사 → `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`

### 4. 결제 수단 설정

콘솔에서 다음 결제 수단을 활성화하세요:

- ✅ 카드 결제 (토스페이먼츠)
- ✅ 토스페이
- ✅ 카카오페이
- ✅ 네이버페이

### 5. 웹훅 URL 설정

1. 콘솔 → **설정** → **Webhook**
2. Webhook URL 추가: `https://yourdomain.com/api/payment/webhook`
3. 이벤트 선택:
   - `PaymentStatusChanged` (결제 상태 변경)
   - `PaymentRefunded` (환불)
   - `SubscriptionRenewed` (구독 갱신)

---

## Mock 모드

개발/테스트 환경에서는 Mock 모드를 활성화하여 실제 결제 없이 테스트할 수 있습니다.

### Mock 모드 활성화

```env
NEXT_PUBLIC_PAYMENT_MOCK=true
```

### Mock 모드 동작

- 결제 요청 시 2초 딜레이 후 80% 확률로 성공
- 실제 PortOne API 호출 없음
- Mock 트랜잭션 ID 생성: `mock_payment_xxx`
- 웹훅 서명 검증 스킹

### 프로덕션 배포 전 체크

```env
# ⚠️ 프로덕션에서는 반드시 false로 설정!
NEXT_PUBLIC_PAYMENT_MOCK=false
```

---

## API 엔드포인트

### 1. 결제 체크아웃

**POST** `/api/payment/checkout`

결제 정보 생성 (클라이언트에서 PortOne SDK 호출 전)

```typescript
// Request
{
  "organizationId": "uuid",
  "plan": "starter" | "pro",
  "billingCycle": "monthly" | "yearly",
  "paymentMethod": "card" | "tosspay" | "kakaopay" | "naverpay"
}

// Response
{
  "organizationId": "uuid",
  "plan": "starter",
  "billingCycle": "monthly",
  "paymentMethod": "card",
  "amount": 49000,
  "paymentId": "payment_xxx"
}
```

### 2. 결제 검증

**POST** `/api/payment/verify`

결제 완료 후 백엔드에서 검증 및 구독 생성

```typescript
// Request
{
  "paymentId": "payment_xxx",
  "organizationId": "uuid",
  "plan": "starter",
  "billingCycle": "monthly",
  "amount": 49000,
  "method": "card"
}

// Response
{
  "verified": true,
  "subscriptionId": "uuid",
  "plan": "starter",
  "currentPeriodEnd": "2027-03-06T15:00:00.000Z"
}
```

### 3. 구독 취소

**POST** `/api/payment/cancel`

```typescript
// Request
{
  "subscriptionId": "uuid",
  "immediate": false  // false: 기간 종료 시 취소, true: 즉시 취소 + 환불
}

// Response
{
  "success": true,
  "subscriptionId": "uuid",
  "canceledAt": "2026-02-06T15:00:00.000Z",
  "immediate": false
}
```

### 4. 플랜 변경

**POST** `/api/payment/change-plan`

```typescript
// Request
{
  "subscriptionId": "uuid",
  "newPlan": "pro"
}

// Response
{
  "success": true,
  "subscriptionId": "uuid",
  "newPlan": "pro",
  "message": "플랜이 업그레이드되었습니다"
}
```

### 5. 웹훅

**POST** `/api/payment/webhook`

PortOne에서 결제 이벤트 발생 시 자동 호출됩니다.

```typescript
// Webhook Payload 예시
{
  "type": "PaymentStatusChanged",
  "data": {
    "paymentId": "payment_xxx",
    "status": "PAID",
    "customData": {
      "organizationId": "uuid",
      "subscriptionId": "uuid"
    }
  }
}
```

---

## 플랜 제한 체크

### 1. 리소스 제한 체크

```typescript
import { checkLimit } from '@/lib/plan-limits';

// 제품 추가 가능 여부 체크
const result = await checkLimit(organizationId, 'products');
// {
//   allowed: true,
//   current: 5,
//   limit: 100,
//   remaining: 95
// }

if (!result.allowed) {
  return { error: '플랜 제한을 초과했습니다. 업그레이드가 필요합니다.' };
}

// 제품 추가 로직...
```

### 2. 기능 사용 가능 여부 체크

```typescript
import { checkFeature } from '@/lib/plan-limits';

// ABC/XYZ 분석 기능 사용 가능 여부
const hasFeature = await checkFeature(organizationId, 'abcxyz');

if (!hasFeature) {
  return { error: 'ABC/XYZ 분석은 스타터 플랜 이상에서 사용 가능합니다.' };
}

// 분석 로직...
```

### 3. 사용량 요약 조회

```typescript
import { getUsageSummary } from '@/lib/plan-limits';

const summary = await getUsageSummary(organizationId);
// {
//   plan: 'starter',
//   limits: { maxProducts: 100, ... },
//   usage: {
//     products: { current: 25, limit: 100, percentage: 25 },
//     users: { current: 2, limit: 3, percentage: 66.67 },
//     orders: { current: 45, limit: 99999, percentage: 0.045 },
//     aiChat: { current: 18, limit: 100, percentage: 18 }
//   }
// }
```

---

## 결제 플로우

### 클라이언트 사이드

```typescript
import { requestPayment } from '@/lib/payment';

// 1. 결제 요청
const result = await requestPayment({
  organizationId: 'uuid',
  plan: 'starter',
  billingCycle: 'monthly',
  paymentMethod: 'card',
});

if (result.success) {
  // 2. 백엔드에서 결제 검증 (자동 호출됨)
  console.log('결제 성공:', result.transactionId);
  console.log('구독 ID:', result.subscriptionId);
} else {
  console.error('결제 실패:', result.error);
}
```

### 서버 사이드 (결제 검증)

결제 완료 후 `requestPayment` 함수 내부에서 자동으로 `/api/payment/verify`를 호출하여 검증합니다.

```typescript
// src/lib/payment.ts
export async function verifyPayment(paymentId: string): Promise<boolean> {
  const response = await fetch('/api/payment/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId }),
  });

  const result = await response.json();
  return result.verified === true;
}
```

---

## 웹훅 처리

### 웹훅 서명 검증

```typescript
// src/app/api/payment/webhook/route.ts
const signature = request.headers.get('x-portone-signature');
const isValid = await verifyWebhookSignature(body, signature);

if (!isValid) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
```

### 이벤트 처리

```typescript
switch (type) {
  case 'PaymentStatusChanged':
    // 결제 상태 변경 (성공/실패)
    await handlePaymentStatusChanged(data);
    break;

  case 'PaymentRefunded':
    // 환불 처리
    await handlePaymentRefunded(data);
    break;

  case 'SubscriptionRenewed':
    // 구독 갱신 (월간/연간 자동 결제)
    await handleSubscriptionRenewed(data);
    break;
}
```

---

## 문제 해결

### 1. 결제 창이 열리지 않음

**원인**: PortOne SDK 로드 실패 또는 Store ID 누락

**해결**:
```typescript
// 1. 환경변수 확인
console.log('Store ID:', process.env.NEXT_PUBLIC_PORTONE_STORE_ID);

// 2. SDK 임포트 확인
import * as PortOne from "@portone/browser-sdk/v2";

// 3. 브라우저 콘솔에서 에러 확인
```

### 2. 결제 검증 실패

**원인**: 백엔드 API 호출 실패 또는 PortOne API Secret 누락

**해결**:
```env
# .env.local에 추가
PORTONE_API_SECRET=your-api-secret
```

### 3. 웹훅이 동작하지 않음

**원인**: Webhook URL 미설정 또는 HTTPS 미사용

**해결**:
1. PortOne 콘솔에서 Webhook URL 확인
2. 프로덕션 환경에서는 HTTPS 필수
3. ngrok 등으로 로컬 테스트 가능:
   ```bash
   ngrok http 3000
   # Webhook URL: https://xxx.ngrok.io/api/payment/webhook
   ```

### 4. Mock 모드에서 실제 결제가 시도됨

**원인**: 환경변수 설정 오류

**해결**:
```env
# 대소문자 정확히 입력
NEXT_PUBLIC_PAYMENT_MOCK=true

# 브라우저에서 확인
console.log('Mock Mode:', process.env.NEXT_PUBLIC_PAYMENT_MOCK === 'true');
```

### 5. 플랜 제한 체크가 동작하지 않음

**원인**: 조직의 플랜이 DB에 올바르게 저장되지 않음

**해결**:
```sql
-- 조직의 현재 플랜 확인
SELECT id, name, plan FROM organizations WHERE id = 'organization-uuid';

-- 플랜 수동 업데이트
UPDATE organizations SET plan = 'starter' WHERE id = 'organization-uuid';
```

---

## 테스트 체크리스트

### Mock 모드 테스트

- [ ] 결제 요청 시 2초 딜레이 확인
- [ ] 성공 응답 확인 (80% 확률)
- [ ] 실패 응답 확인 (20% 확률)
- [ ] Mock 트랜잭션 ID 형식 확인 (`mock_xxx`)

### 실제 결제 테스트 (테스트 모드)

- [ ] 카드 결제 (테스트 카드: 4000-0000-0000-0000)
- [ ] 토스페이 결제
- [ ] 카카오페이 결제
- [ ] 네이버페이 결제
- [ ] 결제 취소 및 환불
- [ ] 플랜 업그레이드
- [ ] 플랜 다운그레이드

### 플랜 제한 테스트

- [ ] 무료 플랜: 제품 10개 초과 시 차단
- [ ] 스타터 플랜: 제품 100개 초과 시 차단
- [ ] ABC/XYZ 분석 기능 제한 확인
- [ ] 수요 예측 기능 제한 확인
- [ ] AI 채팅 사용량 초과 시 차단

### 웹훅 테스트

- [ ] 결제 성공 시 웹훅 수신
- [ ] 결제 실패 시 웹훅 수신
- [ ] 환불 시 웹훅 수신
- [ ] 구독 갱신 시 웹훅 수신
- [ ] 웹훅 서명 검증 확인

---

## 프로덕션 배포 체크리스트

### 환경변수

- [ ] `NEXT_PUBLIC_PORTONE_STORE_ID`: 프로덕션 Store ID
- [ ] `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`: 프로덕션 Channel Key
- [ ] `PORTONE_API_SECRET`: 프로덕션 API Secret
- [ ] `NEXT_PUBLIC_PAYMENT_MOCK=false`: Mock 모드 비활성화

### PortOne 설정

- [ ] 프로덕션 모드로 전환
- [ ] 가맹점 정보 입력 (사업자등록번호 등)
- [ ] 정산 계좌 등록
- [ ] Webhook URL을 프로덕션 도메인으로 변경

### 보안

- [ ] HTTPS 인증서 설정
- [ ] Webhook 서명 검증 활성화
- [ ] Rate Limiting 설정 (Upstash Redis)
- [ ] 민감 정보 로그 출력 제거

### 모니터링

- [ ] Sentry 에러 추적 설정
- [ ] PostHog 결제 이벤트 추적
- [ ] 결제 실패 알림 설정
- [ ] 웹훅 실패 알림 설정

---

## 참고 자료

- [PortOne V2 공식 문서](https://portone.io/docs)
- [토스페이먼츠 개발자 센터](https://docs.tosspayments.com/)
- [PortOne 브라우저 SDK](https://www.npmjs.com/package/@portone/browser-sdk)
- [결제 테스트 카드 목록](https://portone.io/docs/ko/pg/test-card)

---

## 문의

결제 시스템 관련 문의사항은 다음 채널로 연락주세요:

- **기술 지원**: support@flowstok.co.kr
- **영업 문의** (엔터프라이즈): sales@flowstok.co.kr
- **PortOne 고객센터**: https://portone.io/support
