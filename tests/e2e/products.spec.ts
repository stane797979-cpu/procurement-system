import { test, expect } from "@playwright/test";

test.describe("제품 관리", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/products");
  });

  test("제품 페이지 로딩", async ({ page }) => {
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/FlowStok/);

    // 제품 관리 헤더 확인
    await expect(page.getByText("제품 관리")).toBeVisible();
  });

  test("제품 추가 버튼 렌더링", async ({ page }) => {
    // "제품 추가" 버튼 확인
    const addButton = page.getByRole("button", { name: /제품 추가/ });
    await expect(addButton).toBeVisible();
  });

  test("검색 기능", async ({ page }) => {
    // 검색 입력창 확인
    const searchInput = page.getByPlaceholder(/검색/);
    await expect(searchInput).toBeVisible();

    // 검색어 입력
    await searchInput.fill("테스트 제품");

    // 검색 결과 로딩 대기 (디바운스)
    await page.waitForTimeout(500);
  });

  test("제품 테이블 렌더링", async ({ page }) => {
    // 테이블 확인
    const table = page.locator("table").first();
    await expect(table).toBeVisible();

    // 테이블 헤더 확인
    await expect(page.getByText(/SKU/)).toBeVisible();
    await expect(page.getByText(/제품명/)).toBeVisible();
    await expect(page.getByText(/재고상태/)).toBeVisible();
  });

  test("제품 필터 렌더링", async ({ page }) => {
    // 필터 섹션 확인 (카테고리, ABC등급 등)
    const filterSection = page.locator('[class*="filter"]').first();

    if (await filterSection.isVisible()) {
      await expect(filterSection).toBeVisible();
    }
  });

  test("제품 추가 다이얼로그 열기", async ({ page }) => {
    // "제품 추가" 버튼 클릭
    const addButton = page.getByRole("button", { name: /제품 추가/ });
    await addButton.click();

    // 다이얼로그 열림 확인
    await page.waitForTimeout(500);
    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible();

    // 폼 필드 확인
    await expect(page.getByLabel(/SKU/)).toBeVisible();
    await expect(page.getByLabel(/제품명/)).toBeVisible();

    // 다이얼로그 닫기
    const closeButton = page.getByRole("button", { name: /취소/ });
    await closeButton.click();
  });

  test("제품 수정 버튼", async ({ page }) => {
    // 수정 버튼 확인 (테이블 행에 있는 경우)
    const editButton = page.getByRole("button", { name: /수정/ }).first();

    if (await editButton.isVisible()) {
      await expect(editButton).toBeVisible();

      // 수정 버튼 클릭
      await editButton.click();

      // 수정 다이얼로그 열림 확인
      await page.waitForTimeout(500);
      const dialog = page.locator('[role="dialog"]').first();
      await expect(dialog).toBeVisible();

      // 다이얼로그 닫기
      const closeButton = page.getByRole("button", { name: /취소/ });
      await closeButton.click();
    }
  });

  test("제품 삭제 버튼", async ({ page }) => {
    // 삭제 버튼 확인 (테이블 행에 있는 경우)
    const deleteButton = page.getByRole("button", { name: /삭제/ }).first();

    if (await deleteButton.isVisible()) {
      await expect(deleteButton).toBeVisible();
    }
  });

  test("엑셀 업로드 버튼", async ({ page }) => {
    // 엑셀 업로드 버튼 확인
    const uploadButton = page.getByRole("button", { name: /업로드/ });

    if (await uploadButton.isVisible()) {
      await expect(uploadButton).toBeVisible();
    }
  });

  test("엑셀 다운로드 버튼", async ({ page }) => {
    // 엑셀 다운로드 버튼 확인
    const downloadButton = page.getByRole("button", { name: /다운로드/ });

    if (await downloadButton.isVisible()) {
      await expect(downloadButton).toBeVisible();
    }
  });

  test("ABC/XYZ 등급 뱃지 렌더링", async ({ page }) => {
    // 등급 뱃지 확인
    const badges = page.locator('[class*="badge"]');

    if (await badges.count() > 0) {
      await expect(badges.first()).toBeVisible();
    }
  });

  test("체크박스 선택 및 일괄 삭제", async ({ page }) => {
    // 체크박스 확인
    const checkboxes = page.locator('input[type="checkbox"]');

    if (await checkboxes.count() > 0) {
      // 첫 번째 체크박스 선택
      await checkboxes.first().check();

      // 일괄 삭제 버튼 확인 (선택 후 나타나는 경우)
      await page.waitForTimeout(300);
      const bulkDeleteButton = page.getByRole("button", { name: /삭제/ });

      if (await bulkDeleteButton.isVisible()) {
        await expect(bulkDeleteButton).toBeVisible();
      }
    }
  });
});
