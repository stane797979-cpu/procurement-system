---
name: create-component
description: shadcn/ui + Tailwind v3 기반 React 컴포넌트를 생성합니다. 컴포넌트 만들기, UI 만들기 등의 요청에 사용합니다.
allowed-tools: Read,Write,Edit,Bash,Glob,Grep
---

# 컴포넌트 생성 스킬

## 프로세스
1. components/ 디렉토리 구조 확인
2. 기존 유사 컴포넌트 패턴 참고
3. shadcn/ui Legacy Docs 기반 컴포넌트 생성
4. TypeScript Props 인터페이스 정의
5. Tailwind v3 클래스로 스타일링
6. 'use client' 필요 여부 판단

## 규칙
- 파일명: kebab-case (예: product-card.tsx)
- 컴포넌트명: PascalCase (예: ProductCard)
- Props는 interface로 정의 (type 아님)
- 모든 텍스트 한국어
- 반응형 필수 (모바일 우선)
- shadcn/ui Legacy Docs 기준 (Tailwind v3 + tailwind.config.js)
- Tailwind v4 사용 금지

## 컴포넌트 템플릿
```tsx
'use client' // 인터랙션 필요시에만

import { cn } from '@/lib/utils'

interface ComponentNameProps {
  className?: string
  // ... props
}

export function ComponentName({ className, ...props }: ComponentNameProps) {
  return (
    <div className={cn('기본스타일', className)}>
      {/* 컴포넌트 내용 */}
    </div>
  )
}
```
