---
name: write-tests
description: 컴포넌트/API/비즈니스 로직에 대한 테스트를 자동 생성합니다. Vitest + React Testing Library + Playwright 기반.
allowed-tools: Read,Write,Edit,Bash,Glob,Grep
---

# 테스트 작성 스킬

## 프로세스
1. 대상 파일/함수 분석
2. 테스트 케이스 목록 작성 (정상/에러/엣지케이스)
3. 테스트 파일 생성
4. `npm test` 실행하여 통과 확인

## 유닛 테스트 템플릿
```typescript
import { describe, it, expect } from 'vitest'
import { functionName } from './target'

describe('functionName', () => {
  it('정상 입력 시 올바른 결과를 반환한다', () => {
    const result = functionName(input)
    expect(result).toBe(expected)
  })

  it('빈 입력 시 기본값을 반환한다', () => {
    // ...
  })

  it('잘못된 입력 시 에러를 발생시킨다', () => {
    expect(() => functionName(invalidInput)).toThrow()
  })
})
```

## 컴포넌트 테스트 템플릿
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComponentName } from './component-name'

describe('ComponentName', () => {
  it('올바르게 렌더링된다', () => {
    render(<ComponentName />)
    expect(screen.getByText('텍스트')).toBeInTheDocument()
  })

  it('클릭 시 핸들러가 호출된다', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<ComponentName onClick={onClick} />)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
```

## 규칙
- describe/it 설명은 한국어
- 테스트 파일: 대상 파일 옆에 `*.test.ts(x)` 배치
- 각 테스트는 독립적으로 실행 가능
- 스냅샷 테스트 사용 금지
- 모킹은 최소한으로
