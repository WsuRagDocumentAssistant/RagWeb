import { create } from "zustand";
import { toast } from "sonner";
import { resolveServerUrl } from "@/config/ApiService";
import * as chatService from "@/features/chat/services/ChatService";
import * as fileService from "@/features/files/services/FileService";
import * as authService from "@/features/auth/services/AuthService";
import * as dictionaryService from "@/features/dictionary/services/DictionaryService";
import * as adminService from "@/features/admin/services/AdminService";
import * as externalApiService from "@/features/external-api/services/ExternalApiService";
import * as documentImageService from "@/features/documents/services/DocumentImageService";
import {
  getDummyChatReply,
  getDummyMergedReply,
  getDummyDocumentImages,
  DUMMY_FILES,
  DUMMY_DICTIONARY_ENTRIES,
  DUMMY_SOURCE_FILES,
  DUMMY_ACCOUNTS,
  DUMMY_EXTERNAL_APIS,
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
  messagesLoaded?: boolean; // false면 목록 조회에서 메시지 내역이 아직 안 온 것 — 클릭 시 별도 조회 필요
}

export interface DocumentMetadata {
  workCategory?: string; // 업무구분 (재정지원사업/대학평가/행정부서/행정부서(학과)/기타)
  task?: string; // 수행업무 — 재정지원사업/대학평가일 때만 사용
  department?: string; // 수행부서
  reportType?: string; // 보고서명
  productionYear?: string; // 생산연도
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

export type UserRole = "admin" | "user";

export interface AuthUser {
  id: number;
  email: string;
  name?: string;
  provider: string;
  created_at: string;
  role: UserRole;
}

export interface DirectoryUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

export interface DictionaryEntry {
  id: number | string;
  term: string; // 기준 검색어
  synonyms: string; // 같이 인식할 단어 (쉼표로 구분)
  created_at: string;
  updated_at: string;
}

export interface ExternalApi {
  id: string;
  title: string;
  url: string;
  source: string;
  apiKey: string;
  fetchedAt: string; // ISO 시각 — 실제로 데이터를 가져온 시점
  refreshIntervalMinutes: number; // 사용자가 설정하는 자동 갱신 주기
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
  fetchSessions: () => Promise<void>;
  fetchSessionMessages: (id: string) => Promise<void>;
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
  downloadFile: (id: string) => Promise<void>;
  setFileError: (e: string | null) => void;
  documentImages: Record<string, DocumentImage[]>;
  ensureDocumentImages: (file: EmbeddingFile) => DocumentImage[];
  fetchDocumentImages: (file: EmbeddingFile) => Promise<void>;
  updateDocumentImage: (fileId: string, imageId: string, changes: Partial<DocumentImage>) => void;
  saveDocumentImage: (fileId: string, imageId: string, changes: Partial<DocumentImage>) => Promise<void>;
  uploadDocumentImage: (fileId: string, imageId: string, file: File, previewUrl: string) => Promise<void>;
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

interface PermissionSlice {
  userDirectory: DirectoryUser[];
  fetchUserDirectory: () => Promise<void>;
  setUserRole: (email: string, role: UserRole) => Promise<void>;
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
  updateDictEntry: (id: DictionaryEntry["id"], changes: Partial<Pick<DictionaryEntry, "term" | "synonyms">>) => void;
  saveDictEntries: () => Promise<void>;
}

interface NotificationSlice {
  notifications: AppNotification[];
  pushNotification: (message: string, opts?: { type?: NotificationType; link?: string }) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

interface ExternalApiSlice {
  externalApis: ExternalApi[];
  externalApiLoading: boolean;
  fetchExternalApis: () => Promise<void>;
  saveExternalApi: (api: Partial<ExternalApi> & { title: string; url: string; source: string; apiKey: string; refreshIntervalMinutes: number }) => Promise<void>;
  deleteExternalApi: (id: string) => Promise<void>;
  syncExternalApi: (id: string, title: string, fallbackFetchedAt: string) => Promise<void>;
}

type AppStore = ChatSlice &
  FileSlice &
  AuthSlice &
  PermissionSlice &
  UISlice &
  DictionarySlice &
  PromptSlice &
  NotificationSlice &
  ExternalApiSlice;

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
  messagesLoaded: true,
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

const USER_DIRECTORY_KEY = "app_user_directory";

const loadUserDirectory = (): DirectoryUser[] => {
  try {
    const raw = localStorage.getItem(USER_DIRECTORY_KEY);
    if (raw) return JSON.parse(raw) as DirectoryUser[];
  } catch {
    /* ignore */
  }
  return DUMMY_ACCOUNTS.map(({ id, email, name, role }) => ({
    id,
    email,
    name,
    role: role as UserRole,
  }));
};

const persistUserDirectory = (directory: DirectoryUser[]) => {
  localStorage.setItem(USER_DIRECTORY_KEY, JSON.stringify(directory));
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

  fetchSessions: async () => {
    try {
      // 목록 조회는 가벼워야 하므로 메시지 내역은 포함하지 않는다 — 실제 내역은 클릭 시 fetchSessionMessages로.
      const data = await chatService.listSessions() as {
        sessions: { sessionId: string; title?: string; createdAt?: number }[];
      };
      if (data?.sessions?.length) {
        const sessions: ChatSession[] = data.sessions.map((s) => ({
          id: s.sessionId,
          backendSessionId: s.sessionId,
          title: s.title ?? "새 대화",
          messages: [],
          createdAt: s.createdAt ?? Date.now(),
          messagesLoaded: false,
        }));
        set({ sessions, activeSessionId: sessions[0]?.id ?? null });
        persistSessions(sessions);
        persistActiveSessionId(sessions[0]?.id ?? null);
        // 화면에 바로 보이는 첫 대화는 곧바로 내역을 불러온다.
        if (sessions[0]) get().fetchSessionMessages(sessions[0].id);
      }
    } catch {
      // 서버 연결 실패 시 localStorage에 저장된 대화 목록을 그대로 사용
    }
  },

  fetchSessionMessages: async (id) => {
    const session = get().sessions.find((s) => s.id === id);
    if (!session || session.messagesLoaded || !session.backendSessionId) return;
    try {
      const data = await chatService.getSessionMessages(session.backendSessionId) as { messages: Message[] };
      set((s) => ({
        sessions: s.sessions.map((sess) =>
          sess.id === id ? { ...sess, messages: data.messages ?? [], messagesLoaded: true } : sess,
        ),
      }));
      persistSessions(get().sessions);
    } catch {
      // 서버 연결 실패 시에는 로딩 표시 없이 빈 대화로 남겨두고, 다시 클릭하면 재시도한다.
    }
  },

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
    get().fetchSessionMessages(id);
  },

  deleteSession: (id) => {
    const target = get().sessions.find((sess) => sess.id === id);
    set((s) => {
      const remaining = s.sessions.filter((sess) => sess.id !== id);
      const activeSessionId = s.activeSessionId === id ? (remaining[0]?.id ?? null) : s.activeSessionId;
      return { sessions: remaining, activeSessionId };
    });
    persistSessions(get().sessions);
    persistActiveSessionId(get().activeSessionId);
    if (target?.backendSessionId) {
      chatService.deleteSession(target.backendSessionId).catch(() => {});
    }
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
      try {
        // 타임아웃 등으로 업로드 응답을 못 받았어도 서버는 색인을 끝냈을 수 있다.
        // 목록을 다시 읽어 서버 기준으로 맞추면 tmp-id로 남는 문제가 자연스럽게 정리된다.
        // (fetchFiles()를 그대로 쓰지 않는 이유: 그건 실패 시 DUMMY_FILES로 통째로 대체해버려서,
        //  방금 성공한 업로드까지 같이 지워버릴 수 있다.)
        const files = (await fileService.listFiles()) as EmbeddingFile[];
        const uploaded = files.some((f) => f.name === file.name);
        set({ files, fileLoading: false, uploadProgress: 0, fileError: uploaded ? null : msg });
        if (uploaded) {
          toast.success(`${file.name} 업로드 완료`, { id: toastId });
          get().pushNotification(`${file.name} 업로드가 완료되었습니다.`, { type: "success", link: "/documents" });
        } else {
          toast.error(`${file.name} 업로드에 실패했습니다.`, { id: toastId });
        }
      } catch {
        // 서버 자체가 응답하지 않는 완전 오프라인 상태 — 데모를 계속 볼 수 있도록 더미 결과로 대체
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

  downloadFile: async (id) => {
    const file = get().files.find((f) => f.id === id);
    if (id.startsWith("tmp-")) {
      // 업로드 응답을 아직 못 받아 임시 id가 남아있는 상태 — 서버는 이 id를 모른다.
      toast.error("아직 업로드 처리 중인 문서입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    try {
      const data = (await fileService.downloadFile(id)) as { url: string | null };
      if (!data?.url) {
        // 색인만 되고 원본 파일이 없거나(파드 재시작 등) 사라진 경우 — 서버가 정상 응답한 것이므로
        // 서버 연결 실패와는 다른 안내를 보여준다.
        toast.error(`${file?.name ?? "파일"}의 원본 파일을 찾을 수 없습니다.`);
        return;
      }
      const a = document.createElement("a");
      a.href = resolveServerUrl(data.url);
      a.download = file?.name ?? "";
      a.click();
    } catch {
      // 더미 환경에는 원본 파일이 없어 대체할 데이터가 없으므로, 실패를 그대로 안내한다.
      toast.error(`${file?.name ?? "파일"}을 다운로드할 수 없습니다. (서버 연결 실패)`);
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

  fetchDocumentImages: async (file) => {
    // 화면이 비어 보이지 않도록 먼저 더미(혹은 캐시된) 이미지를 채워두고, 서버 응답이 오면 교체한다.
    get().ensureDocumentImages(file);
    try {
      const data = (await documentImageService.listImages(file.id)) as { images: DocumentImage[] };
      if (data?.images?.length) {
        // 설명 필드는 아직 서버에 없어 전부 null/[]로 오므로, 나머지 화면 로직이 기대하는
        // 문자열/배열 형태로 맞춰준다. imageUrl은 게이트웨이 기준 상대 경로라 절대 URL로 바꾼다.
        const images: DocumentImage[] = data.images.map((img) => ({
          ...img,
          imageUrl: resolveServerUrl(img.imageUrl ?? null) ?? undefined,
          caption: img.caption ?? "",
          aiSummary: img.aiSummary ?? "",
          keyFacts: img.keyFacts ?? [],
          keyPhrases: img.keyPhrases ?? [],
        }));
        set((s) => ({ documentImages: { ...s.documentImages, [file.id]: images } }));
      }
    } catch {
      // 서버 연결 실패 시 이미 채워둔 더미 이미지를 그대로 사용
    }
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

  saveDocumentImage: async (fileId, imageId, changes) => {
    // 낙관적으로 먼저 반영해서 화면에는 바로 저장된 것처럼 보이게 한다.
    get().updateDocumentImage(fileId, imageId, changes);
    try {
      await documentImageService.saveImage(fileId, imageId, changes);
    } catch {
      // 저장 전용 백엔드가 아직 없어도 화면에는 이미 반영되어 있으므로 조용히 무시
    }
  },

  uploadDocumentImage: async (fileId, imageId, file, previewUrl) => {
    // 낙관적으로 먼저 로컬 미리보기(blob URL)를 반영하고, 서버가 실제 URL을 주면 교체한다.
    get().updateDocumentImage(fileId, imageId, { imageUrl: previewUrl });
    try {
      const data = (await documentImageService.uploadImage(fileId, imageId, file)) as { imageUrl?: string };
      if (data?.imageUrl) {
        get().updateDocumentImage(fileId, imageId, { imageUrl: resolveServerUrl(data.imageUrl) });
      }
    } catch {
      // 이미지 교체 전용 백엔드가 아직 없어도 화면에는 이미 로컬 미리보기가 반영되어 있으므로 조용히 무시
    }
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
      const account = DUMMY_ACCOUNTS.find((a) => a.email === email && a.password === password);
      if (account) {
        // 역할은 admin이 권한 관리 화면에서 실시간으로 바꿀 수 있으므로, 저장된 계정 정보가 아니라
        // 현재 userDirectory(관리자 화면에서 수정한 최신 상태)에서 조회한다.
        const directoryEntry = get().userDirectory.find((u) => u.email === email);
        const user: AuthUser = {
          id: account.id,
          email: account.email,
          name: account.name,
          provider: account.provider,
          created_at: account.created_at,
          role: directoryEntry?.role ?? (account.role as UserRole),
        };
        const token = `dummy-token-${account.id}`;
        localStorage.setItem("auth_token", token);
        localStorage.setItem("auth_user", JSON.stringify(user));
        set({ user, token, authLoading: false, authError: null });
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

  // ── Permission (관리자 권한 관리) ──────────────────────────────────────────
  userDirectory: loadUserDirectory(),

  fetchUserDirectory: async () => {
    try {
      const data = (await adminService.listUsers()) as { users: DirectoryUser[] };
      if (data?.users) {
        set({ userDirectory: data.users });
        persistUserDirectory(data.users);
      }
    } catch {
      // 서버 연결 실패 시 이미 로드해둔 로컬/더미 목록을 그대로 사용
    }
  },

  setUserRole: async (email, role) => {
    // 낙관적으로 먼저 반영 — 관리자 화면이 서버 응답을 기다리지 않고 바로 바뀐 값을 보여준다.
    set((s) => {
      const userDirectory = s.userDirectory.map((u) => (u.email === email ? { ...u, role } : u));
      persistUserDirectory(userDirectory);
      return { userDirectory };
    });
    try {
      await adminService.setUserRole(email, role);
    } catch {
      // 서버 연결 실패 시에도 화면에는 이미 반영되어 있으므로 조용히 무시
    }
  },

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

  updateDictEntry: (id, changes) => {
    set((s) => ({
      dictEntries: s.dictEntries.map((e) =>
        e.id === id ? { ...e, ...changes, updated_at: new Date().toISOString() } : e,
      ),
    }));
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

  // ── 외부 API 등록 (정형) ───────────────────────────────────────────────────
  externalApis: DUMMY_EXTERNAL_APIS as ExternalApi[],
  externalApiLoading: false,

  fetchExternalApis: async () => {
    set({ externalApiLoading: true });
    try {
      const data = (await externalApiService.listApis()) as { apis: ExternalApi[] };
      set({ externalApis: data.apis ?? [], externalApiLoading: false });
    } catch {
      // 서버 연결 실패 시 더미 목록으로 대체
      set({ externalApis: DUMMY_EXTERNAL_APIS as ExternalApi[], externalApiLoading: false });
    }
  },

  saveExternalApi: async (api) => {
    const isEdit = !!api.id;
    const prevFetchedAt = isEdit ? get().externalApis.find((a) => a.id === api.id)?.fetchedAt : undefined;
    const successMessage = isEdit ? "API 정보를 수정했습니다." : "API를 등록했습니다.";
    try {
      const data = (await externalApiService.saveApi(api)) as { api: ExternalApi };
      const saved = data.api;
      set((s) => ({
        externalApis: isEdit
          ? s.externalApis.map((a) => (a.id === saved.id ? saved : a))
          : [saved, ...s.externalApis],
      }));
      toast.success(successMessage);
    } catch {
      // 등록/수정 전용 백엔드가 아직 없어도 화면에는 반영되도록 더미 결과로 대체
      const fallback: ExternalApi = {
        id: api.id ?? genId("ext-api"),
        title: api.title,
        url: api.url,
        source: api.source,
        apiKey: api.apiKey,
        refreshIntervalMinutes: api.refreshIntervalMinutes,
        fetchedAt: prevFetchedAt ?? new Date().toISOString(),
      };
      set((s) => ({
        externalApis: isEdit
          ? s.externalApis.map((a) => (a.id === fallback.id ? fallback : a))
          : [fallback, ...s.externalApis],
      }));
      toast.success(`${successMessage} (더미)`);
    }
    get().pushNotification(successMessage, { type: "success", link: "/external-api" });
  },

  deleteExternalApi: async (id) => {
    set((s) => ({ externalApis: s.externalApis.filter((a) => a.id !== id) }));
    try {
      await externalApiService.deleteApi(id);
    } catch {
      // 삭제 전용 백엔드가 아직 없어도 화면에는 이미 삭제 반영 — 더미 데모 특성상 복구하지 않는다
    }
    toast.success("API를 삭제했습니다.");
  },

  syncExternalApi: async (id, title, fallbackFetchedAt) => {
    let fetchedAt = fallbackFetchedAt;
    try {
      const data = (await externalApiService.syncApi(id)) as { fetchedAt: string };
      fetchedAt = data?.fetchedAt ?? fallbackFetchedAt;
    } catch {
      // 실제 재수집 백엔드가 아직 없어도 화면에는 서버 시간 기준으로 갱신된 것처럼 보여준다
    }
    set((s) => ({ externalApis: s.externalApis.map((a) => (a.id === id ? { ...a, fetchedAt } : a)) }));
    toast.success(`${title} 데이터를 새로고침했습니다.`);
    get().pushNotification(`${title} 데이터를 새로고침했습니다.`, { type: "success", link: "/external-api" });
  },
}));
