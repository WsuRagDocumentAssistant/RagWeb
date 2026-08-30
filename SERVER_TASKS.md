# 서버 연동 작업 목록 (rag-web 클라이언트)

클라이언트(`ai_rag_system_Client`)에서 실제로 구현되어 서버 응답을 기다리고 있는 기능 목록입니다.
모든 항목은 이미 클라이언트 쪽 통신 로직(`{Feature}Service.js`)이 붙어 있고, 서버 요청이 실패하면
`src/shared/dummy.js`의 더미 데이터로 자동 대체되도록 만들어져 있습니다. 즉 **서버가 아직 없어도 클라이언트는
정상 동작**하며, 아래 task_type들이 실제로 구현되는 순간 더미 대신 진짜 데이터가 흐르게 됩니다.

## 통신 방식

게이트웨이는 단일 엔드포인트만 가지며, 실제 분기는 `task_type`으로 이루어집니다.

**요청**
```json
{
  "task_type": "USER_LIST",
  "session_id": "optional-session-id",
  "payload": { "...": "..." }
}
```

**응답**
```json
{
  "task_type": "USER_LIST",
  "status": "success",
  "result": { "...": "..." },
  "error_message": null
}
```

`status`가 `"error"` 또는 `"timeout"`이거나 HTTP 오류면 클라이언트는 `error_message`로 예외를 던지고,
곧바로 더미 데이터로 대체합니다 (`src/config/ApiService.js`의 `postTask()` 참고).

## task_type 목록

`src/config/TaskType.js` 기준입니다. **굵게 표시된 항목이 이번에 새로 추가되어 서버 구현이 필요합니다.**

| task_type | 그룹 | 상태 | 화면 / 버튼 |
| --- | --- | --- | --- |
| `LOGIN` | USER | 기존 | 로그인 |
| `REGISTER` | USER | 기존 | 회원가입 |
| `LOGOUT` | USER | 기존 | 로그아웃 |
| `SSO_LOGIN` | USER | 기존(호출부 없음) | — |
| **`USER_LIST`** | USER | **신규** | 권한 관리 화면 진입 시 |
| **`USER_SET_ROLE`** | USER | **신규** | 권한 관리 화면의 역할 드롭다운 |
| `USER_QUERY` | RAG | 기존 | 채팅 전송 |
| `MERGE_RESULTS` | RAG | 기존 | 채팅 비교 응답 병합 |
| `FILE_UPLOAD` | RAG | **변경**(필드명) | 문서 등록 "문서 등록" 버튼 |
| `FILE_LIST` | RAG | **변경**(필드명) | 문서 등록 / 문서 목록 진입 시 |
| `FILE_DELETE` | RAG | 기존 | 문서 목록 삭제 버튼 |
| **`FILE_DOWNLOAD`** | RAG | **신규** | 문서 목록 "다운로드" 버튼 |
| **`FILE_IMAGE_LIST`** | RAG | **신규** | 문서 목록 "이미지 보기" 진입 시 |
| **`FILE_IMAGE_SAVE`** | RAG | **신규** | 이미지 보기 모달의 "저장" 버튼 |
| **`FILE_IMAGE_UPLOAD`** | RAG | **신규** | 이미지 보기 모달의 "이미지 변경" 버튼 |
| `DICTIONARY_LIST` | DICTIONARY | 기존 | 검색어 관리 진입 시 |
| `DICTIONARY_SAVE` | DICTIONARY | **의미 변경** | 검색어 관리 "수정" 버튼 |
| **`EXTERNAL_API_LIST`** | EXTERNAL_API | **신규** | 외부 API 등록 진입 시 / 전체 새로고침 |
| **`EXTERNAL_API_SAVE`** | EXTERNAL_API | **신규** | 외부 API 등록의 "추가"/"저장" 버튼 |
| **`EXTERNAL_API_DELETE`** | EXTERNAL_API | **신규** | 외부 API 등록의 삭제 버튼 |
| **`EXTERNAL_API_SYNC`** | EXTERNAL_API | **신규** | 개별 갱신 주기가 지났을 때 자동 호출 |

---

## `result` 객체 요약표

응답 봉투는 전부 `{ task_type, status, result, error_message }`로 동일하고, **`result` 안에 실제로
들어가야 하는 객체/필드명**만 task_type별로 정리하면 아래와 같습니다. 상세 필드 설명과 예시는 각 기능
섹션(아래)에 있고, 여기서는 "무슨 이름의 객체가 들어가는지"만 빠르게 참고하는 용도입니다.

| task_type | `result` 형태 | 최상위 필드 |
| --- | --- | --- |
| `LOGIN` | 객체 | `access_token`, `user` (`{id, email, name, provider, created_at, role}`) |
| `REGISTER` | **사용 안 함** | 클라이언트는 성공/실패 여부만 보고, 응답 본문은 읽지 않음 |
| `LOGOUT` | **사용 안 함** | 응답 본문 읽지 않음 (실패해도 클라이언트는 무조건 로그아웃 처리) |
| `SSO_LOGIN` | 객체 | `access_token`, `user` (`LOGIN`과 동일 구조) — 현재 호출부 없음 |
| `USER_LIST` | 객체 | `users`: `{id, email, name, role}[]` |
| `USER_SET_ROLE` | **사용 안 함** | 클라이언트가 낙관적으로 먼저 반영하고 응답은 무시 |
| `USER_QUERY` | 객체 | `reply`, `sessionId`, `sources?`: `{id, name}[]` |
| `MERGE_RESULTS` | 객체 | `reply` |
| `FILE_UPLOAD` | 객체 | `fileId`(또는 `id`/`file_id`), `status?`, `chunks?` |
| `FILE_LIST` | **배열 자체** | `{files: [...]}`가 아니라 `EmbeddingFile[]`을 그대로 반환 (다른 `_LIST`들과 다름, 주의) |
| `FILE_DELETE` | **사용 안 함** | 응답 본문 읽지 않음 |
| `FILE_DOWNLOAD` | 객체 | `url` |
| `FILE_IMAGE_LIST` | 객체 | `images`: `DocumentImage[]` (`id, index, caption, majorTitle, midTitle, minorTitle, note, aiSummary, keyFacts[], keyPhrases[], imageUrl`) |
| `FILE_IMAGE_SAVE` | **사용 안 함** | 클라이언트가 낙관적으로 먼저 반영하고 응답은 무시 |
| `FILE_IMAGE_UPLOAD` | 객체 | `imageUrl` |
| `DICTIONARY_LIST` | 객체 | `entries`: `{id, term, synonyms, created_at, updated_at}[]` |
| `DICTIONARY_SAVE` | **사용 안 함** | 클라이언트가 이미 반영된 상태를 그대로 "저장됨"으로 안내, 응답은 무시 |
| `EXTERNAL_API_LIST` | 객체 | `apis`: `{id, title, url, source, apiKey, fetchedAt, refreshIntervalMinutes}[]` |
| `EXTERNAL_API_SAVE` | 객체 | `api`: `{id, title, url, source, apiKey, fetchedAt, refreshIntervalMinutes}` (id/fetchedAt은 서버가 채워서 반드시 반환) |
| `EXTERNAL_API_DELETE` | **사용 안 함** | 응답 본문 읽지 않음 |
| `EXTERNAL_API_SYNC` | 객체 | `fetchedAt` |

**"사용 안 함"인 항목도 `status: "success"` / `"error"`는 여전히 확인합니다** — 실패 시 클라이언트가
낙관적으로 반영해둔 값을 되돌리지는 않지만(더미 데모 특성상 그대로 둠), 정상 구현 시에는 실패하면
`error_message`를 채워서 최소한 `status`는 정확히 내려주세요.

---

## 인증 · 계정

### `LOGIN`
응답에 `role`이 포함되어야 합니다 (변경). 클라이언트의 모든 화면 권한(문서 등록·외부 API 등록·권한 관리
노출 여부)이 이 값 하나로 갈립니다.
```json
// 요청 payload
{ "email": "user@wsu.ac.kr", "password": "..." }
// 응답 result
{ "access_token": "...", "user": { "id": 1, "email": "...", "name": "...", "role": "admin" | "user" } }
```

### `REGISTER`
```json
// 요청 payload
{ "email": "user@wsu.ac.kr", "password": "...", "name": "홍길동" }
// 응답 result: 클라이언트는 내용을 사용하지 않고 성공 여부(status)만 봅니다. 실패 시 그대로 에러 표시.
```
가입 실패 시 더미 대체 없이 그대로 에러를 보여줍니다 (다른 기능과 달리 서버가 실제로 있어야 동작).

### `SSO_LOGIN`
```json
// 요청 payload
{ "sso_token": "..." }
// 응답 result
{ "access_token": "...", "user": { "id": 1, "email": "...", "name": "...", "role": "admin" | "user" } }
```

### `LOGOUT`
```json
// 요청 payload: 없음 (Authorization 헤더의 토큰만 사용)
// 응답 result: 클라이언트는 결과를 기다리지 않고(fire-and-forget) 즉시 로컬 로그아웃 처리합니다.
```

### 참고 사항
- 로그인 입력 라벨이 "학번/교번"으로 바뀌었지만, 전송 필드명은 그대로 `email` 문자열입니다.
- `SSO_LOGIN`은 로그인 화면의 버튼을 제거해 지금은 호출부가 없습니다. 폐기하지 말고 보류로 남겨주세요.

---

## 권한 관리 (신규)

파일: `src/features/admin/services/AdminService.js`

### `USER_LIST`
```json
// 요청 payload: 없음
// 응답 result
{ "users": [{ "id": 1, "email": "user@wsu.ac.kr", "name": "일반 사용자", "role": "user" }] }
```

### `USER_SET_ROLE`
```json
// 요청 payload
{ "email": "user@wsu.ac.kr", "role": "admin" }
```

**보안 주의**: 최상위 관리자 계정(`admin@wsu.ac.kr`)은 클라이언트 화면에서만 목록/역할변경 대상에서 제외하고 있습니다.
이 계정에 대한 `USER_SET_ROLE` 요청은 API 레벨에서도 거부해주세요 — 화면을 거치지 않고 직접 호출하면 우회할 수 있습니다.

---

## 문서 등록 (비정형)

### `FILE_UPLOAD` payload 필드명 교체 (변경)
분류 체계를 학교 서류분류 기준으로 전면 교체하면서 메타데이터 필드가 바뀌었습니다. 기존 필드
(`area, task, docType, subType, category, subCategory, docDate`)는 더 이상 보내지 않습니다.

```json
// 요청 payload
{
  "name": "2025_Q3_회의록.pdf",
  "mimeType": "application/pdf",
  "size": 245000,
  "content": "<base64>",
  "workCategory": "재정지원사업",   // 업무구분: 재정지원사업 | 대학평가 | 행정부서 | 행정부서(학과) | 기타
  "task": "대학혁신지원사업",        // 수행업무 — workCategory가 재정지원사업/대학평가일 때만 의미 있음
  "department": "대학혁신지원사업단", // 수행부서
  "reportType": "연간보고서",        // 보고서명
  "productionYear": "2026"          // 생산연도
}
// 응답 result
{ "fileId": "...", "status": "ready" | "processing" | "error", "chunks": 42 }
```

**중요**: `workCategory`, `task`, `department`, `reportType`은 사용자가 목록에 없는 값을 직접 입력해서
새 카테고리로 등록할 수 있습니다. 화이트리스트 검증 없이 자유 문자열로 저장해주세요.

### `FILE_LIST` 응답도 동일 필드명으로 (변경)
업로드와 조회가 같은 필드명을 쓰도록 맞춰주세요 (`EmbeddingFile`이 위 5개 필드를 그대로 포함).
```json
// 요청 payload: 없음
// 응답 result
{
  "files": [
    {
      "id": "...", "name": "2025_Q3_회의록.pdf", "size": 245000, "mimeType": "application/pdf",
      "status": "ready", "uploadedAt": 1735689600000, "chunks": 42,
      "workCategory": "재정지원사업", "task": "...", "department": "...", "reportType": "...", "productionYear": "2026"
    }
  ]
}
```

### `FILE_DELETE`
```json
// 요청 payload
{ "fileId": "dummy-file-1" }
// 응답 result: 없음 (성공 여부만 확인)
```

### `FILE_DOWNLOAD` (신규)
문서 목록의 "다운로드" 버튼. 원본 파일을 내려받을 수 있는 URL을 응답으로 돌려주면, 클라이언트가
`<a href download>`로 다운로드를 트리거합니다.
```json
// 요청 payload
{ "fileId": "dummy-file-1" }
// 응답 result
{ "url": "https://.../files/dummy-file-1/download" }
```
더미 환경에는 실제 원본 파일이 없어서, 서버 연결이 안 되면 대체 데이터 없이 그냥 실패 토스트만 보여줍니다.

**보안 주의**: 문서 등록 화면은 관리자만 들어가도록 막아뒀지만, `FILE_UPLOAD` / `FILE_DELETE` / `FILE_DOWNLOAD`
요청 자체도 서버에서 `role` 체크가 필요합니다.

---

## 문서 목록 · 이미지 뷰어 (신규)

파일: `src/features/documents/services/DocumentImageService.js`

### `FILE_IMAGE_LIST`
```json
// 요청 payload
{ "fileId": "dummy-file-1" }
// 응답 result
{
  "images": [
    {
      "id": "dummy-file-1-img-1",
      "index": 1,
      "caption": "표지 이미지...",
      "majorTitle": "", "midTitle": "", "minorTitle": "",
      "note": "",
      "aiSummary": "...",
      "keyFacts": ["..."],
      "keyPhrases": ["..."],
      "imageUrl": null
    }
  ]
}
```

### `FILE_IMAGE_SAVE`
"저장" 버튼을 눌렀을 때만 호출됩니다 (입력 중에는 호출되지 않음).
```json
// 요청 payload — changes는 아래 필드 중 바뀐 것만 포함
{
  "fileId": "dummy-file-1",
  "imageId": "dummy-file-1-img-1",
  "majorTitle": "...", "midTitle": "...", "minorTitle": "...",
  "note": "...", "aiSummary": "...",
  "keyFacts": ["..."], "keyPhrases": ["..."]
}
```

### `FILE_IMAGE_UPLOAD`
"이미지 변경" 버튼에서 새 이미지 파일을 올릴 때 호출됩니다.
```json
// 요청 payload
{ "fileId": "dummy-file-1", "imageId": "dummy-file-1-img-1", "name": "photo.png", "mimeType": "image/png", "content": "<base64>" }
// 응답 result
{ "imageUrl": "https://..." }
```

지금은 전부 클라이언트 메모리에만 있어서 새로고침하면 사라집니다. 위 세 가지가 구현되면 실제로 영속화됩니다.

---

## 외부 API 등록 (정형) (신규)

파일: `src/features/external-api/services/ExternalApiService.js`

### `EXTERNAL_API_LIST`
```json
// 요청 payload: 없음
// 응답 result
{
  "apis": [
    {
      "id": "1", "title": "네이버 검색 API", "url": "...", "source": "Naver",
      "apiKey": "…끝 4자리만, 혹은 마스킹된 값…",
      "fetchedAt": "2026-07-01T09:00:00.000Z",
      "refreshIntervalMinutes": 5
    }
  ]
}
```

### `EXTERNAL_API_SAVE`
`id`가 있으면 수정, 없으면 신규 등록입니다. **`fetchedAt`은 클라이언트가 보내지 않습니다** — 등록 시
서버가 현재 시각으로 채워서 응답에 포함해주세요.
```json
// 요청 payload (신규 등록 예시, id 없음)
{ "title": "...", "url": "...", "source": "Naver", "apiKey": "...", "refreshIntervalMinutes": 5 }
// 응답 result — 서버가 채운 id/fetchedAt 포함, 반드시 되돌려줘야 함
{ "api": { "id": "...", "title": "...", "url": "...", "source": "...", "apiKey": "...", "fetchedAt": "...", "refreshIntervalMinutes": 5 } }
```

**보안 주의**: API Key는 서버에 암호화 저장하고, 조회(`EXTERNAL_API_LIST`) 응답에는 절대 원문 키를 다시
내려주지 마세요. 화면에는 끝 4자리만 마스킹해서 보여줍니다 (`•••• ab12`).

### `EXTERNAL_API_DELETE`
```json
{ "id": "1" }
```

### `EXTERNAL_API_SYNC`
클라이언트가 30초마다(화면이 열려있는 동안, 클라이언트 시계 기준) 각 API의 `refreshIntervalMinutes`가
지났는지 확인해서, 지난 항목에 대해서만 개별 호출합니다.
```json
// 요청 payload
{ "id": "1" }
// 응답 result — 실제로 데이터를 다시 수집한 시각
{ "fetchedAt": "2026-08-28T09:44:00.000Z" }
```
지금은 이 호출이 실패해도 클라이언트가 자체적으로 현재 시각을 채워 넣습니다. 실제로는 이 시점에 원본
데이터를 다시 가져오는 로직이 필요합니다.

**보안 주의**: 화면은 관리자만 들어가도록 막아뒀지만, 위 4개 API 모두 서버에서도 `role` 체크가 필요합니다.

---

## 검색어 관리

파일: `src/features/dictionary/services/DictionaryService.js`

### `DICTIONARY_LIST`
```json
// 요청 payload
{ "search": "선택적 검색어" }
// 응답 result
{
  "entries": [
    { "id": 1, "term": "인공지능", "synonyms": "AI, 머신러닝", "created_at": "...", "updated_at": "..." }
  ]
}
```

### `DICTIONARY_SAVE` 의미 변경
화면에서 추가·삭제 버튼을 없애서, 이제 **기존 항목의 `term`/`synonyms`만 갱신하는 용도**로만 호출됩니다.
새 검색어 생성이나 삭제 엔드포인트를 별도로 준비하실 필요는 없습니다.
```json
// 요청 payload — 화면에 있는 전체 목록을 그대로 보냄(수정 여부와 무관하게 전체 배열)
{ "entries": [{ "id": 1, "term": "인공지능", "synonyms": "AI, 머신러닝" }] }
// 응답 result: 클라이언트는 사용하지 않고 성공 여부만 봅니다.
```

---

## 채팅 (기존 — 상세 스펙 보강)

파일: `src/features/chat/services/ChatService.js`

화면에는 "모델 선택"(비교할 모델 체크박스, 최대 3개), "모델 병합"(고른 응답들을 하나로 합치기),
"답변 선택"(여러 응답 중 더 나은 것 고르기) 기능이 이미 구현되어 있습니다.

**한 턴에서 여러 모델의 답변을 받은 뒤, 사용자의 다음 행동에 따라 요청 여부/종류가 갈립니다:**
- 답변 하나만 선택 → **서버 요청 없음.** 클라이언트가 로컬 state만 바꿔서 나머지 비교 답변을 화면에서
  정리합니다 (`choosePreference`). 별도 task_type을 만들 필요가 없습니다.
- 2개 이상 선택해서 병합 → **`MERGE_RESULTS` 요청.** 사용자가 체크한 답변들과 병합 수행 모델을 실어
  보냅니다 (`mergeTurn`). 아래 스펙 참고.

### `USER_QUERY`
사용자가 모델 선택 체크박스에서 고른 각 모델(`claude`/`gemini`/`gpt`)마다 **개별 요청을 병렬로** 보냅니다.
모델을 2개 이상 선택하면 화면에 나란히 비교 카드로 표시됩니다.
```json
// 요청 payload
{ "query": "...", "provider": "gpt", "fileIds": undefined }
// session_id: 이전 응답의 sessionId를 그대로 실어 보냄 (대화 맥락 유지용)
// 응답 result
{
  "reply": "...",
  "sessionId": "...",
  "sources": [{ "id": "dummy-file-1", "name": "2025_Q3_회의록.pdf" }]
}
```
- `provider`가 어떤 모델/엔드포인트를 호출할지는 서버에서 매핑해주세요 (클라이언트는 문자열만 전달).
- `fileIds`는 현재 항상 `undefined`로 보내고 있습니다 — RAG 검색 대상 파일을 사용자가 직접 고르는 UI는
  아직 없고, 서버가 임베딩된 전체 문서 중 알아서 관련 문서를 찾는 것으로 가정하고 있습니다.
- **이미지 첨부 질의**: 채팅에 이미지를 첨부하면 base64로 브라우저에만 저장되고, `USER_QUERY` payload에는
  포함되지 않습니다. 이미지 기반 질의를 실제로 처리하려면 전송 방식을 별도로 협의해야 합니다.

### `MERGE_RESULTS`
"병합" 버튼으로 2개 이상의 응답과 병합에 사용할 모델을 고른 뒤 호출됩니다.
```json
// 요청 payload
{
  "query": "원래 질문",
  "answers": [
    { "provider": "gpt", "content": "..." },
    { "provider": "claude", "content": "..." }
  ],
  "provider": "gpt"   // 병합 작업을 수행할 모델
}
// 응답 result
{ "reply": "..." }
```
호출이 실패하면(아직 서버 미구현 등) 클라이언트가 두 답변을 단순히 이어 붙여서 대체 표시합니다.

---

## 알림 (참고 — 서버 작업 불필요)

완전히 로컬(`localStorage`) 상태입니다. 서버 푸시가 없고, 여러 기기·세션 간 동기화가 필요해지면
그때 별도 설계가 필요합니다.

---

## 설계 미정 — 버튼은 있지만 동작이 정의되지 않음

- **설정 화면의 "프로필 변경" 버튼** (`SettingsModal.jsx`): 클릭해도 아무 동작이 없는 버튼입니다. 이름/비밀번호/
  아바타 중 무엇을 바꾸는 기능인지, 어떤 입력 폼이 필요한지가 아직 정해지지 않았습니다. 화면(UI)이 먼저
  설계되어야 어떤 task_type이 필요한지 정할 수 있어서, 지금은 API 목록에 넣지 않았습니다.

---

## 공통 · 인프라

- **외부 API 자동 새로고침의 한계**: `EXTERNAL_API_SYNC` 자동 호출은 클라이언트 JS 타이머라서, 관리자가
  외부 API 등록 화면을 열어두고 있는 동안에만 동작합니다. 브라우저 탭을 닫으면 그동안은 아무 것도 갱신되지
  않다가, 다시 열었을 때 그 시점 기준으로 다시 확인합니다. 화면과 무관하게 항상 주기적으로 재수집되어야
  한다면, 서버 쪽에 별도 스케줄러(cron 등)가 필요합니다.

---

## 보류 — 지금은 작업하지 않아도 됩니다

- **한글 파일 자동 감지**: 확장자를 보고 한글 문서인 경우 문서 정보 입력을 자동 활성화하는 기능
- **출처 문서 원문 뷰어**: 채팅 답변의 출처를 클릭했을 때 원본 문서를 바로 보여주는 기능
