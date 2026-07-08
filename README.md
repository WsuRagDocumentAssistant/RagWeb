# AI RAG Client

RAG 서버와 연동하는 AI 채팅 웹 클라이언트입니다.
파일을 업로드해 임베딩하고, AI에게 질문할 수 있습니다.
동음이의어(단어) 사전을 등록·검색·수정·삭제할 수 있습니다.

## 기술 스택

- **React 18** + **Vite 5**
- **React Router v7** — URL 기반 라우팅 (`/chat`, `/files`, `/dictionary`)
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
│   │   ├── components/      # ChatPage, ChatInput, ChatMessages, ChatSessionSidebar
│   │   ├── services/        # ChatService.js
│   │   ├── styles/
│   │   └── index.js
│   ├── files/
│   │   ├── components/      # FileManagementPage
│   │   ├── services/        # FileService.js
│   │   ├── styles/
│   │   └── index.js
│   └── dictionary/
│       ├── components/      # DictionaryPage (/dictionary 탭), DictionaryPanel (모달리스 팝업)
│       ├── services/        # DictionaryService.js
│       ├── styles/
│       └── index.js
└── layout/
    ├── components/          # RootLayout, ProtectedRoute, Titlebar, FileNotifications
    ├── styles/
    └── index.js
```

## 동음이의어 사전 (Dictionary)

- **`/dictionary` 탭**: 전체 화면 CRUD 페이지 (검색, 추가, 인라인 수정/삭제)
- **모달리스 패널**: Titlebar의 📖 버튼으로 열리며, 페이지 이동 없이 `/chat`, `/files`, `/dictionary` 어디서든 접근 가능 (클릭 외부 감지로 자동 닫힘)
- 서버 API: `GET /dictionary/list`, `POST /dictionary/create`, `PUT /dictionary/update/{id}`, `DELETE /dictionary/delete/{id}` (모두 `Authorization: Bearer` 토큰 필요)

## API 설정

`src/config/ApiService.js`에서 서버 URL을 변경합니다.

```js
export const SERVER_URL = "https://your-server-url";
```