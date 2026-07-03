import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Bot, ShieldCheck } from "lucide-react";
import { useAppState } from "@/core/AppState";
import "../styles/LoginPage.css";

export default function LoginPage() {
  const user = useAppState((s) => s.user);
  const login = useAppState((s) => s.login);
  const register = useAppState((s) => s.register);
  const authLoading = useAppState((s) => s.authLoading);
  const authError = useAppState((s) => s.authError);

  // TEMP: SSO 연동 전까지 사용하는 임시 로그인/회원가입. SSO 연동 완료 시 이 state와 폼 전체 제거.
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSSOLogin = () => {
    // TODO: 학교 SSO 인증 플로우 연동 후, 발급받은 sso_token으로
    // useAppState.getState().loginWithSSO(ssoToken) 호출
    toast.info("SSO 로그인은 준비 중입니다.");
  };

  // TEMP: SSO 연동 전까지 사용하는 임시 로그인/회원가입 핸들러. SSO 연동 완료 시 제거.
  const handleTempSubmit = async (e) => {
    e.preventDefault();
    if (mode === "login") {
      if (!email || !password) return;
      login(email, password);
      return;
    }
    if (!email || !password || !name) return;
    try {
      await register(email, password, name);
      toast.success("회원가입 완료. 로그인해주세요.");
      setMode("login");
      setPassword("");
      setName("");
    } catch {
      // authError에 이미 반영됨
    }
  };

  if (user) return <Navigate to="/chat" replace />;

  return (
    <div className="login-page">
      <div className="login-card">
        <Bot size={40} className="login-icon" />
        <h1 className="login-title">AI RAG Assistant</h1>
        <p className="login-desc">학교 계정으로 로그인해주세요.</p>
        <button className="sso-btn" onClick={handleSSOLogin}>
          <ShieldCheck size={16} />
          학교 SSO로 로그인
        </button>

        {/* TEMP: SSO 연동 전까지 사용하는 임시 로그인/회원가입 폼. SSO 연동 완료 시 아래 전체 제거. */}
        <div className="temp-login-divider">
          <span>{mode === "login" ? "임시 로그인 (개발용)" : "임시 회원가입 (개발용)"}</span>
        </div>
        <form className="temp-login-form" onSubmit={handleTempSubmit}>
          {mode === "register" && (
            <input
              type="text"
              className="temp-login-input"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          )}
          <input
            type="email"
            className="temp-login-input"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
          <input
            type="password"
            className="temp-login-input"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          {authError && <p className="temp-login-error">{authError}</p>}
          <button type="submit" className="temp-login-btn" disabled={authLoading}>
            {authLoading ? "처리 중..." : mode === "login" ? "임시 로그인" : "임시 회원가입"}
          </button>
          <button
            type="button"
            className="temp-login-switch"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "계정이 없나요? 회원가입" : "이미 계정이 있나요? 로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
