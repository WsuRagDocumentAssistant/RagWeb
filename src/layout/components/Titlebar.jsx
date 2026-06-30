import React from "react";
import { Bot, Menu } from "lucide-react";
import { useAppState } from "@/core/AppState";
import "../styles/Titlebar.css";

export default function Titlebar() {
  const toggleSidebar = useAppState((s) => s.toggleSidebar);

  return (
    <header className="titlebar">
      <button className="titlebar-menu-btn" onClick={toggleSidebar}>
        <Menu size={18} />
      </button>
      <div className="titlebar-brand">
        <Bot size={20} className="titlebar-icon" />
        <span className="titlebar-title">AI RAG Assistant</span>
      </div>
      <div className="titlebar-spacer" />
    </header>
  );
}
