/**
 * 환경변수 검증 유틸리티
 *
 * 빌드 및 런타임 시 필수 환경변수가 설정되어 있는지 확인합니다.
 * 프로덕션 배포 전 필수적으로 실행되어야 합니다.
 */

export const requiredEnvVars = {
  public: [
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ],
  server: [
    'DATABASE_URL',
  ],
  optional: [
    'ANTHROPIC_API_KEY',
  ],
} as const;

/**
 * 필수 환경변수 검증
 * @throws Error 필수 환경변수가 누락된 경우
 */
export function validateEnv(): void {
  const missing: string[] = [];

  // 공개 환경변수 확인
  for (const key of requiredEnvVars.public) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // 서버 환경변수 확인 (서버 컴포넌트/API에서만 필요)
  if (typeof window === 'undefined') {
    for (const key of requiredEnvVars.server) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }
  }

  if (missing.length > 0) {
    const env = typeof window === 'undefined' ? 'server' : 'browser';
    throw new Error(
      `필수 환경변수가 누락되었습니다 (${env}): ${missing.join(', ')}\n` +
      `설정 파일 참고: docs/DEPLOY.md`
    );
  }
}

/**
 * 환경변수 로깅 (디버그용)
 * 프로덕션 배포 시 비밀 정보는 마스킹됩니다.
 */
export function logEnvInfo(): void {
  const isProd = process.env.NODE_ENV === 'production';

  console.log('📋 환경 정보:');
  console.log(`  Site URL: ${process.env.NEXT_PUBLIC_SITE_URL}`);
  console.log(`  Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);

  if (!isProd) {
    console.log(`  Database: ${process.env.DATABASE_URL ? '✅ 설정됨' : '❌ 미설정'}`);
    console.log(`  Claude API: ${process.env.ANTHROPIC_API_KEY ? '✅ 설정됨' : '⚠️ 선택'}`);
  } else {
    console.log(`  Database: ${process.env.DATABASE_URL ? '✅ 설정됨' : '❌ 미설정'}`);
  }

  console.log(`  Environment: ${process.env.NODE_ENV}`);
  console.log(`  Deployment: ${process.env.VERCEL ? '✅ Vercel' : '📍 로컬'}`);
}

/**
 * 배포 환경 정보
 */
export function getDeploymentInfo() {
  return {
    site: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isVercel: !!process.env.VERCEL,
    vercelEnv: process.env.VERCEL_ENV, // 'production' | 'preview' | 'development'
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
    branch: process.env.VERCEL_GIT_COMMIT_REF || 'local',
  };
}
