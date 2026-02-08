/**
 * PortOne (구 아임포트) 클라이언트 설정
 * PortOne V2 SDK를 사용한 결제 처리
 *
 * @see https://portone.io/docs
 */

import * as PortOne from "@portone/browser-sdk/v2";
import type { Currency } from "@portone/browser-sdk/v2";

// 환경변수에서 Store ID 가져오기
const PORTONE_STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
const IS_MOCK_MODE = process.env.NEXT_PUBLIC_PAYMENT_MOCK === "true";

if (!PORTONE_STORE_ID && !IS_MOCK_MODE) {
  console.warn(
    "[PortOne] NEXT_PUBLIC_PORTONE_STORE_ID가 설정되지 않았습니다. Mock 모드를 활성화하거나 환경변수를 설정하세요."
  );
}

/**
 * 결제 요청 파라미터
 */
export interface PaymentRequest {
  /** 결제 고유 ID (merchant_uid) */
  paymentId: string;
  /** 주문명 */
  orderName: string;
  /** 결제 금액 (원) */
  totalAmount: number;
  /** 통화 코드 (기본: KRW) */
  currency?: string;
  /** 구매자 정보 */
  customer: {
    /** 구매자 이름 */
    fullName: string;
    /** 구매자 이메일 */
    email: string;
    /** 구매자 전화번호 (선택) */
    phoneNumber?: string;
  };
  /** 결제 성공 시 리다이렉트 URL */
  redirectUrl?: string;
}

/**
 * 결제 요청 (클라이언트)
 *
 * @param params - 결제 요청 파라미터
 * @returns 결제 응답
 *
 * @example
 * ```ts
 * const response = await requestPayment({
 *   paymentId: "order_123456",
 *   orderName: "Pro 플랜 구독",
 *   totalAmount: 49900,
 *   customer: {
 *     fullName: "홍길동",
 *     email: "hong@example.com",
 *   },
 * });
 * ```
 */
export async function requestPayment(params: PaymentRequest) {
  if (IS_MOCK_MODE) {
    console.log("[PortOne Mock] 결제 요청:", params);
    return {
      code: "MOCK_SUCCESS",
      message: "Mock 결제가 성공했습니다",
      transactionType: "PAYMENT" as const,
      txId: `mock_tx_${Date.now()}`,
      paymentId: params.paymentId,
    };
  }

  if (!PORTONE_STORE_ID) {
    throw new Error("PortOne Store ID가 설정되지 않았습니다");
  }

  try {
    const response = await PortOne.requestPayment({
      storeId: PORTONE_STORE_ID,
      paymentId: params.paymentId,
      orderName: params.orderName,
      totalAmount: params.totalAmount,
      currency: (params.currency ?? "CURRENCY_KRW") as Currency,
      channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY,
      payMethod: "CARD",
      customer: {
        fullName: params.customer.fullName,
        email: params.customer.email,
        phoneNumber: params.customer.phoneNumber,
      },
      redirectUrl: params.redirectUrl,
    });

    return response;
  } catch (error) {
    console.error("[PortOne] 결제 요청 실패:", error);
    throw error;
  }
}

/**
 * 결제 완료 후 처리
 *
 * @param paymentId - 결제 ID
 * @param organizationId - 조직 ID
 * @param plan - 구독 플랜
 * @param billingCycle - 결제 주기
 * @returns 구독 정보
 */
export async function handlePaymentSuccess(
  paymentId: string,
  organizationId: string,
  plan: string,
  billingCycle: string
) {
  // 서버 측 결제 검증 API 호출
  const response = await fetch("/api/payment/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentId,
      organizationId,
      plan,
      billingCycle,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "결제 검증 실패");
  }

  return response.json();
}

/**
 * PortOne 초기화 확인
 */
export function isPortOneConfigured(): boolean {
  return Boolean(PORTONE_STORE_ID) || IS_MOCK_MODE;
}

/**
 * Mock 모드 확인
 */
export function isMockMode(): boolean {
  return IS_MOCK_MODE;
}
