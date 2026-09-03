# AI RAG Client

우송대학교 RAG(문서 기반 질의응답) 서버와 연동하는 웹 클라이언트입니다. 문서를 등록·임베딩하고,
여러 AI 모델(GPT/Claude/Gemini)에게 동시에 질문해서 답변을 비교·병합할 수 있습니다.

## 기술 스택

- **React 18** + **Vite 5**
- **React Router v7** — URL 기반 라우팅
- **Tailwind CSS v4** — `src/index.css`의 `@theme` 토큰으로 라이트/다크 팔레트 정의
- **Zustand v5** — 전역 상태 관리 (`src/core/AppState.ts`)
- **TypeScript** — 전역 상태(`AppState.ts`, `features/tutorial/TutorialAppState.ts`)에만 적용, 나머지는 JS/JSX
- **react-markdown** + **rehype-raw**/**rehype-sanitize** — 채팅 답변의 마크다운·인라인 HTML 렌더링
- **lucide-react** — 아이콘
- **sonner** — 토스트 알림

## 시작하기

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드 (dist/)
```

`dist/`는 `npm run build`가 만드는 정적 빌드 산출물입니다(HTML/JS/CSS 번들) — 소스 코드가 아니라
배포용 결과물이라 직접 수정하지 않고, `src/`를 고친 뒤 다시 빌드합니다.

## 개발 시 주의사항

- 개발자는 **`src/` 폴더 아래만 수정**합니다. 그 외 루트 설정 파일(`vite.config.js`, `package.json`,
  `Dockerfile`, `nginx.conf`, `k8s/`, `tsconfig.json` 등)은 빌드·배포 전반에 영향을 주므로 임의로
  수정하지 않습니다.
- `src/` 바깥에서 수정이 필요한 부분이 있다면 직접 고치지 말고 먼저 문의합니다.

## 통신 아키텍처

서버(게이트웨이)는 **단일 엔드포인트**(`POST /api/task`)만 가지며, 실제 기능 분기는 요청의 `task_type`
문자열로 이루어집니다. HTTP 메서드(GET/POST/PUT/DELETE)에 대응하는 의미는 `task_type` 이름 규칙으로
표현됩니다(`_LIST`=조회, `_SAVE`=등록/수정, `_DELETE`=삭제 등).

```json
// 요청
{ "task_type": "FILE_LIST", "session_id": null, "payload": {} }
// 응답
{ "task_type": "FILE_LIST", "status": "success", "result": {}, "error_message": null }
```

- `src/config/TaskType.js` — 전체 task_type 상수 목록
- `src/config/ApiService.js` — task_type 조회 헬퍼(`getTaskType`)와 공통 요청 함수(`postTask`), 상대
  경로를 절대 URL로 바꾸는 `resolveServerUrl`
- `src/features/*/services/*Service.js` — 기능별 통신 로직 (전부 `postTask` 기반)
- 서버에 구현해야 하는 task_type과 요청/응답 스펙은 (제공한 한글 문서 [통신모듈.hwpx]) 참고

### 서버 연결 실패 시 동작

**로그인만 예외적으로 더미 계정 폴백이 있습니다** — 서버가 꺼져 있어도 `src/shared/dummy.js`의
`DUMMY_ACCOUNTS`(`admin@wsu.ac.kr` 등 4개 계정, 비밀번호 `1234`)로 로그인해서 화면 확인이 가능합니다.
**그 외 모든 기능은 서버 요청이 실패하면 더미 데이터로 대체하지 않고 실패를 그대로 보여줍니다** —
빈 목록, 에러 토스트, 채팅 답변 말풍선의 에러 표시 등으로 실패가 드러납니다.

## 로그인 · 권한

- 로그인 성공 응답의 `user.role`(`"admin"` | `"user"`) 하나로 화면 접근 권한이 갈립니다.
- **관리자 전용**: 문서 등록(비정형) `/files`, 외부 API 등록(정형) `/external-api`, 권한 관리 `/admin`
- **전체 사용자 공개**: 채팅 `/chat`, 문서 목록 `/documents`, 이미지 편집기 `/image-editor`,
  검색어 관리 `/dictionary`
- 권한 관리(`/admin`) 화면에서 관리자가 다른 계정의 역할을 실시간으로 바꿀 수 있습니다.

## 폴더 구조

### 루트

```
.
├── src/                # 소스 코드 — 개발자가 수정하는 대상 (아래 참고)
├── docs/               # SERVER_TASKS.md 등 서버 연동 문서 (.gitignore 대상)
├── dist/               # npm run build 산출물 (빌드로 생성, 직접 수정 금지)
├── k8s/                # 쿠버네티스 배포 매니페스트
├── index.html          # Vite 엔트리 HTML
├── vite.config.js       # Vite 빌드/alias(@ → src) 설정
├── tsconfig.json        # AppState.ts / TutorialAppState.ts용 TS 설정
├── Dockerfile / nginx.conf  # 컨테이너 빌드 · nginx 정적 서빙 설정
└── package.json
```

### `src/`

```
src/
├── config/
│   ├── TaskType.js          # task_type 상수 전체 목록
│   └── ApiService.js        # postTask / getTaskType / resolveServerUrl
├── core/
│   └── AppState.ts          # 전역 상태 (Zustand)
├── routes/
│   └── router.jsx           # react-router 라우트 정의
├── assets/                  # 정적 이미지 리소스 (우송대학교 로고 등)
├── shared/
│   ├── components/          # MessageBubble, ComboBoxInput, SortableHeaderCell, WoosongLogo
│   ├── hooks/useSortableRows.js
│   ├── utils/format.js
│   ├── dummy.js              # DUMMY_ACCOUNTS(로그인 폴백) + 문서 등록 폼의 실제 분류 체계 데이터
│   └── index.js
├── features/
│   ├── auth/                 # LoginPage, AuthService.js
│   ├── chat/                 # ChatPage, ChatInput(모델 선택), ChatMessages(비교/병합/선호), RightSidebar(출처), LeftSidebar
│   ├── documents/             # DocumentsPage(문서 목록), DocumentImageViewerModal(페이지 이미지 뷰어·편집)
│   ├── files/                 # FileManagementPage(문서 등록/비정형 업로드, 관리자 전용)
│   ├── external-api/          # ExternalApiPage(외부 API 등록/정형, 관리자 전용)
│   ├── dictionary/             # DictionaryPage(검색어 관리)
│   ├── admin/                  # AdminUsersPage(권한 관리)
│   ├── svg-editor/              # SvgEditorPage(이미지 편집기), SvgEditorService(로컬 IO + 서버 벡터화)
│   ├── settings/                 # SettingsModal(계정 정보, 화면 모드)
│   ├── tutorial/                  # 화면 하이라이트 튜토리얼(TutorialOverlay, TutorialAppState.ts, 더미 데모 데이터)
│   └── prompt/                    # PromptPage(라우트만 존재, 사이드바에는 비노출)
└── layout/
    ├── components/          # RootLayout, ProtectedRoute, Titlebar, FileNotifications
    └── styles/
```

## 화면별 기능

### 채팅 (`/chat`)
- 모델 선택 체크박스(GPT/Claude/Gemini, 최대 3개)로 고른 모델마다 병렬로 질의
- 2개 이상 비교 시 나란히 카드로 표시 → "어떤 응답이 더 나은가요?"로 하나 선택하거나, 2개 이상 골라
  다른 모델에게 "병합" 요청 가능 (병합을 수행할 모델은 비교에 없던 모델도 선택 가능)
- 답변을 클릭하면 우측 패널에 참고한 출처 문서 표시
- 좌측 사이드바 대화 목록은 서버와 동기화(목록은 가볍게 제목만, 클릭 시 그 대화의 메시지 내역만 조회)
- 파일/이미지를 드래그하거나 붙여넣어 채팅에 첨부 가능
- 채팅 답변은 마크다운 + 일부 인라인 HTML(`<u>`, `<mark>` 등, XSS 방지를 위해 화이트리스트 처리)을 렌더링

### 문서 목록 (`/documents`)
- 등록된 문서 목록, 정렬 가능한 표
- "이미지 보기"로 문서의 페이지 이미지들을 확인·설명 편집·이미지 교체
- "다운로드"로 원본 파일 다운로드
- 이미지를 "이미지 편집기에서 열기"로 보내서 벡터화 편집 가능

### 문서 등록/비정형 (`/files`, 관리자)
- PDF 등 비정형 문서를 업로드해 임베딩. 업로드 시 업무구분/수행업무/수행부서/보고서명/생산연도 메타데이터 입력
  (학교 서류분류 체계 기반 종속 드롭다운, 목록에 없는 값은 직접 입력해서 새 항목으로 등록 가능)

### 외부 API 등록/정형 (`/external-api`, 관리자)
- 공공데이터 등 정형 API 엔드포인트 등록/수정/삭제
- API별로 자동 갱신 주기(분)를 설정하면, 화면이 열려 있는 동안 주기적으로 갱신 필요 여부를 확인해서
  개별 갱신 요청을 보냄

### 이미지 편집기 (`/image-editor`)
- SVG 파일은 그대로 열고, PNG/JPG는 서버에 실제 벡터(선/도형) 변환을 요청 (서버 미연결 시 원본 이미지를
  그대로 감싼 SVG로 대체)
- 텍스트 요소를 클릭하면 내용/크기/위치를 상단 패널과 캔버스에서 동시 편집 (크기 조절/이동/삭제 핸들)

### 검색어 관리 (`/dictionary`)
- 등록된 검색어(기준 단어 + 동의어)를 조회하고 내용 수정

### 권한 관리 (`/admin`, 관리자)
- 전체 계정 목록과 역할(관리자/일반 사용자)을 조회하고 변경

### 튜토리얼 (사이드바 "튜토리얼 보기")
- 화면 요소를 하이라이트(스포트라이트)로 짚어가며 로그인부터 전체 기능을 순서대로 안내
- 로그인 스텝에서는 데모 계정(`admin@wsu.ac.kr`)으로 값을 채우고 자동 로그인까지 진행
- 관리자 전용 기능도 건너뛰지 않고 전부 보여주되 "관리자 전용 기능" 배지로 구분
- 검색 문서 선택/이미지 보기/병합 결과처럼 실제 데이터가 없으면 비어 보일 수 있는 화면은 실제 서버
  데이터 대신 `features/tutorial/data/tutorialDummyData.js`의 더미 데이터로 항상 동일하게 시연
- 진행 상태(`tutorial_step_index`, `tutorial_done`)는 `localStorage`에 저장되어 다음 방문 시 이어서 볼 수 있음
