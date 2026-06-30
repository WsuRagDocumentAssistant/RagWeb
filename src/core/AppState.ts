import { create } from "zustand";
import { createApiUrl } from "@/config/ApiService";
import * as chatService from "@/features/chat/services/ChatService";
import * as fileService from "@/features/files/services/FileService";

// ─── 타입 ─────────────────────────────────────────────────────────────────────

export type AIProvider = "claude" | "gpt" | "gemini" | "local";
export type MessageRole = "user" | "assistant";
export type EmbeddingFileStatus = "uploading" | "processing" | "ready" | "error";
export type ActiveTab = "chat" | "files";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  isStreaming?: boolean;
  error?: string;
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
  id: string;
  email: string;
  username: string;
}

// ─── 슬라이스 타입 ────────────────────────────────────────────────────────────

interface ChatSlice {
  messages: Message[];
  chatLoading: boolean;
  chatError: string | null;
  sessionId: string | null;
  provider: AIProvider;
  selectedFileIds: string[];
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
  setProvider: (p: AIProvider) => void;
  toggleFileSelection: (id: string) => void;
  clearFileSelection: () => void;
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
  logout: () => void;
  setAuthError: (e: string | null) => void;
}

interface UISlice {
  activeTab: ActiveTab;
  sidebarOpen: boolean;
  setActiveTab: (tab: ActiveTab) => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

type AppStore = ChatSlice & FileSlice & AuthSlice & UISlice;

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

const genId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

// ─── AppState ─────────────────────────────────────────────────────────────────

export const useAppState = create<AppStore>((set, get) => ({
  // ── Chat ──────────────────────────────────────────────────────────────────
  messages: [],
  chatLoading: false,
  chatError: null,
  sessionId: null,
  provider: "claude",
  selectedFileIds: [],

  sendMessage: async (text) => {
    const { sessionId, provider, selectedFileIds } = get();

    const userMsg: Message = { id: genId("u"), role: "user", content: text, createdAt: Date.now() };
    const asstMsg: Message = { id: genId("a"), role: "assistant", content: "", createdAt: Date.now(), isStreaming: true };

    set((s) => ({ messages: [...s.messages, userMsg, asstMsg], chatLoading: true, chatError: null }));

    try {
      const data = await chatService.sendMessage({
        message: text,
        provider,
        sessionId: sessionId ?? undefined,
        fileIds: selectedFileIds.length > 0 ? selectedFileIds : undefined,
      });
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === asstMsg.id ? { ...m, content: data.reply, isStreaming: false } : m,
        ),
        chatLoading: false,
        sessionId: data.sessionId ?? s.sessionId,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "알 수 없는 오류";
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === asstMsg.id ? { ...m, isStreaming: false, error: msg } : m,
        ),
        chatLoading: false,
        chatError: msg,
      }));
    }
  },

  clearMessages: () => set({ messages: [], sessionId: null, chatError: null }),
  setProvider: (provider) => set({ provider }),
  toggleFileSelection: (id) =>
    set((s) => ({
      selectedFileIds: s.selectedFileIds.includes(id)
        ? s.selectedFileIds.filter((x) => x !== id)
        : [...s.selectedFileIds, id],
    })),
  clearFileSelection: () => set({ selectedFileIds: [] }),
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
      set({ fileError: err instanceof Error ? err.message : "파일 목록 조회 실패" });
    }
  },

  uploadFile: async (file: File) => {
    const tempId = genId("tmp");
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
      const res = await fetch(createApiUrl("USER", "LOGIN"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(b.message ?? `로그인 실패 (${res.status})`);
      }
      const data = await res.json() as { token: string; user: AuthUser };
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      set({ user: data.user, token: data.token, authLoading: false });
    } catch (err) {
      set({ authLoading: false, authError: err instanceof Error ? err.message : "로그인 실패" });
    }
  },

  logout: () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    set({ user: null, token: null, authError: null });
  },

  setAuthError: (authError) => set({ authError }),

  // ── UI ────────────────────────────────────────────────────────────────────
  activeTab: "chat",
  sidebarOpen: false,
  setActiveTab: (activeTab) => set({ activeTab, sidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
}));
