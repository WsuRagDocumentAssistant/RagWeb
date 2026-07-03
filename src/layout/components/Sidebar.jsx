import React from "react";
import { NavLink } from "react-router-dom";
import { MessageSquare, Files } from "lucide-react";
import { useAppState } from "@/core/AppState";
import "../styles/Sidebar.css";

const TABS = [
  { to: "/chat", label: "채팅", icon: MessageSquare },
  { to: "/files", label: "임베딩 파일", icon: Files },
];

export default function Sidebar() {
  const sidebarOpen = useAppState((s) => s.sidebarOpen);
  const closeSidebar = useAppState((s) => s.closeSidebar);

  return (
    <aside className={["sidebar", sidebarOpen && "open"].filter(Boolean).join(" ")}>
      <nav className="sidebar-nav">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={closeSidebar}
            className={({ isActive }) => ["sidebar-tab", isActive && "active"].filter(Boolean).join(" ")}
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
