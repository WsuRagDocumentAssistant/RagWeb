# AI RAG Client

RAG 서버와 연동하는 AI 채팅 웹 클라이언트입니다.
파일을 업로드해 임베딩하고, AI에게 질문할 수 있습니다.
동음이의어(단어) 사전을 조회할 수 있습니다.

## 기술 스택

- **React 18** + **Vite 5**
- **React Router v7** — URL 기반 라우팅 (`/chat`, `/documents`, `/prompt`, `/external-api`, `/files`)
- **Tailwind CSS v4**
- **Zustand v5** — 전역 상태 관리
- **TypeScript** — 전역 상태(`AppState.ts`)만 적용
- **lucide-react** — 아이콘
- **sonner** — 토스트 알림

## 시작하기

```bash
npm install
npm run dev
```

## 폴더 구조

```
src/
├── config/
│   └── ApiService.js        # API 엔드포인트 설정
├── core/
│   └── AppState.ts          # 전역 상태 (Zustand)
├── routes/
│   └── router.jsx           # react-router 라우트 정의
├── shared/
│   ├── components/          # 공유 컴포넌트 (MessageBubble, FileItem)
│   ├── styles/              # 컴포넌트별 CSS
│   ├── utils/format.js
│   └── index.js
├── features/
│   ├── auth/
│   │   ├── components/      # LoginPage
│   │   ├── services/        # AuthService.js
│   │   ├── styles/
│   │   └── index.js
│   ├── chat/
│   │   ├── components/      # ChatPage, ChatInput(모델 선택 포함), ChatMessages, ChatSessionSidebar
│   │   ├── services/        # ChatService.js
│   │   ├── styles/
│   │   └── index.js
│   ├── documents/
│   │   ├── components/      # DocumentsPage (/documents, "문서 보기")
│   │   ├── styles/
│   │   └── index.js
│   ├── prompt/
│   │   ├── components/      # PromptPage (/prompt, "프롬프트 수정")
│   │   ├── styles/
│   │   └── index.js
│   ├── external-api/
│   │   ├── components/      # ExternalApiPage (/external-api, "외부 API 연동")
│   │   ├── styles/
│   │   └── index.js
│   ├── files/
│   │   ├── components/      # FileManagementPage (/files, "파일 임베딩")
│   │   ├── services/        # FileService.js
│   │   ├── styles/
│   │   └── index.js
│   └── dictionary/
│       ├── components/      # DictionaryPanel (사이드바 "사전 보기" 버튼에서 여는 모달리스 팝업, 조회 전용)
│       ├── services/        # DictionaryService.js
│       ├── styles/
│       └── index.js
└── layout/
    ├── components/          # RootLayout, ProtectedRoute, Titlebar, FileNotifications
    ├── styles/
    └── index.js
```

## 사이드바 구성

`ChatSessionSidebar`에 있는 네비게이션 순서:

1. **새 채팅** — `/chat`으로 이동 + 새 세션 생성
2. **문서 보기** (`/documents`) — 임베딩된 문서를 사업단/분류로 검색·필터링 (현재 목업 데이터)
3. **프롬프트 수정** (`/prompt`) — 시스템 프롬프트 텍스트 + 답변에 반영되는 비중(슬라이더) 설정
4. **외부 API 연동** (`/external-api`) — 외부 API 엔드포인트 등록/삭제, 상태 표시 (현재 목업 데이터)
5. **사전 보기** — 클릭 시 사이드바 옆에 모달리스 패널이 열림 (조회 전용, 페이지 이동 없음)
6. **파일 임베딩** (`/files`) — 파일 업로드 + 임베딩 진행 상태

그 아래로 채팅 세션 목록이 이어집니다.

## 동음이의어 사전 (Dictionary)

- 사이드바의 **사전 보기** 버튼으로 열리는 모달리스 패널 하나로만 제공 (조회 전용 — 등록/수정/삭제 없음)
- 어느 화면에 있든 사이드바에서 바로 열 수 있고, 클릭 외부 감지로 자동 닫힘
- 서버 API: `GET /dictionary/list` (`Authorization: Bearer` 토큰 필요)

## API 설정

`src/config/ApiService.js`에서 서버 URL을 변경합니다.

```js
export const SERVER_URL = "https://your-server-url";
```