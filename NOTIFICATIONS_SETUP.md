# 알림 시스템 설정 가이드

FlowStok의 이메일 및 SMS 알림 시스템을 설정하는 방법입니다.

## 목차

- [개요](#개요)
- [1. Resend 이메일 설정](#1-resend-이메일-설정)
- [2. CoolSMS 문자 설정](#2-coolsms-문자-설정)
- [3. 환경변수 설정](#3-환경변수-설정)
- [4. Mock 모드](#4-mock-모드)
- [5. 알림 테스트](#5-알림-테스트)
- [6. 코드 사용 예제](#6-코드-사용-예제)
- [7. 트러블슈팅](#7-트러블슈팅)

---

## 개요

### 지원 기능

- **이메일 알림** (Resend)
  - 재고 부족 알림
  - 발주서 생성 알림
  - 입고 완료 알림
  - 사용자 지정 이메일

- **SMS 알림** (CoolSMS)
  - 재고 부족 알림
  - 발주서 생성 알림
  - 입고 완료 알림
  - 사용자 지정 문자

### 기술 스택

- **Resend**: 트랜잭셔널 이메일 전송
- **CoolSMS**: 국내 SMS/LMS/MMS 전송
- **Mock 모드**: 개발/테스트 환경에서 실제 전송 없이 로그만 출력

---

## 1. Resend 이메일 설정

### 1.1 Resend 계정 생성

1. [Resend 웹사이트](https://resend.com/)에 접속
2. 무료 계정 생성 (월 100통 무료)
3. 이메일 인증 완료

### 1.2 도메인 인증

이메일을 발송하려면 도메인 인증이 필요합니다.

1. Resend 대시보드 → **Domains** 메뉴
2. **Add Domain** 클릭
3. 발송에 사용할 도메인 입력 (예: `yourdomain.com`)
4. DNS 레코드 추가 (Resend가 제공하는 값)
   - SPF: `v=spf1 include:resend.com ~all`
   - DKIM: TXT 레코드 추가
   - DMARC: `v=DMARC1; p=none`

5. DNS 전파 대기 (최대 24시간)
6. **Verify** 클릭하여 인증 완료

### 1.3 API Key 발급

1. Resend 대시보드 → **API Keys** 메뉴
2. **Create API Key** 클릭
3. 이름 입력 (예: `FlowStok Production`)
4. 권한 선택: `Full Access` 또는 `Sending access`
5. API Key 복사 (한 번만 표시됨, 안전하게 보관)

---

## 2. CoolSMS 문자 설정

### 2.1 CoolSMS 계정 생성

1. [CoolSMS 웹사이트](https://www.coolsms.co.kr/)에 접속
2. 회원가입 (사업자 또는 개인)
3. 본인 인증 완료

### 2.2 발신번호 등록

SMS 발송에는 발신번호 등록이 필수입니다.

1. CoolSMS 콘솔 → **발신번호 관리**
2. **발신번호 추가** 클릭
3. 전화번호 입력 (예: `010-1234-5678`)
4. 인증 방법 선택:
   - **통신사 인증** (권장): 휴대폰 소유자 본인 인증
   - **서류 인증**: 사업자등록증 또는 통신사 청구서 제출
5. 인증 완료 대기 (1-3 영업일)

### 2.3 API Key 발급

1. CoolSMS 콘솔 → **API Key 관리**
2. **API Key 생성** 클릭
3. API Key와 API Secret 복사 (안전하게 보관)

### 2.4 충전

1. CoolSMS 콘솔 → **충전**
2. 원하는 금액 충전
   - SMS (90바이트, 한글 45자): 약 20원/건
   - LMS (2000바이트, 한글 1000자): 약 50원/건

---

## 3. 환경변수 설정

`.env.local` 파일에 다음 환경변수를 추가하세요.

```bash
# ============================================
# 6.5 이메일 알림 설정 (Resend)
# ============================================
RESEND_API_KEY=re_your-api-key                      # Resend API Key
RESEND_FROM_EMAIL=noreply@yourdomain.com            # 발신자 이메일 (도메인 인증 필요)
RESEND_FROM_NAME=FlowStok                  # 발신자 이름

# ============================================
# 6.6 SMS 알림 설정 (CoolSMS)
# ============================================
COOLSMS_API_KEY=your-api-key                        # CoolSMS API Key
COOLSMS_API_SECRET=your-api-secret                  # CoolSMS API Secret
COOLSMS_SENDER_PHONE=01012345678                    # 발신번호 (하이픈 없이)

# Mock 모드 (true면 실제 전송 안함, 로그만 출력)
NOTIFICATIONS_MOCK_MODE=true                        # 개발: true, 프로덕션: false
```

### 프로덕션 배포 시

Vercel/Railway 등 배포 플랫폼의 환경변수 설정에 동일한 값을 추가하세요.

---

## 4. Mock 모드

### 4.1 Mock 모드란?

개발/테스트 환경에서 실제 이메일이나 SMS를 전송하지 않고, 콘솔 로그만 출력하는 모드입니다.

### 4.2 활성화

```bash
NOTIFICATIONS_MOCK_MODE=true
```

### 4.3 로그 확인

터미널에서 다음과 같은 로그를 확인할 수 있습니다.

```
📧 [Mock] 이메일 전송: {
  from: 'FlowStok <noreply@yourdomain.com>',
  to: 'user@example.com',
  subject: '[긴급] 재고 부족 알림 - 테스트 제품',
  html: '...'
}
```

```
📱 [Mock] SMS 전송: {
  from: '01012345678',
  to: '01098765432',
  message: '[FlowStok] 테스트 제품 재고 부족 알림...',
  type: 'SMS'
}
```

---

## 5. 알림 테스트

### 5.1 테스트 페이지 접속

1. 애플리케이션 실행: `npm run dev`
2. 로그인 후 **설정** 메뉴 → **알림 테스트** 탭 이동

### 5.2 이메일 테스트

1. **이메일** 탭 선택
2. 수신자 이메일 입력
3. 템플릿 선택:
   - 재고 부족 알림
   - 발주서 생성 알림
   - 입고 완료 알림
   - 사용자 지정
4. **테스트 이메일 전송** 버튼 클릭
5. Mock 모드: 콘솔 로그 확인
6. 실제 모드: 수신 메일함 확인

### 5.3 SMS 테스트

1. **SMS** 탭 선택
2. 수신자 전화번호 입력 (010-1234-5678 또는 01012345678)
3. 템플릿 선택
4. **테스트 SMS 전송** 버튼 클릭
5. Mock 모드: 콘솔 로그 확인
6. 실제 모드: 휴대폰 문자 확인

---

## 6. 코드 사용 예제

### 6.1 서버 측에서 알림 전송

#### 이메일 전송

```typescript
import {
  sendEmail,
  getInventoryAlertEmailTemplate,
} from '@/lib/notifications'

// 재고 부족 알림 이메일 전송
const emailTemplate = getInventoryAlertEmailTemplate({
  productName: '테스트 제품',
  currentStock: 5,
  safetyStock: 20,
  reorderPoint: 30,
  status: '위험',
})

const result = await sendEmail({
  to: 'manager@example.com',
  subject: emailTemplate.subject,
  html: emailTemplate.html,
  text: emailTemplate.text,
})

if (result.success) {
  console.log('이메일 전송 성공:', result.id)
} else {
  console.error('이메일 전송 실패:', result.error)
}
```

#### SMS 전송

```typescript
import {
  sendSMS,
  getInventoryAlertSMSTemplate,
} from '@/lib/notifications'

// 재고 부족 알림 SMS 전송
const smsMessage = getInventoryAlertSMSTemplate({
  productName: '테스트 제품',
  currentStock: 5,
  status: '위험',
})

const result = await sendSMS({
  to: '01012345678',
  message: smsMessage,
})

if (result.success) {
  console.log('SMS 전송 성공:', result.id)
} else {
  console.error('SMS 전송 실패:', result.error)
}
```

### 6.2 클라이언트에서 API 호출

#### 이메일 API 호출

```typescript
const response = await fetch('/api/notifications/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'user@example.com',
    subject: '테스트 이메일',
    html: '<p>테스트 본문</p>',
    text: '테스트 본문',
  }),
})

const data = await response.json()
if (data.success) {
  console.log('이메일 전송 성공')
}
```

#### SMS API 호출

```typescript
const response = await fetch('/api/notifications/sms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '01012345678',
    message: '테스트 문자',
  }),
})

const data = await response.json()
if (data.success) {
  console.log('SMS 전송 성공')
}
```

### 6.3 사용자 지정 템플릿

```typescript
import { sendEmail } from '@/lib/notifications'

// 사용자 지정 이메일
const result = await sendEmail({
  to: ['user1@example.com', 'user2@example.com'],
  subject: '시스템 점검 안내',
  html: `
    <div style="font-family: 'Malgun Gothic', sans-serif; padding: 20px;">
      <h1>시스템 점검 안내</h1>
      <p>2026년 2월 10일 02:00-04:00 동안 시스템 점검이 예정되어 있습니다.</p>
      <p>점검 시간 동안 서비스 이용이 제한될 수 있습니다.</p>
      <p>감사합니다.</p>
    </div>
  `,
  text: '시스템 점검 안내\n\n2026년 2월 10일 02:00-04:00 동안 시스템 점검이 예정되어 있습니다.',
  cc: 'admin@example.com',
})
```

---

## 7. 트러블슈팅

### 7.1 이메일이 전송되지 않아요

#### 확인 사항

1. **API Key 확인**
   ```bash
   echo $RESEND_API_KEY
   # re_로 시작하는지 확인
   ```

2. **도메인 인증 확인**
   - Resend 대시보드에서 도메인 인증 상태 확인
   - DNS 레코드가 올바르게 설정되었는지 확인

3. **발신자 이메일 확인**
   - `RESEND_FROM_EMAIL`이 인증된 도메인과 일치하는지 확인
   - 예: `noreply@yourdomain.com` (yourdomain.com 인증 필요)

4. **에러 로그 확인**
   ```bash
   npm run dev
   # 터미널에서 에러 메시지 확인
   ```

#### 일반적인 에러

- `Resend 클라이언트가 초기화되지 않았습니다`: API Key가 설정되지 않음
- `Domain not verified`: 도메인 인증 미완료
- `Invalid from address`: 발신자 이메일이 인증된 도메인이 아님

### 7.2 SMS가 전송되지 않아요

#### 확인 사항

1. **API Key 확인**
   ```bash
   echo $COOLSMS_API_KEY
   echo $COOLSMS_API_SECRET
   ```

2. **발신번호 등록 확인**
   - CoolSMS 콘솔에서 발신번호 인증 상태 확인
   - `COOLSMS_SENDER_PHONE`이 등록된 번호와 일치하는지 확인

3. **충전 잔액 확인**
   - CoolSMS 콘솔에서 잔액 확인
   - SMS 1건당 약 20원 필요

4. **전화번호 형식 확인**
   - 하이픈 없이: `01012345678` (권장)
   - 하이픈 포함: `010-1234-5678` (자동 변환됨)

#### 일반적인 에러

- `CoolSMS 클라이언트가 초기화되지 않았습니다`: API Key 미설정
- `발신번호가 설정되지 않았습니다`: `COOLSMS_SENDER_PHONE` 미설정
- `Sender number not registered`: 발신번호 미등록 또는 미승인
- `Insufficient balance`: 잔액 부족

### 7.3 Mock 모드인지 확인하는 방법

```typescript
import { isMockMode } from '@/lib/notifications'

if (isMockMode()) {
  console.log('Mock 모드 활성화: 실제 알림이 전송되지 않습니다')
}
```

또는 환경변수 직접 확인:

```bash
echo $NOTIFICATIONS_MOCK_MODE
# true면 Mock 모드, false 또는 없으면 실제 전송
```

### 7.4 프로덕션 배포 시 체크리스트

- [ ] Resend 도메인 인증 완료
- [ ] CoolSMS 발신번호 등록 완료
- [ ] 환경변수 설정:
  - [ ] `RESEND_API_KEY`
  - [ ] `RESEND_FROM_EMAIL`
  - [ ] `RESEND_FROM_NAME`
  - [ ] `COOLSMS_API_KEY`
  - [ ] `COOLSMS_API_SECRET`
  - [ ] `COOLSMS_SENDER_PHONE`
  - [ ] `NOTIFICATIONS_MOCK_MODE=false`
- [ ] CoolSMS 충전 완료
- [ ] 테스트 전송 성공
- [ ] 알림 로깅 설정 완료

---

## 참고 자료

- [Resend 공식 문서](https://resend.com/docs)
- [CoolSMS 공식 문서](https://docs.coolsms.co.kr/)
- [Resend Pricing](https://resend.com/pricing) - 월 100통 무료
- [CoolSMS 요금제](https://www.coolsms.co.kr/pricing)

---

## 문의

알림 시스템 관련 문의사항은 시스템 관리자에게 연락해주세요.
