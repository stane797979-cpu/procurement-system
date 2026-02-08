import { getDeploymentInfo } from '@/lib/env-validation';
import { NextResponse } from 'next/server';

/**
 * GET /api/health
 *
 * 헬스체크 엔드포인트
 * 배포 후 서버 상태 및 환경 정보를 확인합니다.
 *
 * 응답 예시:
 * {
 *   "status": "healthy",
 *   "timestamp": "2026-02-06T10:30:00Z",
 *   "deployment": {
 *     "site": "https://yourdomain.com",
 *     "isDevelopment": false,
 *     "isProduction": true,
 *     "isVercel": true,
 *     "vercelEnv": "production",
 *     "commitSha": "abc123...",
 *     "branch": "main"
 *   }
 * }
 */
export async function GET() {
  try {
    // 환경 정보 수집
    const deploymentInfo = getDeploymentInfo();

    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        deployment: deploymentInfo,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=60',
          'X-Deployment-Status': 'ok',
        },
      }
    );
  } catch (error) {
    console.error('헬스체크 에러:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : '알 수 없는 에러',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}

/**
 * HEAD /api/health
 *
 * 클라이언트가 빠른 상태 확인을 위해 사용합니다.
 * 본문 없이 상태 코드만 반환합니다.
 */
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'X-Deployment-Status': 'ok',
    },
  });
}
