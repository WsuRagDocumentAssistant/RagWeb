import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useAppState } from "@/core/AppState";
import { useTutorialState } from "../TutorialAppState";
import { TUTORIAL_STEPS } from "../data/tutorialSteps";
import TutorialDocumentPickerDemo from "./TutorialDocumentPickerDemo";
import TutorialImageViewerDemo from "./TutorialImageViewerDemo";
import TutorialMergeDemo from "./TutorialMergeDemo";
import "../styles/TutorialOverlay.css";

const DEMO_COMPONENTS = {
  documentPicker: TutorialDocumentPickerDemo,
  imageViewer: TutorialImageViewerDemo,
  merge: TutorialMergeDemo,
};

const FIND_RETRY_MS = 150;
const FIND_RETRY_MAX = 20; // 최대 약 3초까지 대상 요소가 마운트되길 재시도
const RECHECK_MS = 300; // 대상이 사라졌는지(모달 닫힘 등) 주기적으로 재확인
const TOOLTIP_WIDTH = 320;
const TOOLTIP_MAX_HEIGHT = 260; // 내용이 다 들어갈 만큼 넉넉히 띄워줄 때 쓰는 높이
const TOOLTIP_GAP = 14;
const VIEWPORT_MARGIN = 16;
const RING_PAD = 6;

// 로그인 스텝에서 입력창에 채워 보여주는 예시 값(로그인에 쓰지 않는다). 예전에는 실서버 데모 계정의
// 아이디·비밀번호를 코드에 넣고 그걸로 자동 로그인했다 — 화면 소스를 보면 누구나 그 계정(관리자 포함)을
// 쓸 수 있어 뺐다(보안 점검 credentials.hardcoded-tutorial-login). 이제 본인 계정으로 로그인하면 이어진다.
const SAMPLE_LOGIN = { email: "20260001", password: "samplepw" };

const EMAIL_SELECTOR = 'input[placeholder="학번/교번"]';
const PASSWORD_SELECTOR = 'input[placeholder="비밀번호"]';

function fillReactInput(selector, value) {
  const el = document.querySelector(selector);
  if (!el || el.value === value) return;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  setter.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function readRect(el) {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function sameRect(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;
}

// 로그인 화면에서 고른 역할(관리자/일반 사용자)에 따라 관리자 전용 화면(admin/files/external-api)을
// 아예 건너뛴다 — "관리자 전용" 배지는 관리자 둘러보기에서 그 스텝이 관리자만 볼 수 있는
// 화면임을 표시하는 용도로 남아 있다. 실제로 스텝을 순서대로 밟아보려면 로그인 화면의
// "기능 둘러보기"에서 역할을 선택하면 된다.
export default function TutorialOverlay() {
  const active = useTutorialState((s) => s.active);
  const stepIndex = useTutorialState((s) => s.stepIndex);
  const role = useTutorialState((s) => s.role);
  const goNext = useTutorialState((s) => s.next);
  const goPrev = useTutorialState((s) => s.prev);
  const goToStep = useTutorialState((s) => s.goToStep);
  const stop = useTutorialState((s) => s.stop);
  const finish = useTutorialState((s) => s.finish);

  const user = useAppState((s) => s.user);
  const authLoading = useAppState((s) => s.authLoading);

  const navigate = useNavigate();
  const location = useLocation();

  // 관리자 둘러보기를 골라도 로그인한 계정이 관리자가 아니면 관리자 화면은 건너뛴다(들어갈 수 없다).
  const tourRole = user && user.role !== "admin" ? "user" : role;
  const steps = useMemo(
    () => (tourRole === "user" ? TUTORIAL_STEPS.filter((s) => !s.adminOnly) : TUTORIAL_STEPS),
    [tourRole],
  );
  const step = active ? steps[stepIndex] ?? null : null;

  const [rect, setRect] = useState(null);
  const lastRectRef = useRef(null);

  // 값이 실제로 달라졌을 때만 상태를 갱신한다 — 매번 새 객체를 만들어 setRect하면
  // (좌표가 그대로여도) rect의 참조가 계속 바뀌어, rect에 의존하는 다른 effect(툴팁 위치
  // 보정 등)의 디바운스 타이머가 원인이 되어 매번 취소돼서 절대 실행되지 못하는 문제가 있다.
  const commitRect = (next) => {
    if (sameRect(lastRectRef.current, next)) return;
    lastRectRef.current = next;
    setRect(next);
  };

  // 로그인 관련 스텝을 보여줄 때, 예시 값을 입력창에 채워서 보여준다(시각적 데모용 — 로그인 버튼
  // 스텝에서는 비워서 본인 계정을 입력하게 한다).
  useEffect(() => {
    if (!active || step?.route !== "/login") return;
    if (step.id === "login-email" || step.id === "login-password") {
      fillReactInput(EMAIL_SELECTOR, SAMPLE_LOGIN.email);
    }
    if (step.id === "login-password") {
      fillReactInput(PASSWORD_SELECTOR, SAMPLE_LOGIN.password);
    }
    if (step.id === "login-submit") {
      fillReactInput(EMAIL_SELECTOR, "");
      fillReactInput(PASSWORD_SELECTOR, "");
    }
  }, [active, step?.id, step?.route]);

  // 로그인 스텝을 보여주는 중에 사용자가 (튜토리얼 진행과 무관하게) 이미 로그인해버리면
  // 더 이상 존재하지 않는 로그인 화면 요소를 계속 찾으려 하게 되므로, 로그인 이후 첫 스텝으로 건너뛴다.
  useEffect(() => {
    if (!active || !user || !step || step.route !== "/login") return;
    const firstPostLoginIndex = steps.findIndex((s) => s.route !== "/login");
    if (firstPostLoginIndex >= 0 && firstPostLoginIndex !== stepIndex) goToStep(firstPostLoginIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, user, step?.id]);

  // 스텝이 요구하는 라우트로 자동 이동
  useEffect(() => {
    if (!step?.route) return;
    if (location.pathname !== step.route) navigate(step.route);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id]);

  // 스텝에 딸린 preClick(모달을 열거나 닫는 등 사전 클릭)을 순서대로 실행한 뒤,
  // target 요소가 나타나길 재시도로 기다려 위치를 계산한다.
  // 스텝이 바뀌는 순간 rect를 바로 비우지 않는다 — 그러면 박스가 사라졌다가 다시 나타나는
  // "깜빡임"이 생긴다. 대신 이전 위치를 그대로 둔 채로 새 위치를 찾고, 찾아지면 CSS
  // transition(top/left/width/height)이 두 위치 사이를 부드럽게 이어준다.
  useEffect(() => {
    let cancelled = false;
    let resolvedThisStep = false;

    const preClicks = step?.preClick ? (Array.isArray(step.preClick) ? step.preClick : [step.preClick]) : [];

    const waitForElement = (selector) =>
      new Promise((resolve) => {
        let tries = 0;
        const tryFind = () => {
          if (cancelled) return resolve(null);
          const el = document.querySelector(selector);
          if (el) return resolve(el);
          tries += 1;
          if (tries < FIND_RETRY_MAX) setTimeout(tryFind, FIND_RETRY_MS);
          else resolve(null);
        };
        tryFind();
      });

    // 창 크기/스크롤/주기적 재확인 — 이번 스텝의 위치를 한 번이라도 찾은 뒤에만 동작한다.
    // 그 전에 동작하면 아직 못 찾은 것을 "사라졌다"고 오판해 이전 스텝의 박스까지 지워버린다.
    const recheck = () => {
      if (!resolvedThisStep || !step?.target) return;
      const el = document.querySelector(step.target);
      commitRect(el ? readRect(el) : null);
    };
    window.addEventListener("resize", recheck);
    window.addEventListener("scroll", recheck, true);
    const interval = setInterval(recheck, RECHECK_MS);

    (async () => {
      for (const selector of preClicks) {
        const el = await waitForElement(selector);
        if (cancelled) return;
        el?.click();
        await new Promise((r) => setTimeout(r, 180));
        if (cancelled) return;
      }

      if (!step || !step.target) {
        resolvedThisStep = true;
        commitRect(null);
        return;
      }
      const el = await waitForElement(step.target);
      if (cancelled) return;
      if (!el) {
        resolvedThisStep = true;
        commitRect(null);
        return;
      }
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      await new Promise((r) => setTimeout(r, 220));
      if (cancelled) return;
      resolvedThisStep = true;
      commitRect(readRect(el));
    })();

    return () => {
      cancelled = true;
      window.removeEventListener("resize", recheck);
      window.removeEventListener("scroll", recheck, true);
      clearInterval(interval);
    };
  }, [step]);

  if (!step) return null;

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;
  // 로그인 스텝의 마지막(로그인 버튼 안내)에서는 "다음"이 실제 로그인을 대신 수행해준다.
  // /chat 등은 로그인이 필요한 라우트라, 로그인 없이 그냥 다음으로 넘기면 다시 /login으로
  // 튕겨나가서 "로그인 화면에서 멈춘 것처럼" 보이는 문제가 있었다. 로그인에 성공하면 아래
  // useEffect가 감지해서 자동으로 다음 스텝으로 넘겨준다.
  const nextRoute = steps[stepIndex + 1]?.route;
  const isLoginGateStep = step.route === "/login" && nextRoute && nextRoute !== "/login";
  const awaitingRealLogin = isLoginGateStep && !user;

  // 로그인 스텝에서는 사용자가 본인 계정으로 로그인해야 이어진다(로그인되면 위 effect 가 다음 스텝으로
  // 넘긴다). 버튼은 입력창으로 안내만 한다. 본인 계정으로 들어온 것이므로 끝나도 로그아웃하지 않는다.
  const handlePrimary = () => {
    if (isLast) { finish(); return; }
    if (awaitingRealLogin) { document.querySelector(EMAIL_SELECTOR)?.focus(); return; }
    goNext();
  };

  const handleStop = () => {
    // 로그인 전(로그인 스텝 진행 중) 건너뛰면 로그인 화면이 그대로 남아있는데, 예시 값으로
    // 채워둔 입력값이 화면에 남아있지 않도록 지운다(LoginPage 자체 state라 따로 지워야 한다).
    fillReactInput(EMAIL_SELECTOR, "");
    fillReactInput(PASSWORD_SELECTOR, "");
    stop();
  };

  const ringStyle = rect
    ? {
        top: rect.top - RING_PAD,
        left: rect.left - RING_PAD,
        width: rect.width + RING_PAD * 2,
        height: rect.height + RING_PAD * 2,
      }
    : null;

  // 위/아래로 번갈아 붙이면 스텝이 바뀔 때마다 시선이 위아래로 왔다갔다 해서 어지럽다 —
  // 항상 가로 방향(왼쪽 우선, 없으면 오른쪽)으로만 붙여서 "설명을 먼저 읽고 오른쪽의
  // 대상을 본다"는 흐름을 유지한다. 세로 위치는 링의 세로 중심에 맞추되 화면 밖으로
  // 넘치지 않게 clamp한다. 대상이 화면 가로 대부분을 차지해 좌/우 어디에도 붙일 공간이
  // 없을 때만("side" 모드) 화면 왼쪽 고정 위치로 뺀다.
  const tooltipPlacement = (() => {
    if (!ringStyle) return { mode: "center" };
    const usableLeft = ringStyle.left - TOOLTIP_GAP - VIEWPORT_MARGIN;
    const usableRight = window.innerWidth - (ringStyle.left + ringStyle.width) - TOOLTIP_GAP - VIEWPORT_MARGIN;
    const idealTop = ringStyle.top + ringStyle.height / 2 - TOOLTIP_MAX_HEIGHT / 2;
    const top = Math.min(Math.max(idealTop, VIEWPORT_MARGIN), window.innerHeight - TOOLTIP_MAX_HEIGHT - VIEWPORT_MARGIN);
    if (usableLeft >= TOOLTIP_WIDTH) {
      return { mode: "anchored", style: { top, left: ringStyle.left - TOOLTIP_WIDTH - TOOLTIP_GAP } };
    }
    if (usableRight >= TOOLTIP_WIDTH) {
      return { mode: "anchored", style: { top, left: ringStyle.left + ringStyle.width + TOOLTIP_GAP } };
    }
    return { mode: "side" };
  })();
  const tooltipModeClass = tooltipPlacement.mode === "anchored" ? "" : `tutorial-tooltip-${tooltipPlacement.mode}`;

  const DemoComponent = step.demo ? DEMO_COMPONENTS[step.demo] : null;

  return (
    <>
      {DemoComponent && <DemoComponent />}
      <div className="tutorial-root">
        {ringStyle ? (
          <React.Fragment key="ring">
            <div className="tutorial-ring" style={ringStyle} />
            <span className="tutorial-pulse-dot" style={{ top: ringStyle.top - 5, left: ringStyle.left - 5 }} />
          </React.Fragment>
        ) : (
          <div key="dim" className="tutorial-dim-center" />
        )}
        <div
          key="tooltip"
          className={`tutorial-tooltip ${tooltipModeClass}`}
          style={tooltipPlacement.style}
        >
          <button className="tutorial-close" onClick={handleStop} title="둘러보기 닫기">
            <X size={14} />
          </button>
          <div className="tutorial-tooltip-head">
            <span className="tutorial-step-count">{stepIndex + 1} / {steps.length}</span>
            {step.adminOnly && <span className="tutorial-admin-badge">관리자 전용 기능</span>}
          </div>
          <h3>{step.title}</h3>
          <p>{step.description}</p>
          {awaitingRealLogin && (
            <p className="tutorial-hint">
              본인 학번/교번과 비밀번호로 로그인하면 둘러보기가 이어집니다.
            </p>
          )}
          <div className="tutorial-actions">
            <button className="tutorial-btn tutorial-btn-ghost" onClick={handleStop}>건너뛰기</button>
            <div className="tutorial-nav-btns">
              <button className="tutorial-btn tutorial-btn-outline" onClick={goPrev} disabled={isFirst}>이전</button>
              <button
                className="tutorial-btn tutorial-btn-primary"
                onClick={handlePrimary}
                disabled={awaitingRealLogin && authLoading}
              >
                {isLast ? "완료" : awaitingRealLogin ? (authLoading ? "로그인 중..." : "입력창으로 이동") : "다음"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
