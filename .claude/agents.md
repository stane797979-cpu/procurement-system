# 에이전트 오케스트레이션 가이드

> 8개 전문가 에이전트 + 8개 스킬을 효과적으로 운용하기 위한 조율 체계
> 이 문서는 메인 대화(Claude Code)의 행동 지침입니다.

---

## 핵심 원칙

1. **메인 대화가 유일한 오케스트레이터** — 서브에이전트끼리 직접 호출 불가
2. **SCM 우선** — SCM 관련 변경은 반드시 scm-expert가 먼저 설계/검증
3. **최소 비용** — 단순 작업은 에이전트 없이 메인에서 직접 처리
4. **품질 게이트** — 중요 변경은 code-reviewer가 반드시 검토

---

## 에이전트 선택 의사결정 트리

```
사용자 요청 수신
    │
    ├─ SCM 비즈니스 로직 변경? (재고/발주/수요예측/공급자/PSI/ABC 등)
    │  YES → scm-expert (opus) 필수
    │  └─ DB 스키마 변경? → + database-expert
    │     └─ API 필요? → + backend-expert
    │        └─ UI 필요? → + frontend-expert
    │
    ├─ AI 기능 관련?
    │  YES → ai-expert (opus)
    │  └─ SCM 데이터 활용? → + scm-expert
    │
    ├─ 순수 프론트엔드? → frontend-expert (sonnet)
    ├─ 순수 백엔드/API? → backend-expert (sonnet)
    │  └─ DB 변경? → + database-expert
    ├─ DB 스키마/마이그레이션? → database-expert (sonnet)
    ├─ 테스트 작성? → test-expert (sonnet)
    ├─ 배포/CI/CD? → devops-expert (haiku)
    ├─ 코드 리뷰? → code-reviewer (opus, 읽기전용)
    │
    └─ 단순 작업? → 에이전트 없이 메인에서 직접 처리
       (단일 파일 수정, 설정 변경, 문서, git, 검색)
```

### SCM 관련 판단 키워드
```
재고, 발주, 안전재고, 발주점, ABC, XYZ, PSI, 수요예측,
리드타임, EOQ, MOQ, 공급자, 납기, 입고, 출고, 품절,
재고회전율, 재고일수, 서비스수준, S&OP, MRP, BOM,
SKU, 품목, 단가, 마진, 스코어링
```

### SCM 관련 파일 경로
```
src/core/domain/**     → 무조건 SCM 관련
smart_procurement.py   → SCM 관련 (현재 시스템)
```

---

## 워크플로우 패턴

### WF-1: SCM 기능 개발 (최중요)
```
예: "발주 우선순위 스코어링 구현"

Phase 1 — 도메인 설계 (필수, 생략 불가)
  scm-expert → 비즈니스 로직 설계, 공식 정의, 검증 체크리스트
  ⚠️ Phase 1 없이 Phase 2 진입 금지

Phase 2 — 구현
  database-expert → 스키마 + 마이그레이션  (순차: Phase 1 후)
  backend-expert → API 구현               (순차: DB 후)
  frontend-expert → UI 컴포넌트           (병렬 가능: 목업 데이터)

Phase 3 — 검증
  test-expert → 비즈니스 로직 테스트
  code-reviewer → 보안/성능 리뷰
  scm-expert → 최종 로직 검증
```

### WF-2: 일반 기능 개발
```
예: "사용자 프로필 페이지"

메인 설계 → database-expert(필요시) → backend + frontend(병렬) → test-expert
```

### WF-3: 버그 수정
```
SCM 관련? → scm-expert(로직 검증) → 원인 에이전트(수정) → test-expert(회귀)
기술 관련? → 원인 에이전트(분석+수정) → test-expert(회귀)
```

### WF-4: DB 스키마 변경
```
scm-expert(SCM 관련시 데이터 모델 검증)
→ database-expert(스키마+마이그레이션)
→ backend-expert(API 수정) + frontend-expert(UI 수정)
→ test-expert(테스트)
```

### WF-5: AI 기능 추가
```
scm-expert + ai-expert (병렬: 도메인 로직 + AI 설계)
→ ai-expert(AI 백엔드) + backend-expert(API) + frontend-expert(UI)
→ scm-expert(비즈니스 검증) + test-expert(E2E)
```

### WF-6: 배포 전 체크
```
test-expert(deploy-check 스킬) → code-reviewer(5+파일 변경시) → devops-expert(배포)
```

### WF-7: PR/코드 리뷰
```
code-reviewer(보안/품질 분석)
+ scm-expert(SCM 코드 변경시 추가 리뷰)
+ database-expert(DB 변경시 추가 리뷰)
→ 메인이 통합하여 PR 코멘트
```

---

## 에이전트 체이닝 규칙

### 순차 실행 (의존성 있을 때)
```
에이전트 A 실행 → 결과 요약 추출 → 에이전트 B 프롬프트에 주입

예: scm-expert 출력 "발주점 = 일평균판매량 × 리드타임 + 안전재고"
  → backend-expert 프롬프트: "위 공식으로 API 구현해줘"
```

### 병렬 실행 (독립적일 때)
```
frontend-expert(UI) ←→ backend-expert(API)     — 독립적 → 병렬
test-expert(테스트) ←→ code-reviewer(리뷰)      — 독립적 → 병렬
```

### 실패 시 에스컬레이션
```
1. 에이전트 실패 → 메인이 에러 분석
2. 도메인 문제 → scm-expert 재검토
3. 기술 문제 → 해당 전문가 재시도
4. 구조적 문제 → 메인이 직접 해결 또는 사용자 확인
```

---

## 품질 게이트

### code-reviewer 자동 호출 조건
- 변경 파일 5개 이상
- SCM 비즈니스 로직 변경
- 인증/보안 코드 변경
- API 엔드포인트 추가/수정
- DB 스키마 변경

### deploy-check 필수 조건
- main 브랜치 머지 전
- 배포 전
- 사용자가 "배포" 언급 시

---

## 에이전트-스킬 매핑

| 에이전트 | 모델 | 프리로드 스킬 | Memory |
|---------|------|-------------|--------|
| scm-expert | opus | scm-analysis, procurement-logic | project |
| frontend-expert | sonnet | create-component | - |
| backend-expert | sonnet | create-api | - |
| database-expert | sonnet | db-migrate | - |
| code-reviewer | opus | review-code | project |
| test-expert | sonnet | write-tests, deploy-check | - |
| ai-expert | opus | - | - |
| devops-expert | haiku | - | - |

### Memory 전략
```
scm-expert (memory: project):
  기억: 발주점 공식, 재고상태 분류 기준, ABC등급 소스, 데이터 모델 결정사항

code-reviewer (memory: project):
  기억: 코딩 컨벤션, 자주 발견되는 이슈 패턴

나머지 6개: memory 없음 (토큰 절약)
```

---

## 비용 최적화

### 에이전트 안 쓰는 경우
- 단일 파일 수정 (10줄 이하)
- 설정 파일 변경 (.env, config)
- 문서/README 수정
- git 커밋/PR 생성
- 단순 검색/조회

### 모델 비용 티어
```
opus  (비쌈): scm-expert, ai-expert, code-reviewer → 설계/판단/보안
sonnet (적정): frontend, backend, database, test → 구현/코딩
haiku  (저렴): devops → 정형화된 배포 작업
```

### 병렬 실행 주의
```
병렬 3개 = 토큰 3배 소비
→ 진짜 독립적인 작업만 병렬
→ 의존성 있으면 반드시 순차
```
