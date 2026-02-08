/**
 * Redis 기반 Rate Limiting 미들웨어
 * API Routes에서 사용
 */

import { NextRequest, NextResponse } from 'next/server'
import { cacheKeys } from '@/server/services/cache'
import { redis } from '@/lib/redis'

/**
 * API Rate Limiting 미들웨어
 * @param request NextRequest 객체
 * @param options.maxRequests 최대 요청 수 (기본: 100)
 * @param options.windowSeconds 시간 윈도우(초, 기본: 3600)
 * @returns Response 또는 null (계속 진행할 경우)
 */
export async function withRateLimit(
  request: NextRequest,
  options: {
    maxRequests?: number
    windowSeconds?: number
  } = {}
) {
  const maxRequests = options.maxRequests ?? 100
  const windowSeconds = options.windowSeconds ?? 3600

  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'

  try {
    const { allowed, remaining, resetAt } = await redis.checkRateLimit(
      cacheKeys.rateLimit(`api:${ip}`),
      maxRequests,
      windowSeconds
    )

    if (!allowed) {
      return NextResponse.json(
        {
          error: '요청 한도를 초과했습니다.',
          retryAfter: resetAt,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(resetAt),
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + resetAt),
          },
        }
      )
    }

    // Rate limit 정보를 응답 헤더에 포함
    request.headers.set('X-RateLimit-Limit', String(maxRequests))
    request.headers.set('X-RateLimit-Remaining', String(remaining))
    request.headers.set(
      'X-RateLimit-Reset',
      String(Math.floor(Date.now() / 1000) + resetAt)
    )

    return null // 계속 진행
  } catch (error) {
    console.error('[Redis Middleware] Rate Limit 확인 실패:', error)
    // 에러 발생 시 요청 허용
    return null
  }
}

/**
 * 캐시 응답 생성 헬퍼
 */
export function createCacheResponse<T>(
  data: T,
  options: {
    maxAge?: number // 브라우저 캐시 시간(초)
    sMaxAge?: number // CDN 캐시 시간(초)
    staleWhileRevalidate?: number // Stale-while-revalidate(초)
  } = {}
) {
  const cacheControl = [
    `max-age=${options.maxAge ?? 0}`,
    `s-maxage=${options.sMaxAge ?? 60}`,
    `stale-while-revalidate=${options.staleWhileRevalidate ?? 3600}`,
  ].join(', ')

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': cacheControl,
    },
  })
}

/**
 * 조직별 API Rate Limiting
 */
export async function withOrgRateLimit(
  orgId: string,
  options: {
    maxRequests?: number
    windowSeconds?: number
  } = {}
) {
  const maxRequests = options.maxRequests ?? 100
  const windowSeconds = options.windowSeconds ?? 3600

  try {
    const { allowed, remaining, resetAt } = await redis.checkRateLimit(
      cacheKeys.rateLimit(`org:${orgId}`),
      maxRequests,
      windowSeconds
    )

    return { allowed, remaining, resetAt }
  } catch (error) {
    console.error('[Redis] 조직 Rate Limit 확인 실패:', error)
    return { allowed: true, remaining: 0, resetAt: 0 }
  }
}
