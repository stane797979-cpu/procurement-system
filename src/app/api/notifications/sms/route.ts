/**
 * SMS 알림 API
 * POST /api/notifications/sms
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendSMS, isValidPhoneNumber, normalizePhoneNumber } from '@/lib/sms'
import { createClient } from '@/lib/supabase/server'

// ============================================
// 입력 유효성 검증
// ============================================

const smsRequestSchema = z.object({
  to: z
    .union([z.string(), z.array(z.string())])
    .refine((value) => {
      const phones = Array.isArray(value) ? value : [value]
      return phones.every(isValidPhoneNumber)
    }, '유효하지 않은 전화번호입니다'),
  message: z
    .string()
    .min(1, '메시지를 입력해주세요')
    .max(2000, '메시지는 2000자 이내로 입력해주세요'),
  type: z.enum(['SMS', 'LMS', 'MMS']).optional(),
})

// ============================================
// POST /api/notifications/sms
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
    const validated = smsRequestSchema.parse(body)

    // 3. 전화번호 정규화
    const normalizedTo = Array.isArray(validated.to)
      ? validated.to.map(normalizePhoneNumber)
      : normalizePhoneNumber(validated.to)

    // 4. SMS 전송
    const result = await sendSMS({
      to: normalizedTo,
      message: validated.message,
      type: validated.type,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'SMS 전송에 실패했습니다' },
        { status: 500 }
      )
    }

    // 5. 응답
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
          details: (error as z.ZodError).issues,
        },
        { status: 400 }
      )
    }

    console.error('SMS API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
