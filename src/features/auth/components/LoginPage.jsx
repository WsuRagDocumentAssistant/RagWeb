import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAppState } from "@/core/AppState";
import { WoosongLogo } from "@/shared";
import { useTutorialState, TutorialRoleModal } from "@/features/tutorial";
import "../styles/LoginPage.css";

export default function LoginPage() {
  const user = useAppState((s) => s.user);
  const login = useAppState((s) => s.login);
  const authLoading = useAppState((s) => s.authLoading);
  const authError = useAppState((s) => s.authError);
  const startTutorial = useTutorialState((s) => s.start);
  const tutorialActive = useTutorialState((s) => s.active);

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const handleSelectTutorialRole = (role) => {
    setRoleModalOpen(false);
    startTutorial(role);
  };

  // 학교 계정(학번/교번 + 학교 비밀번호) 로그인. 공개 회원가입은 없앴다 — 남의 교번으로 미리 가입해
  // 그 사람 계정을 차지할 수 있었다(보안 점검 account-linking). 계정은 학교 계정으로 처음 로그인할 때
  // 서버가 만들고, 그 밖의 계정은 관리자가 만든다.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    login(email, password);
  };

  if (user) return <Navigate to="/chat" replace />;

  return (
    <div className="login-page">
      <div className="login-card">
        <WoosongLogo className="login-icon" />
        <h1 className="login-title">AI RAG Assistant</h1>
        <p className="login-desc">학교 계정으로 로그인해주세요.</p>
        <button type="button" className="login-tutorial-link" onClick={() => setRoleModalOpen(true)}>
          처음이신가요? 기능 둘러보기
        </button>
        {roleModalOpen && (
          <TutorialRoleModal onClose={() => setRoleModalOpen(false)} onSelect={handleSelectTutorialRole} />
        )}

        <div className="temp-login-divider">
          <span>로그인</span>
        </div>
        <form className="temp-login-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="temp-login-input"
            placeholder="학번/교번"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            // 둘러보기가 채우는 예시 값이 브라우저에 자동완성 후보로 남지 않도록, 둘러보기
            // 중에는 autoComplete를 꺼둔다(실제 사용자가 쓸 때는 평소대로 켜져 있음).
            autoComplete={tutorialActive ? "off" : "username"}
          />
          <input
            type="password"
            className="temp-login-input"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={tutorialActive ? "off" : "current-password"}
          />
          {authError && <p className="temp-login-error">{authError}</p>}
          <button type="submit" className="temp-login-btn" disabled={authLoading}>
            {authLoading ? "처리 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
