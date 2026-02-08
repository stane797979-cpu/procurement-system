# E2E 테스트 가이드

## 개요

Playwright를 사용한 End-to-End 테스트입니다.

## 실행 방법

### 개발 환경

```bash
# 브라우저 설치 (최초 1회)
npx playwright install chromium

# 테스트 실행 (헤드리스)
npm run test:e2e

# UI 모드로 실행 (디버깅)
npm run test:e2e:ui

# 특정 테스트만 실행
npm run test:e2e -- auth.spec.ts

# 헤드풀 모드 (브라우저 띄우기)
npm run test:e2e -- --headed

# 디버그 모드 (단계별 실행)
npm run test:e2e -- --debug
```

### 코드 생성 (Codegen)

```bash
# Playwright Inspector로 테스트 코드 자동 생성
npm run test:e2e:codegen
```

### 리포트 확인

```bash
# HTML 리포트 열기
npm run test:e2e:report
```

## 디렉토리 구조

```
e2e/
├── auth.spec.ts          # 인증 플로우 테스트
├── fixtures/             # 테스트 데이터
│   └── test-users.ts     # 테스트 사용자
└── README.md             # 이 파일
```

## 테스트 작성 규칙

1. **파일명**: `*.spec.ts` (예: `order.spec.ts`)
2. **설명**: describe/it 블록은 한국어로 작성
3. **독립성**: 각 테스트는 독립적으로 실행 가능해야 함
4. **정리**: afterEach에서 생성한 데이터 정리

## 예시

```typescript
import { test, expect } from "@playwright/test";

test.describe("발주 플로우", () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 후 발주 페이지로 이동
    await page.goto("/login");
    // ... 로그인 로직
    await page.goto("/orders");
  });

  test("발주 필요 품목 목록이 표시된다", async ({ page }) => {
    await expect(page.getByText("발주 필요 품목")).toBeVisible();
  });

  test("개별 발주를 실행할 수 있다", async ({ page }) => {
    // 첫 번째 제품의 발주 버튼 클릭
    await page.getByRole("button", { name: /발주/i }).first().click();

    // 발주 다이얼로그 확인
    await expect(page.getByText("발주 수량")).toBeVisible();

    // 수량 입력
    await page.getByLabel(/발주 수량/i).fill("100");

    // 발주 확인
    await page.getByRole("button", { name: /확인/i }).click();

    // 성공 토스트 확인
    await expect(page.getByText("발주가 완료되었습니다")).toBeVisible();
  });
});
```

## CI/CD 통합

GitHub Actions에서 자동으로 실행됩니다.

```yaml
# .github/workflows/test.yml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps chromium

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## 주의사항

1. **로컬 서버**: 테스트 실행 시 자동으로 `npm run dev` 실행됨
2. **환경변수**: `.env.local` 파일이 필요함
3. **브라우저**: Chromium만 기본 활성화 (Firefox, Safari는 선택적)
4. **타임아웃**: 각 액션은 10초, 네비게이션은 30초 타임아웃
5. **재시도**: CI 환경에서는 실패 시 2번 재시도

## 트러블슈팅

### 테스트가 타임아웃 나는 경우

```bash
# 타임아웃 증가
npm run test:e2e -- --timeout=60000
```

### 스크린샷 확인

```bash
# 실패 시 자동으로 test-results/ 폴더에 저장됨
ls test-results/
```

### 트레이스 확인

```bash
# 실패한 테스트의 트레이스 열기
npx playwright show-trace test-results/[test-name]/trace.zip
```
