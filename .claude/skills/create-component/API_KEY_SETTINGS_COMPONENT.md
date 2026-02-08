# API 키 관리 UI 컴포넌트

## 개요
`src/app/(dashboard)/settings/_components/api-key-settings.tsx`에서 Settings 페이지에 API 키 관리 기능을 제공합니다.

## 주요 기능

### 1. API 키 생성 (Generate)
- 키 이름 입력 필드
- Mock 데이터로 임의의 API 키 생성 (실제는 서버 액션 호출 예정)
- 성공/실패 메시지 알림
- 로딩 상태 관리

### 2. API 키 목록 표시
- 생성된 모든 API 키 표시
- 각 키별로:
  - **키 이름**: 키의 용도를 명시
  - **마스킹 표시**: 기본적으로 마스킹 처리된 키 표시 (`fs_live_••••••••••••••••••••••••••••345`)
  - **생성 날짜**: `YYYY-MM-DD` 형식
  - **마지막 사용 날짜**: 없으면 "아직 사용되지 않음"

### 3. 키 보이기/숨기기
- **눈 아이콘 (Eye/EyeOff)** 버튼으로 전체 키 표시/숨김 토글
- 보안을 위해 기본값은 마스킹 상태

### 4. 키 복사
- **복사 아이콘 (Copy)** 버튼으로 클립보드에 복사
- 복사 후 2초간 "복사됨" 상태 표시 (초록색 체크마크)
- 반응형 UI: 모바일에서는 아이콘만, 데스크톱에서는 아이콘 + 텍스트

### 5. 키 삭제
- **삭제 아이콘 (Trash2)** 버튼
- 클릭 시 확인 다이얼로그 표시
- "이 API 키를 삭제하면 이 키를 사용하는 모든 애플리케이션이 작동하지 않습니다" 경고
- 삭제 후 성공 메시지 표시

### 6. 사용 기록 탭
- "API 키 사용 기록" 탭에서 각 키의 사용 현황 확인
- 마지막 사용 날짜 표시
- 현재는 읽기 전용 (향후 상세 로그 추가 가능)

### 7. 보안 안내
- 하단의 보안 경고 메시지
- API 키 안전 관리 방법 안내

## 컴포넌트 구조

```
<APIKeySettings>
  ├─ Tabs (API 키 / 사용 기록)
  │
  ├─ [API 키 탭]
  │  ├─ Card: 새 API 키 생성
  │  │  ├─ Input: 키 이름
  │  │  ├─ Alert: 메시지
  │  │  └─ Button: 생성
  │  │
  │  ├─ Card: 생성된 API 키
  │  │  └─ ApiKeyItem (반복)
  │  │     ├─ 좌측: 키 정보
  │  │     │  ├─ 이름 + 생성일
  │  │     │  ├─ 코드블록: 마스킹 키
  │  │     │  ├─ 버튼: 보기/숨기기
  │  │     │  ├─ 버튼: 복사
  │  │     │  └─ 마지막 사용일
  │  │     └─ 우측: 삭제 버튼
  │  │
  │  └─ Alert: 보안 경고
  │
  ├─ [사용 기록 탭]
  │  └─ Card: 키별 사용 기록 (읽기 전용)
  │
  └─ AlertDialog: 삭제 확인
```

## Props

```typescript
interface APIKeySettingsProps {
  organizationId: string  // 조직 ID (현재 미사용, 향후 서버 액션 호출 시 사용)
}
```

## State 관리

| State | 타입 | 설명 |
|-------|------|------|
| `apiKeys` | `APIKey[]` | 생성된 API 키 목록 (Mock 데이터) |
| `isCreating` | `boolean` | 키 생성 중 로딩 상태 |
| `newKeyName` | `string` | 새 키 생성 시 입력할 이름 |
| `visibleKeys` | `Set<string>` | 마스킹 해제된 키의 ID 집합 |
| `deleteConfirm` | `string \| null` | 삭제 확인 다이얼로그의 열림 상태 및 대상 ID |
| `message` | `{ type, text } \| null` | 성공/실패 메시지 |
| `copiedId` | `string \| null` | 복사된 키의 ID (2초 후 초기화) |

## 스타일링

- **Tailwind CSS v3** 사용
- **shadcn/ui** 컴포넌트:
  - `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
  - `Button` (variant: outline, ghost)
  - `Input`
  - `Label`
  - `Alert`, `AlertDescription`
  - `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`
  - `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogHeader`, `AlertDialogTitle`
- **Lucide Icons**: Copy, Eye, EyeOff, Plus, Trash2, Loader2, CheckCircle2, AlertCircle, Key

## Mock 데이터

```typescript
[
  {
    id: '1',
    name: '운영 API 키',
    key: 'fs_live_abc123def456ghi789jkl012mno345',
    maskedKey: 'fs_live_••••••••••••••••••••••••••••345',
    createdAt: '2025-02-01',
    lastUsedAt: '2025-02-06',
  },
  {
    id: '2',
    name: '개발 API 키',
    key: 'fs_test_xyz789uvw012rst345def678ghi901',
    maskedKey: 'fs_test_••••••••••••••••••••••••••••901',
    createdAt: '2024-12-15',
    lastUsedAt: '2025-02-05',
  },
]
```

## Settings 페이지 통합

### 변경 사항

**`src/app/(dashboard)/settings/page.tsx`**

1. Import 추가:
```typescript
import { APIKeySettings } from "./_components/api-key-settings";
```

2. TabsList 수정 (6개 탭 그리드):
```tsx
<TabsList className="grid w-full grid-cols-6">
  <TabsTrigger value="api">API 키</TabsTrigger>
</TabsList>
```

3. TabsContent 추가:
```tsx
<TabsContent value="api" className="space-y-4">
  <APIKeySettings organizationId={TEMP_ORG_ID} />
</TabsContent>
```

## 향후 구현 사항

### 서버 액션 필요
- `generateAPIKey(organizationId: string, name: string)` → APIKey 생성
- `deleteAPIKey(keyId: string)` → 키 삭제
- `getAPIKeys(organizationId: string)` → 키 목록 조회
- `logAPIKeyUsage(keyId: string)` → 사용 기록 로깅

### 데이터베이스 테이블
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,  -- 해시된 키만 저장
  created_at TIMESTAMP DEFAULT now(),
  last_used_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE api_key_usage_logs (
  id UUID PRIMARY KEY,
  api_key_id UUID NOT NULL REFERENCES api_keys(id),
  endpoint VARCHAR(255),
  method VARCHAR(10),
  status_code INT,
  timestamp TIMESTAMP DEFAULT now()
);
```

### 보안 개선
- API 키 생성 시 전체 키는 한 번만 표시 → 이후 마스킹 처리
- 데이터베이스에는 해시값만 저장 (평문 저장 금지)
- 키 순환(Rotation) 기능 추가
- 키별 권한 관리 (scope/permissions)
- 레이트 리미팅

## 테스트 체크리스트

- [ ] 새 API 키 생성 (Mock 성공/실패)
- [ ] 키 목록 표시
- [ ] 키 마스킹 표시 (기본값)
- [ ] 보이기/숨기기 토글
- [ ] 복사 기능 (2초 피드백)
- [ ] 삭제 확인 다이얼로그
- [ ] 삭제 후 목록 업데이트
- [ ] 사용 기록 탭 표시
- [ ] 반응형 디자인 (모바일/데스크톱)
- [ ] 빌드 성공 (ESLint 통과)

## 빌드 상태

- `npm run build`: 프로젝트의 기존 오류와는 별개로 새 컴포넌트는 ESLint 통과
- TypeScript strict mode 호환

## 파일 경로

- **컴포넌트**: `c:/Claude_Project/src/app/(dashboard)/settings/_components/api-key-settings.tsx`
- **Page 통합**: `c:/Claude_Project/src/app/(dashboard)/settings/page.tsx`
