---
name: review-code
description: 변경된 파일의 코드 품질, 보안, 성능을 자동 리뷰합니다.
allowed-tools: Read,Grep,Glob,Bash
---

# 코드 리뷰 스킬

## 프로세스
1. `git diff --name-only` 변경 파일 목록 확인
2. 각 파일의 변경 내용 분석
3. 보안/성능/품질 체크리스트 적용
4. 리뷰 결과 보고 (심각도별 분류)

## 리뷰 체크리스트

### 보안 (Critical)
- 하드코딩된 시크릿/API 키
- SQL 인젝션 가능성
- XSS 취약점 (dangerouslySetInnerHTML)
- 인증/인가 누락
- RLS 정책 미적용

### 성능 (High)
- N+1 쿼리 문제
- 불필요한 리렌더링
- 대용량 데이터 페이지네이션 누락
- 이미지 최적화 미적용

### 품질 (Medium)
- TypeScript any 타입 사용
- 에러 핸들링 누락
- 코드 중복
- 네이밍 컨벤션 위반

### 스타일 (Low)
- 미사용 import
- console.log 잔존
- TODO 주석 미처리

## 출력 형식
```
## 코드 리뷰 결과

### Critical (0건)
없음

### High (1건)
- **파일**: src/app/api/orders/route.ts:42
- **문제**: 페이지네이션 없이 전체 데이터 조회
- **수정**: `limit(50).offset(page * 50)` 추가

### Medium (2건)
...
```
