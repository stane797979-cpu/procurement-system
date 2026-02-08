---
name: db-migrate
description: Drizzle ORM 스키마 변경 + 마이그레이션을 생성합니다. 테이블 추가, 컬럼 수정, RLS 정책 설정 포함.
allowed-tools: Read,Write,Edit,Bash,Glob,Grep
---

# DB 마이그레이션 스킬

## 프로세스
1. 현재 스키마 파일 확인 (`src/server/db/schema/`)
2. 변경 사항 반영 (Drizzle 스키마 수정)
3. `npx drizzle-kit generate` 마이그레이션 생성
4. 생성된 SQL 파일 검토
5. RLS 정책 추가/수정 (필요시)
6. `npx drizzle-kit push` 적용 (개발) 또는 `npx drizzle-kit migrate` (프로덕션)

## Drizzle 스키마 템플릿
```typescript
import { pgTable, uuid, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core'

export const tableName = pgTable('table_name', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => organizations.id),
  // ... 컬럼
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
})
```

## 규칙
- 테이블명: snake_case 복수형
- 컬럼명: snake_case
- created_at, updated_at 필수
- tenant_id로 멀티테넌시
- 마이그레이션 파일 직접 수정 금지
- RLS 정책은 별도 SQL 파일로 관리
