import { create } from "zustand";
import { toast } from "sonner";
import * as chatService from "@/features/chat/services/ChatService";
import * as fileService from "@/features/files/services/FileService";
import * as authService from "@/features/auth/services/AuthService";
import * as dictionaryService from "@/features/dictionary/services/DictionaryService";
import {
  getDummyChatReply,
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
}

export interface ChatSession {
  id: string;
  backendSessionId: string | null;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface EmbeddingFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  status: EmbeddingFileStatus;
  uploadedAt: number;
  errorMessage?: string;
}

export interface AuthUser {
  id: number;
  email: string;
  name?: string;
  provider: string;
  created_at: string;
}

export interface DictionaryEntry {
  id: number;
  term: string;
  meaning: string;
  note?: string | null;
  created_at: string;
  updated_at: string;
}

// ─── 슬라이스 타입 ────────────────────────────────────────────────────────────

interface ChatSlice {
  sessions: ChatSession[];
  activeSessionId: string | null;
  chatLoading: boolean;
  chatError: string | null;
  selectedProviders: AIProvider[];
  sendMessage: (text: string) => Promise<void>;
  toggleProvider: (p: AIProvider) => void;
  mergeTurn: (turnId: string) => Promise<void>;
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
  uploadFile: (file: File) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
  setFileError: (e: string | null) => void;
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

interface UISlice {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
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
  dictError: string | null;
  dictPanelOpen: boolean;
  fetchDictEntries: (search?: string) => Promise<void>;
  closeDictPanel: () => void;
  toggleDictPanel: () => void;
}

type AppStore = ChatSlice & FileSlice & AuthSlice & UISlice & DictionarySlice & PromptSlice;

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

const genId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const SESSIONS_KEY = "chat_sessions";
const ACTIVE_SESSION_KEY = "chat_active_session";
const PROMPT_TEXT_KEY = "system_prompt";
const PROMPT_WEIGHT_KEY = "prompt_weight";
const DEFAULT_PROMPT_WEIGHT = 50;

const makeSession = (): ChatSession => ({
  id: genId("session"),
  backendSessionId: null,
  title: "새 대화",
  messages: [],
  createdAt: Date.now(),
});

const deriveTitle = (text: string) => (text.length > 20 ? `${text.slice(0, 20)}…` : text);

const MODEL_LABEL: Record<string, string> = {
  claude: "Claude",
  gpt: "GPT",
  gemini: "Gemini",
  local: "로컬 모델",
};

const MAX_COMPARE_PROVIDERS = 2;

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

  sendMessage: async (text) => {
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
    const userMsg: Message = { id: genId("u"), role: "user", content: text, createdAt: Date.now(), turnId };
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
          const dummy = getDummyChatReply();
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

  mergeTurn: async (turnId) => {
    const { sessions, activeSessionId } = get();
    const session = sessions.find((s) => s.id === activeSessionId);
    if (!session) return;

    const turnAssistants = session.messages.filter(
      (m) => m.turnId === turnId && m.role === "assistant" && m.provider !== "merged",
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
      // 병합 전용 백엔드가 아직 없을 때를 대비한 클라이언트 측 대체 병합
      const fallback = turnAssistants
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

  uploadFile: async (file: File) => {
    const tempId = genId("tmp");
    const toastId = toast.loading(`${file.name} 업로드 중...`);
    set((s) => ({
      files: [
        { id: tempId, name: file.name, size: file.size, mimeType: file.type, status: "uploading", uploadedAt: Date.now() },
        ...s.files,
      ],
      fileLoading: true,
      uploadProgress: 0,
      fileError: null,
    }));
    try {
      const data = await fileService.uploadFile(file, (progress) => set({ uploadProgress: progress })) as any;
      const fileId = data.fileId ?? data.id ?? data.file_id ?? tempId;
      const fileStatus = (data.status ?? "ready") as EmbeddingFileStatus;
      set((s) => ({
        files: s.files.map((f) =>
          f.id === tempId ? { ...f, id: fileId, status: fileStatus } : f,
        ),
        fileLoading: false,
        uploadProgress: 0,
      }));
      toast.success(`${file.name} 업로드 완료`, { id: toastId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "업로드 실패";
      set((s) => ({
        files: s.files.map((f) =>
          f.id === tempId ? { ...f, status: "error", errorMessage: msg } : f,
        ),
        fileLoading: false,
        uploadProgress: 0,
        fileError: msg,
      }));
      toast.error(`${file.name} 업로드 실패: ${msg}`, { id: toastId });
    }
  },

  deleteFile: async (id) => {
    const prev = get().files;
    set((s) => ({ files: s.files.filter((f) => f.id !== id) }));
    try {
      await fileService.deleteFile(id);
    } catch (err) {
      set({ files: prev, fileError: err instanceof Error ? err.message : "삭제 실패" });
    }
  },

  setFileError: (fileError) => set({ fileError }),

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

  // ── Dictionary ────────────────────────────────────────────────────────────
  dictEntries: [],
  dictLoading: false,
  dictError: null,
  dictPanelOpen: false,

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

  closeDictPanel: () => set({ dictPanelOpen: false }),
  toggleDictPanel: () => set((s) => ({ dictPanelOpen: !s.dictPanelOpen })),

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
}));
