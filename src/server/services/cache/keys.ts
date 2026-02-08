/**
 * 캐시 키 상수 정의
 * 중앙 집중식 캐시 키 관리로 일관성 유지
 */

/**
 * 캐시 키 생성 함수
 */
export const CacheKeys = {
  /**
   * 재고 상태: 조직별 특정 제품의 재고 상태
   * TTL: 5분 (300초)
   */
  inventoryStatus: (orgId: string, productId: string) =>
    `inventory-status:${orgId}:${productId}`,

  /**
   * 재고 상태 집계: 조직 전체 재고 상태 요약
   * TTL: 5분 (300초)
   */
  inventoryStatusSummary: (orgId: string) => `inventory-status:${orgId}`,

  /**
   * 대시보드 요약: 조직 대시보드 전체 데이터
   * TTL: 5분 (300초)
   */
  dashboardSummary: (orgId: string) => `dashboard-summary:${orgId}`,

  /**
   * ABC-XYZ 분석: 조직별 제품 분류 결과
   * TTL: 1시간 (3600초)
   */
  abcXyzAnalysis: (orgId: string) => `abc-xyz-analysis:${orgId}`,

  /**
   * 발주 추천: 조직별 자동 발주 추천 목록
   * TTL: 15분 (900초)
   */
  reorderRecommendations: (orgId: string) => `reorder-recommendations:${orgId}`,

  /**
   * KPI 메트릭: 조직 전체 KPI 지표
   * TTL: 10분 (600초)
   */
  kpiMetrics: (orgId: string) => `kpi-metrics:${orgId}`,

  /**
   * 특정 KPI 메트릭: 개별 KPI 지표 (예: 재고회전율, 품절률)
   * TTL: 10분 (600초)
   */
  kpiMetric: (orgId: string, metricType: string) =>
    `kpi-metric:${orgId}:${metricType}`,

  /**
   * 재고 전체: 조직의 모든 재고 데이터
   * TTL: 5분 (300초)
   */
  inventory: (orgId: string) => `inventory:${orgId}`,

  /**
   * 재고 항목: 특정 제품의 재고 데이터
   * TTL: 5분 (300초)
   */
  inventoryItem: (orgId: string, productId: string) =>
    `inventory:${orgId}:${productId}`,

  /**
   * 수요 예측: 특정 제품의 수요 예측 결과
   * TTL: 1시간 (3600초)
   */
  demandForecast: (orgId: string, productId: string) =>
    `demand-forecast:${orgId}:${productId}`,

  /**
   * 발주서 목록: 조직의 발주서 목록
   * TTL: 10분 (600초)
   */
  purchaseOrders: (orgId: string) => `purchase-orders:${orgId}`,

  /**
   * 발주서 상세: 특정 발주서 데이터
   * TTL: 10분 (600초)
   */
  purchaseOrder: (orgId: string, orderId: string) =>
    `purchase-order:${orgId}:${orderId}`,

  /**
   * 재고회전율: 조직의 재고회전율 분석
   * TTL: 1시간 (3600초)
   */
  inventoryTurnover: (orgId: string) => `inventory-turnover:${orgId}`,

  /**
   * Rate Limiting: 사용자 요청 제한
   */
  rateLimit: (identifier: string) => `rate-limit:${identifier}`,
} as const

/**
 * TTL 상수 (초 단위)
 */
export const CacheTTL = {
  /** 5분 - 실시간성이 중요한 데이터 */
  SHORT: 300,
  /** 10분 - 일반 대시보드 데이터 */
  MEDIUM: 600,
  /** 15분 - 발주 추천 등 */
  LONG: 900,
  /** 1시간 - 분석 데이터 */
  HOUR: 3600,
  /** 1일 - 정적 데이터 */
  DAY: 86400,
} as const

/**
 * 캐시 무효화 패턴
 */
export const CachePatterns = {
  /** 특정 조직의 모든 재고 관련 캐시 */
  inventory: (orgId: string) => `inventory*:${orgId}*`,

  /** 특정 조직의 모든 대시보드 관련 캐시 */
  dashboard: (orgId: string) => `dashboard-summary:${orgId}*`,

  /** 특정 조직의 모든 KPI 관련 캐시 */
  kpi: (orgId: string) => `kpi*:${orgId}*`,

  /** 특정 조직의 모든 분석 관련 캐시 */
  analysis: (orgId: string) => `*-analysis:${orgId}*`,

  /** 특정 조직의 모든 발주 관련 캐시 */
  orders: (orgId: string) => `*order*:${orgId}*`,

  /** 특정 조직의 모든 예측 관련 캐시 */
  forecast: (orgId: string) => `demand-forecast:${orgId}*`,

  /** 특정 조직의 모든 캐시 (전체 무효화) */
  org: (orgId: string) => `*:${orgId}*`,
} as const
