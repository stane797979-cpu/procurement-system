import { test, expect } from "@playwright/test";

test.describe("대시보드", () => {
  // 모든 테스트 전에 로그인 (Mock 환경에서는 스킵)
  test.beforeEach(async ({ page }) => {
    // 대시보드로 직접 이동 (인증 미들웨어가 활성화되면 로그인 필요)
    await page.goto("/");
  });

  test("대시보드 페이지 로딩", async ({ page }) => {
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/FlowStok/);

    // 주요 섹션 확인
    await expect(page.getByText("총 SKU")).toBeVisible();
    await expect(page.getByText("발주 필요")).toBeVisible();
    await expect(page.getByText("위험 품목")).toBeVisible();
    await expect(page.getByText("과재고")).toBeVisible();
  });

  test("KPI 카드 렌더링", async ({ page }) => {
    // KPI 카드 확인
    const kpiCards = page.locator('[class*="grid"]').first();
    await expect(kpiCards).toBeVisible();

    // 4개의 KPI 카드가 있는지 확인
    await expect(page.getByText("총 SKU")).toBeVisible();
    await expect(page.getByText("발주 필요")).toBeVisible();
    await expect(page.getByText("위험 품목")).toBeVisible();
    await expect(page.getByText("과재고")).toBeVisible();
  });

  test("재고상태 분포 차트 렌더링", async ({ page }) => {
    // 차트 제목 확인
    await expect(page.getByText("재고상태 분포")).toBeVisible();

    // SVG 차트 확인
    const chart = page.locator("svg").first();
    await expect(chart).toBeVisible();
  });

  test("발주 필요 품목 테이블 렌더링", async ({ page }) => {
    // 테이블 제목 확인
    await expect(page.getByText("발주 필요 품목")).toBeVisible();

    // "전체 보기" 버튼 확인
    await expect(page.getByRole("button", { name: /전체 보기/ })).toBeVisible();
  });

  test("주요 KPI 섹션 렌더링", async ({ page }) => {
    // KPI 섹션 제목 확인
    await expect(page.getByText("주요 성과 지표")).toBeVisible();

    // "전체 KPI 보기" 버튼 확인
    const kpiButton = page.getByRole("link", { name: /전체 KPI 보기/ });
    await expect(kpiButton).toBeVisible();

    // KPI 카드들 확인
    await expect(page.getByText("재고회전율")).toBeVisible();
    await expect(page.getByText("평균 재고일수")).toBeVisible();
    await expect(page.getByText("적시 발주율")).toBeVisible();
  });

  test("최근 활동 피드 렌더링", async ({ page }) => {
    // 스크롤을 내려서 최근 활동 섹션 확인
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // 최근 활동 제목 확인
    await expect(page.getByText("최근 활동")).toBeVisible();
  });

  test("사이드바 네비게이션", async ({ page }) => {
    // 사이드바 메뉴 아이템 확인
    await expect(page.getByRole("link", { name: /대시보드/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /제품/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /재고/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /발주/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /공급자/ })).toBeVisible();
  });

  test("사이드바에서 제품 페이지로 이동", async ({ page }) => {
    // "제품" 메뉴 클릭
    await page.getByRole("link", { name: /제품/ }).click();

    // URL 확인
    await expect(page).toHaveURL(/\/products/);
    await expect(page.getByText("제품 관리")).toBeVisible();
  });

  test("빠른 액션 버튼 렌더링", async ({ page }) => {
    // 빠른 액션 버튼들 확인 (페이지에 있는 경우)
    const buttons = page.locator('button[class*="button"]');
    await expect(buttons.first()).toBeVisible();
  });
});
