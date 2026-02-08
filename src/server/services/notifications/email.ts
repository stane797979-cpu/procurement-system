/**
 * 이메일 알림 서비스
 * - 발주 확인 이메일
 * - 입고 알림 이메일
 * - 재고 부족 경고 이메일
 * - 일일 리포트 이메일
 */

import { sendEmail } from '@/lib/email'

// ============================================
// 발주 확인 이메일
// ============================================

export interface OrderConfirmationParams {
  orderNumber: string
  supplierName: string
  totalAmount: number
  itemCount: number
  expectedDate: string
  recipientEmail: string
}

/**
 * 발주 확인 이메일 전송
 */
export async function sendOrderConfirmationEmail(params: OrderConfirmationParams) {
  const { orderNumber, supplierName, totalAmount, itemCount, expectedDate, recipientEmail } = params

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

  return sendEmail({
    to: recipientEmail,
    subject,
    html,
    text,
  })
}

// ============================================
// 입고 알림 이메일
// ============================================

export interface InboundNotificationParams {
  orderNumber: string
  productName: string
  quantity: number
  inboundDate: string
  recipientEmail: string
}

/**
 * 입고 알림 이메일 전송
 */
export async function sendInboundNotificationEmail(params: InboundNotificationParams) {
  const { orderNumber, productName, quantity, inboundDate, recipientEmail } = params

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

  return sendEmail({
    to: recipientEmail,
    subject,
    html,
    text,
  })
}

// ============================================
// 재고 부족 경고 이메일
// ============================================

export interface LowStockAlertParams {
  productName: string
  currentStock: number
  safetyStock: number
  reorderPoint: number
  status: string
  recipientEmail: string
}

/**
 * 재고 부족 경고 이메일 전송
 */
export async function sendLowStockAlertEmail(params: LowStockAlertParams) {
  const { productName, currentStock, safetyStock, reorderPoint, status, recipientEmail } = params

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

  return sendEmail({
    to: recipientEmail,
    subject,
    html,
    text,
  })
}

// ============================================
// 일일 리포트 이메일
// ============================================

export interface DailyReportParams {
  date: string
  totalProducts: number
  lowStockCount: number
  pendingOrdersCount: number
  inboundsToday: number
  recipientEmail: string
}

/**
 * 일일 리포트 이메일 전송
 */
export async function sendDailyReportEmail(params: DailyReportParams) {
  const { date, totalProducts, lowStockCount, pendingOrdersCount, inboundsToday, recipientEmail } =
    params

  const subject = `[일일 리포트] ${date} - FloStok`
  const text = `
일일 리포트 - ${date}

총 제품 수: ${totalProducts}개
재고 부족: ${lowStockCount}개
대기 중인 발주: ${pendingOrdersCount}건
오늘 입고: ${inboundsToday}건

상세 내용은 시스템에서 확인해주세요.

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
    .header { background: #6366f1; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .stat-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: 700; color: #2563eb; }
    .stat-label { font-size: 14px; color: #6b7280; margin-top: 8px; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">📊 일일 리포트</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9;">${date}</p>
    </div>
    <div class="content">
      <div class="stats">
        <div class="stat-card">
          <div class="stat-value">${totalProducts}</div>
          <div class="stat-label">총 제품 수</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: ${lowStockCount > 0 ? '#ef4444' : '#10b981'};">${lowStockCount}</div>
          <div class="stat-label">재고 부족</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${pendingOrdersCount}</div>
          <div class="stat-label">대기 중인 발주</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: #10b981;">${inboundsToday}</div>
          <div class="stat-label">오늘 입고</div>
        </div>
      </div>

      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard" class="button">
        대시보드로 이동
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

  return sendEmail({
    to: recipientEmail,
    subject,
    html,
    text,
  })
}
