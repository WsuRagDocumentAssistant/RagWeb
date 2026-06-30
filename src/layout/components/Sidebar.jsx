import React from "react";
import { MessageSquare, Files } from "lucide-react";
import { useAppState } from "@/core/AppState";
import "../styles/Sidebar.css";

const TABS = [
  { id: "chat", label: "채팅", icon: MessageSquare },
  { id: "files", label: "임베딩 파일", icon: Files },
];

export default function Sidebar() {
  const activeTab = useAppState((s) => s.activeTab);
  const setActiveTab = useAppState((s) => s.setActiveTab);
  const sidebarOpen = useAppState((s) => s.sidebarOpen);

  return (
    <aside className={["sidebar", sidebarOpen && "open"].filter(Boolean).join(" ")}>
      <nav className="sidebar-nav">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={["sidebar-tab", activeTab === id && "active"].filter(Boolean).join(" ")}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
