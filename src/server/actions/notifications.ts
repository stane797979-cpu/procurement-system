/**
 * 알림 Server Actions
 * - 테스트 이메일/SMS 발송
 * - 실시간 알림 설정 테스트
 */

'use server'

import { z } from 'zod'
import { sendEmail, isConfigured as isEmailConfigured } from '@/lib/email'
import {
  sendSMS,
  isValidPhoneNumber,
  isConfigured as isSMSConfigured,
} from '@/lib/sms'
import { createClient } from '@/lib/supabase/server'

// ============================================
// 입력 유효성 검증
// ============================================

const testEmailSchema = z.object({
  recipientEmail: z.string().email('유효한 이메일 주소를 입력해주세요'),
})

const testSMSSchema = z.object({
  recipientPhone: z.string().refine((phone) => isValidPhoneNumber(phone), {
    message: '유효한 전화번호를 입력해주세요 (예: 010-1234-5678)',
  }),
})

// ============================================
// 테스트 이메일 발송
// ============================================

export async function sendTestEmail(formData: FormData) {
  try {
    // 1. 인증 확인
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: '인증이 필요합니다' }
    }

    // 2. 환경변수 확인
    if (!isEmailConfigured()) {
      return {
        success: false,
        error: 'Resend API 키가 설정되지 않았습니다. 환경변수를 확인해주세요.',
      }
    }

    // 3. 입력 검증
    const recipientEmail = formData.get('recipientEmail')
    const validated = testEmailSchema.parse({ recipientEmail })

    // 4. 테스트 이메일 전송
    const result = await sendEmail({
      to: validated.recipientEmail,
      subject: '[테스트] FloStok 이메일 알림 테스트',
      html: `
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
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">✅ 이메일 알림 테스트</h1>
    </div>
    <div class="content">
      <div class="success-box">
        <strong>이메일 전송 테스트가 성공했습니다!</strong><br>
        FloStok 시스템의 이메일 알림이 정상적으로 작동 중입니다.
      </div>

      <h2 style="color: #111827; font-size: 18px;">테스트 정보</h2>
      <p>발신시간: ${new Date().toLocaleString('ko-KR')}</p>
      <p>수신자: ${validated.recipientEmail}</p>
      <p>이메일 시스템: Resend</p>

      <div class="footer">
        <p>이 메일은 FloStok 시스템에서 자동 발송되었습니다.</p>
        <p>문의사항은 관리자에게 연락해주세요.</p>
      </div>
    </div>
  </div>
</body>
</html>
      `.trim(),
      text: `이메일 알림 테스트

이메일 전송 테스트가 성공했습니다!
FloStok 시스템의 이메일 알림이 정상적으로 작동 중입니다.

발신시간: ${new Date().toLocaleString('ko-KR')}
수신자: ${validated.recipientEmail}
이메일 시스템: Resend`,
    })

    if (!result.success) {
      return { success: false, error: result.error || '이메일 전송에 실패했습니다' }
    }

    return {
      success: true,
      message: '테스트 이메일이 발송되었습니다',
      mock: result.mock,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || '입력 데이터가 올바르지 않습니다',
      }
    }

    console.error('테스트 이메일 발송 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '서버 오류가 발생했습니다',
    }
  }
}

// ============================================
// 테스트 SMS 발송
// ============================================

export async function sendTestSMSAction(formData: FormData) {
  try {
    // 1. 인증 확인
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: '인증이 필요합니다' }
    }

    // 2. 환경변수 확인
    if (!isSMSConfigured()) {
      return {
        success: false,
        error:
          'CoolSMS API 키가 설정되지 않았습니다. 환경변수를 확인하거나 Mock 모드를 활성화해주세요.',
      }
    }

    // 3. 입력 검증
    const recipientPhone = formData.get('recipientPhone')
    const validated = testSMSSchema.parse({ recipientPhone })

    // 4. 테스트 SMS 전송
    const result = await sendSMS({
      to: validated.recipientPhone,
      message: `[FloStok] SMS 알림 테스트
시스템이 정상적으로 작동 중입니다.
발신시간: ${new Date().toLocaleString('ko-KR')}`,
      type: 'SMS',
    })

    if (!result.success) {
      return { success: false, error: result.error || 'SMS 전송에 실패했습니다' }
    }

    return {
      success: true,
      message: '테스트 SMS가 발송되었습니다',
      mock: result.mock,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || '입력 데이터가 올바르지 않습니다',
      }
    }

    console.error('테스트 SMS 발송 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '서버 오류가 발생했습니다',
    }
  }
}

// ============================================
// 알림 설정 상태 확인
// ============================================

export async function checkNotificationStatus() {
  try {
    // 1. 인증 확인
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: '인증이 필요합니다' }
    }

    // 2. 환경변수 확인
    const isMockMode = process.env.NOTIFICATIONS_MOCK_MODE === 'true'

    return {
      success: true,
      status: {
        mockMode: isMockMode,
        email: {
          configured: isEmailConfigured(),
          apiKey: !!process.env.RESEND_API_KEY,
          fromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
        },
        sms: {
          configured: isSMSConfigured(),
          apiKey: !!process.env.COOLSMS_API_KEY,
          apiSecret: !!process.env.COOLSMS_API_SECRET,
          senderPhone: process.env.COOLSMS_SENDER_PHONE || '미설정',
        },
      },
    }
  } catch (error) {
    console.error('알림 설정 상태 확인 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '서버 오류가 발생했습니다',
    }
  }
}
