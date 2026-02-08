# Railway 백그라운드 잡 설정 가이드

## 개요

이 문서는 Railway에서 백그라운드 크론잡을 설정하는 방법을 설명합니다.

FlowStok SaaS는 2개의 크론잡을 사용합니다:

1. **자동 발주 크론잡** - 매일 09:00 KST에 발주점 이하 제품을 자동으로 발주
2. **재고 점검 크론잡** - 매 6시간마다 재고 상태를 점검하고 알림 생성

## 크론잡 목록

### 1. 자동 발주 크론잡

**API 엔드포인트:** `GET /api/cron/auto-reorder`

**스케줄:** 매일 09:00 KST (00:00 UTC)

**기능:**
- 모든 조직의 재고 상태 확인
- 발주점 이하 제품 자동 발주서 생성
- 발주 스코어 60점 이상 제품만 처리
- 공급자별로 발주서 생성

**응답 예시:**
```json
{
  "success": true,
  "timestamp": "2026-02-07T00:00:00.000Z",
  "duration": 2341,
  "summary": {
    "totalOrganizations": 5,
    "totalProductsProcessed": 23,
    "totalOrdersCreated": 8
  },
  "results": [
    {
      "organizationId": "...",
      "organizationName": "샘플 회사",
      "productsProcessed": 12,
      "ordersCreated": 3
    }
  ]
}
```

### 2. 재고 점검 크론잡

**API 엔드포인트:** `GET /api/cron/inventory-check`

**스케줄:** 매 6시간 (00:00, 06:00, 12:00, 18:00 UTC)

**기능:**
- 모든 조직의 재고 상태 점검
- 품절/위험/부족 상태 알림 생성
- 과다/과잉 재고 알림 생성
- 중복 알림 방지 (6시간 내 같은 알림 스킵)

**응답 예시:**
```json
{
  "success": true,
  "timestamp": "2026-02-07T06:00:00.000Z",
  "duration": 1823,
  "summary": {
    "totalOrganizations": 5,
    "totalProductsChecked": 145,
    "totalAlertsCreated": 7
  },
  "results": [
    {
      "organizationId": "...",
      "organizationName": "샘플 회사",
      "productsChecked": 45,
      "alertsCreated": 3,
      "breakdown": {
        "outOfStock": 1,
        "critical": 1,
        "low": 1,
        "excess": 0,
        "overstock": 0
      }
    }
  ]
}
```

## Railway 설정

### 사전 준비

1. **Railway 계정 생성**
   - https://railway.app/ 접속
   - GitHub 계정으로 로그인

2. **프로젝트 연결**
   - Railway에서 GitHub 리포지토리 연결
   - Next.js 프로젝트 자동 감지

3. **환경변수 설정**
   - Railway 대시보드 → Settings → Variables
   - `.env.local.example`의 모든 환경변수 추가
   - **필수**: `CRON_SECRET` (아래 참고)

### CRON_SECRET 생성

크론잡 인증을 위한 랜덤 토큰 생성:

```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

생성된 값을 Railway 환경변수에 추가:
```
CRON_SECRET=your-random-secret-token-here
```

### 크론잡 생성

Railway에서는 별도의 크론 서비스를 생성하여 HTTP 요청으로 크론잡을 실행합니다.

#### 방법 1: Railway Cron (권장)

1. **Railway 대시보드 접속**
   - 프로젝트 선택
   - "New" → "Cron" 클릭

2. **자동 발주 크론잡 생성**
   ```
   Name: Auto Reorder
   Schedule: 0 0 * * *
   Command: curl -X GET "$NEXT_PUBLIC_SITE_URL/api/cron/auto-reorder?secret=$CRON_SECRET"
   ```

3. **재고 점검 크론잡 생성**
   ```
   Name: Inventory Check
   Schedule: 0 */6 * * *
   Command: curl -X GET "$NEXT_PUBLIC_SITE_URL/api/cron/inventory-check?secret=$CRON_SECRET"
   ```

#### 방법 2: 외부 Cron 서비스

Railway Cron이 없는 경우 외부 서비스 사용:

**EasyCron (https://www.easycron.com/)**
- 무료 플랜: 크론잡 최대 20개
- URL 기반 크론잡 지원

**cron-job.org (https://cron-job.org/)**
- 무료, 무제한
- HTTP 요청 기반

설정 예시:
```
URL: https://yourdomain.com/api/cron/auto-reorder?secret=YOUR_CRON_SECRET
Method: GET
Schedule: 0 0 * * * (Daily at 00:00 UTC)
```

### Cron 스케줄 형식

```
[분] [시] [일] [월] [요일]

예시:
0 0 * * *     - 매일 자정 UTC (09:00 KST)
0 */6 * * *   - 6시간마다 (00:00, 06:00, 12:00, 18:00)
0 9 * * *     - 매일 09:00 UTC (18:00 KST)
0 0 * * 0     - 매주 일요일 자정
0 0 1 * *     - 매월 1일 자정
```

**시간대 주의:**
- Railway Cron은 UTC 기준
- 한국 시간(KST) = UTC + 9시간
- 예: 09:00 KST = 00:00 UTC

참고: https://crontab.guru/

## 테스트

### 로컬 테스트

```bash
# 환경변수 설정
export CRON_SECRET="your-secret-here"

# 개발 서버 실행
npm run dev

# 크론잡 테스트
curl -X GET "http://localhost:3000/api/cron/auto-reorder?secret=your-secret-here"
curl -X GET "http://localhost:3000/api/cron/inventory-check?secret=your-secret-here"
```

### 프로덕션 테스트

```bash
# Vercel 배포 후
curl -X GET "https://yourdomain.com/api/cron/auto-reorder?secret=YOUR_CRON_SECRET"
curl -X GET "https://yourdomain.com/api/cron/inventory-check?secret=YOUR_CRON_SECRET"
```

**성공 응답 (200):**
```json
{
  "success": true,
  "timestamp": "...",
  "duration": 2341,
  "summary": { ... },
  "results": [ ... ]
}
```

**실패 응답 (401):**
```json
{
  "error": "Unauthorized"
}
```

## 모니터링

### Railway 대시보드

1. Railway 프로젝트 → Cron 서비스 선택
2. "Logs" 탭에서 실행 기록 확인
3. 실패 시 자동 재시도 (최대 10회)

### 애플리케이션 로그

크론잡 실행 시 서버 로그에 상세 정보 출력:

```
[Auto-Reorder Cron] 시작: 2026-02-07T00:00:00.000Z
[Auto-Reorder Cron] 처리할 조직 수: 5
[Auto-Reorder Cron] 조직 처리 시작: 샘플 회사 (...)
[Auto-Reorder Cron] 조직 샘플 회사: 발주 필요 제품 12개
[Auto-Reorder Cron] 발주서 생성: AUTO-1707264000000-ABC123 (공급자: ..., 품목 5개)
[Auto-Reorder Cron] 완료: { duration: '2341ms', ... }
```

### Sentry 에러 추적

크론잡 실패 시 Sentry에 자동 보고:
- Railway 대시보드 → Settings → Integrations → Sentry

### PostHog 분석

크론잡 실행 통계:
- 실행 횟수
- 평균 실행 시간
- 성공/실패 비율

## 주의사항

### 보안

1. **CRON_SECRET 보호**
   - 절대 코드에 하드코딩하지 말 것
   - Railway 환경변수로만 관리
   - Git에 커밋하지 말 것

2. **API 엔드포인트 보호**
   - CRON_SECRET 없이는 실행 불가
   - Rate Limiting 적용 권장

### 성능

1. **타임아웃**
   - Railway 기본 타임아웃: 10분
   - 대량 데이터 처리 시 배치 처리 고려

2. **동시 실행 방지**
   - 크론잡 실행 시간 > 스케줄 간격이면 충돌 가능
   - 실행 시간 모니터링 필수

### 비용

1. **Railway Cron**
   - 무료 플랜: 월 500시간
   - 크론잡 실행 시간도 포함

2. **최적화**
   - 불필요한 크론잡 실행 최소화
   - 스케줄 조정 (예: 6시간 → 12시간)

## 트러블슈팅

### 크론잡이 실행되지 않음

1. **CRON_SECRET 확인**
   ```bash
   echo $CRON_SECRET
   ```

2. **환경변수 확인**
   - Railway 대시보드 → Settings → Variables
   - CRON_SECRET, NEXT_PUBLIC_SITE_URL 확인

3. **로그 확인**
   - Railway → Logs
   - 401 Unauthorized: CRON_SECRET 불일치
   - 500 Server Error: 코드 오류

### 크론잡 실행이 느림

1. **데이터베이스 쿼리 최적화**
   - 인덱스 추가
   - 배치 처리

2. **조직 필터링**
   - 비활성 조직 스킵
   - autoReorderEnabled 확인

### 중복 알림 생성

1. **중복 방지 로직 확인**
   - 6시간 내 같은 알림 체크
   - alerts 테이블 createdAt 인덱스

2. **스케줄 조정**
   - 재고 점검 간격 늘리기 (6시간 → 12시간)

## 참고 자료

- Railway 공식 문서: https://docs.railway.app/
- Cron Expression 가이드: https://crontab.guru/
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- SCM 도메인 규칙: `.claude/agents/scm-expert.md`
