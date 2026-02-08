---
name: create-api
description: Next.js API Route + Server Action 엔드포인트를 생성합니다. Zod 유효성 검증 + 에러 핸들링 포함.
allowed-tools: Read,Write,Edit,Bash,Glob,Grep
---

# API 엔드포인트 생성 스킬

## 프로세스
1. 엔드포인트 용도 파악 (CRUD, 특수 로직)
2. Zod 스키마로 입력 유효성 정의
3. Drizzle ORM 쿼리 작성
4. 에러 핸들링 + 응답 형식 통일
5. RLS 정책 확인

## API Route 템플릿
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/server/db'

const requestSchema = z.object({
  // 입력 스키마
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = requestSchema.parse(body)

    const result = await db./* Drizzle 쿼리 */

    return NextResponse.json({ data: result })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
```

## Server Action 템플릿
```typescript
'use server'

import { z } from 'zod'
import { db } from '@/server/db'
import { revalidatePath } from 'next/cache'

const actionSchema = z.object({
  // 입력 스키마
})

export async function actionName(formData: FormData) {
  const validated = actionSchema.parse(Object.fromEntries(formData))

  await db./* Drizzle 쿼리 */

  revalidatePath('/경로')
}
```

## 규칙
- Zod 스키마로 입력 검증 필수
- 에러 메시지는 한국어
- 민감 데이터 응답에서 제외
- RLS 정책과 일치하는지 확인
