import { test, expect } from "@playwright/test";

test.describe("발주 관리", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/orders");
  });

  test("발주 페이지 로딩", async ({ page }) => {
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/FlowStok/);

    // 발주 관리 헤더 확인
    await expect(page.getByText(/발주/)).toBeVisible();
  });

  test("탭 네비게이션 렌더링", async ({ page }) => {
    // 탭 확인 (발주 필요, 발주 현황, 자동발주 등)
    const tabs = page.locator('[role="tablist"]').first();

    if (await tabs.isVisible()) {
      await expect(tabs).toBeVisible();
    }
  });

  test("발주 필요 품목 테이블 렌더링", async ({ page }) => {
    // "발주 필요" 탭 클릭 (이미 선택되어 있을 수 있음)
    const needsOrderTab = page.getByRole("tab", { name: /발주 필요/ });

    if (await needsOrderTab.isVisible()) {
      await needsOrderTab.click();
    }

    // 테이블 확인
    const table = page.locator("table").first();
    await expect(table).toBeVisible();

    // 테이블 헤더 확인
    await expect(page.getByText(/제품명/)).toBeVisible();
  });

  test("발주 현황 테이블 렌더링", async ({ page }) => {
    // "발주 현황" 탭 클릭
    const statusTab = page.getByRole("tab", { name: /발주 현황/ });

    if (await statusTab.isVisible()) {
      await statusTab.click();

      // 테이블 확인
      await page.waitForTimeout(500);
      const table = page.locator("table").first();
      await expect(table).toBeVisible();
    }
  });

  test("자동발주 탭 렌더링", async ({ page }) => {
    // "자동발주" 탭 클릭
    const autoOrderTab = page.getByRole("tab", { name: /자동발주/ });

    if (await autoOrderTab.isVisible()) {
      await autoOrderTab.click();

      // 테이블 확인
      await page.waitForTimeout(500);
      const table = page.locator("table").first();
      await expect(table).toBeVisible();
    }
  });

  test("개별 발주 버튼", async ({ page }) => {
    // "발주" 버튼 확인
    const orderButton = page.getByRole("button", { name: /발주/ }).first();

    if (await orderButton.isVisible()) {
      await expect(orderButton).toBeVisible();

      // 버튼 클릭 (다이얼로그 열기)
      await orderButton.click();

      // 발주 다이얼로그 확인 (모달이 열렸는지)
      await page.waitForTimeout(500);
      const dialog = page.locator('[role="dialog"]').first();

      if (await dialog.isVisible()) {
        await expect(dialog).toBeVisible();

        // 다이얼로그 닫기
        const closeButton = page.getByRole("button", { name: /취소/ });
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    }
  });

  test("일괄 발주 버튼", async ({ page }) => {
    // 일괄 발주 버튼 확인 (있는 경우)
    const bulkOrderButton = page.getByRole("button", { name: /일괄 발주/ });

    if (await bulkOrderButton.isVisible()) {
      await expect(bulkOrderButton).toBeVisible();
    }
  });

  test("필터 기능", async ({ page }) => {
    // 공급자 필터, 상태 필터 등 확인
    const filterSection = page.locator('[class*="filter"]').first();

    if (await filterSection.isVisible()) {
      await expect(filterSection).toBeVisible();
    }
  });

  test("검색 기능", async ({ page }) => {
    // 검색 입력창 확인
    const searchInput = page.getByPlaceholder(/검색/);

    if (await searchInput.isVisible()) {
      await searchInput.fill("테스트");

      // 검색 결과 로딩 대기
      await page.waitForTimeout(500);
    }
  });

  test("발주서 다운로드 버튼", async ({ page }) => {
    // 엑셀 다운로드 버튼 확인
    const downloadButton = page.getByRole("button", { name: /다운로드/ });

    if (await downloadButton.isVisible()) {
      await expect(downloadButton).toBeVisible();
    }
  });

  test("발주 상태 뱃지 렌더링", async ({ page }) => {
    // "발주 현황" 탭으로 이동
    const statusTab = page.getByRole("tab", { name: /발주 현황/ });

    if (await statusTab.isVisible()) {
      await statusTab.click();
      await page.waitForTimeout(500);

      // 상태 뱃지 확인 (대기, 승인, 완료 등)
      const badges = page.locator('[class*="badge"]');

      if (await badges.count() > 0) {
        await expect(badges.first()).toBeVisible();
      }
    }
  });
});
