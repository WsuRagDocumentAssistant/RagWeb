import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useAppState } from "@/core/AppState";
import { useTutorialState } from "../TutorialAppState";
import { TUTORIAL_STEPS } from "../data/tutorialSteps";
import "../styles/TutorialOverlay.css";

const FIND_RETRY_MS = 150;
const FIND_RETRY_MAX = 20; // 최대 약 3초까지 대상 요소가 마운트되길 재시도
const TOOLTIP_WIDTH = 320;
const SPOTLIGHT_PAD = 8;

export default function TutorialOverlay() {
  const active = useTutorialState((s) => s.active);
  const stepIndex = useTutorialState((s) => s.stepIndex);
  const goNext = useTutorialState((s) => s.next);
  const goPrev = useTutorialState((s) => s.prev);
  const goToStep = useTutorialState((s) => s.goToStep);
  const stop = useTutorialState((s) => s.stop);
  const finish = useTutorialState((s) => s.finish);

  const user = useAppState((s) => s.user);
  const isAdmin = user?.role === "admin";

  const navigate = useNavigate();
  const location = useLocation();

  const steps = TUTORIAL_STEPS.filter((s) => !s.adminOnly || isAdmin);
  const step = active ? steps[stepIndex] ?? null : null;

  const [rect, setRect] = useState(null);
  const cancelRef = useRef(false);

  // 로그인 스텝을 보여주는 중에 사용자가 (튜토리얼 진행과 무관하게) 이미 로그인해버리면
  // 더 이상 존재하지 않는 로그인 화면 요소를 계속 찾으려 하게 되므로, 로그인 이후 첫 스텝으로 건너뛴다.
  useEffect(() => {
    if (!active || !user || !step || step.route !== "/login") return;
    const firstPostLoginIndex = steps.findIndex((s) => s.route !== "/login");
    if (firstPostLoginIndex >= 0 && firstPostLoginIndex !== stepIndex) goToStep(firstPostLoginIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, user, step?.id]);

  // 스텝이 요구하는 라우트로 자동 이동 (관리자 전용 라우트인데 권한이 없으면 시도하지 않음)
  useEffect(() => {
    if (!step?.route) return;
    if (location.pathname !== step.route) navigate(step.route);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id]);

  // 대상 요소를 찾아 위치 계산 — 라우트 이동 직후엔 아직 안 그려졌을 수 있어 재시도한다.
  useEffect(() => {
    cancelRef.current = false;
    setRect(null); // 스텝이 바뀌면 이전 스텝의 하이라이트 위치가 남아있지 않도록 즉시 지운다
    if (!step || !step.target) {
      return () => { cancelRef.current = true; };
    }
    let tries = 0;
    const tryFind = () => {
      if (cancelRef.current) return;
      const el = document.querySelector(step.target);
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        setTimeout(() => {
          if (cancelRef.current) return;
          const r = el.getBoundingClientRect();
          setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        }, 220);
        return;
      }
      tries += 1;
      if (tries < FIND_RETRY_MAX) setTimeout(tryFind, FIND_RETRY_MS);
      else setRect(null); // 못 찾으면 스포트라이트 없이 안내 문구만 가운데 표시
    };
    tryFind();
    return () => { cancelRef.current = true; };
  }, [step]);

  // 창 크기/스크롤에 맞춰 하이라이트 위치 재계산
  useEffect(() => {
    if (!step?.target) return undefined;
    const handle = () => {
      const el = document.querySelector(step.target);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    window.addEventListener("resize", handle);
    window.addEventListener("scroll", handle, true);
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle, true);
    };
  }, [step]);

  if (!step) return null;

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  const spotlightStyle = rect
    ? {
        top: rect.top - SPOTLIGHT_PAD,
        left: rect.left - SPOTLIGHT_PAD,
        width: rect.width + SPOTLIGHT_PAD * 2,
        height: rect.height + SPOTLIGHT_PAD * 2,
      }
    : null;

  const tooltipStyle = (() => {
    if (!spotlightStyle) return null;
    const spaceBelow = window.innerHeight - (spotlightStyle.top + spotlightStyle.height);
    const left = Math.min(Math.max(spotlightStyle.left, 16), window.innerWidth - TOOLTIP_WIDTH - 16);
    if (spaceBelow > 190) {
      return { top: spotlightStyle.top + spotlightStyle.height + 14, left };
    }
    return { bottom: window.innerHeight - spotlightStyle.top + 14, left };
  })();

  return (
    <div className="tutorial-root">
      {spotlightStyle ? (
        <div className="tutorial-spotlight" style={spotlightStyle} />
      ) : (
        <div className="tutorial-dim-full" />
      )}
      <div
        className={`tutorial-tooltip ${tooltipStyle ? "" : "tutorial-tooltip-center"}`}
        style={tooltipStyle ?? undefined}
      >
        <button className="tutorial-close" onClick={stop} title="튜토리얼 닫기">
          <X size={14} />
        </button>
        <span className="tutorial-step-count">{stepIndex + 1} / {steps.length}</span>
        <h3>{step.title}</h3>
        <p>{step.description}</p>
        <div className="tutorial-actions">
          <button className="tutorial-btn tutorial-btn-ghost" onClick={stop}>건너뛰기</button>
          <div className="tutorial-nav-btns">
            <button className="tutorial-btn tutorial-btn-outline" onClick={goPrev} disabled={isFirst}>이전</button>
            <button className="tutorial-btn tutorial-btn-primary" onClick={isLast ? finish : goNext}>
              {isLast ? "완료" : "다음"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
