import React, { useEffect } from "react";
import { useAppState } from "@/core/AppState";
import Titlebar from "./Titlebar";
import Sidebar from "./Sidebar";
import MainContents from "./MainContents";
import "../styles/MainLayout.css";

export default function MainLayout() {
  const initializeAuth = useAppState((s) => s.initializeAuth);

  useEffect(() => { initializeAuth(); }, []);

  return (
    <div className="app-shell">
      <Titlebar />
      <div className="app-body">
        <Sidebar />
        <MainContents />
      </div>
    </div>
  );
}
