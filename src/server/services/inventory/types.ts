/**
 * 재고 변동 유형 정의
 */

export const INVENTORY_CHANGE_TYPES = {
  // === 입고 (양수 변동) ===
  INBOUND_PURCHASE: {
    key: "inbound_purchase",
    label: "발주 입고",
    category: "inbound" as const,
    sign: 1,
    requiresReference: true,
    referenceType: "purchase_order",
  },
  INBOUND_RETURN: {
    key: "inbound_return",
    label: "반품 입고",
    category: "inbound" as const,
    sign: 1,
    requiresReference: false,
    referenceType: "return",
  },
  INBOUND_ADJUSTMENT: {
    key: "inbound_adjustment",
    label: "조정 입고",
    category: "inbound" as const,
    sign: 1,
    requiresReference: false,
    referenceType: "adjustment",
  },
  INBOUND_TRANSFER: {
    key: "inbound_transfer",
    label: "이동 입고",
    category: "inbound" as const,
    sign: 1,
    requiresReference: false,
    referenceType: "transfer",
  },

  // === 출고 (음수 변동) ===
  OUTBOUND_SALE: {
    key: "outbound_sale",
    label: "판매 출고",
    category: "outbound" as const,
    sign: -1,
    requiresReference: true,
    referenceType: "sale",
  },
  OUTBOUND_DISPOSAL: {
    key: "outbound_disposal",
    label: "폐기",
    category: "outbound" as const,
    sign: -1,
    requiresReference: false,
    referenceType: "disposal",
  },
  OUTBOUND_ADJUSTMENT: {
    key: "outbound_adjustment",
    label: "조정 출고",
    category: "outbound" as const,
    sign: -1,
    requiresReference: false,
    referenceType: "adjustment",
  },
  OUTBOUND_TRANSFER: {
    key: "outbound_transfer",
    label: "이동 출고",
    category: "outbound" as const,
    sign: -1,
    requiresReference: false,
    referenceType: "transfer",
  },
  OUTBOUND_SAMPLE: {
    key: "outbound_sample",
    label: "샘플 출고",
    category: "outbound" as const,
    sign: -1,
    requiresReference: false,
    referenceType: "sample",
  },
  OUTBOUND_LOSS: {
    key: "outbound_loss",
    label: "손망실",
    category: "outbound" as const,
    sign: -1,
    requiresReference: false,
    referenceType: "loss",
  },
  OUTBOUND_RETURN: {
    key: "outbound_return",
    label: "반품 출고",
    category: "outbound" as const,
    sign: -1,
    requiresReference: false,
    referenceType: "return",
  },
} as const;

export type InventoryChangeTypeKey = keyof typeof INVENTORY_CHANGE_TYPES;
export type InventoryChangeCategory = "inbound" | "outbound";

/**
 * 재고 변동 유형 정보 조회
 */
export function getChangeTypeInfo(key: InventoryChangeTypeKey) {
  return INVENTORY_CHANGE_TYPES[key];
}

/**
 * 변동 유형 키로 조회
 */
export function getChangeTypeByKey(key: string) {
  return Object.values(INVENTORY_CHANGE_TYPES).find((t) => t.key === key);
}
