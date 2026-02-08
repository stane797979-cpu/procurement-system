/**
 * 캐시 통합 서비스
 * Upstash Redis를 사용한 분산 캐싱
 */

import {
  getCached,
  setCached,
  delCached,
  delCachedByPattern,
  redis,
  type RedisValue,
} from '@/lib/redis'
import { CacheKeys, CacheTTL, CachePatterns } from './keys'

/**
 * 기본 캐시 서비스
 */
export const CacheService = {
  /**
   * 캐시 조회
   */
  async get<T>(key: string): Promise<T | null> {
    return getCached<T>(key)
  },

  /**
   * 캐시 저장
   */
  async set(
    key: string,
    value: unknown,
    ttl: number = CacheTTL.MEDIUM
  ): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return setCached(key, value as any, ttl)
  },

  /**
   * 캐시 삭제
   */
  async del(key: string | string[]): Promise<number> {
    return delCached(key)
  },

  /**
   * 패턴 기반 캐시 무효화
   */
  async invalidatePattern(pattern: string): Promise<number> {
    return delCachedByPattern(pattern)
  },
}

/**
 * 재고 상태 캐시
 */
export const InventoryCache = {
  /**
   * 조직의 재고 상태 조회
   */
  async getStatus(orgId: string, productId: string) {
    const key = CacheKeys.inventoryStatus(orgId, productId)
    return getCached<unknown>(key)
  },

  /**
   * 재고 상태 저장
   */
  async setStatus(orgId: string, productId: string, data: RedisValue) {
    const key = CacheKeys.inventoryStatus(orgId, productId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return setCached(key, data as any, CacheTTL.SHORT)
  },

  /**
   * 조직의 재고 상태 집계 조회
   */
  async getStatusSummary(orgId: string) {
    const key = CacheKeys.inventoryStatusSummary(orgId)
    return getCached<unknown>(key)
  },

  /**
   * 재고 상태 집계 저장
   */
  async setStatusSummary(orgId: string, data: RedisValue) {
    const key = CacheKeys.inventoryStatusSummary(orgId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return setCached(key, data as any, CacheTTL.SHORT)
  },

  /**
   * 조직의 모든 재고 조회
   */
  async getAll(orgId: string) {
    const key = CacheKeys.inventory(orgId)
    return getCached<unknown>(key)
  },

  /**
   * 조직의 모든 재고 저장
   */
  async setAll(orgId: string, data: RedisValue) {
    const key = CacheKeys.inventory(orgId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return setCached(key, data as any, CacheTTL.SHORT)
  },

  /**
   * 특정 제품 재고 조회
   */
  async getItem(orgId: string, productId: string) {
    const key = CacheKeys.inventoryItem(orgId, productId)
    return getCached<unknown>(key)
  },

  /**
   * 특정 제품 재고 저장
   */
  async setItem(orgId: string, productId: string, data: RedisValue) {
    const key = CacheKeys.inventoryItem(orgId, productId)
    return setCached(key, data, CacheTTL.SHORT)
  },

  /**
   * 재고 캐시 무효화
   */
  async invalidate(orgId: string) {
    return delCachedByPattern(CachePatterns.inventory(orgId))
  },
}

/**
 * 대시보드 캐시
 */
export const DashboardCache = {
  /**
   * 대시보드 요약 조회
   */
  async getSummary(orgId: string) {
    const key = CacheKeys.dashboardSummary(orgId)
    return getCached<unknown>(key)
  },

  /**
   * 대시보드 요약 저장
   */
  async setSummary(orgId: string, data: RedisValue) {
    const key = CacheKeys.dashboardSummary(orgId)
    return setCached(key, data, CacheTTL.SHORT)
  },

  /**
   * 대시보드 캐시 무효화
   */
  async invalidate(orgId: string) {
    return delCachedByPattern(CachePatterns.dashboard(orgId))
  },
}

/**
 * ABC-XYZ 분석 캐시
 */
export const AnalysisCache = {
  /**
   * ABC-XYZ 분석 결과 조회
   */
  async getAbcXyz(orgId: string) {
    const key = CacheKeys.abcXyzAnalysis(orgId)
    return getCached<unknown>(key)
  },

  /**
   * ABC-XYZ 분석 결과 저장
   */
  async setAbcXyz(orgId: string, data: RedisValue) {
    const key = CacheKeys.abcXyzAnalysis(orgId)
    return setCached(key, data, CacheTTL.HOUR)
  },

  /**
   * 재고회전율 조회
   */
  async getTurnover(orgId: string) {
    const key = CacheKeys.inventoryTurnover(orgId)
    return getCached<unknown>(key)
  },

  /**
   * 재고회전율 저장
   */
  async setTurnover(orgId: string, data: RedisValue) {
    const key = CacheKeys.inventoryTurnover(orgId)
    return setCached(key, data, CacheTTL.HOUR)
  },

  /**
   * 분석 캐시 무효화
   */
  async invalidate(orgId: string) {
    return delCachedByPattern(CachePatterns.analysis(orgId))
  },
}

/**
 * 발주 추천 캐시
 */
export const ReorderCache = {
  /**
   * 발주 추천 목록 조회
   */
  async getRecommendations(orgId: string) {
    const key = CacheKeys.reorderRecommendations(orgId)
    return getCached<unknown>(key)
  },

  /**
   * 발주 추천 목록 저장
   */
  async setRecommendations(orgId: string, data: RedisValue) {
    const key = CacheKeys.reorderRecommendations(orgId)
    return setCached(key, data, CacheTTL.LONG)
  },

  /**
   * 발주 추천 캐시 무효화
   */
  async invalidate(orgId: string) {
    const pattern = CacheKeys.reorderRecommendations(orgId)
    return delCached(pattern)
  },
}

/**
 * KPI 메트릭 캐시
 */
export const KpiCache = {
  /**
   * 조직의 모든 KPI 메트릭 조회
   */
  async getMetrics(orgId: string) {
    const key = CacheKeys.kpiMetrics(orgId)
    return getCached<unknown>(key)
  },

  /**
   * 조직의 모든 KPI 메트릭 저장
   */
  async setMetrics(orgId: string, data: RedisValue) {
    const key = CacheKeys.kpiMetrics(orgId)
    return setCached(key, data, CacheTTL.MEDIUM)
  },

  /**
   * 특정 KPI 메트릭 조회
   */
  async getMetric(orgId: string, metricType: string) {
    const key = CacheKeys.kpiMetric(orgId, metricType)
    return getCached<unknown>(key)
  },

  /**
   * 특정 KPI 메트릭 저장
   */
  async setMetric(orgId: string, metricType: string, data: RedisValue) {
    const key = CacheKeys.kpiMetric(orgId, metricType)
    return setCached(key, data, CacheTTL.MEDIUM)
  },

  /**
   * KPI 캐시 무효화
   */
  async invalidate(orgId: string) {
    return delCachedByPattern(CachePatterns.kpi(orgId))
  },
}

/**
 * 수요 예측 캐시
 */
export const ForecastCache = {
  /**
   * 특정 제품의 수요 예측 조회
   */
  async get(orgId: string, productId: string) {
    const key = CacheKeys.demandForecast(orgId, productId)
    return getCached<unknown>(key)
  },

  /**
   * 특정 제품의 수요 예측 저장
   */
  async set(orgId: string, productId: string, data: RedisValue) {
    const key = CacheKeys.demandForecast(orgId, productId)
    return setCached(key, data, CacheTTL.HOUR)
  },

  /**
   * 수요 예측 캐시 무효화
   */
  async invalidate(orgId: string) {
    return delCachedByPattern(CachePatterns.forecast(orgId))
  },
}

/**
 * 발주서 캐시
 */
export const OrderCache = {
  /**
   * 발주서 목록 조회
   */
  async getList(orgId: string) {
    const key = CacheKeys.purchaseOrders(orgId)
    return getCached<unknown>(key)
  },

  /**
   * 발주서 목록 저장
   */
  async setList(orgId: string, data: RedisValue) {
    const key = CacheKeys.purchaseOrders(orgId)
    return setCached(key, data, CacheTTL.MEDIUM)
  },

  /**
   * 특정 발주서 조회
   */
  async get(orgId: string, orderId: string) {
    const key = CacheKeys.purchaseOrder(orgId, orderId)
    return getCached<unknown>(key)
  },

  /**
   * 특정 발주서 저장
   */
  async set(orgId: string, orderId: string, data: RedisValue) {
    const key = CacheKeys.purchaseOrder(orgId, orderId)
    return setCached(key, data, CacheTTL.MEDIUM)
  },

  /**
   * 발주서 캐시 무효화
   */
  async invalidate(orgId: string) {
    return delCachedByPattern(CachePatterns.orders(orgId))
  },
}

/**
 * Rate Limiting
 */
export const RateLimitCache = {
  /**
   * 사용자 Rate Limit 체크 (기본: 100 req/hour)
   */
  async checkUser(userId: string, maxRequests = 100, windowSeconds = 3600) {
    const key = CacheKeys.rateLimit(`user:${userId}`)
    return redis.checkRateLimit(key, maxRequests, windowSeconds)
  },

  /**
   * IP Rate Limit 체크 (기본: 1000 req/hour)
   */
  async checkIp(ip: string, maxRequests = 1000, windowSeconds = 3600) {
    const key = CacheKeys.rateLimit(`ip:${ip}`)
    return redis.checkRateLimit(key, maxRequests, windowSeconds)
  },
}

/**
 * 조직 전체 캐시 관리
 */
export const OrgCache = {
  /**
   * 조직의 모든 캐시 무효화
   */
  async invalidateAll(orgId: string) {
    return delCachedByPattern(CachePatterns.org(orgId))
  },
}

/**
 * 캐시 무효화 헬퍼 함수들
 * 데이터 변경 시 관련 캐시를 자동으로 무효화
 */

/**
 * 재고 변경 시 캐시 무효화
 * - 재고 상태
 * - 대시보드 요약
 * - KPI 메트릭
 */
export async function invalidateOnInventoryChange(orgId: string) {
  await Promise.all([
    InventoryCache.invalidate(orgId),
    DashboardCache.invalidate(orgId),
    KpiCache.invalidate(orgId),
    ReorderCache.invalidate(orgId),
  ])
}

/**
 * 판매 기록 추가 시 캐시 무효화
 * - 대시보드 요약
 * - KPI 메트릭
 * - 수요 예측
 */
export async function invalidateOnSalesRecordAdd(orgId: string) {
  await Promise.all([
    DashboardCache.invalidate(orgId),
    KpiCache.invalidate(orgId),
    ForecastCache.invalidate(orgId),
    AnalysisCache.invalidate(orgId),
  ])
}

/**
 * 제품 변경 시 캐시 무효화
 * - ABC-XYZ 분석
 * - 재고 상태
 * - 발주 추천
 */
export async function invalidateOnProductChange(orgId: string) {
  await Promise.all([
    AnalysisCache.invalidate(orgId),
    InventoryCache.invalidate(orgId),
    ReorderCache.invalidate(orgId),
  ])
}

/**
 * 발주서 생성/변경 시 캐시 무효화
 * - 발주서 목록
 * - 대시보드 요약
 * - KPI 메트릭
 */
export async function invalidateOnPurchaseOrderChange(orgId: string) {
  await Promise.all([
    OrderCache.invalidate(orgId),
    DashboardCache.invalidate(orgId),
    KpiCache.invalidate(orgId),
  ])
}

/**
 * 레거시 호환성 유지 (기존 cache.ts API)
 */
export const cacheKeys = CacheKeys
export const getCachedInventory = (orgId: string) => InventoryCache.getAll(orgId)
export const cacheInventory = (orgId: string, data: RedisValue) =>
  InventoryCache.setAll(orgId, data)
export const getCachedInventoryItem = (orgId: string, productId: string) =>
  InventoryCache.getItem(orgId, productId)
export const cacheInventoryItem = (
  orgId: string,
  productId: string,
  data: RedisValue
) => InventoryCache.setItem(orgId, productId, data)
export const invalidateInventoryCache = (orgId: string) =>
  InventoryCache.invalidate(orgId)

export const getCachedABCAnalysis = (orgId: string) =>
  AnalysisCache.getAbcXyz(orgId)
export const cacheABCAnalysis = (orgId: string, data: RedisValue) =>
  AnalysisCache.setAbcXyz(orgId, data)

export const getCachedKPIs = (orgId: string) => KpiCache.getMetrics(orgId)
export const cacheKPIs = (orgId: string, data: RedisValue) =>
  KpiCache.setMetrics(orgId, data)
export const invalidateKPICache = (orgId: string) => KpiCache.invalidate(orgId)

export const getCachedOrderRecommendations = (orgId: string) =>
  ReorderCache.getRecommendations(orgId)
export const cacheOrderRecommendations = (orgId: string, data: RedisValue) =>
  ReorderCache.setRecommendations(orgId, data)

export const getCachedForecast = (orgId: string, productId: string) =>
  ForecastCache.get(orgId, productId)
export const cacheForecast = (
  orgId: string,
  productId: string,
  data: RedisValue
) => ForecastCache.set(orgId, productId, data)
export const invalidateForecastCache = (orgId: string) =>
  ForecastCache.invalidate(orgId)

export const checkUserRateLimit = (userId: string) =>
  RateLimitCache.checkUser(userId)
export const checkIPRateLimit = (ip: string) => RateLimitCache.checkIp(ip)

export const invalidateOrgCache = (orgId: string) =>
  OrgCache.invalidateAll(orgId)

export { redis }
