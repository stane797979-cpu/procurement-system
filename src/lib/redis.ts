/**
 * Upstash Redis 클라이언트 설정
 * 분산 캐싱, Rate Limiting, 세션 관리 등에 사용
 */

import { Redis } from '@upstash/redis'

if (!process.env.UPSTASH_REDIS_REST_URL) {
  console.warn('UPSTASH_REDIS_REST_URL 환경변수가 설정되지 않았습니다.')
}

if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.warn('UPSTASH_REDIS_REST_TOKEN 환경변수가 설정되지 않았습니다.')
}

/**
 * Upstash Redis 클라이언트
 * REST API 기반 (서버리스 환경 대응)
 */
const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

/**
 * Redis 클라이언트 확장 (Rate Limiting 기능 추가)
 */
export const redis = Object.assign(redisClient, {
  /**
   * Rate Limiting 체크
   */
  async checkRateLimit(
    key: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    return checkRateLimit(key, maxRequests, windowSeconds)
  },
})

export type RedisValue = string | number | boolean | null | Record<string, unknown>

/**
 * 캐시 유틸리티 함수들
 */

/**
 * 캐시에서 값 조회
 * @param key 캐시 키
 * @returns 캐시된 값 또는 null
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key)
    if (value === null) return null

    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T
      } catch {
        return value as T
      }
    }

    return value as T
  } catch (error) {
    console.error(`[Redis] GET 실패 (${key}):`, error)
    return null
  }
}

/**
 * 캐시에 값 저장
 * @param key 캐시 키
 * @param value 저장할 값 (자동 직렬화)
 * @param exSeconds TTL(초 단위, 기본: 3600초 = 1시간)
 */
export async function setCached(
  key: string,
  value: RedisValue,
  exSeconds: number = 3600
): Promise<boolean> {
  try {
    const serialized =
      typeof value === 'string' ? value : JSON.stringify(value)
    await redis.set(key, serialized, { ex: exSeconds })
    return true
  } catch (error) {
    console.error(`[Redis] SET 실패 (${key}):`, error)
    return false
  }
}

/**
 * 캐시에서 값 삭제
 * @param key 캐시 키 또는 키 배열
 */
export async function delCached(key: string | string[]): Promise<number> {
  try {
    const keys = Array.isArray(key) ? key : [key]
    const result = await redis.del(...keys)
    return typeof result === 'number' ? result : 0
  } catch (error) {
    console.error(`[Redis] DEL 실패 (${key}):`, error)
    return 0
  }
}

/**
 * 패턴에 맞는 모든 키 삭제 (와일드카드)
 * @param pattern 패턴 (예: "inventory:*")
 */
export async function delCachedByPattern(pattern: string): Promise<number> {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length === 0) return 0

    return await delCached(keys)
  } catch (error) {
    console.error(`[Redis] PATTERN DEL 실패 (${pattern}):`, error)
    return 0
  }
}

/**
 * 캐시 존재 여부 확인
 * @param key 캐시 키
 */
export async function existsCached(key: string): Promise<boolean> {
  try {
    const result = await redis.exists(key)
    return result === 1
  } catch (error) {
    console.error(`[Redis] EXISTS 확인 실패 (${key}):`, error)
    return false
  }
}

/**
 * 캐시 TTL 조회 (초 단위)
 * @param key 캐시 키
 * @returns TTL(초) 또는 -1(만료 안 함) 또는 -2(존재 안 함)
 */
export async function getTTL(key: string): Promise<number> {
  try {
    const result = await redis.ttl(key)
    return typeof result === 'number' ? result : -2
  } catch (error) {
    console.error(`[Redis] TTL 조회 실패 (${key}):`, error)
    return -2
  }
}

/**
 * 캐시 TTL 설정
 * @param key 캐시 키
 * @param exSeconds TTL(초 단위)
 */
export async function expireCached(
  key: string,
  exSeconds: number
): Promise<boolean> {
  try {
    const result = await redis.expire(key, exSeconds)
    return result === 1
  } catch (error) {
    console.error(`[Redis] EXPIRE 설정 실패 (${key}):`, error)
    return false
  }
}

/**
 * Rate Limiting: 특정 IP/사용자의 요청 횟수 확인 및 증가
 * @param key Rate limit 키 (예: "rate-limit:ip:192.168.1.1")
 * @param maxRequests 최대 요청 횟수
 * @param windowSeconds 시간 윈도우(초)
 * @returns { remaining: 남은 요청 수, resetAt: 리셋 시간(초) }
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number = 100,
  windowSeconds: number = 3600
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  try {
    const current = await redis.incr(key)

    if (current === 1) {
      await redis.expire(key, windowSeconds)
    }

    const ttl = await redis.ttl(key)
    const remaining = Math.max(0, maxRequests - current)
    const allowed = current <= maxRequests

    return {
      allowed,
      remaining,
      resetAt: typeof ttl === 'number' && ttl > 0 ? ttl : 0,
    }
  } catch (error) {
    console.error(`[Redis] Rate Limit 확인 실패 (${key}):`, error)
    // 에러 발생 시 요청 허용 (캐시 실패가 서비스 중단이 되지 않도록)
    return { allowed: true, remaining: 0, resetAt: 0 }
  }
}

/**
 * 캐시 전체 초기화 (개발용, 프로덕션 주의)
 */
export async function flushCache(): Promise<boolean> {
  try {
    await redis.flushall()
    console.warn('[Redis] 전체 캐시 초기화 완료')
    return true
  } catch (error) {
    console.error('[Redis] 캐시 초기화 실패:', error)
    return false
  }
}

/**
 * 캐시 통계 (선택사항)
 */
export async function getCacheStats(): Promise<{ dbSize: number } | null> {
  try {
    const dbsize = await redis.dbsize()
    return { dbSize: dbsize }
  } catch (error) {
    console.error('[Redis] 통계 조회 실패:', error)
    return null
  }
}

export default redis
