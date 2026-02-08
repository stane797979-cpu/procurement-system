---
name: deploy-check
description: 배포 전 빌드, 린트, 타입체크, 테스트를 모두 실행하여 문제를 사전에 잡습니다.
allowed-tools: Bash,Read,Grep
---

# 배포 전 체크 스킬

## 실행 순서
1. `npm run type-check` — TypeScript 타입 검증
2. `npm run lint` — ESLint 검사
3. `npm run build` — 프로덕션 빌드
4. `npm test` — 테스트 실행
5. 결과 요약 보고

## 검사 항목
- TypeScript 타입 에러 0개
- ESLint 경고/에러 0개
- 빌드 성공 (번들 크기 확인)
- 테스트 전체 통과
- 환경변수 누락 여부

## 실패 시 대응
- 타입 에러: 해당 파일 위치 + 수정 가이드 제공
- 린트 에러: `--fix`로 자동 수정 가능한 것 안내
- 빌드 실패: 에러 로그 분석 + 원인 파악
- 테스트 실패: 실패한 테스트 목록 + 원인 분석
