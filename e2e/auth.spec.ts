import { test, expect } from "@playwright/test";

/**
 * 인증 플로우 E2E 테스트
 * - 로그인 페이지 렌더링
 * - 회원가입 페이지 네비게이션
 * - 폼 유효성 검증
 */

test.describe("인증 플로우", () => {
  test.beforeEach(async ({ page }) => {
    // 모든 테스트 전에 로그인 페이지로 이동
    await page.goto("/login");
  });

  test("로그인 페이지가 올바르게 렌더링된다", async ({ page }) => {
    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/FlowStok/i);

    // 주요 요소 확인
    await expect(
      page.getByRole("heading", { name: /로그인/i }),
    ).toBeVisible();
    await expect(page.getByLabel(/이메일/i)).toBeVisible();
    await expect(page.getByLabel(/비밀번호/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /로그인/i })).toBeVisible();
  });

  test("회원가입 페이지로 이동할 수 있다", async ({ page }) => {
    // "회원가입" 링크 클릭
    await page.getByRole("link", { name: /회원가입/i }).click();

    // URL 변경 확인
    await expect(page).toHaveURL(/\/signup/);

    // 회원가입 페이지 요소 확인
    await expect(
      page.getByRole("heading", { name: /회원가입/i }),
    ).toBeVisible();
  });

  test("빈 폼 제출 시 유효성 검증 에러가 표시된다", async ({ page }) => {
    // 로그인 버튼 클릭
    await page.getByRole("button", { name: /로그인/i }).click();

    // 브라우저 기본 유효성 검증 메시지 확인 (HTML5 required 속성)
    const emailInput = page.getByLabel(/이메일/i);
    const validationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage,
    );

    // validationMessage가 비어있지 않은지 확인 (필수 입력)
    expect(validationMessage).not.toBe("");
  });

  test("잘못된 이메일 형식 시 유효성 검증 에러가 표시된다", async ({
    page,
  }) => {
    // 잘못된 이메일 입력
    await page.getByLabel(/이메일/i).fill("invalid-email");
    await page.getByLabel(/비밀번호/i).fill("password123");

    // 로그인 버튼 클릭
    await page.getByRole("button", { name: /로그인/i }).click();

    // 이메일 유효성 검증 메시지 확인
    const emailInput = page.getByLabel(/이메일/i);
    const validationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage,
    );

    // 이메일 형식 에러 메시지 확인
    expect(validationMessage).toContain("@");
  });

  test("소셜 로그인 버튼이 표시된다", async ({ page }) => {
    // 카카오 로그인 버튼 확인
    await expect(page.getByText(/카카오/i)).toBeVisible();

    // 구글 로그인 버튼 확인
    await expect(page.getByText(/구글/i)).toBeVisible();
  });

  test("비밀번호 입력 필드가 안전하게 마스킹된다", async ({ page }) => {
    const passwordInput = page.getByLabel(/비밀번호/i);

    // 비밀번호 입력
    await passwordInput.fill("mySecretPassword123");

    // type="password" 속성 확인
    const inputType = await passwordInput.getAttribute("type");
    expect(inputType).toBe("password");
  });
});

test.describe("회원가입 플로우", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup");
  });

  test("회원가입 페이지가 올바르게 렌더링된다", async ({ page }) => {
    // 주요 요소 확인
    await expect(
      page.getByRole("heading", { name: /회원가입/i }),
    ).toBeVisible();
    await expect(page.getByLabel(/이메일/i)).toBeVisible();
    await expect(page.getByLabel(/비밀번호/i)).toBeVisible();
    await expect(page.getByLabel(/조직명/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /회원가입/i }),
    ).toBeVisible();
  });

  test("로그인 페이지로 돌아갈 수 있다", async ({ page }) => {
    // "로그인" 링크 클릭
    await page.getByRole("link", { name: /로그인/i }).click();

    // URL 변경 확인
    await expect(page).toHaveURL(/\/login/);
  });

  test("모든 필수 입력 필드가 있다", async ({ page }) => {
    // 필수 필드 확인
    const emailInput = page.getByLabel(/이메일/i);
    const passwordInput = page.getByLabel(/비밀번호/i);
    const orgInput = page.getByLabel(/조직명/i);

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(orgInput).toBeVisible();

    // required 속성 확인
    await expect(emailInput).toHaveAttribute("required", "");
    await expect(passwordInput).toHaveAttribute("required", "");
    await expect(orgInput).toHaveAttribute("required", "");
  });
});
