import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useAppState } from "@/core/AppState";
import { useTutorialState } from "../TutorialAppState";
import { TUTORIAL_STEPS } from "../data/tutorialSteps";
import "../styles/TutorialOverlay.css";

const FIND_RETRY_MS = 150;
const FIND_RETRY_MAX = 20; // 최대 약 3초까지 대상 요소가 마운트되길 재시도
const RECHECK_MS = 300; // 대상이 사라졌는지(모달 닫힘 등) 주기적으로 재확인
const TOOLTIP_WIDTH = 320;
const RING_PAD = 6;

// 튜토리얼 데모용 계정 — 로그인 스텝에서 이 계정으로 화면에 값을 채워 보여주고, 실제로 로그인까지 시켜준다.
const DEMO_ACCOUNT = { email: "admin@wsu.ac.kr", password: "1234" };

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

// 관리자 전용 화면(admin/files/external-api)도 건너뛰지 않고 전부 보여준다 — 대신
// "관리자 전용" 배지를 달아서, 일반 사용자 계정에는 없는 기능임을 설명한다.
// 실제로 스텝을 순서대로 밟아보려면 admin@wsu.ac.kr / 1234 계정으로 로그인하면 된다.
export default function TutorialOverlay() {
  const active = useTutorialState((s) => s.active);
  const stepIndex = useTutorialState((s) => s.stepIndex);
  const goNext = useTutorialState((s) => s.next);
  const goPrev = useTutorialState((s) => s.prev);
  const goToStep = useTutorialState((s) => s.goToStep);
  const stop = useTutorialState((s) => s.stop);
  const finish = useTutorialState((s) => s.finish);

  const user = useAppState((s) => s.user);
  const login = useAppState((s) => s.login);
  const authLoading = useAppState((s) => s.authLoading);

  const navigate = useNavigate();
  const location = useLocation();

  const steps = TUTORIAL_STEPS;
  const step = active ? steps[stepIndex] ?? null : null;

  const [rect, setRect] = useState(null);

  // 로그인 관련 스텝을 보여줄 때, 데모 계정 값을 실제 입력창에 채워서 보여준다(시각적 데모용).
  useEffect(() => {
    if (!active || step?.route !== "/login") return;
    if (step.id === "login-email" || step.id === "login-password" || step.id === "login-submit") {
      fillReactInput(EMAIL_SELECTOR, DEMO_ACCOUNT.email);
    }
    if (step.id === "login-password" || step.id === "login-submit") {
      fillReactInput(PASSWORD_SELECTOR, DEMO_ACCOUNT.password);
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
      setRect(el ? readRect(el) : null);
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
        setRect(null);
        return;
      }
      const el = await waitForElement(step.target);
      if (cancelled) return;
      if (!el) {
        resolvedThisStep = true;
        setRect(null);
        return;
      }
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      await new Promise((r) => setTimeout(r, 220));
      if (cancelled) return;
      resolvedThisStep = true;
      setRect(readRect(el));
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

  const handlePrimary = () => {
    if (isLast) { finish(); return; }
    if (awaitingRealLogin) { login(DEMO_ACCOUNT.email, DEMO_ACCOUNT.password); return; }
    goNext();
  };

  const ringStyle = rect
    ? {
        top: rect.top - RING_PAD,
        left: rect.left - RING_PAD,
        width: rect.width + RING_PAD * 2,
        height: rect.height + RING_PAD * 2,
      }
    : null;

  const tooltipStyle = (() => {
    if (!ringStyle) return null;
    const spaceBelow = window.innerHeight - (ringStyle.top + ringStyle.height);
    const left = Math.min(Math.max(ringStyle.left, 16), window.innerWidth - TOOLTIP_WIDTH - 16);
    if (spaceBelow > 190) {
      return { top: ringStyle.top + ringStyle.height + 14, left };
    }
    return { bottom: window.innerHeight - ringStyle.top + 14, left };
  })();

  return (
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
        className={`tutorial-tooltip ${tooltipStyle ? "" : "tutorial-tooltip-center"}`}
        style={tooltipStyle ?? undefined}
      >
        <button className="tutorial-close" onClick={stop} title="튜토리얼 닫기">
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
            아래 버튼을 누르면 데모 계정({DEMO_ACCOUNT.email})으로 자동 로그인합니다.
          </p>
        )}
        <div className="tutorial-actions">
          <button className="tutorial-btn tutorial-btn-ghost" onClick={stop}>건너뛰기</button>
          <div className="tutorial-nav-btns">
            <button className="tutorial-btn tutorial-btn-outline" onClick={goPrev} disabled={isFirst}>이전</button>
            <button
              className="tutorial-btn tutorial-btn-primary"
              onClick={handlePrimary}
              disabled={awaitingRealLogin && authLoading}
            >
              {isLast ? "완료" : awaitingRealLogin ? (authLoading ? "로그인 중..." : "로그인하고 계속") : "다음"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
