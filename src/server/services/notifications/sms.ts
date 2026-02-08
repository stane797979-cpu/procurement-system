/**
 * SMS 알림 서비스
 * - 발주 알림 SMS
 * - 긴급 재고 알림 SMS
 * - 입고 완료 알림 SMS
 */

import { sendSMS } from '@/lib/sms'

// ============================================
// 발주 알림 SMS
// ============================================

export interface OrderSMSParams {
  orderNumber: string
  supplierName: string
  totalAmount: number
  recipientPhone: string
}

/**
 * 발주 알림 SMS 전송
 */
export async function sendOrderSMS(params: OrderSMSParams) {
  const { orderNumber, supplierName, totalAmount, recipientPhone } = params

  // 한글 기준 90자 이내 (SMS)
  const message = `[FloStok] 발주서 생성 완료
발주번호: ${orderNumber}
공급자: ${supplierName}
총액: ${totalAmount.toLocaleString()}원`

  return sendSMS({
    to: recipientPhone,
    message,
    type: 'SMS',
  })
}

// ============================================
// 긴급 재고 알림 SMS
// ============================================

export interface UrgentStockAlertParams {
  productName: string
  currentStock: number
  status: string
  recipientPhone: string
}

/**
 * 긴급 재고 알림 SMS 전송
 */
export async function sendUrgentStockAlertSMS(params: UrgentStockAlertParams) {
  const { productName, currentStock, status, recipientPhone } = params

  // 한글 기준 90자 이내 (SMS)
  const message = `[긴급] ${productName} 재고 부족
현재: ${currentStock}개 (${status})
즉시 발주 필요`

  return sendSMS({
    to: recipientPhone,
    message,
    type: 'SMS',
  })
}

// ============================================
// 입고 완료 알림 SMS
// ============================================

export interface InboundSMSParams {
  productName: string
  quantity: number
  recipientPhone: string
}

/**
 * 입고 완료 알림 SMS 전송
 */
export async function sendInboundSMS(params: InboundSMSParams) {
  const { productName, quantity, recipientPhone } = params

  // 한글 기준 90자 이내 (SMS)
  const message = `[FloStok] 입고 완료
제품: ${productName}
수량: ${quantity}개
재고가 업데이트되었습니다.`

  return sendSMS({
    to: recipientPhone,
    message,
    type: 'SMS',
  })
}

// ============================================
// 다수 수신자 SMS 전송
// ============================================

export interface BulkSMSParams {
  message: string
  recipients: string[]
}

/**
 * 다수 수신자 SMS 전송 (LMS 자동 결정)
 */
export async function sendBulkSMS(params: BulkSMSParams) {
  const { message, recipients } = params

  return sendSMS({
    to: recipients,
    message,
    // 타입은 자동 결정 (90바이트 기준)
  })
}

// ============================================
// 테스트 SMS
// ============================================

export interface TestSMSParams {
  recipientPhone: string
}

/**
 * 테스트 SMS 전송
 */
export async function sendTestSMS(params: TestSMSParams) {
  const { recipientPhone } = params

  const message = `[FloStok] SMS 알림 테스트
시스템이 정상적으로 작동 중입니다.
발신시간: ${new Date().toLocaleString('ko-KR')}`

  return sendSMS({
    to: recipientPhone,
    message,
    type: 'SMS',
  })
}
