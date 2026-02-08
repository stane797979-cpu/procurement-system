import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E 테스트 설정
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 테스트 디렉토리
  testDir: "./tests/e2e",

  // 테스트 실행 설정
  fullyParallel: true, // 모든 테스트를 병렬로 실행
  forbidOnly: !!process.env.CI, // CI 환경에서 .only 금지
  retries: process.env.CI ? 2 : 0, // CI에서는 2번 재시도
  workers: process.env.CI ? 1 : undefined, // CI에서는 순차 실행

  // 리포터 설정
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["list"], // 터미널 출력
  ],

  // 공통 설정
  use: {
    // 베이스 URL (개발 서버)
    baseURL: "http://localhost:3000",

    // 트레이스 설정 (실패 시 자동 저장)
    trace: "on-first-retry",

    // 스크린샷 설정
    screenshot: "only-on-failure",

    // 비디오 설정
    video: "retain-on-failure",

    // 타임아웃
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // 테스트 브라우저 설정
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    // Firefox, Safari는 필요 시 활성화
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },
    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },

    // 모바일 테스트 (필요 시 활성화)
    // {
    //   name: "Mobile Chrome",
    //   use: { ...devices["Pixel 5"] },
    // },
    // {
    //   name: "Mobile Safari",
    //   use: { ...devices["iPhone 12"] },
    // },
  ],

  // 로컬 개발 서버 설정
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2분
  },
});
