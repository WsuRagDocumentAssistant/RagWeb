import React from "react";
import { Menu, LogOut } from "lucide-react";
import { useAppState } from "@/core/AppState";
import { WoosongLogo } from "@/shared";
import FileNotifications from "./FileNotifications";
import "../styles/Titlebar.css";

export default function Titlebar() {
  const logout = useAppState((s) => s.logout);
  const toggleSidebar = useAppState((s) => s.toggleSidebar);

  return (
    <header className="titlebar">
      <button className="titlebar-menu-btn mobile-only" onClick={toggleSidebar} title="메뉴">
        <Menu size={18} />
      </button>
      <div className="titlebar-brand">
        <WoosongLogo withText={false} className="titlebar-icon" />
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
