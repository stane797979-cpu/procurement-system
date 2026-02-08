import { test, expect } from "@playwright/test";

test.describe("인증 플로우", () => {
  test("로그인 페이지 렌더링", async ({ page }) => {
    await page.goto("/login");

    // 페이지 제목 확인
    await expect(page).toHaveTitle(/FlowStok/);

    // 로그인 폼 요소 확인
    await expect(page.getByText("로그인")).toBeVisible();
    await expect(page.getByPlaceholder(/이메일/)).toBeVisible();
    await expect(page.getByPlaceholder(/비밀번호/)).toBeVisible();
    await expect(page.getByRole("button", { name: /로그인/ })).toBeVisible();
  });

  test("회원가입 페이지 렌더링", async ({ page }) => {
    await page.goto("/signup");

    // 페이지 제목 확인
    await expect(page).toHaveTitle(/FlowStok/);

    // 회원가입 폼 요소 확인
    await expect(page.getByText("회원가입")).toBeVisible();
    await expect(page.getByPlaceholder(/조직명/)).toBeVisible();
    await expect(page.getByPlaceholder(/이메일/)).toBeVisible();
    await expect(page.getByPlaceholder(/비밀번호/)).toBeVisible();
    await expect(page.getByRole("button", { name: /가입하기/ })).toBeVisible();
  });

  test("로그인 페이지에서 회원가입 페이지로 이동", async ({ page }) => {
    await page.goto("/login");

    // "회원가입" 링크 클릭
    await page.getByText(/계정이 없으신가요/).click();

    // URL 확인
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.getByText("회원가입")).toBeVisible();
  });

  test("회원가입 페이지에서 로그인 페이지로 이동", async ({ page }) => {
    await page.goto("/signup");

    // "로그인" 링크 클릭
    await page.getByText(/이미 계정이 있으신가요/).click();

    // URL 확인
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText("로그인")).toBeVisible();
  });

  test("유효성 검증 - 빈 이메일", async ({ page }) => {
    await page.goto("/login");

    // 빈 폼 제출
    const emailInput = page.getByPlaceholder(/이메일/);
    const submitButton = page.getByRole("button", { name: /로그인/ });

    await emailInput.click();
    await submitButton.click();

    // 브라우저 기본 유효성 검증 메시지 확인
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) =>
      el.validationMessage
    );
    expect(validationMessage).toBeTruthy();
  });

  test("유효성 검증 - 잘못된 이메일 형식", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.getByPlaceholder(/이메일/);
    const submitButton = page.getByRole("button", { name: /로그인/ });

    // 잘못된 이메일 입력
    await emailInput.fill("invalid-email");
    await submitButton.click();

    // HTML5 유효성 검증 메시지 확인
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) =>
      el.validationMessage
    );
    expect(validationMessage).toContain("@");
  });
});
