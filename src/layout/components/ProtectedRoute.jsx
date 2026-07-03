import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAppState } from "@/core/AppState";
import Titlebar from "./Titlebar";
import Sidebar from "./Sidebar";
import "../styles/MainLayout.css";
import "../styles/MainContents.css";

export default function ProtectedRoute() {
  const user = useAppState((s) => s.user);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <Titlebar />
      <div className="app-body">
        <Sidebar />
        <main className="main-contents">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
