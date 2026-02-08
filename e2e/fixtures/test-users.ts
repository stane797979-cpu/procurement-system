/**
 * E2E 테스트용 사용자 픽스처
 * 실제 DB와 분리된 테스트 데이터
 */

export const testUsers = {
  admin: {
    email: "test-admin@example.com",
    password: "TestPassword123!",
    organizationName: "테스트 조직",
    role: "admin" as const,
  },
  manager: {
    email: "test-manager@example.com",
    password: "TestPassword123!",
    organizationName: "테스트 조직",
    role: "manager" as const,
  },
  viewer: {
    email: "test-viewer@example.com",
    password: "TestPassword123!",
    organizationName: "테스트 조직",
    role: "viewer" as const,
  },
} as const;

export type TestUser = (typeof testUsers)[keyof typeof testUsers];
