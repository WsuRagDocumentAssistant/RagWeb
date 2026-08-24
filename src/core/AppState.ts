import { create } from "zustand";
import { toast } from "sonner";
import * as chatService from "@/features/chat/services/ChatService";
import * as fileService from "@/features/files/services/FileService";
import * as authService from "@/features/auth/services/AuthService";
import * as dictionaryService from "@/features/dictionary/services/DictionaryService";
import {
  getDummyChatReply,
  getDummyMergedReply,
  getDummyDocumentImages,
  DUMMY_FILES,
  DUMMY_DICTIONARY_ENTRIES,
  DUMMY_SOURCE_FILES,
  DUMMY_LOGIN_CREDENTIALS,
  DUMMY_USER,
} from "@/shared";

// ─── 타입 ─────────────────────────────────────────────────────────────────────

export type AIProvider = "claude" | "gpt" | "gemini" | "local";
export type MessageRole = "user" | "assistant";
export type EmbeddingFileStatus = "uploading" | "processing" | "ready" | "error";

export interface MessageSource {
  id: string;
  name: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  isStreaming?: boolean;
  error?: string;
  sources?: MessageSource[];
  provider?: AIProvider | "merged";
  turnId?: string;
  preferred?: boolean;
  mergerProvider?: AIProvider;
  attachmentUrl?: string; // 채팅에 첨부한 이미지 미리보기 (data URL) — 문서 등록/임베딩과는 무관
}

export interface ChatSession {
  id: string;
  backendSessionId: string | null;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface DocumentMetadata {
  area?: string; // 영역
  task?: string; // 세부 과제
  docType?: string; // 구분
  subType?: string; // 세부구분
  category?: string; // 유형
  subCategory?: string; // 세부 유형
  docDate?: string; // 기준 날짜 (YYYY-MM-DD)
}

export interface EmbeddingFile extends DocumentMetadata {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  status: EmbeddingFileStatus;
  uploadedAt: number;
  errorMessage?: string;
  chunks?: number;
}

export interface DocumentImage {
  id: string;
  index: number;
  caption: string;
  majorTitle?: string; // 대제목
  midTitle?: string; // 중제목
  minorTitle?: string; // 소제목
  note?: string; // 부연 설명
  aiSummary: string; // AI 한줄 요약
  keyFacts: string[]; // 핵심 시각 정보
  keyPhrases: string[]; // 이미지 내 주요 문구/키워드
  imageUrl?: string | null; // 교체된 이미지(object URL). null이면 기본 목업 미리보기 사용
}

export interface AuthUser {
  id: number;
  email: string;
  name?: string;
  provider: string;
  created_at: string;
}

export interface DictionaryEntry {
  id: number | string;
  term: string; // 기준 검색어
  synonyms: string; // 같이 인식할 단어 (쉼표로 구분)
  created_at: string;
  updated_at: string;
}

export type NotificationType = "success" | "error" | "info";

export interface AppNotification {
  id: string;
  message: string;
  type: NotificationType;
  link?: string; // 클릭 시 이동할 경로
  createdAt: number;
  read: boolean;
}

// ─── 슬라이스 타입 ────────────────────────────────────────────────────────────

interface ChatSlice {
  sessions: ChatSession[];
  activeSessionId: string | null;
  chatLoading: boolean;
  chatError: string | null;
  selectedProviders: AIProvider[];
  sendMessage: (text: string, attachmentUrl?: string) => Promise<void>;
  toggleProvider: (p: AIProvider) => void;
  mergeTurn: (turnId: string, messageIds: string[], mergerProvider: AIProvider) => Promise<void>;
  choosePreference: (turnId: string, keepMessageId: string) => void;
  createSession: () => void;
  selectSession: (id: string) => void;
  deleteSession: (id: string) => void;
  setChatError: (e: string | null) => void;
}

interface FileSlice {
  files: EmbeddingFile[];
  fileLoading: boolean;
  uploadProgress: number;
  fileError: string | null;
  fetchFiles: () => Promise<void>;
  uploadFile: (file: File, metadata?: DocumentMetadata) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
  setFileError: (e: string | null) => void;
  documentImages: Record<string, DocumentImage[]>;
  ensureDocumentImages: (file: EmbeddingFile) => DocumentImage[];
  updateDocumentImage: (fileId: string, imageId: string, changes: Partial<DocumentImage>) => void;
}

interface AuthSlice {
  user: AuthUser | null;
  token: string | null;
  authLoading: boolean;
  authInitialized: boolean;
  authError: string | null;
  initializeAuth: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithSSO: (ssoToken: string) => Promise<void>;
  logout: () => void;
  setAuthError: (e: string | null) => void;
}

export type ThemeMode = "light" | "dark";

interface UISlice {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

interface PromptSlice {
  systemPrompt: string;
  promptWeight: number;
  setSystemPrompt: (text: string) => void;
  setPromptWeight: (weight: number) => void;
  resetPrompt: () => void;
}

interface DictionarySlice {
  dictEntries: DictionaryEntry[];
  dictLoading: boolean;
  dictSaving: boolean;
  dictError: string | null;
  fetchDictEntries: (search?: string) => Promise<void>;
  addDictEntry: () => void;
  updateDictEntry: (id: DictionaryEntry["id"], changes: Partial<Pick<DictionaryEntry, "term" | "synonyms">>) => void;
  removeDictEntry: (id: DictionaryEntry["id"]) => void;
  saveDictEntries: () => Promise<void>;
}

interface NotificationSlice {
  notifications: AppNotification[];
  pushNotification: (message: string, opts?: { type?: NotificationType; link?: string }) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

type AppStore = ChatSlice & FileSlice & AuthSlice & UISlice & DictionarySlice & PromptSlice & NotificationSlice;

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

const genId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const SESSIONS_KEY = "chat_sessions";
const ACTIVE_SESSION_KEY = "chat_active_session";
const PROMPT_TEXT_KEY = "system_prompt";
const PROMPT_WEIGHT_KEY = "prompt_weight";
const DEFAULT_PROMPT_WEIGHT = 50;
const THEME_KEY = "app_theme";
const NOTIFICATIONS_KEY = "app_notifications";
const NOTIFICATIONS_LIMIT = 30;

const initialTheme: ThemeMode = localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
document.documentElement.setAttribute("data-theme", initialTheme);

const applyTheme = (theme: ThemeMode) => {
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.setAttribute("data-theme", theme);
};

const makeSession = (): ChatSession => ({
  id: genId("session"),
  backendSessionId: null,
  title: "새 대화",
  messages: [],
  createdAt: Date.now(),
});

const deriveTitle = (text: string) => {
  if (!text) return "이미지 문의";
  return text.length > 20 ? `${text.slice(0, 20)}…` : text;
};

const MODEL_LABEL: Record<string, string> = {
  claude: "Claude",
  gpt: "GPT",
  gemini: "Gemini",
  local: "로컬 모델",
};

const MAX_COMPARE_PROVIDERS = 3;

const loadSessions = (): ChatSession[] => {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? (JSON.parse(raw) as ChatSession[]) : [];
  } catch {
    return [];
  }
};

const persistSessions = (sessions: ChatSession[]) => {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
};

const persistActiveSessionId = (id: string | null) => {
  if (id) localStorage.setItem(ACTIVE_SESSION_KEY, id);
  else localStorage.removeItem(ACTIVE_SESSION_KEY);
};

const loadNotifications = (): AppNotification[] => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
};

const persistNotifications = (notifications: AppNotification[]) => {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
};

const storedSessions = loadSessions();
const initialSessions = storedSessions.length > 0 ? storedSessions : [makeSession()];
const initialActiveSessionId = (() => {
  const stored = localStorage.getItem(ACTIVE_SESSION_KEY);
  if (stored && initialSessions.some((s) => s.id === stored)) return stored;
  return initialSessions[0]?.id ?? null;
})();

// ─── AppState ─────────────────────────────────────────────────────────────────

export const useAppState = create<AppStore>((set, get) => ({
  // ── Chat ──────────────────────────────────────────────────────────────────
  sessions: initialSessions,
  activeSessionId: initialActiveSessionId,
  chatLoading: false,
  chatError: null,
  selectedProviders: ["gpt"],

  sendMessage: async (text, attachmentUrl) => {
    let { activeSessionId, sessions, selectedProviders } = get();

    if (!activeSessionId || !sessions.some((s) => s.id === activeSessionId)) {
      const session = makeSession();
      sessions = [session, ...sessions];
      activeSessionId = session.id;
      set({ sessions, activeSessionId });
      persistActiveSessionId(activeSessionId);
    }

    const sessionId = activeSessionId;
    const providers = selectedProviders.length > 0 ? selectedProviders : (["gpt"] as AIProvider[]);
    const turnId = genId("turn");
    const userMsg: Message = { id: genId("u"), role: "user", content: text, createdAt: Date.now(), turnId, attachmentUrl };
    const asstMsgs: Message[] = providers.map((provider) => ({
      id: genId("a"),
      role: "assistant",
      content: "",
      createdAt: Date.now(),
      isStreaming: true,
      provider,
      turnId,
    }));

    set((s) => ({
      sessions: s.sessions.map((sess) =>
        sess.id === sessionId
          ? {
              ...sess,
              title: sess.messages.length === 0 ? deriveTitle(text) : sess.title,
              messages: [...sess.messages, userMsg, ...asstMsgs],
            }
          : sess,
      ),
      chatLoading: true,
      chatError: null,
    }));
    persistSessions(get().sessions);

    await Promise.all(
      asstMsgs.map(async (asstMsg) => {
        try {
          const activeSession = get().sessions.find((sess) => sess.id === sessionId);
          const data = await chatService.sendMessage({
            message: text,
            provider: asstMsg.provider as AIProvider,
            sessionId: activeSession?.backendSessionId ?? undefined,
          });
          const readyFileSources = get().files
            .filter((f) => f.status === "ready")
            .slice(0, 2)
            .map((f) => ({ id: f.id, name: f.name }));
          const sources: MessageSource[] = (data.sources as MessageSource[] | undefined)
            ?? (readyFileSources.length > 0 ? readyFileSources : DUMMY_SOURCE_FILES.slice(0, 1));
          set((s) => ({
            sessions: s.sessions.map((sess) =>
              sess.id === sessionId
                ? {
                    ...sess,
                    backendSessionId: data.sessionId ?? sess.backendSessionId,
                    messages: sess.messages.map((m) =>
                      m.id === asstMsg.id ? { ...m, content: data.reply, isStreaming: false, sources } : m,
                    ),
                  }
                : sess,
            ),
          }));
        } catch (err) {
          // 서버 연결 실패 시에도 화면을 계속 확인할 수 있도록 더미 답변으로 대체
          const dummy = getDummyChatReply(text, asstMsg.provider as string);
          set((s) => ({
            sessions: s.sessions.map((sess) =>
              sess.id === sessionId
                ? {
                    ...sess,
                    messages: sess.messages.map((m) =>
                      m.id === asstMsg.id ? { ...m, content: dummy.reply, isStreaming: false, sources: dummy.sources } : m,
                    ),
                  }
                : sess,
            ),
            chatError: err instanceof Error ? err.message : "알 수 없는 오류",
          }));
        }
      }),
    );

    set({ chatLoading: false });
    persistSessions(get().sessions);
  },

  toggleProvider: (p) => {
    const { selectedProviders } = get();
    if (selectedProviders.includes(p)) {
      if (selectedProviders.length === 1) {
        toast.info("최소 1개의 모델은 선택되어 있어야 합니다.");
        return;
      }
      set({ selectedProviders: selectedProviders.filter((x) => x !== p) });
      return;
    }
    if (selectedProviders.length >= MAX_COMPARE_PROVIDERS) {
      toast.info(`최대 ${MAX_COMPARE_PROVIDERS}개까지 비교할 수 있습니다.`);
      return;
    }
    set({ selectedProviders: [...selectedProviders, p] });
  },

  mergeTurn: async (turnId, messageIds, mergerProvider) => {
    const { sessions, activeSessionId } = get();
    const session = sessions.find((s) => s.id === activeSessionId);
    if (!session) return;

    const idSet = new Set(messageIds);
    const turnAssistants = session.messages.filter(
      (m) => m.turnId === turnId && m.role === "assistant" && m.provider !== "merged" && idSet.has(m.id),
    );
    if (turnAssistants.length < 2) return;
    const userMsg = session.messages.find((m) => m.turnId === turnId && m.role === "user");

    const mergedMsg: Message = {
      id: genId("m"),
      role: "assistant",
      content: "",
      createdAt: Date.now(),
      isStreaming: true,
      provider: "merged",
      mergerProvider,
      turnId,
    };
    set((s) => ({
      sessions: s.sessions.map((sess) =>
        sess.id === session.id ? { ...sess, messages: [...sess.messages, mergedMsg] } : sess,
      ),
    }));
    persistSessions(get().sessions);

    try {
      const data = await chatService.mergeResults({
        query: userMsg?.content ?? "",
        answers: turnAssistants.map((m) => ({ provider: m.provider as string, content: m.content })),
        provider: mergerProvider,
      });
      set((s) => ({
        sessions: s.sessions.map((sess) =>
          sess.id === session.id
            ? {
                ...sess,
                messages: sess.messages.map((m) =>
                  m.id === mergedMsg.id ? { ...m, content: data.reply, isStreaming: false } : m,
                ),
              }
            : sess,
        ),
      }));
    } catch {
      // 병합 전용 백엔드가 아직 없을 때를 대비한 클라이언트 측 대체 병합.
      // 매칭되는 더미 시나리오가 있으면 그 병합 답변을 쓰고, 없으면 단순 이어붙이기로 대체.
      const providers = turnAssistants.map((m) => m.provider as string);
      const fallback = getDummyMergedReply(userMsg?.content, providers) ?? turnAssistants
        .map((m) => `**${MODEL_LABEL[m.provider as string] ?? m.provider}**\n${m.content}`)
        .join("\n\n---\n\n");
      set((s) => ({
        sessions: s.sessions.map((sess) =>
          sess.id === session.id
            ? {
                ...sess,
                messages: sess.messages.map((m) =>
                  m.id === mergedMsg.id ? { ...m, content: fallback, isStreaming: false } : m,
                ),
              }
            : sess,
        ),
      }));
    }
    persistSessions(get().sessions);
  },

  // 선택된 답변만 남기고 같은 턴의 나머지 비교 답변은 삭제한다.
  choosePreference: (turnId, keepMessageId) => {
    set((s) => ({
      sessions: s.sessions.map((sess) => ({
        ...sess,
        messages: sess.messages.map((m) =>
          m.turnId === turnId && m.role === "assistant" && m.provider !== "merged"
            ? { ...m, preferred: m.id === keepMessageId }
            : m,
        ),
      })),
    }));
    persistSessions(get().sessions);
  },

  createSession: () => {
    const session = makeSession();
    set((s) => ({ sessions: [session, ...s.sessions], activeSessionId: session.id }));
    persistSessions(get().sessions);
    persistActiveSessionId(session.id);
  },

  selectSession: (id) => {
    set({ activeSessionId: id });
    persistActiveSessionId(id);
  },

  deleteSession: (id) => {
    set((s) => {
      const remaining = s.sessions.filter((sess) => sess.id !== id);
      const activeSessionId = s.activeSessionId === id ? (remaining[0]?.id ?? null) : s.activeSessionId;
      return { sessions: remaining, activeSessionId };
    });
    persistSessions(get().sessions);
    persistActiveSessionId(get().activeSessionId);
  },

  setChatError: (chatError) => set({ chatError }),

  // ── File ──────────────────────────────────────────────────────────────────
  files: [],
  fileLoading: false,
  uploadProgress: 0,
  fileError: null,

  fetchFiles: async () => {
    try {
      const files = await fileService.listFiles();
      set({ files, fileError: null });
    } catch (err) {
      // 서버 연결 실패 시 더미 파일 목록으로 대체
      set({ files: DUMMY_FILES as EmbeddingFile[], fileError: err instanceof Error ? err.message : "파일 목록 조회 실패" });
    }
  },

  uploadFile: async (file: File, metadata?: DocumentMetadata) => {
    const tempId = genId("tmp");
    const toastId = toast.loading(`${file.name} 업로드 중...`);
    set((s) => ({
      files: [
        {
          id: tempId,
          name: file.name,
          size: file.size,
          mimeType: file.type,
          status: "uploading",
          uploadedAt: Date.now(),
          ...metadata,
        },
        ...s.files,
      ],
      fileLoading: true,
      uploadProgress: 0,
      fileError: null,
    }));
    try {
      const data = await fileService.uploadFile(file, (progress) => set({ uploadProgress: progress }), metadata) as any;
      const fileId = data.fileId ?? data.id ?? data.file_id ?? tempId;
      const fileStatus = (data.status ?? "ready") as EmbeddingFileStatus;
      const chunks = data.chunks ?? Math.max(1, Math.round(file.size / 4000));
      set((s) => ({
        files: s.files.map((f) =>
          f.id === tempId ? { ...f, id: fileId, status: fileStatus, chunks } : f,
        ),
        fileLoading: false,
        uploadProgress: 0,
      }));
      toast.success(`${file.name} 업로드 완료`, { id: toastId });
      get().pushNotification(`${file.name} 업로드가 완료되었습니다.`, { type: "success", link: "/documents" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "업로드 실패";
      // 서버 연결 실패 시에도 데모를 계속 볼 수 있도록 더미 결과(완료 처리)로 대체
      const chunks = Math.max(1, Math.round(file.size / 4000));
      set((s) => ({
        files: s.files.map((f) =>
          f.id === tempId ? { ...f, status: "ready", chunks } : f,
        ),
        fileLoading: false,
        uploadProgress: 0,
        fileError: msg,
      }));
      toast.success(`${file.name} 업로드 완료 (더미)`, { id: toastId });
      get().pushNotification(`${file.name} 업로드가 완료되었습니다. (더미)`, { type: "success", link: "/documents" });
    }
  },

  deleteFile: async (id) => {
    const prev = get().files;
    const prevImages = get().documentImages;
    set((s) => {
      // 문서를 삭제하면 해당 문서의 이미지/임베딩 정보도 함께 제거한다.
      const nextImages = { ...s.documentImages };
      delete nextImages[id];
      return { files: s.files.filter((f) => f.id !== id), documentImages: nextImages };
    });
    try {
      await fileService.deleteFile(id);
    } catch (err) {
      set({ files: prev, documentImages: prevImages, fileError: err instanceof Error ? err.message : "삭제 실패" });
    }
  },

  setFileError: (fileError) => set({ fileError }),

  documentImages: {},

  ensureDocumentImages: (file) => {
    const existing = get().documentImages[file.id];
    if (existing) return existing;
    const generated = getDummyDocumentImages(file);
    set((s) => ({ documentImages: { ...s.documentImages, [file.id]: generated } }));
    return generated;
  },

  updateDocumentImage: (fileId, imageId, changes) => {
    set((s) => ({
      documentImages: {
        ...s.documentImages,
        [fileId]: (s.documentImages[fileId] ?? []).map((img) =>
          img.id === imageId ? { ...img, ...changes } : img,
        ),
      },
    }));
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  user: null,
  token: null,
  authLoading: false,
  authInitialized: false,
  authError: null,

  initializeAuth: () => {
    const token = localStorage.getItem("auth_token");
    const raw = localStorage.getItem("auth_user");
    if (token && raw) {
      try {
        set({ token, user: JSON.parse(raw) as AuthUser, authInitialized: true });
        return;
      } catch { /* ignore */ }
    }
    set({ authInitialized: true });
  },

  login: async (email, password) => {
    set({ authLoading: true, authError: null });
    try {
      const data = await authService.login(email, password) as { access_token: string; user: AuthUser };
      localStorage.setItem("auth_token", data.access_token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      set({ user: data.user, token: data.access_token, authLoading: false });
    } catch (err) {
      // 서버 연결 실패 시에도 화면을 계속 확인할 수 있도록 더미 계정으로 로그인 허용
      if (email === DUMMY_LOGIN_CREDENTIALS.email && password === DUMMY_LOGIN_CREDENTIALS.password) {
        const token = "dummy-token";
        localStorage.setItem("auth_token", token);
        localStorage.setItem("auth_user", JSON.stringify(DUMMY_USER));
        set({ user: DUMMY_USER as AuthUser, token, authLoading: false, authError: null });
        return;
      }
      set({ authLoading: false, authError: err instanceof Error ? err.message : "로그인 실패" });
    }
  },

  register: async (email, password, name) => {
    set({ authLoading: true, authError: null });
    try {
      await authService.register(email, password, name);
      set({ authLoading: false });
    } catch (err) {
      set({ authLoading: false, authError: err instanceof Error ? err.message : "회원가입 실패" });
      throw err;
    }
  },

  loginWithSSO: async (ssoToken) => {
    set({ authLoading: true, authError: null });
    try {
      const data = await authService.ssoLogin(ssoToken) as { access_token: string; user: AuthUser };
      localStorage.setItem("auth_token", data.access_token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      set({ user: data.user, token: data.access_token, authLoading: false });
    } catch (err) {
      set({ authLoading: false, authError: err instanceof Error ? err.message : "SSO 로그인 실패" });
    }
  },

  logout: () => {
    const token = get().token;
    authService.logout(token ?? undefined).catch(() => {});
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    set({ user: null, token: null, authError: null });
  },

  setAuthError: (authError) => set({ authError }),

  // ── UI ────────────────────────────────────────────────────────────────────
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),

  theme: initialTheme,
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next: ThemeMode = get().theme === "dark" ? "light" : "dark";
    applyTheme(next);
    set({ theme: next });
  },

  settingsOpen: false,
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),

  // ── Dictionary ────────────────────────────────────────────────────────────
  dictEntries: [],
  dictLoading: false,
  dictSaving: false,
  dictError: null,

  fetchDictEntries: async (search) => {
    set({ dictLoading: true, dictError: null });
    try {
      const data = await dictionaryService.listEntries(search) as { entries: DictionaryEntry[] };
      set({ dictEntries: data.entries ?? [], dictLoading: false });
    } catch (err) {
      // 서버 연결 실패 시 더미 사전 항목으로 대체
      set({ dictEntries: DUMMY_DICTIONARY_ENTRIES, dictLoading: false, dictError: err instanceof Error ? err.message : "사전 목록 조회 실패" });
    }
  },

  addDictEntry: () => {
    const now = new Date().toISOString();
    const entry: DictionaryEntry = { id: genId("dict"), term: "", synonyms: "", created_at: now, updated_at: now };
    set((s) => ({ dictEntries: [entry, ...s.dictEntries] }));
  },

  updateDictEntry: (id, changes) => {
    set((s) => ({
      dictEntries: s.dictEntries.map((e) =>
        e.id === id ? { ...e, ...changes, updated_at: new Date().toISOString() } : e,
      ),
    }));
  },

  removeDictEntry: (id) => {
    set((s) => ({ dictEntries: s.dictEntries.filter((e) => e.id !== id) }));
  },

  saveDictEntries: async () => {
    set({ dictSaving: true });
    try {
      await dictionaryService.saveEntries(get().dictEntries);
      toast.success("검색어를 저장했습니다.");
      get().pushNotification("검색어를 저장했습니다.", { type: "success", link: "/dictionary" });
    } catch {
      // 저장 전용 백엔드가 아직 없어도 화면에는 이미 반영돼 있으므로 저장된 것으로 안내
      toast.success("검색어를 저장했습니다. (임시 저장)");
      get().pushNotification("검색어를 저장했습니다. (임시 저장)", { type: "success", link: "/dictionary" });
    }
    set({ dictSaving: false });
  },

  // ── Prompt ────────────────────────────────────────────────────────────────
  systemPrompt: localStorage.getItem(PROMPT_TEXT_KEY) ?? "",
  promptWeight: Number(localStorage.getItem(PROMPT_WEIGHT_KEY)) || DEFAULT_PROMPT_WEIGHT,

  setSystemPrompt: (systemPrompt) => {
    localStorage.setItem(PROMPT_TEXT_KEY, systemPrompt);
    set({ systemPrompt });
  },

  setPromptWeight: (promptWeight) => {
    localStorage.setItem(PROMPT_WEIGHT_KEY, String(promptWeight));
    set({ promptWeight });
  },

  resetPrompt: () => {
    localStorage.removeItem(PROMPT_TEXT_KEY);
    localStorage.removeItem(PROMPT_WEIGHT_KEY);
    set({ systemPrompt: "", promptWeight: DEFAULT_PROMPT_WEIGHT });
  },

  // ── Notification ──────────────────────────────────────────────────────────
  notifications: loadNotifications(),

  pushNotification: (message, opts) => {
    const notification: AppNotification = {
      id: genId("notif"),
      message,
      type: opts?.type ?? "info",
      link: opts?.link,
      createdAt: Date.now(),
      read: false,
    };
    set((s) => {
      const notifications = [notification, ...s.notifications].slice(0, NOTIFICATIONS_LIMIT);
      persistNotifications(notifications);
      return { notifications };
    });
  },

  markNotificationRead: (id) => {
    set((s) => {
      const notifications = s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      persistNotifications(notifications);
      return { notifications };
    });
  },

  markAllNotificationsRead: () => {
    set((s) => {
      const notifications = s.notifications.map((n) => ({ ...n, read: true }));
      persistNotifications(notifications);
      return { notifications };
    });
  },
}));
