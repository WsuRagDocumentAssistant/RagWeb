import React, { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAppState } from "@/core/AppState";
import Titlebar from "./Titlebar";
import "../styles/MainLayout.css";
import "../styles/MainContents.css";

export default function ProtectedRoute() {
  const user = useAppState((s) => s.user);
  const fetchFiles = useAppState((s) => s.fetchFiles);

  useEffect(() => {
    if (user) fetchFiles();
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <Titlebar />
      <main className="main-contents">
        <Outlet />
      </main>
    </div>
  );
}
