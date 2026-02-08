/**
 * 조직 설정 타입 정의
 * organizations.settings jsonb 필드 구조
 */

/**
 * 발주 정책 설정
 */
export interface OrderPolicySettings {
  /** 서비스 레벨 (%) - 안전재고 계산에 사용 */
  serviceLevel: number;
  /** 안전재고 배수 - 간단 계산 시 사용 (리드타임 수요의 X배) */
  safetyStockMultiplier: number;
  /** 자동 발주 임계값 (%) - 발주점 대비 현재고 비율 */
  autoReorderThreshold: number;
  /** 목표 재고일수 (일) - 발주량 계산 시 사용 */
  targetDaysOfInventory: number;
  /** 기본 리드타임 (일) - 제품별 설정이 없을 때 사용 */
  defaultLeadTimeDays: number;
}

/**
 * 조직 전체 설정
 */
export interface OrganizationSettings {
  /** 발주 정책 */
  orderPolicy?: OrderPolicySettings;
  /** 알림 설정 */
  notifications?: {
    email?: boolean;
    sms?: boolean;
  };
  /** 기타 설정 */
  [key: string]: unknown;
}

/**
 * 발주 정책 기본값
 */
export const DEFAULT_ORDER_POLICY: OrderPolicySettings = {
  serviceLevel: 95, // 95%
  safetyStockMultiplier: 0.5, // 리드타임 수요의 50%
  autoReorderThreshold: 100, // 발주점 100% (발주점 도달 시 자동 발주)
  targetDaysOfInventory: 30, // 30일
  defaultLeadTimeDays: 7, // 7일
};
