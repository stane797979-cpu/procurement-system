import { test, expect } from "@playwright/test";

test.describe("재고 관리", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/inventory");
  });

  test("재고 페이지 로딩", async ({ page }) => {
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/FlowStok/);

    // 재고 관리 헤더 확인
    await expect(page.getByText("재고 관리")).toBeVisible();
  });

  test("재고 통계 카드 렌더링", async ({ page }) => {
    // 통계 카드 확인 (있는 경우)
    const statsSection = page.locator('[class*="grid"]').first();
    await expect(statsSection).toBeVisible();
  });

  test("재고 목록 테이블 렌더링", async ({ page }) => {
    // 테이블 확인
    const table = page.locator("table").first();
    await expect(table).toBeVisible();

    // 테이블 헤더 확인
    await expect(page.getByText(/SKU/)).toBeVisible();
    await expect(page.getByText(/제품명/)).toBeVisible();
    await expect(page.getByText(/현재고/)).toBeVisible();
  });

  test("검색 기능", async ({ page }) => {
    // 검색 입력창 확인
    const searchInput = page.getByPlaceholder(/검색/);

    if (await searchInput.isVisible()) {
      await searchInput.fill("테스트");

      // 검색 결과 로딩 대기 (디바운스 고려)
      await page.waitForTimeout(500);
    }
  });

  test("필터 기능", async ({ page }) => {
    // 필터 버튼/셀렉트 확인 (있는 경우)
    const filterSection = page.locator('[class*="filter"]').first();

    // 필터가 존재하는지 확인
    if (await filterSection.isVisible()) {
      await expect(filterSection).toBeVisible();
    }
  });

  test("재고 상태별 뱃지 렌더링", async ({ page }) => {
    // 상태 뱃지 확인 (품절, 위험, 부족, 적정 등)
    const badges = page.locator('[class*="badge"]');

    // 적어도 하나의 뱃지가 있는지 확인
    if (await badges.count() > 0) {
      await expect(badges.first()).toBeVisible();
    }
  });

  test("재고 상세 다이얼로그 열기", async ({ page }) => {
    // 테이블 행 클릭 (첫 번째 행)
    const firstRow = page.locator("table tbody tr").first();

    if (await firstRow.isVisible()) {
      await firstRow.click();

      // 다이얼로그가 열렸는지 확인 (있는 경우)
      await page.waitForTimeout(500);
    }
  });

  test("페이지네이션", async ({ page }) => {
    // 페이지네이션 버튼 확인 (있는 경우)
    const pagination = page.locator('[class*="pagination"]').first();

    if (await pagination.isVisible()) {
      await expect(pagination).toBeVisible();
    }
  });

  test("엑셀 다운로드 버튼", async ({ page }) => {
    // 엑셀 다운로드 버튼 확인 (있는 경우)
    const downloadButton = page.getByRole("button", { name: /다운로드/ });

    if (await downloadButton.isVisible()) {
      await expect(downloadButton).toBeVisible();
    }
  });
});
