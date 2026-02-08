/**
 * 이메일 알림 API
 * POST /api/notifications/email
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendEmail, isValidEmail } from '@/lib/email'
import { createClient } from '@/lib/supabase/server'

// ============================================
// 입력 유효성 검증
// ============================================

const emailRequestSchema = z.object({
  to: z
    .union([z.string().email(), z.array(z.string().email())])
    .refine((value) => {
      const emails = Array.isArray(value) ? value : [value]
      return emails.every(isValidEmail)
    }, '유효하지 않은 이메일 주소입니다'),
  subject: z.string().min(1, '제목을 입력해주세요').max(200, '제목은 200자 이내로 입력해주세요'),
  html: z.string().min(1, '본문을 입력해주세요'),
  text: z.string().optional(),
  cc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  bcc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
})

// ============================================
// POST /api/notifications/email
// ============================================

export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 2. 입력 검증
    const body = await request.json()
    const validated = emailRequestSchema.parse(body)

    // 3. 이메일 전송
    const result = await sendEmail(validated)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '이메일 전송에 실패했습니다' },
        { status: 500 }
      )
    }

    // 4. 응답
    return NextResponse.json({
      success: true,
      id: result.id,
      mock: result.mock,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: '입력 데이터가 올바르지 않습니다',
          details: error.issues,
        },
        { status: 400 }
      )
    }

    console.error('이메일 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
