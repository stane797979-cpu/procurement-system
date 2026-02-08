/**
 * PortOne 결제 서버 측 서비스
 *
 * - 결제 검증 (웹훅)
 * - 결제 취소/환불
 * - 결제 내역 조회
 */

import { db } from "@/server/db";
import { paymentHistory } from "@/server/db/schema";
import { eq } from "drizzle-orm";

const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET;
const IS_MOCK_MODE = process.env.NEXT_PUBLIC_PAYMENT_MOCK === "true";

/**
 * 결제 검증 (서버)
 *
 * PortOne 웹훅 또는 클라이언트 요청 후 서버에서 실제 결제 내역을 검증합니다.
 *
 * @param paymentId - 결제 ID (merchant_uid)
 * @param expectedAmount - 예상 결제 금액 (검증용)
 * @returns 검증된 결제 정보
 */
export async function verifyPayment(
  paymentId: string,
  expectedAmount: number
): Promise<{
  success: boolean;
  transactionId: string;
  amount: number;
  status: string;
  method: string;
}> {
  if (IS_MOCK_MODE) {
    console.log("[PortOne Mock] 결제 검증:", { paymentId, expectedAmount });
    return {
      success: true,
      transactionId: `mock_tx_${Date.now()}`,
      amount: expectedAmount,
      status: "paid",
      method: "card",
    };
  }

  if (!PORTONE_API_SECRET) {
    throw new Error("PortOne API Secret이 설정되지 않았습니다");
  }

  try {
    // PortOne API로 실제 결제 내역 조회
    const response = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `PortOne ${PORTONE_API_SECRET}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`PortOne API 오류: ${response.status}`);
    }

    const payment = await response.json();

    // 결제 금액 검증
    if (payment.amount.total !== expectedAmount) {
      throw new Error(
        `결제 금액 불일치: 예상 ${expectedAmount}원, 실제 ${payment.amount.total}원`
      );
    }

    // 결제 상태 확인
    if (payment.status !== "PAID") {
      throw new Error(`결제 미완료: ${payment.status}`);
    }

    return {
      success: true,
      transactionId: payment.id,
      amount: payment.amount.total,
      status: payment.status,
      method: payment.method.type,
    };
  } catch (error) {
    console.error("[PortOne] 결제 검증 실패:", error);
    throw error;
  }
}

/**
 * 결제 취소/환불
 *
 * @param transactionId - PortOne 트랜잭션 ID
 * @param reason - 취소 사유
 * @returns 취소 결과
 */
export async function cancelPayment(
  transactionId: string,
  reason: string
): Promise<{
  success: boolean;
  cancelledAmount: number;
}> {
  if (IS_MOCK_MODE) {
    console.log("[PortOne Mock] 결제 취소:", { transactionId, reason });
    return {
      success: true,
      cancelledAmount: 49900, // Mock 금액
    };
  }

  if (!PORTONE_API_SECRET) {
    throw new Error("PortOne API Secret이 설정되지 않았습니다");
  }

  try {
    const response = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(transactionId)}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `PortOne ${PORTONE_API_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`PortOne 취소 API 오류: ${response.status}`);
    }

    const result = await response.json();

    return {
      success: true,
      cancelledAmount: result.cancelledAmount,
    };
  } catch (error) {
    console.error("[PortOne] 결제 취소 실패:", error);
    throw error;
  }
}

/**
 * 결제 내역 저장
 *
 * @param data - 결제 내역 데이터
 * @returns 저장된 결제 내역
 */
export async function savePaymentHistory(data: {
  organizationId: string;
  subscriptionId: string | null;
  amount: number;
  method: string;
  status: "success" | "failed" | "pending" | "refunded";
  transactionId: string | null;
  errorMessage?: string;
}) {
  const [payment] = await db
    .insert(paymentHistory)
    .values({
      organizationId: data.organizationId,
      subscriptionId: data.subscriptionId,
      amount: data.amount,
      method: data.method,
      status: data.status,
      transactionId: data.transactionId,
      errorMessage: data.errorMessage,
    })
    .returning();

  return payment;
}

/**
 * 조직의 결제 내역 조회
 *
 * @param organizationId - 조직 ID
 * @returns 결제 내역 목록
 */
export async function getPaymentHistory(organizationId: string) {
  return db
    .select()
    .from(paymentHistory)
    .where(eq(paymentHistory.organizationId, organizationId))
    .orderBy(paymentHistory.createdAt);
}

/**
 * 결제 내역 상태 업데이트
 *
 * @param paymentId - 결제 내역 ID
 * @param status - 새 상태
 * @param errorMessage - 오류 메시지 (선택)
 */
export async function updatePaymentStatus(
  paymentId: string,
  status: "success" | "failed" | "pending" | "refunded",
  errorMessage?: string
) {
  await db
    .update(paymentHistory)
    .set({
      status,
      errorMessage,
    })
    .where(eq(paymentHistory.id, paymentId));
}
