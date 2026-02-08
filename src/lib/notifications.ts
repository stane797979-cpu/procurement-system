/**
 * 통합 알림 서비스 (이메일 + SMS)
 * - Resend: 이메일 전송
 * - CoolSMS: 문자 메시지 전송
 * - Mock 모드 지원 (개발/테스트 환경)
 */

import { Resend } from 'resend'

// CoolSMS SDK (베타 버전은 타입 정의가 없을 수 있음)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CoolSMSClient = any

// ============================================
// 환경변수 검증
// ============================================
const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@example.com'
const RESEND_FROM_NAME = process.env.RESEND_FROM_NAME || 'FloStok'

const COOLSMS_API_KEY = process.env.COOLSMS_API_KEY
const COOLSMS_API_SECRET = process.env.COOLSMS_API_SECRET
const COOLSMS_SENDER_PHONE = process.env.COOLSMS_SENDER_PHONE

const IS_MOCK_MODE = process.env.NOTIFICATIONS_MOCK_MODE === 'true'

// ============================================
// 클라이언트 초기화
// ============================================
let resend: Resend | null = null
let coolsms: CoolSMSClient | null = null

if (!IS_MOCK_MODE) {
  if (RESEND_API_KEY) {
    resend = new Resend(RESEND_API_KEY)
  } else {
    console.warn('⚠️ RESEND_API_KEY가 설정되지 않았습니다. 이메일 알림이 비활성화됩니다.')
  }

  // CoolSMS는 Phase 6.6에서 구현 예정 (현재는 Mock 모드만 지원)
  if (COOLSMS_API_KEY && COOLSMS_API_SECRET) {
    console.warn('⚠️ CoolSMS 연동은 아직 구현되지 않았습니다. Mock 모드를 사용하세요.')
    coolsms = null
  }
}

// ============================================
// 타입 정의
// ============================================

/** 이메일 전송 요청 */
export interface SendEmailRequest {
  /** 수신자 이메일 */
  to: string | string[]
  /** 제목 */
  subject: string
  /** HTML 본문 */
  html: string
  /** 텍스트 본문 (선택) */
  text?: string
  /** 참조 (선택) */
  cc?: string | string[]
  /** 숨은 참조 (선택) */
  bcc?: string | string[]
}

/** SMS 전송 요청 */
export interface SendSMSRequest {
  /** 수신자 전화번호 (010-1234-5678 또는 01012345678) */
  to: string | string[]
  /** 메시지 내용 (최대 90바이트, 한글 45자) */
  message: string
  /** 메시지 타입 (SMS, LMS, MMS) */
  type?: 'SMS' | 'LMS' | 'MMS'
}

/** 알림 전송 결과 */
export interface NotificationResult {
  /** 성공 여부 */
  success: boolean
  /** 에러 메시지 (실패 시) */
  error?: string
  /** 전송 ID (성공 시) */
  id?: string
  /** Mock 모드 여부 */
  mock?: boolean
}

// ============================================
// 이메일 전송
// ============================================

/**
 * 이메일 전송
 * @param request 이메일 전송 요청
 * @returns 전송 결과
 */
export async function sendEmail(
  request: SendEmailRequest
): Promise<NotificationResult> {
  try {
    // Mock 모드
    if (IS_MOCK_MODE) {
      console.log('📧 [Mock] 이메일 전송:', {
        from: `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`,
        to: request.to,
        subject: request.subject,
        html: request.html.substring(0, 100) + '...',
      })
      return { success: true, mock: true, id: `mock-email-${Date.now()}` }
    }

    // Resend 클라이언트 체크
    if (!resend) {
      throw new Error('Resend 클라이언트가 초기화되지 않았습니다.')
    }

    // 이메일 전송
    const response = await resend.emails.send({
      from: `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`,
      to: request.to,
      subject: request.subject,
      html: request.html,
      text: request.text,
      cc: request.cc,
      bcc: request.bcc,
    })

    return { success: true, id: response.data?.id }
  } catch (error) {
    console.error('이메일 전송 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '이메일 전송 실패',
    }
  }
}

// ============================================
// SMS 전송
// ============================================

/**
 * SMS 전송
 * @param request SMS 전송 요청
 * @returns 전송 결과
 */
export async function sendSMS(
  request: SendSMSRequest
): Promise<NotificationResult> {
  try {
    // Mock 모드
    if (IS_MOCK_MODE) {
      console.log('📱 [Mock] SMS 전송:', {
        from: COOLSMS_SENDER_PHONE,
        to: request.to,
        message: request.message,
        type: request.type || 'SMS',
      })
      return { success: true, mock: true, id: `mock-sms-${Date.now()}` }
    }

    // CoolSMS 클라이언트 체크
    if (!coolsms) {
      throw new Error('CoolSMS 클라이언트가 초기화되지 않았습니다.')
    }

    if (!COOLSMS_SENDER_PHONE) {
      throw new Error('발신번호가 설정되지 않았습니다.')
    }

    // 전화번호 배열 처리
    const recipients = Array.isArray(request.to) ? request.to : [request.to]

    // 메시지 타입 자동 결정
    const messageType = request.type || (request.message.length > 90 ? 'LMS' : 'SMS')

    // SMS 전송
    const response = await coolsms.sendOne({
      to: recipients.join(','),
      from: COOLSMS_SENDER_PHONE,
      text: request.message,
      type: messageType,
    })

    return { success: true, id: response.groupId }
  } catch (error) {
    console.error('SMS 전송 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SMS 전송 실패',
    }
  }
}

// ============================================
// 알림 템플릿
// ============================================

/**
 * 재고 부족 알림 이메일 템플릿
 */
export function getInventoryAlertEmailTemplate(params: {
  productName: string
  currentStock: number
  safetyStock: number
  reorderPoint: number
  status: string
}): { subject: string; html: string; text: string } {
  const { productName, currentStock, safetyStock, reorderPoint, status } = params

  const subject = `[긴급] 재고 부족 알림 - ${productName}`
  const text = `
재고 부족 알림

제품명: ${productName}
현재 재고: ${currentStock}개
안전재고: ${safetyStock}개
발주점: ${reorderPoint}개
재고 상태: ${status}

즉시 발주를 진행해주세요.

FloStok 시스템
  `.trim()

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ef4444; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .info-label { font-weight: 600; color: #6b7280; }
    .info-value { color: #111827; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">🚨 재고 부족 알림</h1>
    </div>
    <div class="content">
      <div class="alert-box">
        <strong>긴급 조치 필요!</strong><br>
        다음 제품의 재고가 부족합니다. 즉시 발주를 진행해주세요.
      </div>

      <h2 style="color: #111827; font-size: 18px;">재고 현황</h2>
      <div class="info-row">
        <span class="info-label">제품명</span>
        <span class="info-value"><strong>${productName}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">현재 재고</span>
        <span class="info-value" style="color: #ef4444; font-weight: 600;">${currentStock}개</span>
      </div>
      <div class="info-row">
        <span class="info-label">안전재고</span>
        <span class="info-value">${safetyStock}개</span>
      </div>
      <div class="info-row">
        <span class="info-label">발주점</span>
        <span class="info-value">${reorderPoint}개</span>
      </div>
      <div class="info-row">
        <span class="info-label">재고 상태</span>
        <span class="info-value"><strong>${status}</strong></span>
      </div>

      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/orders" class="button">
        발주 페이지로 이동
      </a>

      <div class="footer">
        <p>이 메일은 FloStok 시스템에서 자동 발송되었습니다.</p>
        <p>문의사항은 관리자에게 연락해주세요.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()

  return { subject, html, text }
}

/**
 * 재고 부족 알림 SMS 템플릿
 */
export function getInventoryAlertSMSTemplate(params: {
  productName: string
  currentStock: number
  status: string
}): string {
  const { productName, currentStock, status } = params
  return `[FloStok] ${productName} 재고 부족 알림\n현재 재고: ${currentStock}개 (${status})\n즉시 발주 필요`
}

/**
 * 발주서 생성 알림 이메일 템플릿
 */
export function getOrderCreatedEmailTemplate(params: {
  orderNumber: string
  supplierName: string
  totalAmount: number
  itemCount: number
  expectedDate: string
}): { subject: string; html: string; text: string } {
  const { orderNumber, supplierName, totalAmount, itemCount, expectedDate } = params

  const subject = `발주서 생성 완료 - ${orderNumber}`
  const text = `
발주서 생성 완료

발주번호: ${orderNumber}
공급자: ${supplierName}
발주 품목: ${itemCount}개
총 금액: ${totalAmount.toLocaleString()}원
예상 입고일: ${expectedDate}

발주서 상세 내용은 시스템에서 확인해주세요.

FloStok 시스템
  `.trim()

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .success-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .info-label { font-weight: 600; color: #6b7280; }
    .info-value { color: #111827; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">✅ 발주서 생성 완료</h1>
    </div>
    <div class="content">
      <div class="success-box">
        <strong>발주가 정상적으로 등록되었습니다.</strong><br>
        공급자에게 발주서를 전달해주세요.
      </div>

      <h2 style="color: #111827; font-size: 18px;">발주 정보</h2>
      <div class="info-row">
        <span class="info-label">발주번호</span>
        <span class="info-value"><strong>${orderNumber}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">공급자</span>
        <span class="info-value">${supplierName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">발주 품목</span>
        <span class="info-value">${itemCount}개</span>
      </div>
      <div class="info-row">
        <span class="info-label">총 금액</span>
        <span class="info-value" style="color: #2563eb; font-weight: 600;">${totalAmount.toLocaleString()}원</span>
      </div>
      <div class="info-row">
        <span class="info-label">예상 입고일</span>
        <span class="info-value">${expectedDate}</span>
      </div>

      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/orders" class="button">
        발주서 상세보기
      </a>

      <div class="footer">
        <p>이 메일은 FloStok 시스템에서 자동 발송되었습니다.</p>
        <p>문의사항은 관리자에게 연락해주세요.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()

  return { subject, html, text }
}

/**
 * 발주서 생성 알림 SMS 템플릿
 */
export function getOrderCreatedSMSTemplate(params: {
  orderNumber: string
  supplierName: string
  totalAmount: number
}): string {
  const { orderNumber, supplierName, totalAmount } = params
  return `[FloStok] 발주서 생성 완료\n발주번호: ${orderNumber}\n공급자: ${supplierName}\n총액: ${totalAmount.toLocaleString()}원`
}

/**
 * 입고 완료 알림 이메일 템플릿
 */
export function getInboundCompletedEmailTemplate(params: {
  orderNumber: string
  productName: string
  quantity: number
  inboundDate: string
}): { subject: string; html: string; text: string } {
  const { orderNumber, productName, quantity, inboundDate } = params

  const subject = `입고 완료 알림 - ${orderNumber}`
  const text = `
입고 완료 알림

발주번호: ${orderNumber}
제품명: ${productName}
입고 수량: ${quantity}개
입고일: ${inboundDate}

재고가 정상적으로 업데이트되었습니다.

FloStok 시스템
  `.trim()

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .success-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .info-label { font-weight: 600; color: #6b7280; }
    .info-value { color: #111827; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">📦 입고 완료</h1>
    </div>
    <div class="content">
      <div class="success-box">
        <strong>입고가 정상적으로 처리되었습니다.</strong><br>
        재고가 자동으로 업데이트되었습니다.
      </div>

      <h2 style="color: #111827; font-size: 18px;">입고 정보</h2>
      <div class="info-row">
        <span class="info-label">발주번호</span>
        <span class="info-value"><strong>${orderNumber}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">제품명</span>
        <span class="info-value">${productName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">입고 수량</span>
        <span class="info-value" style="color: #10b981; font-weight: 600;">${quantity}개</span>
      </div>
      <div class="info-row">
        <span class="info-label">입고일</span>
        <span class="info-value">${inboundDate}</span>
      </div>

      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/inventory" class="button">
        재고 현황 확인
      </a>

      <div class="footer">
        <p>이 메일은 FloStok 시스템에서 자동 발송되었습니다.</p>
        <p>문의사항은 관리자에게 연락해주세요.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()

  return { subject, html, text }
}

/**
 * 입고 완료 알림 SMS 템플릿
 */
export function getInboundCompletedSMSTemplate(params: {
  productName: string
  quantity: number
}): string {
  const { productName, quantity } = params
  return `[FloStok] 입고 완료\n제품: ${productName}\n수량: ${quantity}개\n재고가 업데이트되었습니다.`
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 이메일 주소 유효성 검증
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 전화번호 유효성 검증 및 정규화
 * @param phone 전화번호 (010-1234-5678 또는 01012345678)
 * @returns 정규화된 전화번호 (01012345678)
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}

/**
 * 전화번호 유효성 검증
 */
export function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone)
  return /^01[0-9]{8,9}$/.test(normalized)
}

/**
 * Mock 모드 여부 확인
 */
export function isMockMode(): boolean {
  return IS_MOCK_MODE
}
