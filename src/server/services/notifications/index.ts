/**
 * 통합 알림 서비스
 * - 이메일 + SMS 통합 관리
 * - 알림 설정에 따라 선택적 발송
 */

import * as emailService from './email'
import * as smsService from './sms'

// ============================================
// 타입 재-export
// ============================================

export type {
  OrderConfirmationParams,
  InboundNotificationParams,
  LowStockAlertParams,
  DailyReportParams,
} from './email'

export type {
  OrderSMSParams,
  UrgentStockAlertParams,
  InboundSMSParams,
  BulkSMSParams,
  TestSMSParams,
} from './sms'

// ============================================
// 이메일 서비스 재-export
// ============================================

export const {
  sendOrderConfirmationEmail,
  sendInboundNotificationEmail,
  sendLowStockAlertEmail,
  sendDailyReportEmail,
} = emailService

// ============================================
// SMS 서비스 재-export
// ============================================

export const {
  sendOrderSMS,
  sendUrgentStockAlertSMS,
  sendInboundSMS,
  sendBulkSMS,
  sendTestSMS,
} = smsService

// ============================================
// 통합 알림 함수
// ============================================

export interface NotificationConfig {
  /** 이메일 알림 활성화 */
  emailEnabled: boolean
  /** SMS 알림 활성화 */
  smsEnabled: boolean
  /** 이메일 수신자 */
  recipientEmail?: string
  /** SMS 수신자 */
  recipientPhone?: string
}

/**
 * 발주 생성 알림 (이메일 + SMS)
 */
export async function notifyOrderCreated(
  params: emailService.OrderConfirmationParams & smsService.OrderSMSParams,
  config: NotificationConfig
) {
  const results = {
    email: null as unknown,
    sms: null as unknown,
  }

  // 이메일 전송
  if (config.emailEnabled && config.recipientEmail) {
    results.email = await emailService.sendOrderConfirmationEmail({
      ...params,
      recipientEmail: config.recipientEmail,
    })
  }

  // SMS 전송
  if (config.smsEnabled && config.recipientPhone) {
    results.sms = await smsService.sendOrderSMS({
      ...params,
      recipientPhone: config.recipientPhone,
    })
  }

  return results
}

/**
 * 입고 완료 알림 (이메일 + SMS)
 */
export async function notifyInboundCompleted(
  params: emailService.InboundNotificationParams & smsService.InboundSMSParams,
  config: NotificationConfig
) {
  const results = {
    email: null as unknown,
    sms: null as unknown,
  }

  // 이메일 전송
  if (config.emailEnabled && config.recipientEmail) {
    results.email = await emailService.sendInboundNotificationEmail({
      ...params,
      recipientEmail: config.recipientEmail,
    })
  }

  // SMS 전송
  if (config.smsEnabled && config.recipientPhone) {
    results.sms = await smsService.sendInboundSMS({
      ...params,
      recipientPhone: config.recipientPhone,
    })
  }

  return results
}

/**
 * 긴급 재고 부족 알림 (이메일 + SMS)
 */
export async function notifyUrgentStockAlert(
  params: emailService.LowStockAlertParams & smsService.UrgentStockAlertParams,
  config: NotificationConfig
) {
  const results = {
    email: null as unknown,
    sms: null as unknown,
  }

  // 이메일 전송
  if (config.emailEnabled && config.recipientEmail) {
    results.email = await emailService.sendLowStockAlertEmail({
      ...params,
      recipientEmail: config.recipientEmail,
    })
  }

  // SMS 전송
  if (config.smsEnabled && config.recipientPhone) {
    results.sms = await smsService.sendUrgentStockAlertSMS({
      ...params,
      recipientPhone: config.recipientPhone,
    })
  }

  return results
}
