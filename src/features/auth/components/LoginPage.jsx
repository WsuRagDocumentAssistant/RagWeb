import React from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Bot, ShieldCheck } from "lucide-react";
import { useAppState } from "@/core/AppState";
import "../styles/LoginPage.css";

export default function LoginPage() {
  const user = useAppState((s) => s.user);

  const handleSSOLogin = () => {
    // TODO: 학교 SSO 인증 플로우 연동 후, 발급받은 sso_token으로
    // useAppState.getState().loginWithSSO(ssoToken) 호출
    toast.info("SSO 로그인은 준비 중입니다.");
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
      </div>
    </div>
  );
}
