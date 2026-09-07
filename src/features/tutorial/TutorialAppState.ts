import { create } from "zustand";

// 기능 설명 튜토리얼 전용 상태. 메인 AppState.ts와 분리해서 튜토리얼 진행 상태(몇 번째 스텝까지
// 봤는지)만 독립적으로 관리한다 — 그래야 사이드바에서 아무 때나 "이어보기"로 들어올 수 있다.

const STEP_KEY = "tutorial_step_index";
const DONE_KEY = "tutorial_done";
const ROLE_KEY = "tutorial_role";

export type TutorialRole = "admin" | "user";

const loadStepIndex = (): number => {
  const raw = localStorage.getItem(STEP_KEY);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const persistStepIndex = (index: number) => {
  localStorage.setItem(STEP_KEY, String(index));
};

const loadRole = (): TutorialRole => (localStorage.getItem(ROLE_KEY) === "user" ? "user" : "admin");

interface TutorialState {
  active: boolean; // 지금 화면에 오버레이가 떠 있는지
  stepIndex: number; // 마지막으로 본(혹은 보고 있는) 스텝 — 새로고침해도 유지됨
  finished: boolean; // 끝까지 완료했는지
  role: TutorialRole; // 일반 사용자 둘러보기인지 관리자 둘러보기인지 — 관리자 전용 스텝 노출 여부에 쓰임
  start: (role: TutorialRole) => void; // 처음부터 다시 시작
  resume: () => void; // 저장된 스텝부터 이어보기
  stop: () => void; // 오버레이만 닫기 (진행 상태는 그대로 저장됨)
  finish: () => void; // 마지막 스텝에서 "완료"
  next: () => void;
  prev: () => void;
  goToStep: (index: number) => void;
}

export const useTutorialState = create<TutorialState>((set, get) => ({
  active: false,
  stepIndex: loadStepIndex(),
  finished: localStorage.getItem(DONE_KEY) === "1",
  role: loadRole(),

  start: (role) => {
    localStorage.removeItem(DONE_KEY);
    localStorage.setItem(ROLE_KEY, role);
    persistStepIndex(0);
    set({ active: true, stepIndex: 0, finished: false, role });
  },

  resume: () => {
    localStorage.removeItem(DONE_KEY);
    set({ active: true, finished: false });
  },

  stop: () => set({ active: false }),

  finish: () => {
    localStorage.setItem(DONE_KEY, "1");
    set({ active: false, finished: true });
  },

  next: () => {
    const stepIndex = get().stepIndex + 1;
    persistStepIndex(stepIndex);
    set({ stepIndex });
  },

  prev: () => {
    const stepIndex = Math.max(0, get().stepIndex - 1);
    persistStepIndex(stepIndex);
    set({ stepIndex });
  },

  goToStep: (stepIndex) => {
    persistStepIndex(stepIndex);
    set({ stepIndex });
  },
}));
