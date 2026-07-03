import React from "react";
import { Bot, LogOut } from "lucide-react";
import { useAppState } from "@/core/AppState";
import FileNotifications from "./FileNotifications";
import "../styles/Titlebar.css";

export default function Titlebar() {
  const logout = useAppState((s) => s.logout);

  return (
    <header className="titlebar">
      <div className="titlebar-brand">
        <Bot size={20} className="titlebar-icon" />
        <span className="titlebar-title">AI RAG Assistant</span>
      </div>
      <div className="titlebar-spacer" />
      <FileNotifications />
      <button className="titlebar-menu-btn" onClick={logout} title="로그아웃">
        <LogOut size={18} />
      </button>
    </header>
  );
}
